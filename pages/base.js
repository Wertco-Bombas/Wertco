import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Base() {
  const [categorias, setCategorias] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    async function carregarDados() {
      const { data: cats } = await supabase.from('categorias').select('*');
      const { data: tops } = await supabase.from('topicos').select('*');
      setCategorias(cats || []);
      setTopicos(tops || []);
    }
    carregarDados();
  }, []);

  async function salvarComentario(topicoId) {
    const { error } = await supabase
      .from('comentarios')
      .insert({ conteudo: comentario, topico_id: topicoId });
    if (error) alert(error.message);
    else {
      alert('Comentário adicionado!');
      setComentario('');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="base-container">
      <h1>Base de Conhecimento</h1>

      <div className="actions">
        <button onClick={() => window.location.href='/nova-categoria'}>+ Nova Categoria</button>
        <button onClick={() => window.location.href='/novo-topico'}>+ Novo Tópico</button>
        <button onClick={() => window.location.href='/excluir-categoria'}>- Excluir Categoria</button>
        <button onClick={() => window.location.href='/excluir-topico'}>- Excluir Tópico</button>
      </div>

      <h2>Categorias</h2>
      <ul>
        {categorias.map(cat => (
          <li key={cat.id}>{cat.nome}</li>
        ))}
      </ul>

      <h2>Tópicos</h2>
      <ul>
        {topicos.map(top => (
          <li key={top.id}>
            <strong>{top.titulo}</strong>
            <p>{top.conteudo}</p>
            <input 
              type="text" 
              placeholder="Comentar..." 
              value={comentario} 
              onChange={(e) => setComentario(e.target.value)} 
            />
            <button onClick={() => salvarComentario(top.id)}>Enviar Comentário</button>
          </li>
        ))}
      </ul>

      <button onClick={() => window.location.href='/dashboard'}>Voltar ao Dashboard</button>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}
