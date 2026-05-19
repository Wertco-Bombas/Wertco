import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await checkAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId in request body' });

  try {
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
}
