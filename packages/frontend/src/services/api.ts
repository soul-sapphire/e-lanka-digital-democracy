/**
 * E-Lanka Digital Democracy Platform - API Client
 *
 * Implements a dual-mode communication layer:
 * 1. Live Backend Mode: Queries Express/Supabase REST endpoints.
 * 2. Standalone Demo Mode: Seamless in-browser fallback ensuring instant,
 *    zero-configuration deployments on Vercel, Cloudflare, or GitHub Pages.
 */

import {
  PolicyConsultation,
  PolicyLifecycleStage,
  EPetition,
  SurveyDefinition,
  SurveyQuestion,
  ZeroPIIPublicAggregate,
  UserRole,
  SriLankanNICDetails,
  DRPVerificationResult,
  MobileOTPDispatchResult,
  MobileOTPVerifyResult,
  decodeAndValidateSriLankanNIC,
  verifyClaimedCitizenDetails
} from '@e-lanka/shared';
import { OfflineQueueManager } from './offline-queue';
import {
  getClientDemoPolicies,
  saveClientDemoPolicies,
  getClientDemoPetitions,
  saveClientDemoPetitions,
  DEMO_SURVEY_DEFINITION,
  DEMO_SURVEY_QUESTIONS,
  DEMO_PUBLIC_AGGREGATE
} from './demo-data';

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('elanka_auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('elanka_auth_token', token);
}

export function getStoredUser(): any | null {
  try {
    const raw = localStorage.getItem('elanka_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any): void {
  localStorage.setItem('elanka_user', JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem('elanka_auth_token');
  localStorage.removeItem('elanka_user');
}

async function tryFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const lang = localStorage.getItem('elanka_lang') || 'en';
  headers.set('x-client-language', lang);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (res.ok) {
      return (await res.json()) as T;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export const api = {
  // Policies
  getPolicies: async (): Promise<PolicyConsultation[]> => {
    const live = await tryFetch<{ data: PolicyConsultation[] }>('/policies');
    if (live && live.data) {
      return live.data;
    }
    // Standalone Demo Fallback
    return getClientDemoPolicies();
  },

  getPolicyById: async (id: string): Promise<{ data: PolicyConsultation; whatsappShareUrl: string }> => {
    const live = await tryFetch<{ data: PolicyConsultation; whatsappShareUrl: string }>(`/policies/${id}`);
    if (live && live.data) {
      return live;
    }

    const policies = getClientDemoPolicies();
    const policy = policies.find(p => p.id === id) || policies[0];
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`E-Lanka Digital Democracy: "${policy.title.en}". Support here: ${window.location.origin}/policies/${policy.id}`)}`;

    return { data: policy, whatsappShareUrl: whatsappUrl };
  },

  submitPolicyProposal: async (data: any): Promise<{ message: string; data: PolicyConsultation }> => {
    const live = await tryFetch<{ message: string; data: PolicyConsultation }>('/policies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (live) return live;

    const policies = getClientDemoPolicies();
    const count = policies.length + 1;
    const newPolicy: PolicyConsultation = {
      id: `pol_demo_${Date.now()}`,
      code: `EL-POL-2026-${String(count).padStart(3, '0')}`,
      title: data.title,
      summary: data.summary,
      fullDescription: data.fullDescription || data.summary,
      category: data.category || 'DIGITAL_RIGHTS',
      stage: PolicyLifecycleStage.STAGE_1_PENDING_REVIEW,
      targetMinistry: data.targetMinistry || 'Ministry of Public Administration',
      authorAgency: data.authorAgency || 'Citizen Working Group',
      submissionCount: 0,
      isPubliclyVisible: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    policies.push(newPolicy);
    saveClientDemoPolicies(policies);

    return { message: 'Proposal submitted to Stage 1 Moderation Queue.', data: newPolicy };
  },

  moderatePolicy: async (id: string, approved: boolean, panelNotes: string, totpToken: string): Promise<{ message: string; data: PolicyConsultation }> => {
    const live = await tryFetch<{ message: string; data: PolicyConsultation }>(`/policies/${id}/moderate`, {
      method: 'POST',
      headers: { 'x-totp-token': totpToken },
      body: JSON.stringify({ approved, panelNotes })
    });
    if (live) return live;

    const policies = getClientDemoPolicies();
    const policy = policies.find(p => p.id === id);
    if (!policy) throw new Error('Policy not found');

    policy.stage = approved ? PolicyLifecycleStage.STAGE_2_APPROVED_PANEL : PolicyLifecycleStage.STAGE_1_PENDING_REVIEW;
    policy.moderatorPanelNotes = panelNotes;
    policy.approvedAt = approved ? new Date().toISOString() : undefined;
    policy.isPubliclyVisible = approved;
    saveClientDemoPolicies(policies);

    return {
      message: approved ? 'Policy proposal APPROVED by Panel Gate. Ready for survey formulation.' : 'Policy proposal held in PENDING status.',
      data: policy
    };
  },

  // Surveys
  getSurveyByPolicyId: async (policyId: string): Promise<{ survey: SurveyDefinition; questions: SurveyQuestion[] }> => {
    const live = await tryFetch<{ survey: SurveyDefinition; questions: SurveyQuestion[] }>(`/surveys/policy/${policyId}`);
    if (live && live.survey) return live;

    return {
      survey: { ...DEMO_SURVEY_DEFINITION, policyId },
      questions: DEMO_SURVEY_QUESTIONS
    };
  },

  submitSurveyResponse: async (payload: {
    surveyId: string;
    policyId: string;
    answers: any[];
    citizenIdentifier?: string;
    clientLanguage: string;
  }): Promise<{ success: boolean; submissionCount: number }> => {
    const live = await tryFetch<{ success: boolean; submissionCount: number }>('/surveys/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (live) return live;

    // Standalone fallback: increment submission count
    const policies = getClientDemoPolicies();
    const policy = policies.find(p => p.id === payload.policyId);
    let newCount = 1;
    if (policy) {
      policy.submissionCount += 1;
      newCount = policy.submissionCount;
      saveClientDemoPolicies(policies);
    }

    return { success: true, submissionCount: newCount };
  },

  // Petitions
  getPetitions: async (): Promise<EPetition[]> => {
    const live = await tryFetch<{ data: EPetition[] }>('/petitions');
    if (live && live.data) return live.data;

    return getClientDemoPetitions();
  },

  getPetitionById: async (id: string): Promise<{ data: EPetition }> => {
    const live = await tryFetch<{ data: EPetition }>(`/petitions/${id}`);
    if (live && live.data) return live;

    const petitions = getClientDemoPetitions();
    const petition = petitions.find(p => p.id === id) || petitions[0];
    return { data: petition };
  },

  getLiveCounter: async (id: string): Promise<{ currentSignatures: number; requiredSignatures: number; percentReached: number }> => {
    const live = await tryFetch<{ currentSignatures: number; requiredSignatures: number; percentReached: number }>(`/petitions/${id}/counter`);
    if (live) return live;

    const petitions = getClientDemoPetitions();
    const petition = petitions.find(p => p.id === id) || petitions[0];
    const percentReached = Number(((petition.currentSignatures / petition.requiredSignatures) * 100).toFixed(1));
    return {
      currentSignatures: petition.currentSignatures,
      requiredSignatures: petition.requiredSignatures,
      percentReached
    };
  },

  signPetition: async (id: string, submission: any): Promise<{ success: boolean; message: string; currentSignatures: number }> => {
    const live = await tryFetch<{ success: boolean; message: string; currentSignatures: number }>(`/petitions/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify(submission)
    });
    if (live) return live;

    // Standalone client deduplication test via localStorage
    const signedKey = `signed_${id}_${submission.nicNumber.toUpperCase().trim()}`;
    if (localStorage.getItem(signedKey)) {
      const petitions = getClientDemoPetitions();
      const p = petitions.find(pet => pet.id === id);
      return {
        success: false,
        message: 'This National Identity Card has already verified a signature for this petition.',
        currentSignatures: p ? p.currentSignatures : 7420
      };
    }

    localStorage.setItem(signedKey, 'true');

    const petitions = getClientDemoPetitions();
    const petition = petitions.find(p => p.id === id);
    let newCount = 7421;
    if (petition) {
      petition.currentSignatures += 1;
      newCount = petition.currentSignatures;
      saveClientDemoPetitions(petitions);
    }

    return {
      success: true,
      message: 'Signature verified and cryptographically recorded.',
      currentSignatures: newCount
    };
  },

  // Citizen Dashboard & PDPA
  getCitizenEngagement: async (nic?: string): Promise<any> => {
    const live = await tryFetch<any>(`/citizen/engagement${nic ? `?nic=${nic}` : ''}`);
    if (live) return live;

    const user = getStoredUser();
    return {
      alias: user?.anonymizedAlias || 'Citizen-Western-9421',
      district: 'Colombo',
      signedPetitions: [
        {
          petitionId: 'e0000000-0000-0000-0000-000000000001',
          code: 'PET-2026-012',
          title: 'Mandate Open Fiber Access & Universal High-Speed Broadband across Rural Schools',
          status: 'ACTIVE',
          signedAt: '2026-01-20T14:32:00Z'
        }
      ],
      participatedConsultations: [
        {
          policyId: 'b0000000-0000-0000-0000-000000000001',
          code: 'EL-POL-2026-001',
          title: 'National AI Ethics & Algorithmic Accountability Framework',
          stage: 'ACTIVE_CONSULTATION',
          submittedAt: '2026-01-22T09:15:00Z'
        }
      ],
      pdpaRights: {
        dataMinimizationVerified: true,
        fieldLevelEncryptionActive: true,
        canExerciseErasure: true
      }
    };
  },

  exerciseRightToErasure: async (nicNumber: string, erasureScope: string = 'ALL_PII'): Promise<any> => {
    const live = await tryFetch<any>('/citizen/erasure', {
      method: 'POST',
      body: JSON.stringify({ nicNumber, erasureScope })
    });
    if (live) return live;

    return {
      success: true,
      message: 'Statutory Right to Erasure executed under PDPA Section 14.',
      result: {
        citizenBlindIndex: 'ERASED_PDPA_SEC_14',
        anonymizedSurveyResponses: 1,
        anonymizedSignatures: 1,
        preservedAggregateCount: 2,
        timestamp: new Date().toISOString(),
        pdpaAuditId: `audit_${Date.now()}`
      }
    };
  },

  // Admin & Public Aggregates
  getPendingQueue: async (): Promise<{ data: PolicyConsultation[]; totalPending: number }> => {
    const live = await tryFetch<{ data: PolicyConsultation[]; totalPending: number }>('/admin/pending-queue');
    if (live && live.data) return live;

    const policies = getClientDemoPolicies();
    const pending = policies.filter(p => p.stage === PolicyLifecycleStage.STAGE_1_PENDING_REVIEW);
    return { data: pending, totalPending: pending.length };
  },

  getAuditLogs: async (limit = 20): Promise<any> => {
    const live = await tryFetch<any>(`/admin/audit-logs?limit=${limit}`);
    if (live) return live;

    return {
      chainIntegrityVerified: true,
      totalBlocks: 14,
      logs: [
        {
          id: 'log_01',
          action: 'DATA_INGESTION',
          actorRole: 'CITIZEN',
          resourceType: 'SURVEY_RESPONSE',
          purposeDescription: 'Ingested survey response with AES-256-GCM application encryption',
          timestamp: new Date().toISOString(),
          immutableSignature: 'fa67b8569bacb53cca1889242c13cf29'
        },
        {
          id: 'log_02',
          action: 'ADMIN_PANEL_ACCESS',
          actorRole: 'PANEL_MODERATOR',
          resourceType: 'POLICY',
          purposeDescription: 'Panel gate reviewed and approved policy EL-POL-2026-003',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          immutableSignature: '88a0912dfa887bc129410ea821109ffb'
        }
      ]
    };
  },

  triggerAISync: async (policyId: string, totpToken: string): Promise<any> => {
    const live = await tryFetch<any>(`/admin/ai-sync/${policyId}`, {
      method: 'POST',
      headers: { 'x-totp-token': totpToken }
    });
    if (live) return live;

    return {
      success: true,
      aggregate: { ...DEMO_PUBLIC_AGGREGATE, policyId, syncHash: `synchash_${Date.now()}` }
    };
  },

  getPublicAggregate: async (policyId: string): Promise<{ data: ZeroPIIPublicAggregate }> => {
    const live = await tryFetch<{ data: ZeroPIIPublicAggregate }>(`/public/aggregates/${policyId}`);
    if (live && live.data) return live;

    return { data: { ...DEMO_PUBLIC_AGGREGATE, policyId } };
  },

  // Auth & TOTP
  login: async (credentials: any): Promise<any> => {
    const live = await tryFetch<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (live) return live;

    const user = {
      id: `usr_${Date.now()}`,
      role: credentials.role || 'CITIZEN',
      anonymizedAlias: credentials.role === 'CITIZEN' ? 'Citizen-Colombo-4912' : `Admin-${credentials.role}`,
      totpEnabled: credentials.role !== 'CITIZEN'
    };
    return { token: `demo_jwt_token_${Date.now()}`, user };
  },

  setupTOTP: async (): Promise<any> => {
    const live = await tryFetch<any>('/auth/totp/setup', { method: 'POST' });
    if (live) return live;

    return {
      secret: 'JBSWY3DPEHPK3PXP',
      otpauthUri: 'otpauth://totp/E-Lanka%20Democracy:Admin?secret=JBSWY3DPEHPK3PXP&issuer=E-Lanka%20Democracy',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=otpauth%3A%2F%2Ftotp%2FE-Lanka%2520Democracy%3AAdmin%3Fsecret%3DJBSWY3DPEHPK3PXP'
    };
  },

  verifyTOTP: async (token: string, secret?: string): Promise<any> => {
    const live = await tryFetch<any>('/auth/totp/verify', { method: 'POST', body: JSON.stringify({ token, secret }) });
    if (live) return live;

    return { success: true, message: 'Two-Factor Authentication enrolled.' };
  },

  // Multi-Tier Sovereign Citizen Verification
  validateNIC: async (
    nicNumber: string,
    claimedDOB?: string,
    claimedGender?: 'MALE' | 'FEMALE'
  ): Promise<{ success: boolean; verified: boolean; nicDetails: SriLankanNICDetails; reason?: string }> => {
    const live = await tryFetch<{ success: boolean; verified: boolean; nicDetails: SriLankanNICDetails; reason?: string }>(
      '/verification/validate-nic',
      {
        method: 'POST',
        body: JSON.stringify({ nicNumber, claimedDOB, claimedGender })
      }
    );
    if (live) return live;

    // Standalone fallback: mathematical evaluation in-browser
    const result = verifyClaimedCitizenDetails({ nicNumber, claimedDOB, claimedGender });
    return {
      success: true,
      verified: result.verified,
      nicDetails: result.nicDetails,
      reason: result.reason
    };
  },

  verifyDRP: async (
    nicNumber: string,
    claimedDOB?: string
  ): Promise<{ success: boolean; result: DRPVerificationResult }> => {
    const live = await tryFetch<{ success: boolean; result: DRPVerificationResult }>('/verification/drp-check', {
      method: 'POST',
      body: JSON.stringify({ nicNumber, claimedDOB })
    });
    if (live) return live;

    // Standalone fallback: sovereign registry simulation
    const nicDetails = decodeAndValidateSriLankanNIC(nicNumber);
    const districts = [
      'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
      'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
      'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
      'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
      'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
    ];
    const numPart = nicDetails.nicNumber.replace(/\D/g, '');
    const seed = parseInt(numPart.slice(-4), 10) || 0;
    const district = districts[seed % districts.length];

    return {
      success: true,
      result: {
        verified: nicDetails.isValid,
        drpTransactionId: `DRP-LK-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        citizenStatus: nicDetails.isValid ? 'ACTIVE_LIVING' : 'NOT_FOUND',
        electoralDistrict: district,
        verifiedAt: new Date().toISOString(),
        gatewayAuthority: 'Department for Registration of Persons (DRP) - Government of Sri Lanka'
      }
    };
  },

  sendMobileOTP: async (mobileNumber: string): Promise<{ success: boolean; data?: MobileOTPDispatchResult; error?: string }> => {
    const live = await tryFetch<{ success: boolean; data: MobileOTPDispatchResult }>('/verification/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber })
    });
    if (live && live.success) return live;

    // Standalone fallback
    const clean = mobileNumber.trim().replace(/[\s-()]/g, '');
    const lkRegex = /^(?:\+94|0094|0)?(7[01245678]\d{7})$/;
    const match = clean.match(lkRegex);

    if (!match) {
      return {
        success: false,
        error: 'Invalid Sri Lankan mobile format. Expected 07X XXX XXXX (e.g. 0771234567 or +94771234567).'
      };
    }

    const subscriber = match[1];
    const normalized = `+94${subscriber}`;
    const masked = `+94 ${subscriber.slice(0, 2)} *** ${subscriber.slice(-4)}`;
    const demoCode = String(Math.floor(100000 + Math.random() * 900000));
    const ref = `OTP-DEMO-${Date.now().toString().slice(-6)}`;

    // Store in sessionStorage for verification
    sessionStorage.setItem(`otp_${ref}`, JSON.stringify({ code: demoCode, mobile: normalized }));

    return {
      success: true,
      data: {
        success: true,
        mobileMasked: masked,
        otpReference: ref,
        expiresInSeconds: 120,
        demoOtpCode: demoCode,
        message: `OTP dispatched to ${masked}. (Demo Code: ${demoCode})`
      }
    };
  },

  verifyMobileOTP: async (
    otpReference: string,
    mobileNumber: string,
    otpCode: string
  ): Promise<{ success: boolean; data?: MobileOTPVerifyResult; error?: string }> => {
    const live = await tryFetch<{ success: boolean; data: MobileOTPVerifyResult }>('/verification/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otpReference, mobileNumber, otpCode })
    });
    if (live && live.success) return live;

    // Standalone fallback
    const raw = sessionStorage.getItem(`otp_${otpReference}`);
    if (!raw) {
      // Allow fallback if demoCode matches or was passed
      return {
        success: false,
        error: 'OTP session expired or invalid. Please request a new code.'
      };
    }

    const parsed = JSON.parse(raw);
    if (parsed.code !== otpCode.trim()) {
      return {
        success: false,
        error: 'Invalid 6-digit OTP code. Please enter the code received.'
      };
    }

    sessionStorage.removeItem(`otp_${otpReference}`);

    return {
      success: true,
      data: {
        verified: true,
        mobileBlindHash: `demo_blind_hash_${Date.now()}`,
        verifiedAt: new Date().toISOString(),
        message: 'Mobile number verified successfully via TRCSL SIM gateway.'
      }
    };
  }
};
