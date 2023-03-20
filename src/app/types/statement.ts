export interface SignedWitnessStatement {
  content: StatementContent;
  signature: {
    bytes: string;
    publicKey: string;
  };
}

export interface StatementContent {
  claim: StatementClaim;
  processId: string;
  constraints: StatementClaimConstraint;
}

export interface StatementClaim {
  content: StatementClaimContent;
  subject: string;
}

export interface StatementClaimContent {
  files: ClaimFiles;
  sealer: ActorUser;
  projectId: string;
  versionId: string;
  projectName: NoncedValue;
  projectDescription: NoncedValue;
  versionDescription: NoncedValue;
}

interface StatementClaimConstraint {
  after: string;
  before: string | null;
  content: string | null;
  witness: string;
  authority: string;
}

export interface ClaimFiles {
  [key: string]: ClaimFile;
}

export interface ClaimFile {
  hash: string;
  authors: ClaimAuthors;
  owners: ClaimOwners;
  fileName: string;
  uploader: ActorUser;
}

interface ActorUser {
  accountDid: string;
  keyId: string;
}

interface NoncedAuthorName {
  nonce: string;
  author: string;
}

interface NoncedOwnerName {
  nonce: string;
  owner: string;
}

interface NoncedValue {
  nonce: string;
  value: string;
}

interface ClaimAuthors {
  [key: string]: NoncedAuthorName;
}

interface ClaimOwners {
  [key: string]: NoncedOwnerName;
}
