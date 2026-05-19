// pages/api/admin/create-user.js
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

  // Pega os dados do body
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Define papel padrão se não vier nada
  const userRole = role || 'usuario';

  // Valida se o papel informado é permitido
  const validRoles = ['usuario', 'supervisor', 'admin'];
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  try {
    // Cria usuário no Auth e marca como confirmado
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('authError', authError);
      return res.status(500).json({ error: authError.message || authError });
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return res.status(500).json({ error: 'User created but no id returned' });
    }

    // Insere perfil na tabela 'profiles'
    const profilePayload = {
      id: userId,
      email,
      role: userRole,
      username: email.split('@')[0] // gera username automático
    };

    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilePayload);

    if (insertError) {
      console.error('insertError', insertError);
      // opcional: remover o usuário criado no Auth se o insert falhar
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return res.status(500).json({ error: insertError.message || insertError });
    }

    return res.status(200).json({ ok: true, userId, role: userRole });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: err.message || err });
  }
}
