import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Building,
  Users,
  Calendar,
  Share2,
  FileCheck,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  Lock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { PolicyConsultation, ZeroPIIPublicAggregate } from '@e-lanka/shared';
import { api } from '../services/api';
import { LifecycleBadge } from '../components/LifecycleBadge';
import { LMSCard } from '../components/LMSCard';

const SENTIMENT_COLORS = ['#10B981', '#64748B', '#EF4444']; // Positive (emerald), Neutral (slate), Negative (red)

export const PolicyDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const [policy, setPolicy] = useState<PolicyConsultation | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [aggregate, setAggregate] = useState<ZeroPIIPublicAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (policyId: string) => {
    try {
      setLoading(true);
      const res = await api.getPolicyById(policyId);
      setPolicy(res.data);
      setWhatsappUrl(res.whatsappShareUrl);

      // Fetch public aggregates for charts
      try {
        const aggRes = await api.getPublicAggregate(policyId);
        setAggregate(aggRes.data);
      } catch {
        // Aggregate may not yet exist for stage 1/2
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-lanka-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading policy brief & analytics...</p>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="py-16 text-center text-slate-300 space-y-4">
        <h2 className="text-xl font-bold text-red-400">Policy Consultation Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'The requested policy is unavailable.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Policy Hub</span>
        </Link>
      </div>
    );
  }

  const title = policy.title[currentLang] || policy.title.en;
  const summary = policy.summary[currentLang] || policy.summary.en;
  const fullDesc = policy.fullDescription[currentLang] || policy.fullDescription.en;

  // Chart data formatting
  const sentimentData = aggregate
    ? [
        { name: t('policyDetail.positive'), value: aggregate.sentimentDistribution.positive },
        { name: t('policyDetail.neutral'), value: aggregate.sentimentDistribution.neutral },
        { name: t('policyDetail.negative'), value: aggregate.sentimentDistribution.negative }
      ]
    : [];

  const surveyOptionData = aggregate?.questionSummaries?.[0]?.optionSplits?.map((split) => ({
    name: split.label[currentLang] || split.label.en,
    percentage: split.percentage,
    count: split.count
  })) || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to All Policy Consultations</span>
      </Link>

      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-lanka-gold/15 text-lanka-gold border border-lanka-gold/30">
              {policy.code}
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {policy.category}
            </span>
          </div>
          <LifecycleBadge stage={policy.stage} />
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
          {summary}
        </p>

        {/* Metadata Strip */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-lanka-gold" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Target Ministry</span>
              <span className="font-semibold text-slate-200">{policy.targetMinistry}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Submissions</span>
              <span className="font-semibold text-slate-200">
                {policy.submissionCount.toLocaleString()} Verified Citizens
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Lifecycle State</span>
              <span className="font-semibold text-slate-200">{policy.stage}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Survey Runner & WhatsApp Deep Link */}
        <div className="pt-4 flex flex-wrap items-center gap-3">
          <Link
            to={`/policies/${policy.id}/survey`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-lanka-maroon hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105"
          >
            <MessageSquare className="w-4 h-4 text-lanka-gold" />
            <span>{t('policyDetail.takeSurvey')}</span>
          </Link>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('policyDetail.shareWhatsApp')}</span>
            </a>
          )}
        </div>
      </div>

      {/* Embedded LMS Educational Card */}
      <section>
        <LMSCard
          courseId={policy.lmsCourseRef?.courseId}
          courseTitle={policy.lmsCourseRef?.courseTitle}
          url={policy.lmsCourseRef?.url}
        />
      </section>

      {/* Comprehensive Legislative Policy Brief */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileCheck className="w-5 h-5 text-lanka-gold" />
          <span>Statutory Policy Description & Regulatory Scope</span>
        </h3>
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {fullDesc}
        </div>
        {policy.moderatorPanelNotes && (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-lanka-gold uppercase text-[10px] tracking-wider block">
              Statutory Expert Panel Moderation Notes
            </span>
            <p>{policy.moderatorPanelNotes}</p>
          </div>
        )}
      </section>

      {/* Real-time Aggregate Charts & AI Opinion Mapping Analytics */}
      {aggregate ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              <span>{t('policyDetail.analyticsTitle')}</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              Zero-PII Static Export
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Qualitative Sentiment Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-lanka-gold" />
                  <span>{t('policyDetail.sentimentBreakdown')}</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {aggregate.totalSubmissions} samples
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Structured Survey Option Splits */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-lanka-gold" />
                  <span>Mandatory Independent Audit Support (%)</span>
                </h4>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={surveyOptionData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748B" fontSize={11} />
                    <YAxis dataKey="name" type="category" width={110} stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '12px' }} />
                    <Bar dataKey="percentage" fill="#FFBE29" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Thematic Clusters Synthesized by AI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lanka-gold" />
              <h4 className="text-base font-bold text-white">
                {t('policyDetail.thematicClusters')}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aggregate.thematicClusters.map((cluster) => {
                const themeTitle = cluster.themeTitle[currentLang] || cluster.themeTitle.en;
                return (
                  <div
                    key={cluster.id}
                    className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-white leading-snug">{themeTitle}</h5>
                      <span className="text-xs font-mono font-bold text-lanka-gold px-2 py-0.5 rounded bg-slate-900">
                        {cluster.percentage}%
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Key Citizen Concerns
                      </span>
                      {cluster.keyConcerns.map((concern, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-lanka-gold font-bold">•</span>
                          <span>{concern[currentLang] || concern.en}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3" /> PII-Scrubbed Representative Excerpt
                      </span>
                      {cluster.representativeQuotes.map((q, qIdx) => (
                        <blockquote
                          key={qIdx}
                          className="text-xs italic text-slate-400 border-l-2 border-emerald-500/60 pl-2.5 py-0.5"
                        >
                          "{q}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 space-y-2">
          <Sparkles className="w-8 h-8 text-lanka-gold mx-auto" />
          <h4 className="text-sm font-bold text-white">AI Opinion Mapping in Progress</h4>
          <p className="text-xs max-w-md mx-auto">
            Aggregated sentiment models and thematic clusters will automatically compile once initial consultation submissions reach statistical threshold.
          </p>
        </div>
      )}
    </div>
  );
};

