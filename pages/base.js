// pages/base.js
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/router';

export default function Base() {
  const router = useRouter();

  const [topicos, setTopicos] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({}); // { topicoId: [comentarios] }
  const [novoComentario, setNovoComentario] = useState({});
  const [editandoComentario, setEditandoComentario] = useState({});
  const [sessionUser, setSessionUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      setSessionUser(data?.session?.user || null);
      await carregarDados();
      await carregarTodosComentarios();
    }
    init();
  }, []);

  async function carregarDados() {
    const { data: tops, error } = await supabase
      .from('topicos')
      .select('id, titulo, conteudo, categoria_id, categorias(nome), imagem_url');

    if (!error) {
      setTopicos(tops || []);
    } else {
      console.error('Erro ao carregar tópicos:', error);
    }
  }

  // Carrega todos os comentários de uma vez e organiza por topico_id
  async function carregarTodosComentarios() {
    const { data, error } = await supabase
      .from('comentarios')
      .select('id, conteudo, created_at, user_id, topico_id')
      .order('id', { ascending: true });

    if (!error) {
      const map = {};
      (data || []).forEach(c => {
        if (!map[c.topico_id]) map[c.topico_id] = [];
        map[c.topico_id].push(c);
      });
      setComentariosMap(map);
    } else {
      console.error('Erro ao carregar comentários:', error);
    }
  }

  async function carregarComentarios(topicoId) {
    // fallback: se já tem, não recarrega; caso precise forçar, chame carregarTodosComentarios
    if (comentariosMap[topicoId]) return;
    const { data, error } = await supabase
      .from('comentarios')
      .select('id, conteudo, created_at, user_id')
      .eq('topico_id', topicoId)
      .order('id', { ascending: true });

    if (!error) {
      setComentariosMap(prev => ({ ...prev, [topicoId]: data || [] }));
    } else {
      console.error('Erro ao carregar comentários:', error);
    }
  }

  async function salvarComentario(topicoId) {
    const conteudo = (novoComentario[topicoId] || '').trim();
    if (!conteudo) return;

    const userId = sessionUser?.id || null;

    const { data, error } = await supabase
      .from('comentarios')
      .insert({ conteudo, topico_id: topicoId, user_id: userId })
      .select();

    if (!error) {
      // atualiza mapa localmente
      setComentariosMap(prev => {
        const copy = { ...prev };
        copy[topicoId] = [...(copy[topicoId] || []), ...(data || [])];
        return copy;
      });
      setNovoComentario(prev => ({ ...prev, [topicoId]: '' }));
    } else {
      alert('Erro ao salvar comentário: ' + error.message);
    }
  }

  async function editarComentario(comentarioId, topicoId) {
    const novoTexto = (editandoComentario[comentarioId] || '').trim();
    if (!novoTexto) return alert('Comentário vazio');

    const { error } = await supabase
      .from('comentarios')
      .update({ conteudo: novoTexto })
      .eq('id', comentarioId);

    if (!error) {
      // atualizar localmente
      setComentariosMap(prev => {
        const copy = { ...prev };
        copy[topicoId] = (copy[topicoId] || []).map(c => (c.id === comentarioId ? { ...c, conteudo: novoTexto } : c));
        return copy;
      });
      setEditandoComentario(prev => {
        const copy = { ...prev };
        delete copy[comentarioId];
        return copy;
      });
    } else {
      alert('Erro ao editar comentário: ' + error.message);
    }
  }

  async function excluirComentario(comentarioId, topicoId) {
    if (!confirm('Confirma exclusão deste comentário?')) return;
    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', comentarioId);

    if (!error) {
      setComentariosMap(prev => {
        const copy = { ...prev };
        copy[topicoId] = (copy[topicoId] || []).filter(c => c.id !== comentarioId);
        return copy;
      });
    } else {
      alert('Erro ao excluir comentário: ' + error.message);
    }
  }

  async function uploadImagem(file, topicoId) {
    if (!file) return;
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const fileName = `topico-${topicoId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('imagens')
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

      if (!error && data?.path) {
        const publicUrl = supabase.storage.from('imagens').getPublicUrl(data.path).data.publicUrl;
        const { error: updateError } = await supabase
          .from('topicos')
          .update({ imagem_url: publicUrl })
          .eq('id', topicoId);

        if (updateError) {
          alert('Erro ao atualizar tópico com imagem: ' + updateError.message);
        } else {
          await carregarDados();
        }
      } else {
        alert('Erro ao enviar imagem: ' + (error?.message || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro ao comprimir/enviar imagem: ' + err.message);
    }
  }

  // Pesquisa: filtra tópicos por título, conteúdo, categoria ou comentários
  const filteredTopicos = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return topicos;
    return topicos.filter(top => {
      const inTitulo = (top.titulo || '').toLowerCase().includes(q);
      const inConteudo = (top.conteudo || '').toLowerCase().includes(q);
      const inCategoria = (top.categorias?.nome || '').toLowerCase().includes(q);
      const comentarios = comentariosMap[top.id] || [];
      const inComentarios = comentarios.some(c => (c.conteudo || '').toLowerCase().includes(q));
      return inTitulo || inConteudo || inCategoria || inComentarios;
    });
  }, [topicos, comentariosMap, searchTerm]);

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">Base de Conhecimento</h2>
          <div className="badge">{topicos.length} artigos</div>
        </div>

        <div className="card">
          <input
            type="text"
            placeholder="Pesquisar títulos, descrições, categorias, comentários..."
            className="search-bar"
            aria-label="Pesquisar base de conhecimento"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="actions" style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btnYellow"
              onClick={() => router.push('/nova-categoria')}
              aria-label="Nova Categoria"
            >
              + Nova Categoria
            </button>

            <button
              className="btn btnYellow"
              onClick={() => router.push('/novo-topico')}
              aria-label="Novo Tópico"
            >
              + Novo Tópico
            </button>

            <button
              className="btn btnDangerOutline"
              onClick={() => router.push('/excluir-categoria')}
              aria-label="Excluir Categoria"
            >
              - Excluir Categoria
            </button>
          </div>
        </div>

        <h3 style={{ marginTop: 20, marginBottom: 12, color: 'var(--yellow)' }}>Tópicos</h3>

        <div className="topicos-list">
          {filteredTopicos.map(top => (
            <div key={top.id} className="topico-card card" style={{ marginBottom: 16 }}>
              <div className="topico-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <h3 className="topico-titulo" style={{ margin: 0 }}>{top.titulo}</h3>
                <span className="categoria-tag" style={{ background: 'rgba(255,214,0,0.12)', color: 'var(--yellow)', padding: '6px 10px', borderRadius: 999, fontWeight: 700 }}>
                  {top.categorias?.nome || 'Sem categoria'}
                </span>
              </div>

              {top.conteudo && <p style={{ marginTop: 12 }}>{top.conteudo}</p>}

              {top.imagem_url && (
                <img
                  src={top.imagem_url}
                  alt="Imagem do tópico"
                  style={{ maxWidth: '320px', marginTop: 10, borderRadius: 8 }}
                />
              )}

              <div className="comentarios" style={{ marginTop: 14 }}>
                <h4 style={{ marginBottom: 8, color: 'var(--yellow)' }}>Comentários</h4>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {(comentariosMap[top.id] || []).map(com => (
                    <li key={com.id} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          {editandoComentario[com.id] !== undefined ? (
                            <>
                              <input
                                value={editandoComentario[com.id]}
                                onChange={(e) => setEditandoComentario(prev => ({ ...prev, [com.id]: e.target.value }))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #222', background: 'var(--bg-dark)', color: '#fff' }}
                              />
                              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <button className="btn btnYellow" onClick={() => editarComentario(com.id, top.id)}>Salvar</button>
                                <button className="btn" onClick={() => setEditandoComentario(prev => { const c = { ...prev }; delete c[com.id]; return c; })}>Cancelar</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ color: '#fff' }}>{com.conteudo}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                                {com.created_at ? new Date(com.created_at).toLocaleString() : ''}
                              </div>
                            </>
                          )}
                        </div>

                        {sessionUser && com.user_id === sessionUser.id && editandoComentario[com.id] === undefined && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="smallBtn approve" onClick={() => setEditandoComentario(prev => ({ ...prev, [com.id]: com.conteudo }))}>Editar</button>
                            <button className="smallBtn reject" onClick={() => excluirComentario(com.id, top.id)}>Excluir</button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="comentario-input" style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Adicionar comentário..."
                    value={novoComentario[top.id] || ''}
                    onChange={(e) =>
                      setNovoComentario(prev => ({ ...prev, [top.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        salvarComentario(top.id);
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      border: '1px solid #222',
                      padding: '0 12px',
                      background: 'var(--bg-dark)',
                      color: '#fff'
                    }}
                    aria-label={`Adicionar comentário para ${top.titulo}`}
                  />

                  <label className="clip-upload" title="Enviar imagem" style={{ cursor: 'pointer', fontSize: 20 }}>
                    📎
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) =>
                        uploadImagem(e.target.files[0], top.id)
                      }
                    />
                  </label>

                  <button
                    onClick={() => salvarComentario(top.id)}
                    className="btn btnYellow"
                    style={{ height: 44 }}
                    aria-label="Enviar comentário"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTopicos.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              Nenhum tópico encontrado.
            </div>
          )}
        </div>
      </div>
    </div>

await fetch('/api/comentarios/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conteudo: comentario,
    topico_id: topicoId,
    usuario_id: user.id // 👈 UUID do usuário logado
  })
});

  );
}
