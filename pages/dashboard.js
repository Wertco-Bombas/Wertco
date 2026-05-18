import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="page">
      <div className="container">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="logo">
            <div className="logoBox">◉</div>
            <div className="logoText">Don</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="userInfo">
              Administrador <span className="admin">(Admin)</span>
            </div>

            <button onClick={() => router.push("/login")}>
              Sair
            </button>
          </div>
        </div>

        {/* NAVIGATION PROFISSIONAL */}
        <div className="nav">

          <button className="navBtn" onClick={() => router.push("/base")}>
            Base de conhecimento
          </button>

          <button className="navBtn" onClick={() => router.push("/usuarios")}>
            Usuários
          </button>

          <button className="navBtn" onClick={() => router.push("/treinamento")}>
            Treinamento
          </button>

          <button className="navBtn" onClick={() => router.push("/auditoria")}>
            Auditoria
          </button>

        </div>

        {/* DASHBOARD HOME */}
        <div className="card">
          <h2>Bem-vindo ao sistema</h2>
          <p>Selecione uma área no menu acima para começar.</p>
        </div>

      </div>
    </div>
  );
}
