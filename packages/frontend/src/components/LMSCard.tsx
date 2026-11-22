import React from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ExternalLink, Award, Clock, Trophy, Sparkles, Globe2 } from 'lucide-react';
import { LocalizedString } from '@e-lanka/shared';

interface LMSCardProps {
  courseId?: string;
  courseTitle?: LocalizedString;
  url?: string;
}

export const LMSCard: React.FC<LMSCardProps> = ({
  courseId = 'LMS-CSLK-DDR',
  courseTitle,
  url = 'https://www.cslk.org/courses/digital-democracy-and-rights'
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const defaultTitle = {
    en: 'Digital Democracy and Rights',
    si: 'ඩිජිටල් ප්‍රජාතන්ත්‍රවාදය සහ අයිතිවාසිකම්',
    ta: 'டிஜிட்டல் ஜனநாயகம் மற்றும் உரிமைகள்'
  };

  const title = courseTitle ? courseTitle[currentLang] || courseTitle.en : defaultTitle[currentLang];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-lanka-gold/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-lanka-gold/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-lanka-maroon/90 text-lanka-gold px-2.5 py-0.5 rounded-full border border-lanka-gold/30">
              <GraduationCap className="w-3.5 h-3.5" />
              Official Course • CSLK.ORG
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 100% Free
            </span>
            <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-lanka-gold" /> 3 Hours • Self-Paced
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Globe2 className="w-3 h-3" /> Trilingual: Sinhala / தமிழ் / English
            </span>
          </div>

          <h4 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
            {title}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            Master the fundamentals of civic participation: (1) Digital Democracy & Civic Literacy, (2) Digital Safety, Online Safety Act 2024 & PDPA 2022, and (3) Practical Guide to E-Lanka. Automated e-certificate upon completion.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
            <span className="inline-flex items-center gap-1.5 text-lanka-gold font-semibold bg-amber-950/40 border border-amber-700/40 px-2.5 py-1 rounded-lg">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Top 10 graduates selected as official Youth Champions</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Automated E-Certificate
            </span>
          </div>
        </div>

        <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 text-center"
          >
            <span>OPEN COURSE AT WWW.CSLK.ORG</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <span className="text-[10px] text-center text-slate-400 font-mono">
            Direct LifterLMS Enrollment
          </span>
        </div>
      </div>
    </div>
  );
};
