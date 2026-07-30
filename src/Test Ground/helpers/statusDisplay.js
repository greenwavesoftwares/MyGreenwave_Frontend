/* ═══════════════════════════════════════════════════════
   Status Display Helper
   Determines the visual status label based on planned start
   ═══════════════════════════════════════════════════════ */

import { parseISODateTime } from "./dateUtils";

/**
 * Returns the display status for a row.
 * - If actual status is "Pending" AND plannedStart is in the past → "Yet to Start"
 * - Otherwise returns the actual status (or "Pending" as default)
 *
 * NOTE: This is FRONTEND-ONLY. The actual row.status is not mutated.
 */
export function getDisplayStatus(row) {
  const rawStatus = String(row?.status || "Pending").trim();
  const normalized = rawStatus.toLowerCase();

  // Only "Pending" rows can become "Yet to Start"
  if (normalized !== "pending") return rawStatus;

  if (!row?.plannedStart) return "Pending";

  const plannedStart = parseISODateTime(row.plannedStart);
  if (!plannedStart || isNaN(plannedStart.getTime())) return "Pending";

  const now = new Date();
  if (plannedStart.getTime() > now.getTime()) return "Yet to Start";

  return "Pending";
}

/**
 * All possible display statuses used in filters.
 */
export const DISPLAY_STATUSES = [
  "Yet to Start",
  "Pending",
  "Running",
  "Paused",
  "Completed",
  "Finished",
  "Rejected",
];