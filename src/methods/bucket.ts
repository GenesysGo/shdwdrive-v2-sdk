import { BucketUsageConfig, BucketUsageResponse } from '../types';

export async function getBucketUsage({
  endpoint,
  bucket
}: BucketUsageConfig): Promise<BucketUsageResponse> {
  try {
    const response = await fetch(`${endpoint}/v1/bucket/usage?bucket=${bucket}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        typeof errorData.error === 'string' 
          ? errorData.error 
          : 'Failed to get bucket usage'
      );
    }

    return await response.json();
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error occurred'
    );
  }
}