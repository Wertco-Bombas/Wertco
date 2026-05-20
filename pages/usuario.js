// pages/usuario.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

// 🔐 PERMISSÃO LOCAL
function canAccess(role, allowed) {
  return allowed.includes(role);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosBase, setUsuariosBase] = useState([]); // 👈 base original (IMPORTANTE)
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // 🔐 checar permissões
  async function checkRole() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push('/login');
      return false;
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = data?.role || 'user';
    setUserRole(role);

    if (!canAccess(role, ['admin', 'supervisor'])) {
      router.push('/dashboard');
      return false;
    }

    return true;
  }

  // 🔥 LISTAR USUÁRIOS
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
        setUsuariosBase([]);
      } else {
        const users = json.users || [];
        setUsuarios(users);
        setUsuariosBase(users); // 👈 guarda base original
      }

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await checkRole();
      if (ok) await fetchUsers();
    })();
  }, []);

  // 🔍 SEARCH CORRIGIDO
  function handleSearch(value) {
    const q = value.toLowerCase();

    if (!q) {
      setUsuarios(usuariosBase);
      return;
    }

    const filtered = usuariosBase.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );

    setUsuarios(filtered);
  }

  // 🗑 DELETE USER
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

  // 🔐 proteção visual
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

          {/* SEARCH + BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>

            <input
              type="text"
              placeholder="Pesquisar usuário por email ou username..."
              className="search-bar"
              style={{ maxWidth: 420 }}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <button
              className="btn btnYellow"
              onClick={() => router.push('/novo-usuario')}
            >
              + Novo Usuário
            </button>

          </div>

          {/* TABLE */}
          <div style={{ marginTop: 18 }}>

            {loading ? (
              <div>Carregando...</div>
            ) : usuarios.length === 0 ? (
              <div>Nenhum usuário encontrado.</div>
            ) : (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Email / Username</th>
                    <th>Função</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>
                        {u.username || u.email || '(sem identificação)'}
                      </td>
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
