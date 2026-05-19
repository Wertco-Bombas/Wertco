// pages/api/comentarios/delete.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, usuario_id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID é obrigatório' });
  }

  // Verifica se comentário existe e pertence ao usuário
  const { data: comentario, error: fetchError } = await supabase
    .from('comentarios')
    .select('id, usuario_id, topico_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!comentario) {
    return res.status(404).json({ error: 'Comentário não encontrado' });
  }
  if (comentario.usuario_id && usuario_id && comentario.usuario_id !== usuario_id) {
    return res.status(403).json({ error: 'Você só pode excluir seus próprios comentários' });
  }

  const { error } = await supabase.from('comentarios').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
