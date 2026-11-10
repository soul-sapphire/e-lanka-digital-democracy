import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Key
} from 'lucide-react';
import { api, getStoredUser } from '../services/api';

export const CitizenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(getStoredUser());
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Right to Erasure dialog state
  const [showErasureModal, setShowErasureModal] = useState(false);
  const [erasureNic, setErasureNic] = useState('199256789012');
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
      // Reload engagement to show anonymized state
      loadEngagement();
    } catch (e) {
      console.error('Erasure failed', e);
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Section 3.3 Privacy-Preserving Citizen Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('dashboard.title')}
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Identity Decoupling Verification Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lanka-maroon/40 border border-lanka-gold/40 flex items-center justify-center text-lanka-gold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {t('dashboard.aliasLabel')}
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {engagement?.alias || user?.anonymizedAlias || 'Citizen-Western-9421'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-slate-300 font-medium">
              District: {engagement?.district || 'Colombo'}
            </span>
            <span className="text-xs bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Citizen
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block font-medium">Data Minimization</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified PDPA Sec 3
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block font-medium">Application Encryption</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> AES-256-GCM Active
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block font-medium">Identity Coupling</span>
            <span className="text-lanka-gold font-semibold flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Salted Blind Index (HMAC)
            </span>
          </div>
        </div>
      </div>

      {/* Erasure Notification Banner if executed */}
      {erasureResult && (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            Statutory Right to Erasure Executed under PDPA Section 14
          </div>
          <p>
            Your personal identifiable records have been scrubbed. Anonymized survey records: {erasureResult.anonymizedSurveyResponses}, Petition signatures decoupled: {erasureResult.anonymizedSignatures}. Immutable aggregate count preserved: {erasureResult.preservedAggregateCount}.
          </p>
          <div className="font-mono text-[10px] text-emerald-400 pt-1">
            PDPA Audit ID: {erasureResult.pdpaAuditId}
          </div>
        </div>
      )}

      {/* Activity Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signed Petitions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Vote className="w-4 h-4 text-lanka-gold" />
            <span>{t('dashboard.signedPetitions')}</span>
          </h3>

          <div className="space-y-3">
            {engagement?.signedPetitions?.map((pet: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-lanka-gold font-semibold">{pet.code}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                    {pet.status}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug">
                  {pet.title}
                </h4>
                <div className="text-[10px] text-slate-400 font-mono">
                  Signed: {new Date(pet.signedAt).toLocaleDateString()} • Decoupled
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participated Consultations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('dashboard.submittedSurveys')}</span>
          </h3>

          <div className="space-y-3">
            {engagement?.participatedConsultations?.map((pol: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-100 text-xs font-bold uppercase tracking-wider transition-all"
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
              Statutory Right to Erasure Request
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
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider"
              >
                {isErasing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Erasure</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

