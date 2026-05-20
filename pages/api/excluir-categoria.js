async function handleExcluirCategoria(categoriaId) {
  try {
    // 1) buscar tópicos vinculados à categoria
    const { data: topicosData, error: topicosError } = await supabase
      .from('topicos')
      .select('id, titulo')
      .eq('categoria_id', categoriaId);

    if (topicosError) {
      console.error('Erro ao verificar tópicos vinculados:', topicosError);
      alert('Erro ao verificar tópicos vinculados.');
      return;
    }

    const topicoIds = (topicosData || []).map(t => t.id);
    const topicosCount = topicoIds.length;

    // se não houver tópicos, exclui a categoria diretamente
    if (topicosCount === 0) {
      const { error: delError } = await supabase.from('categorias').delete().eq('id', categoriaId);
      if (delError) {
        console.error('Erro ao excluir categoria:', delError);
        alert('Erro ao excluir categoria.');
        return;
      }
      alert('Categoria excluída com sucesso.');
      window.location.href = '/base';
      return;
    }

    // 2) se houver tópicos, verificar se existem comentários vinculados a esses tópicos
    const { data: comentariosData, error: comentariosError } = await supabase
      .from('comentarios')
      .select('id, topico_id')
      .in('topico_id', topicoIds);

    if (comentariosError) {
      console.error('Erro ao verificar comentários vinculados:', comentariosError);
      alert('Erro ao verificar comentários vinculados.');
      return;
    }

    const comentariosCount = (comentariosData || []).length;

    // 3) pedir confirmação ao usuário com informações claras
    const mensagem = comentariosCount > 0
      ? `Esta categoria possui ${topicosCount} tópico(s) e ${comentariosCount} comentário(s) vinculados. Deseja apagar os comentários, os tópicos e, em seguida, a categoria? Esta ação é irreversível.`
      : `Esta categoria possui ${topicosCount} tópico(s) vinculados. Deseja apagar os tópicos e, em seguida, a categoria? Esta ação é irreversível.`;

    const confirmar = confirm(mensagem);
    if (!confirmar) return;

    // 4) executar exclusões na ordem segura: comentários -> tópicos -> categoria
    // deletar comentários vinculados (se existirem)
    if (comentariosCount > 0) {
      const { error: delComError } = await supabase
        .from('comentarios')
        .delete()
        .in('topico_id', topicoIds);

      if (delComError) {
        console.error('Erro ao excluir comentários:', delComError);
        alert('Erro ao excluir comentários vinculados. Operação abortada.');
        return;
      }
    }

    // deletar tópicos vinculados
    const { error: delTopError } = await supabase
      .from('topicos')
      .delete()
      .in('id', topicoIds);

    if (delTopError) {
      console.error('Erro ao excluir tópicos:', delTopError);
      alert('Erro ao excluir tópicos vinculados. Operação abortada.');
      return;
    }

    // por fim, deletar a categoria
    const { error: delCatError } = await supabase
      .from('categorias')
      .delete()
      .eq('id', categoriaId);

    if (delCatError) {
      console.error('Erro ao excluir categoria:', delCatError);
      alert('Erro ao excluir categoria após remover tópicos/comentários.');
      return;
    }

    alert('Categoria, tópicos e comentários vinculados excluídos com sucesso.');
    window.location.href = '/base';
  } catch (err) {
    console.error('Erro inesperado ao excluir categoria:', err);
    alert('Erro inesperado ao excluir categoria. Veja o console para mais detalhes.');
  }
}
