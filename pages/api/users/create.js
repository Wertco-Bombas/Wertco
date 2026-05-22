import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔐 PROTEÇÃO REAL
  const auth = await checkAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { email, password, role = 'user' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // roles padronizadas
  const validRoles = ['user', 'supervisor', 'admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
    });
  }

  try {
    // =========================
    // CREATE AUTH USER
    // =========================
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError) {
      return res.status(500).json({ error: authError.message });
    }

    const userId = authData?.user?.id;

    if (!userId) {
      return res.status(500).json({ error: 'User created but no id returned' });
    }

    // =========================
    // UPSERT PROFILE (CORRETO)
    // =========================
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          role,
          username: email.split('@')[0]
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return res.status(500).json({ error: profileError.message });
    }

    return res.status(200).json({
      ok: true,
      userId,
      role
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || err
    });
  }
}
