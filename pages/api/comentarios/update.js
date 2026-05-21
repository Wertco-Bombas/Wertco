import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, conteudo } = req.body || {};

    if (!id || !conteudo?.trim()) {
      return res.status(400).json({ error: 'ID e conteúdo são obrigatórios' });
    }

    // =========================
    // AUTH (token do usuário)
    // =========================
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token ausente' });
    }

    const { data: userData, error: userError } =
      await supabaseAuth.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Usuário inválido' });
    }

    const user = userData.user;

    // =========================
    // BUSCAR COMENTÁRIO
    // =========================
    const { data: comentario, error: fetchError } = await supabaseAdmin
      .from('comentarios')
      .select('id, usuario_id')
      .eq('id', id)
      .single();

    if (fetchError || !comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // =========================
    // BUSCAR ROLE DO USUÁRIO
    // =========================
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Erro ao verificar permissão' });
    }

    const role = profile?.role || 'user';

    // =========================
    // PERMISSÃO
    // =========================
    const isOwner = comentario.usuario_id === user.id;
    const isAdmin = role === 'admin' || role === 'supervisor';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar este comentário'
      });
    }

    // =========================
    // UPDATE
    // =========================
    const { error: updateError } = await supabaseAdmin
      .from('comentarios')
      .update({
        conteudo: conteudo.trim()
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('update comentario error:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
