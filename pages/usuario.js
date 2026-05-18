import { useState } from "react";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";

export default function Users() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  async function createUser() {
    if (!email || !password) {
      alert("Preencha email e senha");
      return;
    }

    setLoading(true);

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

    const user = data.user;

    if (!user) {
      setLoading(false);
      alert("Usuário não retornado pelo Auth");
      return;
    }

    // 2. Criar perfil com role
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: email,
        role: role,
      });

    setLoading(false);

    if (profileError) {
      alert("Usuário criado, mas erro no perfil: " + profileError.message);
      return;
    }

    alert("Usuário criado com sucesso!");

    setEmail("");
    setPassword("");
    setRole("user");
  }

  return (
    <Layout>
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
    </Layout>
  );
}
