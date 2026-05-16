export default function Home() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Entrar</h1>
        <form method="POST" action="/api/login">
          <label htmlFor="username">Usuário</label>
          <input type="text" id="username" name="username" required />

          <label htmlFor="password">Senha</label>
          <input type="password" id="password" name="password" required />

          <button type="submit" className="login-button">Entrar</button>
        </form>
      </div>
    </div>
  );
}
