import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NovoTopico() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoriaId, setCategoriaId] = useState('');

  async function salvarTopico(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('topicos')
      .insert({ titulo, conteudo, categoria_id: categoriaId });
    if (error) {
      alert(error.message);
    } else {
      alert('Tópico criado com sucesso!');
      window.location.href = '/base';
    }
  }

  return (
    <div className="form-container">
      <h1>Novo Tópico</h1>
      <form onSubmit={salvarTopico}>
        <input 
          type="text" 
          placeholder="Título do tópico" 
          value={titulo} 
          onChange={(e) => setTitulo(e.target.value)} 
        />
        <textarea 
          placeholder="Conteúdo" 
          value={conteudo} 
          onChange={(e) => setConteudo(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="ID da categoria" 
          value={categoriaId} 
          onChange={(e) => setCategoriaId(e.target.value)} 
        />
        <button type="submit">Salvar</button>
      </form>
      <button onClick={() => window.location.href='/base'}>Cancelar</button>
    </div>
  );
}
