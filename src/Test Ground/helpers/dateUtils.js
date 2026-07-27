/* ═══════════════════════════════════════════════════════
   Date parsing and formatting utilities
   ═══════════════════════════════════════════════════════ */

import { WORK_START_HR } from "./constants";

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoDateTime(d) {
  return `${isoDate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function parseISODateTime(s) {
  if (!s) return null;
  const norm = s.replace(" ", "T");
  const m = norm.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4] || WORK_START_HR),
    Number(m[5] || 0),
    0,
    0,
  );
}

export function fmtDisplay(d) {
  if (!d) return "";
  if (typeof d === "string") d = parseISODateTime(d);
  if (!(d instanceof Date) || isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${mn}`;
}

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

export function isWeekday(d) {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}