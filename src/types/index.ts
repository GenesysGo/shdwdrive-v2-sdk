// SDK Configuration Types
export interface ShdwDriveConfig {
  endpoint?: string;
}

// Auth Types
export interface WalletAdapter {
  publicKey: string;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

// Upload Types
export interface FileUploadProgress {
  status: 'uploading' | 'complete' | 'error';
  progress: number;
}

export interface FileUploadOptions {
  onProgress?: (progress: FileUploadProgress) => void;
}

export interface UploadResponse {
  finalized_location: string;
  message?: string;
  upload_errors?: Array<{
    file: string;
    storage_account: string;
    error: string;
  }>;
}

// Delete Types
export interface DeleteResponse {
  message: string;
  success: boolean;
}

// List Types
export interface ListObject {
  key: string;
  size: number;
  lastModified: string;
}

export interface ListFilesResponse {
  objects: ListObject[];
}

// Bucket Types
export interface BucketUsageResponse {
  bucket: string;
  storage_used: number;
}

// Method Configuration Types
export interface UploadConfig {
  endpoint: string;
  bucket: string;
  file: File;
  getSigner: () => string;
  signMessage: (message: string) => Promise<string>;
  onProgress?: (progress: number) => void;
}

export interface DeleteConfig {
  endpoint: string;
  bucket: string;
  fileUrl: string;
  getSigner: () => string;
  signMessage: (message: string) => Promise<string>;
}

export interface ListFilesConfig {
  endpoint: string;
  bucket: string;
  getSigner: () => string;
}

export interface BucketUsageConfig {
  endpoint: string;
  bucket: string;
}