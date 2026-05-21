import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function BaseNovo() {
  const [user, setUser] = useState(null);
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return;

    setUser(session.user);

    await load();
  }

  async function load() {
    const { data: tops } = await supabase
      .from("topicos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: coms } = await supabase
      .from("comentarios")
      .select("*")
      .order("created_at", { ascending: false });

    setTopicos(tops || []);
    setComentarios(coms || []);
  }

  async function comentar(topicoId) {
    const input = document.getElementById("c-" + topicoId);

    if (!input.value) return;

    await supabase.from("comentarios").insert({
      conteudo: input.value,
      topico_id: topicoId,
      usuario_id: user.id,
      user_email: user.email,
      approved: true
    });

    input.value = "";
    load();
  }

  const comentariosPorTopico = (id) =>
    comentarios.filter((c) => c.topico_id === id);

  return (
    <div style={{ padding: 20, color: "#fff", background: "#111", minHeight: "100vh" }}>

      <h1>Base de Conhecimento (Nova Versão)</h1>

      {topicos.map((t) => (
        <div key={t.id} style={{ background: "#222", padding: 15, marginBottom: 20 }}>

          <h2>{t.title}</h2>
          <p>{t.content}</p>

          <hr />

          <h3>Comentários</h3>

          {comentariosPorTopico(t.id).map((c) => (
            <div key={c.id} style={{ background: "#333", padding: 10, marginBottom: 5 }}>
              <strong>{c.user_email}</strong>
              <p>{c.conteudo}</p>
            </div>
          ))}

          {user && (
            <>
              <textarea id={"c-" + t.id} />
              <br />
              <button onClick={() => comentar(t.id)}>
                Comentar
              </button>
            </>
          )}

        </div>
      ))}

    </div>
  );
}
