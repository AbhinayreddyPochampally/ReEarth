// Server-only Supabase client using the service role key.
// This module must never be imported from client components — the service role
// key is not prefixed with NEXT_PUBLIC_ and must stay server-side only.
import { createClient } from '@supabase/supabase-js';

const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

if (!url || !key) {
  throw new Error(
    'Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and ' +
    'SUPABASE_SERVICE_ROLE_KEY are set in web/.env.local.',
  );
}

// Service role bypasses RLS — all authorization lives in web/lib/db/ queries.
export const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
