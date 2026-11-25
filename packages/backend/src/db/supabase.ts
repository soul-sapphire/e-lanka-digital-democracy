/**
 * E-Lanka Digital Democracy Platform
 * Supabase PostgreSQL Database Client Adapter
 *
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 * Target: Supabase Cloud PostgreSQL (Singapore Region - ap-southeast-1)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; serviceKey: string; isConfigured: boolean } {
  const url = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isConfigured = Boolean(
    url &&
    serviceKey &&
    !url.includes('localhost:54321') &&
    serviceKey !== 'eyJhY2Nlc3NfdG9rZW4iOiJsb2NhbC1kZXYta2V5In0'
  );

  return { url, serviceKey, isConfigured };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, serviceKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  tablesFound?: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      error: 'Supabase credentials not configured in environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
    };
  }

  const startTime = Date.now();
  try {
    const { data, error } = await client
      .from('policies')
      .select('id, code, stage')
      .limit(5);

    if (error) {
      return {
        connected: false,
        latencyMs: Date.now() - startTime,
        error: error.message
      };
    }

    return {
      connected: true,
      latencyMs: Date.now() - startTime,
      tablesFound: data?.length || 0
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Unknown network error connecting to Supabase.'
    };
  }
}
