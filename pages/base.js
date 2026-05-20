// pages/base.js

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});
  const [commentState, setCommentState] = useState({});
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role) setUserRole(profile.role);
    }

    await loadData();
  }

  async function loadData() {
    const { data: cats } = await supabase.from('categorias').select('*');
    setCategorias(cats || []);

    const { data: tops } = await supabase.from('topicos').select('*');

    const normalizedTopicos = (tops || []).map(t => ({
      ...t,
      titulo: t.titulo || '',
      descricao: t.conteudo || '',
      approved: t.approved ?? true
    }));

    setTopicos(normalizedTopicos);

    const ids = (tops || []).map(t => t.id);

    const { data: coms } = await supabase
      .from('comentarios')
      .select('*')
      .in('topico_id', ids);

    const map = {};

    (coms || []).forEach(c => {
      if (!map[c.topico_id]) map[c.topico_id] = [];

      map[c.topico_id].push({
        id: c.id,
        conteudo: c.conteudo,
        usuario_id: c.usuario_id,
        usuario_email: c.usuario_email || c.user_email || 'Anônimo',
        created_at: c.created_at,
        approved: c.approved ?? true
      });
    });

    setComentariosMap(map);
  }

  function canModerate() {
    return userRole === 'admin' || userRole === 'supervisor';
  }

  function setLocalComment(topicoId, patch) {
    setCommentState(prev => ({
      ...prev,
      [topicoId]: {
        ...(prev[topicoId] || { text: '' }),
        ...patch
      }
    }));
  }

  // =========================
  // INSERT CORRIGIDO
  // =========================
  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();

    if (!text) return alert('Digite um comentário');

    try {
      const { error } = await supabase.from('comentarios').insert({
        conteudo: text,
        topico_id: Number(topicoId),
        usuario_id: user?.id || null,
        usuario_email: user?.email || null,
        approved: false
      });

      if (error) {
        alert(error.message);
        return;
      }

      setLocalComment(topicoId, { text: '' });
      await loadData();

    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar comentário');
    }
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    await loadData();
  }

  async function saveEditComment(topicoId) {
    const state = commentState[topicoId];

    if (!state?.editingId) return;

    await supabase
      .from('comentarios')
      .update({ conteudo: state.text })
      .eq('id', state.editingId);

    setLocalComment(topicoId, { text: '', editingId: null });
    await loadData();
  }

  function startEditComment(topicoId, comment) {
    setLocalComment(topicoId, {
      text: comment.conteudo,
      editingId: comment.id
    });
  }

  function logout() {
    supabase.auth.signOut();
    window.location.href = '/login';
  }

  const isPrivileged = ['admin', 'supervisor'].includes(userRole);

  const filteredTopicos = topicos
    .filter(t =>
      !search ||
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase())
    )
    .filter(t =>
      !selectedCategoria || String(t.categoria_id) === String(selectedCategoria)
    )
    .filter(t =>
      isPrivileged ? true : t.approved === true
    );

  return (
    <div className="base-container">

      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <h2>Wertco</h2>
        </div>

        <div className="topbar-right">
          <span className="user-email">{user?.email}</span>

          <button onClick={() => window.location.href = '/dashboard'}>
            Menu
          </button>

          <button onClick={logout}>
            Sair
          </button>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="toolbar">

        <input
          className="search-bar"
          placeholder="Pesquisar tópicos, comentários, categorias..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="toolbar-row">

          <select
            value={selectedCategoria}
            onChange={e => setSelectedCategoria(e.target.value)}
          >
            <option value="">Todas categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {canModerate() && (
            <div className="toolbar-buttons">
              <button onClick={() => window.location.href = '/novo-topico'}>
                + Novo Tópico
              </button>
              <button onClick={() => window.location.href = '/nova-categoria'}>
                + Nova Categoria
              </button>
            </div>
          )}

        </div>
      </div>

      {/* TOPICOS */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {filteredTopicos.map(topico => {
          const state = commentState[topico.id] || {};

          const comentarios = (comentariosMap[topico.id] || []).filter(c =>
            isPrivileged ? true : c.approved === true
          );

          return (
            <div key={topico.id} className="topico-card">

              <div className="topico-header">
                <h2 className="topico-titulo">{topico.titulo}</h2>

                <span className="categoria-tag">
                  {categorias.find(c => c.id === topico.categoria_id)?.nome || 'Sem categoria'}
                </span>
              </div>

              <small style={{ color: '#aaa' }}>
                {topico.user_email || 'Autor desconhecido'} •{' '}
                {new Date(topico.created_at || Date.now()).toLocaleString()}
              </small>

              <p style={{ marginTop: 10 }}>{topico.descricao}</p>

              {/* COMENTÁRIOS */}
              <div className="comentarios">

                <h3>Comentários</h3>

                {comentarios.map(c => {
                  const isOwner = user?.id === c.usuario_id;

                  return (
                    <div key={c.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #333' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{c.usuario_email}</strong>

                        <span style={{ fontSize: 11, color: '#888' }}>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString()
                            : 'sem data'}
                        </span>
                      </div>

                      <p style={{ marginTop: 5 }}>{c.conteudo}</p>

                      {isOwner && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button onClick={() => startEditComment(topico.id, c)}>
                            Editar
                          </button>

                          <button onClick={() => deleteComment(c.id)}>
                            Excluir
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* INPUT */}
                <div className="comentario-input">

                  <textarea
                    value={state.text || ''}
                    onChange={e =>
                      setLocalComment(topico.id, { text: e.target.value })
                    }
                    placeholder="Escreva um comentário..."
                  />

                  <button className="btn btnYellow" onClick={() => handleAddComment(topico.id)}>
                    Enviar
                  </button>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
