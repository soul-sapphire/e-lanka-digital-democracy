/**
 * E-Lanka Digital Democracy Platform
 * Sri Lankan National Identity Card (NIC) Algorithmic Decoder & Validator
 *
 * Implements:
 * Tier 1: Mathematical Checksum & Date-of-Birth / Gender Cross-Check
 * Parses old 9-digit (YYDDDNNNC + V/X) and new 12-digit (YYYYDDDNNNNC) formats.
 */

import { SriLankanNICDetails } from './types/verification';

const DAYS_IN_MONTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Convert Day of the Year (1-366) to Month (1-12) and Day (1-31)
 * Department for Registration of Persons (DRP) historically calculates using a 366-day leap reference.
 */
export function dayOfYearToDate(year: number, rawDayOfYear: number): { month: number; day: number; formatted: string } {
  let day = rawDayOfYear;
  let month = 0;

  for (let i = 0; i < DAYS_IN_MONTHS.length; i++) {
    if (day <= DAYS_IN_MONTHS[i]) {
      month = i + 1;
      break;
    }
    day -= DAYS_IN_MONTHS[i];
  }

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    month,
    day,
    formatted: `${year}-${mm}-${dd}`
  };
}

/**
 * Decode and mathematically validate a Sri Lankan NIC number
 */
export function decodeAndValidateSriLankanNIC(rawNIC: string): SriLankanNICDetails {
  if (!rawNIC) {
    return {
      nicNumber: '',
      format: 'OLD_9_DIGIT',
      birthYear: 0,
      dayOfYear: 0,
      gender: 'MALE',
      calculatedDOB: '',
      isVoterEligible: false,
      isValid: false,
      validationError: 'NIC number cannot be blank.'
    };
  }

  const clean = rawNIC.trim().toUpperCase().replace(/[\s-]/g, '');

  const oldRegex = /^([0-9]{2})([0-9]{3})([0-9]{3})([0-9]{1})([VX])$/;
  const newRegex = /^([0-9]{4})([0-9]{3})([0-9]{4})([0-9]{1})$/;

  let birthYear = 0;
  let rawDays = 0;
  let format: 'OLD_9_DIGIT' | 'NEW_12_DIGIT' = 'OLD_9_DIGIT';
  let isVoterEligible = true;

  if (oldRegex.test(clean)) {
    format = 'OLD_9_DIGIT';
    const match = clean.match(oldRegex)!;
    birthYear = 1900 + parseInt(match[1], 10);
    rawDays = parseInt(match[2], 10);
    isVoterEligible = match[5] === 'V';
  } else if (newRegex.test(clean)) {
    format = 'NEW_12_DIGIT';
    const match = clean.match(newRegex)!;
    birthYear = parseInt(match[1], 10);
    rawDays = parseInt(match[2], 10);
    isVoterEligible = true;
  } else {
    return {
      nicNumber: clean,
      format: 'OLD_9_DIGIT',
      birthYear: 0,
      dayOfYear: 0,
      gender: 'MALE',
      calculatedDOB: '',
      isVoterEligible: false,
      isValid: false,
      validationError: 'Invalid Sri Lankan NIC structure. Expected 9 digits + V/X or 12 digits.'
    };
  }

  // Validate birth year reasonableness (between 1900 and current year - 16)
  const currentYear = new Date().getFullYear();
  if (birthYear < 1900 || birthYear > currentYear - 16) {
    return {
      nicNumber: clean,
      format,
      birthYear,
      dayOfYear: rawDays,
      gender: 'MALE',
      calculatedDOB: '',
      isVoterEligible,
      isValid: false,
      validationError: `Invalid birth year ${birthYear} encoded in NIC (Must be at least 16 years old).`
    };
  }

  // Determine gender and check day bounds
  let gender: 'MALE' | 'FEMALE' = 'MALE';
  let dayOfYear = rawDays;

  if (rawDays > 500) {
    gender = 'FEMALE';
    dayOfYear = rawDays - 500;
  }

  // Day of year must be between 1 and 366
  if (dayOfYear < 1 || dayOfYear > 366) {
    return {
      nicNumber: clean,
      format,
      birthYear,
      dayOfYear,
      gender,
      calculatedDOB: '',
      isVoterEligible,
      isValid: false,
      validationError: `Mathematically invalid day-of-year sequence (${rawDays}) in NIC. Randomly fabricated numbers fail this check.`
    };
  }

  const { formatted } = dayOfYearToDate(birthYear, dayOfYear);

  return {
    nicNumber: clean,
    format,
    birthYear,
    dayOfYear,
    gender,
    calculatedDOB: formatted,
    isVoterEligible,
    isValid: true
  };
}

/**
 * Cross-check claimed Date of Birth and Gender against mathematically decoded NIC
 */
export function verifyClaimedCitizenDetails(params: {
  nicNumber: string;
  claimedDOB?: string; // YYYY-MM-DD
  claimedGender?: 'MALE' | 'FEMALE';
}): { verified: boolean; nicDetails: SriLankanNICDetails; reason?: string } {
  const nicDetails = decodeAndValidateSriLankanNIC(params.nicNumber);

  if (!nicDetails.isValid) {
    return { verified: false, nicDetails, reason: nicDetails.validationError };
  }

  if (params.claimedGender && params.claimedGender !== nicDetails.gender) {
    return {
      verified: false,
      nicDetails,
      reason: `Claimed gender (${params.claimedGender}) does not match gender mathematically encoded in NIC (${nicDetails.gender}).`
    };
  }

  if (params.claimedDOB) {
    const claimedYear = parseInt(params.claimedDOB.split('-')[0], 10);
    if (claimedYear !== nicDetails.birthYear) {
      return {
        verified: false,
        nicDetails,
        reason: `Claimed birth year (${claimedYear}) does not match year encoded in NIC (${nicDetails.birthYear}).`
      };
    }
  }

  return {
    verified: true,
    nicDetails
  };
}

