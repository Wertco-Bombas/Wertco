import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";

export default function Usuarios() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Buscar usuários já cadastrados
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role");
      if (!error) {
        setUsers(data);
      }
    }
    fetchUsers();
  }, []);

  async function createUser() {
    if (!email || !password) {
      alert("Preencha email e senha");
      return;
    }

    setLoading(true);

    try {
      // 1. Criar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        alert("Erro ao criar usuário: " + error.message);
        return;
      }

      const user = data?.user;

      if (!user) {
        setLoading(false);
        alert(
          "Usuário criado no Auth, mas não retornado. Verifique email confirmation no Supabase."
        );
        return;
      }

      // 2. Evitar duplicação de profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          email: email,
          role: role,
        });

        if (profileError) {
          setLoading(false);
          alert(
            "Usuário criado, mas erro ao criar perfil: " + profileError.message
          );
          return;
        }
      }

      setLoading(false);
      alert("Usuário criado com sucesso!");

      setEmail("");
      setPassword("");
      setRole("user");

      // Atualizar lista
      const { data: updatedUsers } = await supabase
        .from("profiles")
        .select("id, email, role");
      setUsers(updatedUsers);
    } catch (err) {
      setLoading(false);
      alert("Erro inesperado: " + err.message);
    }
  }

  async function deleteUser(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    // Excluir do profiles
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir perfil: " + error.message);
      return;
    }

    // Atualizar lista
    const { data: updatedUsers } = await supabase
      .from("profiles")
      .select("id, email, role");
    setUsers(updatedUsers);

    alert("Usuário excluído com sucesso!");
  }

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <h2>👤 Criar Usuário</h2>

          <div className="searchBar">
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input"
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            <button
              className="btn btnYellow"
              onClick={createUser}
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>📋 Usuários cadastrados</h2>
          {users.length === 0 ? (
            <p className="description">Nenhum usuário encontrado.</p>
          ) : (
            <ul>
              {users.map((u) => (
                <li key={u.id} className="comment">
                  <div className="commentTop">
                    <strong>{u.email}</strong> — <span>{u.role}</span>
                  </div>
                  <div className="actions">
                    <button
                      className="smallBtn reject"
                      onClick={() => deleteUser(u.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
