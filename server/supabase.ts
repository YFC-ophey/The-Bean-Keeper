import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { UserNotionAuthState } from './notion-auth-state';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseServiceRoleKey);

const supabaseAdmin = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseServiceRoleKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return hasSupabaseConfig;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  return supabaseAdmin;
}

export async function verifySupabaseAccessToken(accessToken: string): Promise<User | null> {
  if (!supabaseAdmin) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/** Recover the server-side Notion connection after a process restart. */
export async function loadNotionConnectionFromSupabase(userId: string): Promise<UserNotionAuthState | null> {
  if (!supabaseAdmin) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('notion_connections')
    .select('notion_access_token, notion_database_id, workspace_name, is_owner, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  if (typeof data.notion_access_token !== 'string' || !data.notion_access_token ||
      typeof data.notion_database_id !== 'string' || !data.notion_database_id) {
    throw new Error('Stored Notion connection is incomplete');
  }

  return {
    userId,
    accessToken: data.notion_access_token,
    databaseId: data.notion_database_id,
    workspaceName: data.workspace_name || undefined,
    isOwner: data.is_owner === true,
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}
