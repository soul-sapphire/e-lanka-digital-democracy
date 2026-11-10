import React from 'react';
import { useTranslation } from 'react-i18next';
import { PolicyLifecycleStage } from '@e-lanka/shared';
import { Clock, CheckCircle2, Radio, Sparkles, Archive } from 'lucide-react';

interface LifecycleBadgeProps {
  stage: PolicyLifecycleStage | string;
  size?: 'sm' | 'md';
}

export const LifecycleBadge: React.FC<LifecycleBadgeProps> = ({ stage, size = 'md' }) => {
  const { t } = useTranslation();

  const config = {
    [PolicyLifecycleStage.STAGE_1_PENDING_REVIEW]: {
      label: t('stages.PENDING_REVIEW'),
      icon: Clock,
      bg: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    [PolicyLifecycleStage.STAGE_2_APPROVED_PANEL]: {
      label: t('stages.APPROVED_PANEL'),
      icon: CheckCircle2,
      bg: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    [PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION]: {
      label: t('stages.ACTIVE_CONSULTATION'),
      icon: Radio,
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    [PolicyLifecycleStage.STAGE_4_AI_ANALYSIS_SYNC]: {
      label: t('stages.AI_ANALYSIS_SYNC'),
      icon: Sparkles,
      bg: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    [PolicyLifecycleStage.STAGE_5_CONCLUDED_ARCHIVED]: {
      label: t('stages.CONCLUDED_ARCHIVED'),
      icon: Archive,
      bg: 'bg-slate-100 text-slate-700 border-slate-300'
    }
  };

  const item = config[stage as PolicyLifecycleStage] || {
    label: stage,
    icon: Clock,
    bg: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${item.bg} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{item.label}</span>
    </span>
  );
};

