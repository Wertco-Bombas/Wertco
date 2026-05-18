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
            <button className="navBtn" onClick={() => router.push("/login")}>
              Sair
            </button>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <div className="nav">
          <button className="navBtn" onClick={() => router.push("/base")}>
            Base de conhecimento
          </button>

          <button className="navBtn" onClick={() => router.push("/usuario")}>
            Usuário
          </button>

          <button className="navBtn" onClick={() => router.push("/treinamento")}>
            Treinamento
          </button>

          <button className="navBtn" onClick={() => router.push("/auditoria")}>
            Auditoria
          </button>

          <button className="navBtn" onClick={() => router.push("/atendimento")}>
            Atendimento
          </button>
        </div>

        {/* MENU HOME */}
        <div className="card">
          <h2>Menu</h2>
          <p>Selecione uma área acima para começar.</p>
        </div>

      </div>
    </div>
  );
}
