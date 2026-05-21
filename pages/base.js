import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function BaseNovo() {
  const [status, setStatus] = useState("carregando...");
  const [user, setUser] = useState(null);
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      setStatus("verificando login...");

      const { data: { session }, error } =
        await supabase.auth.getSession();

      console.log("SESSION:", session);
      console.log("ERROR:", error);

      if (!session?.user) {
        setStatus("não logado");
        return;
      }

      setUser(session.user);

      setStatus("carregando tópicos...");

      const { data: tops, error: errTop } = await supabase
        .from("topicos")
        .select("*");

      console.log("TOPICOS:", tops, errTop);

      const { data: coms, error: errCom } = await supabase
        .from("comentarios")
        .select("*");

      console.log("COMENTARIOS:", coms, errCom);

      setTopicos(tops || []);
      setComentarios(coms || []);

      setStatus("ok");

    } catch (err) {
      console.error(err);
      setStatus("erro: " + err.message);
    }
  }

  function comentariosDoTopico(id) {
    return comentarios.filter((c) => c.topico_id === id);
  }

  if (status !== "ok") {
    return (
      <div style={{ padding: 20, color: "#fff", background: "#111", minHeight: "100vh" }}>
        <h2>Base de Conhecimento</h2>
        <p>Status: {status}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, color: "#fff", background: "#111", minHeight: "100vh" }}>

      <h1>Base de Conhecimento</h1>

      {topicos.length === 0 && <p>Nenhum tópico encontrado</p>}

      {topicos.map((t) => (
        <div key={t.id} style={{ background: "#222", padding: 15, marginBottom: 20 }}>

          <h2>{t.title || "sem título"}</h2>
          <p>{t.content || t.conteudo || "sem conteúdo"}</p>

          <hr />

          <h3>Comentários</h3>

          {comentariosDoTopico(t.id).map((c) => (
            <div key={c.id} style={{ background: "#333", padding: 10, marginBottom: 5 }}>
              <strong>{c.user_email || "anon"}</strong>
              <p>{c.conteudo}</p>
            </div>
          ))}

          <textarea id={"c-" + t.id} />
        </div>
      ))}

    </div>
  );
}
