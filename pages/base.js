export default function Base() {
  return (
    <div className="base-container">
      <header className="navbar">
        <div className="logo">Don</div>
        <nav>
          <ul>
            <li>Base de conhecimento</li>
            <li>Usuário</li>
            <li>Treinamento</li>
            <li>Auditoria</li>
          </ul>
        </nav>
      </header>

      <main className="content">
        <div className="actions">
          <button>Todas as categorias</button>
          <button>+ Novo Tópico</button>
          <button>+ Nova Categoria</button>
          <button>Excluir Categoria</button>
        </div>

        <section className="category">
          <h2>HTML Básico</h2>
          <p>Estrutura de páginas web.</p>
          <div className="comments">
            <p><strong>Usuário Comum</strong> (04/05/2026, 17:54:51) — Pendente</p>
            <button>Aprovar</button>
            <button>Rejeitar</button>
            <input type="text" placeholder="Adicionar comentário" />
            <button>Enviar</button>
          </div>
        </section>

        <section className="category">
          <h2>CSS Avançado</h2>
          <p>Estilização e responsividade.</p>
          <div className="comments">
            <p>Sem comentários</p>
            <input type="text" placeholder="Adicionar comentário" />
            <button>Enviar</button>
          </div>
        </section>

        <section className="category">
          <h2>P8</h2>
          <p>Erro de instalação.</p>
          <div className="comments">
            <p>Sem comentários</p>
            <input type="text" placeholder="Adicionar comentário" />
            <button>Enviar</button>
          </div>
        </section>
      </main>

      <aside className="sidebar">
        <h3>Comentários pendentes</h3>
        <p>HTML Básico — Comentário id_5egfoik por user</p>
        <button>Fechar</button>
        <button>Ir</button>
      </aside>
    </div>
  );
}
