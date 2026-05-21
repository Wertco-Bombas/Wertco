import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Usuarios() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  const [usuarios, setUsuarios] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("usuario");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = profile?.role || "usuario";

    setRole(userRole);

    if (!["admin", "supervisor"].includes(userRole)) {
      router.push("/dashboard");
      return;
    }

    loadUsers(session.access_token);
  }

  async function loadUsers(token) {
    const response = await fetch("/api/admin/list-users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const json = await response.json();

    if (json.ok) {
      setUsuarios(json.users || []);
    }
  }

  async function criarUsuario(e) {
    e.preventDefault();

    setLoading(true);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/create-or-get-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          password,
          role: newRole
        })
      });

      const json = await response.json();

      if (!response.ok) {
        alert(json.error || "Erro");
        return;
      }

      alert("Usuário criado");

      setEmail("");
      setPassword("");
      setNewRole("usuario");

      loadUsers(session.access_token);

    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  async function excluirUsuario(userId) {
    const ok = confirm("Excluir usuário?");

    if (!ok) return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const response = await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    });

    const json = await response.json();

    if (!response.ok) {
      alert(json.error || "Erro");
      return;
    }

    loadUsers(session.access_token);
  }

  return (
    <div className="usuarios-page">

      {/* HEADER */}
      <div className="usuarios-header">

        <div>
          <h1>Usuários</h1>
          <p>
            Gerenciamento de usuários do sistema
          </p>
        </div>

        <button
          className="btn-voltar"
          onClick={() => router.push("/dashboard")}
        >
          Voltar
        </button>

      </div>

      {/* FORM */}
      <div className="usuarios-card">

        <h2>Criar Usuário</h2>

        <form onSubmit={criarUsuario} className="usuarios-form">

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          >
            <option value="usuario">Usuário</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="btn-criar"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar Usuário"}
          </button>

        </form>

      </div>

      {/* LISTA */}
      <div className="usuarios-card">

        <h2>Usuários Ativos</h2>

        <div className="usuarios-list">

          {usuarios.map(u => (
            <div
              key={u.id}
              className="usuario-item"
            >

              <div>
                <strong>{u.email}</strong>

                <p>
                  {u.role}
                </p>
              </div>

              <button
                className="btn-delete"
                onClick={() => excluirUsuario(u.id)}
              >
                Excluir
              </button>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}
