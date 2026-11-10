import React from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ExternalLink, Award, Clock } from 'lucide-react';
import { LocalizedString } from '@e-lanka/shared';

interface LMSCardProps {
  courseId?: string;
  courseTitle?: LocalizedString;
  url?: string;
}

export const LMSCard: React.FC<LMSCardProps> = ({
  courseId = 'LMS-CSLK-101',
  courseTitle,
  url = 'https://www.cslk.org'
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const defaultTitle = {
    en: 'Digital Democracy & Algorithmic Accountability in Sri Lanka',
    si: 'ශ්‍රී ලංකාවේ ඩිජිටල් ප්‍රජාතන්ත්‍රවාදය සහ ඇල්ගොරිතම වගවීම',
    ta: 'இலங்கையில் டிஜிட்டல் ஜனநாயகம் மற்றும் அல்காரிதம் பொறுப்புக்கூறல்'
  };

  const title = courseTitle ? courseTitle[currentLang] || courseTitle.en : defaultTitle[currentLang];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-lanka-gold/30 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-lanka-gold/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-lanka-maroon/80 text-lanka-gold px-2 py-0.5 rounded border border-lanka-gold/20">
              <GraduationCap className="w-3.5 h-3.5" />
              LMS Integration • CSLK.ORG
            </span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> 2 Hours • Self-Paced
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
            {title}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {t('policyDetail.lmsBannerDesc')}: Explore constitutional frameworks, citizen consultation methodologies, and Sri Lanka PDPA statutory privacy rights.
          </p>

          <div className="flex items-center gap-3 text-xs text-emerald-400 pt-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Certified Civic Badge
            </span>
            <span>•</span>
            <span>Free & Open to All Citizens</span>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105 shrink-0"
        >
          <span>{t('policyDetail.visitLms')}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

