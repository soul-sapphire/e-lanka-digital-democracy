import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Vote, Share2, Building, ShieldCheck, CheckCircle2, PlusCircle, AlertCircle } from 'lucide-react';
import { EPetition } from '@e-lanka/shared';
import { api } from '../services/api';
import { LiveCounterWidget } from '../components/LiveCounterWidget';
import { PetitionSignModal } from '../components/PetitionSignModal';

export const EPetitionsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const [petitions, setPetitions] = useState<EPetition[]>([]);
  const [selectedPetition, setSelectedPetition] = useState<EPetition | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetitions();
  }, []);

  const loadPetitions = async () => {
    try {
      setLoading(true);
      const data = await api.getPetitions();
      setPetitions(data);
    } catch (e) {
      console.error('Failed to load petitions', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSignModal = (petition: EPetition) => {
    setSelectedPetition(petition);
    setIsSignModalOpen(true);
  };

  const handleSignatureSuccess = (newCount: number) => {
    if (selectedPetition) {
      setPetitions((prev) =>
        prev.map((p) =>
          p.id === selectedPetition.id ? { ...p, currentSignatures: newCount } : p
        )
      );
    }
  };

  const handleWhatsAppShare = (petition: EPetition) => {
    const title = petition.title[currentLang] || petition.title.en;
    const url = `${window.location.origin}/petitions#${petition.id}`;
    const text = `E-Lanka Digital Democracy Petition: "${title}". Support this citizen initiative here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lanka-maroon/80 border border-lanka-gold/30 text-xs font-semibold text-lanka-gold">
          <Vote className="w-3.5 h-3.5" />
          <span>Sovereign Citizen E-Petitioning Engine (Section 3.2)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('petitions.title')}
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('petitions.subtitle')} Backed by duplicate-submission prevention via HMAC-SHA256 blind indexing and Field-Level Encryption.
        </p>
      </div>

      {/* Petitions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((n) => (
              <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          petitions.map((petition) => {
            const title = petition.title[currentLang] || petition.title.en;
            const objective = petition.objectiveStatement[currentLang] || petition.objectiveStatement.en;

            return (
              <div
                key={petition.id}
                id={petition.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-lanka-gold/15 text-lanka-gold border border-lanka-gold/30">
                        {petition.code}
                      </span>
                      <span className="text-xs uppercase font-semibold text-slate-400">
                        {petition.category}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        {petition.status}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Building className="w-3.5 h-3.5 text-lanka-gold" />
                      <span>Target Authority: </span>
                      <span className="font-semibold text-slate-200">{petition.targetAuthority}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppShare(petition)}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      title="Share petition on WhatsApp"
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span>{t('petitions.shareBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSignModal(petition)}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-lanka-maroon hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105"
                    >
                      <Vote className="w-4 h-4 text-lanka-gold" />
                      <span>{t('petitions.signBtn')}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-850/60 p-4 rounded-xl border border-slate-800">
                  <p className="font-medium">{objective}</p>
                </div>

                {/* Live Counter Progress */}
                <div>
                  <LiveCounterWidget
                    currentSignatures={petition.currentSignatures}
                    requiredSignatures={petition.requiredSignatures}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verified Sign Modal */}
      {selectedPetition && (
        <PetitionSignModal
          petition={selectedPetition}
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSuccess={handleSignatureSuccess}
        />
      )}
    </div>
  );
};

