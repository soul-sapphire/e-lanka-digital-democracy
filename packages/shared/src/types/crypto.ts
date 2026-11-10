/**
 * E-Lanka Digital Democracy Platform
 * Field-Level Encryption (FLE) & Blind Indexing Types
 * Standardized across Frontend, Backend, and Database tiers
 */

export interface EncryptedPayload {
  /** Initialization vector in hex or base64 */
  iv: string;
  /** Authentication tag ensuring payload integrity (AES-256-GCM) */
  authTag: string;
  /** Ciphertext in hex or base64 */
  ciphertext: string;
  /** Key version identifier to enable seamless cryptographic key rotation */
  keyVersion: string;
  /** Cryptographic algorithm identifier */
  algorithm: 'aes-256-gcm';
}

export interface BlindIndex {
  /** Deterministic salted HMAC-SHA256 hash for fast O(1) indexed lookup */
  hash: string;
  /** Salt version used for blind indexing */
  saltVersion: string;
}

export interface SanitizedAuditMetadata {
  ipHash: string;
  userAgentHash: string;
  timestamp: string;
}

