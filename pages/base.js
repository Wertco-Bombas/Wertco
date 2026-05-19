// pages/base.js
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from '../components/Layout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Base() {
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState({});
  const [user, setUser] = useState(null);

  const topicoId = 11; // ajuste conforme o ID real do tópico

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
    carregarComentarios();
  }, []);

  async function carregarComentarios() {
    const { data, error } = await supabase
      .from('comentarios')
      .select(`
        id,
        conteudo,
        created_at,
        usuario_id,
        profiles ( nome )
      `) // traz o nome do usuário da tabela profiles
      .eq('topico_id', topicoId)
      .order('created_at', { ascending: false });

    if (!error) setComentarios(data);
  }

  async function salvarComentario(topicoId) {
    const conteudo = novoComentario[topicoId];
    if (!conteudo) return;

    const resp = await fetch('/api/comentarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo,
        topico_id: topicoId,
        usuario_id: user?.id || null
      })
    });

    const json = await resp.json();
    if (!resp.ok) {
      alert('Erro ao salvar comentário: ' + (json.error || resp.statusText));
    } else {
      setNovoComentario((prev) => ({ ...prev, [topicoId]: '' }));
      carregarComentarios();
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Base de Conhecimento</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Adicionar comentário..."
            value={novoComentario[topicoId] || ''}
            onChange={(e) =>
              setNovoComentario((prev) => ({ ...prev, [topicoId]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                salvarComentario(topicoId);
              }
            }}
            className="flex-1 border rounded px-3 py-2 bg-gray-800 text-white"
          />
          <button
            onClick={() => salvarComentario(topicoId)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Enviar
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Comentários</h2>
        <ul className="space-y-3">
          {comentarios.map((c) => (
            <li key={c.id} className="border-b border-gray-700 pb-2">
              <strong>{c.profiles?.nome || 'Anônimo'}:</strong> {c.conteudo}
              <br />
              <small className="text-gray-400">
                {new Date(c.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </small>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
