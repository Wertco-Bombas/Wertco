import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [pendingTopics, setPendingTopics] = useState([]);
  const [logs, setLogs] = useState([]);

  // =========================
  // AUTH CHECK
  // =========================
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
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/base");
        return;
      }

      setProfile(profileData);

      if (!["admin", "supervisor"].includes(profileData.role)) {
        router.push("/base");
        return;
      }
    }

    load();
  }, []);

  // =========================
  // LOAD TOPICOS PENDENTES
  // =========================
  useEffect(() => {
    async function loadPending() {
      const { data } = await supabase
        .from("topicos")
        .select("*")
        .eq("approved", false)
        .order("id", { ascending: false });

      setPendingTopics(data || []);
    }

    loadPending();
  }, []);

  // =========================
  // LOAD AUDITORIA
  // =========================
  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from("auditoria")
        .select("*")
        .order("created_at", { ascending: false });

      setLogs(data || []);
    }

    loadLogs();
  }, []);

  // =========================
  // APROVAR TOPICO
  // =========================
  async function approveTopic(id) {
    await supabase
      .from("topicos")
      .update({ approved: true })
      .eq("id", id);

    await supabase.from("auditoria").insert({
      acao: "APPROVE_TOPICO",
      entidade: "topicos",
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { topico_id: id },
      status: "success"
    });

    setPendingTopics(pendingTopics.filter(t => t.id !== id));
  }

  // =========================
  // REJEITAR TOPICO
  // =========================
  async function rejectTopic(id) {
    await supabase
      .from("topicos")
      .delete()
      .eq("id", id);

    await supabase.from("auditoria").insert({
      acao: "REJECT_TOPICO",
      entidade: "topicos",
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { topico_id: id },
      status: "success"
    });

    setPendingTopics(pendingTopics.filter(t => t.id !== id));
  }

  // =========================
  // LOADING
  // =========================
  if (!user || !profile) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 20 }}>

      <h1>🔐 Painel Administrativo</h1>

      {/* TOPICOS PENDENTES */}
      <h2>📌 Tópicos Pendentes</h2>

      {pendingTopics.length === 0 && <p>Nenhum tópico pendente</p>}

      {pendingTopics.map(t => (
        <div key={t.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{t.titulo}</h3>
          <p>{t.conteudo}</p>

          <button onClick={() => approveTopic(t.id)}>✔ Aprovar</button>
          <button onClick={() => rejectTopic(t.id)}>❌ Rejeitar</button>
        </div>
      ))}

      {/* AUDITORIA */}
      <h2 style={{ marginTop: 40 }}>📊 Auditoria</h2>

      {logs.map(log => (
        <div key={log.id} style={{ borderBottom: "1px solid #eee", padding: 5 }}>
          <p>
            <strong>{log.acao}</strong> → {log.entidade}
          </p>
          <small>{log.created_at}</small>
        </div>
      ))}

    </div>
  );
}
