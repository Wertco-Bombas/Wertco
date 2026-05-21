// components/NovoUsuario.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function NovoUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Sessão inválida');
        setLoading(false);
        return;
      }

      const resp = await fetch('/api/admin/create-or-get-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, role })
      });

      const json = await resp.json();

      if (!resp.ok) {
        alert(json?.error || 'Erro ao criar usuário');
      } else {
        alert(
          json.existed
            ? 'Usuário já existia, atualizado.'
            : 'Usuário criado com sucesso.'
        );

        router.push('/usuario');
      }

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="base-container">

      <div className="topbar">
        <div className="topbar-left">
          <h2>Novo Usuário</h2>
        </div>
      </div>

      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        <form onSubmit={handleSubmit}>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <label>Função</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
          </select>

          <button className="btn btnYellow" disabled={loading}>
            {loading ? 'Processando...' : 'Criar Usuário'}
          </button>

        </form>

      </div>
    </div>
  );
}
