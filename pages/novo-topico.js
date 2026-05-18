import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NovoTopico() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);

  // Carregar categorias ativas ao abrir a página
  useEffect(() => {
    async function carregarCategorias() {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('ativa', true); // só categorias ativas
      if (error) {
        alert(error.message);
      } else {
        setCategorias(data);
      }
    }
    carregarCategorias();
  }, []);

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

        {/* Dropdown de categorias ativas */}
        <select 
          value={categoriaId} 
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>

        <button type="submit">Salvar</button>
      </form>
      <button onClick={() => window.location.href='/base'}>Cancelar</button>
    </div>
  );
}
