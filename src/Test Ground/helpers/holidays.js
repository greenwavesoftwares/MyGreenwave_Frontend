/* ═══════════════════════════════════════════════════════
   Holidays Helpers
   ═══════════════════════════════════════════════════════ */

import { isoDate } from "./dateUtils";

/**
 * Check if a given date falls on a company holiday.
 * @param {Date|string} d - Date to check
 * @param {string[]} holidays - Array of "YYYY-MM-DD" strings
 */
export function isHoliday(d, holidays) {
  if (!d || !Array.isArray(holidays) || holidays.length === 0) return false;
  const key = typeof d === "string" ? d : isoDate(d);
  return holidays.includes(key);
}

/**
 * Convert holidays array into a Set for fast lookup.
 */
export function holidaysToSet(holidays) {
  return new Set(Array.isArray(holidays) ? holidays : []);
}