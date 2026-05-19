await supabase
  .from('comentarios')
  .insert({
    conteudo,
    topico_id,
    usuario_id: user.id // 👈 usa o nome correto da coluna
  });
