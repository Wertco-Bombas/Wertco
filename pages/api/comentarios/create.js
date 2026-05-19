// pages/api/comentarios/create.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conteudo, topico_id, usuario_id, usuario_email, imagem_base64 } = req.body;

  if (!conteudo && !imagem_base64) {
    return res.status(400).json({ error: 'Conteúdo ou imagem são obrigatórios' });
  }
  if (!topico_id) {
    return res.status(400).json({ error: 'Tópico é obrigatório' });
  }

  // Verifica se o tópico existe
  const { data: topico, error: topicoError } = await supabase
    .from('topicos')
    .select('id')
    .eq('id', topico_id)
    .maybeSingle();

  if (topicoError) {
    return res.status(500).json({ error: topicoError.message });
  }

  if (!topico) {
    return res.status(400).json({ error: `Tópico com id ${topico_id} não existe` });
  }

  // Insere o comentário com email do usuário e imagem (base64)
  const { error } = await supabase
    .from('comentarios')
    .insert({
      conteudo,
      topico_id,
      usuario_id: usuario_id || null,
      usuario_email: usuario_email || null,
      imagem_base64: imagem_base64 || null
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
