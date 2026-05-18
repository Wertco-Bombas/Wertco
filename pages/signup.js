import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSignUp(e) {
    e.preventDefault(); // evita reload da página
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert('Erro ao criar usuário: ' + error.message);
    } else {
      alert('Usuário criado com sucesso!');
    }
  }

  return (
    <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input
        type="email"
        placeholder="Digite seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Digite sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Cadastrar</button>
    </form>
  );
}
