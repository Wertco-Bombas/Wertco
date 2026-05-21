import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Base() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");

  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();

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

    loadData();
  }

  async function loadData() {
    const { data: tops } = await supabase
      .from("topicos")
      .select("*");

    const { data: cats } = await supabase
      .from("categorias")
      .select("*");

    const { data: coms } = await supabase
      .from("comentarios")
      .select("*");

    const map = {};

    (coms || []).forEach(c => {
      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(c);
    });

    setTopicos(tops || []);
    setCategorias(cats || []);
    setComentariosMap(map);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function comentar(topicoId) {
    const textarea = document.getElementById(`comentario-${topicoId}`);
    const conteudo = textarea.value;

    if (!conteudo.trim()) return;

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

  return (
    <div style={{ padding: 20 }}>

      {/* HEADER LIMPO */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Base de Conhecimento</h2>

        <div>
          <span style={{ marginRight: 10 }}>{user?.email}</span>
          <button onClick={() => router.push("/dashboard")}>
            Menu
          </button>
          <button onClick={logout}>Sair</button>
        </div>
      </div>

      {/* TÓPICOS */}
      {topicos.map(t => (
        <div key={t.id} style={{ border: "1px solid #ccc", marginTop: 20, padding: 10 }}>

          <h3>{t.title}</h3>
          <p>{t.content}</p>

          {/* COMENTÁRIOS */}
          <div>
            <h4>Comentários</h4>

            {(comentariosMap[t.id] || []).map(c => (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <strong>{c.user_email}</strong>
                <p>{c.conteudo}</p>
              </div>
            ))}

            {/* INPUT SEMPRE VISÍVEL */}
            {user && (
              <div>
                <textarea id={`comentario-${t.id}`} />
                <button onClick={() => comentar(t.id)}>
                  Comentar
                </button>
              </div>
            )}

          </div>

        </div>
      ))}

    </div>
  );
}
