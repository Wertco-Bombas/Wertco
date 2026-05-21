import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // =========================
    // AUTH PADRÃO
    // =========================
    const auth = await checkAdmin(req);

    // ⚠️ não exige admin aqui porque usuário também pode deletar próprio comentário
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token ausente' });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Usuário inválido' });
    }

    const userId = userData.user.id;

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    // =========================
    // BUSCA COMENTÁRIO
    // =========================
    const { data: comentario, error: fetchErr } = await supabaseAdmin
      .from('comentarios')
      .select('id, usuario_id')
      .eq('id', id)
      .single();

    if (fetchErr || !comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // =========================
    // ROLE DO USUÁRIO
    // =========================
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = profile?.role || 'user';

    const isOwner = comentario.usuario_id === userId;
    const isAdmin = ['admin', 'supervisor'].includes(role);

    // =========================
    // PERMISSÃO
    // =========================
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Sem permissão para excluir este comentário'
      });
    }

    // =========================
    // DELETE
    // =========================
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
