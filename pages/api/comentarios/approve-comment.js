// pages/api/approve-comment.js
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, approve } = req.body; // approve = true|false
  // aqui você deve validar sessão e role do usuário (supervisor/admin)
  // Exemplo simplificado: verificar token no header (implemente checagem real)
  // if (!isSupervisorOrAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  const { error } = await supabase
    .from('comentarios')
    .update({ approved: approve })
    .eq('id', id);

  if (error) return res.status(500).json({ error });
  return res.status(200).json({ ok: true });
}
