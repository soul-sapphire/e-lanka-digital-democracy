import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { X, ShieldCheck, UserCheck, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (cleanNIC) {
      const oldNicRegex = /^[0-9]{9}[VX]$/;
      const newNicRegex = /^[0-9]{12}$/;
      if (!oldNicRegex.test(cleanNIC) && !newNicRegex.test(cleanNIC)) {
        setError('Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).');
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
        setAuthToken(res.token);
        setStoredUser(res.user);
        onSuccess(res.user);
        onClose();
        navigate('/dashboard');
      } else {
        setError('Sign in failed. Please verify your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Citizen sign in error.');
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
              <h3 className="text-lg font-bold text-white">Citizen Sign In</h3>
              <p className="text-[11px] text-slate-400">Access your personal civic dashboard & PDPA records</p>
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
                National Identity Card (NIC)
              </label>
              <input
                type="text"
                placeholder="e.g. 199212345678 or 921234567V"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Leave blank for demo citizen quick-session, or provide NIC to sync signed petitions.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Electoral District
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
                Email Address (Optional)
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure Administrative Portal Link */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Administrative Staff or Panel Moderator?{' '}
              <Link
                to="/admin/login"
                onClick={onClose}
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 underline underline-offset-2 ml-1"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login Portal</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
