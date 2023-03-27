import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Entry, TextWriter, Uint8ArrayWriter } from '@zip.js/zip.js';
import {
  digestJson,
  PublicKey,
  Signature,
  SignedJson,
} from '@internet-of-people/sdk-wasm';
import { blake2b } from 'hash-wasm';
import { ClaimFile, SignedWitnessStatement } from '../types/statement';
import { SDKWebService } from './sdk-webservice.service';

const STATEMENT_JSON = 'signed-witness-statement.json';

export class CertificateValidationResult {
  constructor(
    readonly statementPresent: boolean,
    readonly signatureIsValid: boolean,
    readonly certificateIntegrityOK: boolean,
    readonly timestampFoundOnBlockchain: boolean
  ) {}

  isValid(): boolean {
    return (
      this.statementPresent &&
      this.signatureIsValid &&
      this.certificateIntegrityOK &&
      this.timestampFoundOnBlockchain
    );
  }

  static statementNotFound(): CertificateValidationResult {
    return new CertificateValidationResult(false, false, false, false);
  }
}

@Injectable({
  providedIn: 'root',
})
export class CertificateServiceService {
  constructor(private readonly sdkWebService: SDKWebService) {}

  async validate(entries: Entry[]): Promise<CertificateValidationResult> {
    const statementEntry =
      CertificateServiceService.isStatementPresent(entries);
    const statementPresent = !!statementEntry;

    if (!statementPresent) {
      return CertificateValidationResult.statementNotFound();
    }

    const statement = JSON.parse(
      await statementEntry.getData(new TextWriter())
    ) as SignedWitnessStatement;

    const integrityOK = await CertificateServiceService.isIntegrityOK(
      statement,
      entries
    );
    const signatureIsValid =
      CertificateServiceService.isSignatureValid(statement);
    const timestampFoundOnBlockchain = await lastValueFrom(
      this.sdkWebService.beforeProofExists(digestJson(statement))
    );

    return new CertificateValidationResult(
      statementPresent,
      signatureIsValid,
      integrityOK,
      timestampFoundOnBlockchain
    );
  }

  async extractStatement(entries: Entry[]): Promise<SignedWitnessStatement> {
    const statementFile = entries.find((e) => e.filename === STATEMENT_JSON);
    return JSON.parse(
      await statementFile!.getData(new TextWriter())
    ) as SignedWitnessStatement;
  }

  private static async isIntegrityOK(
    statement: SignedWitnessStatement,
    entries: Entry[]
  ): Promise<boolean> {
    try {
      const claimFiles = statement.content.claim.content.files;
      const sameAmountOfFiles =
        Object.keys(claimFiles).length === entries.length - 1;

      const claims = Object.values(claimFiles);
      const validations = await Promise.all(
        claims.map((c) => this.compareClaimFileWithZipEntries(c, entries))
      );

      const allHashesAreValid =
        validations.filter((valid) => valid === false).length === 0;

      return allHashesAreValid && sameAmountOfFiles;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }

  private static isSignatureValid(statement: SignedWitnessStatement): boolean {
    try {
      const signedBytes = new SignedJson(
        new PublicKey(statement.signature.publicKey),
        statement.content,
        new Signature(statement.signature.bytes)
      );
      return signedBytes.validate();
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }

  private static isStatementPresent(entries: Entry[]): Entry | undefined {
    return entries.find((e) => e.filename === STATEMENT_JSON);
  }

  private static async compareClaimFileWithZipEntries(
    claim: ClaimFile,
    entries: Entry[]
  ): Promise<boolean> {
    const zipEntry = entries.find((e) => e.filename === claim.fileName);
    if (!zipEntry) {
      return false;
    }

    const zipEntryContent = await zipEntry.getData(new Uint8ArrayWriter());
    const zipEntryHash = await blake2b(zipEntryContent);
    return zipEntryHash === claim.hash;
  }
}
