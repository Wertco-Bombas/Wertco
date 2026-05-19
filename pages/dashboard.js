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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user?.email) setUserEmail(session.user.email);
      else setUserEmail('');
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <div className="page">
      <div className="container">

        {/* Topbar (logo only) */}
        <div className="topbar" aria-hidden>
          <div className="logo">
            <div className="logoBox">W</div>
            <div className="logoText">Wertco</div>
          </div>
        </div>

        {/* Fixed user info + logout at top-right */}
        <div className="userInfo" role="region" aria-label="Informações do usuário">
          {userEmail ? (
            <div className="userEmail" title={userEmail}>{userEmail}</div>
          ) : (
            <div className="userEmail">Convidado</div>
          )}
          <button className="logoutBtn" onClick={handleLogout}>Sair</button>
        </div>

        {/* Five yellow buttons that navigate to the pages (no leading letters) */}
        <nav className="menuGrid" role="navigation" aria-label="Menu principal">
          <Link href="/base" className="menuBtn" aria-label="Base de Conhecimento">
            <div>Base de Conhecimento</div>
          </Link>

          <Link href="/treinamento" className="menuBtn" aria-label="Treinamento">
            <div>Treinamento</div>
          </Link>

          <Link href="/auditoria" className="menuBtn" aria-label="Auditoria">
            <div>Auditoria</div>
          </Link>

          <Link href="/usuario" className="menuBtn" aria-label="Usuários">
            <div>Usuários</div>
          </Link>

          <Link href="/atendimento" className="menuBtn" aria-label="Atendimento">
            <div>Atendimento</div>
          </Link>
        </nav>

        {/* Empty content area (welcome text removed) */}
        <div className="card" aria-hidden>
          {/* Intentionally left blank */}
        </div>
      </div>
    </div>
  );
}
