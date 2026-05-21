export function canAccess(role, allowed) {
  return allowed.includes(role);
}

export function isPrivileged(role) {
  return role === 'admin' || role === 'supervisor';
}

export function requiresApproval(role) {
  return !isPrivileged(role);
}

export function getInitialApprovalStatus(role) {
  return isPrivileged(role);
}
