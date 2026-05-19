// pages/base.js
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from '../components/Layout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState({});
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
    carregarTopicos();
  }, []);

  async function carregarTopicos() {
    const { data, error } = await supabase
      .from('topicos')
      .select('id, titulo, descricao, categoria')
      .order('created_at', { ascending: false });

    if (!error) setTopicos(data);
  }

  async function carregarComentarios(topicoId) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId)
      .order('created_at', { ascending: false });

    if (!error) setComentarios((prev) => ({ ...prev, [topicoId]: data }));
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
        usuario_id: user?.id || null,
        usuario_nome: user?.email || 'Anônimo'
      })
    });

    const json = await resp.json();
    if (!resp.ok) {
      alert('Erro ao salvar comentário: ' + (json.error || resp.statusText));
    } else {
      setNovoComentario((prev) => ({ ...prev, [topicoId]: '' }));
      carregarComentarios(topicoId);
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Base de Conhecimento</h1>

        {/* Barra de pesquisa */}
        <input
          type="text"
          placeholder="Pesquisar títulos, descrições, categorias, comentários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-6 bg-gray-800 text-white"
        />

        {/* Lista de tópicos */}
        <h2 className="text-xl font-semibold mb-4">Tópicos</h2>
        <div className="space-y-6">
          {topicos
            .filter((t) =>
              [t.titulo, t.descricao, t.categoria].some((field) =>
                field?.toLowerCase().includes(search.toLowerCase())
              )
            )
            .map((t) => (
              <div key={t.id} className="border border-gray-700 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-yellow-400">{t.titulo}</span>
                  <span className="bg-yellow-400 text-black px-2 py-1 rounded text-sm">
                    {t.categoria}
                  </span>
                </div>
                <p className="text-gray-300 mb-3">{t.descricao}</p>

                {/* Comentários */}
                <h3 className="text-lg font-semibold mb-2">Comentários</h3>
                <ul className="space-y-2 mb-3">
                  {(comentarios[t.id] || []).map((c) => (
                    <li key={c.id} className="border-b border-gray-700 pb-1">
                      <strong>{c.usuario_nome || 'Anônimo'}:</strong> {c.conteudo}
                      <br />
                      <small className="text-gray-400">
                        {new Date(c.created_at).toLocaleString('pt-BR', {
                          timeZone: 'America/Sao_Paulo'
                        })}
                      </small>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar comentário..."
                    value={novoComentario[t.id] || ''}
                    onChange={(e) =>
                      setNovoComentario((prev) => ({ ...prev, [t.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') salvarComentario(t.id);
                    }}
                    className="flex-1 border rounded px-3 py-2 bg-gray-800 text-white"
                  />
                  <button
                    onClick={() => salvarComentario(t.id)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
}
