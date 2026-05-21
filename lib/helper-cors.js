import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from '../../../lib/helper-cors';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // 1. valida token do usuário (OBRIGATÓRIO)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const { data: userData } =
      await supabaseAdmin.auth.getUser(token);

    if (!userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 2. busca role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 3. lista usuários
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    const users = (data?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at
    }));

    return res.status(200).json({
      ok: true,
      users
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
