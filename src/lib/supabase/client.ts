import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// ─── Browser Client (for Client Components) ──────────────────────────────────
// Use this in components that run on the client side ('use client').
// Creates a singleton-like instance per tab session.

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
