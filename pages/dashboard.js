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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

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
    profile?.role === "admin" ||
    profile?.role === "supervisor";

  return (
    <div
      style={{
        padding: 30,
        maxWidth: 1400,
        margin: "0 auto"
      }}
    >

      {/* TOPO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>
            Dashboard
          </h1>

          <p style={{ opacity: 0.7 }}>
            Bem-vindo {user?.email}
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            borderRadius: 8,
            border: "none",
            background: "#d32f2f",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Sair
        </button>
      </div>

      {/* BOTÕES GRANDES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 50
        }}
      >

        <button
          onClick={() => router.push("/base")}
          style={cardStyle}
        >
          📚
          <span>Base de Conhecimento</span>
        </button>

        <button
          onClick={() => router.push("/auditoria")}
          style={cardStyle}
        >
          📊
          <span>Auditoria</span>
        </button>

        <button
          onClick={() => router.push("/usuarios")}
          style={cardStyle}
        >
          👥
          <span>Usuários</span>
        </button>

        <button
          onClick={() => router.push("/treinamento")}
          style={cardStyle}
        >
          🎓
          <span>Treinamento</span>
        </button>

        <button
          onClick={() => router.push("/atendimento")}
          style={cardStyle}
        >
          💬
          <span>Atendimento</span>
        </button>

      </div>

      {/* AVISOS */}
      <div
        style={{
          background: "#1e1e1e",
          padding: 25,
          borderRadius: 12
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          📢 Informações Importantes
        </h2>

        {isAdmin && (
          <div style={{ marginBottom: 25 }}>

            <textarea
              value={novoAviso}
              onChange={(e) => setNovoAviso(e.target.value)}
              placeholder="Digite um aviso..."
              style={{
                width: "100%",
                minHeight: 120,
                padding: 15,
                borderRadius: 10,
                border: "1px solid #444",
                background: "#111",
                color: "#fff",
                fontSize: 16,
                marginBottom: 10
              }}
            />

            <button
              onClick={criarAviso}
              style={{
                padding: "12px 18px",
                borderRadius: 8,
                border: "none",
                background: "#f5c518",
                color: "#000",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Publicar Aviso
            </button>

          </div>
        )}

        {avisos.length === 0 && (
          <p>Nenhum aviso publicado.</p>
        )}

        {avisos.map((a) => (
          <div
            key={a.id}
            style={{
              background: "#2a2a2a",
              padding: 15,
              borderRadius: 10,
              marginBottom: 10
            }}
          >
            {a.conteudo}
          </div>
        ))}

      </div>

    </div>
  );
}

const cardStyle = {
  height: 180,
  borderRadius: 16,
  border: "none",
  background: "#242424",
  color: "#fff",
  fontSize: 24,
  fontWeight: "bold",
  cursor: "pointer",

  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 15,

  transition: "0.2s"
};
