/**
 * AI Processing Worker Types (EL-SPEC-2026-V3 Workstream 4)
 * For PII scrubbing, sentiment synthesis, and thematic clustering
 */

import { LocalizedString } from './policy';

export type SentimentCategory = 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE' | 'MIXED';

export interface SentimentAnalysisResult {
  score: number; // -1.0 (strongly negative) to +1.0 (strongly positive)
  label: SentimentCategory;
  confidence: number;
}

export interface ThematicCluster {
  id: string;
  themeTitle: LocalizedString;
  mentionCount: number;
  percentage: number;
  keyConcerns: LocalizedString[];
  representativeQuotes: string[]; // Strictly scrubbed of any PII
}

export interface ScrubbedFeedback {
  originalLength: number;
  scrubbedText: string;
  piiItemsDetected: {
    type: 'NIC_NUMBER' | 'PHONE_NUMBER' | 'EMAIL' | 'PERSON_NAME' | 'ADDRESS';
    count: number;
  }[];
  sentiment: SentimentAnalysisResult;
}

export interface ZeroPIIPublicAggregate {
  policyId: string;
  code: string;
  totalSubmissions: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  thematicClusters: ThematicCluster[];
  questionSummaries: {
    questionId: string;
    questionPrompt: LocalizedString;
    type: string;
    optionSplits?: {
      optionId: string;
      label: LocalizedString;
      count: number;
      percentage: number;
    }[];
    averageRating?: number;
    ratingBreakdown?: Record<number, number>;
  }[];
  generatedAt: string;
  syncHash: string;
}

