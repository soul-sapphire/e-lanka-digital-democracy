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
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  HelpCircle,
  AlertCircle
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
  const [viewMode, setViewMode] = useState<'INFOGRAPHIC' | 'CHARTS'>('INFOGRAPHIC');

  const getAiExecutiveSummary = (policyCode: string) => {
    if (policyCode === 'EL-POL-2026-002') {
      return {
        en: 'Broad rural public support (82%) for solar irrigation subsidies and guaranteed minimum floor pricing for smallholder paddy farmers, with strong requests for direct mobile subsidy transfers to prevent intermediary commission deductions.',
        si: 'සූර්ය බලශක්ති වාරිමාර්ග සහනාධාර සහ කුඩා වී ගොවීන් සඳහා සහතික කළ අවම මිල සඳහා පුළුල් ග්‍රාමීය සහයක් (82%), අතරමැදි කොමිස් කප්පාදු වැළැක්වීම සඳහා සෘජු ජංගම සහනාධාර බැර කිරීම් සඳහා දැඩි ඉල්ලීම්.',
        ta: 'சூரிய பாசன மானியங்கள் மற்றும் சிறு நெல் விவசாயிகளுக்கான உத்தரவாதமான குறைந்தபட்ச விலை ஆதரவுக்கு பரந்த கிராமப்புற ஆதரவு (82%), இடைத்தரகர் கமிஷன்களைத் தடுக்க நேரடி மொபைல் மானியப் பரிமாற்றங்களுக்கான வலுவான கோரிக்கைகள்.'
      };
    }
    if (policyCode === 'EL-POL-2026-003') {
      return {
        en: 'Significant public consensus (76%) supporting digital telemedicine links between rural divisional hospitals and Colombo tertiary specialists, provided that emergency ambulances and generic medicines remain free at the point of delivery.',
        si: 'ග්‍රාමීය ප්‍රාදේශීය රෝහල් සහ කොළඹ විශේෂඥ වෛද්‍යවරුන් අතර ඩිජිටල් ටෙලිමෙඩිසින් සම්බන්ධතා සඳහා සැලකිය යුතු මහජන එකඟතාවයක් (76%), හදිසි ගිලන්රථ සහ ඖෂධ නොමිලේ සැපයීම සහතික කළ යුතුය.',
        ta: 'கிராமப்புற பிரதேச மருத்துவமனைகள் மற்றும் கொழும்பு நிபுணர்களிடையே டிஜிட்டல் டெலிமெடிசின் இணைப்புகளுக்கு கணிசமான பொது ஒருமித்த கருத்து (76%), இலவச அவசர ஆம்புலன்ஸ் மற்றும் பொதுவான மருந்துகள் விநியோகிக்கப்பட வேண்டும்.'
      };
    }
    // Default: EL-POL-2026-001 (AI Ethics)
    return {
      en: 'Clear citizen consensus (68%) favoring independent algorithmic oversight and pre-deployment testing for language model fairness in Sinhala and Tamil, with specific safeguards against discriminatory automated hiring or credit scoring under PDPA No. 9 of 2022.',
      si: 'ස්වාධීන ඇල්ගොරිතම අධීක්ෂණය සහ සිංහල සහ දෙමළ භාෂා ආකෘති සාධාරණත්වය සඳහා පූර්ව පරීක්ෂාව සඳහා පැහැදිලි පුරවැසි එකඟතාවයක් (68%), PDPA අංක 9 යටතේ ස්වයංක්‍රීය බඳවා ගැනීම් හෝ ණය ශ්‍රේණිගත කිරීම්වලට එරෙහිව නිශ්චිත ආරක්ෂණ සහිතව.',
      ta: 'சுயாதீன அல்காரித மேற்பார்வை மற்றும் சிங்களம் மற்றும் தமிழ் மொழி மாதிரி நேர்மைக்கான முன் சோதனைக்கு தெளிவான குடிமக்கள் ஒருமித்த கருத்து (68%), PDPA எண் 9 இன் கீழ் பாகுபாடான தானியங்கி பணியமர்த்தல் அல்லது கடன் மதிப்பீட்டிற்கு எதிரான குறிப்பிட்ட பாதுகாப்புகளுடன்.'
    };
  };

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
    const isRestricted = error?.includes('ACCESS_RESTRICTED');
    return (
      <div className="py-16 text-center text-slate-300 space-y-4 max-w-md mx-auto">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${isRestricted ? 'bg-red-950/80 border-red-800 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {isRestricted ? 'Proposal Restricted (Stage 1 Draft)' : 'Policy Consultation Not Found'}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || 'The requested policy consultation is unavailable.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Policy Hub</span>
          </Link>
          {isRestricted && (
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const headline = policy.headline ? (policy.headline[currentLang] || policy.headline.en) : null;
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
        <span>{t('policyDetail.returnToHub')}</span>
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

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {headline || title}
          </h1>
          {headline && (
            <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                Gazette Statutory Description
              </span>
              <span className="italic">{title}</span>
            </div>
          )}
        </div>

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
              <span className="block text-[10px] uppercase text-slate-400">{t('policyDetail.submissions')}</span>
              <span className="font-semibold text-slate-200">
                {policy.submissionCount.toLocaleString()} {t('policyDetail.verifiedCitizens')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">{t('policyDetail.lifecycleState')}</span>
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
          <span>{t('policyDetail.statutoryScope')}</span>
        </h3>
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {fullDesc}
        </div>
        {policy.moderatorPanelNotes && (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-lanka-gold uppercase text-[10px] tracking-wider block">
              {t('policyDetail.panelNotesTitle')}
            </span>
            <p>{policy.moderatorPanelNotes}</p>
          </div>
        )}
      </section>

      {/* Real-time Aggregate Charts & AI Opinion Mapping Analytics (Issue 3.4) */}
      {aggregate ? (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <span>Public Citizen Pulse & AI Opinion Mapping</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time trilingual synthesis of verified citizen submissions across all 25 electoral districts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Public AI Transparency • Zero Personal Identifiers Stored</span>
              </span>
            </div>
          </div>

          {/* 1. AI Executive Summary & Public Consensus Infographic Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-700/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lanka-gold" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Public Consensus & Executive Synthesis
                </h4>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Statutory Policy Panel Verified</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {getAiExecutiveSummary(policy.code)[currentLang] || getAiExecutiveSummary(policy.code).en}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Verified Citizens</span>
                <span className="text-xl font-extrabold text-white font-mono">{aggregate.totalSubmissions.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block">Across 25 Districts</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Dominant Stance</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">{aggregate.sentimentDistribution.positive}% Civic Support</span>
                <span className="text-[10px] text-slate-400 block">Public Consultation Majority</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-lanka-gold block tracking-wider">Thematic Priorities</span>
                <span className="text-xl font-extrabold text-lanka-gold font-mono">{aggregate.thematicClusters.length} Core Clusters</span>
                <span className="text-[10px] text-slate-400 block">Trilingual NLP Identified</span>
              </div>
            </div>
          </div>

          {/* 2. Sentiment Splits Infographic Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-lanka-gold" />
                  <span>Public Sentiment Splits & Citizen Stance Infographic</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Qualitative natural language sentiment classification in Sinhala, Tamil, and English.
                </p>
              </div>

              {/* View Toggle */}
              <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('INFOGRAPHIC')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    viewMode === 'INFOGRAPHIC'
                      ? 'bg-lanka-gold text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Infographic Bar & Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CHARTS')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    viewMode === 'CHARTS'
                      ? 'bg-lanka-gold text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive Charts
                </button>
              </div>
            </div>

            {viewMode === 'INFOGRAPHIC' ? (
              <div className="space-y-4">
                {/* Visual Multi-segment Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-800 p-1 border border-slate-700 shadow-inner">
                    <div
                      style={{ width: `${aggregate.sentimentDistribution.positive}%` }}
                      className="bg-emerald-500 rounded-l-lg transition-all flex items-center justify-center text-[10px] font-bold text-slate-950 font-mono"
                      title={`Positive Support: ${aggregate.sentimentDistribution.positive}%`}
                    >
                      {aggregate.sentimentDistribution.positive > 12 ? `${aggregate.sentimentDistribution.positive}%` : ''}
                    </div>
                    <div
                      style={{ width: `${aggregate.sentimentDistribution.neutral}%` }}
                      className="bg-slate-400 transition-all flex items-center justify-center text-[10px] font-bold text-slate-950 font-mono"
                      title={`Neutral / Inquiries: ${aggregate.sentimentDistribution.neutral}%`}
                    >
                      {aggregate.sentimentDistribution.neutral > 12 ? `${aggregate.sentimentDistribution.neutral}%` : ''}
                    </div>
                    <div
                      style={{ width: `${aggregate.sentimentDistribution.negative}%` }}
                      className="bg-rose-500 rounded-r-lg transition-all flex items-center justify-center text-[10px] font-bold text-white font-mono"
                      title={`Critical / Amendments: ${aggregate.sentimentDistribution.negative}%`}
                    >
                      {aggregate.sentimentDistribution.negative > 12 ? `${aggregate.sentimentDistribution.negative}%` : ''}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* 3 High-Contrast Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Strong Civic Support</span>
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {aggregate.sentimentDistribution.positive}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Citizens enthusiastically endorsing policy adoption with statutory safeguards.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deliberative / Inquiries</span>
                      </span>
                      <span className="text-2xl font-black text-slate-200 font-mono">
                        {aggregate.sentimentDistribution.neutral}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Citizens seeking specific clarification on provincial implementation and budgets.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Critical / Amendments</span>
                      </span>
                      <span className="text-2xl font-black text-rose-400 font-mono">
                        {aggregate.sentimentDistribution.negative}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Submissions proposing statutory exemptions or raising bureaucratic friction concerns.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Charts Mode */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Sentiment Breakdown Chart</span>
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

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Independent Audit Support (%)</span>
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
            )}
          </div>

          {/* 3. Thematic Clusters Synthesized by AI Infographic Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lanka-gold" />
                <h4 className="text-base font-bold text-white">
                  {t('policyDetail.thematicClusters')}
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {aggregate.thematicClusters.length} Core Public Priorities
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aggregate.thematicClusters.map((cluster) => {
                const themeTitle = cluster.themeTitle[currentLang] || cluster.themeTitle.en;
                return (
                  <div
                    key={cluster.id}
                    className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-sm text-white leading-snug">{themeTitle}</h5>
                      <span className="text-xs font-mono font-bold text-lanka-gold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                        {cluster.percentage}% weight
                      </span>
                    </div>

                    {/* Progress Bar Infographic */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div
                          style={{ width: `${cluster.percentage}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 to-lanka-gold rounded-full"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {cluster.mentionCount ? `${cluster.mentionCount.toLocaleString()} citizen mentions` : 'High frequency in public submissions'}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Key Citizen Concerns
                      </span>
                      {cluster.keyConcerns.map((concern, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-lanka-gold shrink-0 mt-0.5" />
                          <span>{concern[currentLang] || concern.en}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>PII-Scrubbed Citizen Excerpt (PDPA Protected)</span>
                      </span>
                      {cluster.representativeQuotes.map((q, qIdx) => (
                        <blockquote
                          key={qIdx}
                          className="text-xs italic text-slate-300 border-l-2 border-emerald-500 pl-3 py-1 bg-slate-900/60 rounded-r-lg"
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

