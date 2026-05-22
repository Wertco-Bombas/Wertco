import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function checkSupervisor(req) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return { ok: false, status: 401, error: 'No token' };
    }

    // 🔐 valida usuário com service role
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return { ok: false, status: 401, error: 'Invalid user' };
    }

    const user = userData.user;

    // 🔎 busca role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { ok: false, status: 403, error: 'Profile not found' };
    }

    if (profile.role !== 'supervisor') {
      return { ok: false, status: 403, error: 'Not supervisor' };
    }

    return {
      ok: true,
      user,
      role: profile.role
    };

  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: err.message
    };
  }
}
