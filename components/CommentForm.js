// components/CommentForm.js

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CommentForm({ topicoId }) {
  const [conteudo, setConteudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('Você precisa estar logado');
      }

      const payload = {
        conteudo: conteudo.trim(),
        topico_id: Number(topicoId),
        usuario_id: session.user.id,
        user_email: session.user.email,
        approved: false // sempre começa pendente
      };

      if (!payload.conteudo) {
        throw new Error('Digite um comentário');
      }

      const { error } = await supabase
        .from('comentarios')
        .insert(payload);

      if (error) throw error;

      setConteudo('');
      setSuccessMsg('Comentário enviado para aprovação');

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>

        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: 8 }}
          placeholder="Escreva seu comentário..."
        />

        <button disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar comentário'}
        </button>

      </form>

      {errorMsg && (
        <p style={{ color: 'red' }}>{errorMsg}</p>
      )}

      {successMsg && (
        <p style={{ color: 'green' }}>{successMsg}</p>
      )}
    </div>
  );
}
