import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password_hash: password, role: 'user' }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, user: data });
}
