// pages/api/login.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const { user, password } = req.body || {};

    if (!user || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuário e senha são obrigatórios"
      });
    }

    const users = [
      { user: "admin", password: "123", role: "admin" },
      { user: "supervisor", password: "123", role: "supervisor" },
      { user: "usuario", password: "123", role: "usuario" },
    ];

    const found = users.find(
      (u) => u.user === user && u.password === password
    );

    if (!found) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas"
      });
    }

    return res.status(200).json({
      success: true,
      role: found.role,
      user: found.user
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
}
