// pages/base.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [comments, setComments] = useState([]);

  // Carregar tópicos e categorias
  useEffect(() => {
    async function loadData() {
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, title, description, category_id, categories(name)')
        .order('created_at', { ascending: false });

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setTopics(topicsData || []);
      setCategories(categoriesData || []);
    }
    loadData();
  }, []);

  // Carregar comentários
  async function loadComments(topicId) {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });
    setComments(data || []);
  }

  // Adicionar comentário
  async function handleAddComment(topicId) {
    if (!comment) return;

    const { error } = await supabase.from('comments').insert([
      {
        text: comment,
        topic_id: topicId,
        image_url: image ? image.name : null,
      },
    ]);

    if (!error) {
      setComment('');
      setImage(null);
      loadComments(topicId);
    }
  }

  // Editar comentário
  async function handleEditComment(commentId) {
    const { error } = await supabase
      .from('comments')
      .update({ text: comment })
      .eq('id', commentId);

    if (!error) {
      setEditingComment(null);
      setComment('');
      loadComments();
    }
  }

  // Excluir comentário
  async function handleDeleteComment(commentId, topicId) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) loadComments(topicId);
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
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div>
          <button>+ Novo Tópico</button>
          <button>+ Nova Categoria</button>
          <button>Excluir Categoria</button>
        </div>
      </div>

      {/* Lista de tópicos */}
      {topics
        .filter(t =>
          (!search ||
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.categories?.name?.toLowerCase().includes(search.toLowerCase())) &&
          (!selectedCategory || t.category_id === selectedCategory)
        )
        .map(topic => (
          <div key={topic.id} className="topico-card">
            <div className="topico-header">
              <h2 className="topico-titulo">{topic.title}</h2>
              <span className="categoria-tag">{topic.categories?.name || 'Sem categoria'}</span>
            </div>
            <p>{topic.description}</p>

            {/* Comentários */}
            <div className="comentarios">
              <h3>Comentários</h3>
              <ul>
                {comments
                  .filter(c => c.topic_id === topic.id)
                  .map(c => (
                    <li key={c.id}>
                      <div>
                        <strong>{c.user_email}</strong> — {c.text}
                      </div>
                      {c.image_url && <img src={c.image_url} alt="Comentário" style={{ maxWidth: '150px', marginTop: '5px' }} />}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setEditingComment(c.id); setComment(c.text); }}>Editar</button>
                        <button onClick={() => handleDeleteComment(c.id, topic.id)}>Excluir</button>
                      </div>
                    </li>
                  ))}
              </ul>

              {/* Campo para adicionar comentário */}
              <div className="comentario-input">
                <textarea
                  placeholder="Adicionar comentário..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <input
                  type="file"
                  onChange={e => setImage(e.target.files[0])}
                />
                <button onClick={() => handleAddComment(topic.id)}>Enviar</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
