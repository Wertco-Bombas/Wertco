export default function Layout({ children }) {
  function handleLogout() {
    window.location.href = "/login";
  }

  function goDashboard() {
    window.location.href = "/dashboard";
  }

  return (
    <div className="layout-container">
      <nav className="menu">
        <button onClick={goDashboard}>Dashboard</button>
        <button onClick={() => (window.location.href = "/base")}>Base</button>
        <button onClick={() => (window.location.href = "/usuario")}>Usuário</button>
        <button onClick={() => (window.location.href = "/treinamento")}>Treinamento</button>
        <button onClick={() => (window.location.href = "/auditoria")}>Auditoria</button>
        <button onClick={() => (window.location.href = "/atendimento")}>Atendimento</button>
        <button onClick={handleLogout}>Sair</button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
