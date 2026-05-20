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
      // confirma sessão do usuário (pode ser null se anon)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session ?? null;

      // payload sem id — deixe o banco gerar a PK
      const payload = {
        conteudo: conteudo.trim(),
        topico_id: Number(topicoId),
        usuario_id: session?.user?.id ?? null,
        usuario_nome: session?.user?.email ?? null,
        user_email: session?.user?.email ?? null,
        user_role: session ? 'authenticated' : 'anon',
        approved: false
      };

      // validação mínima
      if (!payload.conteudo) {
        setErrorMsg('Conteúdo vazio');
        setLoading(false);
        return;
      }

      // insert sem enviar id
      const { data, error, status } = await supabase
        .from('comentarios')
        .insert([payload])
        .select();

      if (error) {
        setErrorMsg(error.message || JSON.stringify(error));
        setResult({ status, data: null });
      } else {
        setResult({ status, data });
        setConteudo('');
      }
    } catch (err) {
      setErrorMsg(err.message || String(err));
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
          style={{ width: '100%', padding: 8, fontSize: 14 }}
          placeholder="Escreva seu comentário..."
        />
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
            {loading ? 'Enviando...' : 'Enviar comentário'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div style={{ marginTop: 12, color: 'crimson' }}>
          <strong>Erro ao salvar comentário:</strong> {errorMsg}
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
