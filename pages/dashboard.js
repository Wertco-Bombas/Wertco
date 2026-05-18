import { useRouter } from "next/router";

export default function Dashboard() {

  const router = useRouter();

  return(
    <div className="page">
      <div className="container">

        <div className="topbar">

          <div className="logoArea">
            <div className="logoIcon">◉</div>
            <div className="logoText">Don</div>
          </div>

          <div
            style={{
              display:'flex',
              alignItems:'center',
              gap:'12px'
            }}
          >

            <div className="userInfo">
              Administrador <span className="admin">(Admin)</span>
            </div>

            <button
              className="logoutBtn"
              onClick={() => window.location.href = '/login'}
            >
              Sair
            </button>

          </div>

        </div>

        {/* MENU */}
        <div className="menu">

          <button
            className="menuBtn"
            onClick={() => router.push("/base")}
          >
            Base de conhecimento
          </button>

          <button
            className="menuBtn"
            onClick={() => router.push("/usuario")}
          >
            Usuário
          </button>

          <button
            className="menuBtn"
            onClick={() => router.push("/treinamento")}
          >
            Treinamento
          </button>

          <button
            className="menuBtn"
            onClick={() => router.push("/auditoria")}
          >
            Auditoria
          </button>

        </div>

      </div>
    </div>
  )
}
