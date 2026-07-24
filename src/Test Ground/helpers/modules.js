/* ═══════════════════════════════════════════════════════
   Module registry helpers
   ═══════════════════════════════════════════════════════ */

import { generateModuleId } from "./ids";

export function ensureModuleId(moduleName, registry) {
  const name = (moduleName || "").trim();
  if (!name) return { moduleId: "", registry };
  if (registry[name]) {
    return { moduleId: registry[name], registry };
  }
  const newId = generateModuleId();
  return {
    moduleId: newId,
    registry: { ...registry, [name]: newId },
  };
}

export function syncModuleIds(rows, existingRegistry = {}) {
  let registry = { ...existingRegistry };

  rows.forEach((r) => {
    const name = (r.module || "").trim();
    if (name && !registry[name]) {
      registry[name] = generateModuleId();
    }
  });

  const updatedRows = rows.map((r) => {
    const name = (r.module || "").trim();
    return {
      ...r,
      moduleId: name ? registry[name] : "",
    };
  });

  const activeNames = new Set(
    rows.map((r) => (r.module || "").trim()).filter(Boolean),
  );
  const cleanedRegistry = {};
  Object.entries(registry).forEach(([name, id]) => {
    if (activeNames.has(name)) cleanedRegistry[name] = id;
  });

  return { rows: updatedRows, registry: cleanedRegistry };
}

export function getModuleColor(moduleName, moduleColorMap) {
  if (!moduleName)
    return { bg: "#F1F5F9", color: "#94A3B8", border: "#E2E8F0" };
  return (
    moduleColorMap[moduleName] || {
      bg: "#F1F5F9",
      color: "#94A3B8",
      border: "#E2E8F0",
    }
  );
}