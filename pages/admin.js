import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [pendingTopics, setPendingTopics] = useState([]);
  const [logs, setLogs] = useState([]);

  // 🔐 AUTH CHECK
  useEffect(() => {
    async function load() {
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

      // 🚨 só admin/supervisor pode entrar
      if (!profileData || !["admin", "supervisor"].includes(profileData.role)) {
        router.push("/base");
        return;
      }
    }

    load();
  }, []);

  // 📊 LOAD PENDING TOPICS
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

  // 📊 LOAD AUDIT LOG
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

  // ✔ APROVAR TOPIC
  async function approveTopic(id) {
    await supabase
      .from("topics")
      .update({ status: "approved" })
      .eq("id", id);

    await supabase.from("audit_log").insert({
      action: "APPROVE_TOPIC",
      table_name: "topics",
      record_id: String(id),
      user_id: user.id
    });

    setPendingTopics(pendingTopics.filter(t => t.id !== id));
  }

  // ❌ REJEITAR TOPIC
  async function rejectTopic(id) {
    await supabase
      .from("topics")
      .delete()
      .eq("id", id);

    await supabase.from("audit_log").insert({
      action: "REJECT_TOPIC",
      table_name: "topics",
      record_id: String(id),
      user_id: user.id
    });

    setPendingTopics(pendingTopics.filter(t => t.id !== id));
  }

  if (!user) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 20 }}>

      <h1>🔐 Painel Administrativo</h1>

      {/* TOPICS PENDENTES */}
      <h2>📌 Tópicos Pendentes</h2>

      {pendingTopics.length === 0 && <p>Nenhum tópico pendente</p>}

      {pendingTopics.map(t => (
        <div key={t.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{t.title}</h3>
          <p>{t.description}</p>
          <p><strong>Categoria:</strong> {t.category}</p>

          <button onClick={() => approveTopic(t.id)}>✔ Aprovar</button>
          <button onClick={() => rejectTopic(t.id)}>❌ Rejeitar</button>
        </div>
      ))}

      {/* AUDITORIA */}
      <h2 style={{ marginTop: 40 }}>📊 Auditoria</h2>

      {logs.map(log => (
        <div key={log.id} style={{ borderBottom: "1px solid #eee", padding: 5 }}>
          <p>
            <strong>{log.action}</strong> → {log.table_name} → {log.record_id}
          </p>
          <small>{log.created_at}</small>
        </div>
      ))}

    </div>
  );
}
