import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, ExternalLink, Cpu, Heart } from 'lucide-react';

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

          {/* Column 2: PDPA Compliance */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Statutory Privacy Protection
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fully compliant with Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022. Guarantees data minimization, right to erasure (Section 14), and immutable audit logging.
            </p>
            <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
              <div>• AES-256-GCM Application Layer FLE</div>
              <div>• HMAC-SHA256 Salted Blind Indexing</div>
              <div>• RFC 6238 TOTP 2FA Verification</div>
            </div>
          </div>

          {/* Column 3: Democracy Academy & LMS */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-lanka-gold" />
              Educational Linkage
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated with the Centre for Society & Learning Sri Lanka online learning portal.
            </p>
            <a
              href="https://www.cslk.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-lanka-gold hover:text-amber-300 font-medium text-xs underline"
            >
              <span>Visit www.cslk.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-[11px] text-slate-400">
              Free civic certificates in AI Governance, Constitutional Due Process, and Digital Democracy.
            </p>
          </div>

          {/* Column 4: Trilingual Status */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm">Trilingual Accessibility</h4>
            <p className="text-xs text-slate-400 font-sinhala">
              සිංහල, தமிழ் සහ English භාෂා ත්‍රිත්වයෙන්ම සම ප්‍රවේශය සහතික කර ඇත.
            </p>
            <p className="text-xs text-slate-400 font-tamil">
              அனைத்து குடிமக்களுக்கும் மும்மொழி சமத்துவ அணுகல் உத்தரவாதம் அளிக்கப்பட்டுள்ளது.
            </p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1">
              <Lock className="w-3 h-3" />
              Non-retaliation citizen protections active
            </p>
          </div>
        </div>

        {/* Bottom copyright & build note */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div>
            © 2026 E-Lanka Digital Democracy Platform (EL-SPEC-2026-V3). Open Civic Architecture.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for the Citizens of Sri Lanka with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};

