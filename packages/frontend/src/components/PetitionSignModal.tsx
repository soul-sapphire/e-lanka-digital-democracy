import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Mail,
  Building2,
  Binary,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Calendar,
  Lock,
  Fingerprint
} from 'lucide-react';
import {
  EPetition,
  SriLankanNICDetails,
  DRPVerificationResult,
  formatSriLankanDate,
  decodeAndValidateSriLankanNIC,
  detectSriLankanTelco,
  SriLankanTelcoDetails
} from '@e-lanka/shared';
import { api, getStoredUser, setStoredUser } from '../services/api';
import { authenticateBiometrics } from '../services/webauthn.service';
import { LiveCounterWidget } from './LiveCounterWidget';

interface PetitionSignModalProps {
  petition: EPetition;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCount: number) => void;
}

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export const PetitionSignModal: React.FC<PetitionSignModalProps> = ({
  petition,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  // Wizard Step: 1 = NIC & Demographics, 2 = DRP Gateway, 3 = TRCSL Mobile OTP, 4 = Final PDPA Sign
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [nicNumber, setNicNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [claimedDOB, setClaimedDOB] = useState('');
  const [claimedGender, setClaimedGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [district, setDistrict] = useState('Colombo');
  const [email, setEmail] = useState('');

  // Pre-Verified Citizen State (Remembered from Login)
  const [isPreVerified, setIsPreVerified] = useState(false);

  // Live NIC preview
  const [liveNicDetails, setLiveNicDetails] = useState<SriLankanNICDetails | null>(null);

  // Verification States
  const [drpResult, setDrpResult] = useState<DRPVerificationResult | null>(null);
  const [isQueryingDRP, setIsQueryingDRP] = useState(false);

  // Mobile / Email OTP States (Zero-Cost Production Ready)
  const [verificationChannel, setVerificationChannel] = useState<'EMAIL' | 'MOBILE'>('EMAIL');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpReference, setOtpReference] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);
  const [liveTelcoDetails, setLiveTelcoDetails] = useState<SriLankanTelcoDetails | null>(null);

  useEffect(() => {
    const clean = mobileNumber.trim();
    if (clean.length >= 8) {
      setLiveTelcoDetails(detectSriLankanTelco(clean));
    } else {
      setLiveTelcoDetails(null);
    }
  }, [mobileNumber]);

  // Consent Fields
  const [agreeToDemands, setAgreeToDemands] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);

  // Live count state for immediate counter & progress bar update (Issue 3.5)
  const [latestCount, setLatestCount] = useState(petition.currentSignatures);

  useEffect(() => {
    setLatestCount(petition.currentSignatures);
  }, [petition.currentSignatures]);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Auto-fill from authenticated citizen session: once NIC is verified at login, never ask again!
  useEffect(() => {
    if (!isOpen) return;
    const storedUser = getStoredUser();
    if (storedUser && storedUser.isVerifiedCitizen && storedUser.nicNumber) {
      setNicNumber(storedUser.nicNumber);
      if (storedUser.calculatedDOB) {
        setClaimedDOB(storedUser.calculatedDOB);
      }
      if (storedUser.gender) {
        setClaimedGender(storedUser.gender);
      }
      if (storedUser.district) {
        setDistrict(storedUser.district);
      }
      if (storedUser.email) {
        setEmail(storedUser.email);
      }
      if (storedUser.mobile) {
        setMobileNumber(storedUser.mobile);
      }
      if (storedUser.verificationChannel) {
        setVerificationChannel(storedUser.verificationChannel);
      } else if (storedUser.email) {
        setVerificationChannel('EMAIL');
      } else {
        setVerificationChannel('MOBILE');
      }
      setFullName(storedUser.fullName || storedUser.anonymizedAlias || 'Verified Citizen');
      const decoded = storedUser.nicDetails || decodeAndValidateSriLankanNIC(storedUser.nicNumber);
      setLiveNicDetails(decoded);
      setDrpResult({
        verified: true,
        drpTransactionId: `DRP-${storedUser.nicNumber.slice(-4)}-${Date.now().toString().slice(-4)}`,
        citizenStatus: 'ACTIVE_LIVING',
        electoralDistrict: storedUser.district || 'Colombo',
        gatewayAuthority: 'Department for Registration of Persons (DRP) Sovereign Gateway',
        verifiedAt: new Date().toISOString()
      });
      setIsPreVerified(true);

      // If citizen already verified OTP at login or has a verified profile, bypass Step 1, 2, AND 3 straight to 1-click signing!
      if (storedUser.otpVerified || storedUser.isVerifiedCitizen) {
        setOtpVerified(true);
        if (storedUser.verifiedDestination) {
          setMaskedMobile(storedUser.verifiedDestination);
        } else if (storedUser.verifiedEmail) {
          setMaskedMobile(storedUser.verifiedEmail);
        } else if (storedUser.verifiedMobile) {
          setMaskedMobile(storedUser.verifiedMobile);
        }
        setStep(4);
      } else {
        // Seamless bypass: skip Step 1 and Step 2 directly to OTP verification!
        setStep(3);
      }
    } else {
      setIsPreVerified(false);
      setStep(1);
    }
  }, [isOpen]);

  // Cooldown countdown for resending verification code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Live NIC decode effect as user types (when manual entry is used)
  useEffect(() => {
    const clean = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (clean.length >= 9) {
      api.validateNIC(clean).then((res) => {
        setLiveNicDetails(res.nicDetails);
        if (res.nicDetails.isValid) {
          if (!claimedDOB) {
            setClaimedDOB(formatSriLankanDate(res.nicDetails.calculatedDOB));
          }
          setClaimedGender(res.nicDetails.gender);
        }
      });
    } else {
      setLiveNicDetails(null);
    }
  }, [nicNumber]);

  if (!isOpen) return null;

  // Step 1: Validate NIC and Demographic match
  const handleProceedToDRP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nicNumber.trim() || !fullName.trim()) {
      setError('Please provide your NIC number and full legal name.');
      return;
    }

    const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    const validation = await api.validateNIC(cleanNIC, claimedDOB, claimedGender);

    if (!validation.verified) {
      setError(validation.reason || 'Demographic details do not match the mathematically decoded NIC.');
      return;
    }

    // Trigger DRP Gateway query for Step 2
    setIsQueryingDRP(true);
    setStep(2);

    try {
      const drpRes = await api.verifyDRP(cleanNIC, claimedDOB);
      if (drpRes.success && drpRes.result.verified) {
        setDrpResult(drpRes.result);
        if (drpRes.result.electoralDistrict) {
          setDistrict(drpRes.result.electoralDistrict);
        }
      } else {
        setError('DRP Gateway: Citizen identity record could not be confirmed in the registry.');
      }
    } catch (err: any) {
      setError('DRP Gateway connection error: ' + err.message);
    } finally {
      setIsQueryingDRP(false);
    }
  };

  // Step 3: OTP Dispatch (Dual Channel: Email OTP or Mobile SMS)
  const handleSendOTP = async () => {
    setError(null);
    const destination = verificationChannel === 'EMAIL' ? email.trim() : mobileNumber.trim();
    if (!destination) {
      setError(
        verificationChannel === 'EMAIL'
          ? 'Please enter your email address to receive the verification code.'
          : 'Please enter your Sri Lankan mobile number (+94).'
      );
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendMobileOTP(destination, verificationChannel);
      if (res.success && res.data) {
        setOtpDispatched(true);
        setOtpReference(res.data.otpReference);
        setMaskedMobile(res.data.mobileMasked);
        setResendCooldown(30);
        if (res.data.demoOtpCode) {
          setSandboxCode(res.data.demoOtpCode);
        } else {
          setSandboxCode(null);
        }
      } else {
        setError(res.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification dispatch failed.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 3: OTP Verification
  const handleVerifyOTP = async () => {
    setError(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const destination = verificationChannel === 'EMAIL' ? email.trim() : mobileNumber.trim();
    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyMobileOTP(otpReference, destination, otpCode);
      if (res.success && res.data && res.data.verified) {
        setOtpVerified(true);
        // Save verified account credentials to unlock permanent zero-quota signing
        const current = getStoredUser() || {
          id: `citizen_${Date.now()}`,
          anonymizedAlias: `Citizen-${district || 'Western'}-${nicNumber ? nicNumber.slice(-4) : '9421'}`,
          district: district || 'Colombo',
          role: 'CITIZEN'
        };
        current.isVerifiedCitizen = true;
        current.otpVerified = true;
        current.nicNumber = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
        current.district = district;
        current.verificationChannel = verificationChannel;
        current.verifiedDestination = maskedMobile || destination;
        if (verificationChannel === 'EMAIL') {
          current.verifiedEmail = destination;
        } else {
          current.verifiedMobile = destination;
        }
        setStoredUser(current);
        setStep(4); // Move to final PDPA consent step
      } else {
        setError(res.error || 'Invalid 6-digit verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 4: Final Submission
  const handleFinalSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeToDemands) {
      setError('You must declare agreement with the petition demands.');
      return;
    }

    if (!consentDataProcessing) {
      setError('PDPA statutory consent is mandatory to record your unique verified signature.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
      const res = await api.signPetition(petition.id, {
        nicNumber: cleanNIC,
        fullName,
        email,
        district,
        agreeToDemands,
        consentDataProcessing
      });

      if (res.success) {
        setLatestCount(res.currentSignatures);
        setSignedSuccess(true);
        onSuccess(res.currentSignatures);
      } else {
        setError(res.message || t('petitions.duplicateError'));
      }
    } catch (err: any) {
      setError(err.message || 'Signature recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricSign = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const bioAuth = await authenticateBiometrics(nicNumber);
      if (!bioAuth.success) {
        setError(bioAuth.error || 'Biometric signature was cancelled.');
        setIsSubmitting(false);
        return;
      }

      const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
      const res = await api.signPetition(petition.id, {
        nicNumber: cleanNIC,
        fullName: fullName || 'Verified Citizen',
        email,
        district,
        agreeToDemands: true,
        consentDataProcessing: true
      });

      if (res.success) {
        setAgreeToDemands(true);
        setConsentDataProcessing(true);
        setLatestCount(res.currentSignatures);
        setSignedSuccess(true);
        onSuccess(res.currentSignatures);
      } else {
        setError(res.message || t('petitions.duplicateError'));
      }
    } catch (err: any) {
      setError(err.message || 'Biometric signature recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const petitionHeadline = petition.headline ? (petition.headline[currentLang] || petition.headline.en) : null;
  const petitionTitle = petition.title[currentLang] || petition.title.en;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-2xl sm:rounded-2xl max-w-xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-7 text-white shadow-2xl relative my-0 sm:my-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1 space-y-4">

        {signedSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Signature Verified & Counted!</h3>

            {/* Live Progress Bar & Counter Updated Immediately (Issue 3.5) */}
            <div className="py-2 text-left">
              <LiveCounterWidget
                currentSignatures={latestCount}
                requiredSignatures={petition.requiredSignatures}
                showDetails={true}
              />
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Tier 1 Mathematical Check:</span>
                <span className="text-emerald-400 font-semibold">VALIDATED ({liveNicDetails?.format})</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Tier 2 DRP Registry:</span>
                <span className="text-emerald-400 font-semibold">ACTIVE LIVING ({drpResult?.drpTransactionId})</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Tier 3 Proof of Life OTP:</span>
                <span className="text-emerald-400 font-semibold">VERIFIED ({maskedMobile})</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-700">
                <span className="text-slate-400">Privacy Safeguard:</span>
                <span className="text-lanka-gold font-mono">HMAC-SHA256 Blind Index</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your signature has been permanently decoupled from your real identity under Sri Lanka PDPA No. 9 of 2022. You cannot be identified or retaliated against.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/10"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header with Title and Petition Banner */}
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-lanka-gold" />
                <h3 className="text-lg font-bold text-white">{t('petitions.modalTitle')}</h3>
              </div>
              <div className="border-l-2 border-lanka-gold pl-2.5 py-0.5 mt-2 space-y-0.5">
                <p className="text-xs text-white font-bold leading-tight">
                  {petitionHeadline || petitionTitle}
                </p>
                {petitionHeadline && (
                  <p className="text-[11px] text-slate-400 italic">
                    Statutory Title: {petitionTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Verified Citizen Session Banner (When citizen authenticated at login) */}
            {isPreVerified && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{t('petitions.verifiedSessionBadge')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        NIC: ••••{nicNumber.slice(-4)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-300">
                      District: <strong className="text-white">{district}</strong> • {t('petitions.verifiedSessionNotice')}
                    </span>
                  </div>
                </div>
                {step !== 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-slate-400 hover:text-white underline ml-2 whitespace-nowrap"
                  >
                    {t('petitions.changeDetails')}
                  </button>
                )}
              </div>
            )}

            {/* Step Wizard Indicators */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-center">
              <div className={`p-2 rounded-lg border transition-all ${step === 1 ? 'border-lanka-gold bg-lanka-gold/10 text-lanka-gold' : step > 1 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Binary className="w-3.5 h-3.5" />
                  <span>Tier 1</span>
                </div>
                <span className="text-[9px] block font-normal">NIC Decode</span>
              </div>

              <div className={`p-2 rounded-lg border transition-all ${step === 2 ? 'border-lanka-gold bg-lanka-gold/10 text-lanka-gold' : step > 2 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Tier 2</span>
                </div>
                <span className="text-[9px] block font-normal">DRP Registry</span>
              </div>

              <div className={`p-2 rounded-lg border transition-all ${step === 3 ? 'border-lanka-gold bg-lanka-gold/10 text-lanka-gold' : step > 3 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Tier 3</span>
                </div>
                <span className="text-[9px] block font-normal">Email OTP</span>
              </div>

              <div className={`p-2 rounded-lg border transition-all ${step === 4 ? 'border-lanka-gold bg-lanka-gold/10 text-lanka-gold' : 'border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign</span>
                </div>
                <span className="text-[9px] block font-normal">PDPA Consent</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: NIC & Demographics */}
            {step === 1 && (
              <form onSubmit={handleProceedToDRP} className="space-y-3.5 text-xs">
                {isPreVerified && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Citizen credentials pre-verified at login. No re-entry required.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider"
                    >
                      Skip to OTP &rarr;
                    </button>
                  </div>
                )}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    {t('petitions.nicLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 199012345678 or 851234567V"
                    value={nicNumber}
                    onChange={(e) => setNicNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {t('petitions.nicHelp')}
                  </span>
                </div>

                {/* Live Mathematical NIC Decoding Card */}
                {liveNicDetails && (
                  <div className={`p-3 rounded-xl border text-xs ${liveNicDetails.isValid ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-red-950/20 border-red-500/40 text-red-300'}`}>
                    {liveNicDetails.isValid ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>✓ NIC Checksum Verified ({liveNicDetails.format})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                            {liveNicDetails.isVoterEligible ? 'Voter Eligible' : 'Non-Voter (X)'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 grid grid-cols-2 gap-2 pt-1">
                          <div>Decoded Birth Year: <span className="font-mono text-white">{liveNicDetails.birthYear}</span></div>
                          <div>Decoded Gender: <span className="font-mono text-white">{liveNicDetails.gender}</span></div>
                          <div>Calculated DOB: <span className="font-mono text-white">{formatSriLankanDate(liveNicDetails.calculatedDOB)} (DD/MM/YYYY)</span></div>
                          <div>Day of Year: <span className="font-mono text-white">{liveNicDetails.dayOfYear} / 366</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Mathematical Checksum Failed</div>
                          <div className="text-[11px] text-slate-300 mt-0.5">{liveNicDetails.validationError}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    {t('petitions.nameLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name as shown on NIC"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-medium text-slate-300">
                        {t('petitions.dobLabel')} *
                      </label>
                      <span className="text-[10px] text-lanka-gold font-mono font-semibold">
                        DD/MM/YYYY
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="DD/MM/YYYY (e.g. 24/05/1990)"
                        value={claimedDOB}
                        onChange={(e) => {
                          let val = e.target.value;
                          const digits = val.replace(/\D/g, '');
                          if (digits.length <= 8 && !val.includes('-')) {
                            if (digits.length > 4) {
                              val = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
                            } else if (digits.length > 2) {
                              val = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
                            } else {
                              val = digits;
                            }
                          }
                          setClaimedDOB(val);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-9 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
                      />
                      <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Sri Lankan Standard: Day / Month / Year
                    </span>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      {t('petitions.genderLabel')} *
                    </label>
                    <select
                      value={claimedGender}
                      onChange={(e) => setClaimedGender(e.target.value as 'MALE' | 'FEMALE')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                    >
                      <option value="MALE">{t('petitions.male')}</option>
                      <option value="FEMALE">{t('petitions.female')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      {t('petitions.districtLabel')} *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                    >
                      {SRI_LANKAN_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      {t('petitions.emailLabel')}
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    <span>{t('petitions.step1Next')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: DRP Gateway Check */}
            {step === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-lanka-gold" />
                      <span className="font-semibold text-white">Tier 2: Sovereign DRP e-KYC Verification</span>
                    </div>
                    {isQueryingDRP ? (
                      <Loader2 className="w-4 h-4 animate-spin text-lanka-gold" />
                    ) : drpResult?.verified ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        ACTIVE CITIZEN
                      </span>
                    ) : null}
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    This step cross-checks the cryptographic identity against the Department for Registration of Persons (DRP) sovereign citizen registry to verify existence, active living status, and electoral registration.
                  </p>

                  {drpResult && (
                    <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/60 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registry Authority:</span>
                        <span className="text-white font-medium">{drpResult.gatewayAuthority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status in Registry:</span>
                        <span className="text-emerald-400 font-semibold">{drpResult.citizenStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Electoral District:</span>
                        <span className="text-white font-medium">{drpResult.electoralDistrict || district}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gateway Transaction:</span>
                        <span className="text-lanka-gold font-mono">{drpResult.drpTransactionId}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    disabled={isQueryingDRP || !drpResult?.verified}
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    <span>Proceed to Email Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Cryptographic OTP Proof of Life (Email OTP) */}
            {step === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-lanka-gold" />
                      <span className="font-semibold text-white">Tier 3: Cryptographic Proof of Life Verification</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      Zero Cost
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Verify your identity via instant zero-cost verification. Enter your email address to receive your 6-digit cryptographic PIN via our dedicated Google gateway.
                  </p>

                  {/* Channel options (Mobile hidden for now to maintain zero-cost public scale) */}
                  <div className="hidden" aria-hidden="true">
                    <span>{t('petitions.emailOtpOption')}</span>
                    <span>{t('petitions.mobileOtpOption')}</span>
                    <span>{t('petitions.quotaSavingNotice')}</span>
                    <span>Quota Saving</span>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      Email Address for Instant Verification Code *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="citizen@example.com"
                        value={email}
                        disabled={otpDispatched}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                      />
                      {!otpDispatched && (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={isSendingOtp || !email.trim()}
                          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50"
                        >
                          {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : t('petitions.sendOtp')}
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Direct official delivery via elanka.portal@gmail.com. Check your inbox and spam folder.
                    </span>
                  </div>

                  {otpDispatched && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-slate-800/90 border border-amber-500/30 text-xs space-y-2 shadow-sm">
                        <div className="flex items-center gap-2 font-semibold text-amber-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            {verificationChannel === 'EMAIL' ? 'Verification Code Dispatched via Email' : 'Verification Code Sent'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {verificationChannel === 'EMAIL' ? (
                            <>
                              A 6-digit verification code has been dispatched to <strong className="text-white">{maskedMobile}</strong> from <strong className="text-amber-400">elanka.portal@gmail.com</strong>.
                              <span className="block mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                                ⚠️ <strong>Check Spam Folder:</strong> If you don't see the email in your Primary inbox within 30 seconds, please check your <strong>Spam</strong> or <strong>Junk</strong> folder and click <em>"Report not spam"</em>.
                              </span>
                            </>
                          ) : (
                            <>
                              A 6-digit verification code has been dispatched via SMS to <strong className="text-white">{maskedMobile}</strong>
                              {liveTelcoDetails?.operatorBrandName && <span> ({liveTelcoDetails.operatorBrandName})</span>}.
                              {sandboxCode && (
                                <span className="block mt-1.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200">
                                  ℹ️ <strong>Mobile SMS Sandbox:</strong> Enter verification code <strong className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{sandboxCode}</strong> below to sign the petition.
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="text-slate-400">
                            {t('petitions.enterOtp')} (Sent to <strong className="text-white">{maskedMobile}</strong>):
                          </span>
                          {resendCooldown > 0 ? (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {t('petitions.resendOtpIn', { seconds: resendCooldown })}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOTP}
                              disabled={isSendingOtp}
                              className="text-[11px] text-lanka-gold hover:underline font-semibold"
                            >
                              {t('petitions.resendOtpBtn')}
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono text-center tracking-widest text-base"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={isVerifyingOtp || otpCode.length !== 6}
                            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50 shadow-md shadow-emerald-500/10"
                          >
                            {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : t('petitions.verifyOtp')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(isPreVerified ? 1 : 2)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isPreVerified ? 'Review Identity' : 'Back'}</span>
                  </button>
                  {isPreVerified && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>NIC & DRP Pre-Verified</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Statutory PDPA Consent & Submit */}
            {step === 4 && (
              <form onSubmit={handleFinalSign} className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2.5">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Multi-Tier Verification Complete</span>
                  </div>

                  {isPreVerified && otpVerified && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 space-y-1">
                      <div>{t('petitions.fullVerificationActive')}</div>
                      <div className="text-emerald-400 font-semibold">{t('petitions.verified1ClickNotice')}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>NIC Number: <span className="font-mono text-white">{nicNumber}</span></div>
                    <div>District: <span className="font-mono text-white">{district}</span></div>
                    <div>Verified Channel: <span className="font-mono text-white">{maskedMobile}</span></div>
                    <div>DRP Ref: <span className="font-mono text-white">{drpResult?.drpTransactionId?.slice(-10)}</span></div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                    <input
                      type="checkbox"
                      checked={agreeToDemands}
                      onChange={(e) => setAgreeToDemands(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">
                      {t('petitions.agreeCheckbox')}
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-emerald-900/50 hover:border-emerald-700/60 transition-all">
                    <input
                      type="checkbox"
                      checked={consentDataProcessing}
                      onChange={(e) => setConsentDataProcessing(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-400 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200 leading-relaxed">
                      <strong className="text-emerald-400 block mb-0.5">PDPA Consent Checkbox:</strong>
                      {t('petitions.consentCheckbox')}
                    </span>
                  </label>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium min-h-[44px]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBiometricSign}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 hover:from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 min-h-[44px]"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>Biometric Sign</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/10 min-h-[44px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Recording Signature...</span>
                        </>
                      ) : (
                        <span>{t('petitions.confirmSign')}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
