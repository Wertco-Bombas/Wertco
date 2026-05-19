// pages/novo-topico.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function NovoTopico() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadCats() {
      const { data } = await supabase.from('categorias').select('id, nome');
      setCategorias(data || []);
    }
    loadCats();
  }, []);

  async function handleSalvar(e) {
    e.preventDefault();
    if (!titulo.trim()) return alert('Informe o título');
    setSaving(true);
    const { error } = await supabase.from('topicos').insert({
      titulo: titulo.trim(),
      conteudo,
      categoria_id: categoriaId || null
    });
    setSaving(false);
    if (error) alert('Erro ao criar tópico: ' + error.message);
    else router.push('/base');
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">+ Novo Tópico</h2>
        </div>

        <div className="card">
          <form onSubmit={handleSalvar} className="formStack">
            <label className="formLabel">Título</label>
            <input className="formInput" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

            <label className="formLabel">Conteúdo</label>
            <textarea className="formTextarea" value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={6} />

            <label className="formLabel">Categoria</label>
            <select className="formInput" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn btnYellow" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Tópico'}
              </button>
              <button type="button" className="btn btnDangerOutline" onClick={() => router.push('/base')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
