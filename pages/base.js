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

  // Adicionar comentário
  async function handleAddComment(topicId) {
    if (!comment) return;

    const { error } = await supabase.from('comments').insert([
      {
        text: comment,
        topic_id: topicId,
        image_url: image ? image.name : null, // simplificado
      },
    ]);

    if (error) {
      console.error('Erro ao salvar comentário:', error);
    } else {
      setComment('');
      setImage(null);
      alert('Comentário enviado com sucesso!');
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
      alert('Comentário atualizado!');
    }
  }

  // Excluir comentário
  async function handleDeleteComment(commentId) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) alert('Comentário excluído!');
  }

  return (
    <div className="page container">
      <h1 className="topicTitle">Base de Conhecimento</h1>

      {/* Barra de pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar tópicos..."
        className="formInput mt-4"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Filtro + Botões */}
      <div className="flex items-center justify-between mt-4">
        <select
          className="formInput"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div className="flex gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
            + Novo Tópico
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">
            + Nova Categoria
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">
            Excluir Categoria
          </button>
        </div>
      </div>

      {/* Lista de tópicos */}
      <div className="grid gap-4 mt-6">
        {topics
          .filter(t =>
            (!search || t.title.toLowerCase().includes(search.toLowerCase())) &&
            (!selectedCategory || t.category_id === selectedCategory)
          )
          .map(topic => (
            <div key={topic.id} className="card p-4 bg-gray-800 text-white rounded shadow">
              <h2 className="text-lg font-semibold">{topic.title}</h2>
              <p className="text-sm text-gray-300 mt-2">{topic.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Categoria: {topic.categories?.name || 'Sem categoria'}
              </p>

              {/* Comentários */}
              <div className="mt-4">
                <textarea
                  className="formInput"
                  placeholder="Escreva seu comentário..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <input
                  type="file"
                  className="formInput mt-2"
                  onChange={e => setImage(e.target.files[0])}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className="btn btnYellow"
                    onClick={() => handleAddComment(topic.id)}
                  >
                    Enviar
                  </button>
                  {editingComment && (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                      onClick={() => handleEditComment(editingComment)}
                    >
                      Salvar edição
                    </button>
                  )}
                </div>
              </div>

              {/* Exemplo de comentários renderizados */}
              <div className="mt-4">
                {/* Aqui você renderizaria os comentários do Supabase */}
                <p className="text-sm text-gray-400">Comentários aparecerão aqui...</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
