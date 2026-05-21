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

  const auth = await checkAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { email, password, role = 'user' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // 🔎 tenta buscar usuário direto (mais leve que listUsers)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();

    const existing = existingUsers?.users?.find(
      u => (u.email || '').toLowerCase() === email.toLowerCase()
    );

    let userId;

    // =========================
    // USER EXISTE
    // =========================
    if (existing) {
      userId = existing.id;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email,
            role
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        return res.status(500).json({ error: profileError.message });
      }

      return res.status(200).json({
        ok: true,
        userId,
        existed: true
      });
    }

    // =========================
    // CREATE USER
    // =========================
    if (!password) {
      return res.status(400).json({
        error: 'Password required to create new user'
      });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError) {
      return res.status(500).json({ error: authError.message });
    }

    userId = authData?.user?.id;

    if (!userId) {
      return res.status(500).json({
        error: 'User created but no id returned'
      });
    }

    // =========================
    // CREATE PROFILE (ÚNICO)
    // =========================
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        role
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: profileError.message });
    }

    return res.status(200).json({
      ok: true,
      userId,
      existed: false
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || err
    });
  }
}
