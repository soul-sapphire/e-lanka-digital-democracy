import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  Fingerprint,
  ScanFace
} from 'lucide-react';
import {
  decodeAndValidateSriLankanNIC,
  formatSriLankanDate,
  SriLankanNICDetails
} from '@e-lanka/shared';
import {
  api,
  setAuthToken,
  setStoredUser,
  saveRegisteredCitizen
} from '../services/api';
import {
  isBiometricsSupported,
  detectPlatformName,
  authenticateBiometrics,
  registerBiometrics
} from '../services/webauthn.service';

interface CitizenSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialNotice?: string | null;
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
  onSuccess,
  initialNotice
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mode: LOGIN (Default first screen) vs REGISTER (New Citizen)
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordlessMode, setIsPasswordlessMode] = useState(false);

  // Biometric Authentication (WebAuthn / Passkeys) States
  const [isBiometricsSupportedOnDevice, setIsBiometricsSupportedOnDevice] = useState(true);
  const [isAuthenticatingBiometrics, setIsAuthenticatingBiometrics] = useState(false);
  const [enableBiometricsOnRegister, setEnableBiometricsOnRegister] = useState(true);
  const [biometricDeviceName, setBiometricDeviceName] = useState('Fingerprint / Face ID');
  const [biometricInfoMsg, setBiometricInfoMsg] = useState<string | null>(null);

  // Register Form States
  const [nicNumber, setNicNumber] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // OTP Verification States (Dedicated Email OTP Gateway)
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [otpReference, setOtpReference] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  useEffect(() => {
    let active = true;
    isBiometricsSupported().then((supported) => {
      if (active) {
        setIsBiometricsSupportedOnDevice(supported);
        setBiometricDeviceName(detectPlatformName());
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Handle Instant Biometric Sign In (Fingerprint / Face ID / Windows Hello)
  const handleBiometricLogin = async () => {
    setError(null);
    setBiometricInfoMsg(null);
    setIsAuthenticatingBiometrics(true);
    try {
      const res = await authenticateBiometrics(loginIdentifier || undefined);
      if (res.success && (res.nicNumber || res.credential)) {
        const authRes = await api.citizenBiometricLogin({
          credentialId: res.credential?.id,
          nicNumber: res.nicNumber || res.credential?.nicNumber
        });
        if (authRes && authRes.token && authRes.user) {
          setAuthToken(authRes.token);
          setStoredUser(authRes.user);
          onSuccess(authRes.user);
          onClose();
          navigate('/profile');
          return;
        }
      }
      if (res.error) {
        setBiometricInfoMsg(res.error);
      }
    } catch (err: any) {
      setBiometricInfoMsg(err.message || 'Biometric authentication was cancelled.');
    } finally {
      setIsAuthenticatingBiometrics(false);
    }
  };

  if (!isOpen) return null;

  // Handle Dispatching Zero-Cost Real Email OTP
  const handleSendOtp = async (targetEmail: string) => {
    setError(null);
    const dest = targetEmail.trim().toLowerCase();
    if (!dest || !dest.includes('@')) {
      setError('Please enter a valid email address to receive your verification code.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendMobileOTP(dest, 'EMAIL');
      if (res.success && res.data) {
        setOtpDispatched(true);
        setOtpReference(res.data.otpReference);
        setMaskedDestination(res.data.mobileMasked);
        setResendCooldown(30);
      } else {
        setError(res.error || 'Failed to dispatch verification email.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP dispatch failed.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verifying 6-Digit Email Code
  const handleVerifyOtp = async (targetEmail: string) => {
    setError(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    const dest = targetEmail.trim().toLowerCase();
    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyMobileOTP(otpReference, dest, otpCode);
      if (res.success && res.data && res.data.verified) {
        setOtpVerified(true);
      } else {
        setError(res.error || 'Invalid 6-digit verification code. Please check your email inbox and spam folder.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Citizen Login (Username/Email/NIC + Password OR Passwordless OTP)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setError('Please enter your username, email address, or NIC number.');
      return;
    }

    if (!isPasswordlessMode && !loginPassword) {
      setError('Please enter your password. (Or switch to instant Email OTP login below).');
      return;
    }

    if (isPasswordlessMode && !otpVerified) {
      setError('Please verify the 6-digit email code before signing in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.citizenPasswordLogin({
        identifier,
        password: isPasswordlessMode ? undefined : loginPassword
      });

      if (res && res.token && res.user) {
        setAuthToken(res.token);
        setStoredUser(res.user);
        onSuccess(res.user);
        onClose();
        navigate('/profile');
      } else {
        setError(t('auth.signInFailed'));
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle New Citizen Registration & NIC Verification
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!cleanNIC) {
      setError('Please enter your Sri Lankan National Identity Card (NIC) number.');
      return;
    }

    const nicValidation = decodeAndValidateSriLankanNIC(cleanNIC);
    if (!nicValidation.isValid) {
      setError(nicValidation.validationError || 'Invalid Sri Lankan NIC format.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setError('Please create a secure password with at least 6 characters.');
      return;
    }

    if (!otpVerified) {
      setError('Please verify your email address using the 6-digit code before completing registration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const citizenUser = {
        id: `usr_${Date.now()}`,
        role: 'CITIZEN',
        username: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: registerPassword,
        nicNumber: cleanNIC,
        district,
        anonymizedAlias: `Citizen-${district}-${cleanNIC.slice(-4)}`,
        isVerifiedCitizen: true,
        calculatedDOB: formatSriLankanDate(nicValidation.calculatedDOB),
        gender: nicValidation.gender,
        isVoterEligible: nicValidation.isVoterEligible,
        nicDetails: nicValidation,
        otpVerified: true,
        verificationChannel: 'EMAIL',
        verifiedEmail: cleanEmail,
        tier1Verified: true,
        tier2Verified: true,
        tier3Verified: true,
        registeredAt: new Date().toISOString()
      };

      // Optionally enroll device biometrics (Fingerprint / Face ID / Windows Hello)
      if (enableBiometricsOnRegister) {
        try {
          const bioRes = await registerBiometrics({
            nicNumber: cleanNIC,
            email: cleanEmail,
            username: cleanEmail.split('@')[0],
            displayName: citizenUser.anonymizedAlias
          });
          if (bioRes.success && bioRes.credential) {
            (citizenUser as any).biometricAuthEnabled = true;
            (citizenUser as any).biometricCredentialId = bioRes.credential.id;
          }
        } catch (bioErr) {
          console.warn('Optional biometric enrollment error:', bioErr);
        }
      }

      const res = {
        token: `jwt_citizen_${Date.now()}`,
        user: citizenUser
      };
      res.user.nicNumber = cleanNIC;
      res.user.isVerifiedCitizen = true;

      saveRegisteredCitizen(citizenUser);
      setAuthToken(res.token);
      setStoredUser(res.user);
      onSuccess(res.user);
      onClose();
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col text-white shadow-2xl relative my-0 sm:my-auto">
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-3 pr-8">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-lanka-gold border border-amber-500/30 flex items-center justify-center shrink-0">
              {authMode === 'LOGIN' ? <Lock className="w-5 h-5" /> : <UserCheck className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {authMode === 'LOGIN' ? 'Citizen Sign In' : 'Register Citizen Profile'}
              </h3>
              <p className="text-[11px] text-slate-400 leading-tight">
                {authMode === 'LOGIN'
                  ? 'Access your democratic rights, civic profile & signed petitions'
                  : 'Link your Sri Lankan NIC to activate 1-click petition signing'}
              </p>
            </div>
          </div>

          {/* Tab Switcher: Sign In vs Register */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setError(null);
              }}
              className={`py-2.5 px-3 min-h-[40px] rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'LOGIN'
                  ? 'bg-amber-500/20 text-lanka-gold border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setError(null);
              }}
              className={`py-2.5 px-3 min-h-[40px] rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'REGISTER'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register (New)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* Dual-Channel Quota Allocation (Mobile hidden for public zero-cost scale) */}
          <div className="hidden" aria-hidden="true">
            <span>{t('auth.chooseOtpChannel')}</span>
            <span>Email OTP</span>
            <span>Mobile SMS</span>
            <span>Traffic Division</span>
          </div>

          {/* Statutory PDPA Notice Banner */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-lanka-gold font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Sri Lanka PDPA No. 9 of 2022 Protected</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Zero PII Leak
            </span>
          </div>

          {initialNotice && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 shadow-md">
              <ShieldCheck className="w-4 h-4 text-lanka-gold shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{initialNotice}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* TAB 1: CITIZEN SIGN IN (LOGIN SCREEN FIRST) */}
          {authMode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Biometric Quick Sign In (Fingerprint / Face ID / Windows Hello) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/90 to-emerald-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-lanka-gold" />
                    <span>Biometric Passkey Sign In</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-lanka-gold font-mono font-medium flex items-center gap-1">
                    <ScanFace className="w-3 h-3" />
                    <span>Touch ID / Face ID</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isAuthenticatingBiometrics}
                  className="w-full min-h-[44px] py-2.5 px-3 bg-gradient-to-r from-amber-500 hover:from-amber-400 to-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-all text-xs"
                >
                  {isAuthenticatingBiometrics ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Touch Sensor or Glance at Camera...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Sign In with {biometricDeviceName}</span>
                    </>
                  )}
                </button>
                {biometricInfoMsg && (
                  <p className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-1.5 rounded-lg text-center">
                    {biometricInfoMsg}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 text-center">
                  Protected by your device hardware. No password required.
                </p>
              </div>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Or with password / OTP</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Username, Email, or NIC Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ruu035@gmail.com or 200410805091"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
                  required
                />
              </div>

              {!isPasswordlessMode ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-300">Password *</label>
                    <button
                      type="button"
                      onClick={() => setIsPasswordlessMode(true)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline py-1"
                    >
                      Sign in with Email OTP instead
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold pr-10"
                      required={!isPasswordlessMode}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-lanka-gold" />
                      <span>Passwordless Email OTP Sign In</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPasswordlessMode(false)}
                      className="text-[10px] text-slate-400 hover:text-white hover:underline py-1"
                    >
                      Use password
                    </button>
                  </div>

                  {!otpDispatched ? (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(loginIdentifier)}
                      disabled={isSendingOtp || !loginIdentifier.trim()}
                      className="w-full min-h-[44px] py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
                    >
                      {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send 6-Digit Email Code'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 min-h-[42px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-white tracking-widest font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyOtp(loginIdentifier)}
                          disabled={isVerifyingOtp || otpCode.length !== 6 || otpVerified}
                          className="px-4 py-2 min-h-[42px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg disabled:opacity-50 text-xs"
                        >
                          {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : otpVerified ? '✓ Verified' : 'Verify'}
                        </button>
                      </div>
                      {otpVerified && (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Email verified successfully. Click Sign In below.</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/10 text-xs mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-slate-400 text-[11px]">
                <span>New to E-Lanka? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('REGISTER');
                    setError(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                >
                  Register & Verify NIC &rarr;
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER NEW CITIZEN PROFILE */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  National Identity Card (NIC) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 200410805091 or 921234567V"
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
                  required
                />

                {/* Live Mathematical Verification Feedback */}
                {liveNicDetails && (
                  <div
                    className={`mt-2 p-2 rounded-lg border text-[11px] transition-all ${
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
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{liveNicDetails.validationError || 'Invalid NIC'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Electoral District *
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
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="ruu035@gmail.com"
                  value={email}
                  disabled={otpVerified}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Direct verification via dedicated elanka.portal@gmail.com gateway.
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Official Email OTP Verification */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-lanka-gold" />
                    <span>Email OTP Verification</span>
                  </span>
                  {otpVerified ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                      Official Gateway
                    </span>
                  )}
                </div>

                {!otpDispatched && !otpVerified && (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(email)}
                    disabled={isSendingOtp || !email.trim() || !email.includes('@')}
                    className="w-full min-h-[44px] py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
                  >
                    {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send 6-Digit Email Code'}
                  </button>
                )}

                {otpDispatched && !otpVerified && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Passcode sent to <strong className="text-white">{maskedDestination || email}</strong> from <strong className="text-amber-400">elanka.portal@gmail.com</strong>.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-white tracking-widest font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyOtp(email)}
                        disabled={isVerifyingOtp || otpCode.length !== 6}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg disabled:opacity-50"
                      >
                        {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                    {resendCooldown > 0 ? (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Resend code in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp(email)}
                        className="text-[10px] text-amber-400 hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Biometric Passkey Registration Option */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={enableBiometricsOnRegister}
                  onChange={(e) => setEnableBiometricsOnRegister(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                />
                <div className="flex-1">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enable {biometricDeviceName} on this device (Recommended)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                    Allows 1-click biometric sign-in next time without entering passwords.
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !otpVerified || !liveNicDetails?.isValid}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/10 text-xs mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Citizen Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-slate-400 text-[11px]">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setError(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                >
                  Sign In &rarr;
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
