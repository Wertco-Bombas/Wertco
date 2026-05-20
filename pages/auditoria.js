// pages/auditoria.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Auditoria() {
  const [userRole, setUserRole] = useState('user');
  const [logs, setLogs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    load();

    const channel = supabase
      .channel('auditoria-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auditoria' },
        (payload) => {
          setLogs(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function load() {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';
    setUserRole(role);

    if (!['admin', 'supervisor'].includes(role)) {
      router.push('/dashboard');
      return;
    }

    const { data } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false });

    setLogs(data || []);
  }

  // ================================
  // CORREÇÃO PRINCIPAL AQUI
  // ================================

  const filteredLogs =
    userRole === 'supervisor'
      ? logs.filter(l => l.status === 'pending')   // 🔥 CORRETO
      : logs;

  return (
    <div style={{ padding: 20 }}>
      <h1>Auditoria do Sistema</h1>

      {filteredLogs.length === 0 && (
        <p>Nenhum registro encontrado</p>
      )}

      {filteredLogs.map(log => (
        <div
          key={log.id}
          style={{
            borderBottom: '1px solid #333',
            padding: 10,
            marginBottom: 10
          }}
        >
          <strong>{log.acao}</strong>

          <p>{log.entidade}</p>

          <small>
            {log.usuario_email} •{' '}
            {log.created_at
              ? new Date(log.created_at).toLocaleString()
              : ''}
          </small>

          {log.status && (
            <div style={{
              display: 'inline-block',
              padding: '2px 8px',
              marginTop: 5,
              borderRadius: 4,
              fontSize: 12,
              background:
                log.status === 'pending'
                  ? '#ffcc00'
                  : log.status === 'approved'
                  ? '#00cc66'
                  : '#666'
            }}>
              {log.status}
            </div>
          )}

          {log.payload && (
            <pre style={{ fontSize: 11, color: '#999' }}>
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
