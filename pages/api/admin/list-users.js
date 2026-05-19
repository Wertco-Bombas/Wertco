// pages/api/admin/list-users.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
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

  // 4) Lógica da rota (listar usuários)
  try {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const users = (listData?.users || []).filter(u => !!u.email_confirmed_at);
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
}
