import { useState } from "react";

export default function Users() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  async function createUser() {
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (data.error) {
      alert("Erro ao criar usuário");
    } else {
      alert("Usuário criado!");
    }
  }

  return (
    <div>
      <h1>Usuários</h1>

      <input placeholder="email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="senha" type="password" onChange={e => setPassword(e.target.value)} />

      <select onChange={e => setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="supervisor">Supervisor</option>
        <option value="admin">Admin</option>
      </select>

      <button onClick={createUser}>Criar usuário</button>
    </div>
  );
}
