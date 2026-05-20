await logAction({
  acao: 'CREATE_TOPICO',
  entidade: 'topicos',
  usuario_id: user.id,
  usuario_email: user.email,
  payload: { titulo }
});
