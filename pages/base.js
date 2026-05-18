import { supabase } from '../lib/supabase';

export default function Base() {
  // Função de logout (presente em todas as páginas)
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/'; // volta para tela de login
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      {/* Barra de busca */}
      <input type="text" placeholder="Buscar..." className="search-bar" />

      {/* Botões de ações */}
      <div className="actions">
        {/* Agora cada botão abre uma nova página com formulário */}
        <button onClick={() => window.location.href='/nova-categoria'}>+ Nova Categoria</button>
        <button onClick={() => window.location.href='/novo-topico'}>+ Novo Tópico</button>
        <button onClick={() => window.location.href='/excluir-categoria'}>- Excluir Categoria</button>
        <button onClick={() => window.location.href='/excluir-topico'}>- Excluir Tópico</button>
      </div>

      {/* Navegação */}
      <div className="navigation">
        <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
        <button onClick={handleLogout}>Sair</button>
      </div>
    </div>
  );
}
