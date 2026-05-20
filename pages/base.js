// pages/base.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [comentariosMap, setComentariosMap] = useState({}); // { topicoId: [comentarios] }
  const [commentState, setCommentState] = useState({}); // { [topicoId]: { text, imageFile, editingId } }
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) setUser({ id: session.user.id, email: session.user.email });
      else setUser(null);

      await loadCategorias();
      await loadTopicosAndComments();
    }
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email });
      else setUser(null);
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  async function loadCategorias() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategorias([]);
      return;
    }
    setCategorias(data || []);
  }

// Função segura para carregar comentários (substitua a versão atual)
async function loadTopicosAndComments() {
  // carrega tópicos (já mapeados para titulo/conteudo no código anterior)
  const { data: topicosData, error: tError } = await supabase
    .from('topicos')
    .select('*');

  if (tError) {
    console.error('Erro ao carregar tópicos (safe):', tError);
    setTopicos([]);
    setComentariosMap({});
    return;
  }

  // normaliza topicos (usa conteudo como descricao)
  const normalizedTopicos = (topicosData || []).map(t => ({
    id: t.id,
    titulo: t.titulo || t.title || '',
    descricao: t.conteudo || t.descricao || t.body || '',
    categoria_id: t.categoria_id || null,
    imagem_url: t.imagem_url || null,
    raw: t,
  }));
  // ordena localmente por id desc
  normalizedTopicos.sort((a, b) => (b.id || 0) - (a.id || 0));
  setTopicos(normalizedTopicos);

  // carrega comentários com select('*') e normaliza campos
  const ids = (topicosData || []).map(t => t.id);
  if (!ids.length) {
    setComentariosMap({});
    return;
  }

  const { data: comentariosData, error: cError } = await supabase
    .from('comentarios')
    .select('*')
    .in('topico_id', ids);

  if (cError) {
    console.error('Erro ao carregar comentários (safe):', cError);
    setComentariosMap({});
    return;
  }

  // normaliza cada comentário para os campos que o front usa
  const map = {};
  (comentariosData || []).forEach(c => {
    // detecta o campo de texto
    const texto = c.texto ?? c.conteudo ?? c.mensagem ?? c.comment ?? c.body ?? c.text ?? null;
    // detecta o campo de imagem
    const imageUrl = c.image_url ?? c.imagem_url ?? c.foto_url ?? c.url ?? null;
    // detecta topico_id (tenta variações)
    const topicoId = c.topico_id ?? c.topic_id ?? c.topico ?? null;
    // detecta user email
    const userEmail = c.user_email ?? c.email ?? c.usuario_email ?? null;
    // detecta created_at
    const createdAt = c.created_at ?? c.criado_em ?? c.created ?? null;

    const normalizedComment = {
      id: c.id,
      texto,
      image_url: imageUrl,
      topico_id: topicoId,
      user_id: c.user_id ?? c.usuario_id ?? null,
      user_email: userEmail,
      created_at: createdAt,
      raw: c,
    };

    if (!map[topicoId]) map[topicoId] = [];
    map[topicoId].push(normalizedComment);
  });

  // opcional: ordenar comentários por created_at se existir, senão por id
  Object.keys(map).forEach(k => {
    map[k].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : a.id || 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : b.id || 0;
      return ta - tb;
    });
  });

  setComentariosMap(map);
}


  // Upload de imagem para bucket 'comentarios'
  async function uploadImage(file) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = fileName;

    const { error: uploadError } = await supabase.storage
      .from('comentarios')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Erro ao enviar imagem:', uploadError);
      return null;
    }

    const { publicURL } = supabase.storage.from('comentarios').getPublicUrl(path);
    return publicURL;
  }

  // Helpers para estado local de comentário por tópico
  function setLocalComment(topicoId, patch) {
    setCommentState(prev => ({
      ...prev,
      [topicoId]: { ...(prev[topicoId] || { text: '', imageFile: null, editingId: null }), ...patch },
    }));
  }

  // Adicionar comentário
  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || { text: '', imageFile: null };
    const text = (state.text || '').trim();
    if (!text) return alert('Escreva um comentário antes de enviar.');

    let imageUrl = null;
    if (state.imageFile) {
      imageUrl = await uploadImage(state.imageFile);
    }

    const payload = {
      texto: text,
      topico_id: topicoId,
      user_id: user?.id || null,
      user_email: user?.email || null,
      image_url: imageUrl,
    };

    const { error } = await supabase.from('comentarios').insert([payload]);
    if (error) {
      console.error('Erro ao salvar comentário:', error);
      alert('Erro ao salvar comentário.');
      return;
    }

    // limpar estado local e recarregar
    setLocalComment(topicoId, { text: '', imageFile: null });
    await loadTopicosAndComments();
  }

  // Iniciar edição
  function startEditComment(topicoId, comentario) {
    setLocalComment(topicoId, { text: comentario.texto || '', imageFile: null, editingId: comentario.id });
  }

  // Salvar edição
  async function saveEditComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();
    if (!text) return alert('Escreva o comentário antes de salvar.');

    const { error } = await supabase
      .from('comentarios')
      .update({ texto: text })
      .eq('id', state.editingId);

    if (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Erro ao editar comentário.');
      return;
    }

    setLocalComment(topicoId, { text: '', imageFile: null, editingId: null });
    await loadTopicosAndComments();
  }

  // Excluir comentário
  async function deleteComment(commentId, topicoId) {
    const ok = confirm('Deseja realmente excluir este comentário?');
    if (!ok) return;

    const { error } = await supabase.from('comentarios').delete().eq('id', commentId);
    if (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário.');
      return;
    }
    await loadTopicosAndComments();
  }

  // Busca combinada (título, descrição, categoria, comentários, email)
  function matchesSearch(topico) {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const inTitle = (topico.titulo || '').toLowerCase().includes(q);
    const inDesc = (topico.descricao || '').toLowerCase().includes(q);
    const inCat = (topico.categorias?.nome || '').toLowerCase().includes(q);
    const inComments = (comentariosMap[topico.id] || []).some(c =>
      (c.texto || '').toLowerCase().includes(q) ||
      (c.user_email || '').toLowerCase().includes(q)
    );
    return inTitle || inDesc || inCat || inComments;
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      <input
        type="text"
        placeholder="Pesquisar títulos, descrições, categorias, comentários e nomes de usuário..."
        className="search-bar"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="actions" role="region" aria-label="Filtros e ações">
        <select
          value={selectedCategoria}
          onChange={e => setSelectedCategoria(e.target.value)}
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>

        <div>
          <button onClick={() => window.location.href = '/novo-topico'}>+ Novo Tópico</button>
          <button onClick={() => window.location.href = '/nova-categoria'}>+ Nova Categoria</button>
          <button onClick={() => window.location.href = '/excluir-categoria'}>Excluir Categoria</button>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {topicos
          .filter(t => matchesSearch(t) && (!selectedCategoria || String(t.categoria_id) === String(selectedCategoria)))
          .map(topico => {
            const state = commentState[topico.id] || { text: '', imageFile: null, editingId: null };
            const comentarios = comentariosMap[topico.id] || [];

            return (
              <div key={topico.id} className="topico-card">
                <div className="topico-header">
                  <h2 className="topico-titulo">{topico.titulo}</h2>
                  <span className="categoria-tag">{topico.categorias?.nome || 'Sem categoria'}</span>
                </div>

                <p style={{ marginTop: 8, color: '#ddd' }}>{topico.descricao}</p>

                <div className="comentarios" style={{ textAlign: 'left' }}>
                  <h3 style={{ color: '#ffd700' }}>Comentários</h3>

                  <ul>
                    {comentarios.length === 0 && <li style={{ background: 'transparent', color: '#999' }}>Sem comentários.</li>}

                    {comentarios.map(c => (
                      <li key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 13, color: '#ffd700' }}>
                            <strong>{c.user_email || 'Anônimo'}</strong>
                            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </div>

                          {user?.id && c.user_id === user.id && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="actions-button" onClick={() => startEditComment(topico.id, c)}>Editar</button>
                              <button className="actions-button" onClick={() => deleteComment(c.id, topico.id)}>Excluir</button>
                            </div>
                          )}
                        </div>

                        <div style={{ color: '#ddd' }}>{c.texto}</div>

                        {c.image_url && (
                          <img src={c.image_url} alt="Comentário" style={{ maxWidth: 300, borderRadius: 6 }} />
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Campo para adicionar / editar comentário (estado por tópico) */}
                  <div className="comentario-input" style={{ marginTop: 12 }}>
                    <textarea
                      placeholder="Adicionar comentário..."
                      value={state.text}
                      onChange={e => setLocalComment(topico.id, { text: e.target.value })}
                      rows={3}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setLocalComment(topico.id, { imageFile: e.target.files[0] })}
                    />

                    {state.editingId ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btnYellow" onClick={() => saveEditComment(topico.id)}>Salvar</button>
                        <button className="btn btnDangerOutline" onClick={() => setLocalComment(topico.id, { text: '', imageFile: null, editingId: null })}>Cancelar</button>
                      </div>
                    ) : (
                      <button className="btn btnYellow" onClick={() => handleAddComment(topico.id)}>Enviar</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <p style={{ marginTop: 20, color: '#777', fontSize: 12 }}>Protótipo local — dados salvos no Supabase / Storage.</p>
    </div>
  );
}
