import Layout from "../components/Layout";

export default function Dashboard() {
  return (
    <Layout>
      <div className="dashboard-container">
        <h1>Bem-vindo ao Dashboard</h1>
        <p>Escolha uma das opções no menu acima para navegar.</p>

        <section className="dashboard-cards">
          <div className="card" onClick={() => (window.location.href = "/base")}>
            <h2>Base de conhecimento</h2>
            <p>Acesse artigos e informações úteis.</p>
          </div>

          <div className="card" onClick={() => (window.location.href = "/usuario")}>
            <h2>Usuários</h2>
            <p>Gerencie contas e permissões.</p>
          </div>

          <div className="card" onClick={() => (window.location.href = "/treinamento")}>
            <h2>Treinamento</h2>
            <p>Materiais e cursos disponíveis.</p>
          </div>

          <div className="card" onClick={() => (window.location.href = "/auditoria")}>
            <h2>Auditoria</h2>
            <p>Relatórios e histórico de atividades.</p>
          </div>

          <div className="card" onClick={() => (window.location.href = "/atendimento")}>
            <h2>Atendimento</h2>
            <p>Suporte e acompanhamento de chamados.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
