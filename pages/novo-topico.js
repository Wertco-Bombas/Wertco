// pages/novo-topico.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function NovoTopico() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const router = useRouter();

  const isPrivileged = ['admin', 'supervisor'].includes(userRole);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    // categorias
    const { data: cats } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome', { ascending: true });

    setCategorias(cats || []);

    // sessão
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session?.user) return;

    setUser({
      id: session.user.id,
      email: session.user.email
    });

    // role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'user');
  }

  async function registrarAuditoria(topicoId, status) {
    try {
      await supabase.from('auditoria').insert({
        acao: 'CRIAR_TOPICO',
        entidade: 'topicos',
        entidade_id: topicoId,
        status,
        usuario_email: user?.email,
        payload: {
          titulo,
          categoria_id: categoriaId
        }
      });
    } catch (err) {
      console.warn('Falha auditoria:', err);
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();

    if (!titulo.trim()) return alert('Informe o título');
    if (!categoriaId) return alert('Selecione uma categoria');

    setSaving(true);

    const approved = isPrivileged;

    const { data, error } = await supabase
      .from('topicos')
      .insert([
        {
          titulo: titulo.trim(),
          conteudo: conteudo || '',
          categoria_id: categoriaId,
          user_email: user?.email,
          usuario_id: user?.id,
          approved
        }
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    // 🔥 AUDITORIA AUTOMÁTICA
    await registrarAuditoria(data.id, approved ? 'approved' : 'pending');

    if (!approved) {
      alert('Tópico enviado para aprovação do supervisor/admin.');
    }

    router.push('/base');
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">+ Novo Tópico</h2>
        </div>

        <div className="card">
          <form onSubmit={handleSalvar} className="formStack">

            <label>Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título"
            />

            <label>Conteúdo</label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={6}
              placeholder="Conteúdo"
            />

            <label>Categoria</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Selecione</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 10, fontSize: 13, color: '#888' }}>
              Criando como: {user?.email} ({userRole})
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button disabled={saving || !user}>
                {saving ? 'Salvando...' : 'Criar'}
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
