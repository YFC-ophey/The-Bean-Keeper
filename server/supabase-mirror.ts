import type { CoffeeEntry } from '@shared/schema';
import type { UserNotionAuthState } from './notion-auth-state';
import { getSupabaseAdminClient, isSupabaseConfigured } from './supabase';

type SyncEventDirection = 'notion_to_supabase' | 'supabase_to_notion' | 'reconcile';
type SyncEventResult = 'success' | 'error';

export interface MirrorSyncResult {
  synced: number;
  errors: string[];
}

function ensureSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return getSupabaseAdminClient();
}

function coffeeEntryToMirrorPayload(userId: string, entry: CoffeeEntry) {
  return {
    user_id: userId,
    notion_page_id: entry.id,
    roaster_name: entry.roasterName,
    roaster_location: entry.roasterLocation,
    roaster_address: entry.roasterAddress,
    roaster_website: entry.roasterWebsite,
    place_url: entry.placeUrl,
    farm: entry.farm,
    origin: entry.origin,
    variety: entry.variety,
    process_method: entry.processMethod,
    roast_level: entry.roastLevel,
    roast_date: entry.roastDate,
    flavor_notes: entry.flavorNotes,
    rating: entry.rating,
    tasting_notes: entry.tastingNotes,
    weight: entry.weight,
    price: entry.price,
    purchase_again: entry.purchaseAgain,
    front_photo_url: entry.frontPhotoUrl,
    back_photo_url: entry.backPhotoUrl,
    source_updated_at: new Date().toISOString(),
    mirrored_at: new Date().toISOString(),
    sync_status: 'in_sync',
  };
}

export async function upsertNotionConnection(userId: string, state: UserNotionAuthState): Promise<void> {
  const client = ensureSupabaseClient();
  if (!client) {
    return;
  }

  const { error } = await client.from('notion_connections').upsert(
    {
      user_id: userId,
      notion_access_token: state.accessToken,
      notion_database_id: state.databaseId,
      workspace_name: state.workspaceName || null,
      is_owner: state.isOwner || false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw error;
  }
}

export async function upsertCoffeeMirrorEntry(userId: string, entry: CoffeeEntry): Promise<void> {
  const client = ensureSupabaseClient();
  if (!client) {
    return;
  }

  const payload = coffeeEntryToMirrorPayload(userId, entry);

  const { error } = await client.from('coffee_entries_mirror').upsert(payload, {
    onConflict: 'user_id,notion_page_id',
  });

  if (error) {
    throw error;
  }
}

export async function deleteCoffeeMirrorEntry(userId: string, notionPageId: string): Promise<void> {
  const client = ensureSupabaseClient();
  if (!client) {
    return;
  }

  const { error } = await client
    .from('coffee_entries_mirror')
    .delete()
    .eq('user_id', userId)
    .eq('notion_page_id', notionPageId);

  if (error) {
    throw error;
  }
}

export async function listCoffeeMirrorEntries(userId: string): Promise<Record<string, any>[]> {
  const client = ensureSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from('coffee_entries_mirror')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function logSyncEvent(args: {
  userId: string;
  notionPageId?: string;
  direction: SyncEventDirection;
  result: SyncEventResult;
  details?: string;
}): Promise<void> {
  const client = ensureSupabaseClient();
  if (!client) {
    return;
  }

  const { error } = await client.from('sync_events').insert({
    user_id: args.userId,
    notion_page_id: args.notionPageId || null,
    direction: args.direction,
    result: args.result,
    details: args.details || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function syncNotionEntriesToMirror(userId: string, entries: CoffeeEntry[]): Promise<MirrorSyncResult> {
  const errors: string[] = [];
  let synced = 0;

  for (const entry of entries) {
    try {
      await upsertCoffeeMirrorEntry(userId, entry);
      await logSyncEvent({
        userId,
        notionPageId: entry.id,
        direction: 'notion_to_supabase',
        result: 'success',
      });
      synced++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to mirror ${entry.id}: ${message}`);
      await logSyncEvent({
        userId,
        notionPageId: entry.id,
        direction: 'notion_to_supabase',
        result: 'error',
        details: message,
      });
    }
  }

  return { synced, errors };
}

export function mirrorRowToCoffeeEntry(row: Record<string, any>): CoffeeEntry {
  return {
    id: row.notion_page_id,
    roasterName: row.roaster_name,
    roasterLocation: row.roaster_location,
    roasterAddress: row.roaster_address,
    roasterWebsite: row.roaster_website,
    placeUrl: row.place_url,
    farm: row.farm,
    origin: row.origin,
    variety: row.variety,
    processMethod: row.process_method,
    roastLevel: row.roast_level,
    roastDate: row.roast_date,
    flavorNotes: row.flavor_notes,
    rating: row.rating,
    tastingNotes: row.tasting_notes,
    weight: row.weight,
    price: row.price,
    purchaseAgain: row.purchase_again,
    frontPhotoUrl: row.front_photo_url,
    backPhotoUrl: row.back_photo_url,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}
