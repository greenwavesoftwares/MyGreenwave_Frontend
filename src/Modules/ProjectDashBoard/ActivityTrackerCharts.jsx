import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import activityTrackerApi from "../../Services/activityTrackerApi";
import Tooltip from "@mui/material/Tooltip";

// Import all sub-components
import FilterBar from "./FilterBar";
import ResourceOccupancySection from "./ResourceOccupancySection";
import ResourceGanttSection from "./ResourceGanttSection";
import TooltipComponent from "./Tooltip";
import GanttView from "../../Test Ground/GanttView/index";
import UnallocatedResourceOccupancy from "./UnallocatedResourceOccupancy";
import { getUserData } from "../Login/Encrypt";

/* ================================================================
   THEME  –  reads localStorage "Theme" (light | dark)
   ================================================================ */
//Fetching data from Local Storage to get the theme mode (light or dark) and returning the corresponding palette for the theme.
function getThemeMode() {
  try {
    return localStorage.getItem("Theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
// Palette for light and dark themes, defining colors for various UI elements.
const PALETTES = {
  light: {
    rootBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    filterBarBg: "#ffffff",
    filterBarBorder: "#e2e8f0",
    textPrimary: "#334155",
    textSecondary: "#64748b",
    textMuted: "#94a3b8",
    textInverse: "#f1f5f9",
    textSubtle: "#475569",
    inputBg: "#f8fafc",
    inputBorder: "#cbd5e1",
    inputText: "#334155",
    btnPrimary: "#2563eb",
    gridLine: "#f1f5f9",
    gridLineMd: "#e2e8f0",
    gridDash: "#cbd5e1",
    gridDashLight: "#e2e8f0",
    weekBorder: "#eef2f7",
    barBg: "#fafafa",
    barBorder: "#e2e8f0",
    barStripeBg: "rgba(148,163,184,0.045)",
    emptySlotBg: "rgba(148,163,184,0.06)",
    barLabelColor: "#0f172a",
    barLabelShadow: "0 1px 1px rgba(255,255,255,0.55)",
    axisText: "#94a3b8",
    dayLabelDate: "#64748b",
    dayLabelEmpty: "#cbd5e1",
    occCellBg: "#fff",
    occCellWeekend: "#f8fafc",
    occCellToday: "#eff6ff",
    occHeaderBg: "#f8fafc",
    occHeaderToday: "#dbeafe",
    occRowEven: "#ffffff",
    occRowOdd: "#fafbfc",
    occFreeBar: "#f1f5f9",
    occFreeBarBorder: "#e2e8f0",
    occFreeBarShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
    occRedBar: "#fda4af",
    occRedBarInner: "#f87171",
    occRedLabel: "#9f1239",
    occFreeLabel: "#64748b",
    occAmberBorder: "#f59e0b",
    occAmberShadow: "inset 0 1px 2px rgba(245,158,11,0.15)",
    occAmberLabel: "#92400e",
    resNameColor: "#1e293b",
    todayDot: "#3b82f6",
    todayText: "#1e40af",
    earlyColor: "#059669",
    lateColor: "#dc2626",
    legendText: "#475569",
    legendMuted: "#94a3b8",
    accBg: "#ffffff",
    accBorder: "#e2e8f0",
    accTitle: "#334155",
    accChevron: "#94a3b8",
    swatchDefault: "#64748b",
    pieBg: "#ffffff",
    pieBorder: "#e2e8f0",
    pieCenter: "#ffffff",
    pieCenterShadow: "inset 0 0 0 1px #f1f5f9",
    piePctColor: "#1e293b",
    pieLabelColor: "#334155",
    pieCompletedColor: "#059669",
    piePendingColor: "#d97706",
    piePendingMuted: "#94a3b8",
    ttBg: "#0f172a",
    ttText: "#f1f5f9",
    ttMuted: "#94a3b8",
    ttDivider: "#334155",
    ttCardBg: "#1e2937",
    ttCardBorder: "#334155",
    ttChipBg: "#334155",
    ttChipText: "#e0f2fe",
    ttActualColor: "#67e8f9",
    ttFreeBg: "#1e2937",
    ttFreeText: "#4ade80",
    ttOccupiedText: "#f87171",
    ttDelayedText: "#fbbf24",
    ttDelayCardBg: "#422006",
    ttDelayCardBorder: "#92400e",
    ttDelayChipBg: "#92400e",
    ttDelayChipText: "#fef3c7",
    ttDelayDateText: "#fcd34d",
    ttDelayBoldText: "#f59e0b",
    ttDelaySubText: "#d97706",
    navBg: "#fff",
    navBorder: "#cbd5e1",
    navText: "#334155",
    navLabel: "#64748b",
    pickerBg: "#fff",
    pickerBorder: "#cbd5e1",
    pickerShadow: "0 10px 25px rgba(15,23,42,0.12)",
    pickerText: "#334155",
    pickerDivider: "#f1f5f9",
    greenArrow: "#059669",
    redArrow: "#dc2626",
    loadingText: "#94a3b8",
    errorText: "#dc2626",
    emptyText: "#94a3b8",
    rangeLabelText: "#64748b",
  },
  dark: {
    rootBg: "#0f172a",
    cardBg: "#1e293b",
    cardBorder: "#334155",
    filterBarBg: "#1e293b",
    filterBarBorder: "#334155",
    textPrimary: "#e2e8f0",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textInverse: "#0f172a",
    textSubtle: "#94a3b8",
    inputBg: "#0f172a",
    inputBorder: "#475569",
    inputText: "#e2e8f0",
    btnPrimary: "#3b82f6",
    gridLine: "#1e293b",
    gridLineMd: "#334155",
    gridDash: "#475569",
    gridDashLight: "#334155",
    weekBorder: "#1e293b",
    barBg: "#1e293b",
    barBorder: "#334155",
    barStripeBg: "rgba(148,163,184,0.06)",
    emptySlotBg: "rgba(51,65,85,0.3)",
    barLabelColor: "rgba(255,255,255,0.95)",
    barLabelShadow: "0 1px 1px rgba(0,0,0,0.5)",
    axisText: "#64748b",
    dayLabelDate: "#94a3b8",
    dayLabelEmpty: "#475569",
    occCellBg: "#1e293b",
    occCellWeekend: "#0f172a",
    occCellToday: "#172554",
    occHeaderBg: "#0f172a",
    occHeaderToday: "#1e3a5f",
    occRowEven: "#1e293b",
    occRowOdd: "#162032",
    occFreeBar: "#334155",
    occFreeBarBorder: "#475569",
    occFreeBarShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
    occRedBar: "#be123c",
    occRedBarInner: "#f43f5e",
    occRedLabel: "#fda4af",
    occFreeLabel: "#94a3b8",
    occAmberBorder: "#d97706",
    occAmberShadow: "inset 0 1px 2px rgba(245,158,11,0.2)",
    occAmberLabel: "#fbbf24",
    resNameColor: "#e2e8f0",
    todayDot: "#60a5fa",
    todayText: "#93c5fd",
    earlyColor: "#34d399",
    lateColor: "#f87171",
    legendText: "#94a3b8",
    legendMuted: "#64748b",
    accBg: "#1e293b",
    accBorder: "#334155",
    accTitle: "#e2e8f0",
    accChevron: "#64748b",
    swatchDefault: "#94a3b8",
    pieBg: "#1e293b",
    pieBorder: "#334155",
    pieCenter: "#1e293b",
    pieCenterShadow: "inset 0 0 0 1px #334155",
    piePctColor: "#e2e8f0",
    pieLabelColor: "#cbd5e1",
    pieCompletedColor: "#34d399",
    piePendingColor: "#fbbf24",
    piePendingMuted: "#64748b",
    ttBg: "#0f172a",
    ttText: "#f1f5f9",
    ttMuted: "#94a3b8",
    ttDivider: "#334155",
    ttCardBg: "#1e2937",
    ttCardBorder: "#334155",
    ttChipBg: "#334155",
    ttChipText: "#e0f2fe",
    ttActualColor: "#67e8f9",
    ttFreeBg: "#1e2937",
    ttFreeText: "#4ade80",
    ttOccupiedText: "#f87171",
    ttDelayedText: "#fbbf24",
    ttDelayCardBg: "#422006",
    ttDelayCardBorder: "#92400e",
    ttDelayChipBg: "#92400e",
    ttDelayChipText: "#fef3c7",
    ttDelayDateText: "#fcd34d",
    ttDelayBoldText: "#f59e0b",
    ttDelaySubText: "#d97706",
    navBg: "#1e293b",
    navBorder: "#475569",
    navText: "#e2e8f0",
    navLabel: "#94a3b8",
    pickerBg: "#1e293b",
    pickerBorder: "#475569",
    pickerShadow: "0 10px 25px rgba(0,0,0,0.5)",
    pickerText: "#e2e8f0",
    pickerDivider: "#334155",
    greenArrow: "#34d399",
    redArrow: "#f87171",
    loadingText: "#64748b",
    errorText: "#f87171",
    emptyText: "#64748b",
    rangeLabelText: "#64748b",
  },
};

// Custom hook to read the current theme mode and palette, and update on localStorage changes.
function useTheme() {
  const [mode, setMode] = useState(getThemeMode);
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "Theme") setMode(e.newValue === "dark" ? "dark" : "light");
    }
    window.addEventListener("storage", onStorage);
    const interval = setInterval(() => {
      const current = getThemeMode();
      setMode((prev) => (prev !== current ? current : prev));
    }, 500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);
  return { mode, isDark: mode === "dark", t: PALETTES[mode] };
}

/* ================================================================
   UTILITY FUNCTIONS
   ================================================================ */

const EARLY_LATE_THRESHOLD_HRS = 0.25;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const GOLDEN_ANGLE = 137.508;
const RESOURCE_DAILY_CAPACITY_HRS = 8;

/* ----------------------------------------------------------------
   leaveDates handling
   The API returns leaveDates as objects:  [{ "date": "2026-09-18" }]
   Older code paths expected plain strings: ["2026-09-18"]
   These helpers normalize both shapes to "YYYY-MM-DD" strings so
   every consumer (workday count, timeline "Leave" cells) matches.
   ---------------------------------------------------------------- */
function leaveDateKeyOf(entry) {
  if (entry == null) return null;
  if (typeof entry === "string") return entry;
  if (typeof entry === "object") return entry.date ?? entry.Date ?? null;
  return null;
}

function normalizeLeaveDates(list) {
  if (!Array.isArray(list)) return [];
  return Array.from(new Set(list.map(leaveDateKeyOf).filter(Boolean)));
}

// Normalize a metrics payload (flat list or month-grouped list) so every
// resource entry carries leaveDates as plain "YYYY-MM-DD" strings.
function normalizeResourceMetricsPayload(payload) {
  if (!Array.isArray(payload)) return [];
  const normalizeEntry = (rm) =>
    rm && typeof rm === "object"
      ? { ...rm, leaveDates: normalizeLeaveDates(rm.leaveDates) }
      : rm;
  return payload.map((item) => {
    if (item && Array.isArray(item.resourceMetrics))
      return { ...item, resourceMetrics: item.resourceMetrics.map(normalizeEntry) };
    if (item && typeof item === "object" && item.resourceName) return normalizeEntry(item);
    return item;
  });
}

//hueForIndex and resourceBaseColor functions are used to generate distinct colors for resources based on their index, ensuring a visually appealing and easily distinguishable color palette for different resources in the UI.
function hueForIndex(i) {
  return Math.round((i * GOLDEN_ANGLE) % 360);
}

function resourceBaseColor(index) {
  const hue = hueForIndex(index);
  return {
    hue,
    actual: `hsl(${hue}, 62%, 48%)`,
    planned: `hsl(${hue}, 62%, 48%)`,
  };
}

function activityColor(i) {
  return `hsl(${hueForIndex(i)}, 60%, 52%)`;
}
function activityColorPending(i) {
  return `hsl(${hueForIndex(i)}, 35%, 88%)`;
}
function parseDate(str) {
  if (!str) return null;
  return new Date(str);
}
function fmtTime(date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
function fmtDateTime(date) {
  if (!date) return "—";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDuration(h) {
  if (h == null) return "—";
  let totalMinutes = Math.round(h * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  totalMinutes -= days * 24 * 60;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hrs) parts.push(`${hrs}h`);
  if (mins || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(" ");
}
function fmtDurationCompact(h) {
  if (h == null) return "";
  if (h < 1) return `${Math.round(h * 60)}m`;
  const r = Math.round(h * 10) / 10;
  return `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}h`;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function plannedDurationHrs(row) {
  if (typeof row.durationHrs === "number") return row.durationHrs;
  return (parseDate(row.plannedStop) - parseDate(row.plannedStart)) / 3600000;
}

// actualDurationHrs function calculates the actual duration of a task in hours based on its actual start and stop times. If the actual start time is not available, it returns null. If the actual stop time is not available, it estimates the duration based on the task's status (running or paused) and assumes a default duration of 1 hour. If both actual start and stop times are available, it calculates the difference in hours between them.
function actualDurationHrs(row) {
  if (!row.actualStart) return null;
  const s = parseDate(row.actualStart);
  const e = row.actualStop
    ? parseDate(row.actualStop)
    : row.status === "running" || row.status === "paused"
      ? new Date(s.getTime() + 3600000)
      : null;
  if (!e) return null;
  return (e - s) / 3600000;
}
function occupiedHoursForRow(row) {
  const a = actualDurationHrs(row);
  if (a != null) return a;
  return plannedDurationHrs(row) || 0;
}
function finishedEarlyLateInfo(row) {
  if (!row.actualStop) return null;
  const p = plannedDurationHrs(row),
    a = actualDurationHrs(row);
  if (a == null) return null;
  const d = a - p;
  if (d < -EARLY_LATE_THRESHOLD_HRS)
    return { type: "early", diff: Math.abs(d) };
  if (d > EARLY_LATE_THRESHOLD_HRS) return { type: "late", diff: d };
  return { type: "ontime", diff: d };
}
// toMidnight function takes a Date object and returns a new Date object representing the same date but with the time set to midnight (00:00:00). This is useful for comparing dates without considering the time component.
function toMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
// daysBetween function calculates the number of full days between two dates (a and b). It first converts both dates to midnight using the toMidnight function, then calculates the difference in milliseconds and divides by the number of milliseconds in a day (86400000) to get the number of days. The result is rounded to the nearest whole number.
function daysBetween(a, b) {
  return Math.round((toMidnight(b) - toMidnight(a)) / 86400000);
}
function weeksForMonth(year, monthIdx) {
  const ms = new Date(year, monthIdx, 1),
    me = new Date(year, monthIdx + 1, 0);
  ms.setHours(0, 0, 0, 0);
  me.setHours(0, 0, 0, 0);
  const sd = ms.getDay(),
    td = me.getDate(),
    w = [];
  let dn = 1;
  const fw = [];
  for (let i = 0; i < 7; i++) {
    if (i < sd) fw.push(null);
    else fw.push(new Date(year, monthIdx, dn++));
  }
  w.push(fw);
  while (dn <= td) {
    const wk = [];
    for (let i = 0; i < 7; i++) {
      if (dn <= td) wk.push(new Date(year, monthIdx, dn++));
      else wk.push(null);
    }
    w.push(wk);
  }
  return w;
}
function aggregateActivities(rows) {
  const m = new Map();
  rows.forEach((r) => {
    const k = r.task || "Untitled";
    if (!m.has(k))
      m.set(k, {
        activity: k,
        plannedHrs: 0,
        actualHrs: 0,
        finished: false,
        started: false,
      });
    const e = m.get(k);
    e.plannedHrs += plannedDurationHrs(r) || 0;
    const a = actualDurationHrs(r);
    if (a != null) e.actualHrs += a;
    if (r.actualStop) e.finished = true;
    if (r.actualStart) e.started = true;
  });
  return Array.from(m.values());
}
function activityProgressPct(e) {
  if (e.finished) return 100;
  if (!e.started || !e.plannedHrs) return 0;
  return clamp(Math.round((e.actualHrs / e.plannedHrs) * 100), 0, 99);
}
function getOccupancyColor(hours) {
  if (hours < 4) return "#22c55e";
  if (hours < 5) return "#84cc16";
  if (hours < 6) return "#eab308";
  if (hours < 6.75) return "#f97316";
  if (hours < 7.75) return "#ea580c";
  return "#dc2626";
}
function isWeekend(d) {
  return d.getDay() === 0 || d.getDay() === 6;
}
function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}
// isTaskStatus function checks if a given task status matches any of the provided values. It normalizes the input status and compares it against the normalized values to determine if there is a match.
function isTaskStatus(status, ...values) {
  return values.includes(normalizeStatus(status));
}

// getTaskStatusMeta function returns metadata for a given task status, including label, color, background color, border color, border style, pulse effect, and icon. It normalizes the input status and provides specific metadata for "running", "completed", "finished", and "paused" statuses. For any other status, it returns default metadata with a label of "Unknown".
function getTaskStatusMeta(status) {
  const s = normalizeStatus(status);
  if (s === "running")
    return {
      label: "Running",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.14)",
      borderColor: "rgba(34,197,94,0.4)",
      borderStyle: "solid",
      pulse: true,
      icon: null,
    };
  if (s === "completed" || s === "finished")
    return {
      label: s === "finished" ? "Finished" : "Completed",
      color: "#16a34a",
      bg: "rgba(34,197,94,0.14)",
      borderColor: "rgba(34,197,94,0.4)",
      borderStyle: "solid",
      pulse: false,
      icon: "✔",
    };
  if (s === "paused")
    return {
      label: "Paused",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.14)",
      borderColor: "rgba(245,158,11,0.45)",
      borderStyle: "dashed",
      pulse: false,
      icon: "",
    };
  return {
    label: status || "Unknown",
    color: "#94a3b8",
    bg: "transparent",
    borderColor: "rgba(148,163,184,0.35)",
    borderStyle: "solid",
    pulse: false,
    icon: "•",
  };
}

// TaskStatusBadge component displays a badge for a given task status, using the metadata provided by getTaskStatusMeta. It shows a colored dot or icon along with the status label, styled according to the status properties.
function TaskStatusBadge({ status, t }) {
  const meta = getTaskStatusMeta(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 7px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        color: meta.color,
        background: meta.bg,
        border: `1px ${meta.borderStyle} ${meta.borderColor}`,
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
    >
      {meta.pulse ? (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: meta.color,
            display: "inline-block",
            animation: "wtStatusPulse 1s ease-in-out infinite",
            boxShadow: `0 0 0 2px ${meta.bg}`,
          }}
        />
      ) : (
        <span style={{ lineHeight: 1 }}>{meta.icon}</span>
      )}
      {meta.label}
    </span>
  );
}

function buildStack(resources, field, pctFromHrs) {
  let c = 0;
  return resources
    .filter((r) => r[field] > 0)
    .map((r) => {
      const bp = pctFromHrs(c);
      c += r[field];
      const tp = pctFromHrs(c);
      return { ...r, topPct: tp, heightPct: Math.max(bp - tp, 0.6) };
    });
}

function initialsFor(n) {
  if (!n) return "?";
  const p = n.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function ActivityTrackerCharts() {
  const { mode, isDark, t } = useTheme();
  const [hovered, setHovered] = useState(null);
  const hoverHideTimeout = useRef(null);
  const tooltipRef = useRef(null);

  function showHover(data) {
    if (hoverHideTimeout.current) {
      clearTimeout(hoverHideTimeout.current);
      hoverHideTimeout.current = null;
    }
    setHovered(data);
  }

  function hideHover() {
    if (hoverHideTimeout.current) clearTimeout(hoverHideTimeout.current);
    hoverHideTimeout.current = setTimeout(() => {
      setHovered(null);
      hoverHideTimeout.current = null;
    }, 200);
  }

  useEffect(() => {
    if (!hovered) return;
    function h(e) {
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) return;
      setHovered(null);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [hovered]);


  // ================================================================
  // State variables for API loading, error handling, and response data
  // ================================================================
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // Initialize with current month selected by default
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState([
    MONTH_NAMES[currentMonthIdx],
  ]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef(null);

  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const projectPickerRef = useRef(null);

  const [selectedResources, setSelectedResources] = useState([]);
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const resourcePickerRef = useRef(null);

  const [monthBlockIndex, setMonthBlockIndex] = useState(0);
  const [monthSlideDir, setMonthSlideDir] = useState(1);
  const [occMonthBlockIndex, setOccMonthBlockIndex] = useState(0);
  const [occMonthSlideDir, setOccMonthSlideDir] = useState(1);
  const [expandedResources, setExpandedResources] = useState({});
  const [currentMonthResourceMetrics, setCurrentMonthResourceMetrics] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  const [ganttData,setGanttData] = useState([]);
  const [ganttSelection,setGanttSelection] = useState('open' );

  useEffect(() => {
    function h() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const [weekViewMode, setWeekViewMode] = useState("chart");
  const [projectPageIndex, setProjectPageIndex] = useState(0);
  const [projectSlideDir, setProjectSlideDir] = useState(1);
  const [unallocatedResourcesList, setUnallocatedResourcesList] = useState([]);

  useEffect(() => {
    fetchActiveProjects();
  }, []);

  const fetchActiveProjects = async () => {
      const activeProjects = await activityTrackerApi.getActiveProjects();
      console.log('activeProjects : ', activeProjects);
      setGanttData(activeProjects  || []);
    }

    const handleGanttSelectionChange = async(selection) => {
      setGanttSelection(selection);
      if(selection === 'open'){
        const activeProjects=await activityTrackerApi.getActiveProjects();
        setGanttData(activeProjects || []);
      }
      else
      {
        const closedProjects = await activityTrackerApi.getClosedProjects();
        console.log('closedProjects : ', closedProjects); 
         setGanttData(closedProjects|| []);
      }
    }

  


  // ================================================================
  // Data fetching logic
  // ================================================================
  function loadData(year = selectedYear, months = selectedMonths) {
    setApiLoading(true);
    setApiError(null);
    fetchProjects(year, months);
  }


  // Fetches project data, unallocated resources, and resource metrics from the API based on the selected year and months. Updates the state with the fetched data or error messages.
 const fetchProjects = async (year, months) => {
  const monthsParam = months.length === 0 ? MONTH_NAMES.join(",") : months.join(",");
  const userId = getUserData()?.userDetails?.userId;

  setApiLoading(true);
  setApiError(null);

  // Fire all three requests at once. Each one updates its own slice of state
  // as soon as it resolves — no request waits for another.
  const requests = [
    activityTrackerApi
      .getActivityTreesByMonthAndDate(monthsParam, year)
      .then((r) => setApiResponse(r ?? { data: [] })),

    activityTrackerApi
      .getAllUnallocatedUsersByManager(userId, monthsParam, year)
      .then((unallocatedResources) => setUnallocatedResourcesList(unallocatedResources)),

    activityTrackerApi
      .getMonthlyResourceMetrics(year, monthsParam)
      .then((resourceMetrics) =>
        // Normalize leaveDates ([{date}] -> ["YYYY-MM-DD"]) once, at the edge,
        // so every downstream consumer sees plain date strings.
        setCurrentMonthResourceMetrics(normalizeResourceMetricsPayload(resourceMetrics ?? [])),
      ),
  ];

  // allSettled (not all) so one failing request doesn't hide the results of the others.
  const results = await Promise.allSettled(requests);

  const errors = results
    .filter((res) => res.status === "rejected")
    .map((res) => String(res.reason?.message ?? res.reason));

  if (errors.length) setApiError(errors.join("; "));

  setApiLoading(false);
};

  useEffect(() => {
    loadData(selectedYear, selectedMonths);
  }, [selectedYear, selectedMonths.join(",")]);


  // ================================================================
  // Effect to handle clicks outside of the month, project, and resource pickers to close them
  // ================================================================
  useEffect(() => {
    function h(e) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target))
        setMonthPickerOpen(false);
      if (
        projectPickerRef.current &&
        !projectPickerRef.current.contains(e.target)
      )
        setProjectPickerOpen(false);
      if (
        resourcePickerRef.current &&
        !resourcePickerRef.current.contains(e.target)
      )
        setResourcePickerOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);



// ================================================================
// Memoized data processing and filtering logic
// ================================================================
  const projectsData = useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse?.data)) return apiResponse.data;
    return [];
  }, [apiResponse]);

  const flatRows = useMemo(() => {
    const a = [];
    projectsData.forEach((p) => {
      (p.rows || []).forEach((r) => {
        a.push({ project: p.project, po: p.po, site: p.site, id: p.id, ...r });
      });
    });
    return a;
  }, [projectsData]);

  const availableYears = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      const d = parseDate(r.plannedStart);
      if (d) s.add(d.getFullYear());
    });
    const y = Array.from(s).sort((a, b) => a - b);
    return y.length ? y : [currentYear];
  }, [flatRows]);

  const allProjectNames = useMemo(() => {
    const s = new Set(projectsData.map((p) => p.project));
    return Array.from(s).sort();
  }, [projectsData]);

  const allResourceNames = useMemo(() => {
    const s = new Set(flatRows.map((r) => r.resourceName));
    return Array.from(s).sort();
  }, [flatRows]);

  const resourceColorMap = useMemo(() => {
    const m = {};
    allResourceNames.forEach((n, i) => {
      m[n] = resourceBaseColor(i);
    });
    return m;
  }, [allResourceNames]);

  const selectedMonthIndices = useMemo(() => {
    if (selectedMonths.length === 0)
      return MONTH_NAMES.map((_, index) => index);
    return selectedMonths
      .map((n) => MONTH_NAMES.indexOf(n))
      .sort((a, b) => a - b);
  }, [selectedMonths]);

  // True when a row's [plannedStart, plannedStop] interval intersects any
  // selected month-window of the selected year. If no specific months are
  // picked, the window is the entire year. This is what makes a Dec -> Jan
  // task show up when the user picks January in 2027, and what makes all
  // three rows of the sample data visible once the strict start-date check
  // is replaced with overlap.
  const rowOverlapsSelectedWindow = useCallback((row) => {
    const start = parseDate(row.plannedStart);
    if (!start) return false;
    const stop = parseDate(
      row.plannedStop ??
        row.plannedStopDate ??
        row.plannedEndDate ??
        row.endDate,
    );

    if (selectedMonths.length === 0) {
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      if (stop) return start <= yearEnd && stop >= yearStart;
      return start.getFullYear() === selectedYear;
    }

    return selectedMonthIndices.some((monthIdx) => {
      const monthStart = new Date(selectedYear, monthIdx, 1);
      const monthEnd = new Date(
        selectedYear,
        monthIdx + 1,
        0,
        23,
        59,
        59,
        999,
      );
      if (stop) return start <= monthEnd && stop >= monthStart;
      return start.getFullYear() === selectedYear && start.getMonth() === monthIdx;
    });
  }, [selectedYear, selectedMonths.join(","), selectedMonthIndices]);

  function rowMatchesFilters(row, { projects, resources }, skip) {
    if (!rowOverlapsSelectedWindow(row)) return false;
    if (
      skip !== "project" &&
      projects.length &&
      !projects.includes(row.project)
    )
      return false;
    if (
      skip !== "resource" &&
      resources.length &&
      !resources.includes(row.resourceName)
    )
      return false;
    return true;
  }

  // Month picker options - Always all 12 months (hardcoded)
  // This ensures all months are always available regardless of data
  const monthPickerOptions = MONTH_NAMES;

  // Project picker options - affected by year, month, and resource filters
  const projectPickerOptions = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      if (
        rowMatchesFilters(
          r,
          { projects: [], resources: selectedResources },
          "project",
        )
      )
        s.add(r.project);
    });
    return allProjectNames.filter((p) => s.has(p));
  }, [
    flatRows,
    selectedResources,
    allProjectNames,
    rowOverlapsSelectedWindow,
  ]);

  // Resource picker options - affected by year, month, and project filters
  const resourcePickerOptions = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      if (
        rowMatchesFilters(
          r,
          { projects: selectedProjects, resources: [] },
          "resource",
        )
      )
        s.add(r.resourceName);
    });
    return allResourceNames.filter((r) => s.has(r));
  }, [
    flatRows,
    selectedProjects,
    allResourceNames,
    rowOverlapsSelectedWindow,
  ]);

  // No need to filter selected months since all 12 are always available
  // This effect is removed as monthPickerOptions is now hardcoded

  useEffect(() => {
    if (!apiResponse) return;
    setSelectedProjects((p) => {
      const n = p.filter((x) => projectPickerOptions.includes(x));
      return n.length === p.length ? p : n;
    });
  }, [apiResponse, projectPickerOptions]);

  useEffect(() => {
    if (!apiResponse) return;
    setSelectedResources((p) => {
      const n = p.filter((x) => resourcePickerOptions.includes(x));
      return n.length === p.length ? p : n;
    });
  }, [apiResponse, resourcePickerOptions]);

  const rangeLabel = useMemo(() => {
    if (selectedMonths.length === 0) return `All months, ${selectedYear}`;
    if (selectedMonths.length === 1)
      return `${selectedMonths[0]} ${selectedYear}`;
    return `${selectedMonths.length} months selected, ${selectedYear}`;
  }, [selectedMonths, selectedYear]);

  // Filtered rows based on selected year, months, projects, and resources.
  // The year+month gate is overlap-based (see rowOverlapsSelectedWindow), so
  // a row that started in the previous year/month but runs into the visible
  // window is included.
  const filteredRows = useMemo(() => {
    return flatRows.filter((r) => {
      if (!rowOverlapsSelectedWindow(r)) return false;
      return (
        (selectedProjects.length === 0 ||
          selectedProjects.includes(r.project)) &&
        (selectedResources.length === 0 ||
          selectedResources.includes(r.resourceName))
      );
    });
  }, [
    flatRows,
    selectedYear,
    selectedMonths.join(","),
    selectedMonthIndices,
    selectedProjects,
    selectedResources,
    rowOverlapsSelectedWindow,
  ]);



  // ================================================================
// Filtered API Response - maintains original API structure but
// filters rows within each project based on user selections
// ================================================================
// const filteredApiResponse = useMemo(() => {
//   if (!apiResponse) return null;

//   // Extract base array (same logic as projectsData)
//   const baseArray = Array.isArray(apiResponse)
//     ? apiResponse
//     : Array.isArray(apiResponse?.data)
//       ? apiResponse.data
//       : [];

//   // Filter each project's rows based on year/month overlap + project/resource filters
//   const filteredProjects = baseArray
//     .map((project) => {
//       const filteredProjectRows = (project.rows || []).filter((row) => {
//         // Merge project info into row for filter checks (same as flatRows does)
//         const rowWithProject = {
//           project: project.project,
//           po: project.po,
//           site: project.site,
//           id: project.id,
//           ...row,
//         };

//         // Apply same filters as filteredRows
//         if (!rowOverlapsSelectedWindow(rowWithProject)) return false;
//         if (
//           selectedProjects.length > 0 &&
//           !selectedProjects.includes(rowWithProject.project)
//         )
//           return false;
//         if (
//           selectedResources.length > 0 &&
//           !selectedResources.includes(rowWithProject.resourceName)
//         )
//           return false;

//         return true;
//       });

//       // Only include projects that have rows after filtering
//       if (filteredProjectRows.length === 0) return null;

//       return {
//         ...project,
//         rows: filteredProjectRows,
//       };
//     })
//     .filter(Boolean); // Remove projects with no matching rows

//   // Return in the same shape as apiResponse
//   if (Array.isArray(apiResponse)) {
//     return filteredProjects;
//   }
//   return { ...apiResponse, data: filteredProjects };
// }, [
//   apiResponse,
//   selectedYear,
//   selectedMonths.join(","),
//   selectedProjects,
//   selectedResources,
//   rowOverlapsSelectedWindow,
// ]);


  // ================================================================
  // Calculated resource metrics (used while a Project filter is active)
  // ================================================================
  // When one or more projects are selected, the numbers shown in the
  // resource metrics section are recalculated from the currently filtered
  // rows instead of the static getMonthlyResourceMetrics response, so
  // utilization / on-time / delayed / assigned / completed reflect the
  // selected project(s) only.
  //   - resourceMonthUtilization = planned hours inside the month window /
  //       (working days of the month, minus API leave dates, * 8h), clamped
  //       to 100.
  //   - totalAssignedTasks   = distinct task rows overlapping the month.
  //   - totalCompletedTasks  = tasks having an actualStop (or a
  //       completed/finished status).
  //   - delayedTasks         = tasks whose actualStop is later than their
  //       plannedStop.
  //   - onTimeTasks          = completed tasks whose actualStop is earlier
  //       than or equal to their plannedStop.
  //   - resourceId / leaveDates are carried over from the API entry.
  const calculatedResourceMetrics = useMemo(() => {
    if (selectedProjects.length === 0) return null;

    const monthIndices =
      selectedMonths.length === 0
        ? MONTH_NAMES.map((_, i) => i)
        : [...selectedMonthIndices];

    // API lookup: month -> resourceName -> API metric entry
    const apiLookup = {};
    (currentMonthResourceMetrics || []).forEach((m) => {
      apiLookup[m.month] = {};
      (m.resourceMetrics || []).forEach((rm) => {
        apiLookup[m.month][rm.resourceName] = rm;
      });
    });

    // Working days in [start, end], excluding weekends and API leave dates.
    // leaveDates are normalized "YYYY-MM-DD" strings (see normalizeLeaveDates).
    function workdayCount(monthStart, monthEnd, leaveDates) {
      const leaves = new Set(normalizeLeaveDates(leaveDates));
      let n = 0;
      const d = new Date(monthStart);
      while (d <= monthEnd) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!isWeekend(d) && !leaves.has(key)) n++;
        d.setDate(d.getDate() + 1);
      }
      return n;
    }

    return monthIndices.map((monthIdx) => {
      const monthName = MONTH_NAMES[monthIdx];
      const monthStart = new Date(selectedYear, monthIdx, 1);
      const monthEnd = new Date(selectedYear, monthIdx + 1, 0, 23, 59, 59, 999);

      const resTasks = {}; // resourceName -> Map(taskId -> rows[])
      const resHours = {}; // resourceName -> planned hours inside this month

      filteredRows.forEach((row) => {
        const s = parseDate(row.plannedStart);
        const p = plannedDurationHrs(row) || 0;
        if (!s || !p || p <= 0) return;
        const e =
          parseDate(row.plannedStop) ||
          new Date(s.getTime() + p * 3600000);

        const overlap =
          Math.min(e.getTime(), monthEnd.getTime()) -
          Math.max(s.getTime(), monthStart.getTime());
        if (overlap <= 0) return;

        const name = row.resourceName;
        const taskId = row.id ?? row.task;

        // Distribute the task's planned hours across its span proportionally
        // to the part that falls inside this month.
        resHours[name] =
          (resHours[name] || 0) +
          p * (overlap / Math.max(e.getTime() - s.getTime(), 1));

        if (!resTasks[name]) resTasks[name] = new Map();
        if (!resTasks[name].has(taskId)) resTasks[name].set(taskId, []);
        resTasks[name].get(taskId).push(row);
      });

      const apiForMonth = apiLookup[monthName] || {};

      // Include API resources with zero tasks so the section keeps its rows.
      const resourceNames = Object.keys({ ...apiForMonth, ...resTasks });

      const resourceMetrics = resourceNames.map((resourceName) => {
        const apiEntry = apiForMonth[resourceName] || {};
        const taskMap = resTasks[resourceName] || new Map();

        let onTimeTasks = 0;
        let delayedTasks = 0;
        let totalCompletedTasks = 0;

        taskMap.forEach((rows) => {
          const doneRow = rows.find((r) => r.actualStop);
          if (doneRow) {
            totalCompletedTasks += 1;
            const actualStop = parseDate(doneRow.actualStop);
            const isCompleted = isTaskStatus(
              doneRow.status,
              "completed",
              "finished",
            );

            // plannedStop, or derive it from plannedStart + planned duration.
            let plannedStop = parseDate(doneRow.plannedStop);
            if (!plannedStop) {
              const s = parseDate(doneRow.plannedStart);
              const p = plannedDurationHrs(doneRow);
              if (s && p) plannedStop = new Date(s.getTime() + p * 3600000);
            }

            if (actualStop && plannedStop) {
              if (actualStop.getTime() > plannedStop.getTime()) {
                // Finished after the planned stop time -> delayed.
                delayedTasks += 1;
              } else if (isCompleted) {
                // Finished before (or exactly at) planned stop -> on time.
                onTimeTasks += 1;
              }
            } else if (isCompleted) {
              // No planned stop to compare against; not delayed.
              onTimeTasks += 1;
            }
          } else if (
            rows.some((r) => isTaskStatus(r.status, "completed", "finished"))
          ) {
            totalCompletedTasks += 1;
            onTimeTasks += 1;
          }
        });

        const totalAssignedTasks = taskMap.size;
        const capacityDays = workdayCount(
          monthStart,
          monthEnd,
          apiEntry.leaveDates,
        );
        const capacityHrs = capacityDays * RESOURCE_DAILY_CAPACITY_HRS;
        const hours = resHours[resourceName] || 0;
        const resourceMonthUtilization =
          capacityHrs > 0
            ? Math.min(100, Math.round((hours / capacityHrs) * 10000) / 100)
            : 0;

        return {
          resourceName,
          resourceId: apiEntry.resourceId ?? resourceName,
          resourceMonthUtilization,
          onTimeTasks,
          delayedTasks,
          totalAssignedTasks,
          totalCompletedTasks,
          leaveDates: normalizeLeaveDates(apiEntry.leaveDates),
        };
      });

      return { month: monthName, resourceMetrics };
    });
  }, [
    filteredRows,
    selectedYear,
    selectedMonths.join(","),
    selectedMonthIndices,
    selectedProjects,
    currentMonthResourceMetrics,
  ]);

  // When no project is selected, fall back to the original API metrics.
  const resourceMetricsForDisplay =
    calculatedResourceMetrics ?? currentMonthResourceMetrics ?? [];

  // Group filtered rows by project

  const filteredProjectsData = useMemo(() => {
    const m = new Map();
    filteredRows.forEach((r) => {
      if (!m.has(r.project))
        m.set(r.project, {
          project: r.project,
          po: r.po,
          site: r.site,
          id: r.id,
          rows: [],
          status:'Published'
        });
      m.get(r.project).rows.push(r);
    });
    return Array.from(m.values());
  }, [filteredRows]);

  const monthBlocks = useMemo(
    () =>
      selectedMonthIndices.map((m) => ({
        key: `${selectedYear}-${m}`,
        label:
          selectedMonthIndices.length > 1
            ? `${MONTH_NAMES[m]} ${selectedYear}`
            : null,
        monthIdx: m,
        weeks: weeksForMonth(selectedYear, m),
      })),
    [selectedYear, selectedMonthIndices],
  );

  useEffect(() => {
    setMonthBlockIndex(0);
    setOccMonthBlockIndex(0);
  }, [selectedYear, selectedMonthIndices.join(",")]);

  const safeMonthBlockIndex = Math.min(
    monthBlockIndex,
    Math.max(monthBlocks.length - 1, 0),
  );
  const currentMonthBlock = monthBlocks[safeMonthBlockIndex];

  function goToMonthBlock(i) {
    if (i < 0 || i >= monthBlocks.length) return;
    setMonthSlideDir(i > safeMonthBlockIndex ? 1 : -1);
    setMonthBlockIndex(i);
  }

  const safeOccMonthBlockIndex = Math.min(
    occMonthBlockIndex,
    Math.max(monthBlocks.length - 1, 0),
  );
  const currentOccMonthBlock = monthBlocks[safeOccMonthBlockIndex];

  function goToOccMonthBlock(i) {
    if (i < 0 || i >= monthBlocks.length) return;
    setOccMonthSlideDir(i > safeOccMonthBlockIndex ? 1 : -1);
    setOccMonthBlockIndex(i);
  }

  const aggByDate = useMemo(() => {
    const bd = {};
    filteredRows.forEach((r) => {
      const k = parseDate(r.plannedStart).toDateString();
      if (!bd[k]) bd[k] = [];
      bd[k].push(r);
    });
    const res = {};
    Object.entries(bd).forEach(([dk, rows]) => {
      const br = {};
      rows.forEach((row) => {
        const n = row.resourceName;
        if (!br[n])
          br[n] = {
            resourceName: n,
            plannedHrs: 0,
            actualHrs: 0,
            tasks: [],
            hasRunning: false,
          };
        const p = plannedDurationHrs(row) || 0;
        const a = actualDurationHrs(row);
        br[n].plannedHrs += p;
        br[n].actualHrs += a || 0;
        br[n].tasks.push({ row, plannedHrs: p, actualHrs: a });
        if (isTaskStatus(row.status, "running")) br[n].hasRunning = true;
      });
      const resources = Object.values(br).sort((x, y) =>
        x.resourceName.localeCompare(y.resourceName),
      );
      res[dk] = {
        resources,
        plannedTotal: resources.reduce((s, r) => s + r.plannedHrs, 0),
        actualTotal: resources.reduce((s, r) => s + r.actualHrs, 0),
      };
    });
    return res;
  }, [filteredRows]);


  // ================================================================
  // Occupancy calculation logic
  // ================================================================
const occupancyByResourceDate = useMemo(() => {
  const map = {};
  const WORK_START_HR = 10;
  const WORK_END_HR = 18;
  const BLOCKS = WORK_END_HR - WORK_START_HR;

  function bucket(dateKey, resourceName) {
    if (!map[dateKey]) map[dateKey] = {};

    if (!map[dateKey][resourceName]) {
      map[dateKey][resourceName] = {
        hours: 0,
        tasks: [],
        hourly: new Array(BLOCKS).fill(0),
      };
    }

    return map[dateKey][resourceName];
  }

  filteredRows.forEach((row) => {

    const plannedStart = parseDate(row.plannedStart);

    if (!plannedStart) return;

    const plannedHours = plannedDurationHrs(row) || 0;
    const plannedStop = parseDate(row.plannedStop);

    // Use planned stop. If it is missing, derive it from planned duration.
    const start = plannedStart;
    const end =
      plannedStop ||
      new Date(plannedStart.getTime() + plannedHours * 3600000);

    const resourceName = row.resourceName;

    const startMidnight = toMidnight(start);
    const endMidnight = toMidnight(end);
    const currentDay = new Date(startMidnight);

    // Split multi-day planned tasks across every planned working day.
    while (currentDay <= endMidnight) {
      const dateKey = currentDay.toDateString();

      const workDayStart = new Date(currentDay);
      workDayStart.setHours(WORK_START_HR, 0, 0, 0);

      const workDayEnd = new Date(currentDay);
      workDayEnd.setHours(WORK_END_HR, 0, 0, 0);

      // Only count the part of the planned task that falls during work hours.
      const segmentStart = new Date(
        Math.max(start.getTime(), workDayStart.getTime()),
      );

      const segmentEnd = new Date(
        Math.min(end.getTime(), workDayEnd.getTime()),
      );

      const segmentHours =
        Math.max(0, segmentEnd.getTime() - segmentStart.getTime()) / 3600000;

      if (segmentHours > 0) {
        const occupancyBucket = bucket(dateKey, resourceName);

        occupancyBucket.hours += segmentHours;

        // Fill individual hourly bars from 10:00 through 18:00.
        for (let hourIndex = 0; hourIndex < BLOCKS; hourIndex++) {
          const blockStart = new Date(currentDay);
          blockStart.setHours(WORK_START_HR + hourIndex, 0, 0, 0);

          const blockEnd = new Date(currentDay);
          blockEnd.setHours(WORK_START_HR + hourIndex + 1, 0, 0, 0);

          const overlapMs = Math.max(
            0,
            Math.min(segmentEnd.getTime(), blockEnd.getTime()) -
              Math.max(segmentStart.getTime(), blockStart.getTime()),
          );

          if (overlapMs > 0) {
            occupancyBucket.hourly[hourIndex] += overlapMs / 3600000;
          }
        }

        occupancyBucket.tasks.push({
          row,
          hours: segmentHours,
          daysFromStart: daysBetween(toMidnight(start), currentDay),

          // These remain planned values for tooltip/details usage.
          originalPlannedStart: plannedStart,
          originalPlannedStop: plannedStop,
          totalPlannedHrs: plannedHours,
        });
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }
  });

  return map;
}, [filteredRows]);





// ================================================================
// Task occupancy calculation logic
// ================================================================
//
// The component passed this prop (ResourceOccupancyTimeline) reads it as
// either an array of full task rows, or { [resourceName]: [tasks] }, and then
// distributes `durationHrs` across the actual [plannedStart, plannedStop]
// span. To make a December→January task fill bars in the January view we
// must:
//   1. NOT pre-aggregate hours onto a single date (otherwise only the
//      start day would fill).
//   2. NOT filter by `plannedStart` year/month (otherwise a Dec-starting
//      task is dropped the moment you open January).
//   3. Use an OVERLAP test against the currently displayed month block,
//      not a "starts inside the window" test.
const taskOccupancyByResourceDate = useMemo(() => {
  // The visible timeline is whichever month the user is on right now.
  const block = monthBlocks[safeOccMonthBlockIndex];
  const weeks = block?.weeks ?? [];
  if (!weeks.length) return [];

  // First non-null day of the first week.
  const windowStart = weeks[0]?.[0] ?? null;
  // Last non-null day of the last week (week array tails may contain nulls).
  let windowEnd = null;
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    const wk = weeks[i] ?? [];
    for (let j = wk.length - 1; j >= 0; j -= 1) {
      if (wk[j]) {
        windowEnd = wk[j];
        break;
      }
    }
    if (windowEnd) break;
  }
  if (!windowStart || !windowEnd) return [];

  // Pull from flatRows (not filteredRows) so a task that *starts* in
  // December is still present when the user is viewing January. The
  // project and resource pickers are still honored, but year/month are
  // replaced by the overlap check below.
  return flatRows.filter((row) => {
    if (
      selectedProjects.length > 0 &&
      !selectedProjects.includes(row.project)
    )
      return false;
    if (
      selectedResources.length > 0 &&
      !selectedResources.includes(row.resourceName)
    )
      return false;

    const plannedStart = parseDate(row.plannedStart);
    const plannedStop = parseDate(
      row.plannedStop ?? row.plannedStopDate ?? row.plannedEndDate ?? row.endDate,
    );

    if (!(plannedStart instanceof Date) || Number.isNaN(plannedStart.getTime()))
      return false;
    if (!(plannedStop instanceof Date) || Number.isNaN(plannedStop.getTime()))
      return false;

    // Keep tasks that OVERLAP the visible window:
    //   start <= windowEnd AND stop >= windowStart
    return plannedStart <= windowEnd && plannedStop >= windowStart;
  });
}, [
  flatRows,
  monthBlocks,
  safeOccMonthBlockIndex,
  selectedProjects,
  selectedResources,
]);


// ================================================================
// Timeline chart data preparation
// ================================================================

  const timelineResources = useMemo(() => {
    const l = selectedResources.length
      ? selectedResources
      : resourcePickerOptions;
    return [...l].sort();
  }, [selectedResources, resourcePickerOptions]);

  const maxDurationHrs = useMemo(() => {
    let mx = 0;
    Object.values(aggByDate).forEach((d) => {
      if (d.plannedTotal > mx) mx = d.plannedTotal;
      if (d.actualTotal > mx) mx = d.actualTotal;
    });
    if (mx <= 0) mx = 8;
    return Math.ceil((mx + 1) / 2) * 2;
  }, [aggByDate]);

  function pctFromHrs(hrs) {
    if (hrs == null) return null;
    return (1 - clamp(hrs / maxDurationHrs, 0, 1)) * 100;
  }

  const durationLabels = useMemo(() => {
    const s = maxDurationHrs / 5;
    const l = [];
    for (let h = 0; h <= maxDurationHrs + 0.001; h += s)
      l.push({ h, label: `${Math.round(h * 10) / 10}h` });
    return l;
  }, [maxDurationHrs]);

  function toggleMonth(n) {
    setSelectedMonths((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
    );
  }
  function toggleProject(n) {
    setSelectedProjects((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
    );
  }
  function toggleResource(n) {
    setSelectedResources((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
    );
  }
  function toggleExpandedResource(n) {
    setExpandedResources((p) => ({ ...p, [n]: !p[n] }));
  }

  const monthSummary =
    selectedMonths.length === 0
      ? "All months"
      : selectedMonths.length === 1
        ? selectedMonths[0]
        : `${selectedMonths.length} months selected`;
  const projectSummary =
    selectedProjects.length === 0
      ? "All projects"
      : selectedProjects.length === 1
        ? selectedProjects[0]
        : `${selectedProjects.length} projects selected`;
  const resourceSummary =
    selectedResources.length === 0
      ? "All resources"
      : selectedResources.length === 1
        ? selectedResources[0]
        : `${selectedResources.length} resources selected`;

  const dropdownStyle = {
    fontSize: 12,
    color: t.inputText,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: 8,
    padding: "6px 10px",
    background: t.inputBg,
    outline: "none",
    minWidth: "var(--wt-dropdown-min-width,150px)",
    height: 30,
    boxSizing: "border-box",
  };


  // ================================================================
  // Project pagination logic
  // ================================================================
  const projectBreakdownKey = `${selectedYear}|${selectedMonths}|${selectedProjects}|${selectedResources}`;
  const projectsPerPage = useMemo(() => {
    if (viewportWidth <= 480) return 1;
    if (viewportWidth <= 900) return 2;
    if (viewportWidth <= 1300) return 3;
    return 4;
  }, [viewportWidth]);

  const projectPages = useMemo(() => {
    if (!filteredProjectsData.length) return [[]];
    const p = [];
    for (let i = 0; i < filteredProjectsData.length; i += projectsPerPage)
      p.push(filteredProjectsData.slice(i, i + projectsPerPage));
    return p;
  }, [filteredProjectsData, projectsPerPage]);

  useEffect(() => {
    setProjectPageIndex(0);
  }, [projectBreakdownKey, projectsPerPage]);

  const safeProjectPageIndex = Math.min(
    projectPageIndex,
    Math.max(projectPages.length - 1, 0),
  );

  function goToProjectPage(i) {
    if (i < 0 || i >= projectPages.length) return;
    setProjectSlideDir(i > safeProjectPageIndex ? 1 : -1);
    setProjectPageIndex(i);
  }

  // Toggle functions for filter bar
  const toggleMonthFilter = (n) =>
    setSelectedMonths((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
    );
  const toggleProjectFilter = (n) =>
    setSelectedProjects((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
    );
  const toggleResourceFilter = (n) =>
    setSelectedResources((p) =>
      p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
    );


    // const filteredUnallocatedResources = useMemo(() => {
    //   if (selectedResources.length === 0) return unallocatedResourcesList;
    //   return unallocatedResourcesList.filter((r) =>
    //     selectedResources.includes(r.resourceName),
    //   );
    // }, [unallocatedResourcesList, selectedResources, selectedMonths, selectedYear]);

   const filteredUnallocatedResources = (unallocatedResourcesList || []).filter((r) =>
  (r.UnallocatedMonths || "").split(",").some((month) => selectedMonths.includes(month.trim()))
);

  return (
    <div>
      <div
        className="wt-root"
        style={{
          width: "100%",
          background: t.rootBg,
          padding: 24,
          borderRadius: 16,
          fontFamily: "ui-sans-serif,system-ui,sans-serif",
          color: t.textPrimary,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {/* <style>
          {`
            .wt-root{--wt-chart-height:170px;--wt-bar-max-width:20px;--wt-dropdown-min-width:150px;}
            @keyframes wtSlideInRight{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}
            @keyframes wtSlideInLeft{from{transform:translateX(-28px);opacity:0}to{transform:translateX(0);opacity:1}}
            @keyframes wtStatusPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.45}}
            .wt-weeks-row{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}
            @media(max-width:900px){.wt-root{padding:14px!important;border-radius:12px!important;--wt-chart-height:150px;}.wt-filter-bar{flex-direction:column!important;align-items:stretch!important;}.wt-filter-field{width:100%;}.wt-refresh-btn{width:100%;}}
            .gantt-resource-row:hover{background:${t.occRowOdd};}
          `}
        </style> */}

        {/* Filter Bar */}
        {/* <FilterBar
          t={t}
          apiLoading={apiLoading}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
          currentYear={currentYear}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          monthPickerOpen={monthPickerOpen}
          setMonthPickerOpen={setMonthPickerOpen}
          monthPickerRef={monthPickerRef}
          monthSummary={monthSummary}
          selectedProjects={selectedProjects}
          setSelectedProjects={setSelectedProjects}
          projectPickerOptions={projectPickerOptions}
          projectPickerOpen={projectPickerOpen}
          setProjectPickerOpen={setProjectPickerOpen}
          projectPickerRef={projectPickerRef}
          projectSummary={projectSummary}
          selectedResources={selectedResources}
          setSelectedResources={setSelectedResources}
          resourcePickerOptions={resourcePickerOptions}
          resourcePickerOpen={resourcePickerOpen}
          setResourcePickerOpen={setResourcePickerOpen}
          resourcePickerRef={resourcePickerRef}
          resourceSummary={resourceSummary}
          loadData={loadData}
          dropdownStyle={dropdownStyle}
        /> */}

        {apiLoading && !apiResponse ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: t.loadingText,
              fontSize: 13,
            }}
          >
            Fetching schedule from API&hellip;
          </div>
        ) : apiError ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: t.errorText,
              fontSize: 13,
            }}
          >
            Failed to load schedule: {apiError}
          </div>
        )  : (
          <>
            {/* Resource Occupancy Section */}
            <ResourceOccupancySection
              t={t}
              monthBlocks={monthBlocks}
              safeOccMonthBlockIndex={safeOccMonthBlockIndex}
              occMonthSlideDir={occMonthSlideDir}
              currentOccMonthBlock={currentOccMonthBlock}
              goToOccMonthBlock={goToOccMonthBlock}
              timelineResources={timelineResources}
              occupancyByResourceDate={occupancyByResourceDate}
              taskOccupancyByResourceDate={taskOccupancyByResourceDate}
              resourceColorMap={resourceColorMap}
              RESOURCE_DAILY_CAPACITY_HRS={RESOURCE_DAILY_CAPACITY_HRS}
              expandedResources={expandedResources}
              toggleExpandedResource={toggleExpandedResource}
              showHover={showHover}
              hideHover={hideHover}
              filteredRows={filteredRows}
              isDark={isDark}
              selectedYear={selectedYear}
               weeks={currentOccMonthBlock.weeks}
  filteredUnallocatedResources={filteredUnallocatedResources}
  capacityHrs={8}
  // t={t}
  // isDark={isDark}
  // showHover={showHover}
  // hideHover={hideHover}
 currentMonthResourceMetrics={resourceMetricsForDisplay}
          apiLoading={apiLoading}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
          currentYear={currentYear}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          monthPickerOpen={monthPickerOpen}
          setMonthPickerOpen={setMonthPickerOpen}
          monthPickerRef={monthPickerRef}
          monthSummary={monthSummary}
          selectedProjects={selectedProjects}
          setSelectedProjects={setSelectedProjects}
          projectPickerOptions={projectPickerOptions}
          projectPickerOpen={projectPickerOpen}
          setProjectPickerOpen={setProjectPickerOpen}
          projectPickerRef={projectPickerRef}
          projectSummary={projectSummary}
          selectedResources={selectedResources}
          setSelectedResources={setSelectedResources}
          resourcePickerOptions={resourcePickerOptions}
          resourcePickerOpen={resourcePickerOpen}
          setResourcePickerOpen={setResourcePickerOpen}
          resourcePickerRef={resourcePickerRef}
          resourceSummary={resourceSummary}
          loadData={loadData}
          dropdownStyle={dropdownStyle}



            />

          {/* {  filteredUnallocatedResources.length > 0 && (
            <UnallocatedResourceOccupancy
  weeks={currentOccMonthBlock.weeks}
  unallocatedUsers={filteredUnallocatedResources}
  capacityHrs={8}
  t={t}
  isDark={isDark}
  showHover={showHover}
  hideHover={hideHover}
/>)} */}
{/* {console.log('Filtered API Response:', filteredApiResponse)} */}
            {/* Resource Gantt Section */}
            <ResourceGanttSection
              t={t}
              filteredProjectsData={ganttData}
              ganttSelection={ganttSelection}
              handleGanttSelectionChange={handleGanttSelectionChange}
              isDark={isDark}
              
            />
            
          </>
        )}

        {/* Tooltip */}
        <TooltipComponent
          hovered={hovered}
          tooltipRef={tooltipRef}
          showHover={showHover}
          hideHover={hideHover}
          t={t}
        />
      </div>
    </div>
  );
}
