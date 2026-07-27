/* ═══════════════════════════════════════════════════════
   Excel parsing helpers
   ═══════════════════════════════════════════════════════ */

import { HARDCODED_COLUMN_ALIASES } from "./constants";

export function isHardcodedColumnName(name) {
  if (!name || typeof name !== "string") return true;
  return HARDCODED_COLUMN_ALIASES.includes(name.trim().toLowerCase());
}

export function analyzeExcelColumns(json, existingCustomColumns = []) {
  if (!json || json.length === 0) return { extras: [] };

  const allHeaders = new Set();
  json.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key && key.trim()) allHeaders.add(key.trim());
    });
  });

  const extraHeaders = Array.from(allHeaders).filter(
    (h) => !isHardcodedColumnName(h),
  );

  const extras = extraHeaders.map((header) => {
    const filledCount = json.filter((row) => {
      let val = row[header];
      if (val === undefined) {
        const actualKey = Object.keys(row).find((k) => k.trim() === header);
        if (actualKey) val = row[actualKey];
      }
      return val !== null && val !== undefined && String(val).trim() !== "";
    }).length;

    const existingMatch = existingCustomColumns.find(
      (c) => c.name.toLowerCase() === header.toLowerCase(),
    );

    return {
      name: header,
      filledCount,
      totalRows: json.length,
      willMerge: !!existingMatch,
      existingColumnId: existingMatch?.id || null,
    };
  });

  extras.sort((a, b) => {
    if (a.willMerge !== b.willMerge) return a.willMerge ? -1 : 1;
    return b.filledCount - a.filledCount;
  });

  return { extras };
}

/**
 * Build a normalized (trim + lowercase) key map for one Excel row.
 * Use with `pickFromNormalized()` to do case/whitespace-insensitive lookups.
 */
export function buildNormalizedRec(rec) {
  const normalized = {};
  Object.keys(rec).forEach((k) => {
    if (!k) return;
    const norm = k.trim().toLowerCase();
    if (normalized[norm] === undefined || normalized[norm] === "") {
      normalized[norm] = rec[k];
    }
  });
  return normalized;
}

export function pickFromNormalized(normalizedRec, keys) {
  for (const k of keys) {
    const norm = String(k).trim().toLowerCase();
    const val = normalizedRec[norm];
    if (val !== undefined && val !== "" && val !== null) {
      return val;
    }
  }
  return "";
}

export function buildExportFilename(projectName) {
  const base = (projectName || "Untitled Project")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 100);

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mn = String(now.getMinutes()).padStart(2, "0");
  const timestamp = `${dd}-${mm}-${yyyy}_${hh}${mn}`;

  return `${base || "Untitled_Project"}_${timestamp}.xlsx`;
}