import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (mounted && session?.user) {
        setUserEmail(session.user.email || '');
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUserEmail(session?.user?.email || '');
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="base-container">

      {/* HEADER */}
      <div className="topbar">

        <div className="topbar-left">
          <h2>Wertco</h2>
        </div>

        <div className="topbar-right">

          <span className="user-email">
            {userEmail || 'Convidado'}
          </span>

          <button onClick={() => router.push('/base')}>
            Menu
          </button>

          <button onClick={handleLogout}>
            Sair
          </button>

        </div>

      </div>

      {/* CONTEÚDO */}
      <div>
        {children}
      </div>

    </div>
  );
}
