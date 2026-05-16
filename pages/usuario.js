import { useState } from "react";

export default function Usuario() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [newUser, setNewUser] = useState({ nome: "", email: "", senha: "", nivel: "Usuário" });

  function saveUser() {
    if (newUser.nome && newUser.email && newUser.senha) {
      setUsers([...users, newUser]);
      setNewUser({ nome: "", email: "", senha: "", nivel: "Usuário" });
      setModal(false);
    }
  }

  return (
    <div className="usuario-container">
      <h1>Cadastro de Usuários</h1>
      <button onClick={() => setModal(true)}>+ Novo Usuário</button>

      <ul>
        {users.map((u, i) => (
          <li key={i}>
            <strong>{u.nome}</strong> - {u.email} ({u.nivel})
          </li>
        ))}
      </ul>

      {modal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Novo Usuário</h2>
            <input
              type="text"
              placeholder="Nome"
              value={newUser.nome}
              onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Senha"
              value={newUser.senha}
              onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })}
            />

            {/* Seleção de nível */}
            <select
              value={newUser.nivel}
              onChange={(e) => setNewUser({ ...newUser, nivel: e.target.value })}
            >
              <option value="Admin">Admin</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Usuário">Usuário</option>
            </select>

            <div className="modal-buttons">
              <button onClick={saveUser}>Salvar</button>
              <button onClick={() => setModal(false)}>Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
