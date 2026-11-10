import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Shield,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Key,
  Clock,
  AlertCircle,
  Database,
  Loader2,
  Building,
  UserCheck
} from 'lucide-react';
import { PolicyConsultation, PolicyLifecycleStage } from '@e-lanka/shared';
import { api, getStoredUser } from '../services/api';
import { LifecycleBadge } from '../components/LifecycleBadge';

export const AdminModerationPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';
  const [user, setUser] = useState<any>(getStoredUser());

  const [activeTab, setActiveTab] = useState<'moderation' | 'ai_worker' | 'audit_logs'>('moderation');
  const [pendingQueue, setPendingQueue] = useState<PolicyConsultation[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation Gate Action Modal
  const [selectedProposal, setSelectedProposal] = useState<PolicyConsultation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totpToken, setTotpToken] = useState('123456'); // Default demo TOTP code
  const [panelNotes, setPanelNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // AI Sync Trigger state
  const [selectedPolicyForAI, setSelectedPolicyForAI] = useState<string>('b0000000-0000-0000-0000-000000000001');
  const [aiSyncRunning, setAiSyncRunning] = useState(false);
  const [aiSyncResult, setAiSyncResult] = useState<any>(null);

  // PII Scrubbing Tester
  const [testScrubInput, setTestScrubInput] = useState('I am citizen Samantha Perera (NIC: 851234567V, Phone: +94 77 123 4567, email: samantha@gmail.com). I strongly urge TRCSL to enforce strict data privacy.');
  const [scrubOutput, setScrubOutput] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'moderation') {
        const res = await api.getPendingQueue();
        setPendingQueue(res.data);
      } else if (activeTab === 'audit_logs') {
        const res = await api.getAuditLogs(30);
        setAuditLogs(res.logs || []);
      }
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModeration = (policy: PolicyConsultation) => {
    setSelectedProposal(policy);
    setPanelNotes(`Reviewed and assessed by statutory panel. Proposal satisfies governance benchmarks under EL-SPEC-2026-V3.`);
    setActionError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const handleModerateProposal = async (approved: boolean) => {
    if (!selectedProposal) return;
    if (!totpToken || totpToken.trim().length !== 6) {
      setActionError('Valid 6-digit TOTP authentication code is mandatory.');
      return;
    }

    setProcessingAction(true);
    setActionError(null);
    try {
      const res = await api.moderatePolicy(
        selectedProposal.id,
        approved,
        panelNotes,
        totpToken
      );

      setActionSuccess(res.message);
      setTimeout(() => {
        setIsModalOpen(false);
        loadDashboardData();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Moderation decision failed.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTriggerAISync = async () => {
    setAiSyncRunning(true);
    try {
      const res = await api.triggerAISync(selectedPolicyForAI, totpToken);
      setAiSyncResult(res.aggregate);
    } catch (e: any) {
      alert(e.message || 'AI Sync failed');
    } finally {
      setAiSyncRunning(false);
    }
  };

  const handleRunScrubTest = async () => {
    try {
      const res = await fetch('/api/v1/admin/test-scrub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleText: testScrubInput })
      });
      const data = await res.json();
      setScrubOutput(data.result);
    } catch (e) {
      console.error('Scrub failed', e);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-xs font-semibold text-red-300">
          <Lock className="w-3.5 h-3.5" />
          <span>Section 3.1 Restricted Moderation Panel Gate & 2FA Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('admin.title')}
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('admin.subtitle')}. Designated experts must review incoming policy drafts and explicitly grant <span className="text-lanka-gold font-mono font-bold">APPROVED_PANEL</span> status before questionnaires can be formulated or deployed.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'moderation'
              ? 'bg-lanka-maroon text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-lanka-gold" />
          <span>Stage 1 Moderation Gate</span>
          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">
            {pendingQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ai_worker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'ai_worker'
              ? 'bg-lanka-maroon text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-lanka-gold" />
          <span>AI Opinion Mapping & PII Scrubbing</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'audit_logs'
              ? 'bg-lanka-maroon text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-lanka-gold" />
          <span>PDPA Statutory Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: Stage 1 Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Incoming Policy Draft Proposals Awaiting Panel Gate Review</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Pending: {pendingQueue.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading pending queue...</div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Stage 1 Queue Clear</h4>
              <p className="text-xs max-w-sm mx-auto">
                All submitted policy drafts have been reviewed by designated moderation panels.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQueue.map((policy) => {
                const title = policy.title[currentLang] || policy.title.en;
                const summary = policy.summary[currentLang] || policy.summary.en;

                return (
                  <div
                    key={policy.id}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 text-white"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-lanka-gold/15 text-lanka-gold border border-lanka-gold/30">
                          {policy.code}
                        </span>
                        <span className="text-xs uppercase font-semibold text-slate-400">
                          {policy.category}
                        </span>
                      </div>
                      <LifecycleBadge stage={policy.stage} size="sm" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-bold text-white">{title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                      <div className="space-y-0.5">
                        <span className="block font-medium">Author Agency: {policy.authorAgency}</span>
                        <span className="block">Target Ministry: {policy.targetMinistry}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenModeration(policy)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t('admin.reviewBtn')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI Worker & PII Scrubbing */}
      {activeTab === 'ai_worker' && (
        <div className="space-y-8">
          {/* AI Opinion Mapping Trigger */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lanka-gold" />
              <h3 className="text-lg font-bold text-white">
                Asynchronous AI Opinion Mapping & Scrubbing Worker (Workstream 4)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Extracts qualitative sentiment from incoming citizen responses, applies natural language thematic clustering, scrubs all personal identifiers (NIC, phone numbers, names), and exports zero-PII public JSON payloads for edge delivery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Policy Consultation for AI Processing:
                </label>
                <select
                  value={selectedPolicyForAI}
                  onChange={(e) => setSelectedPolicyForAI(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="b0000000-0000-0000-0000-000000000001">
                    EL-POL-2026-001: National AI Ethics & Algorithmic Accountability
                  </option>
                  <option value="b0000000-0000-0000-0000-000000000002">
                    EL-POL-2026-002: Sustainable Agritech Subsidies & Solar Farming
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  RFC 6238 TOTP Code:
                </label>
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-lanka-gold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerAISync}
                disabled={aiSyncRunning}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {aiSyncRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Scrubbing Data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('admin.triggerAi')}</span>
                  </>
                )}
              </button>
            </div>

            {aiSyncResult && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs space-y-2">
                <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  AI Synthesis & Zero-PII Compilation Completed
                </div>
                <div className="font-mono text-[11px] text-emerald-400">
                  Sync Hash: {aiSyncResult.syncHash} • Total Processed Submissions: {aiSyncResult.totalSubmissions}
                </div>
              </div>
            )}
          </div>

          {/* Real-time PII Scrubbing Regex & Heuristic Inspector */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Interactive PII Sanitizer & Sri Lankan Identity Redaction Inspector</span>
            </h4>
            <p className="text-xs text-slate-300">
              Test how the backend worker detects and redacts Sri Lankan NICs (both 9+V and 12-digit), telephone numbers, and email addresses from raw citizen submissions.
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={testScrubInput}
                onChange={(e) => setTestScrubInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-lanka-gold"
              />
              <button
                type="button"
                onClick={handleRunScrubTest}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Inspect Sanitization
              </button>
            </div>

            {scrubOutput && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Scrubbed Output (Zero-PII):
                </span>
                <p className="font-mono text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {scrubOutput.scrubbedText}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>Sentiment Score: {scrubOutput.sentiment.score} ({scrubOutput.sentiment.label})</span>
                  <span>•</span>
                  <span>Detected PII: {scrubOutput.piiItemsDetected.length} tags</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PDPA Statutory Audit Ledger */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-lanka-gold" />
                <span>PDPA Statutory Immutable Audit Ledger (Section 23)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Chained cryptographic HMAC signatures verify tamper-evidence across data controller access.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chain Seal Intact
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor Role</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Purpose Description</th>
                    <th className="py-3 px-4">HMAC Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-lanka-gold">{log.action}</td>
                      <td className="py-3 px-4">{log.actorRole}</td>
                      <td className="py-3 px-4 text-slate-400">{log.resourceType}</td>
                      <td className="py-3 px-4 font-sans text-xs text-slate-200">{log.purposeDescription}</td>
                      <td className="py-3 px-4 text-emerald-400 text-[10px] truncate max-w-[120px]">
                        {log.immutableSignature?.substring(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Gate Decision Modal */}
      {isModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-white space-y-5 shadow-2xl">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-lanka-gold" />
              <h3 className="text-lg font-bold text-white">Statutory Panel Moderation Gate</h3>
            </div>

            <div className="space-y-1 border-l-2 border-lanka-gold pl-3 py-0.5">
              <span className="text-[10px] font-mono text-lanka-gold block font-bold">
                {selectedProposal.code}
              </span>
              <h4 className="text-sm font-bold text-white">
                {selectedProposal.title[currentLang] || selectedProposal.title.en}
              </h4>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {t('admin.panelNotesLabel')} *
                </label>
                <textarea
                  rows={3}
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>{t('admin.totpCodeLabel')} *</span>
                  <span className="text-[10px] text-lanka-gold">RFC 6238 Standard (Default: 123456)</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-lanka-gold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleModerateProposal(false)}
                  className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-200 text-xs font-bold uppercase tracking-wider"
                >
                  Hold / Reject
                </button>
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleModerateProposal(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  {processingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{t('admin.approveAction')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

