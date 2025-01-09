import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { WalletAdapter } from '../types';

export async function signMessage(
  message: string,
  wallet?: WalletAdapter,
  keypair?: Keypair
): Promise<string> {
  const normalizedMessage = message.replace(/\n/g, '\n');
  const messageBuffer = new TextEncoder().encode(normalizedMessage);
  
  let signature: Uint8Array;

  try {
    if (wallet?.signMessage) {
      signature = await wallet.signMessage(messageBuffer);
    } else if (keypair) {
      signature = nacl.sign.detached(messageBuffer, keypair.secretKey);
    } else {
      throw new Error('No signing method available');
    }

    return bs58.encode(signature);
  } catch (error) {
    throw error;
  }
}

export function getSigner(wallet?: WalletAdapter, keypair?: Keypair): string {
  if (wallet?.publicKey) {
    return wallet.publicKey.toString();
  } else if (keypair) {
    return keypair.publicKey.toString();
  }
  throw new Error('No signer available');
}