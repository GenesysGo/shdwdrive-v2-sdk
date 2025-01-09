import { SHA256 } from 'crypto-js';
import { CHUNK_SIZE } from '../utils/constants';
import { UploadConfig, UploadResponse } from '../types';

export async function uploadSmallFile(config: UploadConfig): Promise<UploadResponse> {
  const { endpoint, bucket, file, getSigner, signMessage } = config;
  
  const fileNamesHash = SHA256(file.name).toString();
  const messageToSign = `Shadow Drive Signed Message:\nStorage Account: ${bucket}\nUpload file with hash: ${fileNamesHash}`;
  const signature = await signMessage(messageToSign);
  const signer = getSigner();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', signature);
  formData.append('signer', signer);
  formData.append('storage_account', bucket);

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

  return response.json();
}

export async function uploadLargeFile(config: UploadConfig): Promise<UploadResponse> {
  const { endpoint, bucket, file, getSigner, signMessage, onProgress } = config;

  // Initialize multipart upload
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

  onProgress?.(100);
  return completeResponse.json();
}