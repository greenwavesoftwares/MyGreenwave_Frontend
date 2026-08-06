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

/* ================================================================
   THEME  –  reads localStorage "Theme" (light | dark)
   ================================================================ */

function getThemeMode() {
  try {
    return localStorage.getItem("Theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

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
    rangeLabelText: "#94a3b8",
  },
};

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
function toMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
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
function isTaskStatus(status, ...values) {
  return values.includes(normalizeStatus(status));
}

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
      icon: "⏸",
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
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

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

  function loadData(year = selectedYear, months = selectedMonths) {
    setApiLoading(true);
    setApiError(null);
    fetchProjects(year, months);
  }

  const fetchProjects = async (year, months) => {
    try {
      const r = await activityTrackerApi.getActivityTreesByMonthAndDate(
        months.length === 0 ? MONTH_NAMES.join(",") : months.join(","),
        year,
      );
      setApiResponse(r ?? { data: [] });
    } catch (e) {
      setApiError(String(e?.message ?? e));
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedYear, selectedMonths);
  }, [selectedYear, selectedMonths.join(",")]);

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

  function rowMatchesFilters(row, { months, projects, resources }, skip) {
    const d = parseDate(row.plannedStart);
    if (!d || d.getFullYear() !== selectedYear) return false;
    if (
      skip !== "month" &&
      months.length &&
      !months.includes(MONTH_NAMES[d.getMonth()])
    )
      return false;
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
          {
            months: selectedMonths,
            projects: [],
            resources: selectedResources,
          },
          "project",
        )
      )
        s.add(r.project);
    });
    return allProjectNames.filter((p) => s.has(p));
  }, [
    flatRows,
    selectedYear,
    selectedMonths,
    selectedResources,
    allProjectNames,
  ]);

  // Resource picker options - affected by year, month, and project filters
  const resourcePickerOptions = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      if (
        rowMatchesFilters(
          r,
          { months: selectedMonths, projects: selectedProjects, resources: [] },
          "resource",
        )
      )
        s.add(r.resourceName);
    });
    return allResourceNames.filter((r) => s.has(r));
  }, [
    flatRows,
    selectedYear,
    selectedMonths,
    selectedProjects,
    allResourceNames,
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

  const selectedMonthIndices = useMemo(() => {
    if (selectedMonths.length === 0)
      return MONTH_NAMES.map((_, index) => index);
    return selectedMonths
      .map((n) => MONTH_NAMES.indexOf(n))
      .sort((a, b) => a - b);
  }, [selectedMonths]);

  const rangeLabel = useMemo(() => {
    if (selectedMonths.length === 0) return `All months, ${selectedYear}`;
    if (selectedMonths.length === 1)
      return `${selectedMonths[0]} ${selectedYear}`;
    return `${selectedMonths.length} months selected, ${selectedYear}`;
  }, [selectedMonths, selectedYear]);

  const filteredRows = useMemo(() => {
    const ms = new Set(selectedMonthIndices);
    return flatRows.filter((r) => {
      const d = parseDate(r.plannedStart);
      return (
        d &&
        d.getFullYear() === selectedYear &&
        ms.has(d.getMonth()) &&
        (selectedProjects.length === 0 ||
          selectedProjects.includes(r.project)) &&
        (selectedResources.length === 0 ||
          selectedResources.includes(r.resourceName))
      );
    });
  }, [
    flatRows,
    selectedYear,
    selectedMonthIndices,
    selectedProjects,
    selectedResources,
  ]);

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

  const occupancyByResourceDate = useMemo(() => {
    const map = {};
    const WORK_START_HR = 10;
    const WORK_END_HR = 18;
    const BLOCKS = WORK_END_HR - WORK_START_HR;

    function bucket(dk, rn) {
      if (!map[dk]) map[dk] = {};
      if (!map[dk][rn])
        map[dk][rn] = {
          hours: 0,
          tasks: [],
          hourly: new Array(BLOCKS).fill(0),
        };
      return map[dk][rn];
    }

    filteredRows.forEach((r) => {
      const pStart = parseDate(r.plannedStart);
      if (!pStart) return;
      const pStop = parseDate(r.plannedStop);
      const aStart = parseDate(r.actualStart);
      const aStop = parseDate(r.actualStop);
      const res = r.resourceName;
      const pDuration = plannedDurationHrs(r) || 0;

      let start, end;
      if (aStart) {
        start = aStart;
        const aDuration = actualDurationHrs(r);
        if (aStop) {
          end = aStop;
        } else if (isTaskStatus(r.status, "running", "paused")) {
          end = new Date(aStart.getTime() + 3600000);
        } else {
          end = new Date(
            start.getTime() +
              (aDuration != null ? aDuration : pDuration) * 3600000,
          );
        }
      } else if (isTaskStatus(r.status, "completed", "finished")) {
        start = pStart;
        end = pStop || new Date(start.getTime() + pDuration * 3600000);
      } else {
        start = pStart;
        end = pStop || new Date(start.getTime() + pDuration * 3600000);
      }

      const startMid = toMidnight(start);
      const endMid = toMidnight(end);
      const cur = new Date(startMid);

      while (cur <= endMid) {
        const dk = cur.toDateString();
        const dayStartWork = new Date(cur);
        dayStartWork.setHours(WORK_START_HR, 0, 0, 0);
        const dayEndWork = new Date(cur);
        dayEndWork.setHours(WORK_END_HR, 0, 0, 0);
        const segStart = new Date(
          Math.max(start.getTime(), dayStartWork.getTime()),
        );
        const segEnd = new Date(Math.min(end.getTime(), dayEndWork.getTime()));
        const segHrs = Math.max(0, segEnd - segStart) / 3600000;

        if (segHrs > 0) {
          const b = bucket(dk, res);
          b.hours += segHrs;
          for (let h = 0; h < BLOCKS; h++) {
            const blockStart = new Date(cur);
            blockStart.setHours(WORK_START_HR + h, 0, 0, 0);
            const blockEnd = new Date(cur);
            blockEnd.setHours(WORK_START_HR + h + 1, 0, 0, 0);
            const overlapMs = Math.max(
              0,
              Math.min(segEnd.getTime(), blockEnd.getTime()) -
                Math.max(segStart.getTime(), blockStart.getTime()),
            );
            if (overlapMs > 0) b.hourly[h] += overlapMs / 3600000;
          }
          b.tasks.push({
            row: r,
            hours: segHrs,
            daysFromStart: daysBetween(toMidnight(start), cur),
            originalPlannedStart: pStart,
            originalPlannedStop: pStop,
            totalPlannedHrs: pDuration,
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [filteredRows]);

  const taskOccupancyByResourceDate = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const pS = parseDate(r.plannedStart);
      if (!pS) return;
      const aS = parseDate(r.actualStart);
      const rn = r.resourceName,
        tn = r.task || "Untitled";
      if (!map[rn]) map[rn] = {};
      if (!map[rn][tn]) map[rn][tn] = {};
      if (aS) {
        const dk = toMidnight(aS).toDateString();
        const hrs = actualDurationHrs(r) || plannedDurationHrs(r) || 0;
        map[rn][tn][dk] = (map[rn][tn][dk] || 0) + hrs;
      } else {
        const dk = toMidnight(pS).toDateString();
        map[rn][tn][dk] = (map[rn][tn][dk] || 0) + (plannedDurationHrs(r) || 0);
      }
    });
    return map;
  }, [filteredRows]);

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

  return (
    <div className="container mx-auto px-4">
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
        <style>
          {`
            .wt-root{--wt-chart-height:170px;--wt-bar-max-width:20px;--wt-dropdown-min-width:150px;}
            @keyframes wtSlideInRight{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}
            @keyframes wtSlideInLeft{from{transform:translateX(-28px);opacity:0}to{transform:translateX(0);opacity:1}}
            @keyframes wtStatusPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.45}}
            .wt-weeks-row{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}
            @media(max-width:900px){.wt-root{padding:14px!important;border-radius:12px!important;--wt-chart-height:150px;}.wt-filter-bar{flex-direction:column!important;align-items:stretch!important;}.wt-filter-field{width:100%;}.wt-refresh-btn{width:100%;}}
            .gantt-resource-row:hover{background:${t.occRowOdd};}
          `}
        </style>

        {/* Filter Bar */}
        <FilterBar
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
        />

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
        ) : filteredRows.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: t.emptyText,
              fontSize: 13,
            }}
          >
            No scheduled activity for this selection.
          </div>
        ) : (
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
            />

            {/* Resource Gantt Section */}
            <ResourceGanttSection
              t={t}
              filteredProjectsData={filteredProjectsData}
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
