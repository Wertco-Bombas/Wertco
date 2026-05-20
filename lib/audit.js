import { supabase } from './supabase';

export async function logAction({
  acao,
  entidade,
  usuario_id,
  usuario_email,
  payload = {},
  status = 'success'
}) {
  try {
    await supabase.from('auditoria').insert({
      acao,
      entidade,
      usuario_id,
      usuario_email,
      payload,
      status,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro auditoria:', err.message);
  }
}
