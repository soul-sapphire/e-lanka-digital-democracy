import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Mail,
  Smartphone
} from 'lucide-react';
import { decodeAndValidateSriLankanNIC, formatSriLankanDate, SriLankanNICDetails } from '@e-lanka/shared';
import { api, setAuthToken, setStoredUser } from '../services/api';

interface CitizenSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export const CitizenSignInModal: React.FC<CitizenSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [nicNumber, setNicNumber] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [channel, setChannel] = useState<'EMAIL' | 'MOBILE'>('EMAIL');

  // OTP Verification States (Dual Channel: Email OTP & Mobile Phone SMS)
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [otpReference, setOtpReference] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveNicDetails, setLiveNicDetails] = useState<SriLankanNICDetails | null>(null);

  useEffect(() => {
    const clean = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (clean.length >= 9) {
      const decoded = decodeAndValidateSriLankanNIC(clean);
      setLiveNicDetails(decoded);
    } else {
      setLiveNicDetails(null);
    }
  }, [nicNumber]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setError(null);
    const destination = channel === 'EMAIL' ? email.trim() : mobileNumber.trim();
    if (!destination) {
      setError(
        channel === 'EMAIL'
          ? 'Please enter your email address to receive the verification code.'
          : 'Please enter your Sri Lankan mobile number (+94).'
      );
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendMobileOTP(destination, channel);
      if (res.success && res.data) {
        setOtpDispatched(true);
        setOtpReference(res.data.otpReference);
        setMaskedDestination(res.data.mobileMasked);
        setResendCooldown(30);
        if (res.data.demoOtpCode) {
          setSandboxCode(res.data.demoOtpCode);
        }
      } else {
        setError(res.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP dispatch failed.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const destination = channel === 'EMAIL' ? email.trim() : mobileNumber.trim();
    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyMobileOTP(otpReference, destination, otpCode);
      if (res.success && res.data && res.data.verified) {
        setOtpVerified(true);
      } else {
        setError(res.error || 'Invalid 6-digit verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    let nicValidation: SriLankanNICDetails | null = null;
    if (cleanNIC) {
      nicValidation = decodeAndValidateSriLankanNIC(cleanNIC);
      if (!nicValidation.isValid) {
        setError(nicValidation.validationError || t('auth.invalidNic'));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.citizenLogin({
        nicNumber: cleanNIC || undefined,
        district,
        email: email.trim() || undefined
      });

      if (res && res.token && res.user) {
        // Enrich user session with verified citizen demographics for single-entry petition signing
        if (cleanNIC && nicValidation && nicValidation.isValid) {
          res.user.nicNumber = cleanNIC;
          res.user.isVerifiedCitizen = true;
          res.user.calculatedDOB = formatSriLankanDate(nicValidation.calculatedDOB);
          res.user.gender = nicValidation.gender;
          res.user.district = district;
          res.user.email = email.trim() || undefined;
          res.user.mobile = mobileNumber.trim() || undefined;
          res.user.isVoterEligible = nicValidation.isVoterEligible;
          res.user.nicDetails = nicValidation;
          res.user.tier1Verified = true;
          res.user.tier2Verified = true;

          // Attach full 3-Tier Proof of Life if OTP verified at login
          if (otpVerified) {
            res.user.otpVerified = true;
            res.user.verificationChannel = channel;
            res.user.verifiedDestination = maskedDestination;
            if (channel === 'EMAIL' && email.trim()) {
              res.user.verifiedEmail = email.trim();
            } else if (channel === 'MOBILE' && mobileNumber.trim()) {
              res.user.verifiedMobile = mobileNumber.trim();
            }
            res.user.tier3Verified = true;
          }
        }

        setAuthToken(res.token);
        setStoredUser(res.user);
        onSuccess(res.user);
        onClose();
        navigate('/profile');
      } else {
        setError(t('auth.signInFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.signInFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('auth.citizenSignIn')}</h3>
              <p className="text-[11px] text-slate-400">{t('auth.citizenSignInDesc')}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-lanka-gold font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Sri Lanka PDPA No. 9 of 2022 Protected</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your signature and identity are 100% secure. Protected under Sri Lanka PDPA No. 9 of 2022 with statutory non-retaliation safeguards.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {t('auth.nicLabel')}
              </label>
              <input
                type="text"
                placeholder="e.g. 199212345678 or 921234567V"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {t('auth.nicHint')}
              </span>

              {/* Live Mathematical Verification Feedback */}
              {liveNicDetails && (
                <div
                  className={`mt-2 p-2.5 rounded-lg border text-[11px] transition-all ${
                    liveNicDetails.isValid
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  {liveNicDetails.isValid ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Valid Sri Lankan NIC ({liveNicDetails.format})</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          {liveNicDetails.isVoterEligible ? 'Voter Eligible' : 'Non-Voter'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 flex items-center gap-3">
                        <span>DOB: <strong className="font-mono text-white">{formatSriLankanDate(liveNicDetails.calculatedDOB)}</strong></span>
                        <span>Gender: <strong className="font-mono text-white">{liveNicDetails.gender}</strong></span>
                        <span>Day: <strong className="font-mono text-white">{liveNicDetails.dayOfYear}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{liveNicDetails.validationError || t('auth.invalidNic')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {t('auth.districtLabel')}
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

            {/* Quota Division Channel Selector */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-lanka-gold" />
                  <span>{t('auth.chooseOtpChannel')}</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                  Traffic Division
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700/80">
                <button
                  type="button"
                  disabled={otpVerified}
                  onClick={() => {
                    setChannel('EMAIL');
                    setOtpDispatched(false);
                  }}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'EMAIL'
                      ? 'bg-amber-500/20 text-lanka-gold border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
                <button
                  type="button"
                  disabled={otpVerified}
                  onClick={() => {
                    setChannel('MOBILE');
                    setOtpDispatched(false);
                  }}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'MOBILE'
                      ? 'bg-amber-500/20 text-lanka-gold border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile SMS</span>
                </button>
              </div>

              {channel === 'EMAIL' ? (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="citizen@example.com"
                      value={email}
                      disabled={otpVerified || otpDispatched}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                    />
                    {!otpVerified && !otpDispatched && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !email.trim()}
                        className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50"
                      >
                        {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Code'}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Zero-cost Email delivery saves Sri Lankan mobile SMS quota.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Sri Lankan Mobile Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="0771234567 or +94771234567"
                      value={mobileNumber}
                      disabled={otpVerified || otpDispatched}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
                    />
                    {!otpVerified && !otpDispatched && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !mobileNumber.trim()}
                        className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50"
                      >
                        {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Code'}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Direct SMS to Dialog, Mobitel, Airtel, or Hutch (+94).
                  </span>
                </div>
              )}

              {/* OTP Code Entry Card */}
              {otpDispatched && !otpVerified && (
                <div className="pt-2 border-t border-slate-700 space-y-3">
                  {sandboxCode && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 text-amber-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Verification Code Generated
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(sandboxCode)}
                          className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors shadow-sm"
                        >
                          Auto-Fill: {sandboxCode}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-300">Your 6-Digit Code:</span>
                        <strong className="text-white font-mono text-base tracking-widest bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                          {sandboxCode}
                        </strong>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        ℹ️ Running in Sandbox mode. Once an API key is connected, codes are delivered directly to physical inboxes & SMS.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Code sent to <strong className="text-white">{maskedDestination}</strong>:</span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 font-mono">{resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="text-lanka-gold hover:underline font-semibold"
                      >
                        Resend
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
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono text-center tracking-widest text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap disabled:opacity-50"
                    >
                      {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                </div>
              )}

              {/* OTP Verified Success Banner */}
              {otpVerified && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t('auth.otpVerifiedBadge')} ({maskedDestination})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Tier 3 Complete</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                {t('auth.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shadow-md shadow-amber-500/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('auth.signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{otpVerified ? t('auth.verifyAndSignIn') : t('auth.signInBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure Administrative Portal Link */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              {t('auth.staffQuestion')}{' '}
              <Link
                to="/admin/login"
                onClick={onClose}
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 underline underline-offset-2 ml-1"
              >
                <Lock className="w-3 h-3" />
                <span>{t('auth.adminPortalLink')}</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
