export interface SignedWitnessStatement<T> {
  content: StatementContent<T>;
  signature: {
    bytes: string;
    publicKey: string;
  };
}

export interface StatementContent<T> {
  claim: StatementClaim<T>;
  processId: string;
  constraints: StatementClaimConstraint;
}

export interface HashedFile {
  hash: string;
  fileName: string;
}

interface StatementClaim<T> {
  content: T;
  subject: string;
}

interface StatementClaimConstraint {
  after: string;
  before: string | null;
  content: string | null;
  witness: string;
  authority: string;
}
