import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const [comentarios, setComentarios] = useState({});

  useEffect(() => {
    init();
  }, []);

  async function init() {

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {

      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setRole(profile?.role || 'user');
    }

    loadData();
  }

  async function loadData() {

    const { data: cats } =
      await supabase
        .from('categorias')
        .select('*');

    const { data: tops } =
      await supabase
        .from('topicos')
        .select('*')
        .order('created_at', {
          ascending: false
        });

    const { data: coms } =
      await supabase
        .from('comentarios')
        .select('*')
        .order('created_at', {
          ascending: false
        });

    const map = {};

    (coms || []).forEach(c => {

      if (!map[c.topico_id]) {
        map[c.topico_id] = [];
      }

      map[c.topico_id].push(c);
    });

    setCategorias(cats || []);
    setTopicos(tops || []);
    setComentarios(map);
  }

  async function logout() {

    await supabase.auth.signOut();

    location.href = '/login';
  }

  async function comentar(topicoId) {

    const texto =
      document.getElementById(
        `comentario-${topicoId}`
      ).value;

    const file =
      document.getElementById(
        `foto-${topicoId}`
      ).files[0];

    let imagem = null;

    if (file) {

      const nome =
        Date.now() + '-' + file.name;

      const { error } =
        await supabase.storage
          .from('comentarios')
          .upload(nome, file);

      if (!error) {

        const { data } =
          supabase.storage
            .from('comentarios')
            .getPublicUrl(nome);

        imagem = data.publicUrl;
      }
    }

    await supabase
      .from('comentarios')
      .insert({

        conteudo: texto,
        topico_id: topicoId,
        usuario_id: user.id,
        user_email: user.email,
        approved:
          role === 'admin' ||
          role === 'supervisor',

        imagem
      });

    loadData();
  }

  async function aprovar(id) {

    await supabase
      .from('comentarios')
      .update({
        approved: true
      })
      .eq('id', id);

    loadData();
  }

  async function excluirComentario(id) {

    await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    loadData();
  }

  async function editarComentario(c) {

    const novo =
      prompt(
        'Editar comentário',
        c.conteudo
      );

    if (!novo) return;

    await supabase
      .from('comentarios')
      .update({
        conteudo: novo
      })
      .eq('id', c.id);

    loadData();
  }

  const topicosFiltrados =
    topicos.filter(t => {

      const categoria =
        categorias.find(
          c => c.id === t.categoria_id
        );

      const texto =
        (
          t.titulo +
          ' ' +
          t.conteudo +
          ' ' +
          (categoria?.nome || '')
        ).toLowerCase();

      const bateBusca =
        texto.includes(
          busca.toLowerCase()
        );

      const bateCategoria =
        !categoriaFiltro ||
        t.categoria_id === categoriaFiltro;

      return (
        bateBusca &&
        bateCategoria
      );
    });

  return (

    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        padding: 40
      }}
    >

      {/* TOPO */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 40
        }}
      >

        <div>

          <h1
            style={{
              fontSize: 36,
              marginBottom: 5
            }}
          >
            Base de Conhecimento
          </h1>

          <div
            style={{
              color: '#94a3b8'
            }}
          >
            Pesquisa interna de tópicos
          </div>

        </div>

        <div
          style={{
            display: 'flex',
            gap: 15,
            alignItems: 'center'
          }}
        >

          <div>
            {user?.email}
          </div>

          <button
            onClick={logout}
            style={btnDanger}
          >
            Sair
          </button>

        </div>

      </div>

      {/* PESQUISA */}

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto'
        }}
      >

        <input
          placeholder='Pesquisar tópicos...'
          value={busca}
          onChange={e =>
            setBusca(e.target.value)
          }
          style={searchStyle}
        />

        {/* FILTROS */}

        <div
          style={{
            display: 'flex',
            gap: 15,
            marginTop: 20,
            marginBottom: 40,
            flexWrap: 'wrap'
          }}
        >

          <select
            value={categoriaFiltro}
            onChange={e =>
              setCategoriaFiltro(
                e.target.value
              )
            }
            style={selectStyle}
          >

            <option value=''>
              Todas Categorias
            </option>

            {categorias.map(c => (

              <option
                key={c.id}
                value={c.id}
              >
                {c.nome}
              </option>
            ))}

          </select>

          {(role === 'admin' ||
            role === 'supervisor') && (
            <>
              <button
                style={btn}
                onClick={() =>
                  location.href =
                    '/nova-categoria'
                }
              >
                Nova Categoria
              </button>

              <button
                style={btn}
                onClick={() =>
                  location.href =
                    '/novo-topico'
                }
              >
                Novo Tópico
              </button>

              <button
                style={btnDanger}
                onClick={() =>
                  location.href =
                    '/excluir-categoria'
                }
              >
                Excluir Categoria
              </button>
            </>
          )}

        </div>

        {/* TOPICOS */}

        <div
          style={{
            display: 'grid',
            gap: 25
          }}
        >

          {topicosFiltrados.map(t => {

            const categoria =
              categorias.find(
                c =>
                  c.id ===
                  t.categoria_id
              );

            return (

              <div
                key={t.id}
                style={card}
              >

                <div
                  style={{
                    marginBottom: 20
                  }}
                >

                  <div
                    style={{
                      display: 'inline-block',
                      background: '#2563eb',
                      padding:
                        '6px 12px',
                      borderRadius: 30,
                      fontSize: 12,
                      marginBottom: 15
                    }}
                  >
                    {categoria?.nome}
                  </div>

                  <h2>
                    {t.titulo}
                  </h2>

                  <p
                    style={{
                      color: '#cbd5e1',
                      lineHeight: 1.7
                    }}
                  >
                    {t.conteudo}
                  </p>

                </div>

                {/* COMENTARIOS */}

                <div>

                  <h3>
                    Comentários
                  </h3>

                  {(comentarios[t.id] || [])
                    .filter(c =>
                      role ===
                        'admin' ||
                      role ===
                        'supervisor'
                        ? true
                        : c.approved
                    )
                    .map(c => {

                      const dono =
                        user?.id ===
                        c.usuario_id;

                      return (

                        <div
                          key={c.id}
                          style={comentario}
                        >

                          <b>
                            {
                              c.user_email
                            }
                          </b>

                          <p>
                            {
                              c.conteudo
                            }
                          </p>

                          {c.imagem && (

                            <img
                              src={
                                c.imagem
                              }
                              style={{
                                width:
                                  250,
                                borderRadius: 10,
                                marginTop: 10
                              }}
                            />
                          )}

                          <div
                            style={{
                              display:
                                'flex',
                              gap: 10,
                              marginTop: 15
                            }}
                          >

                            {dono && (
                              <>
                                <button
                                  style={
                                    btn
                                  }
                                  onClick={() =>
                                    editarComentario(
                                      c
                                    )
                                  }
                                >
                                  Editar
                                </button>

                                <button
                                  style={
                                    btnDanger
                                  }
                                  onClick={() =>
                                    excluirComentario(
                                      c.id
                                    )
                                  }
                                >
                                  Excluir
                                </button>
                              </>
                            )}

                            {!c.approved &&
                              (role ===
                                'admin' ||
                                role ===
                                  'supervisor') && (
                                <button
                                  style={
                                    btnSuccess
                                  }
                                  onClick={() =>
                                    aprovar(
                                      c.id
                                    )
                                  }
                                >
                                  Aprovar
                                </button>
                              )}

                          </div>

                        </div>
                      );
                    })}

                  {/* NOVO COMENTARIO */}

                  {user && (

                    <div
                      style={{
                        marginTop: 25
                      }}
                    >

                      <textarea
                        id={`comentario-${t.id}`}
                        placeholder='Escreva um comentário...'
                        style={
                          textarea
                        }
                      />

                      <input
                        type='file'
                        id={`foto-${t.id}`}
                        style={{
                          marginTop: 15
                        }}
                      />

                      <button
                        style={{
                          ...btn,
                          marginTop: 15
                        }}
                        onClick={() =>
                          comentar(
                            t.id
                          )
                        }
                      >
                        Comentar
                      </button>

                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}

const card = {

  background: '#1e293b',
  padding: 30,
  borderRadius: 20,
  border: '1px solid #334155'
};

const comentario = {

  background: '#0f172a',
  padding: 20,
  borderRadius: 15,
  marginTop: 15
};

const btn = {

  background: '#2563eb',
  color: '#fff',
  border: 0,
  padding: '10px 18px',
  borderRadius: 10,
  cursor: 'pointer'
};

const btnDanger = {

  background: '#dc2626',
  color: '#fff',
  border: 0,
  padding: '10px 18px',
  borderRadius: 10,
  cursor: 'pointer'
};

const btnSuccess = {

  background: '#16a34a',
  color: '#fff',
  border: 0,
  padding: '10px 18px',
  borderRadius: 10,
  cursor: 'pointer'
};

const searchStyle = {

  width: '100%',
  padding: 18,
  borderRadius: 15,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#fff',
  fontSize: 16
};

const selectStyle = {

  padding: 14,
  borderRadius: 10,
  background: '#1e293b',
  color: '#fff',
  border: '1px solid #334155'
};

const textarea = {

  width: '100%',
  minHeight: 120,
  background: '#1e293b',
  color: '#fff',
  border: '1px solid #334155',
  borderRadius: 15,
  padding: 20,
  fontSize: 15
};
