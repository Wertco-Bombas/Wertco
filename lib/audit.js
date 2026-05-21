import { supabase } from './supabase';

export async function audit({
  acao,
  entidade,
  usuario = null,
  payload = {},
  status = 'success'
}) {
  try {

    const { data: { session } } =
      await supabase.auth.getSession();

    const user = usuario || session?.user;

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
