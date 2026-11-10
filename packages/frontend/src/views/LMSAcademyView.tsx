import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, Award, CheckCircle, Clock, Shield, Sparkles } from 'lucide-react';
import { LMSCard } from '../components/LMSCard';

export const LMSAcademyView: React.FC = () => {
  const { t } = useTranslation();

  const courses = [
    {
      id: 'LMS-AI-101',
      title: 'AI Governance & Algorithmic Due Process for Sri Lankan Citizens',
      category: 'Digital Democracy',
      duration: '2.5 Hours • Self-Paced',
      level: 'All Citizens',
      modules: [
        'Introduction to Algorithmic Decision Making in the Public Sector',
        'Detecting Bias and Model Hallucinations in Civic Tools',
        'Citizen Rights to Contest Automated Administrative Decisions',
        'Sri Lanka PDPA No. 9 of 2022 Statutory Safety Guardrails'
      ],
      url: 'https://www.cslk.org/courses/ai-governance'
    },
    {
      id: 'LMS-PDPA-201',
      title: 'Understanding Sri Lanka PDPA No. 9 of 2022: Your Statutory Rights',
      category: 'Data Protection & Law',
      duration: '1.5 Hours',
      level: 'Beginner to Intermediate',
      modules: [
        'Data Minimization and Purpose Limitation Principles',
        'Exercising Statutory Right to Erasure (Section 14)',
        'Understanding Application-Layer Field Encryption & Blind Indexing',
        'Filing Statutory Complaints with the Data Protection Authority'
      ],
      url: 'https://www.cslk.org/courses/pdpa-privacy-rights'
    },
    {
      id: 'LMS-CIVIC-301',
      title: 'E-Petitioning & Participatory Legislation: From Grassroots to Parliament',
      category: 'Legislative Practice',
      duration: '3.0 Hours',
      level: 'Civic Activists & Proposers',
      modules: [
        'Formulating Effective Objective Statements for State Authorities',
        'Mobilizing Verified Signatures with Cryptographic Non-Retaliation',
        'Parliamentary Petitions Committee Referral Benchmarks',
        'Monitoring Follow-up and Ministerial Implementation'
      ],
      url: 'https://www.cslk.org/courses/civic-legislation'
    }
  ];

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lanka-gold/15 border border-lanka-gold/30 text-xs font-semibold text-lanka-gold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Section 3.4 LMS & Educational Course Integration (www.cslk.org)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Democracy Academy & Civic Learning Platform
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Connecting policy awareness to formal educational modules hosted by the Centre for Society & Learning Sri Lanka (CSLK). Earn certified credentials in algorithmic ethics, data rights, and constitutional consultation.
        </p>
      </div>

      <div className="space-y-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-lg hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-lanka-gold font-bold px-2 py-0.5 rounded bg-lanka-gold/10 border border-lanka-gold/20">
                    {course.id}
                  </span>
                  <span className="text-slate-400 font-medium">{course.category}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {course.title}
                </h3>
              </div>

              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0"
              >
                <span>Enroll at www.cslk.org</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-lanka-gold" />
                {course.duration}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Certified Civic Digital Badge
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Core Course Modules & Competencies
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {course.modules.map((mod, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{mod}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

