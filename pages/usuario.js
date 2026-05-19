// pages/usuario.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('Token enviado (list-users):', token);

      const resp = await fetch('/api/admin/list-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let json;
      try {
        json = await resp.json();
      } catch (err) {
        console.error('Resposta não pôde ser convertida em JSON:', err);
        return;
      }

      if (!resp.ok) {
        console.error('list-users error', json);
        alert('Erro ao listar usuários: ' + (json?.error || resp.statusText));
        setUsuarios([]);
      } else {
        setUsuarios(json.users || []);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao listar usuários: ' + err.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleExcluir(userId) {
    if (!confirm('Confirma exclusão deste usuário? Esta ação é irreversível.')) return;
    setProcessingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('Token enviado (delete-user):', token);

      const resp = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      let json;
      try {
        json = await resp.json();
      } catch (err) {
        console.error('Resposta não pôde ser convertida em JSON:', err);
        return;
      }

      if (!resp.ok) {
        console.error('delete-user error', json);
        alert('Erro ao excluir usuário: ' + (json?.error || resp.statusText));
      } else {
        alert('Usuário excluído com sucesso.');
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir usuário: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">Usuários</h2>
          <div className="badge">{usuarios.length} cadastrados</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Pesquisar usuário por email..."
              className="search-bar"
              style={{ maxWidth: 420 }}
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                if (!q) return fetchUsers();
                setUsuarios(prev => prev.filter(u => (u.email || '').toLowerCase().includes(q)));
              }}
            />
            <button className="btn btnYellow" onClick={() => router.push('/novo-usuario')}>+ Novo Usuário</button>
          </div>

          <div style={{ marginTop: 18 }}>
            {loading ? (
              <div style={{ padding: 20 }}>Carregando usuários...</div>
            ) : usuarios.length === 0 ? (
              <div style={{ padding: 20 }}>Nenhum usuário ativo encontrado.</div>
            ) : (
              <table className="tableUsers" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: 13 }}>
                    <th style={{ padding: '10px 12px' }}>Email</th>
                    <th style={{ padding: '10px 12px' }}>Função</th>
                    <th style={{ padding: '10px 12px' }}>Criado em</th>
                    <th style={{ padding: '10px 12px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px' }}>
                      {u.email || u.username || '(sem identificação)'}
                      </td>
                      <td style={{ padding: '12px' }}>{u.role || 'usuário'}</td>
                      <td style={{ padding: '12px' }}>{u.created_at ? new Date(u.created_at).toLocaleString() : ''}</td>
                      <td style={{ padding: '12px' }}>
                        <button className="btn" style={{ marginRight: 8 }} onClick={() => router.push(`/usuario/${u.id}`)}>Ver</button>
                        <button
                          className="btn btnDangerOutline"
                          onClick={() => handleExcluir(u.id)}
                          disabled={processingId === u.id}
                        >
                          {processingId === u.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
