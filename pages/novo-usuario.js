// components/NovoUsuario.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NovoUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Sessão inválida ou expirada. Faça login novamente.');
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
        alert('Erro ao criar usuário: ' + (json?.error || resp.statusText));
      } else {
        alert(json.existed ? 'Usuário já existia, perfil atualizado.' : 'Usuário criado com sucesso.');
        router.push('/usuario');
      }
    } catch (err) {
      alert('Erro ao criar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h2>Novo Usuário</h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Função</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="usuario">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btnYellow" type="submit" disabled={loading}>
            {loading ? 'Processando...' : 'Criar'}
          </button>
        </form>
      </div>
    </div>
  );
}
