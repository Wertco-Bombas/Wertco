// pages/api/approve-topico.js
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, approve } = req.body;
  // validar role do usuário aqui
  const { error } = await supabase
    .from('topicos')
    .update({ approved: approve })
    .eq('id', id);

  if (error) return res.status(500).json({ error });
  return res.status(200).json({ ok: true });
}
