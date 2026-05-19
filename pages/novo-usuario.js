import { useState } from 'react';

export default function NovoUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario'); // 👈 inicializa role

  async function handleSubmit(e) {
    e.preventDefault();
    const resp = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const json = await resp.json();
    if (!resp.ok) {
      alert('Erro: ' + (json.error || resp.statusText));
    } else {
      alert(`Usuário criado com papel ${json.role}`);
      setEmail('');
      setPassword('');
      setRole('usuario');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Criar novo usuário</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        >
          <option value="usuario">Usuário</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Criar usuário</button>
      </form>
    </div>
  );
}
