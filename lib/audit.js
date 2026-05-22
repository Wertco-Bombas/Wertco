import { supabaseAdmin } from './supabaseAdmin';

export async function audit({
  acao,
  entidade,
  usuario,
  payload = {},
  status = 'success',
}) {
  try {
    if (!supabaseAdmin) {
      console.warn('Audit skipped: supabaseAdmin not initialized');
      return;
    }

    await supabaseAdmin.from('auditoria').insert({
      acao,
      entidade,
      usuario_id: usuario?.id || null,
      usuario_email: usuario?.email || null,
      payload,
      status,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit error:', err.message);
  }
}
