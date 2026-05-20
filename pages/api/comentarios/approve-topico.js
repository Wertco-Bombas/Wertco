// pages/api/comentarios/approve-topico.js
import { supabase, supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  console.log('approve-topico handler start', { method: req.method });

  if (req.method !== 'POST') {
    console.warn('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    console.error('supabaseAdmin is not configured. Check SUPABASE_SERVICE_ROLE_KEY.');
    return res.status(500).json({ error: 'Service role key not configured on server.' });
  }

  try {
    const { id, approve } = req.body ?? {};
    console.log('payload', { id, approve });

    if (!id || (typeof approve !== 'boolean')) {
      console.warn('Invalid payload', { id, approve });
      return res.status(400).json({ error: 'Invalid payload. Expecting { id, approve: boolean }' });
    }

    // obtém token do header Authorization (Bearer <token>)
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;
    if (!token) {
      console.warn('Missing Authorization header');
      return res.status(401).json({ error: 'Unauthorized. Missing token.' });
    }

    // obtém usuário a partir do token usando o cliente público (supabase)
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr) {
      console.error('supabase.auth.getUser error', userErr);
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = userData?.user;
    if (!user) {
      console.warn('No user found for token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // busca role do usuário (profiles) usando supabaseAdmin para evitar RLS
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      console.error('Error fetching profile role', profileErr);
      // não vazar detalhes sensíveis ao cliente, mas informar que houve problema
      return res.status(500).json({ error: 'Unable to verify user role' });
    }

    const role = profile?.role || 'user';
    console.log('user role', { userId: user.id, role });

    if (!['admin', 'supervisor'].includes(role)) {
      console.warn('Forbidden: insufficient role', { userId: user.id, role });
      return res.status(403).json({ error: 'Forbidden' });
    }

    // atualiza tópico
    const { error: updateErr } = await supabaseAdmin
      .from('topicos')
      .update({ approved: approve })
      .eq('id', id);

    if (updateErr) {
      console.error('Error updating topico', updateErr);
      return res.status(500).json({ error: updateErr.message || 'Failed to update topic' });
    }

    console.log('Topico updated', { id, approve });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('approve-topico unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
