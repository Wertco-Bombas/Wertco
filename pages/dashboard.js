import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

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

      {/* BOTÕES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20
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

        <button
          onClick={() => router.push("/avisos")}
          style={cardStyle}
        >
          🔔
          <span>Avisos</span>
        </button>

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
