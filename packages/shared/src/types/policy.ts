/**
 * Policy Consultation Lifecycle Types (EL-SPEC-2026-V3)
 * Implements the 5-Stage Policy Consultation Pipeline
 */

export enum PolicyLifecycleStage {
  STAGE_1_PENDING_REVIEW = 'PENDING_REVIEW',             // Proposal Submission & Moderation Queue
  STAGE_2_APPROVED_PANEL = 'APPROVED_PANEL',             // Approved by Panel Gate, questionnaire formulated
  STAGE_3_ACTIVE_CONSULTATION = 'ACTIVE_CONSULTATION',   // Live to public, WhatsApp/email invites active
  STAGE_4_AI_ANALYSIS_SYNC = 'AI_ANALYSIS_SYNC',         // Submission closed, AI mining & PII scrubbing running
  STAGE_5_CONCLUDED_ARCHIVED = 'CONCLUDED_ARCHIVED'      // Final policy brief & public aggregates published
}

export type PolicyCategory =
  | 'DIGITAL_RIGHTS'
  | 'ECONOMIC_REFORM'
  | 'HEALTHCARE_WELFARE'
  | 'EDUCATION_YOUTH'
  | 'ENVIRONMENTAL_SUSTAINABILITY'
  | 'CONSTITUTIONAL_GOVERNANCE'
  | 'AGRICULTURE_FOOD_SECURITY';

export interface LocalizedString {
  en: string;
  si: string;
  ta: string;
}

export interface PolicyConsultation {
  id: string;
  code: string; // e.g. "EL-POL-2026-004"
  title: LocalizedString;
  summary: LocalizedString;
  fullDescription: LocalizedString;
  category: PolicyCategory;
  stage: PolicyLifecycleStage;
  targetMinistry: string;
  authorAgency: string;
  submissionCount: number;
  petitionCount?: number;
  publishedAt?: string;
  deadlineAt?: string;
  approvedAt?: string;
  moderatorPanelNotes?: string;
  createdAt: string;
  updatedAt: string;
  isPubliclyVisible: boolean;
  lmsCourseRef?: {
    courseId: string;
    courseTitle: LocalizedString;
    url: string; // points to www.cslk.org
  };
}

export interface ModerationApprovalRequest {
  policyId: string;
  approved: boolean;
  panelNotes: string;
  moderatorId: string;
  totpToken: string;
}

