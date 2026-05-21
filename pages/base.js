import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/base.css';

export default function Base() {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const [comentariosMap, setComentariosMap] = useState({});

  // =========================
  // INIT
  // =========================
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

  // =========================
  // LOAD DATA
  // =========================
  async function loadData() {

    const { data: tops } = await supabase
      .from('topicos')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: cats } = await supabase
      .from('categorias')
      .select('*');

    const { data: coms } = await supabase
      .from('comentarios')
      .select('*')
      .order('created_at', { ascending: false });

    const map = {};

    (coms || []).forEach(c => {
      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(c);
    });

    setTopicos(tops || []);
    setCategorias(cats || []);
    setComentariosMap(map);
  }

  // =========================
  // LOGOUT
  // =========================
  async function logout() {
    await supabase.auth.signOut();
    location.href = '/login';
  }

  // =========================
  // COMENTAR
  // =========================
  async function comentar(topicoId) {

    if (!user) return alert('Faça login');

    const textarea = document.getElementById(`comentario-${topicoId}`);
    const fileInput = document.getElementById(`foto-${topicoId}`);

    const conteudo = textarea.value;

    if (!conteudo.trim()) return alert('Digite um comentário');

    let imagem = null;

    const file = fileInput.files[0];

    if (file) {

      const nome = Date.now() + '-' + file.name;

      const { error } = await supabase.storage
        .from('comentarios')
        .upload(nome, file);

      if (!error) {

        const { data } = supabase.storage
          .from('comentarios')
          .getPublicUrl(nome);

        imagem = data.publicUrl;
      }
    }

    await supabase.from('comentarios').insert({
      conteudo,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved: role === 'admin' || role === 'supervisor',
      imagem
    });

    textarea.value = '';
    fileInput.value = '';

    loadData();
  }

  // =========================
  // APROVAR
  // =========================
  async function aprovar(id) {

    await supabase
      .from('comentarios')
      .update({ approved: true })
      .eq('id', id);

    loadData();
  }

  // =========================
  // EXCLUIR
  // =========================
  async function excluirComentario(id) {

    const ok = confirm('Excluir comentário?');
    if (!ok) return;

    await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    loadData();
  }

  // =========================
  // EDITAR
  // =========================
  async function editarComentario(c) {

    const novo = prompt('Editar comentário', c.conteudo);
    if (!novo) return;

    await supabase
      .from('comentarios')
      .update({ conteudo: novo })
      .eq('id', c.id);

    loadData();
  }

  // =========================
  // FILTRO
  // =========================
  const topicosFiltrados = topicos.filter(t => {

    const categoria = categorias.find(c => c.id === t.category_id);

    const texto = `
      ${t.title}
      ${t.content}
      ${categoria?.nome || ''}
    `.toLowerCase();

    const matchBusca = texto.includes(busca.toLowerCase());
    const matchCat = !categoriaFiltro || t.category_id == categoriaFiltro;

    return matchBusca && matchCat;
  });

  // =========================
  // RENDER
  // =========================
  return (

    <div className="base-container">

      {/* TOPBAR */}
      <div className="topbar">

        <div className="topbar-left">
          <h2>Base de Conhecimento</h2>
        </div>

        <div className="topbar-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={logout}>Sair</button>
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="toolbar">

        <input
          className="search-bar"
          placeholder="Pesquisar tópicos..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />

        <div className="toolbar-row">

          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas categorias</option>

            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {(role === 'admin' || role === 'supervisor') && (
            <div className="toolbar-buttons">

              <button onClick={() => location.href = '/nova-categoria'}>
                Nova Categoria
              </button>

              <button onClick={() => location.href = '/novo-topico'}>
                Novo Tópico
              </button>

              <button onClick={() => location.href = '/excluir-categoria'}>
                Excluir Categoria
              </button>

            </div>
          )}

        </div>

      </div>

      {/* TOPICOS */}
      {topicosFiltrados.map(t => {

        const categoria = categorias.find(c => c.id === t.category_id);

        return (

          <div key={t.id} className="topico-card">

            <div className="topico-header">

              <h2 className="topico-titulo">
                {t.title}
              </h2>

              <div className="categoria-tag">
                {categoria?.nome || 'Sem categoria'}
              </div>

            </div>

            <p>{t.content}</p>

            {/* COMENTARIOS */}
            <div className="comentarios">

              <h3>Comentários</h3>

              <ul>

                {(comentariosMap[t.id] || [])
                  .filter(c =>
                    role === 'admin' || role === 'supervisor'
                      ? true
                      : c.approved
                  )
                  .map(c => {

                    const isOwner = user?.id === c.usuario_id;

                    return (

                      <li key={c.id}>

                        <strong>{c.user_email}</strong>
                        <p>{c.conteudo}</p>

                        {c.imagem && (
                          <img src={c.imagem} className="comentario-imagem" />
                        )}

                        <div className="comentario-acoes">

                          {isOwner && (
                            <>
                              <button onClick={() => editarComentario(c)}>Editar</button>
                              <button onClick={() => excluirComentario(c.id)}>Excluir</button>
                            </>
                          )}

                          {!c.approved && (role === 'admin' || role === 'supervisor') && (
                            <button onClick={() => aprovar(c.id)}>
                              Aprovar
                            </button>
                          )}

                        </div>

                      </li>

                    );
                  })}

              </ul>

              {/* INPUT */}
              {user && (
                <div className="comentario-input">

                  <textarea id={`comentario-${t.id}`} />

                  <input type="file" id={`foto-${t.id}`} />

                  <button className="btn btnYellow" onClick={() => comentar(t.id)}>
                    Comentar
                  </button>

                </div>
              )}

            </div>

          </div>
        );
      })}

    </div>
  );
}
