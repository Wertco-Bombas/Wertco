// pages/base.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({}); // { topicoId: [comentarios] }
  const [commentState, setCommentState] = useState({}); // { [topicoId]: { text, imageFile, editingId } }
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    async function init() {
      // carregar sessão e role
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        // tenta buscar role no profile (ajuste se usar outro esquema)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (!profileError && profile?.role) setUserRole(profile.role);
        } catch (e) {
          // fallback: manter 'user'
        }
      } else {
        setUser(null);
        setUserRole('user');
      }

      await loadCategorias();
      await loadTopicosAndComments();
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        (async () => {
          try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role) setUserRole(profile.role);
          } catch (e) {
            setUserRole('user');
          }
        })();
      } else {
        setUser(null);
        setUserRole('user');
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  // Carrega categorias
  async function loadCategorias() {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategorias([]);
      return;
    }
    setCategorias(data || []);
  }

  // Carrega tópicos e comentários de forma resiliente e normalizada
  async function loadTopicosAndComments() {
    // 1) buscar tópicos
    const { data: topicosData, error: tError } = await supabase
      .from('topicos')
      .select('*');

    if (tError) {
      console.error('Erro ao carregar tópicos (safe):', tError);
      setTopicos([]);
      setComentariosMap({});
      return;
    }

    // 2) normaliza tópicos
    const normalizedTopicos = (topicosData || []).map(t => ({
      id: t.id,
      titulo: t.titulo || t.title || t.nome || '',
      descricao: t.conteudo || t.descricao || t.body || '',
      categoria_id: t.categoria_id ?? t.category_id ?? null,
      imagem_url: t.imagem_url ?? t.image_url ?? null,
      user_email: t.user_email ?? null,
      user_role: t.user_role ?? null,
      approved: typeof t.approved === 'boolean' ? t.approved : true, // se não existir, assume true para compatibilidade
      raw: t,
    }));

    // 3) ordenar por id desc (fallback)
    normalizedTopicos.sort((a, b) => (b.id || 0) - (a.id || 0));
    setTopicos(normalizedTopicos);

    // 4) carregar comentários
    const ids = (topicosData || []).map(t => t.id);
    if (!ids.length) {
      setComentariosMap({});
      return;
    }

    const { data: comentariosData, error: cError } = await supabase
      .from('comentarios')
      .select('*')
      .in('topico_id', ids);

    if (cError) {
      console.error('Erro ao carregar comentários (safe):', cError);
      setComentariosMap({});
      return;
    }

    // 5) normaliza comentários
    const map = {};
    (comentariosData || []).forEach(c => {
      const texto = c.texto ?? c.conteudo ?? c.mensagem ?? c.comment ?? c.body ?? c.text ?? '';
      const imageUrl = c.image_url ?? c.imagem_url ?? c.foto_url ?? c.url ?? null;
      const topicoId = c.topico_id ?? c.topic_id ?? c.topico ?? null;
      const userEmail = c.user_email ?? c.email ?? c.usuario_email ?? null;
      const createdAt = c.created_at ?? c.criado_em ?? c.created ?? null;
      const approved = typeof c.approved === 'boolean' ? c.approved : true;

      const normalizedComment = {
        id: c.id,
        texto,
        image_url: imageUrl,
        topico_id: topicoId,
        user_id: c.user_id ?? c.usuario_id ?? null,
        user_email: userEmail,
        created_at: createdAt,
        approved,
        raw: c,
      };

      if (!map[topicoId]) map[topicoId] = [];
      map[topicoId].push(normalizedComment);
    });

    // ordenar comentários por created_at ou id
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : a.id || 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : b.id || 0;
        return ta - tb;
      });
    });

    setComentariosMap(map);
  }

  // Helpers para estado local de comentário por tópico
  function setLocalComment(topicoId, patch) {
    setCommentState(prev => ({
      ...prev,
      [topicoId]: { ...(prev[topicoId] || { text: '', imageFile: null, editingId: null }), ...patch },
    }));
  }

  // Upload de imagem (opcional)
  async function uploadImage(file) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = fileName;

    const { error: uploadError } = await supabase.storage
      .from('comentarios')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Erro ao enviar imagem:', uploadError);
      return null;
    }

    const { publicURL } = supabase.storage.from('comentarios').getPublicUrl(path);
    return publicURL;
  }

  // Adicionar comentário (criado como pendente para usuários comuns)
  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || { text: '', imageFile: null };
    const text = (state.text || '').trim();
    if (!text) return alert('Escreva um comentário antes de enviar.');

    let imageUrl = null;
    if (state.imageFile) {
      imageUrl = await uploadImage(state.imageFile);
    }

    const isPrivileged = userRole === 'admin' || userRole === 'supervisor';
    const payload = {
      texto: text,
      topico_id: topicoId,
      user_id: user?.id || null,
      user_email: user?.email || null,
      user_role: userRole || 'user',
      image_url: imageUrl,
      approved: isPrivileged ? true : false,
    };

    const { error } = await supabase.from('comentarios').insert([payload]);
    if (error) {
      console.error('Erro ao salvar comentário:', error);
      alert('Erro ao salvar comentário.');
      return;
    }

    setLocalComment(topicoId, { text: '', imageFile: null, editingId: null });
    await loadTopicosAndComments();
    if (!isPrivileged) alert('Comentário enviado e aguardando aprovação de supervisor/admin.');
  }

  // Editar comentário (apenas texto)
  function startEditComment(topicoId, comentario) {
    setLocalComment(topicoId, { text: comentario.texto || '', imageFile: null, editingId: comentario.id });
  }

  async function saveEditComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();
    if (!text) return alert('Escreva o comentário antes de salvar.');

    const { error } = await supabase
      .from('comentarios')
      .update({ texto: text, approved: userRole === 'admin' || userRole === 'supervisor' ? true : false })
      .eq('id', state.editingId);

    if (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Erro ao editar comentário.');
      return;
    }

    setLocalComment(topicoId, { text: '', imageFile: null, editingId: null });
    await loadTopicosAndComments();
  }

  // Excluir comentário
  async function deleteComment(commentId) {
    const ok = confirm('Deseja realmente excluir este comentário?');
    if (!ok) return;

    const { error } = await supabase.from('comentarios').delete().eq('id', commentId);
    if (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário.');
      return;
    }
    await loadTopicosAndComments();
  }

  // Aprovar / Rejeitar comentário (chama API backend)
  async function toggleApproveComment(commentId, approve) {
    try {
      const res = await fetch('/api/approve-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId, approve }),
      });
      if (!res.ok) throw new Error('Falha na requisição de aprovação');
      await loadTopicosAndComments();
    } catch (err) {
      console.error('Erro ao aprovar/rejeitar comentário:', err);
      alert('Erro ao aprovar/rejeitar comentário.');
    }
  }

  // Aprovar / Rejeitar tópico
  async function toggleApproveTopico(topicoId, approve) {
    try {
      const res = await fetch('/api/approve-topico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: topicoId, approve }),
      });
      if (!res.ok) throw new Error('Falha na requisição de aprovação');
      await loadTopicosAndComments();
    } catch (err) {
      console.error('Erro ao aprovar/rejeitar tópico:', err);
      alert('Erro ao aprovar/rejeitar tópico.');
    }
  }

  // Utilitários de visibilidade
  function canSeeUnapproved() {
    return userRole === 'admin' || userRole === 'supervisor';
  }

  // Busca combinada
  function matchesSearch(topico) {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const inTitle = (topico.titulo || '').toLowerCase().includes(q);
    const inDesc = (topico.descricao || '').toLowerCase().includes(q);
    const inCat = (topico.raw?.categoria_nome || topico.raw?.categorias?.nome || '').toLowerCase().includes(q);
    const inComments = (comentariosMap[topico.id] || []).some(c =>
      (c.texto || '').toLowerCase().includes(q) ||
      (c.user_email || '').toLowerCase().includes(q)
    );
    return inTitle || inDesc || inCat || inComments;
  }

  // Render
  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      <input
        type="text"
        placeholder="Pesquisar títulos, descrições, categorias, comentários e autores..."
        className="search-bar"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="actions" role="region" aria-label="Filtros e ações">
        <select
          value={selectedCategoria}
          onChange={e => setSelectedCategoria(e.target.value)}
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>

        <div>
          <button onClick={() => window.location.href = '/novo-topico'}>+ Novo Tópico</button>
          <button onClick={() => window.location.href = '/nova-categoria'}>+ Nova Categoria</button>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {topicos
          .filter(t => (canSeeUnapproved() ? true : t.approved === true))
          .filter(t => matchesSearch(t) && (!selectedCategoria || String(t.categoria_id) === String(selectedCategoria)))
          .map(topico => {
            const state = commentState[topico.id] || { text: '', imageFile: null, editingId: null };
            const comentarios = (comentariosMap[topico.id] || []).filter(c => (canSeeUnapproved() ? true : c.approved === true));

            return (
              <div key={topico.id} className="topico-card">
                <div className="topico-header">
                  <h2 className="topico-titulo">{topico.titulo}</h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="categoria-tag">{topico.raw?.categoria_nome || topico.raw?.categorias?.nome || 'Sem categoria'}</span>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <strong>{topico.user_email || 'Autor desconhecido'}</strong>
                      <span style={{ marginLeft: 8, color: '#aaa' }}>{topico.user_role || ''}</span>
                    </div>
                    {!topico.approved && canSeeUnapproved() && (
                      <div style={{ marginLeft: 12 }}>
                        <button className="actions-button" onClick={() => toggleApproveTopico(topico.id, true)}>Aprovar</button>
                        <button className="actions-button" onClick={() => toggleApproveTopico(topico.id, false)}>Rejeitar</button>
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ marginTop: 8, color: '#ddd' }}>{topico.descricao}</p>

                <div className="comentarios" style={{ textAlign: 'left' }}>
                  <h3 style={{ color: '#ffd700' }}>Comentários</h3>

                  <ul>
                    {comentarios.length === 0 && <li style={{ background: 'transparent', color: '#999' }}>Sem comentários.</li>}

                    {comentarios.map(c => (
                      <li key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 13, color: '#ffd700' }}>
                            <strong>{c.user_email || 'Anônimo'}</strong>
                            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>
                              {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            {user?.id && c.user_id === user.id && (
                              <>
                                <button className="actions-button" onClick={() => startEditComment(topico.id, c)}>Editar</button>
                                <button className="actions-button" onClick={() => deleteComment(c.id)}>Excluir</button>
                              </>
                            )}

                            {canSeeUnapproved() && (
                              <>
                                {!c.approved ? (
                                  <>
                                    <button className="actions-button" onClick={() => toggleApproveComment(c.id, true)}>Aprovar</button>
                                    <button className="actions-button" onClick={() => toggleApproveComment(c.id, false)}>Rejeitar</button>
                                  </>
                                ) : (
                                  <span style={{ color: '#0f0', fontSize: 12 }}>Aprovado</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ color: '#ddd' }}>{c.texto}</div>

                        {c.image_url && (
                          <img src={c.image_url} alt="Comentário" style={{ maxWidth: 300, borderRadius: 6 }} />
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Campo para adicionar / editar comentário */}
                  <div className="comentario-input" style={{ marginTop: 12 }}>
                    <textarea
                      placeholder="Adicionar comentário..."
                      value={state.text}
                      onChange={e => setLocalComment(topico.id, { text: e.target.value })}
                      rows={3}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setLocalComment(topico.id, { imageFile: e.target.files[0] })}
                    />

                    {state.editingId ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btnYellow" onClick={() => saveEditComment(topico.id)}>Salvar</button>
                        <button className="btn btnDangerOutline" onClick={() => setLocalComment(topico.id, { text: '', imageFile: null, editingId: null })}>Cancelar</button>
                      </div>
                    ) : (
                      <button className="btn btnYellow" onClick={() => handleAddComment(topico.id)}>Enviar</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <p style={{ marginTop: 20, color: '#777', fontSize: 12 }}>Protótipo local — itens criados por usuários comuns ficam pendentes até aprovação.</p>
    </div>
  );
}
