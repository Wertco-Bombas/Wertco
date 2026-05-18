import Layout from "../components/Layout";

export default function Atendimento() {
  return (
    <Layout>
      <div className="atendimento-container">
        <h1>Atendimento</h1>
        <p>Suporte e acompanhamento de chamados.</p>

        <section className="content-section">
          <h2>Chamados em aberto</h2>
          <ul>
            <li>Ticket #123 - Problema de login</li>
            <li>Ticket #124 - Erro no relatório</li>
            <li>Ticket #125 - Solicitação de treinamento</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>Histórico</h2>
          <p>Consulte chamados resolvidos e feedbacks dos clientes.</p>
        </section>
      </div>
    </Layout>
  );
}
