// pages/base.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [comment, setComment] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Carregar tópicos do Supabase
  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar tópicos:', error);
      } else {
        setTopics(data || []);
      }
    }
    loadTopics();
  }, []);

  // Adicionar comentário
  async function handleAddComment(e) {
    e.preventDefault();
    if (!comment || !selectedTopic) return;

    const { error } = await supabase
      .from('comments')
      .insert([{ text: comment, topic_id: selectedTopic }]);

    if (error) {
      console.error('Erro ao salvar comentário:', error);
    } else {
      setComment('');
      setSelectedTopic(null);
      alert('Comentário enviado com sucesso!');
    }
  }

  return (
    <div className="page container">
      <h1 className="topicTitle">Base de Conhecimento</h1>

      <div className="grid gap-4 mt-6">
        {topics.length === 0 ? (
          <p className="text-gray-400">Nenhum tópico encontrado.</p>
        ) : (
          topics.map(topic => (
            <div key={topic.id} className="card p-4 bg-gray-800 text-white rounded shadow">
              <h2 className="text-lg font-semibold">{topic.title}</h2>
              <p className="text-sm text-gray-300 mt-2">{topic.description}</p>

              {/* Botão para comentar */}
              <button
                className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded"
                onClick={() => setSelectedTopic(topic.id)}
              >
                Comentar
              </button>

              {/* Formulário de comentário */}
              {selectedTopic === topic.id && (
                <form onSubmit={handleAddComment} className="mt-3 flex flex-col gap-2">
                  <textarea
                    className="formInput"
                    placeholder="Escreva seu comentário..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <button type="submit" className="btn btnYellow">Enviar</button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
