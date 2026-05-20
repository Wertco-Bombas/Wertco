// pages/api/comentarios/create.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {

    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

    console.log('BODY COMPLETO:', req.body);

    // GARANTE QUE O BODY EXISTE
    const body = req.body || {};

    // PEGA OS CAMPOS
    const conteudo =
      typeof body.conteudo === 'string'
        ? body.conteudo.trim()
        : '';

    const topico_id = Number(body.topico_id);

    const usuario_id = body.usuario_id || null;

    const user_email = body.usuario_email || null;

    // DEBUG
    console.log('CONTEUDO:', conteudo);
    console.log('TOPICO:', topico_id);

    // VALIDAÇÕES
    if (!conteudo) {
      return res.status(400).json({
        error: 'Conteúdo vazio'
      });
    }

    if (!topico_id) {
      return res.status(400).json({
        error: 'Tópico inválido'
      });
    }

    // INSERT
    const { data, error } = await supabase
      .from('comentarios')
      .insert([
        {
          conteudo,
          topico_id,
          usuario_id,
          user_email
        }
      ])
      .select();

    if (error) {
      console.error('ERRO INSERT:', error);

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      data
    });

  } catch (err) {

    console.error('ERRO GERAL:', err);

    return res.status(500).json({
      error: err.message
    });
  }
}
