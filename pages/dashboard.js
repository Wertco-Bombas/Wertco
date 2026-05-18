import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <ul>
        <li><Link href="/base">Base de Conhecimento</Link></li>
        <li><Link href="/treinamento">Treinamento</Link></li>
        <li><Link href="/auditoria">Auditoria</Link></li>
        <li><Link href="/usuarios">Usuários</Link></li>
      </ul>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}
