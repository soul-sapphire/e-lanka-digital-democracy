/**
 * E-Lanka Digital Democracy Platform
 * Frontend Direct Supabase Integration Client
 *
 * Target: Supabase Cloud PostgreSQL (Singapore Region - ap-southeast-1)
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EPetition, PolicyConsultation, PolicyLifecycleStage } from '@e-lanka/shared';

// Environment variables with production Singapore fallbacks
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://mdzcmvecmgaahznodnuj.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_uw4eNQRq7AA3Lc906fQ4oA_s17xj2jh';

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (err) {
      console.warn('[Supabase Frontend] Initialization warning:', err);
      return null;
    }
  }

  return clientInstance;
}

export function isSupabaseAvailable(): boolean {
  return Boolean(getSupabase());
}

/**
 * Fetch active and approved policies live from Supabase
 */
export async function fetchLivePoliciesFromSupabase(isAdmin: boolean = false): Promise<PolicyConsultation[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    let query = sb
      .from('policies')
      .select('*')
      .order('created_at', { ascending: false });

    // Unless administrator, filter out Stage 1 PENDING_REVIEW proposals
    if (!isAdmin) {
      query = query
        .eq('is_publicly_visible', true)
        .in('stage', ['APPROVED_PANEL', 'ACTIVE_CONSULTATION', 'AI_ANALYSIS_SYNC', 'CONCLUDED_ARCHIVED']);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('[Supabase Frontend] Policies fetch notice:', error?.message);
      return null;
    }

    return data.map((row: any): PolicyConsultation => ({
      id: row.id,
      code: row.code,
      headline: {
        en: row.headline_en || row.title_en,
        si: row.headline_si || row.title_si,
        ta: row.headline_ta || row.title_ta
      },
      title: {
        en: row.title_en,
        si: row.title_si,
        ta: row.title_ta
      },
      summary: {
        en: row.summary_en,
        si: row.summary_si,
        ta: row.summary_ta
      },
      fullDescription: {
        en: row.description_en,
        si: row.description_si,
        ta: row.description_ta
      },
      category: row.category,
      stage: row.stage as PolicyLifecycleStage,
      targetMinistry: row.target_ministry,
      authorAgency: row.author_agency,
      submissionCount: row.submission_count || 0,
      isPubliclyVisible: row.is_publicly_visible,
      moderatorPanelNotes: row.moderator_panel_notes,
      approvedAt: row.approved_at,
      deadlineAt: row.deadline_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.warn('[Supabase Frontend] Policies fetch exception:', err);
    return null;
  }
}

/**
 * Fetch active e-petitions live from Supabase
 */
export async function fetchLivePetitionsFromSupabase(): Promise<EPetition[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('petitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[Supabase Frontend] Petitions fetch notice:', error?.message);
      return null;
    }

    return data.map((row: any): EPetition => ({
      id: row.id,
      code: row.code,
      headline: {
        en: row.headline_en || row.title_en,
        si: row.headline_si || row.title_si,
        ta: row.headline_ta || row.title_ta
      },
      title: {
        en: row.title_en,
        si: row.title_si,
        ta: row.title_ta
      },
      objectiveStatement: {
        en: row.objective_en,
        si: row.objective_si,
        ta: row.objective_ta
      },
      targetAuthority: row.target_authority,
      category: row.category,
      requiredSignatures: row.required_signatures || 5000,
      currentSignatures: row.current_signatures || 0,
      status: row.status,
      backgroundDocumentationUrl: row.background_doc_url,
      deadline: row.deadline,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.warn('[Supabase Frontend] Petitions fetch exception:', err);
    return null;
  }
}

/**
 * Fetch a single petition's live counter from Supabase
 */
export async function fetchLiveCounterFromSupabase(petitionId: string): Promise<{
  currentSignatures: number;
  requiredSignatures: number;
  percentReached: number;
} | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('petitions')
      .select('current_signatures, required_signatures')
      .eq('id', petitionId)
      .maybeSingle();

    if (error || !data) return null;

    const current = data.current_signatures || 0;
    const required = data.required_signatures || 5000;
    const percentReached = Number(((current / required) * 100).toFixed(1));

    return { currentSignatures: current, requiredSignatures: required, percentReached };
  } catch {
    return null;
  }
}

/**
 * Record petition signature directly into live Supabase with blind index deduplication
 */
export async function recordSignatureInSupabase(params: {
  petitionId: string;
  signerBlindIndex: string;
  district: string;
}): Promise<{ success: boolean; newCount?: number; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Database client not initialized' };

  try {
    // 1. Insert into petition_signatures
    const { error: insertError } = await sb
      .from('petition_signatures')
      .insert({
        petition_id: params.petitionId,
        signer_blind_index: params.signerBlindIndex,
        district: params.district || 'Colombo'
      });

    if (insertError) {
      // 23505 is PostgreSQL unique constraint violation
      if (insertError.code === '23505') {
        return {
          success: false,
          error: 'This National Identity Card has already verified a signature for this petition.'
        };
      }
      return { success: false, error: insertError.message };
    }

    // 2. Fetch latest petition signature count
    const { data: petitionData } = await sb
      .from('petitions')
      .select('current_signatures')
      .eq('id', params.petitionId)
      .maybeSingle();

    const newCount = (petitionData?.current_signatures || 0) + 1;

    // Update count in petitions table
    await sb
      .from('petitions')
      .update({ current_signatures: newCount })
      .eq('id', params.petitionId);

    // 3. Log audit event
    await sb.from('pdpa_audit_logs').insert({
      action: 'EPETITION_SIGNED',
      actor_role: 'CITIZEN',
      actor_id_hash: params.signerBlindIndex,
      resource_type: 'PETITION_SIGNATURE',
      resource_id: params.petitionId,
      purpose_description: 'Verified citizen signature recorded in live Supabase PostgreSQL (Singapore ap-southeast-1)',
      ip_address_hash: 'LIVE_CLIENT_HASH',
      user_agent_hash: 'LIVE_CLIENT_AGENT',
      immutable_signature: `HMAC_SEAL_${Date.now()}`
    });

    return { success: true, newCount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Signature persistence failed' };
  }
}
