import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NovaCategoria() {
  const [nome, setNome] = useState('');

  async function salvarCategoria(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('categorias')
      .insert({ nome });
    if (error) {
      alert(error.message);
    } else {
      alert('Categoria criada com sucesso!');
      window.location.href = '/base';
    }
  }

  return (
    <div className="form-container">
      <h1>Nova Categoria</h1>
      <form onSubmit={salvarCategoria}>
        <input 
          type="text" 
          placeholder="Nome da categoria" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
        />
        <button type="submit">Salvar</button>
      </form>
      <button onClick={() => window.location.href='/base'}>Cancelar</button>
    </div>
  );
}
