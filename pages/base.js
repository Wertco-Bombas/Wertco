// pages/base.js
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from '../components/Layout';
import imageCompression from 'browser-image-compression';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [novoComentario, setNovoComentario] = useState({});
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState({}); // { [comentarioId]: true }
  const [editContent, setEditContent] = useState({}); // { [comentarioId]: '...' }

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

    if (!error && data) {
      setTopicos(data);
      data.forEach((t) => carregarComentarios(t.id));
    }
  }

  async function carregarComentarios(topicoId) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId)
      .order('created_at', { ascending: false });

    if (!error) {
      setComentarios((prev) => ({ ...prev, [topicoId]: data || [] }));
    }
  }

  async function salvarComentario(topicoId, file) {
    const conteudo = novoComentario[topicoId];
    if (!conteudo && !file) return;

    let imagem_base64 = null;
    if (file) {
      imagem_base64 = await compressAndConvertToBase64(file);
    }

    const resp = await fetch('/api/comentarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo,
        topico_id: topicoId,
        usuario_id: user?.id || null,
        usuario_email: user?.email || 'Anônimo',
        imagem_base64
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

  async function compressAndConvertToBase64(file) {
    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      return await fileToBase64(compressedFile);
    } catch (err) {
      console.error('Erro compressão imagem:', err);
      return null;
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async function handleEditSave(comentario) {
    const novoConteudo = editContent[comentario.id];
    if (!novoConteudo) return;

    const resp = await fetch('/api/comentarios/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: comentario.id,
        conteudo: novoConteudo,
        usuario_id: user?.id || null
      })
    });

    const json = await resp.json();
    if (!resp.ok) {
      alert('Erro ao editar comentário: ' + (json.error || resp.statusText));
    } else {
      setEditing((prev) => ({ ...prev, [comentario.id]: false }));
      carregarComentarios(comentario.topico_id);
    }
  }

  async function handleDelete(comentario) {
    if (!confirm('Confirma exclusão do comentário?')) return;

    const resp = await fetch('/api/comentarios/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: comentario.id,
        usuario_id: user?.id || null
      })
    });

    const json = await resp.json();
    if (!resp.ok) {
      alert('Erro ao excluir comentário: ' + (json.error || resp.statusText));
    } else {
      carregarComentarios(comentario.topico_id);
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Base de Conhecimento</h1>

        {/* Busca */}
        <input
          type="text"
          placeholder="Pesquisar títulos, descrições, categorias, comentários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 bg-gray-800 text-white"
        />

        {/* Botões abaixo da busca */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => (window.location.href = '/novo-topico')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold"
          >
            + Novo Tópico
          </button>
          <button
            onClick={() => (window.location.href = '/nova-categoria')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold"
          >
            + Nova Categoria
          </button>
          <button
            onClick={() => (window.location.href = '/excluir-categoria')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            - Excluir Categoria
          </button>
        </div>

        {/* Lista de tópicos */}
        <h2 className="text-xl font-semibold mb-4">Tópicos</h2>
        <div className="space-y-6">
          {topicos
            .filter((t) =>
              [t.titulo, t.descricao, t.categoria]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())
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
                    <li key={c.id} className="border-b border-gray-700 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>{c.usuario_email || c.usuario_id || 'Anônimo'}:</strong>{' '}
                          {!editing[c.id] ? (
                            <span>{c.conteudo}</span>
                          ) : (
                            <input
                              type="text"
                              value={editContent[c.id] ?? c.conteudo}
                              onChange={(e) =>
                                setEditContent((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              className="border rounded px-2 py-1 bg-gray-800 text-white"
                            />
                          )}
                          <br />
                          <small className="text-gray-400">
                            {new Date(c.created_at).toLocaleString('pt-BR', {
                              timeZone: 'America/Sao_Paulo'
                            })}
                          </small>
                          {c.imagem_base64 && (
                            <div className="mt-2">
                              <img
                                src={c.imagem_base64}
                                alt="anexo"
                                className="max-w-xs rounded border"
                              />
                            </div>
                          )}
                        </div>

                        {/* Ações: editar/excluir apenas para autor */}
                        {user?.id && c.usuario_id === user.id && (
                          <div className="flex flex-col gap-2 ml-4">
                            {!editing[c.id] ? (
                              <>
                                <button
                                  onClick={() =>
                                    setEditing((prev) => ({ ...prev, [c.id]: true })) ||
                                    setEditContent((prev) => ({ ...prev, [c.id]: c.conteudo }))
                                  }
                                  className="text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(c)}
                                  className="text-sm bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                                >
                                  Excluir
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditSave(c)}
                                  className="text-sm bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() =>
                                    setEditing((prev) => ({ ...prev, [c.id]: false }))
                                  }
                                  className="text-sm bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Novo comentário com upload de imagem */}
                <div className="flex gap-2 items-center">
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
                  <input
                    type="file"
                    accept="image/*"
                    id={`file-${t.id}`}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      // store temporarily in novoComentarioFile
                      setNovoComentario((prev) => ({ ...prev, [`file-${t.id}`]: file }));
                    }}
                  />
                  <label
                    htmlFor={`file-${t.id}`}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded cursor-pointer"
                  >
                    Anexar
                  </label>
                  <button
                    onClick={() => salvarComentario(t.id, novoComentario[`file-${t.id}`])}
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
