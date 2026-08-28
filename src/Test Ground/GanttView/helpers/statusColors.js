/* ═══════════════════════════════════════════════════════
   Gantt Status Colors
   ═══════════════════════════════════════════════════════ */

import { parseDt } from "./dateUtils";

/**
 * Build a theme-aware status color map.
 */
export function makeStatusColors(t) {
  return {
    pending: {
      bg: t.bgMuted,
      color: t.textMuted,
      border: t.borderStrong,
      bar: t.textFaint,
    },
    "yet to start": {
      bg: "#FED7AA",
      color: "#C2410C",
      border: "#FDBA74",
      bar: "#F97316",
    },
    // ── NEW: Start Due ──
    "start due": {
      bg: "#FEE2E2",
      color: "#DC2626",
      border: "#FCA5A5",
      bar: "#EF4444",
    },
    "not ready": {
      bg: t.warningBg,
      color: t.warning,
      border: t.warningBorder,
      bar: "#F59E0B",
    },
    rejected: {
      bg: t.dangerBg,
      color: t.danger,
      border: t.dangerBorder,
      bar: "#EF4444",
    },
    paused: {
      bg: "#FFEDD5",
      color: "#C2410C",
      border: "#FDBA74",
      bar: "#F97316",
    },
    running: {
      bg: t.primaryBg,
      color: t.primary,
      border: t.primaryBorder,
      bar: "#3B82F6",
    },
    // ── NEW: Running Late ──
    "running late": {
      bg: "#FEE2E2",
      color: "#DC2626",
      border: "#FCA5A5",
      bar: "#EF4444",
    },
    completed: {
      bg: t.successBg,
      color: t.success,
      border: t.successBorder,
      bar: "#22C55E",
    },
    finished: {
      bg: t.violetBg,
      color: t.violet,
      border: t.violetBorder,
      bar: "#8B5CF6",
    },
    closed: {
      bg: t.closedBg,
      color: t.closedText,
      border: t.closedBorder,
      bar: "#64748B",
    },
  };
}

/**
 * Get the color scheme for a given status.
 */
export function getStatusColor(status, t) {
  const STATUS_COLORS = makeStatusColors(t);
  const key = String(status || "pending")
    .toLowerCase()
    .trim();
  return STATUS_COLORS[key] || STATUS_COLORS.pending;
}

/**
 * Special color scheme for delayed rows.
 */
export function getDelayedColor(t) {
  return {
    bg: t.dangerBg,
    color: t.danger,
    border: t.dangerBorder,
    bar: "#EF4444",
  };
}

/**
 * Determine if a row is delayed (completed/finished but actual > planned).
 */
export function isDelayed(row) {
  const status = String(row.status || "")
    .toLowerCase()
    .trim();
  if (status !== "completed" && status !== "finished") return false;
  const plannedStop = parseDt(row.plannedStop);
  const actualStop = parseDt(row.actualStop);
  if (!plannedStop || !actualStop) return false;
  return actualStop.getTime() > plannedStop.getTime();
}