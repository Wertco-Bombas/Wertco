// pages/dashboard.js
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadRole();
  }, []);

  async function loadRole() {
    const { data: { session } } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setUserRole(data?.role || 'user');
  }

  const isPrivileged = ['admin', 'supervisor'].includes(userRole);

  return (
    <div className="page">
      <div className="container">
        <div className="centerArea">

          <nav className="menuGrid" role="navigation" aria-label="Menu principal">

            {/* BASE - TODOS */}
            <Link href="/base" className="menuBtn">
              <div>Base de Conhecimento</div>
            </Link>

            {/* TREINAMENTO - TODOS */}
            <Link href="/treinamento" className="menuBtn">
              <div>Treinamento</div>
            </Link>

            {/* AUDITORIA - PRIVILEGIADOS */}
            {isPrivileged && (
              <Link href="/auditoria" className="menuBtn">
                <div>Auditoria</div>
              </Link>
            )}

            {/* USUÁRIOS - PRIVILEGIADOS */}
            {isPrivileged && (
              <Link href="/usuario" className="menuBtn">
                <div>Usuários</div>
              </Link>
            )}

            {/* ATENDIMENTO - TODOS */}
            <Link href="/atendimento" className="menuBtn">
              <div>Atendimento</div>
            </Link>

          </nav>

        </div>

        <div className="card" aria-hidden>
          {/* Intencionalmente vazio */}
        </div>

      </div>
    </div>
  );
}
