import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (mounted && session?.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch (err) {
        console.error('Erro ao obter sessão:', err);
      }
    }
    loadSession();
    // opcional: escutar mudanças de sessão
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) setUserEmail(session.user.email);
      else setUserEmail('');
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="page">
      <div className="container">

        {/* Topbar */}
        <div className="topbar">
          <div className="logo">
            <div className="logoBox">W</div>
            <div className="logoText">Wertco</div>
          </div>
        </div>

        {/* User info + logout fixed top-right (uses .userInfo from CSS) */}
        <div className="userInfo" aria-hidden={false}>
          {userEmail && <div className="userEmail" title={userEmail}>{userEmail}</div>}
          <button className="logoutBtn" onClick={handleLogout}>Sair</button>
        </div>

        {/* Menu buttons (excludes Dashboard) */}
        <div className="menuGrid" role="navigation" aria-label="Menu principal">
          <Link href="/base" className="menuBtn" aria-label="Base de Conhecimento">
            <div className="icon">B</div>
            <div>Base de Conhecimento</div>
          </Link>

          <Link href="/treinamento" className="menuBtn" aria-label="Treinamento">
            <div className="icon">T</div>
            <div>Treinamento</div>
          </Link>

          <Link href="/auditoria" className="menuBtn" aria-label="Auditoria">
            <div className="icon">A</div>
            <div>Auditoria</div>
          </Link>

          <Link href="/usuario" className="menuBtn" aria-label="Usuários">
            <div className="icon">U</div>
            <div>Usuários</div>
          </Link>
        </div>

        {/* Conteúdo principal */}
        <div className="card">
          <h1 className="topicTitle">Bem-vindo ao Dashboard!</h1>
          <p className="description">Clique em um dos botões acima para acessar a seção desejada.</p>
        </div>

      </div>
    </div>
  );
}
