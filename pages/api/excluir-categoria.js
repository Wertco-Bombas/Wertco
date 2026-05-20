async function handleExcluirCategoria(categoriaId) {
  const { count, error } = await supabase
    .from('topicos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', categoriaId);

  if (error) {
    alert('Erro ao verificar tópicos vinculados.');
    return;
  }

  if (count > 0) {
    alert('Não é possível excluir esta categoria: existem tópicos vinculados. Remova ou reatribua os tópicos antes.');
    return;
  }

  const { error: delError } = await supabase.from('categorias').delete().eq('id', categoriaId);
  if (delError) {
    alert('Erro ao excluir categoria.');
    return;
  }

  alert('Categoria excluída com sucesso.');
  window.location.href = '/base';
}
