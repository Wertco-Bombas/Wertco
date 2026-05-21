import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ⚠️ APENAS SERVER (API ROUTES)
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
