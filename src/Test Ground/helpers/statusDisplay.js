/* ═══════════════════════════════════════════════════════
   Status Display Helper
   Determines the visual status label based on time comparison
   ═══════════════════════════════════════════════════════ */

import { parseISODateTime } from "./dateUtils";

/**
 * Returns the display status for a row based on time-aware logic.
 *
 * Rules:
 *   - Pending + plannedStart > now  → "Yet to Start"
 *   - Pending + plannedStart <= now → "Due to Start"
 *   - Pending + no plannedStart     → "Pending" (neutral fallback)
 *   - Running + plannedStop > now   → "Running"
 *   - Running + plannedStop <= now  → "Running Late"
 *   - Running + no plannedStop      → "Running"
 *   - Any other status              → returned as-is
 *
 * NOTE: This is FRONTEND-ONLY. The actual row.status is not mutated.
 */
export function getDisplayStatus(row) {
  const rawStatus = String(row?.status || "Pending").trim();
  const normalized = rawStatus.toLowerCase();
  const now = new Date();

  // ── Pending logic ──
  if (normalized === "pending") {
    if (!row?.plannedStart) return "Pending"; // no data → neutral fallback
    const plannedStart = parseISODateTime(row.plannedStart);
    if (!plannedStart || isNaN(plannedStart.getTime())) return "Pending";

    if (plannedStart.getTime() > now.getTime()) return "Yet to Start";
    return "Due to Start";
  }

  // ── Running logic ──
  if (normalized === "running") {
    if (!row?.plannedStop) return "Running"; // no data → default running
    const plannedStop = parseISODateTime(row.plannedStop);
    if (!plannedStop || isNaN(plannedStop.getTime())) return "Running";

    if (plannedStop.getTime() <= now.getTime()) return "Running Late";
    return "Running";
  }

  // ── All other statuses returned as-is ──
  return rawStatus;
}

/**
 * All possible display statuses used in filters.
 */
export const DISPLAY_STATUSES = [
  "Yet to Start",
  "Pending",
  "Due to Start",
  "Running",
  "Running Late",
  "Paused",
  "Completed",
  "Finished",
  "Rejected",
];