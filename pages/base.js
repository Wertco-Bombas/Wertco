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
  const [comments, setComments] = useState({});

  const [modal, setModal] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    category: "HTML"
  });

  const [newCategory, setNewCategory] = useState("");
  const [deleteCat, setDeleteCat] = useState("HTML");
  const [newComment, setNewComment] = useState("");

  // ---------------------------
  // 🔐 AUTH
  // ---------------------------
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return router.push("/");

      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    }

    loadUser();
  }, []);

  // ---------------------------
  // 📦 LOAD TOPICS
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
  // 📦 LOAD CATEGORIES
  // ---------------------------
  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data?.map(c => c.name) || []);
  }

  // ---------------------------
  // 💬 LOAD COMMENTS
  // ---------------------------
  async function loadComments(topicId) {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("topic_id", topicId)
      .order("id", { ascending: true });

    setComments(prev => ({
      ...prev,
      [topicId]: data || []
    }));
  }

  useEffect(() => {
    loadTopics();
    loadCategories();
  }, []);

  // ---------------------------
  // FILTER
  // ---------------------------
  const filteredTopics = topics.filter(t => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === "Todas" || t.category === filter;

    return matchSearch && matchFilter;
  });

  // ---------------------------
  // 🟡 CREATE TOPIC
  // ---------------------------
  async function saveTopic() {
    await supabase.from("topics").insert({
      ...newTopic,
      status: "pending",
      created_by: user.id
    });

    setModal(null);
    setNewTopic({ title: "", description: "", category: "HTML" });
  }

  // ---------------------------
  // 🟢 APPROVE TOPIC
  // ---------------------------
  async function approveTopic(id) {
    await supabase
      .from("topics")
      .update({ status: "approved" })
      .eq("id", id);

    loadTopics();
  }

  // ---------------------------
  // 🔴 REJECT TOPIC
  // ---------------------------
  async function rejectTopic(id) {
    await supabase.from("topics").delete().eq("id", id);
    loadTopics();
  }

  // ---------------------------
  // 🟡 CATEGORY
  // ---------------------------
  async function saveCategory() {
    await supabase.from("categories").insert({ name: newCategory });

    setModal(null);
    setNewCategory("");
    loadCategories();
  }

  async function removeCategory() {
    await supabase.from("categories").delete().eq("name", deleteCat);

    setModal(null);
    loadCategories();
    loadTopics();
  }

  // ---------------------------
  // 💬 ADD COMMENT
  // ---------------------------
  async function addComment(topicId) {
    await supabase.from("comments").insert({
      topic_id: topicId,
      user_id: user.id,
      content: newComment
    });

    setNewComment("");
    loadComments(topicId);
  }

  if (!user) return <p>Carregando...</p>;

  return (
    <Layout>
      <div className="base-container">

        {/* USER INFO */}
        <div style={{ marginBottom: 10 }}>
          <p><strong>Usuário:</strong> {user.email}</p>
          <p><strong>Nível:</strong> {profile?.role}</p>
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="Todas">Todas</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {(profile?.role === "admin" || profile?.role === "supervisor") && (
            <>
              <button onClick={() => setModal("topic")}>Novo Tópico</button>
              <button onClick={() => setModal("category")}>Nova Categoria</button>
              <button onClick={() => setModal("delete")}>Excluir Categoria</button>
            </>
          )}
        </div>

        {/* TOPICS */}
        {filteredTopics.map(t => (
          <div key={t.id} className="topic">

            <h2>{t.title}</h2>
            <p>{t.description}</p>

            {/* APPROVAL */}
            {(profile?.role !== "user") && (
              <>
                <button onClick={() => approveTopic(t.id)}>Aprovar</button>
                <button onClick={() => rejectTopic(t.id)}>Rejeitar</button>
              </>
            )}

            {/* COMMENTS */}
            <div>
              <button onClick={() => loadComments(t.id)}>
                Ver comentários
              </button>

              {comments[t.id]?.map(c => (
                <p key={c.id}>💬 {c.content}</p>
              ))}

              <input
                placeholder="Comentário"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />

              <button onClick={() => addComment(t.id)}>
                Enviar
              </button>
            </div>

          </div>
        ))}

        {/* MODAL TOPIC */}
        {modal === "topic" && (
          <div className="modal">
            <div className="modal-content">
              <h2>Novo Tópico</h2>

              <input
                placeholder="Título"
                onChange={(e) =>
                  setNewTopic({ ...newTopic, title: e.target.value })
                }
              />

              <input
                placeholder="Descrição"
                onChange={(e) =>
                  setNewTopic({ ...newTopic, description: e.target.value })
                }
              />

              <button onClick={saveTopic}>Salvar</button>
              <button onClick={() => setModal(null)}>Fechar</button>
            </div>
          </div>
        )}

        {/* CATEGORY MODAL */}
        {modal === "category" && (
          <div className="modal">
            <div className="modal-content">
              <h2>Nova Categoria</h2>

              <input
                onChange={(e) => setNewCategory(e.target.value)}
              />

              <button onClick={saveCategory}>Salvar</button>
              <button onClick={() => setModal(null)}>Fechar</button>
            </div>
          </div>
        )}

        {/* DELETE CATEGORY */}
        {modal === "delete" && (
          <div className="modal">
            <div className="modal-content">
              <h2>Excluir Categoria</h2>

              <select onChange={(e) => setDeleteCat(e.target.value)}>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              <button onClick={removeCategory}>Excluir</button>
              <button onClick={() => setModal(null)}>Fechar</button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
