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
    const { data, error } = await supabase.auth.getUser();
    const userData = data?.user;

    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(userData);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.id)
      .single();

    setProfile(profileData);

    loadUsers();
  }

  async function loadUsers() {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

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
    <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1>Usuários</h1>
          <p>Logado: {user.email}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {profile?.role === 'admin' && (
            <button onClick={() => router.push('/novo-usuario')}>
              + Novo Usuário
            </button>
          )}

          <button onClick={() => router.push('/dashboard')}>
            Dashboard
          </button>

          <button onClick={logout}>
            Sair
          </button>
        </div>
      </div>

      <table border="1" width="100%" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Usuário</th>
            <th>Função</th>
            <th>Criado em</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.username || '-'}</td>
              <td>{u.role}</td>
              <td>{u.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
