import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    // 🔐 pega token do usuário logado
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token ausente' });
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Usuário inválido' });
    }

    const userId = userData.user.id;

    // 🔎 busca role do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = profile?.role || 'user';

    // 🔎 busca comentário
    const { data: comentario } = await supabaseAdmin
      .from('comentarios')
      .select('id, usuario_id')
      .eq('id', id)
      .single();

    if (!comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    const isOwner = comentario.usuario_id === userId;
    const isAdmin = role === 'admin' || role === 'supervisor';

    // 🚫 regra de permissão
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para excluir este comentário' });
    }

    // 🗑 delete
    const { error } = await supabaseAdmin
      .from('comentarios')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
