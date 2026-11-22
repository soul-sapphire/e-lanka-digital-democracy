import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  Flag
} from 'lucide-react';

export const CodeOfConductView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto text-slate-300 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lanka-maroon/80 border border-lanka-gold/40 text-xs font-semibold text-lanka-gold">
          <Scale className="w-3.5 h-3.5" />
          <span>Civic Standards: Constructive Democratic Deliberation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Civic Code of Conduct & Hate Speech Prevention
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          E-Lanka is a multi-ethnic, trilingual civic platform built to foster democratic participation across Sri Lanka. To protect public safety, democratic integrity, and human dignity, all participants must abide by this Code of Conduct.
        </p>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Trilingual Pluralism
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Equal respect for Sinhala, Tamil, and English voices across all 25 administrative districts.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-lanka-gold font-bold text-xs uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            Evidence-Based
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Policy proposals must focus on governance, statutory reforms, socio-economic welfare, and public services.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Zero Hate Speech
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Strict compliance with the International Covenant on Civil & Political Rights (ICCPR) Act No. 56 of 2007.
          </p>
        </div>
      </div>

      {/* Prohibited Behaviors */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-500" />
          <span>Strictly Prohibited Conduct</span>
        </h2>
        <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
          Submissions, petition descriptions, and qualitative feedback violating the following rules will be rejected at the Stage 1 Moderation Gate or redacted prior to publication:
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 space-y-1">
            <h4 className="font-bold text-rose-300 text-xs sm:text-sm">
              1. Hate Speech & Incitement to Communal Hostility (ICCPR Act Section 3)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Any advocacy of national, racial, or religious hatred that constitutes incitement to discrimination, hostility, or violence against any community in Sri Lanka is strictly forbidden.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 space-y-1">
            <h4 className="font-bold text-rose-300 text-xs sm:text-sm">
              2. Doxxing & Non-Consensual Identity Exposure
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Publishing another citizen’s National ID, private phone number, residence address, or Grama Niladhari division without consent is a criminal violation and will be blocked by our automated PII sanitizers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 space-y-1">
            <h4 className="font-bold text-rose-300 text-xs sm:text-sm">
              3. Automated Manipulation & Sybil Attacks
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Using scripts, bots, fake identity sequences, or manipulated NICs to inflate signature counts or ballot tallies violates democratic due process and results in cryptographic blacklisting.
            </p>
          </div>
        </div>
      </div>

      {/* Moderation Workflow & Appeals */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>How Moderation Works: Two-Tier Safeguards</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lanka-gold" />
              Stage 1 Moderation Gate
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every proposal draft starts in private quarantine. An Expert Advisory Panel must authenticate with TOTP 2FA to verify adherence to this Code before advancing to public consultation.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Trilingual Automated Sanitization
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Background NLP workers screen submissions in Sinhala, Tamil, and English to sanitize PII and prevent doxxing before public aggregate publishing.
            </p>
          </div>
        </div>
      </div>

      {/* Reporting Violations */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Flag className="w-4 h-4 text-amber-400" />
          <span>Report a Code of Conduct Violation</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          If you observe a petition or policy consultation submission that violates this Code of Conduct, please notify the moderation panel immediately at <strong>moderation@cslk.org</strong> or use our <Link to="/security" className="text-lanka-gold underline">Incident Reporting Channel</Link>.
        </p>
      </div>
    </div>
  );
};
