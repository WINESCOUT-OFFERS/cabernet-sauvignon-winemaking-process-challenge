import { createClient } from '@supabase/supabase-js';

// Fallback placeholder credentials for clean builds on Vercel / local previews.
// Replace with your project's URL and anon key or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const FALLBACK_SUPABASE_URL = 'https://your-project-id.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'your-supabase-anon-key';

const supabaseUrl =
  (import.meta.env?.VITE_SUPABASE_URL || '').trim() || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim() ||
  FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  supabaseUrl !== FALLBACK_SUPABASE_URL &&
  supabaseAnonKey !== FALLBACK_SUPABASE_ANON_KEY &&
  supabaseUrl.startsWith('http');

export const LEADERBOARD_TABLE = 'leaderboard';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
