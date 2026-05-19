import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from '../../../lib/helper-cors';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // 1) CORS
  setCorsHeaders(res);

  // 2) Responder preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3) Autorização (exemplo com x-admin-secret)
  const provided = req.headers['x-admin-secret'];
  if (!ADMIN_API_SECRET || provided !== ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 4) Lógica da rota
  try {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const users = (listData?.users || []).filter(u => !!u.email_confirmed_at);
    // buscar perfis etc...
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
}
