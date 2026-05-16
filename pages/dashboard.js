export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <h1>Bem-vindo!</h1>
      <p>Escolha para onde deseja ir:</p>
      <div className="dashboard-buttons">
        <button onClick={() => (window.location.href = "/base")}>
          Base de conhecimento
        </button>
        <button onClick={() => (window.location.href = "/usuario")}>
          Usuário
        </button>
        <button onClick={() => (window.location.href = "/treinamento")}>
          Treinamento
        </button>
        <button onClick={() => (window.location.href = "/auditoria")}>
          Auditoria
        </button>
        <button onClick={() => (window.location.href = "/atendimento")}>
          Atendimento
        </button>
      </div>
    </div>
  );
}
