import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingTopics, setPendingTopics] = useState([]);
  const [logs, setLogs] = useState([]);

  // AUTH
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      if (!profileData || !["admin", "supervisor"].includes(profileData.role)) {
        router.push("/base");
      }
    }

    load();
  }, []);

  // LOAD TOPICS
  useEffect(() => {
    async function loadPending() {
      const { data } = await supabase
        .from("topics")
        .select("*")
        .eq("status", "pending")
        .order("id", { ascending: false });

      setPendingTopics(data || []);
    }

    loadPending();
  }, []);

  // LOAD LOGS
  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      setLogs(data || []);
    }

    loadLogs();
  }, []);

  // ACTIONS
  async function approveTopic(id) {
    await supabase.from("topics").update({ status: "approved" }).eq("id", id);
    setPendingTopics(prev => prev.filter(t => t.id !== id));
  }

  async function rejectTopic(id) {
    await supabase.from("topics").delete().eq("id", id);
    setPendingTopics(prev => prev.filter(t => t.id !== id));
  }

  if (!user) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 20 }}>

      <h1>🔐 Painel Administrativo</h1>

      {/* ================= MENU ================= */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>

        <button onClick={() => router.push("/base")}>
          📚 Base de Conhecimento
        </button>

        <button onClick={() => router.push("/auditoria")}>
          📊 Auditoria
        </button>

        <button onClick={() => router.push("/usuarios")}>
          👤 Usuários
        </button>

        <button onClick={() => router.push("/treinamento")}>
          🎓 Treinamento
        </button>

        <button onClick={() => router.push("/atendimento")}>
          💬 Atendimento
        </button>

      </div>

      {/* ================= TOPICS ================= */}
      <h2>📌 Tópicos Pendentes</h2>

      {pendingTopics.length === 0 && <p>Nenhum tópico pendente</p>}

      {pendingTopics.map(t => (
        <div key={t.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{t.title}</h3>
          <p>{t.description}</p>

          <button onClick={() => approveTopic(t.id)}>✔ Aprovar</button>
          <button onClick={() => rejectTopic(t.id)}>❌ Rejeitar</button>
        </div>
      ))}

      {/* ================= AUDIT ================= */}
      <h2 style={{ marginTop: 40 }}>📊 Auditoria</h2>

      {logs.map(log => (
        <div key={log.id} style={{ borderBottom: "1px solid #eee", padding: 5 }}>
          <strong>{log.action}</strong> → {log.table_name}
        </div>
      ))}

    </div>
  );
}
