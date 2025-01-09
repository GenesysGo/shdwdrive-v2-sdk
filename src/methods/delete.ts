import { DeleteConfig, DeleteResponse } from '../types';


export async function deleteFile(config: DeleteConfig): Promise<DeleteResponse> {

  // Extract filename from URL if full URL is provided
  let filename = config.fileUrl;
  try {
    const url = new URL(config.fileUrl);
    const parts = url.pathname.split('/');
    const bucketIndex = parts.findIndex(part => part === config.bucket);
    if (bucketIndex !== -1 && parts.length > bucketIndex + 1) {
      filename = parts.slice(bucketIndex + 1).join('/');
    }
  } catch (e) {
    // If not a URL, assume it's already a filename
    console.log('Using provided filename:', filename);
  }

  // Create message with exact formatting
  const message = `Shadow Drive Signed Message:
Delete file
Bucket: ${config.bucket}
Filename: ${filename}`;

  const signature = await config.signMessage(message);
  const signer = config.getSigner();

  const response = await fetch(`${config.endpoint}/v1/object/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket: config.bucket,
      filename,
      message: signature,
      signer,
    }),
  });

  let responseData;
  try {
    responseData = await response.json();
  } catch (e) {
    throw new Error('Failed to parse server response');
  }

  if (!response.ok) {
    throw new Error(responseData.error || 'Delete failed');
  }

  return {
    message: responseData.message || 'File deleted successfully',
    success: true
  };
}