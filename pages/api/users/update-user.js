// pages/api/admin/update-user.js
import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await checkAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Missing userId or newPassword' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) throw error;
    return res.status(200).json({ ok: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
}
