// pages/excluir-categoria.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function ExcluirCategoria() {
  const [categorias, setCategorias] = useState([]);
  const [selected, setSelected] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('categorias').select('id, nome');
      setCategorias(data || []);
    }
    load();
  }, []);

  async function handleExcluir() {
    if (!selected) return alert('Selecione uma categoria');
    if (!confirm('Confirma exclusão da categoria selecionada?')) return;
    setDeleting(true);
    const { error } = await supabase.from('categorias').delete().eq('id', selected);
    setDeleting(false);
    if (error) alert('Erro ao excluir: ' + error.message);
    else router.push('/base');
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">- Excluir Categoria</h2>
        </div>

        <div className="card">
          <label className="formLabel">Selecione a categoria</label>
          <select className="formInput" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">-- selecione --</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <button className="btn btnDangerOutline" onClick={handleExcluir} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir Categoria'}
            </button>
            <button className="btn" onClick={() => router.push('/base')}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
