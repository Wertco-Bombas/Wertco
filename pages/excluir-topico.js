import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExcluirTopico() {
  const [topicos, setTopicos] = useState([]);

  useEffect(() => {
    async function carregarTopicos() {
      const { data, error } = await supabase.from('topicos').select('*');
      if (!error) setTopicos(data);
    }
    carregarTopicos();
  }, []);

  async function excluirTopico(id) {
    const { error } = await supabase.from('topicos').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert('Tópico excluído!');
      window.location.href = '/base';
    }
  }

  return (
    <div className="form-container">
      <h1>Excluir Tópico</h1>
      <ul>
        {topicos.map(top => (
          <li key={top.id}>
            {top.titulo} 
            <button onClick={() => excluirTopico(top.id)}>Excluir</button>
          </li>
        ))}
      </ul>
      <button onClick={() => window.location.href='/base'}>Cancelar</button>
    </div>
  );
}
