import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";


export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  
  async function handleLogin(e) {
    e.preventDefault();

    setMessage("Entrando...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    // pega usuário logado
    const user = data.user;

    if (!user) {
      setMessage("Erro ao autenticar usuário");
      return;
    }

    // busca perfil (role depois vamos usar)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setMessage("Usuário sem perfil");
      return;
    }

    // redireciona conforme sistema
    router.push("/base");
  }

  return (
    <div className="login-container">
      <div className="login-box">

        <h1 className="login-title">Entrar</h1>

        <form onSubmit={handleLogin}>

          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-button">
            Entrar
          </button>

        </form>

        {message && <p className="login-message">{message}</p>}

      </div>
    </div>
  );
}
