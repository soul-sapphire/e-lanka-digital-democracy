/**
 * E-Lanka Digital Democracy Platform
 * Multi-Tier Sovereign Citizen Verification Routes
 *
 * Implements:
 * Tier 1: Mathematical NIC Validation & Claimed Identity Cross-Check
 * Tier 2: DRP Government e-KYC Registry Check
 * Tier 3: TRCSL Mobile SIM OTP Dispatch & Verification
 */

import { Router, Request, Response } from 'express';
import { verifyClaimedCitizenDetails } from '../crypto/nic-validator';
import { drpGatewayService } from '../services/drp-gateway.service';
import { mobileOTPService } from '../services/otp.service';

const router = Router();

/**
 * POST /api/v1/verification/validate-nic
 * Tier 1: Algorithmic Sri Lankan NIC decoding and demographic cross-check
 */
router.post('/validate-nic', (req: Request, res: Response) => {
  const { nicNumber, claimedDOB, claimedGender } = req.body;

  if (!nicNumber) {
    return res.status(400).json({
      success: false,
      error: 'NIC number is required.'
    });
  }

  const result = verifyClaimedCitizenDetails({
    nicNumber,
    claimedDOB,
    claimedGender
  });

  return res.json({
    success: true,
    verified: result.verified,
    nicDetails: result.nicDetails,
    reason: result.reason
  });
});

/**
 * POST /api/v1/verification/drp-check
 * Tier 2: Department for Registration of Persons (DRP) sovereign registry verification
 */
router.post('/drp-check', async (req: Request, res: Response) => {
  const { nicNumber, claimedDOB } = req.body;

  if (!nicNumber) {
    return res.status(400).json({
      success: false,
      error: 'NIC number is required for DRP registry lookup.'
    });
  }

  try {
    const result = await drpGatewayService.verifyNICWithDRP(nicNumber, claimedDOB);
    return res.json({
      success: true,
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'DRP registry verification gateway error: ' + (error.message || 'Unknown error')
    });
  }
});

/**
 * POST /api/v1/verification/send-otp
 * Tier 3: TRCSL Mobile SIM OTP Dispatch
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      error: 'Sri Lankan mobile number is required.'
    });
  }

  try {
    const result = await mobileOTPService.dispatchOTP(mobileNumber);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'OTP dispatch failed: ' + (error.message || 'Unknown error')
    });
  }
});

/**
 * POST /api/v1/verification/verify-otp
 * Tier 3: Verify received 6-digit OTP
 */
router.post('/verify-otp', (req: Request, res: Response) => {
  const { otpReference, mobileNumber, otpCode } = req.body;

  if (!otpReference || !mobileNumber || !otpCode) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: otpReference, mobileNumber, and otpCode are required.'
    });
  }

  const result = mobileOTPService.verifyOTP(otpReference, mobileNumber, otpCode);

  if (!result.verified) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  return res.json({
    success: true,
    data: result
  });
});

export const verificationRoutes = router;

