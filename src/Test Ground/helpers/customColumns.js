/* ═══════════════════════════════════════════════════════
   Custom column helpers
   ═══════════════════════════════════════════════════════ */

export function generateCustomColumnId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `col_${crypto.randomUUID().slice(0, 12)}`;
  }
  return `col_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isColumnNameUnique(name, existingColumns, excludeId = null) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return false;
  return !existingColumns.some(
    (c) => c.id !== excludeId && c.name.toLowerCase() === trimmed,
  );
}

export function sortCustomColumns(columns) {
  return [...(columns || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}