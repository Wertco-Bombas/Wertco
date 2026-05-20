import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function NovaCategoria() {
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const router = useRouter();

  const isPrivileged = ['admin', 'supervisor'].includes(userRole);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session?.user) return;

    setUser({
      id: session.user.id,
      email: session.user.email
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'user');
  }

  async function registrarAuditoria(categoriaId, status) {
    try {
      await supabase.from('auditoria').insert({
        acao: 'CRIAR_CATEGORIA',
        entidade: 'categorias',
        entidade_id: categoriaId,
        status,
        usuario_email: user?.email,
        payload: {
          nome
        }
      });
    } catch (err) {
      console.warn('Erro auditoria:', err);
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();

    if (!nome.trim()) {
      return alert('Informe o nome da categoria');
    }

    setSaving(true);

    const approved = isPrivileged;

    const { data, error } = await supabase
      .from('categorias')
      .insert([
        {
          nome: nome.trim(),
          user_email: user?.email,
          usuario_id: user?.id,
          approved
        }
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert('Erro ao criar categoria: ' + error.message);
      return;
    }

    // 🔥 AUDITORIA AUTOMÁTICA
    await registrarAuditoria(data.id, approved ? 'approved' : 'pending');

    if (!approved) {
      alert('Categoria enviada para aprovação do supervisor/admin.');
    }

    router.push('/base');
  }

  return (
    <div className="page">
      <div className="container">

        <div className="topicHeader">
          <h2 className="topicTitle">+ Nova Categoria</h2>
        </div>

        <div className="card">

          <form onSubmit={handleSalvar} className="formStack">

            <label>Nome da categoria</label>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Procedimentos, Segurança..."
            />

            <div style={{ marginTop: 10, fontSize: 13, color: '#888' }}>
              Criando como: {user?.email} ({userRole})
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button disabled={saving || !user}>
                {saving ? 'Salvando...' : 'Criar Categoria'}
              </button>

              <button type="button" onClick={() => router.push('/base')}>
                Cancelar
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
