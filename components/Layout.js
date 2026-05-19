// components/Layout.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Layout({ children }) {
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (mounted && session?.user) {
          setUserEmail(session.user.email || '');
          setUserId(session.user.id || null);
        }
      } catch (err) {
        console.error('Erro ao obter sessão:', err);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUserEmail(session.user.email || '');
        setUserId(session.user.id || null);
      } else {
        setUserEmail('');
        setUserId(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <>
      <header className="topbar" aria-hidden>
        <div className="logo">
          <div className="logoText">Wertco</div>
        </div>
      </header>

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
