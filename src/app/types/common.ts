export interface ActorUser {
  accountDid: string;
  keyId: string;
}

export interface NoncedAuthorName {
  nonce: string;
  author: string;
}

export interface NoncedOwnerName {
  nonce: string;
  owner: string;
}

export interface NoncedValue {
  nonce: string;
  value: string;
}

export interface ClaimAuthors {
  [key: string]: NoncedAuthorName;
}

export interface ClaimOwners {
  [key: string]: NoncedOwnerName;
}

export interface CertificateData {
  somePartsOfTheDataIsNotMaskable: boolean;
  schemaVersion: number;
  schemaProcessId: string;
  projectName: string;
  projectDescription: string;
  versionId: string;
  versionDescription: string;
  sealer: {
    did: string;
    keyId: string;
  };
  files: {
    index: string;
    name: string;
    uploader: { did: string; keyId: string };
    authors: { index: string; name: string }[];
    owners: { index: string; name: string }[];
  }[];
}

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
