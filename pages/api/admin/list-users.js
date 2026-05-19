// pages/api/admin/list-users.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const provided = req.headers['x-admin-secret'];
  if (!ADMIN_API_SECRET || provided !== ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // lista todos os usuários (para projetos grandes, implemente paginação)
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('listUsers error', listError);
      return res.status(500).json({ error: listError.message || listError });
    }

    const users = listData?.users || [];

    // filtra "ativos" por email_confirmed_at (ajuste se quiser outro critério)
    const activeUsers = users.filter(u => !!u.email_confirmed_at);

    // busca perfis correspondentes (role) na tabela profiles
    const ids = activeUsers.map(u => u.id);
    let profiles = [];
    if (ids.length) {
      const { data: pData, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('id, role, email')
        .in('id', ids);
      if (pError) console.warn('profiles fetch warning', pError);
      profiles = pData || [];
    }

    // combina dados
    const result = activeUsers.map(u => {
      const prof = profiles.find(p => p.id === u.id) || {};
      return {
        id: u.id,
        email: u.email,
        role: prof.role || 'usuario',
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at
      };
    });

    return res.status(200).json({ ok: true, users: result });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: err.message || err });
  }
}
