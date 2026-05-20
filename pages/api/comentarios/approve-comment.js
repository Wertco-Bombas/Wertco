import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// cliente público só para validar token
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, approve } = req.body;

    if (!id || typeof approve !== 'boolean') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // =========================
    // AUTH CHECK
    // =========================
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    const user = userData?.user;

    if (userErr || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // =========================
    // ROLE CHECK
    // =========================
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      return res.status(500).json({ error: profileErr.message });
    }

    const role = profile?.role || 'user';

    if (!['admin', 'supervisor'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // =========================
    // UPDATE COMMENT
    // =========================
    const { error: updateErr } = await supabaseAdmin
      .from('comentarios')
      .update({
        approved: approve
      })
      .eq('id', id);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    // =========================
    // AUDITORIA (NOVO 🔥)
    // =========================
    await supabaseAdmin.from('auditoria').insert({
      acao: approve ? 'APPROVE_COMMENT' : 'REJECT_COMMENT',
      entidade: 'comentarios',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: {
        comment_id: id,
        approved: approve
      },
      status: 'success',
      created_at: new Date().toISOString()
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('approve-comment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
