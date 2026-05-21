// pages/dashboard.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Dashboard() {

  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState('usuario');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setRole(profile?.role || 'usuario');
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (

    <div className="dashboard-container">

      {/* TOPO */}
      <div className="dashboard-topbar">

        <div>
          <h1 className="dashboard-title">
            Dashboard
          </h1>
        </div>

        <div className="dashboard-user-area">

          <span className="dashboard-user">
            {user?.email}
          </span>

          <button
            className="dashboard-logout"
            onClick={logout}
          >
            Sair
          </button>

        </div>

      </div>

      {/* GRID */}
      <div className="dashboard-grid">

        <button onClick={() => router.push('/base')}>
          Base de Conhecimento
        </button>

        <button onClick={() => router.push('/auditoria')}>
          Auditoria
        </button>

        <button onClick={() => router.push('/usuarios')}>
          Usuários
        </button>

        <button onClick={() => router.push('/treinamento')}>
          Treinamento
        </button>

        <button onClick={() => router.push('/atendimento')}>
          Atendimento
        </button>

        <button onClick={() => router.push('/avisos')}>
          Avisos
        </button>

      </div>

      <style jsx>{`

        .dashboard-container{
          min-height:100vh;
          background:#111827;
          color:white;
          padding:40px;
        }

        .dashboard-topbar{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:50px;
        }

        .dashboard-title{
          font-size:38px;
          font-weight:bold;
          margin:0;
        }

        .dashboard-user-area{
          display:flex;
          align-items:center;
          gap:15px;
        }

        .dashboard-user{
          font-size:15px;
          color:#d1d5db;
        }

        .dashboard-logout{
          background:#dc2626;
          border:none;
          color:white;
          padding:12px 18px;
          border-radius:10px;
          cursor:pointer;
          font-weight:bold;
        }

        .dashboard-logout:hover{
          background:#b91c1c;
        }

        .dashboard-grid{
          display:grid;
          grid-template-columns:repeat(3, 1fr);
          gap:25px;
        }

        .dashboard-grid button{
          height:140px;
          border:none;
          border-radius:18px;
          background:#1f2937;
          color:white;
          font-size:22px;
          font-weight:bold;
          cursor:pointer;
          transition:0.2s;
        }

        .dashboard-grid button:hover{
          background:#374151;
          transform:translateY(-3px);
        }

        @media(max-width:900px){

          .dashboard-grid{
            grid-template-columns:1fr;
          }

        }

      `}</style>

    </div>
  );
}
