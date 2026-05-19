// pages/api/admin/create-or-get-user.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Proteção simples por header secreto
  const provided = req.headers['x-admin-secret'];
  if (!ADMIN_API_SECRET || provided !== ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, password, role = 'usuario' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    // 1) lista usuários no Auth e procura por email (pequeno projeto; para muitos usuários use paginação)
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) console.warn('listUsers warning', listError);

    const existing = (listData?.users || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase());

    if (existing) {
      // usuário já existe -> upsert do perfil
      const userId = existing.id;
      const profilePayload = { id: userId, email, role };

      const { error: upsertError } = await supabaseAdmin
        .from('profiles') // ajuste para 'users' se for o seu caso
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertError) {
        console.error('upsert profile error', upsertError);
        return res.status(500).json({ error: upsertError.message || upsertError });
      }

      return res.status(200).json({ ok: true, userId, existed: true });
    }

    // 2) se não existe, cria via Admin API (requer password)
    if (!password) return res.status(400).json({ error: 'Password required to create new user' });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('createUser error', authError);
      return res.status(500).json({ error: authError.message || authError });
    }

    const userId = authData?.user?.id;
    if (!userId) return res.status(500).json({ error: 'User created but no id returned' });

    // 3) insere perfil
    const profilePayload = { id: userId, email, role };
    const { error: insertError } = await supabaseAdmin
      .from('profiles') // ajuste se necessário
      .insert(profilePayload);

    if (insertError) {
      console.error('insert profile error', insertError);
      // opcional: remover usuário criado no Auth se insert falhar
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return res.status(500).json({ error: insertError.message || insertError });
    }

    return res.status(200).json({ ok: true, userId, existed: false });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: err.message || err });
  }
}
