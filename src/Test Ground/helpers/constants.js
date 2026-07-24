/* ═══════════════════════════════════════════════════════
   Constants used across the module
   ═══════════════════════════════════════════════════════ */

// Working hours
export const WORK_START_HR = 10;
export const WORK_END_HR = 18;

// Custom columns
export const MAX_CUSTOM_COL_CHARS = 500;
export const DEFAULT_CUSTOM_COL_WIDTH = 180;
export const MIN_CUSTOM_COL_WIDTH = 100;
export const MAX_CUSTOM_COL_WIDTH = 500;

// Module color palette
export const MODULE_COLORS = [
  { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" }, // Blue
  { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" }, // Green
  { bg: "#EDE9FE", color: "#7C3AED", border: "#DDD6FE" }, // Violet
  { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" }, // Amber
  { bg: "#FCE7F3", color: "#BE185D", border: "#F9A8D4" }, // Pink
  { bg: "#CCFBF1", color: "#0F766E", border: "#5EEAD4" }, // Teal
  { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" }, // Red
  { bg: "#E0F2FE", color: "#0369A1", border: "#7DD3FC" }, // Sky
  { bg: "#ECFCCB", color: "#4D7C0F", border: "#BEF264" }, // Lime
  { bg: "#F3E8FF", color: "#9333EA", border: "#D8B4FE" }, // Purple
  { bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" }, // Orange
  { bg: "#F0FDFA", color: "#115E59", border: "#99F6E4" }, // Emerald
];

// Resource tone colors (used in ResChip)
export const TONE_COLORS = {
  1: { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  2: { bg: "#EDE9FE", color: "#7C3AED", border: "#C4B5FD" },
  3: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  4: { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" },
  5: { bg: "#CCFBF1", color: "#0F766E", border: "#5EEAD4" },
  6: { bg: "#FCE7F3", color: "#BE185D", border: "#F9A8D4" },
  7: { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" },
  8: { bg: "#E0F2FE", color: "#0369A1", border: "#7DD3FC" },
  9: { bg: "#ECFCCB", color: "#4D7C0F", border: "#BEF264" },
  10: { bg: "#F3E8FF", color: "#9333EA", border: "#D8B4FE" },
};

// Hardcoded column aliases (for Excel import detection)
export const HARDCODED_COLUMN_ALIASES = [
  "module id", "module name", "module",
  "task", "task name", "activity",
  "resource", "resource code", "resource name",
  "user id", "userid", "email",
  "planned start", "start", "planned start (yyyy-mm-dd hh:mm)",
  "duration", "duration (hrs)", "planned duration (hrs)", "hours",
  "planned stop", "stop",
  "status",
  "comments", "comment",
];