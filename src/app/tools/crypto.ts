import { MorpheusPlugin, Vault } from '@internet-of-people/sdk-wasm';
import { Crypto } from '@internet-of-people/sdk';
import { PublicKey, Signature, SignedJson } from '@internet-of-people/sdk-wasm';
import { ClaimFile } from '../types/statement';
import { Entry, Uint8ArrayWriter } from '@zip.js/zip.js';
import { PresentationClaimFile } from '../types/presentation';
import { blake2b } from 'hash-wasm';

export interface SignerContext {
  priv: Crypto.MorpheusPrivate;
  keyId: Crypto.KeyId;
}

export const tryUnlockCredential = async (
  credential: Blob,
  password: string
): Promise<boolean> => {
  const vault = Vault.load(JSON.parse(await credential.text()));
  try {
    MorpheusPlugin.init(vault, password);
  } catch (e) {
    if (
      typeof e === 'string' &&
      (e as string).includes('Ciphertext was tampered with')
    ) {
      return false;
    }
  }

  const morpheusPlugin = MorpheusPlugin.get(vault);
  let keyId: Crypto.KeyId | null = null;

  try {
    keyId = morpheusPlugin.pub.personas.key(0).keyId();
  } catch (e) {
    return false;
  }

  return true;
};

export const getSignerFromCredential = async (
  credential: Blob,
  password: string
): Promise<SignerContext> => {
  const vault = Vault.load(JSON.parse(await credential.text()));
  try {
    MorpheusPlugin.init(vault, password);
  } catch (e: any) {
    if (
      typeof e === 'string' &&
      (e as string).includes('Ciphertext was tampered with')
    ) {
      throw e;
    }
    // otherwise nothing todo if it was already initiated
  }
  const morpheusPlugin = MorpheusPlugin.get(vault);
  const keyId = morpheusPlugin.pub.personas.key(0).keyId();
  return { priv: morpheusPlugin.priv(password), keyId };
};

export const isSignatureValid = (
  content: any,
  signature: {
    bytes: string;
    publicKey: string;
  }
): boolean => {
  try {
    const signedBytes = new SignedJson(
      new PublicKey(signature.publicKey),
      content,
      new Signature(signature.bytes)
    );
    return signedBytes.validate();
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

export const isIntegrityOK = async (
  claimFiles: PresentationClaimFile[] | ClaimFile[],
  entries: Entry[]
): Promise<boolean> => {
  try {
    const sameAmountOfFiles =
      Object.keys(claimFiles).length === entries.length - 1;

    const validations = await Promise.all(
      claimFiles.map((c) => compareClaimFileWithZipEntries(c, entries))
    );

    const allHashesAreValid =
      validations.filter((valid) => valid === false).length === 0;

    return allHashesAreValid && sameAmountOfFiles;
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

const compareClaimFileWithZipEntries = async (
  claim: PresentationClaimFile | ClaimFile,
  entries: Entry[]
): Promise<boolean> => {
  const zipEntry = entries.find((e) => e.filename === claim.fileName);
  if (!zipEntry) {
    return false;
  }

  const zipEntryContent = await zipEntry.getData(new Uint8ArrayWriter());
  const zipEntryHash = await blake2b(zipEntryContent);
  return zipEntryHash === claim.hash;
};

export class CryptoValidationResult {
  constructor(
    readonly cryptoDescriptorPresent: boolean,
    readonly signatureIsValid: boolean,
    readonly integrityOK: boolean,
    readonly timestampFoundOnBlockchain: boolean,
    readonly notExpired?: boolean
  ) {}

  static descriptorNotFound(): CryptoValidationResult {
    return new CryptoValidationResult(false, false, false, false);
  }

  isValid(): boolean {
    return (
      this.cryptoDescriptorPresent &&
      this.signatureIsValid &&
      this.integrityOK &&
      this.timestampFoundOnBlockchain &&
      (this.notExpired ?? true)
    );
  }
}
