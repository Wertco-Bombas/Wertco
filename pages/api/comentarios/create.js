await supabase
  .from('comentarios')
  .insert({
    conteudo: comentario,
    topico_id: topicoId,
    user_id: user?.id // 👈 precisa existir essa coluna
  });
