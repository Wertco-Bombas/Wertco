import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profile);

    loadAvisos();
  }

  async function loadAvisos() {
    const { data } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });

    setAvisos(data || []);
  }

  async function criarAviso() {
    if (!novoAviso.trim()) return;

    await supabase.from("avisos").insert({
      conteudo: novoAviso,
      user_id: user.id
    });

    setNovoAviso("");
    loadAvisos();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isAdmin =
    profile?.role === "admin" || profile?.role === "supervisor";

  return (
    <div style={{ padding: 20 }}>

      <h1>Dashboard</h1>

      {/* MENU PRINCIPAL */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>

        <button onClick={() => router.push("/base")}>
          Base de Conhecimento
        </button>

        <button onClick={() => router.push("/auditoria")}>
          Auditoria
        </button>

        <button onClick={() => router.push("/usuarios")}>
          Usuários
        </button>

        <button onClick={() => router.push("/treinamento")}>
          Treinamento
        </button>

        <button onClick={() => router.push("/atendimento")}>
          Atendimento
        </button>

        <button onClick={logout}>
          Sair
        </button>

      </div>

      {/* AVISOS */}
      <h2>📢 Informações Importantes</h2>

      {isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={novoAviso}
            onChange={(e) => setNovoAviso(e.target.value)}
            placeholder="Novo aviso..."
            style={{ width: "100%", height: 80 }}
          />
          <button onClick={criarAviso}>
            Publicar aviso
          </button>
        </div>
      )}

      {avisos.map((a) => (
        <div key={a.id} style={{ padding: 10, border: "1px solid #ccc", marginBottom: 10 }}>
          {a.conteudo}
        </div>
      ))}

    </div>
  );
}
