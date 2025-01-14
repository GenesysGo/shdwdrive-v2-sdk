import { SHA256 } from 'crypto-js';
import { CHUNK_SIZE } from '../utils/constants';
import { UploadConfig, UploadResponse } from '../types';

export async function uploadSmallFile(config: UploadConfig): Promise<UploadResponse> {
  const { endpoint, bucket, file, getSigner, signMessage, directory = '' } = config;

  // Clean up directory path but keep trailing slash if it's a real folder
  const cleanDirectory = directory
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/\/+/g, '/') // Normalize multiple slashes to single
    .replace(/\/*$/, '/'); // Ensure single trailing slash
  
  // Create the full path with proper folder structure
  const fullPath = `${cleanDirectory}${file.name}`;
  
  // Use just the filename for hash calculation to match server behavior
  const fileNamesHash = SHA256(file.name).toString();
  const messageToSign = `Shadow Drive Signed Message:\nStorage Account: ${bucket}\nUpload file with hash: ${fileNamesHash}`;
  
  const signature = await signMessage(messageToSign);
  const signer = getSigner();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', signature);
  formData.append('signer', signer);
  formData.append('storage_account', bucket);
  formData.append('directory', cleanDirectory);
  formData.append('name', file.name);
  formData.append('full_path', fullPath);

  const response = await fetch(`${endpoint}/v1/object/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = 'Upload failed';
    
    try {
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.error || error.message || 'Upload failed';
      } else {
        const text = await response.text();
        errorMessage = `Upload failed - Status: ${response.status}, Response: ${text.slice(0, 200)}...`;
      }
    } catch (e) {
      errorMessage = `Upload failed - Status: ${response.status}, Error parsing response`;
    }
    
    throw new Error(errorMessage);
  }

  const result = await response.json();
  
  // Fix the finalized location to include the directory
  if (result.finalized_location && cleanDirectory) {
    const urlParts = result.finalized_location.split('/');
    const bucketIndex = urlParts.indexOf(bucket);
    if (bucketIndex !== -1) {
      urlParts.splice(bucketIndex + 1, 0, cleanDirectory.replace(/\/$/, '')); // Remove trailing slash for URL
      result.finalized_location = urlParts.join('/');
    }
  }

  return result;
}

export async function uploadLargeFile(config: UploadConfig): Promise<UploadResponse> {
  const { endpoint, bucket, file, getSigner, signMessage, onProgress, directory = '' } = config;

  // Clean up directory path but keep trailing slash if it's a real folder
  const cleanDirectory = directory
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/\/+/g, '/') // Normalize multiple slashes to single
    .replace(/\/*$/, '/'); // Ensure single trailing slash
  
  // Create the full path with proper folder structure
  const fullPath = `${cleanDirectory}${file.name}`;
  
  // Use just the filename for hash calculation to match server behavior
  const fileNamesHash = SHA256(file.name).toString();
  const initMessage = `Shadow Drive Signed Message:\nInitialize multipart upload\nBucket: ${bucket}\nFilename: ${file.name}\nFile size: ${file.size}`;
  
  const signature = await signMessage(initMessage);
  const signer = getSigner();

  const initResponse = await fetch(
    `${endpoint}/v1/object/multipart/create`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket,
        filename: file.name,
        message: signature,
        signer,
        size: file.size,
        file_type: file.type,
        directory: cleanDirectory,
        name: file.name,
        full_path: fullPath
      }),
    }
  );

  if (!initResponse.ok) {
    const error = await initResponse.json();
    throw new Error(error.error || 'Failed to initialize multipart upload');
  }

  const { uploadId, key } = await initResponse.json();
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const uploadedParts: { ETag: string; PartNumber: number }[] = [];

  // Upload each part
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', new Blob([chunk]), file.name);
    formData.append('bucket', bucket);
    formData.append('uploadId', uploadId);
    formData.append('partNumber', partNumber.toString());
    formData.append('key', key);
    formData.append('signer', signer);

    const response = await fetch(
      `${endpoint}/v1/object/multipart/upload-part`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload part ${partNumber}`);
    }

    const { ETag } = await response.json();
    uploadedParts.push({ ETag, PartNumber: partNumber });

    if (onProgress) {
      onProgress((partNumber / totalParts) * 90); // Save 10% for completion
    }
  }

  // Complete multipart upload
  const completeResponse = await fetch(
    `${endpoint}/v1/object/multipart/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket,
        uploadId,
        key,
        parts: uploadedParts,
        signer,
      }),
    }
  );

  if (!completeResponse.ok) {
    const error = await completeResponse.json();
    throw new Error(error.error || 'Failed to complete multipart upload');
  }

  const result = await completeResponse.json();
  
  // Fix the finalized location to include the directory
  if (result.finalized_location && cleanDirectory) {
    const urlParts = result.finalized_location.split('/');
    const bucketIndex = urlParts.indexOf(bucket);
    if (bucketIndex !== -1) {
      urlParts.splice(bucketIndex + 1, 0, cleanDirectory.replace(/\/$/, '')); // Remove trailing slash for URL
      result.finalized_location = urlParts.join('/');
    }
  }

  onProgress?.(100);
  return result;
}