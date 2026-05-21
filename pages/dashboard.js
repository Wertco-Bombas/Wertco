import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingTopics, setPendingTopics] = useState([]);
  const [logs, setLogs] = useState([]);

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

  useEffect(() => {
    async function loadPending() {
      const { data } = await supabase
        .from("topics")
        .select("*")
        .eq("status", "pending");

      setPendingTopics(data || []);
    }

    loadPending();
  }, []);

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
      <h1>Dashboard</h1>

      <h2>📌 Pendentes</h2>

      {pendingTopics.map(t => (
        <div key={t.id}>
          <h3>{t.title}</h3>
          <button onClick={() => approveTopic(t.id)}>Aprovar</button>
          <button onClick={() => rejectTopic(t.id)}>Rejeitar</button>
        </div>
      ))}

      <h2>📊 Logs</h2>

      {logs.map(l => (
        <div key={l.id}>
          {l.action} - {l.created_at}
        </div>
      ))}
    </div>
  );
}
