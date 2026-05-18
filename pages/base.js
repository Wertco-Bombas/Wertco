import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export default function Base() {
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
      }
    }
    carregarDados();
  }, []);

  async function carregarComentarios(topicoId) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId);
    if (!error) {
      setComentarios(prev => ({ ...prev, [topicoId]: data }));
    }
  }

  async function salvarComentario(topicoId) {
    const conteudo = novoComentario[topicoId] || '';
    if (!conteudo.trim()) return;

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

      const { data, error } = await supabase.storage
        .from('imagens')
        .upload(`topico-${topicoId}-${Date.now()}.jpg`, compressedFile);

      if (!error) {
        const url = supabase.storage.from('imagens').getPublicUrl(data.path).data.publicUrl;
        await supabase.from('topicos').update({ imagem_url: url }).eq('id', topicoId);
        const { data: tops } = await supabase
          .from('topicos')
          .select('id, titulo, conteudo, categoria_id, categorias(nome), imagem_url');
        setTopicos(tops || []);
      } else {
        alert('Erro ao enviar imagem: ' + error.message);
      }
    } catch (err) {
      alert('Erro ao comprimir/enviar imagem: ' + err.message);
    }
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      <input
        type="text"
        placeholder="Pesquisar títulos, descrições, categorias, comentários..."
        className="search-bar"
      />

      <div className="actions">
        <button onClick={() => window.location.href='/nova-categoria'}>+ Nova Categoria</button>
        <button onClick={() => window.location.href='/novo-topico'}>+ Novo Tópico</button>
        <button onClick={() => window.location.href='/excluir-categoria'}>- Excluir Categoria</button>
        <button onClick={() => window.location.href='/excluir-topico'}>- Excluir Tópico</button>
      </div>

      <h2>Tópicos</h2>
      <div className="topicos-list">
        {topicos.map(top => (
          <div key={top.id} className="topico-card">
            <div className="topico-header">
              <h3 className="topico-titulo">{top.titulo}</h3>
              <span className="categoria-tag">{top.categorias?.nome || 'Sem categoria'}</span>
            </div>

            {top.conteudo && <p>{top.conteudo}</p>}

            {top.imagem_url && (
              <img
                src={top.imagem_url}
                alt="Imagem do tópico"
                style={{ maxWidth: '200px', marginTop: '10px' }}
              />
            )}

            <div className="comentarios">
              <h4>Comentários</h4>
              <ul>
                {(comentarios[top.id] || []).map(com => (
                  <li key={com.id}>{com.conteudo}</li>
                ))}
              </ul>

              <div className="comentario-input">
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
                />

                <label className="clip-upload">
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

                <button onClick={() => salvarComentario(top.id)}>Enviar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
