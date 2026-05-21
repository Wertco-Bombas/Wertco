import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username e password são obrigatórios'
      });
    }

    // =========================
    // 1. CRIAR USUÁRIO NO AUTH
    // =========================
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: username,
        password,
        email_confirm: true
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // =========================
    // 2. CRIAR PROFILE
    // =========================
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          username,
          role: 'user'
        }
      ])
      .select()
      .single();

    if (error) {
      // rollback se profile falhar
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      ok: true,
      user: data
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Erro interno'
    });
  }
}
