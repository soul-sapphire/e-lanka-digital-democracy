/**
 * E-Lanka Digital Democracy Platform - API Client
 * Seamlessly interfaces with Node.js backend and incorporates offline fallbacks
 */

import {
  PolicyConsultation,
  EPetition,
  SurveyDefinition,
  SurveyQuestion,
  ZeroPIIPublicAggregate,
  UserRole
} from '@e-lanka/shared';
import { OfflineQueueManager } from './offline-queue';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(errJson.error || errJson.message || `HTTP ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    // If offline, check if we have cached GET data
    if (options.method === undefined || options.method === 'GET') {
      const cached = localStorage.getItem(`cache_${endpoint}`);
      if (cached) {
        console.warn(`[API] Returning offline cached copy for ${endpoint}`);
        return JSON.parse(cached) as T;
      }
    }
    throw err;
  }
}

export const api = {
  // Policies
  getPolicies: async (): Promise<PolicyConsultation[]> => {
    const res = await request<{ data: PolicyConsultation[] }>('/policies');
    localStorage.setItem('cache_/policies', JSON.stringify(res));
    return res.data;
  },

  getPolicyById: async (id: string): Promise<{ data: PolicyConsultation; whatsappShareUrl: string }> => {
    const res = await request<{ data: PolicyConsultation; whatsappShareUrl: string }>(`/policies/${id}`);
    localStorage.setItem(`cache_/policies/${id}`, JSON.stringify(res));
    return res;
  },

  submitPolicyProposal: (data: any) =>
    request<{ message: string; data: PolicyConsultation }>('/policies', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  moderatePolicy: (id: string, approved: boolean, panelNotes: string, totpToken: string) =>
    request<{ message: string; data: PolicyConsultation }>(`/policies/${id}/moderate`, {
      method: 'POST',
      headers: { 'x-totp-token': totpToken },
      body: JSON.stringify({ approved, panelNotes })
    }),

  // Surveys
  getSurveyByPolicyId: async (policyId: string): Promise<{ survey: SurveyDefinition; questions: SurveyQuestion[] }> => {
    const res = await request<{ survey: SurveyDefinition; questions: SurveyQuestion[] }>(`/surveys/policy/${policyId}`);
    localStorage.setItem(`cache_/surveys/policy/${policyId}`, JSON.stringify(res));
    return res;
  },

  submitSurveyResponse: async (payload: {
    surveyId: string;
    policyId: string;
    answers: any[];
    citizenIdentifier?: string;
    clientLanguage: string;
  }): Promise<{ success: boolean; submissionCount: number }> => {
    if (!navigator.onLine) {
      OfflineQueueManager.enqueue({
        surveyId: payload.surveyId,
        policyId: payload.policyId,
        citizenIdentifier: payload.citizenIdentifier || 'offline_citizen',
        answers: payload.answers,
        clientLanguage: payload.clientLanguage
      });
      return { success: true, submissionCount: 1 };
    }

    try {
      return await request<{ success: boolean; submissionCount: number }>('/surveys/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      OfflineQueueManager.enqueue({
        surveyId: payload.surveyId,
        policyId: payload.policyId,
        citizenIdentifier: payload.citizenIdentifier || 'offline_citizen',
        answers: payload.answers,
        clientLanguage: payload.clientLanguage
      });
      return { success: true, submissionCount: 1 };
    }
  },

  // Petitions
  getPetitions: async (): Promise<EPetition[]> => {
    const res = await request<{ data: EPetition[] }>('/petitions');
    localStorage.setItem('cache_/petitions', JSON.stringify(res));
    return res.data;
  },

  getPetitionById: (id: string): Promise<{ data: EPetition }> =>
    request<{ data: EPetition }>(`/petitions/${id}`),

  getLiveCounter: (id: string): Promise<{ currentSignatures: number; requiredSignatures: number; percentReached: number }> =>
    request<{ currentSignatures: number; requiredSignatures: number; percentReached: number }>(`/petitions/${id}/counter`),

  signPetition: (id: string, submission: any) =>
    request<{ success: boolean; message: string; currentSignatures: number }>(`/petitions/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify(submission)
    }),

  // Citizen Dashboard & PDPA
  getCitizenEngagement: (nic?: string) =>
    request<any>(`/citizen/engagement${nic ? `?nic=${nic}` : ''}`),

  exerciseRightToErasure: (nicNumber: string, erasureScope: string = 'ALL_PII') =>
    request<any>('/citizen/erasure', {
      method: 'POST',
      body: JSON.stringify({ nicNumber, erasureScope })
    }),

  // Admin & Public Aggregates
  getPendingQueue: () => request<{ data: PolicyConsultation[]; totalPending: number }>('/admin/pending-queue'),

  getAuditLogs: (limit = 20) => request<any>(`/admin/audit-logs?limit=${limit}`),

  triggerAISync: (policyId: string, totpToken: string) =>
    request<any>(`/admin/ai-sync/${policyId}`, {
      method: 'POST',
      headers: { 'x-totp-token': totpToken }
    }),

  getPublicAggregate: (policyId: string) =>
    request<{ data: ZeroPIIPublicAggregate }>(`/public/aggregates/${policyId}`),

  // Auth & TOTP
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  setupTOTP: () => request<any>('/auth/totp/setup', { method: 'POST' }),
  verifyTOTP: (token: string, secret?: string) =>
    request<any>('/auth/totp/verify', { method: 'POST', body: JSON.stringify({ token, secret }) })
};

