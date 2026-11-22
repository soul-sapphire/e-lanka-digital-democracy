import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Lock,
  FileText,
  Key,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto text-slate-300 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300">
          <Shield className="w-3.5 h-3.5" />
          <span>Statutory Compliance: Sri Lanka PDPA No. 9 of 2022</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Privacy Policy & Statutory PDPA Notice
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          The E-Lanka Digital Democracy Platform is operated by Community Solutions Lanka (CSLK). This notice outlines how citizen data is protected, minimized, and decoupled under Sri Lanka's Personal Data Protection Act (PDPA), No. 9 of 2022.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400 font-mono">
          <span>Effective Date: January 1, 2026</span>
          <span>•</span>
          <span>Last Audited: February 2026</span>
          <span>•</span>
          <span className="text-emerald-400">Statutory Version: EL-PDPA-2026-V3</span>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            Zero Raw PII Stored
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            National IDs (NICs) undergo salted HMAC-SHA256 blind indexing. Raw credentials are never stored in public indexes.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-lanka-gold font-bold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4" />
            AES-256-GCM FLE
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Open-text consultation feedback is encrypted at the application layer before reaching database storage.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Trash2 className="w-4 h-4" />
            Statutory Erasure
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Under Section 16 & Section 14, citizens can execute immediate one-click data erasure from their dashboard.
          </p>
        </div>
      </div>

      {/* Section 1: Data Minimization & Purpose Limitation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-lanka-gold font-mono">01.</span>
          <span>Data Minimization & Lawful Purpose (Part I, PDPA No. 9 of 2022)</span>
        </h2>
        <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
          In strict compliance with Section 6 of the Act, E-Lanka collects only the minimal data strictly necessary to fulfill civic consultation and verified petitioning purposes.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-800/80 text-slate-200">
              <tr>
                <th className="p-3">Data Category</th>
                <th className="p-3">What We Collect</th>
                <th className="p-3">What We NEVER Collect</th>
                <th className="p-3">Retention Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-white">Citizenship Verification</td>
                <td className="p-3">Salted HMAC-SHA256 blind hash of NIC (one-way mathematical digest)</td>
                <td className="p-3 text-red-300">Raw NIC copy, biometric photos, fingerprints</td>
                <td className="p-3 font-mono">Consultation + 12 Mo.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Consultation Responses</td>
                <td className="p-3">AES-256-GCM encrypted survey inputs and policy ratings</td>
                <td className="p-3 text-red-300">Unencrypted identifiers, device IMEI, GPS coordinates</td>
                <td className="p-3 font-mono">Consultation + 12 Mo.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">E-Petition Signatures</td>
                <td className="p-3">Blind hash, electoral district name, timestamp</td>
                <td className="p-3 text-red-300">Personal phone book, real full name linked to signature</td>
                <td className="p-3 font-mono">Until parliamentary tabling</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Statutory Data Subject Rights */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-lanka-gold font-mono">02.</span>
          <span>Your Statutory Rights as a Sri Lankan Citizen (Part II)</span>
        </h2>
        <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
          Under the Personal Data Protection Act, No. 9 of 2022, every citizen participating on E-Lanka has legally enforceable rights:
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center justify-between">
              <span>Section 13 — Right of Access to Personal Data</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">ENFORCEABLE</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have the right to inspect all records held in connection with your anonymous participation alias via the <Link to="/dashboard" className="text-lanka-gold underline">Citizen Tracker Dashboard</Link>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center justify-between">
              <span>Section 14 — Right to Withdraw Consent & Object to Processing</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">ENFORCEABLE</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consent is voluntary. You may withdraw consent at any time without penalty or retaliation, halting any further processing.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center justify-between">
              <span>Section 16 — Right to Erasure ("Right to be Forgotten")</span>
              <span className="text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">ONE-CLICK AUTOMATED</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When invoked, all encrypted qualitative commentary is zeroed out, blind indexes are overwritten with irreversible tombstones (<code className="text-red-300 bg-slate-950 px-1 py-0.5 rounded">ERASED_PDPA_SEC_16</code>), and personal links are destroyed. Overall vote counts remain intact to prevent census vandalism.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Anonymity Guarantee & Non-Linkability */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-lanka-gold font-mono">03.</span>
          <span>The Non-Linkability Guarantee: Why Admins Cannot Spy on Signatures</span>
        </h2>
        <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
          During the Workstream 6 security review, our architecture was audited to guarantee complete secret-ballot non-linkability:
        </p>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
          <li><strong>No Foreign Key Relations:</strong> Petition signatures contain no user account foreign key, IP address, or session ID.</li>
          <li><strong>Zero PII in Signature Tables:</strong> When signing an e-petition, your real name and email are used solely for real-time format validation and are <em>never</em> written to the signature row.</li>
          <li><strong>Mathematically Irreversible:</strong> Even if an adversary obtains database root access and the master encryption key, they cannot reverse-engineer which citizen signed which petition.</li>
        </ul>
      </div>

      {/* Section 4: Contact & DPO */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-lanka-gold" />
          <span>Data Protection Officer & Statutory Inquiries</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          For inquiries regarding personal data protection, statutory erasure, or to file a formal request under the PDPA:
        </p>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
          <div>Data Protection Officer: <strong>dpo@cslk.org</strong></div>
          <div>Statutory Entity: <strong>Community Solutions Lanka (CSLK)</strong></div>
          <div>Regulatory Appeal: <strong>Data Protection Authority of Sri Lanka (DPA)</strong></div>
        </div>
      </div>
    </div>
  );
};
