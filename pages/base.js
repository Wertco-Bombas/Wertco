import { useState } from "react";

export default function Base() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");

  const topics = [
    { id: 1, category: "HTML", title: "HTML Básico", description: "Estrutura de páginas web." },
    { id: 2, category: "CSS", title: "CSS Avançado", description: "Estilização e responsividade." },
    { id: 3, category: "Instalação", title: "P8", description: "Erro de instalação." }
  ];

  const filteredTopics = topics.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todas" || t.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="base-container">
      {/* Topo com navegação centralizada */}
      <header className="navbar">
        <ul className="nav-links">
          <li>Base de conhecimento</li>
          <li>Usuário</li>
          <li>Treinamento</li>
          <li>Auditoria</li>
        </ul>
      </header>

      {/* Barra de pesquisa */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar títulos, descrições, categorias, comentários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtro de categorias */}
      <div className="actions">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="Todas">Todas as categorias</option>
          <option value="HTML">HTML</option>
          <option value="CSS">CSS</option>
          <option value="Instalação">Instalação</option>
        </select>
        <button>+ Novo Tópico</button>
        <button>+ Nova Categoria</button>
        <button>Excluir Categoria</button>
      </div>

      {/* Lista de tópicos */}
      <main className="content">
        {filteredTopics.map(topic => (
          <section key={topic.id} className="topic">
            <h2>{topic.title}</h2>
            <p>{topic.description}</p>
            <div className="comments">
              <input type="text" placeholder="Adicionar comentário" />
              <button>Enviar</button>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
