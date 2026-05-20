import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/audit';

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
      .select('role, username')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'user');

    await loadData();
  }

  async function loadData() {
    const { data: cats } = await supabase.from('categorias').select('*');
    setCategorias(cats || []);

    const { data: tops } = await supabase.from('topicos').select('*');

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

    const approved = isPrivileged;

    const { error } = await supabase.from('comentarios').insert({
      conteudo: text,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved
    });

    if (error) return alert(error.message);

    await logAction({
      acao: 'CREATE_COMMENT',
      entidade: 'comentarios',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { topicoId, text }
    });

    if (!approved) {
      setPopup('Comentário enviado para aprovação');
    }

    await loadData();
  }

  // =========================
  // APPROVE
  // =========================
  async function approveComment(id) {
    const { error } = await supabase
      .from('comentarios')
      .update({ approved: true })
      .eq('id', id);

    if (error) return alert(error.message);

    await logAction({
      acao: 'APPROVE_COMMENT',
      entidade: 'comentarios',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { commentId: id }
    });

    await loadData();
  }

  // =========================
  // DELETE
  // =========================
  async function deleteComment(id) {
    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    if (error) return alert(error.message);

    await logAction({
      acao: 'DELETE_COMMENT',
      entidade: 'comentarios',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { commentId: id }
    });

    await loadData();
  }

  // =========================
  // EDIT
  // =========================
  async function editComment(id, text) {
    const { error } = await supabase
      .from('comentarios')
      .update({ conteudo: text })
      .eq('id', id);

    if (error) return alert(error.message);

    await logAction({
      acao: 'EDIT_COMMENT',
      entidade: 'comentarios',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { commentId: id, text }
    });

    await loadData();
  }

  return (
    <div style={{ display: 'flex', padding: 20, gap: 20 }}>

      {/* POPUP */}
      {popup && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#222',
          padding: 12,
          color: '#fff',
          borderRadius: 8
        }}>
          {popup}
          <button onClick={() => setPopup(null)}>X</button>
        </div>
      )}

      {/* LEFT */}
      <div style={{ width: '70%' }}>

        {topicos.map(t => (
          <div key={t.id} style={{
            marginBottom: 30,
            padding: 20,
            border: '1px solid #333',
            borderRadius: 8
          }}>

            <h3>{t.titulo}</h3>
            <p>{t.conteudo}</p>

            {(comentariosMap[t.id] || [])
              .filter(c => isPrivileged ? true : c.approved)
              .map(c => {

                const canEdit = user?.id === c.usuario_id && !c.approved;

                return (
                  <div key={c.id} style={{
                    marginTop: 10,
                    padding: 10,
                    background: '#1f1f1f',
                    borderRadius: 6
                  }}>

                    <b>
                      {c.username || c.user_email || 'Usuário'}
                    </b>

                    <p>{c.conteudo}</p>

                    <small>
                      {c.approved ? 'Aprovado' : 'Pendente'}
                    </small>

                    <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>

                      {canEdit && (
                        <button onClick={() => {
                          const novo = prompt('Editar comentário', c.conteudo);
                          if (novo) editComment(c.id, novo);
                        }}>
                          Editar
                        </button>
                      )}

                      {isPrivileged && (
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
                style={{ width: '100%', minHeight: 60 }}
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

      {/* RIGHT */}
      <div style={{ width: '30%', borderLeft: '1px solid #333', paddingLeft: 10 }}>
        <h4>Categorias</h4>
        {categorias.map(c => (
          <div key={c.id}>{c.nome}</div>
        ))}
      </div>

    </div>
  );
}
