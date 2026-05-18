import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [categorias, setCategorias] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [novoComentario, setNovoComentario] = useState('');

  useEffect(() => {
    async function carregarDados() {
      const { data: cats } = await supabase.from('categorias').select('*');
      const { data: tops } = await supabase.from('topicos').select('*');
      setCategorias(cats || []);
      setTopicos(tops || []);
    }
    carregarDados();
  }, []);

  async function salvarComentario(topicoId) {
    const { error } = await supabase
      .from('comentarios')
      .insert({ conteudo: novoComentario, topico_id: topicoId });
    if (error) alert(error.message);
    else {
      alert('Comentário adicionado!');
      setNovoComentario('');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      {/* Barra de pesquisa */}
      <input type="text" placeholder="Pesquisar títulos, descrições, categorias, comentários..." className="search-bar" />

      {/* Botões de ação */}
      <div className="actions">
        <button onClick={() => window.location.href='/nova-categoria'}>+ Nova Categoria</button>
        <button onClick={() => window.location.href='/novo-topico'}>+ Novo Tópico</button>
        <button onClick={() => window.location.href='/excluir-categoria'}>- Excluir Categoria</button>
        <button onClick={() => window.location.href='/excluir-topico'}>- Excluir Tópico</button>
      </div>

      {/* Lista de categorias */}
      <h2>Categorias</h2>
      <div className="categorias-list">
        {categorias.map(cat => (
          <div key={cat.id} className="categoria-card">
            <h3>{cat.nome}</h3>
            {cat.descricao && <p>{cat.descricao}</p>}
          </div>
        ))}
      </div>

      {/* Lista de tópicos com comentários */}
      <h2>Tópicos</h2>
      <div className="topicos-list">
        {topicos.map(top => (
          <div key={top.id} className="topico-card">
            <h3>{top.titulo}</h3>
            {top.conteudo && <p>{top.conteudo}</p>}

            {/* Comentários */}
            <div className="comentarios">
              <h4>Comentários</h4>
              {/* Aqui você pode carregar comentários do Supabase */}
              <input 
                type="text" 
                placeholder="Adicionar comentário..." 
                value={novoComentario} 
                onChange={(e) => setNovoComentario(e.target.value)} 
              />
              <button onClick={() => salvarComentario(top.id)}>Enviar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Navegação */}
      <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}
