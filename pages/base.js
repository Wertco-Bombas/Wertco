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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  // =========================
  // INIT
  // =========================
  async function init() {

    try {

      const { data, error } = await supabase.auth.getSession();

      console.log('SESSION:', data, error);

      const session = data?.session;

      // usuário logado
      if (session?.user) {

        setUser({
          id: session.user.id,
          email: session.user.email
        });

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log('PROFILE:', profile, profileError);

        setUserRole(profile?.role || 'user');
      }

      // carrega dados mesmo sem login
      await loadData();

    } catch (err) {

      console.error('INIT ERROR:', err);

    } finally {

      setLoading(false);
    }
  }

  // =========================
  // LOAD DATA
  // =========================
  async function loadData() {

    try {

      // categorias
      const {
        data: cats,
        error: catsError
      } = await supabase
        .from('categorias')
        .select('*');

      console.log('CATEGORIAS:', cats, catsError);

      // topicos
      const {
        data: tops,
        error: topsError
      } = await supabase
        .from('topicos')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('TOPICOS:', tops, topsError);

      // comentarios
      const {
        data: coms,
        error: comsError
      } = await supabase
        .from('comentarios')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('COMENTARIOS:', coms, comsError);

      // cria mapa
      const map = {};

      (coms || []).forEach(c => {

        if (!map[c.topico_id]) {
          map[c.topico_id] = [];
        }

        map[c.topico_id].push(c);
      });

      setCategorias(cats || []);
      setTopicos(tops || []);
      setComentariosMap(map);

    } catch (err) {

      console.error('LOAD DATA ERROR:', err);
    }
  }

  // =========================
  // PERMISSÃO
  // =========================
  const isPrivileged =
    ['admin', 'supervisor'].includes(userRole);

  // =========================
  // LOCAL COMMENT
  // =========================
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
  // ADD COMMENT
  // =========================
  async function handleAddComment(topicoId) {

    if (!user) {
      return alert('Faça login');
    }

    const text =
      commentState[topicoId]?.text?.trim();

    if (!text) {
      return alert('Digite um comentário');
    }

    const { error } = await supabase
      .from('comentarios')
      .insert({
        conteudo: text,
        topico_id: topicoId,
        usuario_id: user.id,
        user_email: user.email,
        approved: isPrivileged
      });

    if (error) {

      console.error(error);
      return alert(error.message);
    }

    setPopup(
      isPrivileged
        ? 'Comentário publicado'
        : 'Comentário enviado para aprovação'
    );

    setLocalComment(topicoId, { text: '' });

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

    if (error) {

      console.error(error);
      return alert(error.message);
    }

    await loadData();
  }

  // =========================
  // DELETE COMMENT
  // =========================
  async function deleteComment(id) {

    const confirmDelete =
      confirm('Excluir comentário?');

    if (!confirmDelete) return;

    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    if (error) {

      console.error(error);
      return alert(error.message);
    }

    await loadData();
  }

  // =========================
  // DEBUG
  // =========================
  console.log({
    user,
    userRole,
    topicos,
    categorias,
    comentariosMap
  });

  // =========================
  // LOADING
  // =========================
  if (loading) {

    return (
      <div style={{
        minHeight: '100vh',
        background: '#111',
        color: '#fff',
        padding: 40
      }}>
        Carregando...
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================
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
          zIndex: 999,
          borderRadius: 8
        }}>

          {popup}

          <button
            onClick={() => setPopup(null)}
            style={{
              marginLeft: 10
            }}
          >
            X
          </button>

        </div>
      )}

      {/* LEFT */}
      <div style={{
        flex: 3,
        padding: 20
      }}>

        <h1>Base de Conhecimento</h1>

        {topicos.length === 0 && (

          <div style={{
            marginTop: 20,
            color: '#999'
          }}>
            Nenhum tópico encontrado
          </div>
        )}

        {topicos.map(t => (

          <div
            key={t.id}
            style={{
              marginBottom: 25,
              padding: 15,
              border: '1px solid #333',
              borderRadius: 8
            }}
          >

            <h2>{t.titulo}</h2>

            {/* categoria */}
            <div style={{
              fontSize: 12,
              color: '#aaa',
              marginBottom: 10
            }}>
              🏷 Categoria:{' '}
              {
                categorias.find(
                  c => c.id === t.categoria_id
                )?.nome || 'Sem categoria'
              }
            </div>

            <p>{t.conteudo}</p>

            {/* COMMENTS */}
            {(comentariosMap[t.id] || [])
              .filter(c =>
                isPrivileged
                  ? true
                  : c.approved
              )
              .map(c => {

                const canModerate =
                  isPrivileged;

                const isOwner =
                  user?.id === c.usuario_id;

                return (

                  <div
                    key={c.id}
                    style={{
                      marginTop: 10,
                      padding: 10,
                      background: '#222',
                      borderRadius: 6
                    }}
                  >

                    <b>
                      {c.user_email || 'Anônimo'}
                    </b>

                    <p>{c.conteudo}</p>

                    <small>
                      {c.approved
                        ? 'Aprovado'
                        : 'Pendente'}
                    </small>

                    <div style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 10
                    }}>

                      {isOwner && !c.approved && (

                        <button
                          onClick={async () => {

                            const novo =
                              prompt(
                                'Editar comentário:',
                                c.conteudo
                              );

                            if (!novo) return;

                            await supabase
                              .from('comentarios')
                              .update({
                                conteudo: novo
                              })
                              .eq('id', c.id);

                            await loadData();
                          }}
                        >
                          Editar
                        </button>
                      )}

                      {canModerate && (
                        <>
                          <button
                            onClick={() =>
                              approveComment(c.id)
                            }
                          >
                            Aprovar
                          </button>

                          <button
                            onClick={() =>
                              deleteComment(c.id)
                            }
                          >
                            Excluir
                          </button>
                        </>
                      )}

                    </div>

                  </div>
                );
              })}

            {/* INPUT */}
            <div style={{
              marginTop: 15
            }}>

              <textarea
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 10,
                  background: '#222',
                  color: '#fff',
                  border: '1px solid #444'
                }}
                value={
                  commentState[t.id]?.text || ''
                }
                onChange={(e) =>
                  setLocalComment(
                    t.id,
                    { text: e.target.value }
                  )
                }
                placeholder="Comentário..."
              />

              <button
                style={{
                  marginTop: 10
                }}
                onClick={() =>
                  handleAddComment(t.id)
                }
              >
                Enviar
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* RIGHT */}
      <div style={{
        flex: 1,
        borderLeft: '1px solid #333',
        padding: 20
      }}>

        <h3>Categorias</h3>

        {categorias.length === 0 && (
          <div>Nenhuma categoria</div>
        )}

        {categorias.map(c => (

          <div
            key={c.id}
            style={{
              marginBottom: 10
            }}
          >
            {c.nome}
          </div>
        ))}

      </div>

    </div>
  );
}
