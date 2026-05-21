import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Base() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return;

    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    setRole(profile?.role || "user");

    loadData();
  }

  async function loadData() {
    const { data: tops } = await supabase.from("topicos").select("*");
    const { data: cats } = await supabase.from("categorias").select("*");
    const { data: coms } = await supabase.from("comentarios").select("*");

    const map = {};
    (coms || []).forEach((c) => {
      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(c);
    });

    setTopicos(tops || []);
    setCategorias(cats || []);
    setComentariosMap(map);
  }

  async function comentar(id) {
    const input = document.getElementById("c-" + id);
    if (!input.value.trim()) return;

    await supabase.from("comentarios").insert({
      conteudo: input.value,
      topico_id: id,
      usuario_id: user.id,
      user_email: user.email,
      approved: role !== "user"
    });

    input.value = "";
    loadData();
  }

  const filtrados = topicos.filter((t) => {
    const cat = categorias.find((c) => c.id === t.category_id);

    return (
      `${t.title} ${t.content} ${cat?.nome || ""}`
        .toLowerCase()
        .includes(busca.toLowerCase()) &&
      (!categoriaFiltro || t.category_id == categoriaFiltro)
    );
  });

  return (
    <div style={styles.page}>

      {/* TOP BAR */}
      <div style={styles.topbar}>
        <div>
          <h2 style={{ margin: 0 }}>Base de Conhecimento</h2>
          <small style={{ opacity: 0.7 }}>{user?.email}</small>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.btnGhost}>Menu</button>
          <button style={styles.btnDanger}>Sair</button>
        </div>
      </div>

      {/* FILTROS */}
      <div style={styles.filters}>
        <input
          placeholder="Pesquisar tópicos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={styles.input}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={styles.input}
        >
          <option value="">Todas categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        {(role === "admin" || role === "supervisor") && (
          <>
            <button style={styles.btn}>Nova Categoria</button>
            <button style={styles.btn}>Novo Tópico</button>
            <button style={styles.btnDanger}>Excluir Categoria</button>
          </>
        )}
      </div>

      {/* TOPICOS */}
      <div style={styles.grid}>
        {filtrados.map((t) => {
          const cat = categorias.find((c) => c.id === t.category_id);

          return (
            <div key={t.id} style={styles.card}>

              <div style={styles.cardHeader}>
                <h3>{t.title}</h3>
                <span style={styles.tag}>{cat?.nome}</span>
              </div>

              <p style={{ opacity: 0.85 }}>{t.content}</p>

              {/* COMENTÁRIOS */}
              <div style={styles.comments}>
                <strong>Comentários</strong>

                {(comentariosMap[t.id] || [])
                  .filter((c) =>
                    role === "admin" || role === "supervisor"
                      ? true
                      : c.approved
                  )
                  .map((c) => (
                    <div key={c.id} style={styles.comment}>
                      <b>{c.user_email}</b>
                      <p>{c.conteudo}</p>
                    </div>
                  ))}

                {user && (
                  <div style={{ marginTop: 10 }}>
                    <textarea id={`c-${t.id}`} style={styles.textarea} />
                    <button
                      onClick={() => comentar(t.id)}
                      style={styles.btnSmall}
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
  );
}

/* =========================
   STYLE MODERNO
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f0f10",
    color: "#fff",
    padding: 20,
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  filters: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 20,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },

  card: {
    background: "#1c1c1f",
    padding: 15,
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tag: {
    background: "#333",
    padding: "3px 10px",
    borderRadius: 8,
    fontSize: 12,
  },

  comments: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: "1px solid #333",
  },

  comment: {
    background: "#2a2a2a",
    padding: 8,
    marginTop: 8,
    borderRadius: 8,
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#111",
    color: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: 60,
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    border: "1px solid #333",
  },

  btn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#FFD700",
    cursor: "pointer",
    fontWeight: "bold",
  },

  btnSmall: {
    marginTop: 5,
    padding: "6px 10px",
    borderRadius: 6,
    background: "#FFD700",
    border: "none",
    cursor: "pointer",
  },

  btnDanger: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#d32f2f",
    color: "#fff",
    cursor: "pointer",
  },

  btnGhost: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
  },
};
