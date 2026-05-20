import { supabase } from './supabase';

export async function audit({
  acao,
  entidade,
  usuario,
  payload = {},
  status = 'success'
}) {
  try {
    await supabase.from('auditoria').insert({
      acao,
      entidade,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || null,
      status,
      payload
    });
  } catch (err) {
    console.error('Erro auditoria:', err.message);
  }
}
