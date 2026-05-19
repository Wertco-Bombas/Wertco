// pages/api/admin/create-or-get-user.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Obter token do header Authorization
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // 2) Validar token e obter usuário
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = userData.user.id;

  // 3) Buscar perfil e checar role
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (pErr || !profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 4) Criar ou recuperar usuário alvo
  const { email, password, role = 'usuario' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    // Lista usuários e procura por email
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) console.warn('listUsers warning', listError);

    const existing = (listData?.users || []).find(
      u => (u.email || '').toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      // usuário já existe -> upsert do perfil
      const userId = existing.id;
      const profilePayload = { id: userId, email, role };

      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertError) {
        console.error('upsert profile error', upsertError);
        return res.status(500).json({ error: upsertError.message || upsertError });
      }

      return res.status(200).json({ ok: true, userId, existed: true });
    }

    // Se não existe, cria via Admin API (requer password)
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

    const newUserId = authData?.user?.id;
    if (!newUserId) return res.status(500).json({ error: 'User created but no id returned' });

    // Insere perfil
    const profilePayload = { id: newUserId, email, role };
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilePayload);

    if (insertError) {
      console.error('insert profile error', insertError);
      // opcional: remover usuário criado no Auth se insert falhar
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      return res.status(500).json({ error: insertError.message || insertError });
    }

    return res.status(200).json({ ok: true, userId: newUserId, existed: false });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: err.message || err });
  }
}
