import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink, Award, CheckCircle2, Clock, ShieldCheck, Sparkles, Trophy, Users, Globe2, ArrowRight } from 'lucide-react';

export const LMSAcademyView: React.FC = () => {
  const { t } = useTranslation();

  const officialCourse = {
    id: 'LMS-CSLK-DDR',
    title: 'Digital Democracy and Rights',
    subtitle: 'Official National Civic Literacy & Digital Rights Certification',
    category: 'Certified Civic Program',
    duration: '100% Free • 3 Hours • Self-Paced • Sinhala / தமிழ் / English • Automated E-Certificate',
    level: 'All Sri Lankan Citizens & Youth',
    url: 'https://www.cslk.org/courses/digital-democracy-and-rights',
    modules: [
      {
        number: '01',
        title: 'Module 1: Digital Democracy & Civic Literacy',
        topics: [
          'Foundations of citizen participation, constitutional rights, and public petitions',
          'Democracy in the information age: How policy consultations shape statutory law',
          'Navigating parliamentary committee referrals and citizen oversight'
        ]
      },
      {
        number: '02',
        title: 'Module 2: Digital Safety, Online Safety Act 2024 & PDPA 2022',
        topics: [
          'Practical citizen rights under the Personal Data Protection Act (PDPA) No. 9 of 2022',
          'Analyzing the Online Safety Act (OSA) No. 9 of 2024 and protecting speech from misuse',
          'Digital hygiene, encrypted communications, and counteracting harassment or doxxing'
        ]
      },
      {
        number: '03',
        title: 'Module 3: Practical Guide to E-Lanka',
        topics: [
          'Step-by-step citizen submission guide: Proposing policies and signing verified e-petitions',
          'How military-grade encryption protects your identity and ensures 100% security',
          'How to delete your account and data (PDPA Section 16) and verify privacy records'
        ]
      }
    ]
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lanka-gold/15 border border-lanka-gold/30 text-xs font-semibold text-lanka-gold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Free Trilingual Online Course • Hosted on www.cslk.org</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Democracy Academy & Civic Learning Platform
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Empowering citizens with foundational knowledge on democratic rights, digital safety, and sovereign participation. Hosted by <strong className="text-white">Community Solutions Lanka (CSLK)</strong>. Earn your automated, verifiable e-certificate upon completion.
        </p>
      </div>

      {/* Featured Single Official Course Card */}
      <div className="bg-slate-900 border border-lanka-gold/40 rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-lanka-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-lanka-gold font-bold px-2.5 py-1 rounded bg-lanka-gold/10 border border-lanka-gold/30">
                OFFICIAL COURSE
              </span>
              <span className="text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 100% Free & Open
              </span>
              <span className="text-slate-300 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-lanka-gold" /> Trilingual: සිංහල • தமிழ் • English
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {officialCourse.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {officialCourse.subtitle}
            </p>
          </div>

          <a
            href={officialCourse.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl hover:scale-105 shrink-0"
          >
            <span>OPEN COURSE AT WWW.CSLK.ORG</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Course Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <Clock className="w-5 h-5 text-lanka-gold shrink-0" />
            <div>
              <div className="font-bold text-white">3 Hours • Self-Paced</div>
              <div className="text-slate-400 text-[11px]">Learn on your own schedule</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Automated E-Certificate</div>
              <div className="text-slate-400 text-[11px]">Shareable digital credential</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-white">PDPA 2022 & OSA 2024</div>
              <div className="text-slate-400 text-[11px]">Practical rights defense</div>
            </div>
          </div>
        </div>

        {/* Youth Champions Highlight Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-600/50 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-lanka-gold font-bold text-sm">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Special Opportunity: Youth Champions Selection</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            The <strong>top 10 graduates</strong> of the <em>Digital Democracy and Rights</em> course will be selected as official <strong>"CSLK Youth Champions"</strong>. Youth Champions will receive specialized leadership mentorship, a digital stipend, and will co-lead civic consultation drives in their home districts across Sri Lanka.
          </p>
          <div className="pt-1">
            <Link
              to="/collector"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lanka-gold/20 hover:bg-lanka-gold/30 border border-lanka-gold/50 text-lanka-gold hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <span>Launch Youth Champion Field Collector Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* The 3 Core Modules */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Official 3-Module Curriculum
          </span>

          <div className="space-y-3">
            {officialCourse.modules.map((m) => (
              <div
                key={m.number}
                className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-lanka-maroon border border-lanka-gold/40 text-lanka-gold font-black text-xs flex items-center justify-center shrink-0">
                    {m.number}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {m.title}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pl-10 text-xs text-slate-300">
                  {m.topics.map((topic, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Over 2,500 Sri Lankan youth, students, and advocates currently enrolled.</span>
          </div>
          <a
            href={officialCourse.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-lanka-gold hover:text-amber-300 font-bold text-xs uppercase tracking-wider transition"
          >
            <span>Start Learning for Free</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
