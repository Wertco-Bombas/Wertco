import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="dashboard-container">

      {/* TOPO */}
      <div className="dashboard-top">

        <div>
          <h1 className="dashboard-title">
            Dashboard
          </h1>

          <p className="dashboard-user">
            Bem-vindo {user?.email}
          </p>
        </div>

        <button
          onClick={logout}
          className="logout-btn"
        >
          Sair
        </button>

      </div>

      {/* GRID */}
      <div className="dashboard-grid">

        <DashboardCard
          icon="📚"
          title="Base de Conhecimento"
          onClick={() => router.push("/base")}
        />

        <DashboardCard
          icon="📊"
          title="Auditoria"
          onClick={() => router.push("/auditoria")}
        />

        <DashboardCard
          icon="👥"
          title="Usuários"
          onClick={() => router.push("/usuarios")}
        />

        <DashboardCard
          icon="🎓"
          title="Treinamento"
          onClick={() => router.push("/treinamento")}
        />

        <DashboardCard
          icon="💬"
          title="Atendimento"
          onClick={() => router.push("/atendimento")}
        />

        <DashboardCard
          icon="🔔"
          title="Avisos"
          onClick={() => router.push("/avisos")}
        />

      </div>

    </div>
  );
}

function DashboardCard({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="dashboard-card"
    >
      <div className="dashboard-icon">
        {icon}
      </div>

      <span>
        {title}
      </span>
    </button>
  );
}
