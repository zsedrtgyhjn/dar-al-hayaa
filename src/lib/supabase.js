// Client Supabase unique pour toute l'application (navigateur).
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY sont manquantes. ' +
      'Ajoutez-les dans les variables d\'environnement du projet Vercel, puis redéployez.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'daralhayaa-supabase-auth',
  },
});
