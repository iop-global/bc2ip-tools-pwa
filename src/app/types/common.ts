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
