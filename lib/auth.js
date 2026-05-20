export function canAccess(role, allowed) {
  return allowed.includes(role);
}

// quem pode moderar conteúdo
export function isPrivileged(role) {
  return ['admin', 'supervisor'].includes(role);
}

// quem precisa aprovação
export function requiresApproval(role) {
  return !isPrivileged(role);
}

// atalho para aprovação direta
export function autoApprove(role) {
  return isPrivileged(role);
}

// status padrão baseado no usuário
export function getInitialApprovalStatus(role) {
  return isPrivileged(role) ? true : false;
}
