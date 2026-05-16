export default function Layout({ children }) {
  function handleLogout() {
    window.location.href = "/login";
  }

  function goMenu() {
    window.location.href = "/dashboard";
  }

  return (
    <div className="layout-container">
      <nav className="menu">
        <div className="menu-right">
          <button onClick={goMenu}>Menu</button>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
