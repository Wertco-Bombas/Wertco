export function canAccess(role, allowed) {
  return allowed.includes(role);
}

export function isPrivileged(role) {
  return ['admin', 'supervisor'].includes(role);
}

export function requiresApproval(role) {
  return !isPrivileged(role);
}

export function getInitialApprovalStatus(role) {
  return isPrivileged(role);
}
