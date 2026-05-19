import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  alert('Você precisa estar logado como admin para acessar esta página.');
  return;
}


export default async function handler(req, res) {
  const auth = await checkAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const users = (listData?.users || []).filter(u => !!u.email_confirmed_at);
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
}
