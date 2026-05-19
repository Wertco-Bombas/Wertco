// pages/base.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export default function Base() {
  const router = useRouter();

  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [novoComentario, setNovoComentario] = useState({});
  const [imagem, setImagem] = useState({});

  useEffect(() => {
    async function carregarDados() {
      const { data: tops, error } = await supabase
        .from('topicos')
        .select('id, titulo, conteudo, categoria_id, categorias(nome), imagem_url');

      if (!error) {
        setTopicos(tops || []);
        for (const t of tops || []) {
          carregarComentarios(t.id);
        }
      } else {
        console.error('Erro ao carregar tópicos:', error);
      }
    }

    carregarDados();
  }, []);

  async function carregarComentarios(topicoId) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId)
      .order('id', { ascending: true });

    if (!error) {
      setComentarios(prev => ({ ...prev, [topicoId]: data || [] }));
    } else {
      console.error('Erro ao carregar comentários:', error);
    }
  }

  async function salvarComentario(topicoId) {
    const conteudo = (novoComentario[topicoId] || '').trim();
    if (!conteudo) return;

    const { error } = await supabase
      .from('comentarios')
      .insert({ conteudo, topico_id: topicoId });

    if (!error) {
      setNovoComentario(prev => ({ ...prev, [topicoId]: '' }));
      carregarComentarios(topicoId);
    } else {
      alert('Erro ao salvar comentário: ' + error.message);
    }
  }

  async function uploadImagem(file, topicoId) {
    if (!file) return;
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const fileName = `topico-${topicoId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('imagens')
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

      if (!error && data?.path) {
        const publicUrl = supabase.storage.from('imagens').getPublicUrl(data.path).data.publicUrl;
        const { error: updateError } = await supabase
          .from('topicos')
          .update({ imagem_url: publicUrl })
          .eq('id', topicoId);

        if (updateError) {
          alert('Erro ao atualizar tópico com imagem: ' + updateError.message);
        } else {
          // recarrega tópicos
          const { data: tops } = await supabase
            .from('topicos')
            .select('id, titulo, conteudo, categoria_id, categorias(nome), imagem_url');
          setTopicos(tops || []);
        }
      } else {
        alert('Erro ao enviar imagem: ' + (error?.message || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro ao comprimir/enviar imagem: ' + err.message);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">Base de Conhecimento</h2>
          <div className="badge">{topicos.length} artigos</div>
        </div>

        <div className="card">
          <input
            type="text"
            placeholder="Pesquisar títulos, descrições, categorias, comentários..."
            className="search-bar"
            aria-label="Pesquisar base de conhecimento"
            onChange={() => { /* implementar filtro se desejar */ }}
          />

          <div className="actions" style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btnYellow"
              onClick={() => router.push('/nova-categoria')}
              aria-label="Nova Categoria"
            >
              + Nova Categoria
            </button>

            <button
              className="btn btnYellow"
              onClick={() => router.push('/novo-topico')}
              aria-label="Novo Tópico"
            >
              + Novo Tópico
            </button>

            <button
              className="btn btnDangerOutline"
              onClick={() => router.push('/excluir-categoria')}
              aria-label="Excluir Categoria"
            >
              - Excluir Categoria
            </button>

            <button
              className="btn btnDangerOutline"
              onClick={() => router.push('/excluir-topico')}
              aria-label="Excluir Tópico"
            >
              - Excluir Tópico
            </button>
          </div>
        </div>

        <h3 style={{ marginTop: 20, marginBottom: 12, color: 'var(--yellow)' }}>Tópicos</h3>

        <div className="topicos-list">
          {topicos.map(top => (
            <div key={top.id} className="topico-card card" style={{ marginBottom: 16 }}>
              <div className="topico-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <h3 className="topico-titulo" style={{ margin: 0 }}>{top.titulo}</h3>
                <span className="categoria-tag" style={{ background: 'rgba(255,214,0,0.12)', color: 'var(--yellow)', padding: '6px 10px', borderRadius: 999, fontWeight: 700 }}>
                  {top.categorias?.nome || 'Sem categoria'}
                </span>
              </div>

              {top.conteudo && <p style={{ marginTop: 12 }}>{top.conteudo}</p>}

              {top.imagem_url && (
                <img
                  src={top.imagem_url}
                  alt="Imagem do tópico"
                  style={{ maxWidth: '320px', marginTop: 10, borderRadius: 8 }}
                />
              )}

              <div className="comentarios" style={{ marginTop: 14 }}>
                <h4 style={{ marginBottom: 8, color: 'var(--yellow)' }}>Comentários</h4>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {(comentarios[top.id] || []).map(com => (
                    <li key={com.id} style={{ marginBottom: 6 }}>{com.conteudo}</li>
                  ))}
                </ul>

                <div className="comentario-input" style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Adicionar comentário..."
                    value={novoComentario[top.id] || ''}
                    onChange={(e) =>
                      setNovoComentario(prev => ({ ...prev, [top.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        salvarComentario(top.id);
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      border: '1px solid #222',
                      padding: '0 12px',
                      background: 'var(--bg-dark)',
                      color: '#fff'
                    }}
                    aria-label={`Adicionar comentário para ${top.titulo}`}
                  />

                  <label className="clip-upload" title="Enviar imagem" style={{ cursor: 'pointer', fontSize: 20 }}>
                    📎
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) =>
                        uploadImagem(e.target.files[0], top.id)
                      }
                    />
                  </label>

                  <button
                    onClick={() => salvarComentario(top.id)}
                    className="btn btnYellow"
                    style={{ height: 44 }}
                    aria-label="Enviar comentário"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {topicos.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              Nenhum tópico encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
