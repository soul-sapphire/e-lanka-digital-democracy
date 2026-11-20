import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Shield,
  Key,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { api, setAuthToken, setStoredUser } from '../services/api';

export const AdminLoginView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@cslk.org');
  const [password, setPassword] = useState('E-LankaAdmin2026!');
  const [role, setRole] = useState<'PANEL_MODERATOR' | 'POLICY_ADMIN' | 'SYSTEM_AUDITOR'>('PANEL_MODERATOR');
  const [totpToken, setTotpToken] = useState('123456');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Administrative email and password are required.');
      return;
    }

    if (!totpToken || totpToken.trim().length !== 6) {
      setError('A valid 6-digit TOTP authentication code is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.adminLogin({
        email: email.trim(),
        password,
        role,
        totpToken: totpToken.trim()
      });

      if (res && res.token && res.user) {
        setAuthToken(res.token);
        setStoredUser(res.user);
        navigate('/admin');
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Administrative login rejected.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top security accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Admin Login Portal</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 font-bold">
                  RESTRICTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory moderation, policy lifecycle governance, & audit ledger inspection
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Multi-Factor Administrative Access Control Enforced</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In accordance with Sri Lanka PDPA Section 23 and security specifications, access to administrative functions requires verified staff credentials and RFC 6238 TOTP two-factor authentication.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Administrative Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@cslk.org"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Administrative Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Select Administrative Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PANEL_MODERATOR')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    role === 'PANEL_MODERATOR'
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">PANEL_MODERATOR</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Stage 1 Review & Approval</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('POLICY_ADMIN')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    role === 'POLICY_ADMIN'
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">POLICY_ADMIN</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Publish & AI Sync</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('SYSTEM_AUDITOR')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    role === 'SYSTEM_AUDITOR'
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">SYSTEM_AUDITOR</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">PDPA Ledger Audit</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>RFC 6238 2FA Code (Google Authenticator / FreeOTP) *</span>
                <span className="text-[10px] text-amber-400 font-mono">Demo: 123456</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono tracking-widest text-center text-sm"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate & Access Moderation Gate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Institutional Credentials Testing Callout */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-lanka-gold" />
              <span>Official Test Administrative Credentials:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-0.5 text-slate-300 font-mono text-[10px]">
              <div>Email: <span className="text-white">admin@cslk.org</span></div>
              <div>Password: <span className="text-white">E-LankaAdmin2026!</span></div>
              <div>2FA Code: <span className="text-white">123456</span></div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">
              ← Return to Policy Hub
            </Link>
            <Link to="/dashboard" className="text-lanka-gold hover:underline">
              Citizen Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
