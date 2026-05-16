import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/base"); // vai direto para a página principal
    } else {
      setMessage(data.error || "Usuário ou senha inválidos");
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Entrar</h1>
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Usuário</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

          <button type="submit" className="login-button">Entrar</button>
        </form>
        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}
