import { HashedFile } from './statement';

export interface SignedPresentation<T> {
  content: PresentationContent<T>;
  signature: {
    bytes: string;
    publicKey: string;
  };
}

export interface PresentationAuthor {
  author: string;
  nonce: string;
}

export interface PresentationOwner {
  owner: string;
  nonce: string;
}

interface PresentationContent<T> {
  provenClaims: PresentationProvenClaim<T>[];
  licenses: PresentationLicense[];
}

interface PresentationProvenClaim<T> {
  claim: PresentationClaim<T>;
  statements: PresentationStatement[];
}

interface PresentationClaim<T> {
  content: T;
  subject: string;
}

export interface PresentationContentWithFiles<F extends HashedFile> {
  files: PresentationClaimFiles<F>;
}

interface PresentationClaimFiles<F> {
  [key: string]: string | F;
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
