import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isPrivileged } from '../lib/auth';

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});
  const [commentState, setCommentState] = useState({});
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loadingRole, setLoadingRole] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session?.user) return;

    setUser({
      id: session.user.id,
      email: session.user.email
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role || 'user';
    setUserRole(role);
    setLoadingRole(false);

    await loadData();
  }

  async function loadData() {
    const { data: cats } = await supabase.from('categorias').select('*');
    setCategorias(cats || []);

    const { data: tops } = await supabase.from('topicos').select('*');
    setTopicos(tops || []);

    const { data: coms } = await supabase.from('comentarios').select('*');

    const map = {};
    (coms || []).forEach(c => {
      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(c);
    });

    setComentariosMap(map);
  }

  function setLocalComment(topicoId, patch) {
    setCommentState(prev => ({
      ...prev,
      [topicoId]: {
        ...(prev[topicoId] || {}),
        ...patch
      }
    }));
  }

  // =========================
  // CREATE COMMENT
  // =========================
  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();

    if (!text) return alert('Digite um comentário');

    const approved = isPrivileged(userRole);

    const { error } = await supabase.from('comentarios').insert({
      conteudo: text,
      topico_id: Number(topicoId),
      usuario_id: user?.id,
      user_email: user?.email,
      approved
    });

    if (error) return alert(error.message);

    setLocalComment(topicoId, { text: '' });
    await loadData();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);

    await supabase.from('auditoria').insert({
      acao: 'DELETE_COMMENT',
      entidade: 'comentarios',
      usuario_email: user?.email,
      payload: { id }
    });

    await loadData();
  }

  function canModerate() {
    return isPrivileged(userRole);
  }

  const filteredTopicos = topicos.filter(t => {
    const matchSearch =
      !search ||
      t.titulo?.toLowerCase().includes(search.toLowerCase());

    const matchCat =
      !selectedCategoria || String(t.categoria_id) === selectedCategoria;

    return matchSearch && matchCat;
  });

  if (loadingRole) return <div>Carregando...</div>;

  return (
    <div className="base-container">

      <div className="topbar">
        <h2>Wertco</h2>

        <div>
          {user?.email}
          <button onClick={() => window.location.href = '/dashboard'}>
            Menu
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Pesquisar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div>
        {filteredTopicos.map(topico => {
          const comentariosRaw = comentariosMap[topico.id] || [];

          const comentarios = canModerate()
            ? comentariosRaw
            : comentariosRaw.filter(c => c.approved);

          return (
            <div key={topico.id} className="topico-card">

              <h3>{topico.titulo}</h3>

              <p>{topico.conteudo}</p>

              <div>
                {comentarios.map(c => (
                  <div key={c.id}>
                    <strong>{c.user_email}</strong>
                    <p>{c.conteudo}</p>

                    {canModerate() && !c.approved && (
                      <button
                        onClick={async () => {
                          await supabase
                            .from('comentarios')
                            .update({ approved: true })
                            .eq('id', c.id);

                          await supabase.from('auditoria').insert({
                            acao: 'APPROVE_COMMENT',
                            entidade: 'comentarios',
                            usuario_email: user?.email,
                            payload: { id: c.id }
                          });

                          await loadData();
                        }}
                      >
                        Aprovar
                      </button>
                    )}

                    <button onClick={() => deleteComment(c.id)}>
                      Excluir
                    </button>
                  </div>
                ))}

                <textarea
                  onChange={e =>
                    setLocalComment(topico.id, { text: e.target.value })
                  }
                  value={commentState[topico.id]?.text || ''}
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
