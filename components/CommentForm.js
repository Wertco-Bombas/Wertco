// components/CommentForm.js

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CommentForm({ topicoId = 1 }) {
  const [conteudo, setConteudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      // pega sessão (opcional)
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const payload = {
        conteudo: conteudo.trim(),
        topico_id: Number(topicoId),
        usuario_id: session?.user?.id || null,
        usuario_email: session?.user?.email || null
      };

      console.log('PAYLOAD ENVIADO:', payload);

      if (!payload.conteudo) {
        setErrorMsg('Digite um comentário');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/comentarios/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log('RESPOSTA:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar comentário');
      }

      setResult(data);
      setConteudo('');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <strong>Comentário</strong>
        </label>

        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: 8,
            fontSize: 14
          }}
          placeholder="Escreva seu comentário..."
        />

        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar comentário'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div style={{ marginTop: 12, color: 'crimson' }}>
          <strong>Erro:</strong> {errorMsg}
        </div>
      )}

      {result && (
        <pre style={{ marginTop: 12, background: '#f6f6f6', padding: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
