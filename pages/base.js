import { useState } from "react";

export default function Base() {
  // categorias simuladas
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: "HTML Básico",
      description: "Estrutura de páginas web.",
      comments: [
        { user: "Usuário Comum", text: "Comentário pendente", status: "Pendente", date: "04/05/2026, 17:54:51" }
      ]
    },
    {
      id: 2,
      name: "CSS Avançado",
      description: "Estilização e responsividade.",
      comments: []
    },
    {
      id: 3,
      name: "P8",
      description: "Erro de instalação.",
      comments: []
    }
  ]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");

  // lógica de pesquisa e filtro
  const filteredCategories = categories.filter(cat => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase()) ||
      cat.comments.some(c => c.text.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === "Todas" || cat.name === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="base-container">
      {/* Navbar */}
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

      {/* Barra de pesquisa */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar títulos, descrições, categorias, comentários e nomes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Botões de ação */}
      <div className="actions">
        <button onClick={() => setFilter("Todas")}>Todas as categorias</button>
        <button>+ Novo Tópico</button>
        <button>+ Nova Categoria</button>
        <button>Excluir Categoria</button>
      </div>

      {/* Conteúdo principal */}
      <main className="content">
        {filteredCategories.map(cat => (
          <section key={cat.id} className="category">
            <h2>{cat.name}</h2>
            <p>{cat.description}</p>
            <div className="comments">
              {cat.comments.length > 0 ? (
                cat.comments.map((c, i) => (
                  <div key={i}>
                    <p><strong>{c.user}</strong> ({c.date}) — {c.status}</p>
                    <button>Aprovar</button>
                    <button>Rejeitar</button>
                  </div>
                ))
              ) : (
                <p>Sem comentários</p>
              )}
              <input type="text" placeholder="Adicionar comentário" />
              <button>Enviar</button>
            </div>
          </section>
        ))}
      </main>

      {/* Sidebar */}
      <aside className="sidebar">
        <h3>Comentários pendentes</h3>
        <p>HTML Básico — Comentário id_5egfoik por user</p>
        <button>Fechar</button>
        <button>Ir</button>
      </aside>
    </div>
  );
}
