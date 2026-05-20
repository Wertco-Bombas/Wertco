// lib/auth.js

export function canAccess(role, allowed) {
  return allowed.includes(role);
}
