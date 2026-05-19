// pages/login.js
import { useState } from 'react';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password })
    });

    const json = await resp.json();
    if (json.success) {
      // redireciona conforme papel
      if (json.role === 'Admin') window.location.href = '/dashboard';
      else if (json.role === 'Supervisor') window.location.href = '/auditoria';
      else window.location.href = '/base';
    } else {
      setError('Usuário ou senha inválidos');
    }
  }

  return (
    <div className="page container centerArea">
      <form onSubmit={handleSubmit} className="formStack card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 className="topicTitle">Login</h1>

        <label className="formLabel">Usuário</label>
        <input
          type="text"
          className="formInput"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <label className="formLabel">Senha</label>
        <input
          type="password"
          className="formInput"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

        <button type="submit" className="btn btnYellow">Entrar</button>
      </form>
    </div>
  );
}
