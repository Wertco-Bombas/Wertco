import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export default function Base() {
  const [categorias, setCategorias] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [novoComentario, setNovoComentario] = useState({});
  const [imagem, setImagem] = useState(null);

  // Carregar categorias e tópicos (com categoria associada)
  useEffect(() => {
    async function carregarDados() {
      const { data: cats } = await supabase.from('categorias').select('*');
      const { data: tops } = await supabase
        .from('topicos')
        .select('id, titulo, conteudo, categoria_id, categorias(nome)');
      setCategorias(cats || []);
      setTopicos(tops || []);
    }
    carregarDados();
  }, []);

  // Carregar comentários de um tópico
  async function carregarComentarios(topicoId) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId);
    if (!error) {
      setComentarios(prev => ({ ...prev, [topicoId]: data }));
    }
  }

  // Salvar comentário
  async function salvarComentario(topicoId) {
    const conteudo = novoComentario[topicoId] || '';
    if (!conteudo.trim()) return;

    const { error } = await supabase
      .from('comentarios')
      .insert({ conteudo, topico_id: topicoId });

    if (error) {
      alert(error.message);
    } else {
      setNovoComentario(prev => ({ ...prev, [topicoId]: '' }));
      carregarComentarios(topicoId);
    }
  }

  // Upload e compressão de imagem
  async function uploadImagem(file, topicoId) {
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const { data, error } = await supabase.storage
        .from('imagens') // bucket chamado "imagens"
        .upload(`topico-${topicoId}-${Date.now()}.jpg`, compressedFile);

      if (error) {
        alert(error.message);
      } else {
        const url = supabase.storage.from('imagens').getPublicUrl(data.path).data.publicUrl;
        await supabase.from('topicos').update({ imagem_url: url }).eq('id', topicoId);
        alert('Imagem enviada com sucesso!');
      }
    } catch (err) {
      alert('Erro ao comprimir/enviar imagem: ' + err.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
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
            <h3>{top.titulo}</h3>
            {top.conteudo && <p>{top.conteudo}</p>}
            <p><strong>Categoria:</strong> {top.categorias?.nome || 'Sem categoria'}</p>

            {/* Mostrar imagem se existir */}
            {top.imagem_url && (
              <img src={top.imagem_url} alt="Imagem do tópico" style={{ maxWidth: '200px' }} />
            )}

            {/* Upload de imagem */}
            <input type="file" accept="image/*" onChange={(e) => setImagem(e.target.files[0])} />
            <button onClick={() => uploadImagem(imagem, top.id)}>Enviar Imagem</button>

            <div className="comentarios">
              <h4>Comentários</h4>
              <button onClick={() => carregarComentarios(top.id)}>Carregar comentários</button>
              <ul>
                {(comentarios[top.id] || []).map(com => (
                  <li key={com.id}>{com.conteudo}</li>
                ))}
              </ul>

              <input
                type="text"
                placeholder="Adicionar comentário..."
                value={novoComentario[top.id] || ''}
                onChange={(e) =>
                  setNovoComentario(prev => ({ ...prev, [top.id]: e.target.value }))
                }
              />
              <button onClick={() => salvarComentario(top.id)}>Enviar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="navigation">
        <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
        <button onClick={handleLogout}>Sair</button>
      </div>
    </div>
  );
}
