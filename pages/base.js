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
  const [popup, setPopup] = useState(null);

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

    setUserRole(profile?.role || 'user');

    await loadData();
  }

  async function loadData() {
    const { data: cats } = await supabase.from('categorias').select('*');
    setCategorias(cats || []);

    const { data: tops } = await supabase
      .from('topicos')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: coms } = await supabase
      .from('comentarios')
      .select('*')
      .order('created_at', { ascending: false });

    const map = {};
    (coms || []).forEach(c => {
      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(c);
    });

    setComentariosMap(map);
    setTopicos(tops || []);
  }

  const isPrivileged = ['admin', 'supervisor'].includes(userRole);

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
  // CREATE COMMENT
  // =========================
  async function handleAddComment(topicoId) {
    const text = commentState[topicoId]?.text?.trim();
    if (!text) return;

    const { error } = await supabase.from('comentarios').insert({
      conteudo: text,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved: isPrivileged
    });

    if (error) return alert(error.message);

    setPopup(isPrivileged ? null : 'Comentário enviado para aprovação');

    await loadData();
  }

  // =========================
  // APPROVE COMMENT
  // =========================
  async function approveComment(id) {
    const { error } = await supabase
      .from('comentarios')
      .update({ approved: true })
      .eq('id', id);

    if (error) return alert(error.message);

    await loadData();
  }

  // =========================
  // DELETE COMMENT
  // =========================
  async function deleteComment(id) {
    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    if (error) return alert(error.message);

    await loadData();
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#111',
      color: '#fff'
    }}>

      {/* POPUP */}
      {popup && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#222',
          padding: 12,
          border: '1px solid #444',
          zIndex: 999
        }}>
          {popup}
          <button onClick={() => setPopup(null)}>X</button>
        </div>
      )}

      {/* LEFT CONTENT */}
      <div style={{ flex: 3, padding: 20 }}>

        {topicos.map(t => (
          <div key={t.id} style={{
            marginBottom: 25,
            padding: 15,
            border: '1px solid #333',
            borderRadius: 8
          }}>

            <h2>{t.titulo}</h2>

            {/* categoria dentro do tópico */}
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
              🏷 Categoria: {
                categorias.find(c => c.id === t.categoria_id)?.nome || 'Sem categoria'
              }
            </div>

            <p>{t.conteudo}</p>

            {/* COMMENTS */}
            {(comentariosMap[t.id] || [])
              .filter(c => isPrivileged ? true : c.approved)
              .map(c => {

                const canModerate = isPrivileged;
                const isOwner = user?.id === c.usuario_id;

                return (
                  <div key={c.id} style={{
                    marginTop: 10,
                    padding: 10,
                    background: '#222'
                  }}>

                    <b>{c.user_email || 'Anônimo'}</b>
                    <p>{c.conteudo}</p>

                    <small>
                      {c.approved ? 'Aprovado' : 'Pendente'}
                    </small>

                    <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>

                      {isOwner && !c.approved && (
                        <button
                          onClick={async () => {
                            const novo = prompt('Editar comentário:', c.conteudo);
                            if (novo) {
                              await supabase
                                .from('comentarios')
                                .update({ conteudo: novo })
                                .eq('id', c.id);
                              await loadData();
                            }
                          }}
                        >
                          Editar
                        </button>
                      )}

                      {canModerate && (
                        <>
                          <button onClick={() => approveComment(c.id)}>
                            Aprovar
                          </button>

                          <button onClick={() => deleteComment(c.id)}>
                            Excluir
                          </button>
                        </>
                      )}

                    </div>
                  </div>
                );
              })}

            {/* INPUT */}
            <div style={{ marginTop: 10 }}>
              <textarea
                style={{ width: '100%' }}
                onChange={(e) =>
                  setLocalComment(t.id, { text: e.target.value })
                }
                placeholder="Comentário..."
              />

              <button onClick={() => handleAddComment(t.id)}>
                Enviar
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{
        flex: 1,
        borderLeft: '1px solid #333',
        padding: 20
      }}>
        <h3>Categorias</h3>
        {categorias.map(c => (
          <div key={c.id}>{c.nome}</div>
        ))}
      </div>

    </div>
  );
}
