import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { EPetition } from '@e-lanka/shared';
import { api } from '../services/api';

interface PetitionSignModalProps {
  petition: EPetition;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCount: number) => void;
}

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export const PetitionSignModal: React.FC<PetitionSignModalProps> = ({
  petition,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';

  const [nicNumber, setNicNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [agreeToDemands, setAgreeToDemands] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client validation
    const cleanNIC = nicNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    const oldNicRegex = /^[0-9]{9}[VX]$/;
    const newNicRegex = /^[0-9]{12}$/;

    if (!oldNicRegex.test(cleanNIC) && !newNicRegex.test(cleanNIC)) {
      setError(
        'Invalid Sri Lankan NIC format. Must be 9 digits + V/X (e.g. 851234567V) or 12 digits (e.g. 198512345678).'
      );
      return;
    }

    if (!agreeToDemands) {
      setError('You must declare agreement with the petition demands.');
      return;
    }

    if (!consentDataProcessing) {
      setError('PDPA statutory consent is mandatory to verify single-sign uniqueness.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.signPetition(petition.id, {
        nicNumber: cleanNIC,
        fullName,
        email,
        district,
        agreeToDemands,
        consentDataProcessing
      });

      if (res.success) {
        setSignedSuccess(true);
        onSuccess(res.currentSignatures);
      } else {
        setError(res.message || t('petitions.duplicateError'));
      }
    } catch (err: any) {
      setError(err.message || 'Signature recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const petitionTitle = petition.title[currentLang] || petition.title.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {signedSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Signature Verified & Counted!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your signature has been cryptographically recorded using an HMAC-SHA256 blind index. Your identity is permanently decoupled to guarantee statutory non-retaliation under Sri Lanka PDPA No. 9 of 2022.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-lanka-gold" />
              <h3 className="text-lg font-bold text-white">{t('petitions.modalTitle')}</h3>
            </div>

            <p className="text-xs text-slate-300 font-medium line-clamp-2 border-l-2 border-lanka-gold pl-3 py-0.5">
              {petitionTitle}
            </p>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {t('petitions.nicLabel')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 199012345678 or 901234567V"
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {t('petitions.nicHelp')} (Encrypted & blind-indexed)
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {t('petitions.nameLabel')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Citizen Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    {t('petitions.districtLabel')} *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                  >
                    {SRI_LANKAN_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    {t('petitions.emailLabel')}
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToDemands}
                    onChange={(e) => setAgreeToDemands(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">
                    {t('petitions.agreeCheckbox')}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentDataProcessing}
                    onChange={(e) => setConsentDataProcessing(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">
                    {t('petitions.consentCheckbox')}
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>{t('petitions.confirmSign')}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

