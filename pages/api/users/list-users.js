import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await checkAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    // =========================
    // 1. AUTH USERS
    // =========================
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    const authUsers = authData?.users || [];

    // =========================
    // 2. PROFILES
    // =========================
    const { data: profiles, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('id, username, email, role, created_at');

    if (profileError) throw profileError;

    // =========================
    // 3. MERGE (FONTE ÚNICA DE VERDADE)
    // =========================
    const merged = authUsers.map(u => {
      const profile = profiles.find(p => p.id === u.id);

      return {
        id: u.id,
        email: u.email,
        created_at: profile?.created_at || u.created_at,
        username: profile?.username || null,
        role: profile?.role || 'user'
      };
    });

    return res.status(200).json({
      ok: true,
      users: merged
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || err
    });
  }
}
