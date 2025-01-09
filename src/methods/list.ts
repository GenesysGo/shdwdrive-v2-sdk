import { ListFilesConfig, ListObject } from '../types';

export async function listFiles({
  endpoint,
  bucket,
  getSigner
}: ListFilesConfig): Promise<ListObject[]> {
  const owner = getSigner();

  const response = await fetch(`${endpoint}/v1/object/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket: bucket,
      owner: owner
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list files');
  }

  const data = await response.json();
  return data.objects || [];
}