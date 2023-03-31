import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Entry, TextWriter } from '@zip.js/zip.js';
import { digestJson } from '@internet-of-people/sdk-wasm';
import { SDKWebService } from './sdk-webservice.service';
import { CryptoValidationResult, isIntegrityOK, isSignatureValid } from '../tools/crypto';
import { findSchemaByProcessId, SchemaVersion } from '../types/schemas/schemas';
import { CertificateData } from '../types/common';
import { extractCertificateV1Data, SignedWitnessStatementV1 } from '../types/schemas/v1';
import { extractCertificateV2Data, SignedWitnessStatementV2 } from '../types/schemas/v2';
import { SignedWitnessStatement } from '../types/schemas/common/statement';
import { FormGroup } from '@angular/forms';

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

    const statement = JSON.parse(await statementEntry.getData(new TextWriter()));

    const integrityOK = await isIntegrityOK(Object.values(statement.content?.claim?.content?.files), entries);
    const signatureIsValid = isSignatureValid(statement.content, statement.signature);
    const timestampFoundOnBlockchain = await lastValueFrom(this.sdkWebService.beforeProofExists(digestJson(statement)));

    return new CryptoValidationResult(statementPresent, signatureIsValid, integrityOK, timestampFoundOnBlockchain);
  }

  async extractData(entries: Entry[]): Promise<{ data: CertificateData; statement: SignedWitnessStatement<unknown> }> {
    const statementFile = entries.find((e) => e.filename === STATEMENT_JSON);
    const statementJson = JSON.parse(await statementFile!.getData(new TextWriter()));
    const statement = statementJson as SignedWitnessStatement<unknown>;

    const processId = statementJson.content.processId;
    const schemaVersion = findSchemaByProcessId(processId);

    switch (schemaVersion) {
      case SchemaVersion.V1:
        return { data: extractCertificateV1Data(statementJson as SignedWitnessStatementV1), statement };
      case SchemaVersion.V2:
        return { data: extractCertificateV2Data(statementJson as SignedWitnessStatementV2), statement };
      default:
        throw new Error(`Not handled schema version: ${schemaVersion}`);
    }
  }

  adjustFormToSchema(form: FormGroup<any>, schemaVersion: number): void {
    switch (schemaVersion) {
      case SchemaVersion.V1:
        form.get('shareProjectName')?.disable();
        form.get('shareProjectDescription')?.disable();
        form.get('shareVersionDescription')?.disable();
        break;
      case SchemaVersion.V2:
        break;
      default:
        throw new Error(`Not handled schema version: ${schemaVersion}`);
    }
  }

  private static isStatementPresent(entries: Entry[]): Entry | undefined {
    return entries.find((e) => e.filename === STATEMENT_JSON);
  }
}
