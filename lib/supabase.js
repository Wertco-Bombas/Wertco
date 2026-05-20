// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expor temporariamente para o Console do navegador (apenas em dev)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('Expondo window.supabase para depuração (remova em produção)');
  window.supabase = supabase;
}

// Cliente admin (use APENAS no backend: pages/api/*)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// lib/supabase.js (após export const supabase = ...)
if (typeof window !== 'undefined') {
  // Expor temporariamente para depuração
  window.supabase = supabase;
}

