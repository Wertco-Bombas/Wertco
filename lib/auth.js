import { supabaseAdmin } from './supabase';

export async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  const { data } = await supabaseAdmin.auth.getUser(token);
  return data?.user || null;
}

export async function getUserRole(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role || 'user';
}

export function isAdmin(role) {
  return role === 'admin';
}

export function isPrivileged(role) {
  return ['admin', 'supervisor'].includes(role);
}

export function requiresApproval(role) {
  return !isPrivileged(role);
}
