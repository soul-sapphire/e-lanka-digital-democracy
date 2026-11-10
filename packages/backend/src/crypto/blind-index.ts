/**
 * E-Lanka Digital Democracy Platform
 * HMAC-SHA256 Blind Indexing Engine
 *
 * Implements salted deterministic hashing for duplicate NIC and Email checks
 * without requiring field decryption across the database index.
 * Section 2.2 Security & Data Protection Specifications
 */

import crypto from 'node:crypto';
import { BlindIndex } from '@e-lanka/shared';

const BLIND_INDEX_PEPPER = process.env.BLIND_INDEX_PEPPER || 'e-lanka-pdpa-salt-pepper-2026-v1-secret';
const SALT_VERSION = process.env.BLIND_INDEX_SALT_VERSION || 'v1';

/**
 * Normalize Sri Lankan National Identity Card (NIC) formats:
 * - Old format: 9 digits followed by 'V' or 'X' (e.g. "851234567V")
 * - New format: 12 digits (e.g. "198512345678")
 */
export function normalizeNIC(rawNIC: string): string {
  if (!rawNIC) return '';
  return rawNIC.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Validate Sri Lankan NIC format (either 9 digits + V/X or 12 digits)
 */
export function isValidSriLankanNIC(nic: string): boolean {
  const normalized = normalizeNIC(nic);
  const oldNicRegex = /^[0-9]{9}[VX]$/;
  const newNicRegex = /^[0-9]{12}$/;
  return oldNicRegex.test(normalized) || newNicRegex.test(normalized);
}

/**
 * Normalize email addresses (lowercase, trimmed)
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Generate a salted HMAC-SHA256 blind index for deterministic exact-match search
 * without disclosing plaintext identity in database indexes or logs.
 */
export function generateBlindIndex(plaintext: string, contextPrefix: string = 'NIC'): BlindIndex {
  const normalized = contextPrefix === 'NIC' ? normalizeNIC(plaintext) : normalizeEmail(plaintext);
  const hmac = crypto.createHmac('sha256', BLIND_INDEX_PEPPER);
  hmac.update(`${contextPrefix}:${normalized}:${SALT_VERSION}`);
  const hash = hmac.digest('hex');

  return {
    hash,
    saltVersion: SALT_VERSION
  };
}

/**
 * Generate privacy-preserving citizen alias (e.g., "Citizen-Western-a94f")
 */
export function generateCitizenAlias(district: string, blindIndexHash: string): string {
  const shortHash = blindIndexHash.substring(0, 4);
  const cleanDistrict = district ? district.replace(/[^a-zA-Z]/g, '') : 'Citizen';
  return `Citizen-${cleanDistrict}-${shortHash}`;
}

/**
 * Fast helper to compute blind index hash string directly
 */
export function computeBlindHash(plaintext: string, contextPrefix: string = 'NIC'): string {
  return generateBlindIndex(plaintext, contextPrefix).hash;
}

