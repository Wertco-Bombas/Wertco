import { useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });
    const data = await res.json();
    if (data.success) {
      // Após login, vai para o dashboard
      window.location.href = "/dashboard";
    } else {
      alert("Usuário ou senha inválidos");
    }
  }

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Usuário"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
