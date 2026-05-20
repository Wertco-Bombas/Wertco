// pages/base.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [comentario, setComentario] = useState('');
  const [imagem, setImagem] = useState(null);
  const [editingComentario, setEditingComentario] = useState(null);
  const [comentarios, setComentarios] = useState([]);

  // Carregar tópicos e categorias
  useEffect(() => {
    async function loadData() {
      const { data: topicosData } = await supabase
        .from('topicos')
        .select('id, titulo, descricao, categoria_id, categorias(nome)')
        .order('created_at', { ascending: false });

      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      setTopicos(topicosData || []);
      setCategorias(categoriasData || []);
    }
    loadData();
  }, []);

  // Carregar comentários
  async function loadComentarios(topicoId) {
    const { data } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId)
      .order('created_at', { ascending: false });
    setComentarios(data || []);
  }

  // Adicionar comentário
  async function handleAddComentario(topicoId) {
    if (!comentario) return;

    const { error } = await supabase.from('comentarios').insert([
      {
        texto: comentario,
        topico_id: topicoId,
        imagem_url: imagem ? imagem.name : null,
      },
    ]);

    if (!error) {
      setComentario('');
      setImagem(null);
      loadComentarios(topicoId);
    }
  }

  // Editar comentário
  async function handleEditComentario(comentarioId) {
    const { error } = await supabase
      .from('comentarios')
      .update({ texto: comentario })
      .eq('id', comentarioId);

    if (!error) {
      setEditingComentario(null);
      setComentario('');
    }
  }

  // Excluir comentário
  async function handleDeleteComentario(comentarioId, topicoId) {
    const { error } = await supabase.from('comentarios').delete().eq('id', comentarioId);
    if (!error) loadComentarios(topicoId);
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      {/* Barra de pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar títulos, descrições, categorias, comentários..."
        className="search-bar"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Filtro + Botões */}
      <div className="actions">
        <select
          value={selectedCategoria}
          onChange={e => setSelectedCategoria(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>

        <div>
          <button>+ Novo Tópico</button>
          <button>+ Nova Categoria</button>
          <button>Excluir Categoria</button>
        </div>
      </div>

      {/* Lista de tópicos */}
      {topicos
        .filter(t =>
          (!search ||
            t.titulo.toLowerCase().includes(search.toLowerCase()) ||
            t.descricao.toLowerCase().includes(search.toLowerCase()) ||
            t.categorias?.nome?.toLowerCase().includes(search.toLowerCase())) &&
          (!selectedCategoria || t.categoria_id === selectedCategoria)
        )
        .map(topico => (
          <div key={topico.id} className="topico-card">
            <div className="topico-header">
              <h2 className="topico-titulo">{topico.titulo}</h2>
              <span className="categoria-tag">{topico.categorias?.nome || 'Sem categoria'}</span>
            </div>
            <p>{topico.descricao}</p>

            {/* Comentários */}
            <div className="comentarios">
              <h3>Comentários</h3>
              <ul>
                {comentarios
                  .filter(c => c.topico_id === topico.id)
                  .map(c => (
                    <li key={c.id}>
                      <div>
                        <strong>{c.user_email || 'Usuário'}</strong> — {c.texto}
                      </div>
                      {c.imagem_url && (
                        <img src={c.imagem_url} alt="Comentário" style={{ maxWidth: '150px', marginTop: '5px' }} />
                      )}
                      <div className="comentario-input">
                        <button onClick={() => { setEditingComentario(c.id); setComentario(c.texto); }}>Editar</button>
                        <button onClick={() => handleDeleteComentario(c.id, topico.id)}>Excluir</button>
                      </div>
                    </li>
                  ))}
              </ul>

              {/* Campo para adicionar comentário */}
              <div className="comentario-input">
                <textarea
                  placeholder="Adicionar comentário..."
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                />
                <input
                  type="file"
                  onChange={e => setImagem(e.target.files[0])}
                />
                <button onClick={() => handleAddComentario(topico.id)}>Enviar</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
