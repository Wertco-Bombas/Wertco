const isPriv = isPrivileged(role);

const { data, error } = await supabaseAdmin
  .from('topicos')
  .insert({
    title: titulo.trim(),
    content: conteudo,
    category_id: categoriaId,
    status: isPriv ? 'approved' : 'pending',
    user_id: user.id,
    user_email: user.email
  })
  .select()
  .single();
