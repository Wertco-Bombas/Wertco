import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login'; // redireciona para login
  }

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <ul>
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/base">Base de Conhecimento</Link></li>
          <li><Link href="/treinamento">Treinamento</Link></li>
          <li><Link href="/auditoria">Auditoria</Link></li>
          <li><Link href="/usuarios">Usuários</Link></li>
        </ul>
        <button onClick={handleLogout} className="logoutBtn">Sair</button>
      </nav>

      {/* Conteúdo principal */}
      <main>
        <h1>Bem-vindo ao Dashboard!</h1>
        <p>Escolha uma opção no menu acima para navegar.</p>
      </main>
    </div>
  );
}
