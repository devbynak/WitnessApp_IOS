import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/apiConfig';

// Lazy singleton — only initialized when credentials are present.
// This prevents a crash at module load time when keys haven't been configured yet.
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

// Convenience export for files that assume credentials are set
export const supabase = {
  get auth() { return getSupabase()?.auth; },
  get storage() { return getSupabase()?.storage; },
  from: (table: string) => getSupabase()?.from(table),
  rpc: (fn: string, args?: Record<string, unknown>) => getSupabase()?.rpc(fn, args),
};
