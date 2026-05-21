```javascript
// pages/usuarios.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Usuarios() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    loadUsers();
  }

  async function loadUsers() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    const response = await fetch('/api/admin/list-users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const json = await response.json();

    if (json?.users) {
      setUsuarios(json.users);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!user) {
    return <p style={{ padding: 30 }}>Carregando...</p>;
  }

  return (
    <div
      style={{
        padding: 30,
        maxWidth: 1400,
        margin: '0 auto'
      }}
    >
      {/* TOPO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 40
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>
            Usuários
          </h1>

          <p style={{ opacity: 0.7 }}>
            Logado como {user?.email}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>

          {(profile?.role === 'admin') && (
            <button
              onClick={() => router.push('/novo-usuario')}
              style={buttonStyle}
            >
              + Novo Usuário
            </button>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            style={menuButton}
          >
            Dashboard
          </button>

          <button
            onClick={logout}
            style={logoutButton}
          >
            Sair
          </button>

        </div>
      </div>

      {/* TABELA */}
      <div
        style={{
          background: '#1f1f1f',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #333'
        }}
      >

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead
            style={{
              background: '#2a2a2a'
            }}
          >
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Usuário</th>
              <th style={thStyle}>Função</th>
              <th style={thStyle}>Criado em</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u) => (
              <tr
                key={u.id}
                style={{
                  borderTop: '1px solid #333'
                }}
              >
                <td style={tdStyle}>
                  {u.email}
                </td>

                <td style={tdStyle}>
                  {u.username || '-'}
                </td>

                <td style={tdStyle}>
                  {u.role}
                </td>

                <td style={tdStyle}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

const thStyle = {
  padding: 16,
  textAlign: 'left',
  color: '#FFD700',
  fontSize: 14
};

const tdStyle = {
  padding: 16,
  fontSize: 15
};

const buttonStyle = {
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#FFD700',
  color: '#000',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const menuButton = {
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#444',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const logoutButton = {
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#d32f2f',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
};
```
