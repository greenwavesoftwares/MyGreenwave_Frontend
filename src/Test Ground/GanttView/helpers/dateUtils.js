/* ═══════════════════════════════════════════════════════
   Gantt Date Utilities
   ═══════════════════════════════════════════════════════ */

import { DAY_MS } from "./constants";

/**
 * Parse a value into a Date object. Returns null if invalid.
 */
export function parseDt(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

/**
 * Format a date/time value for display.
 */
export function fmtDisplay(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format hours as "Xh Ym" or "Xh" or "Ym".
 */
export function fmtHrMin(hrs) {
  if (hrs === null || hrs === undefined || isNaN(hrs)) return "—";
  const totalMinutes = Math.round(Math.abs(hrs) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const sign = hrs < 0 ? "-" : "";
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/**
 * Generate minor ticks (hourly / daily / weekly) between start and end.
 */
export function generateTicks(startMs, endMs, unitMs) {
  const ticks = [];
  const first = Math.floor(startMs / unitMs) * unitMs;
  let cur = first;
  while (cur <= endMs + unitMs) {
    ticks.push(new Date(cur));
    cur += unitMs;
  }
  return ticks;
}

/**
 * Generate major ticks (month boundaries).
 * Only includes ticks that fall within the chart range.
 */
export function generateMajorTicks(startMs, endMs) {
  const ticks = [];
  const start = new Date(startMs);
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur.getTime() <= endMs) {
    ticks.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return ticks;
}