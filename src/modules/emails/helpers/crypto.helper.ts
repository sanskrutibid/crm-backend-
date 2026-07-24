import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts clear text using AES-256-CBC and the provided secret key
 */
export function encrypt(text: string, secretKey: string): { iv: string; encryptedData: string } {
  let key = Buffer.from(secretKey, 'utf-8');
  if (key.length !== 32) {
    // Ensure key is exactly 32 bytes using SHA-256
    key = crypto.createHash('sha256').update(secretKey).digest();
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
  };
}

/**
 * Decrypts encrypted text using AES-256-CBC and the provided secret key and IV
 */
export function decrypt(encryptedText: string, iv: string, secretKey: string): string {
  let key = Buffer.from(secretKey, 'utf-8');
  if (key.length !== 32) {
    // Ensure key is exactly 32 bytes using SHA-256
    key = crypto.createHash('sha256').update(secretKey).digest();
  }

  const ivBuffer = Buffer.from(iv, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}
