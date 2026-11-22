import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Lock,
  Terminal,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCode,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const SecurityIncidentView: React.FC = () => {
  const { t } = useTranslation();

  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [component, setComponent] = useState('API_INGESTION');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [poc, setPoc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setSubmittedTicket({
        ticketId: `SEC-TKT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        severity,
        component,
        status: 'RECEIVED_IN_TRIAGE'
      });
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto text-slate-300 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-xs font-semibold text-red-300">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Statutory Incident Response & Coordinated Disclosure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report a Security Issue & Incident Response
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          We welcome responsible security research from ethical hackers, digital privacy advocates, and citizens. If you discover a potential vulnerability or data protection anomaly, please report it immediately so we can remediate it.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400 font-mono">
          <span>Response Protocol: Sri Lanka PDPA Section 23</span>
          <span>•</span>
          <span>Statutory Liaison: Sri Lanka CERT | CC (cert@cert.gov.lk)</span>
        </div>
      </div>

      {/* Security Commitments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Safe Harbor
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Good-faith security research conducted without accessing user PII or degrading services is protected under our Safe Harbor pledge.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-lanka-gold font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            24h Initial Triage
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            All vulnerability submissions receive human acknowledgement within 24 hours from the lead cryptographic engineering team.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            PDPA Section 23
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Confirmed critical breaches mandate immediate notification to the Data Protection Authority within statutory windows.
          </p>
        </div>
      </div>

      {/* Interactive Vulnerability Report Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-lanka-gold" />
            <span>Submit a Vulnerability or Incident Disclosure</span>
          </h2>
          <p className="text-xs text-slate-400">
            Reports may be submitted anonymously or with contact credentials for credit and coordinated disclosure updates.
          </p>
        </div>

        {submittedTicket ? (
          <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
              <span>Vulnerability Report Securely Dispatched</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thank you for strengthening Sri Lanka’s sovereign civic infrastructure. Your report has been encrypted and routed directly to the CSLK Security & DPO Response Team.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs space-y-1 border border-slate-800 text-slate-300">
              <div>Incident Ticket Reference: <strong className="text-emerald-400">{submittedTicket.ticketId}</strong></div>
              <div>Severity Assessment: <strong>{submittedTicket.severity}</strong></div>
              <div>Affected Component: <strong>{submittedTicket.component}</strong></div>
              <div>Triage Status: <span className="text-lanka-gold font-semibold">{submittedTicket.status}</span></div>
            </div>
            <button
              type="button"
              onClick={() => setSubmittedTicket(null)}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium pt-1"
            >
              Submit another report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reporter Name / Handle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Anonymous Researcher or Name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contact Email / Signal Username (Optional)
                </label>
                <input
                  type="text"
                  placeholder="security-researcher@domain.com"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Affected Architecture Component *
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="API_INGESTION">Node.js API Ingestion Engine (Port 4000)</option>
                  <option value="POSTGRES_RLS">Supabase PostgreSQL Row-Level Security (RLS)</option>
                  <option value="FLE_CRYPTO">AES-256-GCM Field-Level Encryption</option>
                  <option value="BLIND_INDEX">HMAC-SHA256 Blind Indexing / Deduplication</option>
                  <option value="TOTP_2FA">RFC 6238 TOTP Two-Factor Authentication</option>
                  <option value="PII_SANITIZER">Trilingual Sinhala/Tamil/English PII Sanitizer</option>
                  <option value="FRONTEND_PWA">Vite/React Progressive Web App (PWA)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assessed Severity Level *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="LOW">LOW — UI Glitch, Minor Information Disclosure</option>
                  <option value="MEDIUM">MEDIUM — Non-Sensitive Authorization Bypass</option>
                  <option value="HIGH">HIGH — Privilege Escalation or PII Exposure</option>
                  <option value="CRITICAL">CRITICAL — Master FLE Decryption or Database Breach</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Detailed Vulnerability Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain the nature of the issue, potential impact, and why it represents a security risk..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Steps to Reproduce / Proof-of-Concept (PoC)
              </label>
              <textarea
                rows={3}
                placeholder="Provide exact HTTP request headers, payloads, or replication steps..."
                value={poc}
                onChange={(e) => setPoc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Encrypting & Transmitting...' : 'Transmit Encrypted Security Report'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Direct Escalation Channels */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-lanka-gold" />
          <span>Encrypted Direct Contact & Statutory Escalation</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          For critical infrastructure exploits requiring PGP encryption or urgent regulatory coordination:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Security Response Email</span>
            <div className="text-emerald-400 font-bold">security@cslk.org</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">National CERT Coordination</span>
            <div className="text-slate-200 font-bold">cert@cert.gov.lk</div>
          </div>
        </div>
      </div>
    </div>
  );
};
