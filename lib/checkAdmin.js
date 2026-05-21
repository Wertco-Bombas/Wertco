// lib/checkAdmin.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function checkAdmin(req, allowedRoles = ['admin']) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return { ok: false, status: 401, error: 'No token provided' };
  }

  const { data: userData, error: userErr } =
    await supabaseAdmin.auth.getUser(token);

  if (userErr || !userData?.user) {
    return { ok: false, status: 401, error: 'Invalid token' };
  }

  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (pErr || !profile) {
    return { ok: false, status: 403, error: 'Profile not found' };
  }

  const role = profile.role;

  if (!allowedRoles.includes(role)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return {
    ok: true,
    userId: userData.user.id,
    role
  };
}
