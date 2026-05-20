// pages/usuario.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

// ✅ PERMISSÃO LOCAL (SIMPLES E DIRETO)
function canAccess(role, allowed) {
  return allowed.includes(role);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // 🔐 checar role do usuário logado
  async function checkRole() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = data?.role || 'user';
    setUserRole(role);

    // 🚫 BLOQUEIO DE ACESSO
    if (!canAccess(role, ['admin', 'supervisor'])) {
      router.push('/dashboard');
    }
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch('/api/admin/list-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await resp.json();

      if (!resp.ok) {
        alert('Erro ao listar usuários: ' + (json?.error || resp.statusText));
        setUsuarios([]);
      } else {
        setUsuarios(json.users || []);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await checkRole();
      await fetchUsers();
    })();
  }, []);

  async function handleExcluir(userId) {
    if (!confirm('Confirma exclusão deste usuário?')) return;

    setProcessingId(userId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const json = await resp.json();

      if (!resp.ok) {
        alert('Erro: ' + (json?.error || resp.statusText));
      } else {
        await fetchUsers();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  // 🔐 proteção visual (evita flash de conteúdo)
  if (!canAccess(userRole, ['admin', 'supervisor'])) {
    return <div style={{ padding: 20 }}>Verificando permissões...</div>;
  }

  return (
    <div className="page">
      <div className="container">

        <div className="topicHeader">
          <h2 className="topicTitle">Usuários</h2>
          <div className="badge">{usuarios.length} cadastrados</div>
        </div>

        <div className="card">

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>

            <input
              type="text"
              placeholder="Pesquisar usuário..."
              className="search-bar"
              style={{ maxWidth: 420 }}
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                if (!q) return fetchUsers();
                setUsuarios(prev =>
                  prev.filter(u =>
                    (u.email || '').toLowerCase().includes(q)
                  )
                );
              }}
            />

            <button
              className="btn btnYellow"
              onClick={() => router.push('/novo-usuario')}
            >
              + Novo Usuário
            </button>

          </div>

          <div style={{ marginTop: 18 }}>

            {loading ? (
              <div>Carregando...</div>
            ) : usuarios.length === 0 ? (
              <div>Nenhum usuário encontrado.</div>
            ) : (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Função</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.email || u.username}</td>
                      <td>{u.role || 'user'}</td>
                      <td>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleString()
                          : ''}
                      </td>
                      <td>
                        <button onClick={() => router.push(`/usuario/${u.id}`)}>
                          Ver
                        </button>

                        <button
                          onClick={() => handleExcluir(u.id)}
                          disabled={processingId === u.id}
                        >
                          {processingId === u.id ? '...' : 'Excluir'}
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
