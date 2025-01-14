import { CreateFolderResponse, DeleteFolderResponse, FolderConfig } from '../types';

export async function createFolder(config: FolderConfig): Promise<CreateFolderResponse> {
  const { endpoint, bucket, folderName, getSigner, signMessage } = config;
  
  // Ensure folder name ends with slash
  const normalizedFolderName = folderName.endsWith('/') ? folderName : `${folderName}/`;
  
  // Create message with exact formatting
  const message = `Shadow Drive Signed Message:
Create folder
Bucket: ${bucket}
Folder name: ${normalizedFolderName}`;

  const signature = await signMessage(message);
  const signer = getSigner();

  const response = await fetch(`${endpoint}/v1/folder/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket,
      folder_name: normalizedFolderName,
      message: signature,
      signer,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create folder');
  }

  return response.json();
}

export async function deleteFolder(config: FolderConfig): Promise<DeleteFolderResponse> {
  const { endpoint, bucket, folderName, getSigner, signMessage } = config;
  
  // Ensure folder path ends with slash
  const normalizedFolderPath = folderName.endsWith('/') ? folderName : `${folderName}/`;
  
  // Create message with exact formatting
  const message = `Shadow Drive Signed Message:
Delete folder
Bucket: ${bucket}
Folder path: ${normalizedFolderPath}`;

  const signature = await signMessage(message);
  const signer = getSigner();

  const response = await fetch(`${endpoint}/v1/folder/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket,
      folder_path: normalizedFolderPath,
      message: signature,
      signer,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete folder');
  }

  return response.json();
}