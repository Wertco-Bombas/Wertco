export default function Login() {
  return (
    <div className="loginPage">
      <div className="loginBox">

        <h1 className="loginTitle">Entrar</h1>

        <div className="loginField">
          <label>Usuário</label>
          <input className="loginInput" type="text" />
        </div>

        <div className="loginField">
          <label>Senha</label>
          <input className="loginInput" type="password" />
        </div>

        <div className="loginActions">
          <button className="btn btnYellow">
            Entrar
          </button>

          <button className="btn demoBtn">
            Entrar como demo
          </button>
        </div>

      </div>
    </div>
  )
}
