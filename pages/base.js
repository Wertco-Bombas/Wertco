import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';


export default function Base() {
  const [categorias, setCategorias] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [novoComentario, setNovoComentario] = useState({});

  // Carregar categorias e tópicos
  useEffect(() => {
    async function carregarDados() {
      const { data: cats } = await supabase.from('categorias').select('*');
      const { data: tops } = await supabase.from('topicos').select('*');
      setCategorias(cats || []);
      setTopicos(tops || []);
    }
    carregarDados();
  }, []);

  // Carregar comentários de um tópico
  async function carregarComentarios(topicoId) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId);
    if (!error) {
      setComentarios(prev => ({ ...prev, [topicoId]: data }));
    }
  }

  // Salvar comentário
  async function salvarComentario(topicoId) {
    const conteudo = novoComentario[topicoId] || '';
    if (!conteudo.trim()) return;

    const { error } = await supabase
      .from('comentarios')
      .insert({ conteudo, topico_id: topicoId });

    if (error) {
      alert(error.message);
    } else {
      setNovoComentario(prev => ({ ...prev, [topicoId]: '' }));
      carregarComentarios(topicoId);
    }
  }

  // Excluir categoria (remove tópicos vinculados antes)
  async function excluirCategoria(id) {
    await supabase.from('topicos').delete().eq('categoria_id', id);
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) alert(error.message);
    else alert('Categoria e tópicos excluídos!');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      {/* Barra de pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar títulos, descrições, categorias, comentários..."
        className="search-bar"
      />

      {/* Botões de ação */}
      <div className="actions">
        <button onClick={() => window.location.href='/nova-categoria'}>+ Nova Categoria</button>
        <button onClick={() => window.location.href='/novo-topico'}>+ Novo Tópico</button>
        <button onClick={() => window.location.href='/excluir-categoria'}>- Excluir Categoria</button>
        <button onClick={() => window.location.href='/excluir-topico'}>- Excluir Tópico</button>
      </div>

      {/* Layout em duas colunas */}
      <div className="layout-grid" style={{ display: 'flex', gap: '20px' }}>
        
        {/* Coluna esquerda: tópicos */}
        <div className="topicos-col" style={{ flex: 2 }}>
          <h2>Tópicos</h2>
          {topicos.map(top => (
            <div key={top.id} className="topico-card" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '15px' }}>
              <h3>{top.titulo}</h3>
              {top.conteudo && <p>{top.conteudo}</p>}

              {/* Comentários */}
              <div className="comentarios">
                <h4>Comentários</h4>
                <button onClick={() => carregarComentarios(top.id)}>Carregar comentários</button>
                <ul>
                  {(comentarios[top.id] || []).map(com => (
                    <li key={com.id}>{com.conteudo}</li>
                  ))}
                </ul>

                <input
                  type="text"
                  placeholder="Adicionar comentário..."
                  value={novoComentario[top.id] || ''}
                  onChange={(e) =>
                    setNovoComentario(prev => ({ ...prev, [top.id]: e.target.value }))
                  }
                />
                <button onClick={() => salvarComentario(top.id)}>Enviar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Coluna direita: categorias */}
        <div className="categorias-col" style={{ flex: 1 }}>
          <h2>Categorias</h2>
          {categorias.map(cat => (
            <div key={cat.id} className="categoria-card" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '15px' }}>
              <h3>{cat.nome}</h3>
              {cat.descricao && <p>{cat.descricao}</p>}
              <button onClick={() => excluirCategoria(cat.id)}>Excluir esta categoria</button>
            </div>
          ))}
        </div>
      </div>

      {/* Navegação */}
      <div className="navigation" style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
        <button onClick={handleLogout}>Sair</button>
      </div>
    </div>
  );
}
