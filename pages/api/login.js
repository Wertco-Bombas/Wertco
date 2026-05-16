// pages/api/login.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { user, password } = req.body;

    // Simulação de usuários com níveis de acesso
    const users = [
      { user: "admin", password: "123", role: "Admin" },
      { user: "supervisor", password: "123", role: "Supervisor" },
      { user: "usuario", password: "123", role: "Usuário" },
    ];

    // Verifica se existe usuário com credenciais válidas
    const found = users.find(
      (u) => u.user === user && u.password === password
    );

    if (found) {
      res.status(200).json({ success: true, role: found.role });
    } else {
      res.status(401).json({ success: false });
    }
  } else {
    res.status(405).json({ message: "Método não permitido" });
  }
}
