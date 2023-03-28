import { ActorUser, NoncedValue } from './common';

export interface SignedPresentation {
  content: PresentationContent;
  signature: {
    bytes: string;
    publicKey: string;
  };
}

interface PresentationContent {
  provenClaims: PresentationProvenClaim[];
  licenses: PresentationLicense[];
}

interface PresentationProvenClaim {
  claim: PresentationClaim;
  statements: PresentationStatement[];
}

interface PresentationClaim {
  content: PresentationClaimContent;
  subject: string;
}

interface PresentationClaimContent {
  files: PresentationClaimFiles;
  projectId: string;
  projectName: string | NoncedValue;
  projectDescription: string | NoncedValue;
  sealer: string | ActorUser;
  versionId: string;
  versionDescription: string | NoncedValue;
}

interface PresentationClaimFiles {
  [key: string]: string | PresentationClaimFile;
}

export interface PresentationClaimFile {
  authors: string | PresentationAuthors;
  fileName: string;
  hash: string;
  owners: string | PresentationOwners;
  uploader: string | ActorUser;
}

interface PresentationAuthors {
  [key: string]: string | PresentationAuthor;
}

interface PresentationOwners {
  [key: string]: string | PresentationOwner;
}

export interface PresentationAuthor {
  author: string;
  nonce: string;
}

export interface PresentationOwner {
  owner: string;
  nonce: string;
}

interface PresentationStatement {
  content: {
    claim: string;
    constraints: PresentationStatementConstraint[];
    processId: string;
  };
  signature: {
    bytes: string;
    publicKey: string;
  };
}

interface PresentationStatementConstraint {
  after: string;
  authority: string;
  before: string | null;
  content: any | null;
  witness: string;
}

interface PresentationLicense {
  issuedTo: string;
  purpose: string;
  validFrom: string;
  validUntil: string;
}
