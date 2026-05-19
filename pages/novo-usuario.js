// pages/novo-usuario.js
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function NovoUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario'); // default
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function tryInsertProfile(userId, emailValue, roleValue) {
    // Tenta inserir em 'users' primeiro, se falhar tenta 'profiles'
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, email: emailValue, role: roleValue });

      if (!insertError) return { ok: true, where: 'users' };

      // Se erro indicar coluna ausente ou tabela ausente, tenta profiles
      console.warn('Insert users falhou:', insertError.message);

      const { error: insertProfilesError } = await supabase
        .from('profiles')
        .insert({ id: userId, email: emailValue, role: roleValue });

      if (!insertProfilesError) return { ok: true, where: 'profiles' };

      // Se também falhar, retorna erro
      return { ok: false, error: insertProfilesError || insertError };
    } catch (err) {
      return { ok: false, error: err };
    }
  }

  async function handleCriar(e) {
    e.preventDefault();
    if (!email.trim() || !password) return alert('Informe email e senha');

    setSaving(true);

    // 1) cria usuário no Auth
    const { data, error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    if (signError) {
      setSaving(false);
      return alert('Erro ao criar usuário: ' + signError.message);
    }

    const userId = data?.user?.id || null;

    if (!userId) {
      setSaving(false);
      return alert('Usuário criado no Auth, mas não foi retornado user id.');
    }

    // 2) tenta inserir perfil em tabelas comuns (users -> profiles)
    const result = await tryInsertProfile(userId, email.trim(), role);

    setSaving(false);

    if (result.ok) {
      router.push('/usuario');
    } else {
      // Mensagem detalhada para ajudar debug
      console.error('Erro ao salvar perfil:', result.error);
      alert(
        'Usuário criado no Auth, mas erro ao salvar perfil: ' +
        (result.error?.message || JSON.stringify(result.error)) +
        '\n\nVerifique o schema do banco: existe a tabela "users" ou "profiles" com coluna "email" e "role"?'
      );
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
