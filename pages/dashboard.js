// pages/dashboard.js
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="page">
      <div className="container">
        <div className="centerArea">
          <nav className="menuGrid" role="navigation" aria-label="Menu principal">
            <Link href="/base" className="menuBtn" aria-label="Base de Conhecimento">
              <div>Base de Conhecimento</div>
            </Link>

            <Link href="/treinamento" className="menuBtn" aria-label="Treinamento">
              <div>Treinamento</div>
            </Link>

            <Link href="/auditoria" className="menuBtn" aria-label="Auditoria">
              <div>Auditoria</div>
            </Link>

            <Link href="/usuario" className="menuBtn" aria-label="Usuários">
              <div>Usuários</div>
            </Link>

            <Link href="/atendimento" className="menuBtn" aria-label="Atendimento">
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
