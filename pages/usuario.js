import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Usuarios() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [usuarios, setUsuarios] = useState([]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("usuario");

  const [loading, setLoading] = useState(false);

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    if (!profileData || profileData.role !== "admin") {
      alert("Apenas admin pode acessar");
      router.push("/dashboard");
      return;
    }

    loadUsers();
  }

  async function loadUsers() {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/list-users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const json = await response.json();

      if (json.ok) {
        setUsuarios(json.users || []);
      }
    } catch (err) {
      console.error(err);
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
          password: senha,
          role
        })
      });

      const json = await response.json();

      if (!response.ok) {
        alert(json.error || "Erro ao criar usuário");
        return;
      }

      alert("Usuário criado com sucesso");

      setEmail("");
      setSenha("");
      setRole("usuario");

      loadUsers();

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function excluirUsuario(id) {
    const ok = confirm("Deseja excluir este usuário?");
    if (!ok) return;

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: id
        })
      });

      const json = await response.json();

      if (!response.ok) {
        alert(json.error || "Erro ao excluir");
        return;
      }

      loadUsers();

    } catch (err) {
      alert(err.message);
    }
  }

  if (!user || !profile) {
    return <p style={{ padding: 30 }}>Carregando...</p>;
  }

  return (
    <div className="usuarios-page">

      <div className="usuarios-header">

        <div>
          <h1>Usuários</h1>
          <p>Gerencie usuários do sistema</p>
        </div>

        <button
          className="btn-voltar"
          onClick={() => router.push("/dashboard")}
        >
          Voltar
        </button>

      </div>

      <div className="usuarios-grid">

        {/* FORM */}
        <div className="usuarios-card">

          <h2>Novo Usuário</h2>

          <form onSubmit={criarUsuario}>

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="usuario">Usuário</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            <button
              type="submit"
              className="btn-salvar"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Usuário"}
            </button>

          </form>

        </div>

        {/* LISTA */}
        <div className="usuarios-card">

          <h2>Usuários Ativos</h2>

          <div className="usuarios-lista">

            {usuarios.map((u) => (
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
                  className="btn-excluir"
                  onClick={() => excluirUsuario(u.id)}
                >
                  Excluir
                </button>

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}
