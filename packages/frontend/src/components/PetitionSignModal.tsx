import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Building2,
  Binary,
  ArrowRight,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { EPetition, SriLankanNICDetails, DRPVerificationResult } from '@e-lanka/shared';
import { api } from '../services/api';

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

  // Live NIC preview
  const [liveNicDetails, setLiveNicDetails] = useState<SriLankanNICDetails | null>(null);

  // Verification States
  const [drpResult, setDrpResult] = useState<DRPVerificationResult | null>(null);
  const [isQueryingDRP, setIsQueryingDRP] = useState(false);

  // Mobile OTP States
  const [mobileNumber, setMobileNumber] = useState('0771234567');
  const [otpReference, setOtpReference] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Consent Fields
  const [agreeToDemands, setAgreeToDemands] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Live NIC decode effect as user types
  useEffect(() => {
    const clean = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (clean.length >= 9) {
      api.validateNIC(clean).then((res) => {
        setLiveNicDetails(res.nicDetails);
        if (res.nicDetails.isValid) {
          if (!claimedDOB) {
            setClaimedDOB(res.nicDetails.calculatedDOB);
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

  // Step 3: Mobile OTP Dispatch
  const handleSendOTP = async () => {
    setError(null);
    setIsSendingOtp(true);
    try {
      const res = await api.sendMobileOTP(mobileNumber);
      if (res.success && res.data) {
        setOtpDispatched(true);
        setOtpReference(res.data.otpReference);
        setMaskedMobile(res.data.mobileMasked);
        if (res.data.demoOtpCode) {
          setDemoOtpHint(res.data.demoOtpCode);
        }
      } else {
        setError(res.error || 'Failed to dispatch OTP. Please check mobile format.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP dispatch failed.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 3: Mobile OTP Verification
  const handleVerifyOTP = async () => {
    setError(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyMobileOTP(otpReference, mobileNumber, otpCode);
      if (res.success && res.data && res.data.verified) {
        setOtpVerified(true);
        setStep(4); // Move to final PDPA consent step
      } else {
        setError(res.error || 'Invalid OTP code.');
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

  const petitionTitle = petition.title[currentLang] || petition.title.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 sm:p-8 text-white shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {signedSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Signature Verified & Counted!</h3>
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
                <span className="text-slate-400">Tier 3 TRCSL SIM Gateway:</span>
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
              <p className="text-xs text-slate-300 font-medium line-clamp-1 border-l-2 border-lanka-gold pl-2.5 py-0.5 mt-2">
                {petitionTitle}
              </p>
            </div>

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
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Tier 3</span>
                </div>
                <span className="text-[9px] block font-normal">Mobile OTP</span>
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
                          <div>Calculated DOB: <span className="font-mono text-white">{liveNicDetails.calculatedDOB}</span></div>
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
                    <label className="block font-medium text-slate-300 mb-1">
                      {t('petitions.dobLabel')} *
                    </label>
                    <input
                      type="date"
                      required
                      value={claimedDOB}
                      onChange={(e) => setClaimedDOB(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                    />
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
                    <span>Proceed to Mobile SIM Check</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: TRCSL Mobile SIM OTP */}
            {step === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-lanka-gold" />
                    <span className="font-semibold text-white">Tier 3: TRCSL Mobile SIM Proof of Life</span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Sri Lankan mobile operators (Dialog, Mobitel, Airtel, Hutch) are regulated by TRCSL and bound to registered citizen NICs. Enter your Sri Lankan mobile number to receive a cryptographic 6-digit one-time PIN.
                  </p>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      {t('petitions.mobileLabel')} *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="0771234567 or +94771234567"
                        value={mobileNumber}
                        disabled={otpDispatched}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
                      />
                      {!otpDispatched && (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={isSendingOtp}
                          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50"
                        >
                          {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : t('petitions.sendOtp')}
                        </button>
                      )}
                    </div>
                  </div>

                  {otpDispatched && (
                    <div className="space-y-3 pt-2">
                      {demoOtpHint && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                          <span className="text-[11px] text-amber-300">
                            <strong>Demo Sandbox OTP Code:</strong> <span className="font-mono text-white text-xs">{demoOtpHint}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtpCode(demoOtpHint)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-bold"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block font-medium text-slate-300 mb-1">
                          {t('petitions.enterOtp')} (Sent to {maskedMobile})
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono text-center tracking-widest text-base"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={isVerifyingOtp || otpCode.length !== 6}
                            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50"
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
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
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

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>NIC Number: <span className="font-mono text-white">{nicNumber}</span></div>
                    <div>District: <span className="font-mono text-white">{district}</span></div>
                    <div>Verified Mobile: <span className="font-mono text-white">{maskedMobile}</span></div>
                    <div>DRP Ref: <span className="font-mono text-white">{drpResult?.drpTransactionId?.slice(-10)}</span></div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeToDemands}
                      onChange={(e) => setAgreeToDemands(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                    />
                    <span className="text-[11px] text-slate-300">
                      {t('petitions.agreeCheckbox')}
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentDataProcessing}
                      onChange={(e) => setConsentDataProcessing(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                    />
                    <span className="text-[11px] text-slate-300">
                      {t('petitions.consentCheckbox')}
                    </span>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/10"
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
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
