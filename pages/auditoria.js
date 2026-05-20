import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auditoria() {
  const [userRole, setUserRole] = useState('user');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: session } = await supabase.auth.getSession();

    const user = session?.session?.user;

    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setUserRole(profile?.role || 'user');

    const { data } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false });

    setLogs(data || []);
  }

  if (!['admin', 'supervisor'].includes(userRole)) {
    return <h2>Acesso negado</h2>;
  }

  const filteredLogs =
    userRole === 'supervisor'
      ? logs.filter(l => l.status === 'pending')
      : logs;

  return (
    <div>
      <h1>Auditoria</h1>

      {filteredLogs.map(log => (
        <div key={log.id}>
          <p>{log.acao}</p>
          <small>{log.created_at}</small>
        </div>
      ))}
    </div>
  );
}
