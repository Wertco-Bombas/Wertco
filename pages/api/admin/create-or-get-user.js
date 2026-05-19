import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await checkAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { email, password, role = 'usuario' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = (listData?.users || []).find(
      u => (u.email || '').toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      const userId = existing.id;
      const profilePayload = { id: userId, email, role };

      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertError) return res.status(500).json({ error: upsertError.message });

      return res.status(200).json({ ok: true, userId, existed: true });
    }

    if (!password) return res.status(400).json({ error: 'Password required to create new user' });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (authError) return res.status(500).json({ error: authError.message });

    const newUserId = authData?.user?.id;
    if (!newUserId) return res.status(500).json({ error: 'User created but no id returned' });

    const profilePayload = { id: newUserId, email, role };
    const { error: insertError } = await supabaseAdmin.from('profiles').insert(profilePayload);
    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({ ok: true, userId: newUserId, existed: false });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
}
