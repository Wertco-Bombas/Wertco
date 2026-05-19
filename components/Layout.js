// components/Layout.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Layout({ children }) {
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
    <>
      <header className="topbar">
        <div className="logo">
          {/* Removido o "W" separado — apenas Wertco */}
          <div className="logoText">Wertco</div>
        </div>
      </header>

      {/* userInfo fixo no topo direito (aparece em todas as páginas) */}
      <div className="userInfo" role="region" aria-label="Informações do usuário">
        {userEmail ? (
          <div className="userEmail" title={userEmail}>{userEmail}</div>
        ) : (
          <div className="userEmail">Convidado</div>
        )}
        <button className="logoutBtn" onClick={handleLogout}>Sair</button>
      </div>

      <main>{children}</main>
    </>
  );
}
