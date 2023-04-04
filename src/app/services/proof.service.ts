import { Injectable } from '@angular/core';
import { BlobReader, BlobWriter, Entry, TextReader, TextWriter, ZipWriter } from '@zip.js/zip.js';
import { Layer1, Layer2, Network, NetworkConfig, Types } from '@internet-of-people/sdk';
import { digestJson, selectiveDigestJson } from '@internet-of-people/sdk-wasm';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { CryptoValidationResult, isIntegrityOK, isSignatureValid, SignerContext } from '../tools/crypto';
import { SDKWebService } from './sdk-webservice.service';
import { ProofData } from '../types/common';
import { environment } from '../../environments/environment';
import { ValidatedCreateProofFormResult } from '../types/create-proof-form';
import { DateTime } from 'luxon';
import { HashedFile, SignedWitnessStatement } from '../types/schemas/common/statement';
import { findSchemaByProcessId, SchemaVersion } from '../types/schemas/schemas';
import { extractProofV1Data, SignedPresentationV1 } from '../types/schemas/v1';
import { extractProofV2Data, SignedPresentationV2 } from '../types/schemas/v2';
import { PresentationContentWithFiles, SignedPresentation } from '../types/schemas/common/presentation';
import { downloadFile } from '../tools/file';

const PRESENTATION_JSON = 'signed-presentation.json';

interface NetworkMap {
  [key: string]: Network;
}

interface ExplorerMap {
  [key: string]: string;
}

const networkMap: NetworkMap = {
  testnet: Network.Testnet,
  devnet: Network.Devnet,
  mainnet: Network.Mainnet,
};

const blockchainExplorerMap: ExplorerMap = {
  testnet: 'https://test.explorer.hydraledger.io',
  devnet: 'https://dev.explorer.hydraledger.io',
  mainnet: 'https://explorer.hydraledger.io',
};

const networkConfig = NetworkConfig.fromNetwork(networkMap[environment.hydraledgerNetwork]);

@Injectable({
  providedIn: 'root',
})
export class ProofService {
  private layer1ApiInstance: Types.Layer1.IApi | null = null;
  private layer2ApiInstance: Types.Layer2.IMorpheusApi | null = null;

  constructor(private readonly sdkWebService: SDKWebService) {}

  async createAndDownload(
    formResult: ValidatedCreateProofFormResult,
    statement: SignedWitnessStatement<unknown>,
    projectName: string,
    versionId: string,
    certificateEntries: Entry[],
    signerContext: SignerContext,
  ): Promise<void> {
    const doNotCollapsProps: string[] = [];

    for (const fileIdx of Object.keys(formResult.files)) {
      const file = formResult.files[fileIdx];

      if (!file.shareFile) {
        continue;
      }

      doNotCollapsProps.push(`.content.files.${fileIdx}.fileName`);
      doNotCollapsProps.push(`.content.files.${fileIdx}.hash`);

      Object.keys(file.authors).forEach((idx) => {
        if (file.authors[idx]) {
          doNotCollapsProps.push(`.content.files.${fileIdx}.authors.${idx}`);
        }
      });

      Object.keys(file.owners).forEach((idx) => {
        if (file.owners[idx]) {
          doNotCollapsProps.push(`.content.files.${fileIdx}.owners.${idx}`);
        }
      });

      if (file.uploader) {
        doNotCollapsProps.push(`.content.files.${fileIdx}.uploader`);
      }
    }

    if (formResult.shareProjectDescription) {
      doNotCollapsProps.push('.content.projectDescription');
    }

    if (formResult.shareProjectName) {
      doNotCollapsProps.push('.content.projectName');
    }

    if (formResult.shareVersionDescription) {
      doNotCollapsProps.push('.content.versionDescription');
    }

    if (formResult.shareVersionSealer) {
      doNotCollapsProps.push('.content.sealer');
    }

    const collapsedClaim = JSON.parse(selectiveDigestJson(statement.content.claim, doNotCollapsProps.join(',')));

    const collapsedStatement = JSON.parse(
      selectiveDigestJson(statement, ['.signature', '.content.constraints'].join(',')),
    );

    const validFrom = new Date();
    // We treat the date selected on the UI as UTC date.
    const validUntil = DateTime.fromISO(formResult.validUntil).toFormat('kkkk-LL-dd') + 'T23:59:59.999Z';

    const presentation = {
      provenClaims: [
        {
          claim: collapsedClaim,
          statements: [collapsedStatement],
        },
      ],
      licenses: [
        {
          issuedTo: signerContext.priv.personas.did(0).toString(),
          purpose: formResult.purpose,
          validFrom: validFrom.toISOString(),
          validUntil,
        },
      ],
    };

    const signedPresentation = signerContext.priv.signClaimPresentation(signerContext.keyId, presentation).toJSON();

    const signedPresentationJson = {
      content: signedPresentation.content,
      signature: signedPresentation.signature,
    };

    const zipFileWriter = new BlobWriter('application/zip');
    const zipWriter = new ZipWriter(zipFileWriter, { password: formResult.password });

    await zipWriter.add('signed-presentation.json', new TextReader(JSON.stringify(signedPresentationJson)));

    const filesToBePacked = certificateEntries.filter((entry) =>
      Object.values(formResult.files).some((f) => f.shareFile && f.fileName === entry.filename),
    );

    await Promise.all(
      filesToBePacked.map((f) =>
        f.getData(new BlobWriter()).then((data) => zipWriter.add(f.filename, new BlobReader(data))),
      ),
    );
    await zipWriter.close();
    const data = await zipFileWriter.getData();
    const a = document.createElement('a');

    a.href = window.URL.createObjectURL(data);
    a.download = `${projectName} - ${versionId}.${new Date().getTime()}.proof`;

    a.click();

    await downloadFile(data, `${projectName} - ${versionId}.${new Date().getTime()}.proof`);
  }

  async validate(entries: Entry[]): Promise<CryptoValidationResult> {
    const presentationEntry = ProofService.isPresentationPresent(entries);
    const presentationPresent = !!presentationEntry;

    if (!presentationPresent) {
      return CryptoValidationResult.descriptorNotFound();
    }

    const presentation = JSON.parse(await presentationEntry.getData(new TextWriter())) as SignedPresentation<
      PresentationContentWithFiles<any>
    >;

    const nonCollapsedClaimFiles = Object.values(presentation.content.provenClaims[0].claim.content.files)
      .filter((f) => typeof f !== 'string')
      .map((f) => f as HashedFile);
    const integrityOK = await isIntegrityOK(nonCollapsedClaimFiles, entries);
    const signatureIsValid = isSignatureValid(presentation.content, presentation.signature);
    const isNotExpired = ProofService.isNotExpired(presentation);

    const timestampFoundOnBlockchain = await lastValueFrom(
      this.sdkWebService.beforeProofExists(ProofService.extractProof(presentation)),
    );

    return new CryptoValidationResult(
      presentationPresent,
      signatureIsValid,
      integrityOK,
      timestampFoundOnBlockchain,
      isNotExpired,
    );
  }

  async extractData(entries: Entry[]): Promise<ProofData> {
    const statementFile = entries.find((e) => e.filename === PRESENTATION_JSON);
    const presentation = JSON.parse(await statementFile!.getData(new TextWriter())) as SignedPresentation<unknown>;

    const proof = ProofService.extractProof(presentation);
    const history = await this.layer2Api().getBeforeProofHistory(proof);

    if (!history.txid) {
      throw new Error(`Proof not found: ${proof}`);
    }

    const txnStatus = await (await this.layer1Api()).getTxnStatus(history.txid!);

    if (!txnStatus.isPresent()) {
      throw new Error(`Proof's txn not found at layer1: ${history.txid}`);
    }

    const existsSinceBlock = history.existsFromHeight!;
    const existsSinceBlockTime = new Date(txnStatus.get().timestamp?.human!);
    const currentBlockHeight = await (await this.layer1Api()).getCurrentHeight();
    const subjectDid = presentation.content.provenClaims[0].claim.subject;
    const proofCreatorHadManagePermission = await firstValueFrom(
      this.sdkWebService.hasRightAt(subjectDid, presentation.signature.publicKey, existsSinceBlock),
    );
    const proofCreatorHasManagePermission = await firstValueFrom(
      this.sdkWebService.hasRightAt(subjectDid, presentation.signature.publicKey, currentBlockHeight),
    );
    const blockchainTxUrl = `${blockchainExplorerMap[environment.hydraledgerNetwork]}/transaction/${history.txid}`;
    const schemaVersion = findSchemaByProcessId(presentation.content.provenClaims[0].statements[0].content.processId);

    switch (schemaVersion) {
      case SchemaVersion.V1:
        return extractProofV1Data(
          presentation as SignedPresentationV1,
          existsSinceBlock,
          existsSinceBlockTime,
          currentBlockHeight,
          proofCreatorHasManagePermission,
          proofCreatorHadManagePermission,
          blockchainTxUrl,
        );
      case SchemaVersion.V2:
        return extractProofV2Data(
          presentation as SignedPresentationV2,
          existsSinceBlock,
          existsSinceBlockTime,
          currentBlockHeight,
          proofCreatorHasManagePermission,
          proofCreatorHadManagePermission,
          blockchainTxUrl,
        );
      default:
        throw new Error(`Not handled schema version: ${schemaVersion}`);
    }
  }

  private static extractProof(presentation: SignedPresentation<any>): string {
    return digestJson(presentation.content.provenClaims[0].statements[0]);
  }

  private static isPresentationPresent(entries: Entry[]): Entry | undefined {
    return entries.find((e) => e.filename === PRESENTATION_JSON);
  }

  private static isNotExpired(presentation: SignedPresentation<any>): boolean {
    const validUntil = new Date(presentation.content.licenses[0].validUntil);
    return validUntil >= new Date();
  }

  private async layer1Api() {
    if (this.layer1ApiInstance === null) {
      this.layer1ApiInstance = await Layer1.createApi(networkConfig);
    }
    return this.layer1ApiInstance;
  }

  private layer2Api(): Types.Layer2.IMorpheusApi {
    if (this.layer2ApiInstance === null) {
      this.layer2ApiInstance = Layer2.createMorpheusApi(networkConfig);
    }
    return this.layer2ApiInstance;
  }
}
