import { supabaseAdmin } from './supabase';

export async function audit({
  acao,
  entidade,
  usuario,
  payload = {},
  status = 'success'
}) {
  try {
    await supabaseAdmin.from('auditoria').insert({
      acao,
      entidade,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || null,
      payload,
      status,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit error:', err.message);
  }
}
