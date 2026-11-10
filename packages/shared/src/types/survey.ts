/**
 * Dynamic Questionnaire & Survey Types
 */

import { LocalizedString } from './policy';
import { EncryptedPayload } from './crypto';

export type SurveyQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'RATING_SCALE'
  | 'OPEN_TEXT';

export interface SurveyQuestionOption {
  id: string;
  label: LocalizedString;
  value: string;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  orderIndex: number;
  type: SurveyQuestionType;
  prompt: LocalizedString;
  helpText?: LocalizedString;
  isRequired: boolean;
  options?: SurveyQuestionOption[];
  minRating?: number;
  maxRating?: number;
  minRatingLabel?: LocalizedString;
  maxRatingLabel?: LocalizedString;
  maxCharacters?: number;
}

export interface SurveyDefinition {
  id: string;
  policyId: string;
  title: LocalizedString;
  instructions: LocalizedString;
  estimatedMinutes: number;
  questions: SurveyQuestion[];
  isActive: boolean;
}

export interface SurveyAnswerSubmission {
  questionId: string;
  questionType: SurveyQuestionType;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  numericRating?: number;
  /** Raw open text before frontend FLE or transmitted over TLS to Node backend */
  openText?: string;
}

export interface SurveyResponseIngestionPayload {
  surveyId: string;
  policyId: string;
  /** Blind indexed citizen identifier (HMAC-SHA256 of NIC or anonymous session token) */
  citizenBlindIndex: string;
  answers: {
    questionId: string;
    questionType: SurveyQuestionType;
    selectedOptionId?: string;
    selectedOptionIds?: string[];
    numericRating?: number;
    /** Encrypted open-text if client pre-encrypted or backend encrypted */
    encryptedOpenText?: EncryptedPayload;
    rawOpenText?: string;
  }[];
  offlineQueuedAt?: string;
  clientLanguage: 'en' | 'si' | 'ta';
}

export interface SurveyResponseRecord {
  id: string;
  surveyId: string;
  policyId: string;
  citizenBlindIndex: string;
  encryptedOpenTextPayload?: EncryptedPayload;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  numericRating?: number;
  isAnonymized: boolean;
  isErased: boolean;
  createdAt: string;
}

