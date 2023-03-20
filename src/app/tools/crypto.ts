import { MorpheusPlugin, Vault } from '@internet-of-people/sdk-wasm';
import { Crypto } from '@internet-of-people/sdk';

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
