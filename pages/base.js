import { useState } from "react";

export default function Base() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [categories, setCategories] = useState(["HTML", "CSS", "Instalação"]);
  const [topics, setTopics] = useState([
    { id: 1, category: "HTML", title: "HTML Básico", description: "Estrutura de páginas web." },
    { id: 2, category: "CSS", title: "CSS Avançado", description: "Estilização e responsividade." },
    { id: 3, category: "Instalação", title: "P8", description: "Erro de instalação." }
  ]);

  // lógica de pesquisa e filtro
  const filteredTopics = topics.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todas" || t.category === filter;
    return matchesSearch && matchesFilter;
  });

  // adicionar novo tópico
  function addTopic() {
    const title = prompt("Digite o título do novo tópico:");
    const description = prompt("Digite a descrição:");
    const category = prompt("Digite a categoria:");
    if (title && description && category) {
      setTopics([...topics, { id: topics.length + 1, category, title, description }]);
      if (!categories.includes(category)) {
        setCategories([...categories, category]);
      }
    }
  }

  // adicionar nova categoria
  function addCategory() {
    const newCat = prompt("Digite o nome da nova categoria:");
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    }
  }

  // excluir categoria
  function deleteCategory() {
    const cat = prompt("Digite o nome da categoria a excluir:");
    if (cat && categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
      setTopics(topics.filter(t => t.category !== cat));
    }
  }

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

      {/* Filtro e botões de ação */}
      <div className="actions">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="Todas">Todas as categorias</option>
          {categories.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
        <button onClick={addTopic}>+ Novo Tópico</button>
        <button onClick={addCategory}>+ Nova Categoria</button>
        <button onClick={deleteCategory}>Excluir Categoria</button>
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
