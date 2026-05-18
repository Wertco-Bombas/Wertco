import Layout from "../components/Layout";

export default function Atendimento() {
  return (
    <Layout>
      <div className="container">
        <div className="card">
          <h1 className="topicTitle">Atendimento</h1>
          <p className="description">Suporte e acompanhamento de chamados.</p>

          <section>
            <h2 className="sectionTitle">Chamados em aberto</h2>
            <ul>
              <li className="comment">Ticket #123 - Problema de login</li>
              <li className="comment">Ticket #124 - Erro no relatório</li>
              <li className="comment">Ticket #125 - Solicitação de treinamento</li>
            </ul>
          </section>

          <section>
            <h2 className="sectionTitle">Histórico</h2>
            <p className="description">
              Consulte chamados resolvidos e feedbacks dos clientes.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
