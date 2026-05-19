// components/Layout.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

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

  function goToDashboard() {
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">Wertco</div>

            {/* Botões só aparecem na rota /base */}
            {router.pathname === '/base' && (
              <nav className="flex gap-3">
                <Link href="/novo-topico">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
                    + Novo Tópico
                  </button>
                </Link>
                <Link href="/nova-categoria">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">
                    + Nova Categoria
                  </button>
                </Link>
                <Link href="/excluir-categoria">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">
                    Excluir Categoria
                  </button>
                </Link>
              </nav>
            )}
          </div>

          {/* Informações do usuário e botões só aparecem fora da tela de login */}
          {router.pathname !== '/login' && (
            <div className="flex items-center gap-3">
              {userEmail ? (
                <span className="text-sm text-gray-300">{userEmail}</span>
              ) : (
                <span className="text-sm text-gray-400">Convidado</span>
              )}
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded"
                onClick={goToDashboard}
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
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
