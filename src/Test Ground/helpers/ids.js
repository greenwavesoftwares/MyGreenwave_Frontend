/* ═══════════════════════════════════════════════════════
   ID generators
   ═══════════════════════════════════════════════════════ */

export function generateProjectId() {
  return `prj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateRowId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateModuleId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `mod_${crypto.randomUUID().slice(0, 12)}`;
  }
  return `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}