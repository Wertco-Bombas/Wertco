// pages/novo-usuario.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function NovoUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario'); // default
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // se quiser, podemos restringir opções de role com base no usuário logado
  }, []);

  async function handleCriar(e) {
    e.preventDefault();
    if (!email.trim() || !password) return alert('Informe email e senha');

    setSaving(true);

    const { data, error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    if (signError) {
      setSaving(false);
      return alert('Erro ao criar usuário: ' + signError.message);
    }

    try {
      const userId = data?.user?.id || null;
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email: email.trim(),
        role: role || 'usuario'
      });

      setSaving(false);
      if (insertError) {
        alert('Usuário criado no Auth, mas erro ao salvar perfil: ' + insertError.message);
      } else {
        router.push('/usuario');
      }
    } catch (err) {
      setSaving(false);
      console.error(err);
      alert('Erro ao salvar usuário: ' + err.message);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">+ Novo Usuário</h2>
        </div>

        <div className="card">
          <form onSubmit={handleCriar} className="formStack">
            <label className="formLabel">Email</label>
            <input className="formInput" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />

            <label className="formLabel">Senha</label>
            <input className="formInput" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />

            <label className="formLabel">Nível do usuário</label>
            <select className="formInput" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="usuario">Usuário</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn btnYellow" disabled={saving}>
                {saving ? 'Criando...' : 'Criar Usuário'}
              </button>
              <button type="button" className="btn btnDangerOutline" onClick={() => router.push('/usuario')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
