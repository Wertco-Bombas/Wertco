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

  const [modal, setModal] = useState(null); // controla qual modal está aberto
  const [newTopic, setNewTopic] = useState({ title: "", description: "", category: "HTML" });
  const [newCategory, setNewCategory] = useState("");
  const [deleteCat, setDeleteCat] = useState("HTML");

  const filteredTopics = topics.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todas" || t.category === filter;
    return matchesSearch && matchesFilter;
  });

  function saveTopic() {
    if (newTopic.title && newTopic.description) {
      setTopics([...topics, { id: topics.length + 1, ...newTopic }]);
      if (!categories.includes(newTopic.category)) {
        setCategories([...categories, newTopic.category]);
      }
      setModal(null);
    }
  }

  function saveCategory() {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setModal(null);
    }
  }

  function removeCategory() {
    setCategories(categories.filter(c => c !== deleteCat));
    setTopics(topics.filter(t => t.category !== deleteCat));
    setModal(null);
  }

  return (
    <div className="base-container">
      {/* Topo */}
      <header className="navbar">
        <ul className="nav-links">
          <li>Base de conhecimento</li>
          <li>Usuário</li>
          <li>Treinamento</li>
          <li>Auditoria</li>
        </ul>
      </header>

      {/* Pesquisa */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar títulos, descrições, categorias, comentários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtro e ações */}
      <div className="actions">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="Todas">Todas as categorias</option>
          {categories.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
        <button onClick={() => setModal("topic")}>+ Novo Tópico</button>
        <button onClick={() => setModal("category")}>+ Nova Categoria</button>
        <button onClick={() => setModal("delete")}>Excluir Categoria</button>
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

      {/* Modais */}
      {modal === "topic" && (
        <div className="modal">
          <div className="modal-content">
            <h2>Novo Tópico</h2>
            <input
              type="text"
              placeholder="Título"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Descrição"
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
            />
            <select
              value={newTopic.category}
              onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
            >
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
            <div className="modal-buttons">
              <button onClick={saveTopic}>Salvar</button>
              <button onClick={() => setModal(null)}>Voltar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "category" && (
        <div className="modal">
          <div className="modal-content">
            <h2>Nova Categoria</h2>
            <input
              type="text"
              placeholder="Nome da categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={saveCategory}>Salvar</button>
              <button onClick={() => setModal(null)}>Voltar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "delete" && (
        <div className="modal">
          <div className="modal-content">
            <h2>Excluir Categoria</h2>
            <select value={deleteCat} onChange={(e) => setDeleteCat(e.target.value)}>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
            <div className="modal-buttons">
              <button onClick={removeCategory}>Excluir</button>
              <button onClick={() => setModal(null)}>Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
