// pages/api/admin/delete-user.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const provided = req.headers['x-admin-secret'];
  if (!ADMIN_API_SECRET || provided !== ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // remove perfil (profiles) — ajuste se sua tabela for 'users'
    const { error: delProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (delProfileError) {
      console.warn('profile delete warning', delProfileError);
      // continua para tentar remover do Auth mesmo se falhar
    }

    // remove usuário do Auth
    const { error: delAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delAuthError) {
      console.error('deleteUser error', delAuthError);
      return res.status(500).json({ error: delAuthError.message || delAuthError });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: err.message || err });
  }
}
