import { Injectable } from '@angular/core';
import { Entry, TextWriter } from '@zip.js/zip.js';
import { Layer1, Layer2, Network, NetworkConfig, Types } from '@internet-of-people/sdk';
import { digestJson, PublicKey, KeyId } from '@internet-of-people/sdk-wasm';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import {
  PresentationAuthor,
  PresentationClaimFile,
  PresentationOwner,
  SignedPresentation,
} from '../types/presentation';
import { CryptoValidationResult, isIntegrityOK, isSignatureValid } from '../tools/crypto';
import { SDKWebService } from './sdk-webservice.service';
import { ActorUser } from '../types/common';

const PRESENTATION_JSON = 'signed-presentation.json';

export interface ProofData {
  processId: string;
  existsSinceBlock: number;
  existsSinceBlockTime: Date;
  currentBlockHeight: number;
  purpose: string;
  validFrom: Date;
  validUntil: Date;
  sealedBy: null | ActorUser;
  sealedByProofCreator: null | boolean;
  projectId: string;
  projectName: null | string;
  projectDescription: null | string;
  versionId: string;
  versionDescription: null | string;
  proofCreatorHasManagePermission: boolean;
  proofCreatorHadManagePermission: boolean;
  blockchainTxUrl: string;
  files: {
    name: string;
    uploader: null | ActorUser;
    authors: null | string[];
    owners: null | string[];
  }[];
}

interface NetworkMap {
  [key: string]: Network;
}

const networkMap: NetworkMap = {
  testnet: Network.Testnet,
  devnet: Network.Devnet,
  mainnet: Network.Mainnet,
};
const networkConfig = NetworkConfig.fromNetwork(
  networkMap['devnet'], // TODO from config
);

@Injectable({
  providedIn: 'root',
})
export class ProofService {
  private layer1ApiInstance: Types.Layer1.IApi | null = null;
  private layer2ApiInstance: Types.Layer2.IMorpheusApi | null = null;

  constructor(private readonly sdkWebService: SDKWebService) {}

  async validate(entries: Entry[]): Promise<CryptoValidationResult> {
    const presentationEntry = ProofService.isPresentationPresent(entries);
    const presentationPresent = !!presentationEntry;

    if (!presentationPresent) {
      return CryptoValidationResult.descriptorNotFound();
    }

    const presentation = JSON.parse(await presentationEntry.getData(new TextWriter())) as SignedPresentation;

    const nonCollapsedClaimFiles = Object.values(presentation.content.provenClaims[0].claim.content.files)
      .filter((f) => typeof f !== 'string')
      .map((f) => f as PresentationClaimFile);
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

  async getProofData(presentation: SignedPresentation): Promise<ProofData> {
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

    const license = presentation.content.licenses[0];
    const statement = presentation.content.provenClaims[0].statements[0].content;
    const claim = presentation.content.provenClaims[0].claim.content;
    const subjectDid = presentation.content.provenClaims[0].claim.subject;
    const proofCreatorHadManagePermission = await firstValueFrom(
      this.sdkWebService.hasRightAt(subjectDid, presentation.signature.publicKey, existsSinceBlock),
    );
    const proofCreatorHasManagePermission = await firstValueFrom(
      this.sdkWebService.hasRightAt(subjectDid, presentation.signature.publicKey, currentBlockHeight),
    );

    const files = Object.values(claim.files)
      .filter((f) => typeof f !== 'string')
      .map((f) => {
        const file = f as PresentationClaimFile;
        return {
          name: file.fileName,
          uploader: typeof file.uploader === 'string' ? null : file.uploader,
          owners:
            typeof file.owners === 'string'
              ? null
              : Object.values(file.owners).map((o) => (o as PresentationOwner).owner),
          authors:
            typeof file.authors === 'string'
              ? null
              : Object.values(file.authors).map((o) => (o as PresentationAuthor).author),
        };
      });

    return {
      processId: statement.processId,
      existsSinceBlock,
      existsSinceBlockTime,
      currentBlockHeight,
      purpose: license.purpose,
      validFrom: new Date(license.validFrom),
      validUntil: new Date(license.validUntil),
      sealedBy: typeof claim.sealer === 'string' ? null : claim.sealer,
      sealedByProofCreator:
        typeof claim.sealer === 'string'
          ? null
          : new PublicKey(presentation.signature.publicKey).validateId(new KeyId(claim.sealer.keyId)),
      projectId: claim.projectId,
      projectName: typeof claim.projectName === 'string' ? null : claim.projectName.value,
      projectDescription: typeof claim.projectDescription === 'string' ? null : claim.projectDescription.value,
      versionId: claim.versionId,
      versionDescription: typeof claim.versionDescription === 'string' ? null : claim.versionDescription.value,
      proofCreatorHasManagePermission,
      proofCreatorHadManagePermission,
      blockchainTxUrl: `https://dev.explorer.hydraledger.io/transaction/${history.txid}`,
      files,
    };
  }

  async extractPresentation(entries: Entry[]): Promise<SignedPresentation> {
    const statementFile = entries.find((e) => e.filename === PRESENTATION_JSON);
    return JSON.parse(await statementFile!.getData(new TextWriter())) as SignedPresentation;
  }

  private static extractProof(presentation: SignedPresentation): string {
    return digestJson(presentation.content.provenClaims[0].statements[0]);
  }

  private static isPresentationPresent(entries: Entry[]): Entry | undefined {
    return entries.find((e) => e.filename === PRESENTATION_JSON);
  }

  private static isNotExpired(presentation: SignedPresentation): boolean {
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
