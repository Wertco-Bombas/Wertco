import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.email) {
        setUserEmail(data.session.user.email);
      }
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login'; // volta para tela de login
  }

  return (
    <div className="page">
      <div className="container">

        {/* Topbar com logo, nome do usuário e botão sair */}
        <div className="topbar">
          <div className="logo">
            <div className="logoBox">W</div>
            <div className="logoText">Wertco</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {userEmail && <span style={{ color: 'var(--yellow)', fontWeight: '600' }}>{userEmail}</span>}
            <button className="navBtn" onClick={handleLogout}>Sair</button>
          </div>
        </div>

        {/* Navegação com botões */}
        <div className="nav">
          <Link href="/dashboard" className="navBtn">Dashboard</Link>
          <Link href="/base" className="navBtn">Base de Conhecimento</Link>
          <Link href="/treinamento" className="navBtn">Treinamento</Link>
          <Link href="/auditoria" className="navBtn">Auditoria</Link>
          <Link href="/usuario" className="navBtn">Usuários</Link>
        </div>

        {/* Conteúdo principal */}
        <div className="card">
          <h1 className="topicTitle">Bem-vindo ao Dashboard!</h1>
          <p className="description">Escolha uma opção nos botões acima para navegar.</p>
        </div>

      </div>
    </div>
  );
}
