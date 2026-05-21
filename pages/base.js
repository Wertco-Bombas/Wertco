import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Base() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [comentariosMap, setComentariosMap] = useState({});

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    setRole(profile?.role || "user");

    await loadData();
  }

  // =========================
  // LOAD DATA
  // =========================
  async function loadData() {
    const { data: tops } = await supabase
      .from("topicos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: cats } = await supabase
      .from("categorias")
      .select("*");

    const { data: coms } = await supabase
      .from("comentarios")
      .select("*")
      .order("created_at", { ascending: false });

    const map = {};

    (coms || []).forEach((c) => {
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
    router.push("/login");
  }

  // =========================
  // COMENTAR
  // =========================
  async function comentar(topicoId) {
    const textarea = document.getElementById(`comentario-${topicoId}`);
    const fileInput = document.getElementById(`foto-${topicoId}`);

    const conteudo = textarea.value;

    if (!conteudo.trim()) return alert("Digite um comentário");

    let imagem = null;

    const file = fileInput?.files?.[0];

    if (file) {
      const nome = Date.now() + "-" + file.name;

      const { error } = await supabase.storage
        .from("comentarios")
        .upload(nome, file);

      if (!error) {
        const { data } = supabase.storage
          .from("comentarios")
          .getPublicUrl(nome);

        imagem = data.publicUrl;
      }
    }

    await supabase.from("comentarios").insert({
      conteudo,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved: role === "admin" || role === "supervisor",
      imagem,
    });

    textarea.value = "";
    fileInput.value = "";

    loadData();
  }

  // =========================
  // FILTRO
  // =========================
  const topicosFiltrados = topicos.filter((t) => {
    const categoria = categorias.find((c) => c.id === t.category_id);

    const texto = `
      ${t.title || ""}
      ${t.content || ""}
      ${categoria?.nome || ""}
    `.toLowerCase();

    const matchBusca = texto.includes(busca.toLowerCase());
    const matchCat = !categoriaFiltro || t.category_id == categoriaFiltro;

    return matchBusca && matchCat;
  });

  // =========================
  // UI
  // =========================
  return (
    <div style={styles.page}>

      {/* HEADER GLOBAL */}
      <div style={styles.header}>
        <h2>Base de Conhecimento</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <span>{user?.email}</span>

          <button onClick={() => router.push("/dashboard")}>
            Menu
          </button>

          <button onClick={logout} style={{ background: "red", color: "#fff" }}>
            Sair
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <input
          placeholder="Pesquisar tópicos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={styles.search}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
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
            <button onClick={() => router.push("/nova-categoria")}>
              Nova Categoria
            </button>

            <button onClick={() => router.push("/novo-topico")}>
              Novo Tópico
            </button>

            <button onClick={() => router.push("/excluir-categoria")}>
              Excluir Categoria
            </button>
          </>
        )}
      </div>

      {/* CONTEÚDO OCUPANDO TELA TODA */}
      <div style={styles.content}>

        {topicosFiltrados.map((t) => {
          const categoria = categorias.find(
            (c) => c.id === t.category_id
          );

          return (
            <div key={t.id} style={styles.card}>

              <h3>{t.title}</h3>
              <p>{t.content}</p>

              <small>{categoria?.nome}</small>

              {/* COMENTÁRIOS */}
              <div style={{ marginTop: 20 }}>
                <h4>Comentários</h4>

                {(comentariosMap[t.id] || [])
                  .filter((c) =>
                    role === "admin" || role === "supervisor"
                      ? true
                      : c.approved
                  )
                  .map((c) => (
                    <div key={c.id} style={styles.comment}>
                      <strong>{c.user_email}</strong>
                      <p>{c.conteudo}</p>

                      {c.imagem && (
                        <img
                          src={c.imagem}
                          style={{ width: 200 }}
                        />
                      )}
                    </div>
                  ))}

                <textarea id={`comentario-${t.id}`} />
                <input type="file" id={`foto-${t.id}`} />

                <button onClick={() => comentar(t.id)}>
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
// STYLE (FULL WIDTH FIX)
// =========================
const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "#111",
    color: "#fff",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: 20,
    borderBottom: "1px solid #333",
  },

  toolbar: {
    display: "flex",
    gap: 10,
    padding: 20,
    flexWrap: "wrap",
  },

  search: {
    padding: 10,
    minWidth: 250,
  },

  content: {
    padding: 20,
  },

  card: {
    background: "#1e1e1e",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
  },

  comment: {
    background: "#2a2a2a",
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
  },
};
