// components/Navbar.js

import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="topbar">

      {/* LEFT */}
      <div className="topbar-left">
        <h2>Wertco</h2>
      </div>

      {/* RIGHT */}
      <div className="topbar-right">

        <Link href="/base">
          <button>Base</button>
        </Link>

        <Link href="/usuarios">
          <button>Usuários</button>
        </Link>

        <button onClick={handleLogout}>
          Sair
        </button>

      </div>

    </div>
  );
}
