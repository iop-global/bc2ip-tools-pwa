import { KeyId, PublicKey } from '@internet-of-people/sdk-wasm';
import { ActorUser, NoncedValue, ClaimAuthors, ClaimOwners, CertificateData, ProofData } from '../common';
import {
  PresentationAuthor,
  PresentationContentWithFiles,
  PresentationOwner,
  SignedPresentation,
} from './common/presentation';
import { HashedFile, SignedWitnessStatement } from './common/statement';

export const extractProofV2Data = (
  presentation: SignedPresentationV2,
  existsSinceBlock: number,
  existsSinceBlockTime: Date,
  currentBlockHeight: number,
  proofCreatorHasManagePermission: boolean,
  proofCreatorHadManagePermission: boolean,
  blockchainTxUrl: string,
): ProofData => {
  const license = presentation.content.licenses[0];
  const statement = presentation.content.provenClaims[0].statements[0].content;
  const claim = presentation.content.provenClaims[0].claim.content;

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
    blockchainTxUrl,
    files,
  };
};

export const extractCertificateV2Data = (statement: SignedWitnessStatementV2): CertificateData => {
  const claimContent = statement.content.claim.content;

  return {
    somePartsOfTheDataIsNotMaskable: false,
    schemaVersion: 2,
    schemaProcessId: statement.content.processId,
    projectName: claimContent.projectName.value,
    projectDescription: claimContent.projectDescription.value,
    versionId: claimContent.versionId,
    versionDescription: claimContent.versionDescription.value,
    sealer: {
      did: claimContent.sealer.accountDid,
      keyId: claimContent.sealer.keyId,
    },
    files: Object.keys(claimContent.files).map((fileIndex) => {
      const file = claimContent.files[fileIndex];
      return {
        index: fileIndex,
        name: file.fileName,
        uploader: {
          did: file.uploader.accountDid,
          keyId: file.uploader.keyId,
        },
        authors: Object.keys(file.authors).map((authorIndex) => {
          const author = file.authors[authorIndex];
          return {
            index: authorIndex,
            name: author.author,
          };
        }),
        owners: Object.keys(file.owners).map((ownerIndex) => {
          const owner = file.owners[ownerIndex];
          return {
            index: ownerIndex,
            name: owner.owner,
          };
        }),
      };
    }),
  };
};

// STATEMENT

export interface SignedWitnessStatementV2 extends SignedWitnessStatement<StatementV2ClaimContent> {}

interface StatementV2ClaimContent {
  files: ClaimFiles;
  sealer: ActorUser;
  projectId: string;
  versionId: string;
  projectName: NoncedValue;
  projectDescription: NoncedValue;
  versionDescription: NoncedValue;
}

interface ClaimFiles {
  [key: string]: ClaimFileV2;
}

export interface ClaimFileV2 extends HashedFile {
  authors: ClaimAuthors;
  owners: ClaimOwners;
  uploader: ActorUser;
}

// PRESENTATION

export interface SignedPresentationV2 extends SignedPresentation<PresentationClaimContentV2> {}

export interface PresentationClaimContentV2 extends PresentationContentWithFiles<PresentationClaimFile> {
  projectId: string;
  projectName: string | NoncedValue;
  projectDescription: string | NoncedValue;
  sealer: string | ActorUser;
  versionId: string;
  versionDescription: string | NoncedValue;
}

interface PresentationClaimFile extends HashedFile {
  authors: string | PresentationAuthors;
  owners: string | PresentationOwners;
  uploader: string | ActorUser;
}

interface PresentationAuthors {
  [key: string]: string | PresentationAuthor;
}

interface PresentationOwners {
  [key: string]: string | PresentationOwner;
}
