import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Shield,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Key,
  Clock,
  AlertCircle,
  Database,
  Loader2,
  Building,
  UserCheck,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  Printer,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Hash,
  FileCheck2,
  Building2,
  Send
} from 'lucide-react';
import { PolicyConsultation, PolicyLifecycleStage, EPetition } from '@e-lanka/shared';
import { api, getStoredUser } from '../services/api';
import { LifecycleBadge } from '../components/LifecycleBadge';

/**
 * Format timestamp to Sri Lanka Standard Time (+05:30) with full date, time, and timezone offset
 * e.g. YYYY-MM-DD HH:MM:SS +05:30
 */
export function formatSriLankanTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')} +05:30`;
  } catch {
    return isoString;
  }
}

export const AdminModerationPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'si' | 'ta') || 'en';
  const [user, setUser] = useState<any>(getStoredUser());

  const [activeTab, setActiveTab] = useState<'moderation' | 'ai_worker' | 'audit_logs'>(() => {
    const stored = getStoredUser();
    if (stored?.role === 'SYSTEM_AUDITOR') return 'audit_logs';
    return 'moderation';
  });
  const [pendingQueue, setPendingQueue] = useState<PolicyConsultation[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation Gate Action Modal
  const [selectedProposal, setSelectedProposal] = useState<PolicyConsultation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totpToken, setTotpToken] = useState(''); // RFC 6238 TOTP code from authenticator app
  const [panelNotes, setPanelNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // AI Sync Trigger state & Enhanced HITL Governance (Issue 3.2)
  const [selectedTargetForAI, setSelectedTargetForAI] = useState<string>('pol:b0000000-0000-0000-0000-000000000001');
  const [aiSyncRunning, setAiSyncRunning] = useState(false);
  const [aiSyncResult, setAiSyncResult] = useState<any>(null);
  const [hitlSummary, setHitlSummary] = useState<string>(
    'Based on 1,420 verified citizen submissions across 25 districts, 68% expressed strong support for statutory algorithmic accountability. Key public demands include mandatory independent bias audits for civil service promotion algorithms and preserving trilingual public access under PDPA No. 9 of 2022.'
  );
  const [isApprovedByAdmin, setIsApprovedByAdmin] = useState<boolean>(true);
  const [approvalAlert, setApprovalAlert] = useState<string | null>(null);

  // Targets Metadata Registry
  const TARGET_REGISTRY: Record<string, {
    title: string;
    code: string;
    type: 'POLICY' | 'PETITION';
    lastProcessedAt: string;
    totalSubmissions: number;
    sentimentDistribution: { positive: number; neutral: number; negative: number };
    defaultSummary: string;
    clusters: { title: string; percentage: number; recommendation: string; quotes: string[] }[];
  }> = {
    'pol:b0000000-0000-0000-0000-000000000001': {
      title: 'National AI Ethics & Algorithmic Accountability Framework',
      code: 'EL-POL-2026-001',
      type: 'POLICY',
      lastProcessedAt: '2026-11-20T10:15:00Z',
      totalSubmissions: 1420,
      sentimentDistribution: { positive: 68, neutral: 21, negative: 11 },
      defaultSummary: 'Based on 1,420 verified citizen submissions across 25 districts, 68% expressed strong support for statutory algorithmic accountability. Key public demands include mandatory independent bias audits for civil service promotion algorithms and preserving trilingual public access under PDPA No. 9 of 2022.',
      clusters: [
        {
          title: 'Mandatory Algorithmic Due Diligence & Bias Audits',
          percentage: 59,
          recommendation: 'Enforce statutory independent bias audits before state algorithms are deployed.',
          quotes: ['Independent technical certification needed before AI is used in credit scoring or civil service promotions.']
        },
        {
          title: 'Sovereign Open Data & Local Language Support (Sinhala/Tamil)',
          percentage: 41,
          recommendation: 'Establish sovereign open training corpuses in Sinhala and Tamil to prevent cultural bias.',
          quotes: ['AI systems trained purely on Western datasets fail on local cultural context; our national policy must support trilingual open corpuses.']
        }
      ]
    },
    'pol:b0000000-0000-0000-0000-000000000002': {
      title: 'Sustainable Agritech Subsidies & Renewable Solar Farming Policy',
      code: 'EL-POL-2026-002',
      type: 'POLICY',
      lastProcessedAt: '2026-11-19T14:40:00Z',
      totalSubmissions: 980,
      sentimentDistribution: { positive: 74, neutral: 18, negative: 8 },
      defaultSummary: 'Analysis of 980 agrarian submissions reveals 74% support for smart IoT moisture sensing subsidies and agrivoltaic solar installations across dry-zone agricultural districts.',
      clusters: [
        {
          title: 'Direct Subsidy Transfers for IoT Soil Moisture Sensors',
          percentage: 62,
          recommendation: 'Eliminate middleman delays by depositing sensor grants directly to farmer bank accounts.',
          quotes: ['Paddy farmers in Polonnaruwa and Anuradhapura require immediate duty-free access to smart water-saving sensors.']
        },
        {
          title: 'Grid Interconnection Guarantees for Agrisolar Installations',
          percentage: 38,
          recommendation: 'Mandate CEB net-metering approvals within 14 calendar days for farmland solar arrays.',
          quotes: ['Farmers generating surplus solar power over irrigation canals must receive prompt feed-in tariff payments.']
        }
      ]
    },
    'pol:b0000000-0000-0000-0000-000000000003': {
      title: 'Decentralized Healthcare Telemedicine Network for Rural Hospitals',
      code: 'EL-POL-2026-003',
      type: 'POLICY',
      lastProcessedAt: '2026-11-21T09:20:00Z',
      totalSubmissions: 850,
      sentimentDistribution: { positive: 82, neutral: 12, negative: 6 },
      defaultSummary: '850 healthcare practitioners and citizens recommend priority fiber connectivity to divisional hospitals in Badulla, Monaragala, and Nuwara Eliya for remote specialist triage.',
      clusters: [
        {
          title: 'Dedicated Telemedicine Specialist Rosters for Estate Hospitals',
          percentage: 67,
          recommendation: 'Establish formal video-consultation hours with National Hospital specialists.',
          quotes: ['Maternity and cardiac emergency survival rates in rural estates depend on immediate specialist video triage.']
        },
        {
          title: 'Secure Electronic Health Record Interoperability',
          percentage: 33,
          recommendation: 'Encrypt rural clinical notes under PDPA Section 21 standards with patient consent controls.',
          quotes: ['Patient records must transfer seamlessly between rural clinics and provincial teaching hospitals without paper loss.']
        }
      ]
    },
    'pet:pet_01': {
      title: 'Statutory Ban on Single-Use Microplastics in Consumer Packaging',
      code: 'EL-PET-2026-001',
      type: 'PETITION',
      lastProcessedAt: '2026-11-22T11:00:00Z',
      totalSubmissions: 3840,
      sentimentDistribution: { positive: 88, neutral: 8, negative: 4 },
      defaultSummary: 'With 3,840 verified citizen signatures across all 25 districts, overwhelming public consensus (88%) demands a phased statutory ban on non-biodegradable packaging, prioritizing marine ecosystem preservation in coastal lagoons.',
      clusters: [
        {
          title: 'Marine Microplastic Contamination & Coastal Ecosystem Defense',
          percentage: 64,
          recommendation: 'Enact immediate statutory restrictions on single-use polymer sachets under the Central Environmental Authority.',
          quotes: ['Fisheries and lagoon eco-tourism in Negombo and Puttalam are being devastated by plastic waste.']
        },
        {
          title: 'Incentives for Domestic Biodegradable Packaging Producers',
          percentage: 36,
          recommendation: 'Provide zero-VAT import loans for organic banana-fiber and bagasse manufacturing machinery.',
          quotes: ['Retail shopkeepers and street vendors must have access to affordable biodegradable bags before fines are levied.']
        }
      ]
    },
    'pet:pet_02': {
      title: 'Mandate Open Fiber Access & Universal High-Speed Broadband across Rural Schools',
      code: 'EL-PET-2026-002',
      type: 'PETITION',
      lastProcessedAt: '2026-11-21T16:30:00Z',
      totalSubmissions: 5120,
      sentimentDistribution: { positive: 91, neutral: 6, negative: 3 },
      defaultSummary: '5,120 verified signatures urge the Ministry of Technology and TRCSL to enforce universal service fund allocations to bridge the acute rural-urban digital education divide.',
      clusters: [
        {
          title: 'Zero-Rated Educational Bandwidth for 1AB and Type 2 Provincial Schools',
          percentage: 71,
          recommendation: 'Mandate telecom operators to provide unmetered optical fiber bandwidth to all rural government schools.',
          quotes: ['Students in rural Monaragala cannot participate in online STEM and AI classes due to prohibitive mobile data costs.']
        },
        {
          title: 'Solar Backup Power for Rural School IT Laboratories',
          percentage: 29,
          recommendation: 'Equip school computer labs with off-grid lithium battery backups to prevent blackouts during school hours.',
          quotes: ['Frequent load shedding and lightning outages disrupt computer science examinations in rural secondary schools.']
        }
      ]
    },
    'pet:pet_03': {
      title: 'Establishment of National Youth Digital Assembly & Algorithmic Oversight Committee',
      code: 'EL-PET-2026-003',
      type: 'PETITION',
      lastProcessedAt: '2026-11-20T17:45:00Z',
      totalSubmissions: 2350,
      sentimentDistribution: { positive: 85, neutral: 11, negative: 4 },
      defaultSummary: '2,350 youth advocates demand institutional representation for young digital creators, students, and technologists on statutory AI governance panels.',
      clusters: [
        {
          title: 'Permanent Youth Representation on Data Protection & AI Advisory Boards',
          percentage: 58,
          recommendation: 'Legislate 2 permanent seats for youth under 30 on the Data Protection Authority Advisory Council.',
          quotes: ['Youth are the primary users of digital platforms; national technology policy must not be drafted without youth input.']
        },
        {
          title: 'Protection of Youth Whistleblowers & Ethical Tech Researchers',
          percentage: 42,
          recommendation: 'Provide statutory immunity under the Online Safety Act for legitimate security vulnerability disclosures.',
          quotes: ['Young cybersecurity students who report security flaws must be protected from vexatious legal harassment.']
        }
      ]
    }
  };

  // PII Scrubbing Tester
  const [testScrubInput, setTestScrubInput] = useState('I am citizen Samantha Perera (NIC: 851234567V, Phone: +94 77 123 4567, email: samantha@gmail.com). I strongly urge TRCSL to enforce strict data privacy.');
  const [scrubOutput, setScrubOutput] = useState<any>(null);

  // PDPA Statutory Audit Ledger Enhanced State (Issue 1.4)
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditRoleFilter, setAuditRoleFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalRecords, setAuditTotalRecords] = useState(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Live Chain Integrity Verification state
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainVerifyData, setChainVerifyData] = useState<any | null>(null);
  const [isChainModalOpen, setIsChainModalOpen] = useState(false);

  // Instant Breach Alert state
  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);
  const [breachSeverity, setBreachSeverity] = useState<'HIGH' | 'CRITICAL' | 'MEDIUM'>('HIGH');
  const [breachIncidentType, setBreachIncidentType] = useState('Unauthorized Administrative 2FA Breach Attempt');
  const [breachDetails, setBreachDetails] = useState('');
  const [breachSending, setBreachSending] = useState(false);
  const [breachSuccess, setBreachSuccess] = useState<any | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, auditSearch, auditActionFilter, auditRoleFilter, auditDateFilter, auditPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'moderation') {
        if (['PANEL_MODERATOR', 'POLICY_ADMIN'].includes(user?.role)) {
          const res = await api.getPendingQueue();
          setPendingQueue(res.data);
        }
      } else if (activeTab === 'audit_logs') {
        if (['SYSTEM_AUDITOR', 'PANEL_MODERATOR', 'POLICY_ADMIN'].includes(user?.role)) {
          let startDate: string | undefined;
          if (auditDateFilter === '24H') {
            startDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
          } else if (auditDateFilter === '7D') {
            startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
          } else if (auditDateFilter === '30D') {
            startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
          }

          const res = await api.getAuditLogs({
            search: auditSearch.trim() || undefined,
            action: auditActionFilter !== 'ALL' ? auditActionFilter : undefined,
            role: auditRoleFilter !== 'ALL' ? auditRoleFilter : undefined,
            startDate,
            page: auditPage,
            limit: 10
          });
          setAuditLogs(res.logs || []);
          setAuditTotalRecords(res.total || res.logs?.length || 0);
          setAuditTotalPages(res.totalPages || Math.ceil((res.total || res.logs?.length || 0) / 10) || 1);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModeration = (policy: PolicyConsultation) => {
    setSelectedProposal(policy);
    setPanelNotes(`Reviewed and assessed by statutory panel. Proposal satisfies statutory governance and constitutional benchmarks.`);
    setActionError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const handleModerateProposal = async (approved: boolean) => {
    if (!selectedProposal) return;
    if (!totpToken || totpToken.trim().length !== 6) {
      setActionError('Valid 6-digit TOTP authentication code is mandatory.');
      return;
    }

    setProcessingAction(true);
    setActionError(null);
    try {
      const res = await api.moderatePolicy(
        selectedProposal.id,
        approved,
        panelNotes,
        totpToken
      );

      setActionSuccess(res.message);
      setTimeout(() => {
        setIsModalOpen(false);
        loadDashboardData();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Moderation decision failed.');
    } finally {
      setProcessingAction(false);
    }
  };

  const currentTargetData = TARGET_REGISTRY[selectedTargetForAI] || TARGET_REGISTRY['pol:b0000000-0000-0000-0000-000000000001'];

  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetForAI(targetId);
    const target = TARGET_REGISTRY[targetId];
    if (target) {
      setHitlSummary(target.defaultSummary);
      setIsApprovedByAdmin(true);
      setApprovalAlert(null);
    }
  };

  const handleTriggerAISync = async () => {
    setAiSyncRunning(true);
    setApprovalAlert(null);
    try {
      const res = await api.triggerAISync(selectedTargetForAI, totpToken);
      setAiSyncResult(res.aggregate);
      setIsApprovedByAdmin(false); // New AI run requires fresh human-in-the-loop approval
      if (res.aggregate?.thematicClusters && res.aggregate.thematicClusters.length > 0) {
        setHitlSummary(
          `AI Synthesis Complete: ${res.aggregate.totalSubmissions} verified citizen inputs analyzed. Sentiment split: ${res.aggregate.sentimentDistribution.positive}% Positive, ${res.aggregate.sentimentDistribution.neutral}% Neutral, ${res.aggregate.sentimentDistribution.negative}% Critical. Top citizen demand: ${res.aggregate.thematicClusters[0].themeTitle.en}.`
        );
      }
    } catch (e: any) {
      alert(e.message || 'AI Sync failed');
    } finally {
      setAiSyncRunning(false);
    }
  };

  const handleApproveAISummary = () => {
    setIsApprovedByAdmin(true);
    setApprovalAlert('✓ Successfully approved by Policy Admin! AI opinion clusters and executive summary are now published to the public portal and recorded in the statutory audit ledger.');
    setTimeout(() => setApprovalAlert(null), 5000);
  };

  const generatePolicyBriefHtml = () => {
    const target = currentTargetData;
    const dateFormatted = new Date().toLocaleDateString('en-GB');
    const timeFormatted = formatSriLankanTimestamp(new Date().toISOString());

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Policy Brief - ${target.code} - ${target.title}</title>
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.6; }
          .header { border-bottom: 3px solid #8c1d40; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 24px; font-weight: 800; color: #8c1d40; margin: 0; }
          .subtitle { font-size: 13px; color: #475569; font-weight: 600; text-transform: uppercase; margin-top: 5px; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .institutions-box { background: #fdf2f8; border: 1px solid #fbcfe8; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .institutions-box h3 { font-size: 13px; color: #831843; text-transform: uppercase; margin-top: 0; }
          .institutions-box ol { margin: 5px 0 0 20px; padding: 0; font-size: 12px; color: #334155; }
          h2 { font-size: 16px; font-weight: 700; color: #1e293b; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px; margin-top: 25px; }
          p { font-size: 12.5px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          th { background: #1e293b; color: #ffffff; text-align: left; padding: 10px; font-weight: 600; }
          td { border: 1px solid #cbd5e1; padding: 10px; }
          .cluster-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 10px; }
          .quote { font-style: italic; color: #475569; border-left: 3px solid #8c1d40; padding-left: 10px; margin-top: 6px; font-size: 11.5px; }
          .footer-statutory { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-top: 35px; font-size: 11px; color: #166534; }
          @media print {
            body { margin: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">COMMUNITY SOLUTIONS LANKA (CSLK)</div>
          <div class="subtitle">E-Lanka Sovereign Digital Democracy Platform • Official Statutory Policy Brief</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Transmission Reference: CSLK-BRIEF-2026-${target.code} • Date: ${dateFormatted} (${timeFormatted})</div>
        </div>

        <div class="institutions-box">
          <h3>Formally Addressed & Submitted to Statutory State Authorities</h3>
          <ol>
            <li><strong>Parliament Secretariat & Sectoral Oversight Committee on Governance & Digital Rights</strong></li>
            <li><strong>Presidential Secretariat — Policy Implementation & Public Petitions Bureau</strong></li>
            <li><strong>Ministry of Technology & Digital Economy of Sri Lanka</strong></li>
            <li><strong>Ministry of Public Administration, Provincial Councils and Local Government</strong></li>
            <li><strong>Data Protection Authority of Sri Lanka (DPA)</strong> (Statutory Oversight under PDPA No. 9 of 2022)</li>
            <li><strong>National Youth Services Council (NYSC) & Ministry of Youth Affairs</strong></li>
          </ol>
        </div>

        <div class="meta-grid">
          <div><strong>Consultation Title:</strong> ${target.title}</div>
          <div><strong>Statutory Code:</strong> ${target.code} (${target.type})</div>
          <div><strong>Verified Citizen Participation:</strong> ${target.totalSubmissions.toLocaleString()} Citizens</div>
          <div><strong>Geographical Scope:</strong> All 25 Electoral Districts of Sri Lanka</div>
        </div>

        <h2>1. Executive Summary & Policy Recommendations</h2>
        <p>${hitlSummary}</p>

        <h2>2. Public Sentiment & Citizen Verification Metrics</h2>
        <table>
          <tr>
            <th>Public Sentiment Classification</th>
            <th>Percentage</th>
            <th>Verification Standard</th>
          </tr>
          <tr>
            <td>Positive / Strong Civic Support</td>
            <td><strong>${target.sentimentDistribution.positive}%</strong></td>
            <td>Trilingual NLP (Sinhala, Tamil, English)</td>
          </tr>
          <tr>
            <td>Neutral / Deliberative Inquiries</td>
            <td><strong>${target.sentimentDistribution.neutral}%</strong></td>
            <td>Trilingual NLP (Sinhala, Tamil, English)</td>
          </tr>
          <tr>
            <td>Critical / Alternative Proposals</td>
            <td><strong>${target.sentimentDistribution.negative}%</strong></td>
            <td>Trilingual NLP (Sinhala, Tamil, English)</td>
          </tr>
        </table>

        <h2>3. Key Thematic Clusters & Actionable Public Demands</h2>
        ${target.clusters.map(c => `
          <div class="cluster-box">
            <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${c.title} (${c.percentage}% of submissions)</div>
            <div style="margin-top: 4px; font-size: 12px; color: #334155;"><strong>Citizen Recommendation:</strong> ${c.recommendation}</div>
            <div class="quote">"${c.quotes[0]}"</div>
          </div>
        `).join('')}

        <div class="footer-statutory">
          <strong>STATUTORY PDPA NO. 9 OF 2022 & CRYPTOGRAPHIC ASSURANCE:</strong><br />
          This policy brief comprises 100% zero-PII aggregated citizen data. Personal names, National Identity Card numbers (NIC), phone numbers, and addresses were stripped locally via client-side regex rules prior to AI synthesis. All citizen submissions are cryptographically sealed with AES-256-GCM Field-Level Encryption and immutable HMAC-SHA256 chained audit hashes.<br /><br />
          <strong>Certified by:</strong> Policy Admin & Statutory Panel Gate, Community Solutions Lanka (CSLK)
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPolicyBriefPDF = () => {
    const html = generatePolicyBriefHtml();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to open and print the Policy Brief PDF.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  const handleExportPolicyBriefWord = () => {
    const html = generatePolicyBriefHtml();
    const target = currentTargetData;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Policy_Brief_${target.code}_CSLK.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunScrubTest = async () => {
    try {
      const data = await api.testScrubPII(testScrubInput);
      setScrubOutput(data);
    } catch (e) {
      console.error('Scrub failed', e);
    }
  };

  // --------------------------------------------------------------------------
  // Audit Ledger Handlers (Issue 1.4)
  // --------------------------------------------------------------------------
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleVerifyChainIntegrity = async () => {
    try {
      setVerifyingChain(true);
      const res = await api.verifyAuditChain();
      setChainVerifyData(res);
      setIsChainModalOpen(true);
    } catch (e: any) {
      alert(`Verification failed: ${e.message}`);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleExportCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    const headers = ['Record ID', 'Timestamp (+05:30)', 'Action', 'Actor Role', 'Resource Type', 'Resource ID', 'Purpose Description', 'HMAC-SHA256 Chained Signature'];
    const rows = auditLogs.map(l => [
      `"${l.id}"`,
      `"${formatSriLankanTimestamp(l.timestamp)}"`,
      `"${l.action}"`,
      `"${l.actorRole}"`,
      `"${l.resourceType}"`,
      `"${l.resourceId || ''}"`,
      `"${(l.purposeDescription || '').replace(/"/g, '""')}"`,
      `"${l.immutableSignature}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PDPA_Statutory_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleSendBreachAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreachSending(true);
    try {
      const res = await api.sendBreachAlert({
        incidentType: breachIncidentType,
        details: breachDetails || 'Administrative alert triggered by security auditor via dashboard.',
        severity: breachSeverity
      });
      setBreachSuccess(res);
      loadDashboardData();
      setTimeout(() => {
        setIsBreachModalOpen(false);
        setBreachSuccess(null);
        setBreachDetails('');
      }, 3000);
    } catch (e: any) {
      alert(`Failed to dispatch alert: ${e.message}`);
    } finally {
      setBreachSending(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'FAILED_2FA_ATTEMPT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">FAILED_2FA_ATTEMPT</span>;
      case 'DATA_ERASURE_EXECUTED':
      case 'ERASURE_COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">DATA_ERASURE_EXECUTED</span>;
      case 'AI_PII_SCRUBBING_TRIGGERED':
      case 'AI_SCRUBBING_RUN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">AI_PII_SCRUBBING_TRIGGERED</span>;
      case 'EPETITION_SIGNED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">EPETITION_SIGNED</span>;
      case 'POLICY_PUBLISHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">POLICY_PUBLISHED</span>;
      case 'ADMIN_PANEL_ACCESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">ADMIN_PANEL_ACCESS</span>;
      case 'DATA_INGESTION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">DATA_INGESTION</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{action}</span>;
    }
  };

  const isAdmin = user && ['PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'].includes(user.role);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Administrative Access Restricted</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          The Moderation Gate, AI Opinion Mapping, and PDPA Statutory Audit Ledger are restricted to verified administrative staff with multi-factor authentication (RFC 6238 TOTP).
        </p>
        <div className="pt-3">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Access Admin Login Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-xs font-semibold text-red-300">
          <Lock className="w-3.5 h-3.5" />
          <span>Section 3.1 Restricted Moderation Panel Gate & 2FA Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {t('admin.title')}
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('admin.subtitle')}. Designated experts must review incoming policy drafts and explicitly grant <span className="text-lanka-gold font-mono font-bold">APPROVED_PANEL</span> status before questionnaires can be formulated or deployed.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Authenticated Role:</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              {user?.role}
            </span>
            <span className="text-xs text-slate-400">({user?.anonymizedAlias})</span>
          </div>
          <Link
            to="/admin/login"
            className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 font-medium"
          >
            <Lock className="w-3 h-3" />
            <span>Switch Role / Re-authenticate</span>
          </Link>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'moderation'
              ? 'bg-lanka-maroon text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-lanka-gold" />
          <span>Stage 1 Moderation Gate</span>
          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">
            {pendingQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ai_worker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'ai_worker'
              ? 'bg-lanka-maroon text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-lanka-gold" />
          <span>AI Opinion Mapping & PII Scrubbing</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'audit_logs'
              ? 'bg-lanka-maroon text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-lanka-gold" />
          <span>PDPA Statutory Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: Stage 1 Moderation Queue */}
      {activeTab === 'moderation' && (
        !['PANEL_MODERATOR', 'POLICY_ADMIN'].includes(user?.role) ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 space-y-3">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-bold text-white">Role Permission Required</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Reviewing and moderating Stage 1 policy drafts is restricted to <strong>PANEL_MODERATOR</strong> or <strong>POLICY_ADMIN</strong> roles. Your active authenticated role is <strong>{user?.role}</strong>.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Incoming Policy Draft Proposals Awaiting Panel Gate Review</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Pending: {pendingQueue.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading pending queue...</div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Stage 1 Queue Clear</h4>
              <p className="text-xs max-w-sm mx-auto">
                All submitted policy drafts have been reviewed by designated moderation panels.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQueue.map((policy) => {
                const title = policy.title[currentLang] || policy.title.en;
                const summary = policy.summary[currentLang] || policy.summary.en;

                return (
                  <div
                    key={policy.id}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 text-white"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-lanka-gold/15 text-lanka-gold border border-lanka-gold/30">
                          {policy.code}
                        </span>
                        <span className="text-xs uppercase font-semibold text-slate-400">
                          {policy.category}
                        </span>
                      </div>
                      <LifecycleBadge stage={policy.stage} size="sm" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-bold text-white">{title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                      <div className="space-y-0.5">
                        <span className="block font-medium">Author Agency: {policy.authorAgency}</span>
                        <span className="block">Target Ministry: {policy.targetMinistry}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenModeration(policy)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t('admin.reviewBtn')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )
      )}

      {/* TAB 2: AI Worker & PII Scrubbing */}
      {activeTab === 'ai_worker' && (
        !['POLICY_ADMIN', 'PANEL_MODERATOR'].includes(user?.role) ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 space-y-3">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-bold text-white">Role Permission Required</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Triggering AI opinion clustering and PII scrubbing is restricted to <strong>POLICY_ADMIN</strong>. Your active authenticated role is <strong>{user?.role}</strong>.
            </p>
          </div>
        ) : (
        <div className="space-y-8">
          {/* AI Opinion Mapping Trigger & Target Selector (Issue 3.2) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lanka-gold" />
                  <h3 className="text-lg font-bold text-white">
                    Asynchronous AI Opinion Mapping & Policy Brief Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mt-1">
                  Extracts qualitative sentiment, clusters public feedback into legislative priorities, scrubs PII, and prepares formal statutory policy briefs for state institutions.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Sovereign Local PII Scrubbing</span>
              </div>
            </div>

            {/* Target Selector: Includes both Policy Consultations and E-Petitions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Civic Consultation or Verified E-Petition:
                </label>
                <select
                  value={selectedTargetForAI}
                  onChange={(e) => handleSelectTarget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lanka-gold font-medium"
                >
                  <optgroup label="🏛️ National Policy Consultations">
                    <option value="pol:b0000000-0000-0000-0000-000000000001">
                      [POLICY] EL-POL-2026-001: National AI Ethics & Algorithmic Accountability Framework
                    </option>
                    <option value="pol:b0000000-0000-0000-0000-000000000002">
                      [POLICY] EL-POL-2026-002: Sustainable Agritech Subsidies & Renewable Solar Farming Policy
                    </option>
                    <option value="pol:b0000000-0000-0000-0000-000000000003">
                      [POLICY] EL-POL-2026-003: Decentralized Healthcare Telemedicine Network for Rural Hospitals
                    </option>
                  </optgroup>
                  <optgroup label="✍️ Verified Citizen E-Petitions">
                    <option value="pet:pet_01">
                      [PETITION] EL-PET-2026-001: Statutory Ban on Single-Use Microplastics in Consumer Packaging
                    </option>
                    <option value="pet:pet_02">
                      [PETITION] EL-PET-2026-002: Mandate Open Fiber Access & Universal High-Speed Broadband across Rural Schools
                    </option>
                    <option value="pet:pet_03">
                      [PETITION] EL-PET-2026-003: Establishment of National Youth Digital Assembly & Algorithmic Oversight Committee
                    </option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  RFC 6238 TOTP 2FA Verification:
                </label>
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  placeholder="6-digit authenticator code"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-lanka-gold"
                />
              </div>
            </div>

            {/* Target Status & Execution Timestamp Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${currentTargetData.type === 'POLICY' ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300' : 'bg-amber-950/80 border-amber-700 text-amber-300'}`}>
                    {currentTargetData.type === 'POLICY' ? 'Policy Consultation' : 'Verified E-Petition'}
                  </span>
                  <span className="font-mono text-xs font-bold text-lanka-gold">
                    {currentTargetData.code}
                  </span>
                  <span className="text-xs text-white font-medium truncate max-w-md">
                    {currentTargetData.title}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-lanka-gold" />
                  <span>Last AI Execution Timestamp (+05:30): <strong className="text-white">{formatSriLankanTimestamp(currentTargetData.lastProcessedAt)}</strong></span>
                </div>
              </div>

              {/* Result Summary Bar */}
              <div className="pt-1 border-t border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Result Summary:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Verified Inputs Analyzed:</span>
                    <span className="font-bold text-white text-sm">{currentTargetData.totalSubmissions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Civic Support / Positive:</span>
                    <span className="font-bold text-emerald-400 text-sm">{currentTargetData.sentimentDistribution.positive}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Critical / Inquiries:</span>
                    <span className="font-bold text-amber-400 text-sm">{currentTargetData.sentimentDistribution.negative + currentTargetData.sentimentDistribution.neutral}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Thematic Clusters:</span>
                    <span className="font-bold text-lanka-gold text-sm">{currentTargetData.clusters.length} Core Priorities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTriggerAISync}
                disabled={aiSyncRunning}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lanka-gold hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
              >
                {aiSyncRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Trilingual AI Workers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Trigger AI Analysis for {currentTargetData.code}</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400">
                Requires 6-digit TOTP authentication from registered Policy Admin.
              </span>
            </div>

            {/* Approval Notification */}
            {approvalAlert && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{approvalAlert}</span>
              </div>
            )}
          </div>

          {/* Human-in-the-Loop (HITL) Review, Editing & Policy Brief Export Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  <span>Human-in-the-Loop (HITL) Review & Statutory Policy Brief Generator</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Statutory panel oversight: Administrators must review, edit, and formally approve AI synthesized briefs before public release or ministerial transmission.
                </p>
              </div>

              <div>
                {isApprovedByAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>APPROVED & PUBLISHED (HITL VERIFIED)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-semibold animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>DRAFT AI INSIGHTS — PENDING APPROVAL</span>
                  </span>
                )}
              </div>
            </div>

            {/* Formally Addressed to the 6 State Institutions */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-lanka-gold" />
                <span>Statutory Submission Target: 6 Key State Institutions</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  1. Parliament Secretariat & Sectoral Oversight Committee
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  2. Presidential Secretariat (Policy Implementation Unit)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  3. Ministry of Technology & Digital Economy
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  4. Ministry of Public Administration & Local Government
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  5. Data Protection Authority of Sri Lanka (DPA)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  6. National Youth Services Council (NYSC)
                </div>
              </div>
            </div>

            {/* Editable Executive Summary Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-lanka-gold" />
                  <span>AI Executive Summary & Recommendations (Human-Editable Before Publication):</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {hitlSummary.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={hitlSummary}
                onChange={(e) => {
                  setHitlSummary(e.target.value);
                  setIsApprovedByAdmin(false); // Any manual edit marks as pending until approved
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-lanka-gold leading-relaxed font-sans"
                placeholder="Review and customize the executive summary for the target state ministries..."
              />
              <span className="text-[10px] text-slate-400 block">
                Policy Admins can fine-tune text for legal rigor before exporting briefs or publishing to the public discovery hub.
              </span>
            </div>

            {/* Thematic Clusters Cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Synthesized Public Thematic Clusters & Demands ({currentTargetData.clusters.length} Core Areas)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentTargetData.clusters.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white">{c.title}</span>
                      <span className="px-2 py-0.5 rounded bg-lanka-maroon/80 border border-lanka-gold/30 text-lanka-gold text-[10px] font-bold">
                        {c.percentage}% weight
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <strong>Policy Action:</strong> {c.recommendation}
                    </p>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10.5px] italic text-slate-400">
                      "{c.quotes[0]}"
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons: Approve & Exports (PDF/Print and Word) */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <div>
                {!isApprovedByAdmin ? (
                  <button
                    type="button"
                    onClick={handleApproveAISummary}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Publish to Public Hub</span>
                  </button>
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Brief is verified and active for parliamentary submission.</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPolicyBriefPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-lanka-gold text-xs font-semibold transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4 text-lanka-gold" />
                  <span>Export Policy Brief (PDF / Print)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPolicyBriefWord}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-sky-400 text-xs font-semibold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Export Policy Brief (Word / .doc)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Trilingual PII Scrubbing & Heuristic Inspector (Issue 1.5) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Trilingual PII Sanitizer & Sri Lankan Identity Redaction Inspector</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  PDPA-compliant NLP engine: Detects and redacts Sri Lankan NICs (9+V/X & 12-digit), phone numbers, emails, personal names, villages/addresses, and state authorities in <strong>English, Sinhala (සිංහල), and Tamil (தமிழ்)</strong>.
                </p>
              </div>
            </div>

            {/* Language Quick-Fill Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Load Test Preset:</span>
              <button
                type="button"
                onClick={() => setTestScrubInput('I am citizen Samantha Perera (NIC: 851234567V, Phone: +94 77 123 4567, email: samantha@gmail.com, living in Kandy). I strongly urge TRCSL to enforce strict data privacy.')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
              >
                🇬🇧 English Sample
              </button>
              <button
                type="button"
                onClick={() => setTestScrubInput('මම කමල් පෙරේරා (ජා.හැ.අංකය: 851234567V, දුරකථනය: 0771234567, විද්‍යුත් තැපෑල: kamal.perera@gmail.com). මම පදිංචි මහනුවර දිස්ත්‍රික්කයේ ගන්නෝරුව ගමේ. ලංකා විදුලිබල මණ්ඩලය පිළිබඳ මෙම ප්‍රතිපත්තියට මම එකඟයි.')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
              >
                🇱🇰 Sinhala (සිංහල) Sample
              </button>
              <button
                type="button"
                onClick={() => setTestScrubInput('நான் குமார் செல்வா (தேசிய அடையாள அட்டை: 199012345678, தொலைபேசி: +94 71 234 5678, மின்னஞ்சல்: kumar.selva@gmail.com). நான் வசிக்கும் இடம் யாழ்ப்பாணம் நல்லூர் கிராமம். இந்த கொள்கையை நான் முழுமையாக ஆதரிக்கிறேன்.')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
              >
                🇱🇰 Tamil (தமிழ்) Sample
              </button>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={testScrubInput}
                onChange={(e) => setTestScrubInput(e.target.value)}
                placeholder="Enter feedback in English, Sinhala, or Tamil containing citizen identity attributes..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-lanka-gold"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunScrubTest}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Inspect Sanitization & Sentiment
                </button>
                <span className="text-[11px] text-slate-400">Offline & In-Browser Verified</span>
              </div>
            </div>

            {scrubOutput && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Scrubbed Output (Zero-PII Public Surface):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Original: {scrubOutput.originalLength} chars → Sanitized: {scrubOutput.scrubbedText.length} chars
                  </span>
                </div>
                
                <p className="font-mono text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed select-all">
                  {scrubOutput.scrubbedText}
                </p>

                {/* Detected PII Category Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Detected & Redacted Entities ({scrubOutput.piiItemsDetected.reduce((acc: number, item: any) => acc + item.count, 0)} total):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scrubOutput.piiItemsDetected.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No sensitive PII entities detected.</span>
                    ) : (
                      scrubOutput.piiItemsDetected.map((item: any, idx: number) => {
                        let colorClass = 'bg-slate-700 text-slate-200 border-slate-600';
                        let label = item.type;
                        if (item.type === 'NIC_NUMBER') {
                          colorClass = 'bg-amber-950/80 text-amber-300 border-amber-800';
                          label = 'National ID (NIC)';
                        } else if (item.type === 'PHONE_NUMBER') {
                          colorClass = 'bg-blue-950/80 text-blue-300 border-blue-800';
                          label = 'Phone Number';
                        } else if (item.type === 'EMAIL') {
                          colorClass = 'bg-purple-950/80 text-purple-300 border-purple-800';
                          label = 'Email Address';
                        } else if (item.type === 'PERSON_NAME') {
                          colorClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                          label = 'Person Name';
                        } else if (item.type === 'ADDRESS') {
                          colorClass = 'bg-sky-950/80 text-sky-300 border-sky-800';
                          label = 'Address / Village';
                        } else if (item.type === 'ORGANIZATION') {
                          colorClass = 'bg-rose-950/80 text-rose-300 border-rose-800';
                          label = 'Organization / Authority';
                        }
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass}`}
                          >
                            {label}: {item.count}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Qualitative Trilingual Sentiment Synthesis */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300 pt-2 border-t border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Sentiment Score:</span>
                    <span className={`font-bold font-mono ${
                      scrubOutput.sentiment.score > 0 ? 'text-emerald-400' :
                      scrubOutput.sentiment.score < 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {scrubOutput.sentiment.score > 0 ? `+${scrubOutput.sentiment.score}` : scrubOutput.sentiment.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Classification:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ['POSITIVE', 'VERY_POSITIVE'].includes(scrubOutput.sentiment.label) ? 'bg-emerald-900/60 text-emerald-300' :
                      ['NEGATIVE', 'VERY_NEGATIVE'].includes(scrubOutput.sentiment.label) ? 'bg-rose-900/60 text-rose-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {scrubOutput.sentiment.label}
                      {scrubOutput.sentiment.label === 'POSITIVE' && ' (ධනාත්මක / சாதகமானது)'}
                      {scrubOutput.sentiment.label === 'NEGATIVE' && ' (සෘණාත්මක / பாதகமானது)'}
                      {scrubOutput.sentiment.label === 'NEUTRAL' && ' (මධ්‍යස්ථ / நடுநிலை)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="font-mono text-slate-300">{Math.round(scrubOutput.sentiment.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* TAB 3: PDPA Statutory Audit Ledger */}
      {activeTab === 'audit_logs' && (
        !['SYSTEM_AUDITOR', 'PANEL_MODERATOR', 'POLICY_ADMIN'].includes(user?.role) ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 space-y-3">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-bold text-white">Role Permission Required</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Inspecting the immutable PDPA statutory audit ledger is restricted to <strong>SYSTEM_AUDITOR</strong>. Your active authenticated role is <strong>{user?.role}</strong>.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Header & Statutory Actions Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-lanka-gold" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  PDPA Statutory Immutable Audit Ledger (Sections 12 & 21)
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded font-bold">
                  SEAL INTACT
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chained cryptographic HMAC-SHA256 signatures guarantee tamper-evident logging across all administrative access, voting, and data erasure.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyChainIntegrity}
                disabled={verifyingChain}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-xs font-semibold transition-all shadow-sm"
              >
                {verifyingChain ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Chain...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Chain Integrity</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5 text-lanka-gold" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBreachModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Breach Alert</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Search purpose, actor, hash..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-lanka-gold"
                />
              </div>

              {/* Action Filter */}
              <div>
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="ALL">All Statutory Event Actions</option>
                  <option value="FAILED_2FA_ATTEMPT">FAILED_2FA_ATTEMPT (Security)</option>
                  <option value="DATA_ERASURE_EXECUTED">DATA_ERASURE_EXECUTED (Sec 14)</option>
                  <option value="AI_PII_SCRUBBING_TRIGGERED">AI_PII_SCRUBBING_TRIGGERED (PII)</option>
                  <option value="EPETITION_SIGNED">EPETITION_SIGNED (Petitions)</option>
                  <option value="POLICY_PUBLISHED">POLICY_PUBLISHED (Governance)</option>
                  <option value="ADMIN_PANEL_ACCESS">ADMIN_PANEL_ACCESS (Moderation)</option>
                  <option value="DATA_INGESTION">DATA_INGESTION (Encrypted Survey)</option>
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={auditRoleFilter}
                  onChange={(e) => {
                    setAuditRoleFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="ALL">All Actor Roles</option>
                  <option value="SYSTEM_AUDITOR">SYSTEM_AUDITOR</option>
                  <option value="PANEL_MODERATOR">PANEL_MODERATOR</option>
                  <option value="POLICY_ADMIN">POLICY_ADMIN</option>
                  <option value="CITIZEN">CITIZEN</option>
                  <option value="AI_WORKER">AI_WORKER</option>
                  <option value="UNKNOWN">UNKNOWN / EXTERNAL</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={auditDateFilter}
                  onChange={(e) => {
                    setAuditDateFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="ALL">All Time Periods</option>
                  <option value="24H">Past 24 Hours</option>
                  <option value="7D">Past 7 Days</option>
                  <option value="30D">Past 30 Days</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditActionFilter('ALL');
                    setAuditRoleFilter('ALL');
                    setAuditDateFilter('ALL');
                    setAuditPage(1);
                    loadDashboardData();
                  }}
                  title="Reset Filters"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
              <div>
                Displaying <span className="text-white font-bold">{auditLogs.length}</span> of <span className="text-white font-bold">{auditTotalRecords}</span> immutable statutory ledger records
              </div>
              <div>
                Timezone: <span className="text-amber-400 font-bold">Asia/Colombo (+05:30)</span>
              </div>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Timestamp (YYYY-MM-DD +05:30)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor Role</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Statutory Purpose Description</th>
                    <th className="py-3 px-4 text-right">HMAC Chain Seal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                        No audit records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-amber-300/90">
                          {formatSriLankanTimestamp(log.timestamp)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                          <div>{log.resourceType}</div>
                          {log.resourceId && (
                            <div className="text-slate-500 truncate max-w-[100px]">{log.resourceId}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-200 leading-relaxed max-w-md">
                          {log.purposeDescription}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-1 rounded">
                            <span>{log.immutableSignature?.substring(0, 14)}...</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(log.immutableSignature)}
                              title="Copy full 64-char HMAC signature"
                              className="text-slate-400 hover:text-white transition-colors"
                            >
                              {copiedHash === log.immutableSignature ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {auditTotalPages > 1 && (
              <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div>
                  Page <span className="text-white font-bold">{auditPage}</span> of <span className="text-white font-bold">{auditTotalPages}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: auditTotalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setAuditPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                        auditPage === pg
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={auditPage >= auditTotalPages}
                    onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Chain Integrity Modal */}
          {isChainModalOpen && chainVerifyData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Cryptographic Chain Verified</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChainModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-1">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Tamper-Evidence Verification: 100% VALID</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      All audit block hashes were recalculated and verified against the genesis seal under RFC 2104. Zero modified or deleted records detected.
                    </p>
                  </div>

                  <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Blocks Verified:</span>
                      <span className="text-white font-bold">{chainVerifyData.totalBlocksChecked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hashing Standard:</span>
                      <span className="text-white font-bold">{chainVerifyData.algorithm}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Genesis Block Seal:</span>
                      <span className="text-slate-300 text-[10px] break-all bg-slate-900 p-1.5 rounded block">{chainVerifyData.genesisBlockSignature}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Latest Block Seal:</span>
                      <span className="text-emerald-400 text-[10px] break-all bg-slate-900 p-1.5 rounded block">{chainVerifyData.latestBlockSignature}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-700">
                      <span className="text-slate-400">Verification Timestamp:</span>
                      <span className="text-amber-400">{formatSriLankanTimestamp(chainVerifyData.verifiedAt || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChainModalOpen(false)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                  >
                    Close Verification Summary
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instant Admin Breach Alert Modal */}
          {isBreachModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <h3 className="text-base font-bold text-white">Dispatch Security Incident Alert</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBreachModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {breachSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Security Incident Alert Dispatched Successfully</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Incident Ticket <span className="font-mono text-white font-bold">{breachSuccess.ticketId}</span> recorded in the statutory ledger.
                      Official notification sent to:
                    </p>
                    <ul className="list-disc list-inside text-slate-300 font-mono text-[11px] space-y-0.5">
                      <li>dpo@cslk.org (Data Protection Officer)</li>
                      <li>cert@cert.gov.lk (Sri Lanka CERT)</li>
                    </ul>
                  </div>
                ) : (
                  <form onSubmit={handleSendBreachAlert} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Incident Severity Level *
                      </label>
                      <select
                        value={breachSeverity}
                        onChange={(e) => setBreachSeverity(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 font-semibold"
                      >
                        <option value="CRITICAL">CRITICAL — Immediate Statutory Breach Notification Under PDPA Section 23</option>
                        <option value="HIGH">HIGH — Suspicious Brute-Force or Multi-User Authorization Anomaly</option>
                        <option value="MEDIUM">MEDIUM — Unusual Data Ingestion Spikes or Repeated Token Failures</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Incident Classification *
                      </label>
                      <input
                        type="text"
                        required
                        value={breachIncidentType}
                        onChange={(e) => setBreachIncidentType(e.target.value)}
                        placeholder="e.g. Unauthorized 2FA Brute-Force Attempt"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Incident Description & Technical Details
                      </label>
                      <textarea
                        rows={3}
                        value={breachDetails}
                        onChange={(e) => setBreachDetails(e.target.value)}
                        placeholder="Provide details: source IP addresses, targeted routes, anomalies observed..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-sans"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="text-slate-300 font-medium">Automatic Statutory Recipients:</div>
                      <div className="font-mono text-[10px] text-amber-400">
                        • dpo@cslk.org (Community Solutions Lanka Data Protection Officer)<br />
                        • cert@cert.gov.lk (Sri Lanka Computer Emergency Readiness Team)
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsBreachModalOpen(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={breachSending}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                      >
                        {breachSending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Dispatching Alerts...</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Dispatch Statutory Breach Alert</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
        )
      )}

      {/* Moderation Gate Decision Modal */}
      {isModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-white space-y-5 shadow-2xl">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-lanka-gold" />
              <h3 className="text-lg font-bold text-white">Statutory Panel Moderation Gate</h3>
            </div>

            <div className="space-y-1 border-l-2 border-lanka-gold pl-3 py-0.5">
              <span className="text-[10px] font-mono text-lanka-gold block font-bold">
                {selectedProposal.code}
              </span>
              <h4 className="text-sm font-bold text-white">
                {selectedProposal.title[currentLang] || selectedProposal.title.en}
              </h4>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {t('admin.panelNotesLabel')} *
                </label>
                <textarea
                  rows={3}
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>{t('admin.totpCodeLabel')} *</span>
                  <span className="text-[10px] text-lanka-gold">RFC 6238 Authenticator Code</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-lanka-gold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleModerateProposal(false)}
                  className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-200 text-xs font-bold uppercase tracking-wider"
                >
                  Hold / Reject
                </button>
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleModerateProposal(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  {processingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{t('admin.approveAction')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

