import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../../../lib/checkAdmin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    // =========================
    // AUTH (SEGURANÇA REAL)
    // =========================
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);

    const user = userData?.user;

    if (userErr || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // =========================
    // BODY
    // =========================
    const body = req.body || {};

    const conteudo =
      typeof body.conteudo === 'string'
        ? body.conteudo.trim()
        : '';

    const topico_id = Number(body.topico_id);
    const imagem = body.imagem || null;

    if (!conteudo) {
      return res.status(400).json({ error: 'Conteúdo vazio' });
    }

    if (!topico_id) {
      return res.status(400).json({ error: 'Tópico inválido' });
    }

    // =========================
    // ROLE REAL (NUNCA DO CLIENTE)
    // =========================
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';

    const approved = ['admin', 'supervisor'].includes(role);

    // =========================
    // INSERT
    // =========================
    const { data, error } = await supabase
      .from('comentarios')
      .insert([
        {
          conteudo,
          topico_id,
          usuario_id: user.id,
          usuario_email: user.email,
          imagem,
          approved
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      ok: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
