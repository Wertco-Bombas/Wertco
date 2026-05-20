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
  const [userRole, setUserRole] = useState('user'); // default 'user'
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // carrega categorias
      const { data: cats, error: catsError } = await supabase.from('categorias').select('id, nome').order('nome', { ascending: true });
      if (catsError) {
        console.error('Erro ao carregar categorias:', catsError);
        setCategorias([]);
      } else {
        setCategorias(cats || []);
      }

      // carrega sessão do supabase
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });

        // tenta buscar role do usuário na tabela profiles (ajuste se usar outro nome)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!profileError && profile?.role) {
            setUserRole(profile.role);
          } else {
            // se não encontrou profile, tenta buscar em uma tabela users (fallback)
            const { data: udata, error: uerr } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (!uerr && udata?.role) setUserRole(udata.role);
          }
        } catch (err) {
          console.warn('Não foi possível obter role do usuário:', err);
        }
      } else {
        setUser(null);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        // recarregar role simplificado (poderia repetir a lógica acima)
        (async () => {
          try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role) setUserRole(profile.role);
          } catch (e) {
            // ignore
          }
        })();
      } else {
        setUser(null);
        setUserRole('user');
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  async function handleSalvar(e) {
    e.preventDefault();

    if (!titulo.trim()) {
      return alert('Informe o título');
    }

    // exige categoria selecionada
    if (!categoriaId) {
      return alert('Selecione uma categoria antes de criar o tópico.');
    }

    setSaving(true);

    // determina se o tópico já fica aprovado automaticamente
    const isPrivileged = userRole === 'admin' || userRole === 'supervisor';
    const payload = {
      titulo: titulo.trim(),
      conteudo: conteudo || '',
      categoria_id: categoriaId,
      user_email: user?.email || null,
      user_role: userRole || 'user',
      approved: isPrivileged ? true : false
    };

    const { error } = await supabase.from('topicos').insert([payload]);

    setSaving(false);

    if (error) {
      console.error('Erro ao criar tópico:', error);
      alert('Erro ao criar tópico: ' + (error.message || 'Erro desconhecido'));
      return;
    }

    // se o tópico ficou pendente e o usuário não é supervisor/admin, avisar que aguarda aprovação
    if (!isPrivileged) {
      alert('Tópico criado e enviado para aprovação. Um supervisor ou administrador precisa aprová-lo antes de ficar visível.');
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
            <label className="formLabel">Título</label>
            <input
              className="formInput"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do tópico"
            />

            <label className="formLabel">Conteúdo</label>
            <textarea
              className="formTextarea"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={6}
              placeholder="Descreva o conteúdo do tópico"
            />

            <label className="formLabel">Categoria</label>
            <select
              className="formInput"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">-- Selecione uma categoria --</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <div style={{ marginTop: 8, color: '#777', fontSize: 13 }}>
              {user ? (
                <div>
                  Criando como <strong>{user.email}</strong> ({userRole})
                </div>
              ) : (
                <div>Você precisa estar logado para criar um tópico.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                type="submit"
                className="btn btnYellow"
                disabled={saving || !user}
              >
                {saving ? 'Salvando...' : 'Criar Tópico'}
              </button>
              <button
                type="button"
                className="btn btnDangerOutline"
                onClick={() => router.push('/base')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
