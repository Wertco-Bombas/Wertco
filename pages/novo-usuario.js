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

  // tenta inserir perfil em 'users' ou 'profiles'
  async function tryInsertProfile(userId, emailValue, roleValue) {
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, email: emailValue, role: roleValue });

      if (!insertError) return { ok: true, where: 'users' };

      console.warn('Insert users falhou:', insertError.message);

      const { error: insertProfilesError } = await supabase
        .from('profiles')
        .insert({ id: userId, email: emailValue, role: roleValue });

      if (!insertProfilesError) return { ok: true, where: 'profiles' };

      return { ok: false, error: insertProfilesError || insertError };
    } catch (err) {
      return { ok: false, error: err };
    }
  }

  // polling curto para tentar obter user id após signUp
  async function pollForUserId(maxAttempts = 8, delayMs = 800) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // tenta getUser (retorna user se houver sessão)
        const userRes = await supabase.auth.getUser();
        const user = userRes?.data?.user;
        if (user?.id) return user.id;

        // tenta getSession (às vezes session contém user)
        const sessionRes = await supabase.auth.getSession();
        const sessionUser = sessionRes?.data?.session?.user;
        if (sessionUser?.id) return sessionUser.id;
      } catch (err) {
        console.warn('pollForUserId erro:', err);
      }
      // espera antes da próxima tentativa
      await new Promise(res => setTimeout(res, delayMs));
    }
    return null;
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

    // se signUp retornou user com id, usamos direto
    const returnedUserId = data?.user?.id || null;

    let userId = returnedUserId;

    // se não veio userId, tentamos recuperar com polling curto
    if (!userId) {
      userId = await pollForUserId(8, 800); // ~6.4s total
    }

    if (!userId) {
      setSaving(false);
      // Mensagem orientativa para o usuário/admin
      return alert(
        'Usuário criado no Auth, mas não foi retornado user id.\n\n' +
        'Possíveis causas:\n' +
        '- O projeto exige confirmação por e‑mail antes de ativar a conta (verifique o e‑mail do usuário).\n' +
        '- A criação de perfis deve ser feita pelo servidor usando a Admin API (service_role) em vez do cliente.\n\n' +
        'O usuário foi criado no Auth. Para completar o perfil no banco você pode:\n' +
        '1) Confirmar o e‑mail do usuário e tentar novamente (o id pode aparecer após confirmação).\n' +
        '2) Criar o perfil no servidor usando a chave service_role (recomendado para criação administrativa).\n\n' +
        'Se quiser, eu te envio o código de exemplo para criar usuário via Admin API (server side).'
      );
    }

    // 2) tenta inserir perfil em tabelas comuns (users -> profiles)
    const result = await tryInsertProfile(userId, email.trim(), role);

    setSaving(false);

    if (result.ok) {
      router.push('/usuario');
    } else {
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
