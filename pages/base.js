import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";

export default function Base() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);

  const [modal, setModal] = useState(null);
  const [newTopic, setNewTopic] = useState({ title: "", description: "", category: "HTML" });
  const [newCategory, setNewCategory] = useState("");
  const [deleteCat, setDeleteCat] = useState("HTML");

  // ---------------------------
  // 🔐 AUTH + PROFILE
  // ---------------------------
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    }

    loadUser();
  }, []);

  // ---------------------------
  // 📊 LOAD TOPICS
  // ---------------------------
  async function loadTopics() {
    const { data } = await supabase
      .from("topics")
      .select("*")
      .eq("status", "approved")
      .order("id", { ascending: false });

    setTopics(data || []);
  }

  // ---------------------------
  // 📊 LOAD CATEGORIES
  // ---------------------------
  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*");

    setCategories(data?.map(c => c.name) || []);
  }

  useEffect(() => {
    loadTopics();
    loadCategories();
  }, []);

  // ---------------------------
  // FILTER
  // ---------------------------
  const filteredTopics = topics.filter(t => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "Todas" || t.category === filter;

    return matchesSearch && matchesFilter;
  });

  // ---------------------------
  // 🟡 CREATE TOPIC
  // ---------------------------
  async function saveTopic() {
    if (!newTopic.title || !newTopic.description) return;

    await supabase.from("topics").insert({
      title: newTopic.title,
      description: newTopic.description,
      category: newTopic.category,
      status: "pending",
      created_by: user.id
    });

    await supabase.from("audit_log").insert({
      action: "CREATE_TOPIC",
      table_name: "topics",
      record_id: newTopic.title,
      user_id: user.id
    });

    setModal(null);
    setNewTopic({ title: "", description: "", category: "HTML" });

    await loadTopics(); // 🔥 ESSENCIAL
  }

  // ---------------------------
  // 🟡 CREATE CATEGORY
  // ---------------------------
  async function saveCategory() {
    if (!newCategory) return;

    await supabase.from("categories").insert({
      name: newCategory
    });

    await supabase.from("audit_log").insert({
      action: "CREATE_CATEGORY",
      table_name: "categories",
      record_id: newCategory,
      user_id: user.id
    });

    setModal(null);
    setNewCategory("");

    await loadCategories(); // 🔥 ESSENCIAL
  }

  // ---------------------------
  // 🟡 DELETE CATEGORY
  // ---------------------------
  async function removeCategory() {
    await supabase.from("categories").delete().eq("name", deleteCat);

    await supabase.from("audit_log").insert({
      action: "DELETE_CATEGORY",
      table_name: "categories",
      record_id: deleteCat,
      user_id: user.id
    });

    setModal(null);
    setDeleteCat("HTML");

    await loadCategories();
    await loadTopics(); // 🔥 remove tópicos órfãos atualiza tela
  }

  // ---------------------------
  // LOADING STATE
  // ---------------------------
  if (!user) return <p>Carregando...</p>;

  return (
    <Layout>
      <div className="base-container">

        {/* USER INFO */}
        <div style={{ marginBottom: 10 }}>
          <p><strong>Usuário:</strong> {user.email}</p>
          <p><strong>Nível:</strong> {profile?.role || "user"}</p>
        </div>

        {/* ADMIN AREA */}
        {profile?.role === "admin" && (
          <div style={{ background: "#222", color: "#fff", padding: 10, marginBottom: 10 }}>
            Área Administrador
          </div>
        )}

        {/* SEARCH */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="Todas">Todas as categorias</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {(profile?.role === "admin" || profile?.role === "supervisor") && (
            <>
              <button onClick={() => setModal("topic")}>+ Novo Tópico</button>
              <button onClick={() => setModal("category")}>+ Nova Categoria</button>
              <button onClick={() => setModal("delete")}>Excluir Categoria</button>
            </>
          )}
        </div>

        {/* TOPICS */}
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

        {/* MODALS */}
        {modal && (
          <div className="modal">
            <div className="modal-content">

              {modal === "topic" && (
                <>
                  <h2>Novo Tópico (pendente aprovação)</h2>
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
                </>
              )}

              {modal === "category" && (
                <>
                  <h2>Nova Categoria</h2>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />

                  <div className="modal-buttons">
                    <button onClick={saveCategory}>Salvar</button>
                    <button onClick={() => setModal(null)}>Voltar</button>
                  </div>
                </>
              )}

              {modal === "delete" && (
                <>
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
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
