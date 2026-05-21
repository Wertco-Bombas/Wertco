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

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    const userData = data?.user;

    if (userData) {
      setUser(userData);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.id)
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
  // FILTRO
  // =========================
  const topicosFiltrados = topicos.filter(t => {
    const cat = categorias.find(c => c.id === t.category_id);

    const texto = `${t.title} ${t.content} ${cat?.nome || ''}`.toLowerCase();

    const matchBusca = texto.includes(busca.toLowerCase());
    const matchCat = !categoriaFiltro || t.category_id == categoriaFiltro;

    return matchBusca && matchCat;
  });

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Base de Conhecimento</h1>
          <small>{user?.email}</small>
        </div>

        <button onClick={logout} style={styles.logout}>
          Sair
        </button>
      </div>

      {/* TOOLS */}
      <div style={styles.toolbar}>
        <input
          placeholder="Pesquisar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={styles.search}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={styles.select}
        >
          <option value="">Todas categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        {(role === 'admin' || role === 'supervisor') && (
          <div style={styles.buttons}>
            <button onClick={() => location.href = '/nova-categoria'}>Nova Categoria</button>
            <button onClick={() => location.href = '/novo-topico'}>Novo Tópico</button>
            <button onClick={() => location.href = '/excluir-categoria'}>Excluir Categoria</button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={styles.container}>

        {topicosFiltrados.map(t => {
          const cat = categorias.find(c => c.id === t.category_id);

          return (
            <div key={t.id} style={styles.card}>
              <h2>{t.title}</h2>
              <span style={styles.tag}>{cat?.nome || 'Sem categoria'}</span>
              <p>{t.content}</p>

              <div style={styles.commentBox}>
                <strong>Comentários</strong>

                {(comentariosMap[t.id] || []).map(c => (
                  <div key={c.id} style={styles.comment}>
                    <b>{c.user_email}</b>
                    <p>{c.conteudo}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}

// =========================
// STYLES
// =========================
const styles = {
  page: {
    padding: 30,
    background: '#111',
    color: '#fff',
    minHeight: '100vh'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  logout: {
    padding: '10px 16px',
    background: '#d32f2f',
    color: '#fff',
    border: 0,
    borderRadius: 8
  },

  toolbar: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 20
  },

  search: {
    padding: 10,
    flex: 1
  },

  select: {
    padding: 10
  },

  buttons: {
    display: 'flex',
    gap: 10
  },

  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: 20
  },

  card: {
    background: '#1e1e1e',
    padding: 20,
    borderRadius: 12
  },

  tag: {
    display: 'inline-block',
    background: '#333',
    padding: '4px 8px',
    borderRadius: 6,
    marginBottom: 10
  },

  commentBox: {
    marginTop: 15,
    borderTop: '1px solid #333',
    paddingTop: 10
  },

  comment: {
    marginTop: 10,
    padding: 10,
    background: '#2a2a2a',
    borderRadius: 8
  }
};
