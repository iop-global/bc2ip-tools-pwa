import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Entry, TextWriter, Uint8ArrayWriter } from '@zip.js/zip.js';
import { Types } from '@internet-of-people/sdk';
import { digestJson } from '@internet-of-people/sdk-wasm';
import { blake2b } from 'hash-wasm';
import { ClaimRoot, ClaimFiles, ClaimFile } from '../types/statement';
import { SDKWebService } from './sdk-webservice.service';

export class CertificateValidationResult {
  constructor(
    readonly certificateIntegrityOK: boolean,
    readonly signaturePresent: boolean,
    readonly signatureValid: boolean,
    readonly timestampFoundOnBlockchain: boolean
  ) {}

  isValid(): boolean {
    return (
      this.certificateIntegrityOK &&
      this.signaturePresent &&
      this.signatureValid &&
      this.timestampFoundOnBlockchain
    );
  }
}

const STATEMENT_JSON = 'signed-witness-statement.json';

@Injectable({
  providedIn: 'root',
})
export class CertificateServiceService {
  constructor(private readonly sdkWebService: SDKWebService) {}

  async validate(entries: Entry[]): Promise<CertificateValidationResult> {
    const statementFile = entries.find((e) => e.filename === STATEMENT_JSON);
    const statementFound = !!statementFile;

    if (!statementFound) {
      return new CertificateValidationResult(false, false, false, false);
    }

    const statement = JSON.parse(await statementFile.getData(new TextWriter()));
    const claimFiles = await this.extractClaimFiles(statement);
    const signatureValid = await this.isStatementValid(
      claimFiles,
      entries.length
    );
    const certificateIntegrityOK = await this.areHashesValid(
      claimFiles,
      entries
    );

    const timestampFoundOnBlockchain = await lastValueFrom(
      this.sdkWebService.beforeProofExists(digestJson(statement))
    );

    return new CertificateValidationResult(
      certificateIntegrityOK,
      true,
      signatureValid,
      timestampFoundOnBlockchain
    );
  }

  private async areHashesValid(
    claimFiles: ClaimFiles,
    entries: Entry[]
  ): Promise<boolean> {
    const claims = Object.values(claimFiles);
    const validations = await Promise.all(
      claims.map((c) => this.compareClaimFileWithZipEntries(c, entries))
    );
    return validations.filter((valid) => valid === false).length === 0;
  }

  private async extractClaimFiles(statement: any): Promise<ClaimFiles> {
    const claim = (statement.content as Types.Sdk.IWitnessStatement)
      .claim as any as ClaimRoot;

    const claimFiles = claim.content.files;
    return claimFiles;
  }

  private async isStatementValid(
    claimFiles: any,
    numberOfEntries: number
  ): Promise<boolean> {
    // check if it has the same amount of file
    if (Object.keys(claimFiles).length !== numberOfEntries - 1) {
      return false;
    }

    return true;
  }

  private async compareClaimFileWithZipEntries(
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
