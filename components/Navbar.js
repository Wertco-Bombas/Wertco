import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Navbar(){
  async function handleLogout(){
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav style={{display:'flex', gap:'20px', padding:'10px', background:'#222', color:'#FFD700'}}>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/base">Base</Link>
      <Link href="/usuarios">Usuários</Link>
      <button onClick={handleLogout}>Sair</button>
    </nav>
  )
}
