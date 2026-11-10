/**
 * E-Lanka Digital Democracy Platform
 * Field-Level Encryption (FLE) Engine (AES-256-GCM)
 *
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 * Section 2.2 Security & Data Protection Specifications
 */

import crypto from 'node:crypto';
import { EncryptedPayload } from '@e-lanka/shared';

// Master key derivation: Must be 32 bytes (256 bits)
const DEFAULT_KEY_SECRET = process.env.FLE_MASTER_KEY || 'e-lanka-pdpa-2026-master-aes-key-change-in-prod-32b!';
const KEY_VERSION = process.env.FLE_KEY_VERSION || 'v1';

// Derive a fixed 32-byte key using SHA-256
const DERIVED_KEY = crypto.createHash('sha256').update(DEFAULT_KEY_SECRET).digest();

/**
 * Encrypt a plaintext string using AES-256-GCM with a unique 96-bit (12-byte) IV.
 * Generates an authentication tag ensuring ciphertext integrity and authenticity.
 */
export function encryptField(plaintext: string): EncryptedPayload {
  if (typeof plaintext !== 'string') {
    throw new TypeError('Plaintext to encrypt must be a string');
  }

  // 12-byte IV is recommended for GCM mode (RFC 5116)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', DERIVED_KEY, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext,
    keyVersion: KEY_VERSION,
    algorithm: 'aes-256-gcm'
  };
}

/**
 * Decrypt an AES-256-GCM encrypted payload, verifying the GCM authentication tag.
 * Throws an error if the payload has been tampered with or corrupted.
 */
export function decryptField(payload: EncryptedPayload): string {
  if (!payload || !payload.iv || !payload.authTag || !payload.ciphertext) {
    throw new Error('Invalid EncryptedPayload structure');
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', DERIVED_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt arbitrary JSON serializable objects (e.g. personal contact data)
 */
export function encryptJson(data: unknown): EncryptedPayload {
  return encryptField(JSON.stringify(data));
}

/**
 * Decrypt payload back into parsed JSON object
 */
export function decryptJson<T = unknown>(payload: EncryptedPayload): T {
  const jsonStr = decryptField(payload);
  return JSON.parse(jsonStr) as T;
}

