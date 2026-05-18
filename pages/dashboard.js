import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login'; // volta para tela de login
  }

  return (
    <div className="page">
      <div className="container">

        {/* Topbar com logo e botão sair */}
        <div className="topbar">
          <div className="logo">
            <div className="logoBox">W</div>
            <div className="logoText">Wertco</div>
          </div>
          <button className="navBtn" onClick={handleLogout}>Sair</button>
        </div>

        {/* Navegação */}
        <div className="nav">
          <Link href="/dashboard" className="navBtn">Dashboard</Link>
          <Link href="/base" className="navBtn">Base de Conhecimento</Link>
          <Link href="/treinamento" className="navBtn">Treinamento</Link>
          <Link href="/auditoria" className="navBtn">Auditoria</Link>
          <Link href="/usuario" className="navBtn">Usuários</Link>
        </div>

        {/* Conteúdo principal */}
        <div className="card">
          <h1 className="topicTitle">Bem-vindo ao Dashboard!</h1>
          <p className="description">Escolha uma opção no menu acima para navegar.</p>
        </div>

      </div>
    </div>
  );
}
