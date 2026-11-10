import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, ShieldCheck } from 'lucide-react';

interface LiveCounterWidgetProps {
  currentSignatures: number;
  requiredSignatures: number;
  showDetails?: boolean;
}

export const LiveCounterWidget: React.FC<LiveCounterWidgetProps> = ({
  currentSignatures,
  requiredSignatures,
  showDetails = true
}) => {
  const { t } = useTranslation();
  const percentage = Math.min(100, Number(((currentSignatures / requiredSignatures) * 100).toFixed(1)));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
            Live Verified Signatures
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-lanka-gold" />
          <span>Blind Indexed (HMAC)</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {currentSignatures.toLocaleString()}
          </span>
          <span className="text-slate-400 text-sm ml-2">
            / {requiredSignatures.toLocaleString()} goal
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-bold text-lanka-gold font-mono">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
        <div
          className="bg-gradient-to-r from-lanka-maroon via-lanka-gold to-emerald-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showDetails && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Parliamentary Referral Threshold</span>
          </span>
          <span>{(requiredSignatures - currentSignatures > 0) ? `${(requiredSignatures - currentSignatures).toLocaleString()} needed` : 'Threshold Achieved!'}</span>
        </div>
      )}
    </div>
  );
};

