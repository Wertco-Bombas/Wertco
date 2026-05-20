// pages/excluir-topico.js

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function ExcluirTopico() {
  const [topicos, setTopicos] = useState([]);
  const [selected, setSelected] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'user');

    loadTopicos();
  }

  async function loadTopicos() {
    const { data } = await supabase
      .from('topicos')
      .select('id, titulo')
      .order('created_at', { ascending: false });

    setTopicos(data || []);
  }

  const canDelete = ['admin', 'supervisor'].includes(userRole);

  async function handleExcluir() {
    if (!selected) return alert('Selecione um tópico');
    if (!canDelete) return alert('Sem permissão para excluir tópico');
    if (!confirm('Confirma exclusão do tópico selecionado?')) return;

    setDeleting(true);

    const { error } = await supabase
      .from('topicos')
      .delete()
      .eq('id', selected);

    setDeleting(false);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    // 🔥 AUDITORIA SIMPLES (IMPORTANTE)
    await supabase.from('auditoria').insert({
      acao: 'DELETE_TOPICO',
      entidade: 'topicos',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { topico_id: selected }
    });

    alert('Tópico excluído com sucesso');

    router.push('/base');
  }

  if (!canDelete) {
    return (
      <div className="page">
        <div className="container">
          <h2>Acesso negado</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">

        <div className="topicHeader">
          <h2 className="topicTitle">- Excluir Tópico</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Logado como: {userRole}
          </div>
        </div>

        <div className="card">

          <label className="formLabel">Selecione o tópico</label>

          <select
            className="formInput"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">-- selecione --</option>
            {topicos.map(t => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>

            <button
              className="btn btnDangerOutline"
              onClick={handleExcluir}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir Tópico'}
            </button>

            <button className="btn" onClick={() => router.push('/base')}>
              Cancelar
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
