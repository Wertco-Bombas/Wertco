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

      if (session?.user) {
        setUserEmail(session.user.email || '');
      } else {
        setUserEmail('');
      }
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
    <div className="min-h-screen bg-gray-900 text-white">

      {/* HEADER GLOBAL */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* LOGO */}
          <div className="text-2xl font-bold">
            Wertco
          </div>

          {/* USER AREA */}
          <div className="flex items-center gap-3">

            <span className="text-sm text-gray-300">
              {userEmail || 'Convidado'}
            </span>

            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded"
              onClick={() => router.push('/dashboard')}
            >
              Menu
            </button>

            <button
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
              onClick={handleLogout}
            >
              Sair
            </button>

          </div>
        </div>
      </header>

      {/* CONTEÚDO DA PÁGINA */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

    </div>
  );
}
