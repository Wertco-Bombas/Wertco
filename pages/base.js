import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function Base() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});

  const [busca, setBusca] = useState('');

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    const u = data?.user;

    if (!u) {
      router.push('/login');
      return;
    }

    setUser(u);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', u.id)
      .single();

    setRole(profile?.role || 'user');

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
    router.push('/login');
  }

  // =========================
  // COMENTAR
  // =========================
  async function comentar(topicoId) {
    const textarea = document.getElementById(`c-${topicoId}`);
    const conteudo = textarea?.value;

    if (!conteudo?.trim()) return alert('Digite um comentário');

    await supabase.from('comentarios').insert({
      conteudo,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved: role === 'admin' || role === 'supervisor'
    });

    textarea.value = '';
    loadData();
  }

  // =========================
  // FILTER
  // =========================
  const filtrados = topicos.filter(t =>
    t.title?.toLowerCase().includes(busca.toLowerCase()) ||
    t.content?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={styles.page}>

      {/* TOP BAR */}
      <div style={styles.topbar}>
        
        <h2 style={{ margin: 0 }}>Base de Conhecimento</h2>

        <div style={styles.topRight}>
          <span>{user?.email}</span>

          <button
            onClick={() => router.push('/dashboard')}
            style={styles.menuBtn}
          >
            Menu
          </button>

          <button onClick={logout} style={styles.logout}>
            Sair
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div style={styles.searchBar}>
        <input
          placeholder="Pesquisar tópicos..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* CONTENT */}
      <div style={styles.grid}>

        {filtrados.map(t => {

          const comentarios = comentariosMap[t.id] || [];

          return (
            <div key={t.id} style={styles.card}>

              <h3>{t.title}</h3>
              <p>{t.content}</p>

              {/* COMMENTS */}
              <div style={styles.comments}>
                <strong>Comentários</strong>

                {comentarios.map(c => (
                  <div key={c.id} style={styles.comment}>
                    <b>{c.user_email}</b>
                    <p>{c.conteudo}</p>
                  </div>
                ))}

                {/* INPUT */}
                <textarea
                  id={`c-${t.id}`}
                  placeholder="Escreva um comentário..."
                  style={styles.textarea}
                />

                <button
                  onClick={() => comentar(t.id)}
                  style={styles.btn}
                >
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

// =========================
// STYLE
// =========================
const styles = {

  page: {
    padding: 25,
    background: '#111',
    color: '#fff',
    minHeight: '100vh'
  },

  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  topRight: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  menuBtn: {
    padding: '10px 14px',
    background: '#444',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer'
  },

  logout: {
    padding: '10px 14px',
    background: '#d32f2f',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer'
  },

  searchBar: {
    marginBottom: 20
  },

  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: 20
  },

  card: {
    background: '#1e1e1e',
    padding: 20,
    borderRadius: 12
  },

  comments: {
    marginTop: 15,
    borderTop: '1px solid #333',
    paddingTop: 10
  },

  comment: {
    marginTop: 10,
    padding: 10,
    background: '#2a2a2a',
    borderRadius: 8
  },

  textarea: {
    width: '100%',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    background: '#111',
    color: '#fff',
    border: '1px solid #333'
  },

  btn: {
    marginTop: 8,
    padding: 10,
    width: '100%',
    borderRadius: 8,
    border: 0,
    background: '#FFD700',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
