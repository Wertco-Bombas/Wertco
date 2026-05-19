export async function checkSupervisor(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { ok: false, status: 401, error: 'No token' };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { ok: false, status: 401, error: 'Invalid user' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supervisor') {
    return { ok: false, status: 403, error: 'Not supervisor' };
  }

  return { ok: true, user };
}
