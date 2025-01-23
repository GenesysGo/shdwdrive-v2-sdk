import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { Keypair } from '@solana/web3.js';
import { ShdwDriveSDK } from '../src/sdk/shdw-drive';

async function testUpload() {
  try {
    // Use os.homedir() for platform-independent path to keypair
    const keypairPath = join(homedir(), '.config', 'solana', 'id.json');
    const keypairData = JSON.parse(readFileSync(keypairPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));  
    
    // Initialize Shadow Drive SDK with the v2 endpoint
    const drive = new ShdwDriveSDK(
      { endpoint: 'https://v2.shdwdrive.com' },  
      { keypair }
    );
    
    // Read the JPG file from the examples folder
    const imageData = readFileSync(join(__dirname, '<filename>.jpg'));
    const imageFile = new File([imageData], '<filename>.jpg', { type: 'image/jpeg' });
    
    // Upload the file
    console.log('Uploading file...');
    const result = await drive.uploadFile(
      '<bucket name>',
      imageFile,
      {
        onProgress: (progress) => {
          console.log('Upload progress:', progress.status === 'uploading' ? `${progress.progress.toFixed(2)}%` : progress.status);
        }
      }
    );
    
    console.log('Upload Result:', result);
    console.log('File location:', result.finalized_location);
    
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

testUpload();