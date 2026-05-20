// pages/base.js

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [topicos, setTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});
  const [commentState, setCommentState] = useState({});
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email
        });

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role) setUserRole(profile.role);
        } catch {
          setUserRole('user');
        }
      }

      await loadCategorias();
      await loadTopicosAndComments();
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email
        });
      } else {
        setUser(null);
        setUserRole('user');
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  async function loadCategorias() {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome');

    setCategorias(data || []);
  }

  async function loadTopicosAndComments() {
    const { data: topicosData } = await supabase
      .from('topicos')
      .select('*');

    const normalizedTopicos = (topicosData || []).map(t => ({
      id: t.id,
      titulo: t.titulo || '',
      descricao: t.conteudo || '',
      categoria_id: t.categoria_id || null,
      raw: t
    }));

    setTopicos(normalizedTopicos);

    const ids = (topicosData || []).map(t => t.id);

    const { data: comentariosData } = await supabase
      .from('comentarios')
      .select('*')
      .in('topico_id', ids);

    const map = {};

    (comentariosData || []).forEach(c => {
      const comentario = {
        id: c.id,
        conteudo: c.conteudo ?? '',
        imagem_base64: c.imagem_base64 ?? null,
        topico_id: c.topico_id,
        usuario_id: c.usuario_id,
        usuario_email: c.usuario_email,
        created_at: c.created_at
      };

      if (!map[c.topico_id]) map[c.topico_id] = [];
      map[c.topico_id].push(comentario);
    });

    setComentariosMap(map);
  }

  function setLocalComment(topicoId, patch) {
    setCommentState(prev => ({
      ...prev,
      [topicoId]: {
        ...(prev[topicoId] || { text: '', imageFile: null }),
        ...patch
      }
    }));
  }

  async function uploadImage(file) {
    if (!file) return null;

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('comentarios')
      .upload(fileName, file);

    if (error) return null;

    const { data } = supabase.storage
      .from('comentarios')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // ✅ CORRIGIDO (AGORA USA API E SCHEMA NOVO)
  async function handleAddComment(topicoId) {
    const state = commentState[topicoId] || {};
    const text = (state.text || '').trim();

    if (!text) return alert('Escreva um comentário antes de enviar.');

    let imageBase64 = null;

    if (state.imageFile) {
      imageBase64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(state.imageFile);
      });
    }

    try {
      const response = await fetch('/api/comentarios/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conteudo: text,
          topico_id: Number(topicoId),
          usuario_id: user?.id || null,
          usuario_email: user?.email || null,
          imagem_base64: imageBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao salvar comentário');
        return;
      }

      setLocalComment(topicoId, { text: '', imageFile: null });
      await loadTopicosAndComments();

    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar comentário');
    }
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      <input
        placeholder="Pesquisar..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div>
        <button onClick={() => window.location.href = '/novo-topico'}>
          Novo Tópico
        </button>
      </div>

      {topicos.map(topico => {
        const state = commentState[topico.id] || {};

        return (
          <div key={topico.id}>
            <h3>{topico.titulo}</h3>
            <p>{topico.descricao}</p>

            <div>
              {(comentariosMap[topico.id] || []).map(c => (
                <div key={c.id}>
                  <p>{c.conteudo}</p>
                </div>
              ))}
            </div>

            <textarea
              value={state.text || ''}
              onChange={e =>
                setLocalComment(topico.id, { text: e.target.value })
              }
            />

            <input
              type="file"
              onChange={e =>
                setLocalComment(topico.id, { imageFile: e.target.files[0] })
              }
            />

            <button onClick={() => handleAddComment(topico.id)}>
              Enviar comentário
            </button>
          </div>
        );
      })}
    </div>
  );
}
