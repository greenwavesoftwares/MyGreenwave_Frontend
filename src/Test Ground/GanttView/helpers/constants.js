/* ═══════════════════════════════════════════════════════
   Gantt Constants
   ═══════════════════════════════════════════════════════ */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

export const ROW_HEIGHT = 44;
export const SUB_HEADER_HEIGHT = 32;
export const HEADER_HEIGHT = 56;

export const LEFT_PANEL_WIDTH_COLLAPSED = 300;
export const LEFT_PANEL_WIDTH_EXPANDED = 480;

export const MIN_COL_WIDTH = 20;
export const MAX_COL_WIDTH = 200;

export const COL_TASK_WIDTH = 240;
export const COL_MODULE_WIDTH = 120;
export const COL_RESOURCE_WIDTH = 130;
export const COL_STATUS_WIDTH = 100;

/* ─── Zoom Configurations ─── */
export const ZOOM_CONFIGS = {
  hour: {
    label: "Hours",
    unitMs: HOUR_MS,
    defaultColWidth: 60,
    tickFormat: (d) => `${String(d.getHours()).padStart(2, "0")}:00`,
    majorFormat: (d) =>
      d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    majorUnitMs: DAY_MS,
  },
  day: {
    label: "Days",
    unitMs: DAY_MS,
    defaultColWidth: 80,
    tickFormat: (d) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    majorFormat: (d) =>
      d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    majorUnitMs: 30 * DAY_MS,
  },
  week: {
    label: "Weeks",
    unitMs: WEEK_MS,
    defaultColWidth: 100,
    tickFormat: (d) => {
      const start = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
      return `W ${start}`;
    },
    majorFormat: (d) =>
      d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    majorUnitMs: 30 * DAY_MS,
  },
};

/* ─── Project Color Palette ─── */
export const PROJECT_COLORS = [
  "#1D4ED8",
  "#15803D",
  "#7C3AED",
  "#B45309",
  "#BE185D",
  "#0F766E",
  "#B91C1C",
  "#0369A1",
  "#4D7C0F",
  "#9333EA",
  "#C2410C",
  "#115E59",
];

/* ─── localStorage keys ─── */
export const LS_VISIBLE_COLUMNS = "gantt-visible-columns";