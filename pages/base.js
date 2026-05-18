import { supabase } from '../lib/supabase';

export default function Base() {
  async function addCategoria() {
    const { error } = await supabase.from('categorias').insert({ nome: 'Nova Categoria' });
    if (error) alert(error.message);
    else alert('Categoria criada!');
  }

  async function addTopico() {
    const { error } = await supabase.from('topicos').insert({ titulo: 'Novo Tópico' });
    if (error) alert(error.message);
    else alert('Tópico criado!');
  }

  async function deleteCategoria() {
    const { error } = await supabase.from('categorias').delete().eq('id', 1); // exemplo
    if (error) alert(error.message);
    else alert('Categoria excluída!');
  }

  async function deleteTopico() {
    const { error } = await supabase.from('topicos').delete().eq('id', 1); // exemplo
    if (error) alert(error.message);
    else alert('Tópico excluído!');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>
      <input type="text" placeholder="Buscar..." className="search-bar" />
      <div className="actions">
        <button onClick={addCategoria}>+ Nova Categoria</button>
        <button onClick={addTopico}>+ Novo Tópico</button>
        <button onClick={deleteCategoria}>- Excluir Categoria</button>
        <button onClick={deleteTopico}>- Excluir Tópico</button>
      </div>
      <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}
