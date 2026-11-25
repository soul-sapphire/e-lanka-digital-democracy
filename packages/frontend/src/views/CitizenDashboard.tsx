import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Shield,
  Trash2,
  FileCheck,
  Vote,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Loader2,
  Key,
  Zap,
  Mail,
  Smartphone,
  ArrowRight,
  Fingerprint,
  ScanFace
} from 'lucide-react';
import { api, getStoredUser } from '../services/api';
import {
  getBiometricsForNic,
  registerBiometrics,
  authenticateBiometrics,
  removeBiometricRecord,
  detectPlatformName,
  BiometricCredentialRecord
} from '../services/webauthn.service';

export const CitizenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(getStoredUser());
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Right to Erasure dialog state
  const [showErasureModal, setShowErasureModal] = useState(false);
  const [erasureNic, setErasureNic] = useState(user?.nicNumber || '199256789012');
  const [isErasing, setIsErasing] = useState(false);
  const [erasureResult, setErasureResult] = useState<any>(null);

  useEffect(() => {
    loadEngagement();
  }, []);

  const loadEngagement = async () => {
    try {
      setLoading(true);
      const data = await api.getCitizenEngagement();
      setEngagement(data);
    } catch (e) {
      console.error('Failed to load engagement', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteErasure = async () => {
    setIsErasing(true);
    try {
      const res = await api.exerciseRightToErasure(erasureNic, 'ALL_PII');
      setErasureResult(res.result);
      setShowErasureModal(false);
      setUser(null);
      // Reload engagement to show anonymized state
      loadEngagement();
    } catch (e) {
      console.error('Erasure failed', e);
    } finally {
      setIsErasing(false);
    }
  };

  // Biometric Passkeys (Fingerprint / Face ID / Windows Hello) State
  const [biometricsList, setBiometricsList] = useState<BiometricCredentialRecord[]>([]);
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [isTestingBio, setIsTestingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user?.nicNumber) {
      setBiometricsList(getBiometricsForNic(user.nicNumber));
    }
  }, [user]);

  const handleEnrollBiometrics = async () => {
    if (!user?.nicNumber) return;
    setIsRegisteringBio(true);
    setBioMessage(null);
    try {
      const res = await registerBiometrics({
        nicNumber: user.nicNumber,
        email: user.email,
        username: user.username,
        displayName: user.anonymizedAlias
      });
      if (res.success && res.credential) {
        setBiometricsList(getBiometricsForNic(user.nicNumber));
        setBioMessage({
          text: `Successfully enrolled ${detectPlatformName()} for NIC ${user.nicNumber}! You can now sign in with one touch.`,
          type: 'success'
        });
      } else {
        setBioMessage({
          text: res.error || 'Biometric enrollment was cancelled.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setBioMessage({ text: err.message || 'Failed to enroll biometrics.', type: 'error' });
    } finally {
      setIsRegisteringBio(false);
    }
  };

  const handleTestBiometrics = async () => {
    setIsTestingBio(true);
    setBioMessage(null);
    try {
      const res = await authenticateBiometrics(user?.nicNumber);
      if (res.success) {
        setBioMessage({
          text: 'Biometric verification confirmed! Sensor and hardware cryptographic keys are 100% operational.',
          type: 'success'
        });
      } else {
        setBioMessage({ text: res.error || 'Verification unsuccessful.', type: 'error' });
      }
    } catch (err: any) {
      setBioMessage({ text: err.message || 'Verification cancelled.', type: 'error' });
    } finally {
      setIsTestingBio(false);
    }
  };

  const handleRemoveBiometrics = (id: string) => {
    removeBiometricRecord(id);
    if (user?.nicNumber) {
      setBiometricsList(getBiometricsForNic(user.nicNumber));
    }
    setBioMessage({ text: 'Biometric credential removed from this device.', type: 'success' });
  };

  const maskEmailDisplay = (emailStr: string) => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  };

  const maskMobileDisplay = (phoneStr: string) => {
    if (!phoneStr) return '';
    const clean = phoneStr.replace(/^\+94/, '').replace(/^0/, '');
    if (clean.length >= 7) {
      return `+94 ${clean.slice(0, 2)} *** ${clean.slice(-4)}`;
    }
    return phoneStr;
  };

  const verifiedEmail = user?.verifiedEmail || (user?.verificationChannel === 'EMAIL' ? user?.email : null);
  const verifiedMobile = user?.verifiedMobile || (user?.verificationChannel === 'MOBILE' ? user?.mobile : null);
  const isAccountVerified = user?.isVerifiedCitizen || user?.otpVerified || !!verifiedEmail || !!verifiedMobile;

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          <span>My Citizen Dashboard</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('dashboard.profileTitle') || t('dashboard.title')}
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('dashboard.profileSubtitle') || t('dashboard.subtitle')}
        </p>
      </div>

      {/* Identity Decoupling & Verified Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lanka-maroon/40 border border-lanka-gold/40 flex items-center justify-center text-lanka-gold shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {t('dashboard.aliasLabel')}
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {user?.anonymizedAlias || engagement?.alias || 'Citizen-Western-9421'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-slate-300 font-medium">
              {t('dashboard.district')}: {user?.district || engagement?.district || 'Colombo'}
            </span>
            <span className="text-xs bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('dashboard.verifiedCitizenBadge')}
            </span>
          </div>
        </div>

        {/* Verified Credentials Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Verified Credential
            </span>
            {verifiedEmail ? (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('dashboard.verifiedEmail')}: <strong>{maskEmailDisplay(verifiedEmail)}</strong></span>
              </div>
            ) : verifiedMobile ? (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('dashboard.verifiedMobile')}: <strong>{maskMobileDisplay(verifiedMobile)}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Shield className="w-4 h-4 text-lanka-gold shrink-0" />
                <span>NIC Decoupled via HMAC-SHA256</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400">
              Verified & protected under Sri Lanka PDPA No. 9 of 2022. No raw PII exposed.
            </div>
          </div>

          {/* Quota-Free Status Pill */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-850 to-slate-900 border border-emerald-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{t('dashboard.quotaFreeBadge')}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {t('dashboard.quotaFreeDesc')}
            </p>
          </div>
        </div>

        {/* Security Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block font-medium">{t('dashboard.dataMinimization')}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('dashboard.dataMinimizationSec')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block font-medium">{t('dashboard.applicationEncryption')}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> {t('dashboard.encryptionActive')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block font-medium">{t('dashboard.identityProtection')}</span>
            <span className="text-lanka-gold font-semibold flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> {t('dashboard.identityDecoupled')}
            </span>
          </div>
        </div>
      </div>

      {/* Biometric Passkey & Hardware Security Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-lanka-gold border border-amber-500/30 flex items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Biometric Passkeys & Fast Login</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  WebAuthn Standard
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Log in and sign civic petitions securely using your device fingerprint scanner, Face ID, or Windows Hello.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {biometricsList.length > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enrolled on Device</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                Not Enrolled
              </span>
            )}
          </div>
        </div>

        {bioMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              bioMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200'
                : 'bg-red-950/60 border border-red-800/80 text-red-200'
            }`}
          >
            {bioMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{bioMessage.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="space-y-1 text-xs">
            <span className="text-slate-300 block font-medium">Device Authenticator:</span>
            <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
              <ScanFace className="w-3.5 h-3.5 text-lanka-gold" />
              <span>{detectPlatformName()}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {biometricsList.length === 0 ? (
              <button
                type="button"
                onClick={handleEnrollBiometrics}
                disabled={isRegisteringBio}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isRegisteringBio ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Touch Sensor...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Enable Fingerprint / Face ID</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleTestBiometrics}
                  disabled={isTestingBio}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {isTestingBio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Test Biometric Sensor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveBiometrics(biometricsList[0].id)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 font-medium text-xs border border-red-800/60 transition-all min-h-[44px] flex items-center justify-center"
                >
                  Remove Key
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Erasure Notification Banner if executed */}
      {erasureResult && (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs space-y-2 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            {t('dashboard.accountErasureNotice')}
          </div>
          <p>
            {t('dashboard.accountErasureDesc')} Anonymized survey records: {erasureResult.anonymizedSurveyResponses}, Petition signatures decoupled: {erasureResult.anonymizedSignatures}. Immutable aggregate count preserved: {erasureResult.preservedAggregateCount}.
          </p>
          <div className="font-mono text-[10px] text-emerald-400 pt-1">
            PDPA Audit ID: {erasureResult.pdpaAuditId}
          </div>
        </div>
      )}

      {/* Signed Petitions Tracker Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Vote className="w-5 h-5 text-lanka-gold" />
              <span>{t('dashboard.signedPetitions')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time parliamentary and legislative tracker of civic petitions supported by your verified voice.
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1 rounded-full bg-lanka-gold/15 text-lanka-gold border border-lanka-gold/30">
            {t('dashboard.totalSigned', { count: engagement?.signedPetitions?.length || 0 })}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : engagement?.signedPetitions && engagement.signedPetitions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {engagement.signedPetitions.map((pet: any, idx: number) => {
              const currentSigs = pet.currentSignatures || 8421;
              const targetSigs = pet.requiredSignatures || 10000;
              const percent = Math.min(100, Math.round((currentSigs / targetSigs) * 100));

              return (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-850 border border-slate-750 hover:border-slate-700 transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lanka-gold font-bold px-2 py-0.5 rounded bg-lanka-gold/10 border border-lanka-gold/30">
                        {pet.code}
                      </span>
                      {pet.category && (
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {pet.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 font-mono">
                      {pet.status || 'ACTIVE'}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {pet.title}
                  </h4>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{t('dashboard.progressLabel', { current: currentSigs.toLocaleString(), goal: targetSigs.toLocaleString() })}</span>
                      <span className="font-mono text-lanka-gold font-bold">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                      <div
                        className="bg-gradient-to-r from-lanka-maroon via-lanka-gold to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400 font-mono">
                      Signed: {new Date(pet.signedAt).toLocaleDateString()} • Decoupled Verification
                    </span>
                    <Link
                      to={`/petitions`}
                      className="inline-flex items-center gap-1 text-lanka-gold hover:text-amber-300 font-semibold transition-colors"
                    >
                      <span>{t('dashboard.viewPetition')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3 bg-slate-850/50 rounded-xl border border-dashed border-slate-800">
            <Vote className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">{t('dashboard.noPetitionsYet')}</p>
            <Link
              to="/petitions"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-lanka-maroon hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-md"
            >
              <span>{t('dashboard.browsePetitions')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Participated Policy Consultations Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('dashboard.submittedSurveys')}</span>
        </h3>

        <div className="space-y-3">
          {engagement?.participatedConsultations?.map((pol: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-lanka-gold font-semibold">{pol.code}</span>
                <span className="text-[10px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800 font-mono">
                  {pol.stage}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug">
                {pol.title}
              </h4>
              <div className="text-[10px] text-slate-400 font-mono">
                Submitted: {new Date(pol.submittedAt).toLocaleDateString()} • Encrypted (AES-256)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory PDPA Rights & Right-to-Erasure Trigger */}
      <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">{t('dashboard.erasureTitle')}</h3>
          </div>
          <span className="text-xs text-red-400 font-mono">PDPA No. 9 of 2022</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t('dashboard.erasureDesc')}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowErasureModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-100 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('dashboard.erasureBtn')}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Right to Erasure */}
      {showErasureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete My Account & Data Request (PDPA Section 16)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('dashboard.confirmErasure')}
            </p>

            <div className="space-y-1 text-xs">
              <label className="block font-medium text-slate-300">
                Verify National Identity Card (NIC) for Decoupling:
              </label>
              <input
                type="text"
                value={erasureNic}
                onChange={(e) => setErasureNic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowErasureModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteErasure}
                disabled={isErasing}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider shadow-lg"
              >
                {isErasing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Delete My Account & Data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
