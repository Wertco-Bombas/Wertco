// pages/nova-categoria.js
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function NovaCategoria() {
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSalvar(e) {
    e.preventDefault();
    if (!nome.trim()) return alert('Informe o nome da categoria');
    setSaving(true);
    const { error } = await supabase.from('categorias').insert({ nome: nome.trim() });
    setSaving(false);
    if (error) {
      alert('Erro ao criar categoria: ' + error.message);
    } else {
      router.push('/base');
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topicHeader">
          <h2 className="topicTitle">+ Nova Categoria</h2>
        </div>

        <div className="card">
          <form onSubmit={handleSalvar} className="formStack">
            <label className="formLabel">Nome da categoria</label>
            <input
              className="formInput"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Procedimentos, Segurança, FAQ..."
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn btnYellow" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Categoria'}
              </button>
              <button type="button" className="btn btnDangerOutline" onClick={() => router.push('/base')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
