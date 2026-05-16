export default function Login(){

  return(
    <div className="loginPage">

      <div className="loginBox">

        <div className="loginTitle">
          Entrar
        </div>

        <div className="field">
          <label>Usuário</label>

          <input type="text" />
        </div>

        <div className="field">
          <label>Senha</label>

          <input type="password" />
        </div>

        <button className="loginBtn">
          Entrar
        </button>

      </div>

    </div>
  )
}
