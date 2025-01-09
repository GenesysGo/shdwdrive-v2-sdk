import { Keypair } from '@solana/web3.js';
import { signMessage, getSigner } from '../utils/signing';
import { uploadSmallFile, uploadLargeFile } from '../methods/upload';
import { deleteFile } from '../methods/delete';
import { listFiles } from '../methods/list';
import { getBucketUsage } from '../methods/bucket';
import { CHUNK_SIZE, DEFAULT_ENDPOINT } from '../utils/constants';
import type { ShdwDriveConfig, WalletAdapter, FileUploadProgress } from '../types';


interface BucketUsageResponse {
  bucket: string;
  storage_used: number;
}

interface ListFilesResponse {
  objects: Array<{
    key: string;
    size: number;
    lastModified: string;
  }>;
}

export class ShdwDriveSDK {
  private endpoint: string;
  private wallet?: WalletAdapter;
  private keypair?: Keypair;

  constructor(
    config: Partial<ShdwDriveConfig> = {},
    auth: { wallet: WalletAdapter } | { keypair: Keypair }
  ) {
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
    if ('wallet' in auth) {
      this.wallet = auth.wallet;
    } else {
      this.keypair = auth.keypair;
    }
  }

  private async signMessage(message: string): Promise<string> {
    return signMessage(message, this.wallet, this.keypair);
  }

  private getSigner(): string {
    return getSigner(this.wallet, this.keypair);
  }

  async uploadFile(
    bucket: string,
    file: File,
    options: {
      onProgress?: (progress: FileUploadProgress) => void;
    } = {}
  ): Promise<{ finalized_location: string }> {
    const { onProgress } = options;
    const updateProgress = (progress: number) => {
      onProgress?.({
        status: 'uploading',
        progress,
      });
    };
  
    try {
      const uploadConfig = {
        endpoint: this.endpoint,
        bucket,
        file,
        getSigner: () => this.getSigner(),
        signMessage: (m: string) => this.signMessage(m),
        onProgress: updateProgress
      };
  
      if (file.size <= CHUNK_SIZE) {
        console.log('Starting regular file upload...');
        return await uploadSmallFile(uploadConfig);
      } else {
        console.log('File size > 5MB, initiating multipart upload...');
        return await uploadLargeFile(uploadConfig);
      }
    } catch (error) {
      onProgress?.({
        status: 'error',
        progress: 0,
      });
      throw error;
    }
  }

  async deleteFile(
    bucket: string, 
    fileUrl: string
  ): Promise<{ message: string; success: boolean }> {
    return deleteFile({
      endpoint: this.endpoint,
      bucket,
      fileUrl,
      getSigner: () => this.getSigner(),
      signMessage: (m) => this.signMessage(m)
    });
  }

  async listFiles(bucket: string): Promise<ListFilesResponse['objects']> {
    return listFiles({
      endpoint: this.endpoint,
      bucket,
      getSigner: () => this.getSigner()
    });
  }

  async getBucketUsage(bucket: string): Promise<BucketUsageResponse> {
    return getBucketUsage({
      endpoint: this.endpoint,
      bucket
    });
  }

  // Helper method that can be used internally or exposed for convenience
  private async fileExists(bucket: string, filename: string): Promise<boolean> {
    try {
      const files = await this.listFiles(bucket);
      return files.some(file => file.key === filename);
    } catch (e) {
      return false;
    }
  }
}
