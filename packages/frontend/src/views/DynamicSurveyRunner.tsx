import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  WifiOff,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react';
import { SurveyDefinition, SurveyQuestion } from '@e-lanka/shared';
import { api } from '../services/api';

export const DynamicSurveyRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const [survey, setSurvey] = useState<SurveyDefinition | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Answer state keyed by questionId
  const [answers, setAnswers] = useState<Record<string, {
    questionType: string;
    selectedOptionId?: string;
    selectedOptionIds?: string[];
    numericRating?: number;
    rawOpenText?: string;
  }>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

  useEffect(() => {
    if (id) {
      loadSurvey(id);
    }
  }, [id]);

  const loadSurvey = async (policyId: string) => {
    try {
      setLoading(true);
      const res = await api.getSurveyByPolicyId(policyId);
      setSurvey(res.survey);
      setQuestions(res.questions);
    } catch (err: any) {
      setError(err.message || 'Survey questionnaire could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionType: 'SINGLE_CHOICE',
        selectedOptionId: optionId
      }
    }));
  };

  const handleRating = (questionId: string, rating: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionType: 'RATING_SCALE',
        numericRating: rating
      }
    }));
  };

  const handleOpenText = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionType: 'OPEN_TEXT',
        rawOpenText: text
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!survey || !id) return;
    setSubmitting(true);
    setError(null);

    const formattedAnswers = questions.map((q) => {
      const ans = answers[q.id] || {};
      return {
        questionId: q.id,
        questionType: q.type,
        selectedOptionId: ans.selectedOptionId,
        selectedOptionIds: ans.selectedOptionIds,
        numericRating: ans.numericRating,
        rawOpenText: ans.rawOpenText
      };
    });

    try {
      await api.submitSurveyResponse({
        surveyId: survey.id,
        policyId: id,
        answers: formattedAnswers,
        clientLanguage: currentLang
      });

      if (!navigator.onLine) {
        setIsOfflineSaved(true);
      }
      setIsCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-lanka-gold mx-auto" />
        <p className="text-sm">Preparing dynamic consultation questionnaire...</p>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="py-20 text-center text-slate-300 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Consultation Questionnaire Unavailable</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        <Link
          to={`/policies/${id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Policy Brief
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-white">{t('survey.successTitle')}</h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
            {t('survey.successDesc')}
          </p>

          {isOfflineSaved && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>{t('survey.offlineNotice')}</span>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/policies/${id}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Return to Policy Analytics
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
            >
              View Citizen Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6 pb-20">
      {/* Back and Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link
          to={`/policies/${id}`}
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <span className="font-mono text-lanka-gold font-bold">
          {t('survey.step', { current: currentStep + 1, total: questions.length })}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
        <div
          className="bg-gradient-to-r from-lanka-maroon to-lanka-gold h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Survey Runner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-6 shadow-xl relative">
        {/* Statutory Privacy Seal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-lanka-gold" />
            <span className="text-xs font-bold text-slate-200">
              Sri Lanka PDPA Field-Level Encrypted (AES-256-GCM)
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            Decoupled Hash Index
          </span>
        </div>

        {/* Question Prompt */}
        {currentQuestion && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-lanka-gold tracking-wider">
                Question {currentStep + 1}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQuestion.prompt[currentLang] || currentQuestion.prompt.en}
              </h3>
              {currentQuestion.helpText && (
                <p className="text-xs text-slate-400 italic">
                  {currentQuestion.helpText[currentLang] || currentQuestion.helpText.en}
                </p>
              )}
            </div>

            {/* Question Type: SINGLE_CHOICE */}
            {currentQuestion.type === 'SINGLE_CHOICE' && currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const label = opt.label[currentLang] || opt.label.en;
                  const isSelected = answers[currentQuestion.id]?.selectedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSingleSelect(currentQuestion.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-lanka-gold/15 border-lanka-gold text-white shadow-sm ring-1 ring-lanka-gold'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                          isSelected ? 'border-lanka-gold bg-lanka-gold' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Question Type: RATING_SCALE (1 to 5) */}
            {currentQuestion.type === 'RATING_SCALE' && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isSelected = answers[currentQuestion.id]?.numericRating === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleRating(currentQuestion.id, num)}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border font-bold text-base sm:text-lg flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-lanka-gold border-lanka-gold text-slate-950 scale-110 shadow-lg'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span>{num}</span>
                        <Star className={`w-3 h-3 ${isSelected ? 'fill-slate-950 text-slate-950' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                  <span>{currentQuestion.minRatingLabel ? (currentQuestion.minRatingLabel[currentLang] || currentQuestion.minRatingLabel.en) : '1 - Lowest'}</span>
                  <span>{currentQuestion.maxRatingLabel ? (currentQuestion.maxRatingLabel[currentLang] || currentQuestion.maxRatingLabel.en) : '5 - Highest'}</span>
                </div>
              </div>
            )}

            {/* Question Type: OPEN_TEXT */}
            {currentQuestion.type === 'OPEN_TEXT' && (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={answers[currentQuestion.id]?.rawOpenText || ''}
                  onChange={(e) => handleOpenText(currentQuestion.id, e.target.value)}
                  placeholder="Share your detailed feedback, legal amendments, or perspective..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                  maxLength={currentQuestion.maxCharacters || 1000}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Lock className="w-3 h-3" /> Encrypted prior to database persistence
                  </span>
                  <span>
                    {(answers[currentQuestion.id]?.rawOpenText || '').length} / {currentQuestion.maxCharacters || 1000} chars
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('survey.prev')}</span>
          </button>

          {currentStep === questions.length - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('survey.submitting')}</span>
                </>
              ) : (
                <span>{t('survey.submit')}</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>{t('survey.next')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

