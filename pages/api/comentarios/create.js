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

    const body = req.body || {};

    const conteudo =
      typeof body.conteudo === 'string'
        ? body.conteudo.trim()
        : '';

    const topico_id =
      Number(body.topico_id);

    const usuario_id =
      body.usuario_id || null;

    const user_email =
      body.usuario_email || null;

    const imagem =
      body.imagem || null;

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

    // BUSCA ROLE DO USUÁRIO

    let role = 'user';

    if (usuario_id) {

      const { data: profile } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', usuario_id)
          .single();

      role = profile?.role || 'user';
    }

    // ADMIN E SUPERVISOR JÁ APROVAM AUTOMÁTICO

    const approved =
      role === 'admin' ||
      role === 'supervisor';

    // INSERT

    const { data, error } =
      await supabase
        .from('comentarios')
        .insert([
          {
            conteudo,
            topico_id,
            usuario_id,
            user_email,
            imagem,
            approved
          }
        ])
        .select();

    if (error) {

      console.error(error);

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      data
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
