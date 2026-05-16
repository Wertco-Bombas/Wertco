import Layout from "../components/Layout";

export default function Dashboard() {
  return (
    <Layout>
      <div className="menu-container">
        <h1>Menu</h1>
        <p>Escolha uma das opções abaixo:</p>

        <section className="menu-options">
          <div className="card" onClick={() => (window.location.href = "/base")}>
            <h2>Base de conhecimento</h2>
          </div>

          <div className="card" onClick={() => (window.location.href = "/usuario")}>
            <h2>Usuários</h2>
          </div>

          <div className="card" onClick={() => (window.location.href = "/treinamento")}>
            <h2>Treinamento</h2>
          </div>

          <div className="card" onClick={() => (window.location.href = "/auditoria")}>
            <h2>Auditoria</h2>
          </div>

          <div className="card" onClick={() => (window.location.href = "/atendimento")}>
            <h2>Atendimento</h2>
          </div>
        </section>
      </div>
    </Layout>
  );
}
