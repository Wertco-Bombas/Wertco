import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Base() {
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState({});
  const [user, setUser] = useState(null);

  const topicoId = 1; // ajuste conforme sua lógica

  useEffect(() => {
    // pega usuário logado
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    carregarComentarios();
  }, []);

  async function carregarComentarios() {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('topico_id', topicoId)
      .order('created_at', { ascending: false });

    if (!error) setComentarios(data);
  }

  async function salvarComentario(topicoId) {
    const conteudo = novoComentario[topicoId];
    if (!conteudo) return;

    const resp = await fetch('/api/comentarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo,
        topico_id: topicoId,
        usuario_id: user?.id || null
      })
    });

    const json = await resp.json();
    if (!resp.ok) {
      alert('Erro ao salvar comentário: ' + (json.error || resp.statusText));
    } else {
      setNovoComentario((prev) => ({ ...prev, [topicoId]: '' }));
      carregarComentarios();
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Base de Conhecimento</h1>

      <div
        className="comentario-input"
        style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}
      >
        <input
          type="text"
          placeholder="Adicionar comentário..."
          value={novoComentario[topicoId] || ''}
          onChange={(e) =>
            setNovoComentario((prev) => ({ ...prev, [topicoId]: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              salvarComentario(topicoId);
            }
          }}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 10,
            border: '1px solid #222',
            padding: '0 12px',
            background: 'var(--bg-dark)',
            color: '#fff'
          }}
        />
        <button onClick={() => salvarComentario(topicoId)}>Enviar</button>
      </div>

      <h2 style={{ marginTop: 20 }}>Comentários</h2>
      <ul>
        {comentarios.map((c) => (
          <li key={c.id}>
            <strong>{c.usuario_id || 'Anônimo'}:</strong> {c.conteudo}
            <br />
            <small>{new Date(c.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
