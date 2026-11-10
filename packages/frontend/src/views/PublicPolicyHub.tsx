import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  ArrowRight,
  Radio,
  Vote,
  Shield,
  PlusCircle,
  FileText,
  Share2,
  Users
} from 'lucide-react';
import { PolicyConsultation, PolicyLifecycleStage } from '@e-lanka/shared';
import { api } from '../services/api';
import { LifecycleBadge } from '../components/LifecycleBadge';
import { LMSCard } from '../components/LMSCard';

export const PublicPolicyHub: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const [policies, setPolicies] = useState<PolicyConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (e) {
      console.error('Failed to load policies', e);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'ALL', label: t('categories.ALL') },
    { id: 'DIGITAL_RIGHTS', label: t('categories.DIGITAL_RIGHTS') },
    { id: 'AGRICULTURE_FOOD_SECURITY', label: t('categories.AGRICULTURE_FOOD_SECURITY') },
    { id: 'CONSTITUTIONAL_GOVERNANCE', label: t('categories.CONSTITUTIONAL_GOVERNANCE') },
    { id: 'HEALTHCARE_WELFARE', label: t('categories.HEALTHCARE_WELFARE') },
    { id: 'EDUCATION_YOUTH', label: t('categories.EDUCATION_YOUTH') }
  ];

  const filteredPolicies = policies.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStage = selectedStage === 'ALL' || p.stage === selectedStage;

    const title = p.title[currentLang] || p.title.en;
    const summary = p.summary[currentLang] || p.summary.en;
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Civic Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-lanka-maroon/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-lanka-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-lanka-gold font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Sri Lanka 2026 Digital Democracy Standard (EL-SPEC-2026-V3)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t('hero.title')}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {t('hero.subtitle')}
          </p>

          {/* Quick Metrics */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800/80">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">4</div>
              <div className="text-xs text-slate-400 font-medium">{t('hero.activeConsultations')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-lanka-gold">11,310+</div>
              <div className="text-xs text-slate-400 font-medium">{t('hero.verifiedSignatures')}</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 flex items-center gap-1">
                <Shield className="w-6 h-6 inline" />
                <span>100%</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">{t('hero.statutoryCompliance')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured LMS Integration Card */}
      <section>
        <LMSCard />
      </section>

      {/* Discovery Tier: Filters and Search */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search policy briefs, keywords, ministries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium shrink-0">
              <Filter className="w-3.5 h-3.5" /> Stage:
            </span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-lanka-gold"
            >
              <option value="ALL">All Stages</option>
              <option value={PolicyLifecycleStage.STAGE_1_PENDING_REVIEW}>Stage 1: Pending</option>
              <option value={PolicyLifecycleStage.STAGE_2_APPROVED_PANEL}>Stage 2: Approved</option>
              <option value={PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION}>Stage 3: Active</option>
              <option value={PolicyLifecycleStage.STAGE_4_AI_ANALYSIS_SYNC}>Stage 4: AI Analysis</option>
              <option value={PolicyLifecycleStage.STAGE_5_CONCLUDED_ARCHIVED}>Stage 5: Concluded</option>
            </select>
          </div>
        </div>

        {/* Sector Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                selectedCategory === cat.id
                  ? 'bg-lanka-gold text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Policy Consultations Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-lanka-gold" />
            <span>Policy Consultation Initiatives</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredPolicies.length} available)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-52 animate-pulse" />
            ))}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm">No policy consultations match your current criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedStage('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-lanka-gold hover:underline font-medium"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPolicies.map((policy) => {
              const title = policy.title[currentLang] || policy.title.en;
              const summary = policy.summary[currentLang] || policy.summary.en;

              return (
                <div
                  key={policy.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 flex flex-col justify-between transition-all hover:shadow-lg group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-lanka-gold bg-lanka-gold/10 px-2 py-0.5 rounded border border-lanka-gold/20">
                        {policy.code}
                      </span>
                      <LifecycleBadge stage={policy.stage} size="sm" />
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-lanka-gold transition-colors leading-snug">
                      <Link to={`/policies/${policy.id}`}>{title}</Link>
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {summary}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        {policy.targetMinistry}
                      </span>
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        {policy.submissionCount.toLocaleString()} {t('policyDetail.submissions')}
                      </span>
                    </div>

                    <Link
                      to={`/policies/${policy.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-lanka-maroon text-slate-200 hover:text-white font-medium transition-colors text-xs"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

