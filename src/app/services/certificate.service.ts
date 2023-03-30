import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Entry, TextWriter } from '@zip.js/zip.js';
import { digestJson } from '@internet-of-people/sdk-wasm';
import { SignedWitnessStatement } from '../types/statement';
import { SDKWebService } from './sdk-webservice.service';
import { CryptoValidationResult, isIntegrityOK, isSignatureValid } from '../tools/crypto';

const STATEMENT_JSON = 'signed-witness-statement.json';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  constructor(private readonly sdkWebService: SDKWebService) {}

  async validate(entries: Entry[]): Promise<CryptoValidationResult> {
    const statementEntry = CertificateService.isStatementPresent(entries);
    const statementPresent = !!statementEntry;

    if (!statementPresent) {
      return CryptoValidationResult.descriptorNotFound();
    }

    const statement = JSON.parse(await statementEntry.getData(new TextWriter())) as SignedWitnessStatement;

    const integrityOK = await isIntegrityOK(Object.values(statement.content.claim.content.files), entries);
    const signatureIsValid = isSignatureValid(statement.content, statement.signature);
    const timestampFoundOnBlockchain = await lastValueFrom(this.sdkWebService.beforeProofExists(digestJson(statement)));

    return new CryptoValidationResult(statementPresent, signatureIsValid, integrityOK, timestampFoundOnBlockchain);
  }

  async extractStatement(entries: Entry[]): Promise<SignedWitnessStatement> {
    const statementFile = entries.find((e) => e.filename === STATEMENT_JSON);
    return JSON.parse(await statementFile!.getData(new TextWriter())) as SignedWitnessStatement;
  }

  private static isStatementPresent(entries: Entry[]): Entry | undefined {
    return entries.find((e) => e.filename === STATEMENT_JSON);
  }
}
