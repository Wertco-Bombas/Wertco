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

    const currentUser = session?.user || null;
    setUser(currentUser);

    if (currentUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      setRole(profile?.role || "user");
    }

    loadData();
  }

  async function loadData() {
    const { data: tops } = await supabase.from("topicos").select("*");
    const { data: cats } = await supabase.from("categorias").select("*");
    const { data: coms } = await supabase.from("comentarios").select("*");

    const map = {};
    (coms || []).forEach(c => {
      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(c);
    });

    setTopicos(tops || []);
    setCategorias(cats || []);
    setComentariosMap(map);
  }

  async function comentar(topicoId) {
    const textarea = document.getElementById(`comentario-${topicoId}`);
    const conteudo = textarea.value;

    if (!conteudo.trim()) return alert("Digite um comentário");

    await supabase.from("comentarios").insert({
      conteudo,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved: role === "admin" || role === "supervisor"
    });

    textarea.value = "";
    loadData();
  }

  const topicosFiltrados = topicos.filter(t => {
    const texto = `${t.title} ${t.content}`.toLowerCase();
    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="base-container">

      <h1>Base de Conhecimento</h1>

      <input
        placeholder="Pesquisar..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {topicosFiltrados.map(t => (
        <div key={t.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>

          <h2>{t.title}</h2>
          <p>{t.content}</p>

          <h4>Comentários</h4>

          {(comentariosMap[t.id] || []).map(c => (
            <div key={c.id}>
              <strong>{c.user_email}</strong>
              <p>{c.conteudo}</p>
            </div>
          ))}

          {user && (
            <div>
              <textarea id={`comentario-${t.id}`} />
              <button onClick={() => comentar(t.id)}>
                Comentar
              </button>
            </div>
          )}

        </div>
      ))}

    </div>
  );
}
