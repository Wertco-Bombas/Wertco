// pages/usuario.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data, error } = await supabase.from('users').select('id, email, role, created_at');
        if (!error) setUsuarios(data || []);
        else console.error(error);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">Usuários</h2>
          <div className="badge">{usuarios.length} cadastrados</div>
        </div>

        <div className="card">
          <div className="userListHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Pesquisar usuário por email..."
              className="search-bar"
              style={{ maxWidth: 420 }}
            />
            <button className="btn btnYellow" onClick={() => router.push('/novo-usuario')}>+ Novo Usuário</button>
          </div>

          <div className="userTable" style={{ marginTop: 18 }}>
            {loading ? (
              <div style={{ padding: 20 }}>Carregando usuários...</div>
            ) : usuarios.length === 0 ? (
              <div style={{ padding: 20 }}>Nenhum usuário encontrado.</div>
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
                      <td style={{ padding: '12px' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}>{u.role || 'usuário'}</td>
                      <td style={{ padding: '12px' }}>{u.created_at ? new Date(u.created_at).toLocaleString() : ''}</td>
                      <td style={{ padding: '12px' }}>
                        <button className="btn" style={{ marginRight: 8 }} onClick={() => router.push(`/usuario/${u.id}`)}>Ver</button>
                        <button className="btn btnDangerOutline" onClick={() => alert('Implementar exclusão de usuário com confirmação')}>Excluir</button>
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
