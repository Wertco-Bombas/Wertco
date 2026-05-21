import { supabase } from '../lib/supabase';

export async function audit({
  acao,
  entidade,
  usuario = null,
  payload = {},
  status = 'success'
}) {
  try {

    let user = usuario;

    // fallback seguro
    if (!user) {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user || null;
    }

    await supabase.from('auditoria').insert({
      acao,
      entidade,
      usuario_id: user?.id || null,
      usuario_email: user?.email || null,
      status,
      payload
    });

  } catch (err) {
    console.error('Erro auditoria:', err.message);
  }
}
