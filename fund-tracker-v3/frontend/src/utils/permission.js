export function canEditRecords(role) {
  return role === "OWNER" || role === "EDITOR";
}

export function canImportRecords(role) {
  return canEditRecords(role);
}

export function canManageMembers(role) {
  return role === "OWNER";
}

export function canManagePortfolio(role) {
  return role === "OWNER";
}
