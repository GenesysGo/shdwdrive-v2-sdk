<p align="center">
  <img src="assets/shdwdrive-logo.svg" alt="ShdwDrive Logo" width="600"/>
</p>

# shdwDrive SDK

A TypeScript SDK for interacting with ShdwDrive, providing simple and efficient methods for file operations on the decentralized storage platform.

## Installation
```bash
# Install from npm
npm install @shdw-drive/sdk

# Or install from repository
git clone https://github.com/GenesysGo/shdwdrive-v2-sdk.git
cd shdwdrive-v2-sdk
npm install
npm run build
```

# For local development, you can link the package
```bash
cd shdwdrive-v2-sdk
npm link
cd your-project
npm link @shdw-drive/sdk
```

## Features

- 📤 File uploads (supports both small and large files)
- 📥 File deletion
- 📋 File listing
- 📊 Bucket usage statistics
- 🔐 Secure message signing
- ⚡ Progress tracking for uploads
- 🔄 Multipart upload support for large files

## Quick Start
```typescript
import ShdwDriveSDK from '@shdw-drive/sdk';
// Initialize with wallet
const drive = new ShdwDriveSDK({}, { wallet: yourWalletAdapter });
// Or initialize with keypair
const drive = new ShdwDriveSDK({}, { keypair: yourKeypair });
```

## Usage Examples

### Upload a File
```typescript
const file = new File(['Hello World'], 'hello.txt', { type: 'text/plain' });
const uploadResponse = await drive.uploadFile('your-bucket', file, {
onProgress: (progress) => {
console.log(Upload progress: ${progress.progress}%);
}
});
console.log('File uploaded:', uploadResponse.finalized_location)
```

### List Files
```typescript
const files = await drive.listFiles('your-bucket');
console.log('Files in bucket:', files);
```

### Delete a File
```typescript
const deleteResponse = await drive.deleteFile('your-bucket', 'file-url');
console.log('Delete status:', deleteResponse.success);
```

### Get Bucket Usage
```typescript
const usage = await drive.getBucketUsage('your-bucket');
console.log('Storage used:', usage.storage_used)
```

## API Reference

### `ShdwDriveSDK`

#### Constructor Options
```typescript
interface ShdwDriveConfig {
endpoint?: string; // Optional custom endpoint
}
// Initialize with either wallet or keypair
new ShdwDriveSDK(config, { wallet: WalletAdapter });
new ShdwDriveSDK(config, { keypair: Keypair });
```

#### Methods

- `uploadFile(bucket: string, file: File, options?: FileUploadOptions)`
- `deleteFile(bucket: string, fileUrl: string)`
- `listFiles(bucket: string)`
- `getBucketUsage(bucket: string)`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the LICENSE file for details.