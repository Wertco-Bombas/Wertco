export default function Home() {
  return (
    <div className="container">
      <h1>Login</h1>
      <form method="POST" action="/api/login">
        <input type="text" name="username" placeholder="Usuário" />
        <input type="password" name="password" placeholder="Senha" />
        <button type="submit">Entrar</button>
      </form>

      <form method="POST" action="/api/register" style={{ marginTop: "20px" }}>
        <input type="text" name="username" placeholder="Novo usuário" />
        <input type="password" name="password" placeholder="Senha" />
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
}
