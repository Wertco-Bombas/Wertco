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

      // 2. Pegar usuário de forma segura
      const user = data?.user;

      if (!user) {
        setLoading(false);
        alert(
          "Usuário criado no Auth, mas não retornado. Verifique email confirmation no Supabase."
        );
        return;
      }

      // 3. Evitar duplicação de profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: email,
            role: role,
          });

        if (profileError) {
          setLoading(false);
          alert(
            "Usuário criado, mas erro ao criar perfil: " +
              profileError.message
          );
          return;
        }
      }

      setLoading(false);

      alert("Usuário criado com sucesso!");

      setEmail("");
      setPassword("");
      setRole("user");
    } catch (err) {
      setLoading(false);
      alert("Erro inesperado: " + err.message);
    }
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
