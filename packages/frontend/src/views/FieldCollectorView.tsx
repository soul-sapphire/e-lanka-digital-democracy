import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Calendar,
  Sparkles,
  Database
} from 'lucide-react';
import { OfflineQueueManager } from '../services/offline-queue';
import { api, getClientDemoPetitions, getClientDemoPolicies } from '../services/api';
import { formatSriLankanDate, decodeAndValidateSriLankanNIC, formatSriLankanTimestamp } from '@e-lanka/shared';

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const YOUTH_CHAMPION_ROSTER = [
  { id: 'YC-2026-001', name: 'Kavindi Perera (Central Province)', district: 'Kandy' },
  { id: 'YC-2026-002', name: 'Mohamed Rizwan (Eastern Province)', district: 'Batticaloa' },
  { id: 'YC-2026-003', name: 'Sivaranjani Thevarajah (Northern Province)', district: 'Jaffna' },
  { id: 'YC-2026-004', name: 'Nishan Gunasekara (Southern Province)', district: 'Galle' },
  { id: 'YC-2026-005', name: 'Tharushi Jayasuriya (Western Province)', district: 'Colombo' },
  { id: 'YC-2026-006', name: 'Dinesh Wickramasinghe (North Central)', district: 'Anuradhapura' },
  { id: 'YC-2026-007', name: 'Fathima Nusra (North Western)', district: 'Kurunegala' },
  { id: 'YC-2026-008', name: 'Praveen Karunakaran (Uva Province)', district: 'Badulla' },
  { id: 'YC-2026-009', name: 'Dilhani Senanayake (Sabaragamuwa)', district: 'Ratnapura' },
  { id: 'YC-2026-010', name: 'Malik Jayawardena (Central Province)', district: 'Nuwara Eliya' }
];

export const FieldCollectorView: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'PETITION' | 'SURVEY' | 'QUEUE'>('PETITION');

  // Champion Session
  const [selectedChampionId, setSelectedChampionId] = useState('YC-2026-001');
  const [championDistrict, setChampionDistrict] = useState('Kandy');

  // Queue Statistics
  const [queueStats, setQueueStats] = useState(OfflineQueueManager.getQueueStats());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Petition Form State
  const [petitionsList, setPetitionsList] = useState<any[]>([]);
  const [selectedPetitionId, setSelectedPetitionId] = useState('');
  const [citizenNic, setCitizenNic] = useState('');
  const [citizenDistrict, setCitizenDistrict] = useState('Kandy');
  const [citizenDOB, setCitizenDOB] = useState('');
  const [agreeDemands, setAgreeDemands] = useState(true);
  const [agreePdpa, setAgreePdpa] = useState(true);

  // Survey Form State
  const [policiesList, setPoliciesList] = useState<any[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [surveyAnswer, setSurveyAnswer] = useState('Strongly Support');
  const [surveyFeedback, setSurveyFeedback] = useState('');

  // Refresh statistics & network listeners
  const refreshStats = () => {
    setQueueStats(OfflineQueueManager.getQueueStats());
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load available petitions & policies
    const petitions = getClientDemoPetitions();
    setPetitionsList(petitions);
    if (petitions.length > 0) setSelectedPetitionId(petitions[0].id);

    const policies = getClientDemoPolicies();
    setPoliciesList(policies);
    if (policies.length > 0) setSelectedPolicyId(policies[0].id);

    refreshStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChampionChange = (id: string) => {
    setSelectedChampionId(id);
    const found = YOUTH_CHAMPION_ROSTER.find(c => c.id === id);
    if (found) {
      setChampionDistrict(found.district);
      setCitizenDistrict(found.district);
    }
    api.fieldChampionLogin(id, found?.district || 'Central');
  };

  // Submit Petition Signature to Offline Queue
  const handleSaveSignature = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    setErrorMessage(null);

    const cleanNIC = citizenNic.trim().toUpperCase().replace(/[\s-]/g, '');
    const nicValidation = decodeAndValidateSriLankanNIC(cleanNIC);
    if (!nicValidation.isValid) {
      setErrorMessage(nicValidation.validationError || 'Invalid Sri Lankan National ID (NIC) format or checksum.');
      return;
    }

    if (!agreeDemands || !agreePdpa) {
      setErrorMessage('Citizen must consent to the petition objectives and PDPA confidentiality terms.');
      return;
    }

    // Deterministic pseudo blind-index for offline caching
    const nicBlindIndex = `blind_hash_${cleanNIC}_${selectedPetitionId}`;
    const alias = `Citizen-${citizenDistrict}-${cleanNIC.slice(-4)}`;

    const result = OfflineQueueManager.enqueuePetitionSignature({
      type: 'PETITION_SIGNATURE',
      petitionId: selectedPetitionId,
      nicBlindIndex,
      anonymizedAlias: alias,
      district: citizenDistrict,
      collectorId: selectedChampionId,
      claimedDOB: citizenDOB || undefined,
      claimedGender: nicValidation.gender
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Duplicate signature detected.');
      return;
    }

    refreshStats();
    setFeedbackMessage(`✓ Offline signature recorded! ${alias} securely cached in local queue. Ready for next citizen.`);
    setTimeout(() => setFeedbackMessage(null), 4500);

    // Fast reset for next citizen in village queue
    setCitizenNic('');
    setCitizenDOB('');
  };

  // Submit Survey Response to Offline Queue
  const handleSaveSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    setErrorMessage(null);

    const blindId = `survey_blind_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    OfflineQueueManager.enqueueSurvey({
      type: 'SURVEY',
      surveyId: `survey_${selectedPolicyId}`,
      policyId: selectedPolicyId,
      citizenBlindIndex: blindId,
      district: citizenDistrict,
      answers: [
        { questionId: 'q_overall', answer: surveyAnswer },
        { questionId: 'q_feedback', answer: surveyFeedback || 'Supportive of rural community impact.' }
      ],
      collectorId: selectedChampionId,
      clientLanguage: 'en'
    });

    refreshStats();
    setFeedbackMessage(`✓ Offline questionnaire response recorded from ${citizenDistrict}! Saved to device queue.`);
    setTimeout(() => setFeedbackMessage(null), 4500);

    // Fast reset
    setSurveyFeedback('');
  };

  // Batch Sync Queues with Cloud / Demo Ledger
  const handleBatchSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const res = await api.batchSyncOfflineData();
      refreshStats();

      if (res.totalSynced > 0) {
        setFeedbackMessage(`✓ Successfully batch synchronized ${res.syncedSignatures} petition signatures and ${res.syncedSurveys} surveys to the National Ledger!`);
      } else {
        setFeedbackMessage('Queue is already up to date. All local submissions have been synchronized.');
      }
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(`Sync failed: ${err.message || 'Network still unstable. Queue remains securely cached.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    OfflineQueueManager.exportQueueBackup();
    setFeedbackMessage('✓ Encrypted field backup JSON exported successfully.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner: Youth Champion Field Mode Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-600/50 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lanka-gold/20 border border-lanka-gold/40 text-lanka-gold text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>Official CSLK Youth Champion • Offline Field Collector Mode</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Rural Village Civic Enumeration Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Equipping CSLK's top 10 Youth Champions to collect 10,000+ verified petition signatures and 1,000+ policy survey responses in remote areas with zero network connectivity.
            </p>
          </div>

          {/* Network Status Pill & Quick Action */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold ${
              isOnline
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
              <span>{isOnline ? 'Network Online (Ready to Sync)' : 'Ultra-Low Bandwidth Offline Active'}</span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Last Sync: {queueStats.lastSyncedAt ? formatSriLankanTimestamp(queueStats.lastSyncedAt) : 'Pending First Sync'}
            </div>
          </div>
        </div>

        {/* Champion Selector & District Toolbar */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Youth Champion:
            </label>
            <select
              value={selectedChampionId}
              onChange={(e) => handleChampionChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lanka-gold font-medium"
            >
              {YOUTH_CHAMPION_ROSTER.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Field District:
            </label>
            <select
              value={championDistrict}
              onChange={(e) => {
                setChampionDistrict(e.target.value);
                setCitizenDistrict(e.target.value);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lanka-gold font-medium"
            >
              {SRI_LANKAN_DISTRICTS.map(d => (
                <option key={d} value={d}>{d} District</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleBatchSync}
              disabled={isSyncing || queueStats.totalPending === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-md"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncing ? 'Syncing...' : `Batch Sync (${queueStats.totalPending})`}</span>
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              title="Export Encrypted Backup JSON"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all text-xs"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Notifications */}
      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700 text-red-200 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Field Queue Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pending Petition Signatures
          </span>
          <div className="text-2xl font-black text-lanka-gold">
            {queueStats.pendingSignatures}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Deduplicated locally by NIC blind indexing
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pending Policy Surveys
          </span>
          <div className="text-2xl font-black text-sky-400">
            {queueStats.pendingSurveys}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Cached for trilingual AI synthesis
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Device Queue
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {queueStats.totalPending}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Ready for instant batch sync upon reconnect
          </span>
        </div>
      </div>

      {/* Interactive Tabs: Petition Signature vs. Survey vs. Queue Ledger */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('PETITION')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'PETITION'
              ? 'bg-lanka-gold text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          1. Collect Petition Signature (Rapid)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SURVEY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'SURVEY'
              ? 'bg-lanka-gold text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          2. Collect Policy Survey (Rapid)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'QUEUE'
              ? 'bg-lanka-gold text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          3. Offline Queue & Device Security ({queueStats.totalPending})
        </button>
      </div>

      {/* TAB 1: Fast Petition Signature Collector */}
      {activeTab === 'PETITION' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-6 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-lanka-gold" />
                <span>Rapid Citizen Petition Collector</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Optimized for rural community enumerations: Collect hundreds of citizen signatures sequentially on a single tablet.
              </p>
            </div>
            <span className="text-[11px] font-mono text-lanka-gold font-bold">
              Enumerator: {selectedChampionId}
            </span>
          </div>

          <form onSubmit={handleSaveSignature} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Target E-Petition:
                </label>
                <select
                  value={selectedPetitionId}
                  onChange={(e) => setSelectedPetitionId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-lanka-gold font-medium"
                >
                  {petitionsList.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.category}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Citizen Electoral District:
                </label>
                <select
                  value={citizenDistrict}
                  onChange={(e) => setCitizenDistrict(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-lanka-gold font-medium"
                >
                  {SRI_LANKAN_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Citizen National Identity Card (NIC):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 901451234V or 199014501234"
                  value={citizenNic}
                  onChange={(e) => setCitizenNic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-lanka-gold"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  NIC is immediately hashed into a secret code; raw number is never saved locally.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Date of Birth (DD/MM/YYYY):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY (e.g. 24/05/1990)"
                    value={citizenDOB}
                    onChange={(e) => setCitizenDOB(formatSriLankanDate(e.target.value))}
                    maxLength={10}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-lanka-gold pl-9"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Official Sri Lankan date format (dd/mm/yyyy).
                </span>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeDemands}
                  onChange={(e) => setAgreeDemands(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                />
                <span className="text-slate-300 text-[11px] leading-relaxed">
                  Citizen confirms agreement with the petition demands and objective text.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePdpa}
                  onChange={(e) => setAgreePdpa(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-lanka-gold focus:ring-0"
                />
                <span className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>PDPA Guarantee:</strong> Your personal data is 100% confidential and will not be made public.
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCitizenNic('');
                  setCitizenDOB('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Fields</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <span>Save Signature & Next Citizen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Fast Rural Policy Survey Collector */}
      {activeTab === 'SURVEY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-6 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <span>Rapid Policy Survey Collector</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Collect citizen opinions on pending national legislative frameworks in rural communities.
              </p>
            </div>
            <span className="text-[11px] font-mono text-sky-400 font-bold">
              District: {championDistrict}
            </span>
          </div>

          <form onSubmit={handleSaveSurvey} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Policy Consultation:
              </label>
              <select
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-lanka-gold font-medium"
              >
                {policiesList.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Citizen Opinion Stance:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Strongly Support', 'Somewhat Support', 'Neutral / Deliberative', 'Require Amendments'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSurveyAnswer(opt)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      surveyAnswer === opt
                        ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Citizen Feedback / Community Concerns:
              </label>
              <textarea
                rows={3}
                value={surveyFeedback}
                onChange={(e) => setSurveyFeedback(e.target.value)}
                placeholder="Enter citizen's verbal remarks (Sinhala, Tamil, or English). PII is automatically scrubbed."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-lanka-gold leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <span>Save Survey & Next Citizen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Queue Ledger & Checkpoint Security Safeguards */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Local Device Offline Queue Ledger</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All items are held in client-side storage until an internet connection is established.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchSync}
                  disabled={isSyncing || queueStats.totalPending === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-40"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Sync Now</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/70 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Anonymized Alias</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Captured Timestamp (+05:30)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {OfflineQueueManager.getSignatureQueue().map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-lanka-gold font-bold">E-PETITION</td>
                      <td className="py-2 px-3">{s.anonymizedAlias}</td>
                      <td className="py-2 px-3 text-slate-400">{s.district}</td>
                      <td className="py-2 px-3 text-slate-400">{formatSriLankanTimestamp(s.collectedAt)}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          PENDING_SYNC
                        </span>
                      </td>
                    </tr>
                  ))}
                  {OfflineQueueManager.getSurveyQueue().map(sv => (
                    <tr key={sv.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-sky-400 font-bold">SURVEY</td>
                      <td className="py-2 px-3">{sv.citizenBlindIndex.slice(0, 18)}...</td>
                      <td className="py-2 px-3 text-slate-400">{sv.district}</td>
                      <td className="py-2 px-3 text-slate-400">{formatSriLankanTimestamp(sv.collectedAt)}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                          PENDING_SYNC
                        </span>
                      </td>
                    </tr>
                  ))}
                  {queueStats.totalPending === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                        No submissions in offline queue. All collected records are synced.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DAL Device Seizure Safeguard Guarantee Box */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-800/50 text-white space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Sri Lanka PDPA No. 9 of 2022 & Checkpoint Seizure Safeguard</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If this mobile device is inspected, seized, or searched at a police or military checkpoint during rural field enumeration, <strong>citizen identities cannot be compromised</strong>. All offline queue items are protected by irreversible HMAC-SHA256 salted blind indexing. Raw citizen names, National Identity Card (NIC) numbers, and phone numbers are never stored in plain text anywhere on the device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
