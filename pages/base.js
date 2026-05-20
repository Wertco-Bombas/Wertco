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
        .select('role, username')
        .eq('id', session.user.id)
        .single();

      if (profile?.role) setUserRole(profile.role);
      if (profile?.username) {
        setUser(prev => ({
          ...prev,
          username: profile.username
        }));
      }
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
      map[c.topico_id].push(c);
    });

    setComentariosMap(map);
  }

  function canModerate() {
    return ['admin', 'supervisor'].includes(userRole);
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
  // CREATE COMMENT (APPROVAL)
  // =========================
  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();

    if (!text) return alert('Digite um comentário');

    const isPrivileged = canModerate();

    const { error } = await supabase.from('comentarios').insert({
      conteudo: text,
      topico_id: Number(topicoId),
      usuario_id: user?.id || null,
      user_email: user?.email || null,
      username: user?.username || user?.email,
      approved: isPrivileged
    });

    if (error) {
      alert(error.message);
      return;
    }

    // auditoria
    await supabase.from('auditoria').insert({
      acao: 'CRIAR_COMENTARIO',
      entidade: 'comentarios',
      usuario_id: user?.id,
      usuario_email: user?.email,
      status: isPrivileged ? 'approved' : 'pending'
    });

    setLocalComment(topicoId, { text: '' });
    await loadData();
  }

  // =========================
  // APPROVE COMMENT
  // =========================
  async function approveComment(id) {
    await supabase
      .from('comentarios')
      .update({ approved: true })
      .eq('id', id);

    await supabase.from('auditoria').insert({
      acao: 'APROVAR_COMENTARIO',
      entidade: 'comentarios',
      usuario_id: user?.id,
      usuario_email: user?.email,
      payload: { comment_id: id }
    });

    await loadData();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);

    await supabase.from('auditoria').insert({
      acao: 'EXCLUIR_COMENTARIO',
      entidade: 'comentarios',
      usuario_id: user?.id,
      usuario_email: user?.email,
      payload: { comment_id: id }
    });

    await loadData();
  }

  function logout() {
    supabase.auth.signOut();
    window.location.href = '/login';
  }

  // =========================
  // FILTER
  // =========================
  const isPrivileged = canModerate();

  const filteredTopicos = topicos
    .filter(t =>
      !search ||
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase())
    )
    .filter(t =>
      !selectedCategoria || String(t.categoria_id) === String(selectedCategoria)
    );

  return (
    <div className="base-container">

      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <h2>Wertco</h2>
        </div>

        <div className="topbar-right">
          <span className="user-email">
            {user?.username || user?.email}
          </span>

          <button onClick={() => window.location.href = '/dashboard'}>
            Menu
          </button>

          <button onClick={logout}>
            Sair
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="toolbar">
        <input
          className="search-bar"
          placeholder="Pesquisar..."
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
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TOPICOS */}
      <div className="content">

        {filteredTopicos.map(topico => {
          const state = commentState[topico.id] || [];

          const comentariosRaw = comentariosMap[topico.id] || [];

          const comentarios = isPrivileged
            ? comentariosRaw
            : comentariosRaw.filter(c => c.approved === true);

          return (
            <div key={topico.id} className="topico-card">

              <h2>{topico.titulo}</h2>

              <small>
                {topico.user_email} •{' '}
                {new Date(topico.created_at || Date.now()).toLocaleString()}
              </small>

              <p>{topico.descricao}</p>

              {/* COMENTÁRIOS */}
              <div className="comentarios">

                {comentarios.map(c => {
                  const isOwner = user?.id === c.usuario_id;

                  return (
                    <div key={c.id} style={{ marginBottom: 10 }}>

                      <strong>
                        {c.username || c.user_email || 'Anônimo'}
                      </strong>

                      <p>{c.conteudo}</p>

                      {!c.approved && isPrivileged && (
                        <button onClick={() => approveComment(c.id)}>
                          Aprovar
                        </button>
                      )}

                      {(isOwner || isPrivileged) && (
                        <button onClick={() => deleteComment(c.id)}>
                          Excluir
                        </button>
                      )}

                    </div>
                  );
                })}

                {/* INPUT */}
                <textarea
                  value={state.text || ''}
                  onChange={e =>
                    setLocalComment(topico.id, { text: e.target.value })
                  }
                  placeholder="Escreva um comentário..."
                />

                <button onClick={() => handleAddComment(topico.id)}>
                  Enviar
                </button>

              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}
