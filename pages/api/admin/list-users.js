// pages/api/admin/list-users.js
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
    // Busca diretamente na tabela profiles
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ ok: true, users: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
}
