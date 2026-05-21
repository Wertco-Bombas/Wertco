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

  const [categoriaFiltro, setCategoriaFiltro] = useState('');

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
  // FILTRO
  // =========================
  const filtrados = categoriaFiltro
    ? topicos.filter(t => t.category_id == categoriaFiltro)
    : topicos;

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2>Base de Conhecimento</h2>

        <div style={styles.userBox}>
          <span>{user?.email}</span>

          <button onClick={() => router.push('/dashboard')} style={styles.menu}>
            Menu
          </button>

          <button onClick={logout} style={styles.logout}>
            Sair
          </button>
        </div>
      </div>

      {/* TOOLS */}
      <div style={styles.toolbar}>

        {/* FILTRO CATEGORIA */}
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={styles.select}
        >
          <option value="">Todas categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        {/* BOTÕES ADMIN */}
        {(role === 'admin' || role === 'supervisor') && (
          <div style={styles.buttons}>
            <button onClick={() => router.push('/nova-categoria')} style={styles.btn}>
              Nova Categoria
            </button>

            <button onClick={() => router.push('/novo-topico')} style={styles.btn}>
              Novo Tópico
            </button>

            <button onClick={() => router.push('/excluir-categoria')} style={styles.btnDanger}>
              Excluir Categoria
            </button>
          </div>
        )}
      </div>

      {/* LISTA */}
      <div style={styles.grid}>

        {filtrados.map(t => {

          const comentarios = comentariosMap[t.id] || [];

          return (
            <div key={t.id} style={styles.card}>

              <h3>{t.title}</h3>
              <p>{t.content}</p>

              {/* COMENTÁRIOS */}
              <div style={styles.comments}>
                <strong>Comentários</strong>

                {comentarios.map(c => (
                  <div key={c.id} style={styles.comment}>
                    <b>{c.user_email}</b>
                    <p>{c.conteudo}</p>
                  </div>
                ))}

                {/* INPUT COMENTÁRIO */}
                <textarea
                  id={`c-${t.id}`}
                  placeholder="Escreva um comentário..."
                  style={styles.textarea}
                />

                <button onClick={() => comentar(t.id)} style={styles.send}>
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

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  userBox: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  menu: {
    padding: '8px 12px',
    background: '#444',
    color: '#fff',
    border: 0,
    borderRadius: 8
  },

  logout: {
    padding: '8px 12px',
    background: '#d32f2f',
    color: '#fff',
    border: 0,
    borderRadius: 8
  },

  toolbar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap'
  },

  select: {
    padding: 10
  },

  buttons: {
    display: 'flex',
    gap: 10
  },

  btn: {
    padding: '8px 12px',
    background: '#FFD700',
    border: 0,
    borderRadius: 8,
    fontWeight: 'bold'
  },

  btnDanger: {
    padding: '8px 12px',
    background: '#d32f2f',
    color: '#fff',
    border: 0,
    borderRadius: 8
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

  send: {
    marginTop: 8,
    padding: 10,
    width: '100%',
    background: '#FFD700',
    border: 0,
    borderRadius: 8,
    fontWeight: 'bold'
  }
};
