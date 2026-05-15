import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Usuário cadastrado com sucesso!");
    } else {
      setMessage(data.error || "Erro ao cadastrar");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Login realizado com sucesso!");
    } else {
      setMessage(data.error || "Usuário ou senha inválidos");
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial" }}>
      <h1>Login / Cadastro</h1>
      <form>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <button onClick={handleLogin} style={{ marginRight: "10px" }}>
          Login
        </button>
        <button onClick={handleRegister}>Cadastrar</button>
      </form>
      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </div>
  );
}
