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

    await loadAll();
  }

  async function loadAll() {
    const { data: cats } = await supabase.from('categorias').select('*');
    setCategorias(cats || []);

    const { data: tops } = await supabase.from('topicos').select('*');

    const normalized = (tops || []).map(t => ({
      ...t,
      titulo: t.titulo || '',
      descricao: t.conteudo || '',
    }));

    setTopicos(normalized);

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
    return userRole === 'admin' || userRole === 'supervisor';
  }

  function setLocalComment(id, patch) {
    setCommentState(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch }
    }));
  }

  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();

    if (!text) return alert('Digite um comentário');

    await fetch('/api/comentarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo: text,
        topico_id: topicoId,
        usuario_id: user?.id,
        usuario_email: user?.email
      })
    });

    setLocalComment(topicoId, { text: '' });
    await loadAll();
  }

  function logout() {
    supabase.auth.signOut();
    window.location.href = '/login';
  }

  const filteredTopicos = topicos
    .filter(t =>
      !search ||
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase())
    )
    .filter(t =>
      !selectedCategoria || String(t.categoria_id) === selectedCategoria
    );

  return (
    <div style={{ padding: 20 }}>

      {/* TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{user?.email}</span>
          <button onClick={() => alert('menu')}>Menu</button>
          <button onClick={logout}>Sair</button>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ marginTop: 20 }}>
        <input
          style={{ width: '100%', padding: 10 }}
          placeholder="Pesquisar tudo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 15,
        alignItems: 'center'
      }}>

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
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.location.href = '/novo-topico'}>
              + Novo Tópico
            </button>
            <button onClick={() => window.location.href = '/nova-categoria'}>
              + Nova Categoria
            </button>
            <button onClick={() => alert('excluir categoria')}>
              Excluir Categoria
            </button>
          </div>
        )}
      </div>

      {/* TOPICOS */}
      <div style={{ marginTop: 30 }}>

        {filteredTopicos.map(t => {
          const comentarios = comentariosMap[t.id] || [];

          return (
            <div key={t.id} style={{
              border: '1px solid #444',
              padding: 15,
              marginBottom: 20
            }}>

              <h2>{t.titulo}</h2>

              <small>
                Categoria: {categorias.find(c => c.id === t.categoria_id)?.nome || 'N/A'} <br />
                Criado por: {t.user_email || 'desconhecido'} <br />
                Data: {new Date(t.created_at || Date.now()).toLocaleString()}
              </small>

              <p>{t.descricao}</p>

              {/* COMMENTS */}
              <div style={{ marginTop: 15 }}>
                <h4>Comentários</h4>

                {comentarios.map(c => (
                  <div key={c.id} style={{ marginBottom: 10 }}>
                    <strong>{c.user_email}</strong>

                    {canModerate() && !c.approved && (
                      <span style={{ marginLeft: 10, color: 'orange' }}>
                        (pendente)
                      </span>
                    )}

                    <p>{c.conteudo}</p>
                  </div>
                ))}

                {/* ADD COMMENT */}
                <textarea
                  style={{ width: '100%', marginTop: 10 }}
                  value={commentState[t.id]?.text || ''}
                  onChange={e => setLocalComment(t.id, { text: e.target.value })}
                />

                <button onClick={() => handleAddComment(t.id)}>
                  Comentar
                </button>
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
