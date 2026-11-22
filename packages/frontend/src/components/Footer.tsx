import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Shield, Lock, ExternalLink, Cpu, Heart, AlertTriangle, FileText, Users, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Platform Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-lanka-maroon border border-lanka-gold/50 flex items-center justify-center text-lanka-gold font-bold text-xs">
                EL
              </div>
              <span className="font-bold text-white text-sm">E-LANKA DEMOCRACY</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sri Lanka's sovereign civic engagement ecosystem designed for transparent policy formulation, verified e-petitioning, and privacy-preserving public consultation.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-lanka-gold font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Pure React PWA • Zero-PHP Engine</span>
            </div>
          </div>

          {/* Column 2: Legal & Statutory Protection */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Legal & Statutory
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compliant with Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022. Guarantees data minimization, right to erasure (Section 16), and statutory auditability (Sections 12 & 21).
            </p>
            <div className="pt-1 flex flex-col space-y-1.5 font-medium">
              <Link
                to="/privacy"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Privacy Policy & PDPA Notice</span>
              </Link>
              <Link
                to="/code-of-conduct"
                className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Civic Code of Conduct</span>
              </Link>
            </div>
          </div>

          {/* Column 3: Security & Incident Reporting */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Security & Integrity
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Field-level AES-256-GCM encryption, blind indexing, and transparent PDPA Section 23 incident disclosure protocols.
            </p>
            <div className="pt-1 flex flex-col space-y-1.5 font-medium">
              <Link
                to="/security"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Vulnerability / Incident</span>
              </Link>
              <Link
                to="/academy"
                className="text-lanka-gold hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Democracy Academy (LMS)</span>
              </Link>
            </div>
          </div>

          {/* Column 4: About & Organization */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              About & Contact
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convened by the Centre for Society and Learning Sri Lanka (CSLK) in collaboration with civic and digital partners.
            </p>
            <div className="pt-1 flex flex-col space-y-1.5 font-medium">
              <Link
                to="/about"
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>About CSLK & Contact Us</span>
              </Link>
              <a
                href="https://www.cslk.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Official Site: cslk.org</span>
              </a>
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1">
              <Lock className="w-3 h-3" />
              Non-retaliation citizen protections active
            </p>
          </div>
        </div>

        {/* Essential Legal & Security Quick Links Bar */}
        <div className="py-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
          <Link to="/privacy" className="hover:text-lanka-gold transition-colors">
            Privacy Policy (PDPA)
          </Link>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <Link to="/code-of-conduct" className="hover:text-lanka-gold transition-colors">
            Civic Code of Conduct
          </Link>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <Link to="/security" className="hover:text-lanka-gold transition-colors">
            Security & Incident Protocol
          </Link>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <Link to="/about" className="hover:text-lanka-gold transition-colors">
            About CSLK & Contact
          </Link>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <Link to="/academy" className="hover:text-lanka-gold transition-colors">
            Democracy Academy
          </Link>
        </div>

        {/* Bottom copyright & build note */}
        <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © 2026 E-Lanka Digital Democracy Platform (EL-SPEC-2026-V3). Open Civic Architecture.
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Built for the Citizens of Sri Lanka with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};

