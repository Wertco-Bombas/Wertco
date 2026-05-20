// pages/excluir-categoria.js

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function ExcluirCategoria() {
  const [categorias, setCategorias] = useState([]);
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

    loadCategorias();
  }

  async function loadCategorias() {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome', { ascending: true });

    setCategorias(data || []);
  }

  const canDelete = ['admin', 'supervisor'].includes(userRole);

  async function handleExcluir() {
    if (!selected) return alert('Selecione uma categoria');
    if (!canDelete) return alert('Você não tem permissão para excluir categorias');
    if (!confirm('Confirma exclusão da categoria selecionada?')) return;

    setDeleting(true);

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', selected);

    setDeleting(false);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    // 🔥 AUDITORIA
    await supabase.from('auditoria').insert({
      acao: 'DELETE_CATEGORIA',
      entidade: 'categorias',
      usuario_id: user.id,
      usuario_email: user.email,
      payload: { categoria_id: selected }
    });

    alert('Categoria excluída com sucesso');

    router.push('/base');
  }

  if (!canDelete) {
    return (
      <div className="page">
        <div className="container">
          <h2>Acesso negado</h2>
          <p>Você não tem permissão para acessar esta funcionalidade.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">

        <div className="topicHeader">
          <h2 className="topicTitle">- Excluir Categoria</h2>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Logado como: {userRole}
          </div>
        </div>

        <div className="card">

          <label className="formLabel">Selecione a categoria</label>

          <select
            className="formInput"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">-- selecione --</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>

            <button
              className="btn btnDangerOutline"
              onClick={handleExcluir}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir Categoria'}
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
