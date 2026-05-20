// pages/api/comentarios/approve-topico.js
import { supabase, supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!supabaseAdmin) return res.status(500).json({ error: 'Service role key not configured on server.' });

  try {
    const { id, approve } = req.body;
    if (!id || typeof approve !== 'boolean') return res.status(400).json({ error: 'Invalid payload' });

    // obtém token do header Authorization (Bearer <token>)
    const token = req.headers.authorization?.replace('Bearer ', '') || null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // obtém usuário a partir do token usando o cliente público (supabase)
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

    // busca role do usuário (profiles) usando supabaseAdmin para evitar RLS
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';
    if (!['admin', 'supervisor'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

    // atualiza tópico
    const { error: updateErr } = await supabaseAdmin
      .from('topicos')
      .update({ approved: approve })
      .eq('id', id);

    if (updateErr) return res.status(500).json({ error: updateErr.message || updateErr });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('approve-topico error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
