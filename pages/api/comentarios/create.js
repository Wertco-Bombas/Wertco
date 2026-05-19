// pages/api/comentarios/create.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conteudo, topico_id, usuario_id } = req.body;

  if (!conteudo || !topico_id) {
    return res.status(400).json({ error: 'Conteúdo e tópico são obrigatórios' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('comentarios')
      .insert({
        conteudo,
        topico_id,
        usuario_id: usuario_id || null // 👈 usa o nome correto da coluna
      });

    if (error) {
      console.error('insertError', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: err.message || err });
  }
}
