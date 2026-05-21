import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // =========================
  // AUTH (PADRÃO ÚNICO)
  // =========================
  const auth = await checkAdmin(req);

  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = auth.userId;

  const { id, approve } = req.body;

  if (!id || typeof approve !== 'boolean') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    // =========================
    // UPDATE COMMENT
    // =========================
    const { error: updateErr } = await supabaseAdmin
      .from('comentarios')
      .update({ approved: approve })
      .eq('id', id);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    // =========================
    // GET USER INFO (opcional mais seguro)
    // =========================
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // =========================
    // AUDITORIA
    // =========================
    await supabaseAdmin.from('auditoria').insert({
      acao: approve ? 'APPROVE_COMMENT' : 'REJECT_COMMENT',
      entidade: 'comentarios',
      usuario_id: userId,
      usuario_email: profile?.email || null,
      payload: {
        comment_id: id,
        approved: approve
      },
      status: 'success'
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('approve-comment error:', err);
    return res.status(500).json({ error: err.message });
  }
}
