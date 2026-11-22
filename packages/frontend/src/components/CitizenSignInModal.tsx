import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { X, ShieldCheck, UserCheck, Lock, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
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

  if (!isOpen) return null;

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
          res.user.isVoterEligible = nicValidation.isVoterEligible;
          res.user.nicDetails = nicValidation;
          res.user.tier1Verified = true;
          res.user.tier2Verified = true;
        }

        setAuthToken(res.token);
        setStoredUser(res.user);
        onSuccess(res.user);
        onClose();
        navigate('/dashboard');
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl relative">
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

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {t('auth.emailOptional')}
              </label>
              <input
                type="email"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
              />
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
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('auth.signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.signInBtn')}</span>
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
