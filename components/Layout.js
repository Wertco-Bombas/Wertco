export default function Layout({ children }) {
  function handleLogout() {
    window.location.href = "/login";
  }

  function goMenu() {
    window.location.href = "/dashboard";
  }

  // Detecta se está na tela de Menu (dashboard)
  const isMenuPage = window.location.pathname === "/dashboard";

  return (
    <div className="layout-container">
      <nav className="menu">
        <div className="menu-right">
          {!isMenuPage && <button onClick={goMenu}>Menu</button>}
          <button onClick={handleLogout}>Sair</button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
