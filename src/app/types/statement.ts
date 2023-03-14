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
  [key: string]: string | NoncedAuthorName;
}

interface ClaimOwners {
  [key: string]: string | NoncedOwnerName;
}

interface ClaimConstraint {
  after: string;
  before: string | null;
  content: string | null;
  witness: string;
  authority: string;
}

interface ClaimContent {
  files: ClaimFiles;
  sealer: ActorUser;
  projectId: string;
  versionId: string;
  projectName: string | NoncedValue;
  projectDescription: string | NoncedValue;
  versionDescription: string | NoncedValue;
}

export interface ClaimRoot {
  content: ClaimContent;
  processId: string;
  constraints: ClaimConstraint;
}

export interface ClaimFile {
  hash: string;
  authors: ClaimAuthors;
  owners: ClaimOwners;
  fileName: string;
  uploader: ActorUser;
}

export interface ClaimFiles {
  [key: string]: ClaimFile;
}
