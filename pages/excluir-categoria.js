import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExcluirCategoria() {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    async function carregarCategorias() {
      const { data, error } = await supabase.from('categorias').select('*');
      if (!error) setCategorias(data);
    }
    carregarCategorias();
  }, []);

  async function excluirCategoria(id) {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert('Categoria excluída!');
      window.location.href = '/base';
    }
  }

  return (
    <div className="form-container">
      <h1>Excluir Categoria</h1>
      <ul>
        {categorias.map(cat => (
          <li key={cat.id}>
            {cat.nome} 
            <button onClick={() => excluirCategoria(cat.id)}>Excluir</button>
          </li>
        ))}
      </ul>
      <button onClick={() => window.location.href='/base'}>Cancelar</button>
    </div>
  );
}
