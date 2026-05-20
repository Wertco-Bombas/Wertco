// pages/dashboard.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const router = useRouter();

  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'user');
    setLoading(false);
  }

  const isPrivileged = ['admin', 'supervisor'].includes(userRole);

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando dashboard...</div>;
  }

  return (
    <div className="page">
      <div className="container">

        <div className="centerArea">

          <nav className="menuGrid">

            <Link href="/base" className="menuBtn">
              Base de Conhecimento
            </Link>

            <Link href="/treinamento" className="menuBtn">
              Treinamento
            </Link>

            {/* 🔥 SÓ ADMIN/SUPERVISOR */}
            {isPrivileged && (
              <Link href="/auditoria" className="menuBtn">
                Auditoria
              </Link>
            )}

            {/* 🔥 SÓ ADMIN/SUPERVISOR */}
            {isPrivileged && (
              <Link href="/usuario" className="menuBtn">
                Usuários
              </Link>
            )}

            <Link href="/atendimento" className="menuBtn">
              Atendimento
            </Link>

          </nav>

        </div>

      </div>
    </div>
  );
}
