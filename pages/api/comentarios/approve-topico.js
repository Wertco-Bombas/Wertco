import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('approve-topico handler start', { method: req.method });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // =========================
  // AUTH PADRONIZADO
  // =========================
  const auth = await checkAdmin(req);

  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = auth.userId;

  const { id, approve } = req.body ?? {};

  if (!id || typeof approve !== 'boolean') {
    return res.status(400).json({
      error: 'Invalid payload. Expecting { id, approve: boolean }'
    });
  }

  try {
    // =========================
    // UPDATE TOPICO (PADRÃO CONSISTENTE)
    // =========================
    const { error: updateErr } = await supabaseAdmin
      .from('topicos')
      .update({
        approved: approve,
        status: approve ? 'approved' : 'pending'
      })
      .eq('id', id);

    if (updateErr) {
      console.error('Error updating topico', updateErr);
      return res.status(500).json({ error: updateErr.message });
    }

    // =========================
    // AUDITORIA
    // =========================
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    await supabaseAdmin.from('auditoria').insert({
      acao: approve ? 'APPROVE_TOPICO' : 'REJECT_TOPICO',
      entidade: 'topicos',
      usuario_id: userId,
      usuario_email: profile?.email || null,
      payload: {
        topico_id: id,
        approved: approve
      },
      status: 'success'
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('approve-topico unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
