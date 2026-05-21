import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';


export default function Base() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});

  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [novoComentario, setNovoComentario] = useState({});

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();

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
  // COMENTAR (API PADRÃO)
  // =========================
  async function comentar(topicoId) {
    if (!user) return alert('Faça login');

    const conteudo = novoComentario[topicoId];
    if (!conteudo?.trim()) return alert('Digite um comentário');

    const res = await fetch('/api/comentarios/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conteudo,
        topico_id: topicoId,
        usuario_id: user.id,
        usuario_email: user.email
      })
    });

    if (!res.ok) {
      const err = await res.json();
      return alert(err.error);
    }

    setNovoComentario(prev => ({ ...prev, [topicoId]: '' }));
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

    const texto = `${t.title} ${t.content} ${categoria?.nome || ''}`.toLowerCase();

    return (
      texto.includes(busca.toLowerCase()) &&
      (!categoriaFiltro || t.category_id == categoriaFiltro)
    );
  });

  // =========================
  // RENDER
  // =========================
  return (
    <div className="base-container">

      {/* TOPBAR */}
      <div className="topbar">
        <h2>Base de Conhecimento</h2>

        <div>
          {user?.email}
          <button onClick={logout}>Sair</button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">

        <input
          placeholder="Pesquisar..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />

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

      </div>

      {/* TOPICOS */}
      {topicosFiltrados.map(t => {
        const categoria = categorias.find(c => c.id === t.category_id);

        return (
          <div key={t.id} className="topico-card">

            <h2>{t.title}</h2>
            <p>{t.content}</p>

            <span>{categoria?.nome}</span>

            {/* COMENTÁRIOS */}
            <div>

              {(comentariosMap[t.id] || [])
                .filter(c => role === 'admin' || role === 'supervisor' ? true : c.approved)
                .map(c => (
                  <div key={c.id}>
                    <strong>{c.user_email}</strong>
                    <p>{c.conteudo}</p>

                    {c.approved === false && (role === 'admin' || role === 'supervisor') && (
                      <button onClick={() => aprovar(c.id)}>Aprovar</button>
                    )}

                    <button onClick={() => editarComentario(c)}>Editar</button>
                    <button onClick={() => excluirComentario(c.id)}>Excluir</button>
                  </div>
                ))
              }

              {/* INPUT COMENTÁRIO */}
              {user && (
                <div>
                  <textarea
                    value={novoComentario[t.id] || ''}
                    onChange={(e) =>
                      setNovoComentario(prev => ({
                        ...prev,
                        [t.id]: e.target.value
                      }))
                    }
                  />

                  <button onClick={() => comentar(t.id)}>
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
