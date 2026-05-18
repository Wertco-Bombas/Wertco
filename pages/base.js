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
  // 📦 LOAD DATA
  // ---------------------------
  useEffect(() => {
    loadTopics();
    loadCategories();
  }, []);

  async function loadTopics() {
    const { data } = await supabase
      .from("topics")
      .select("*")
      .eq("status", "approved")
      .order("id", { ascending: false });

    setTopics(data || []);
  }

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }

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
    if (!user) return;

    await supabase.from("topics").insert({
      ...newTopic,
      status: "pending",
      created_by: user.id
    });

    setNewTopic({ title: "", description: "", category: "HTML" });

    loadTopics();
  }

  // ---------------------------
  // 🟢 APPROVE
  // ---------------------------
  async function approveTopic(id) {
    await supabase
      .from("topics")
      .update({ status: "approved" })
      .eq("id", id);

    loadTopics();
  }

  // ---------------------------
  // 🔴 REJECT
  // ---------------------------
  async function rejectTopic(id) {
    await supabase.from("topics").delete().eq("id", id);

    loadTopics();
  }

  // ---------------------------
  // 🟡 CATEGORY
  // ---------------------------
  async function saveCategory() {
    await supabase.from("categories").insert({
      name: newCategory
    });

    setNewCategory("");
    loadCategories();
  }

  async function removeCategory() {
    await supabase.from("categories").delete().eq("name", deleteCat);

    loadCategories();
    loadTopics();
  }

  // ---------------------------
  // 💬 COMMENTS (FIX IMPORTANTE)
  // ---------------------------
  async function addComment(topicId) {
    if (!newComment) return;

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

          <input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="Todas">Todas</option>
            {categories.map((c, i) => (
              <option key={i} value={c.name}>{c.name}</option>
            ))}
          </select>

          {(profile?.role === "admin" || profile?.role === "supervisor") && (
            <>
              <button onClick={() => router.push("/novo-topico")}>
                Novo Tópico
              </button>

              <button onClick={() => router.push("/nova-categoria")}>
                Nova Categoria
              </button>

              <button onClick={() => router.push("/excluir-categoria")}>
                Excluir Categoria
              </button>
            </>
          )}
        </div>

        {/* TOPICS */}
        {filteredTopics.map(t => (
          <div key={t.id} className="topic">

            <h2>{t.title}</h2>
            <p>{t.description}</p>

            {(profile?.role !== "user") && (
              <>
                <button onClick={() => approveTopic(t.id)}>Aprovar</button>
                <button onClick={() => rejectTopic(t.id)}>Rejeitar</button>
              </>
            )}

            {/* COMMENTS FIX */}
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

      </div>
    </Layout>
  );
}
