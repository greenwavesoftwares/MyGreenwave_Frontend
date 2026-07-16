import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import activityTrackerApi from "../../Services/activityTrackerApi";
import Tooltip from "@mui/material/Tooltip";
import GanttView from "../../Test Ground/GanttView";

/* ================================================================
   THEME  –  reads localStorage "Theme" (light | dark)
   ================================================================ */
function getThemeMode() {
  try { return localStorage.getItem("Theme") === "dark" ? "dark" : "light"; }
  catch { return "light"; }
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
    barLabelColor: "rgba(255,255,255,0.95)",
    barLabelShadow: "0 1px 1px rgba(0,0,0,0.35)",
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
    return () => { window.removeEventListener("storage", onStorage); clearInterval(interval); };
  }, []);
  return { mode, isDark: mode === "dark", t: PALETTES[mode] };
}

/* ================================================================ */
const EARLY_LATE_THRESHOLD_HRS = 0.25;
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GOLDEN_ANGLE = 137.508;
const RESOURCE_DAILY_CAPACITY_HRS = 8;

function hueForIndex(i) { return Math.round((i * GOLDEN_ANGLE) % 360); }
function resourceBaseColor(index) {
  const hue = hueForIndex(index);
  return { hue, actual: `hsl(${hue}, 62%, 48%)`, planned: `hsl(${hue}, 62%, 48%)` };
}
function activityColor(i) { return `hsl(${hueForIndex(i)}, 60%, 52%)`; }
function activityColorPending(i) { return `hsl(${hueForIndex(i)}, 35%, 88%)`; }
function parseDate(str) { if (!str) return null; return new Date(str); }
function fmtTime(date) { if (!date) return "--:--"; return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(date) { return date.toLocaleDateString([], { month: "short", day: "numeric" }); }
function fmtDateTime(date) { if (!date) return "\u2014"; return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function fmtDuration(h) {
  if (h == null) return "\u2014";
  let totalMinutes = Math.round(h * 60);
  const days = Math.floor(totalMinutes / (24 * 60)); totalMinutes -= days * 24 * 60;
  const hrs = Math.floor(totalMinutes / 60); const mins = totalMinutes % 60;
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
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function plannedDurationHrs(row) { if (typeof row.durationHrs === "number") return row.durationHrs; return (parseDate(row.plannedStop) - parseDate(row.plannedStart)) / 3600000; }
function actualDurationHrs(row) {
  if (!row.actualStart) return null;
  const s = parseDate(row.actualStart);
  const e = row.actualStop ? parseDate(row.actualStop) : (row.status === "Running" || row.status === "Paused") ? new Date(s.getTime() + 3600000) : null;
  if (!e) return null;
  return (e - s) / 3600000;
}
function occupiedHoursForRow(row) { const a = actualDurationHrs(row); if (a != null) return a; return plannedDurationHrs(row) || 0; }
function finishedEarlyLateInfo(row) {
  if (!row.actualStop) return null;
  const p = plannedDurationHrs(row), a = actualDurationHrs(row);
  if (a == null) return null;
  const d = a - p;
  if (d < -EARLY_LATE_THRESHOLD_HRS) return { type: "early", diff: Math.abs(d) };
  if (d > EARLY_LATE_THRESHOLD_HRS) return { type: "late", diff: d };
  return { type: "ontime", diff: d };
}
function toMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function daysBetween(a, b) { return Math.round((toMidnight(b) - toMidnight(a)) / 86400000); }
function weeksForMonth(year, monthIdx) {
  const ms = new Date(year, monthIdx, 1), me = new Date(year, monthIdx + 1, 0); ms.setHours(0,0,0,0); me.setHours(0,0,0,0);
  const sd = ms.getDay(), td = me.getDate(), w = []; let dn = 1;
  const fw = [];
  for (let i = 0; i < 7; i++) { if (i < sd) fw.push(null); else fw.push(new Date(year, monthIdx, dn++)); }
  w.push(fw);
  while (dn <= td) {
    const wk = [];
    for (let i = 0; i < 7; i++) { if (dn <= td) wk.push(new Date(year, monthIdx, dn++)); else wk.push(null); }
    w.push(wk);
  }
  return w;
}
function aggregateActivities(rows) {
  const m = new Map();
  rows.forEach((r) => {
    const k = r.task || "Untitled";
    if (!m.has(k)) m.set(k, { activity: k, plannedHrs: 0, actualHrs: 0, finished: false, started: false });
    const e = m.get(k);
    e.plannedHrs += plannedDurationHrs(r) || 0;
    const a = actualDurationHrs(r);
    if (a != null) e.actualHrs += a;
    if (r.actualStop) e.finished = true;
    if (r.actualStart) e.started = true;
  });
  return Array.from(m.values());
}
function activityProgressPct(e) { if (e.finished) return 100; if (!e.started || !e.plannedHrs) return 0; return clamp(Math.round((e.actualHrs / e.plannedHrs) * 100), 0, 99); }

function getOccupancyColor(hours) {
  if (hours < 4) return "#22c55e";      // < 4 h  – green
  if (hours < 5) return "#84cc16";      // 4-5 h  – lime
  if (hours < 6) return "#eab308";      // 5-6 h  – yellow
  if (hours < 6.75) return "#f97316";   // 6 h    – orange
  if (hours < 7.75) return "#ea580c";   // 7 h    – dark orange
  return "#dc2626";                     // 8 h+   – red
}
function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function ActivityTrackerCharts() {
  const { mode, isDark, t } = useTheme();
  const [hovered, setHovered] = useState(null);
  const hoverHideTimeout = useRef(null);
  const tooltipRef = useRef(null);

  function showHover(data) {
    if (hoverHideTimeout.current) { clearTimeout(hoverHideTimeout.current); hoverHideTimeout.current = null; }
    setHovered(data);
  }
  function hideHover() {
    if (hoverHideTimeout.current) clearTimeout(hoverHideTimeout.current);
    hoverHideTimeout.current = setTimeout(() => { setHovered(null); hoverHideTimeout.current = null; }, 200);
  }

  useEffect(() => {
    if (!hovered) return;
    function h(e) { if (tooltipRef.current && tooltipRef.current.contains(e.target)) return; setHovered(null); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [hovered]);

  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState([MONTH_NAMES[currentMonthIdx]]);
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

  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    function h() { setViewportWidth(window.innerWidth); }
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const [weekViewMode, setWeekViewMode] = useState("chart");

  const [projectPageIndex, setProjectPageIndex] = useState(0);
  const [projectSlideDir, setProjectSlideDir] = useState(1);

  function loadData(year = selectedYear, months = selectedMonths) { setApiLoading(true); setApiError(null); fetchProjects(year, months); }

  const fetchProjects = async (year, months) => {
    try {
      const r = await activityTrackerApi.getActivityTreesByMonthAndDate(months.length === 0 ? MONTH_NAMES.join(",") : months.join(","), year);
      setApiResponse(r ?? { data: [] });
    } catch (e) { setApiError(String(e?.message ?? e)); } finally { setApiLoading(false); }
  };

  useEffect(() => { loadData(selectedYear, selectedMonths); }, [selectedYear, selectedMonths.join(",")]);

  useEffect(() => {
    function h(e) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) setMonthPickerOpen(false);
      if (projectPickerRef.current && !projectPickerRef.current.contains(e.target)) setProjectPickerOpen(false);
      if (resourcePickerRef.current && !resourcePickerRef.current.contains(e.target)) setResourcePickerOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const projectsData = useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    return [];
  }, [apiResponse]);

  const flatRows = useMemo(() => {
    const a = [];
    projectsData.forEach((p) => {
      (p.rows || []).forEach((r) => { a.push({ project: p.project, po: p.po, site: p.site, id: p.id, ...r }); });
    });
    return a;
  }, [projectsData]);

  const availableYears = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => { const d = parseDate(r.plannedStart); if (d) s.add(d.getFullYear()); });
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
    allResourceNames.forEach((n, i) => { m[n] = resourceBaseColor(i); });
    return m;
  }, [allResourceNames]);

  function rowMatchesFilters(row, { months, projects, resources }, skip) {
    const d = parseDate(row.plannedStart);
    if (!d || d.getFullYear() !== selectedYear) return false;
    if (skip !== "month" && months.length && !months.includes(MONTH_NAMES[d.getMonth()])) return false;
    if (skip !== "project" && projects.length && !projects.includes(row.project)) return false;
    if (skip !== "resource" && resources.length && !resources.includes(row.resourceName)) return false;
    return true;
  }

  const monthPickerOptions = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      if (rowMatchesFilters(r, { months: [], projects: [], resources: selectedResources }, "month"))
        s.add(MONTH_NAMES[parseDate(r.plannedStart).getMonth()]);
    });
    return MONTH_NAMES.filter((m) => s.has(m));
  }, [flatRows, selectedYear, selectedResources]);

  const projectPickerOptions = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      if (rowMatchesFilters(r, { months: selectedMonths, projects: [], resources: selectedResources }, "project"))
        s.add(r.project);
    });
    return allProjectNames.filter((p) => s.has(p));
  }, [flatRows, selectedYear, selectedMonths, selectedResources, allProjectNames]);

  const resourcePickerOptions = useMemo(() => {
    const s = new Set();
    flatRows.forEach((r) => {
      if (rowMatchesFilters(r, { months: selectedMonths, projects: selectedProjects, resources: [] }, "resource"))
        s.add(r.resourceName);
    });
    return allResourceNames.filter((r) => s.has(r));
  }, [flatRows, selectedYear, selectedMonths, selectedProjects, allResourceNames]);

  useEffect(() => {
    if (!apiResponse) return;
    setSelectedMonths((p) => { const n = p.filter((m) => monthPickerOptions.includes(m)); return n.length === p.length ? p : n; });
  }, [apiResponse, monthPickerOptions]);
  useEffect(() => {
    if (!apiResponse) return;
    setSelectedProjects((p) => { const n = p.filter((x) => projectPickerOptions.includes(x)); return n.length === p.length ? p : n; });
  }, [apiResponse, projectPickerOptions]);
  useEffect(() => {
    if (!apiResponse) return;
    setSelectedResources((p) => { const n = p.filter((x) => resourcePickerOptions.includes(x)); return n.length === p.length ? p : n; });
  }, [apiResponse, resourcePickerOptions]);

  const selectedMonthIndices = useMemo(() => {
    if (selectedMonths.length === 0) return monthPickerOptions.map((n) => MONTH_NAMES.indexOf(n)).sort((a, b) => a - b);
    return selectedMonths.map((n) => MONTH_NAMES.indexOf(n)).sort((a, b) => a - b);
  }, [selectedMonths, monthPickerOptions]);

  const rangeLabel = useMemo(() => {
    if (selectedMonths.length === 0) return `All months, ${selectedYear}`;
    if (selectedMonths.length === 1) return `${selectedMonths[0]} ${selectedYear}`;
    return `${selectedMonths.length} months selected, ${selectedYear}`;
  }, [selectedMonths, selectedYear]);

  const filteredRows = useMemo(() => {
    const ms = new Set(selectedMonthIndices);
    return flatRows.filter((r) => {
      const d = parseDate(r.plannedStart);
      return d && d.getFullYear() === selectedYear && ms.has(d.getMonth())
        && (selectedProjects.length === 0 || selectedProjects.includes(r.project))
        && (selectedResources.length === 0 || selectedResources.includes(r.resourceName));
    });
  }, [flatRows, selectedYear, selectedMonthIndices, selectedProjects, selectedResources]);

  const filteredProjectsData = useMemo(() => {
    const m = new Map();
    filteredRows.forEach((r) => {
      if (!m.has(r.project)) m.set(r.project, { project: r.project, po: r.po, site: r.site, id: r.id, rows: [] });
      m.get(r.project).rows.push(r);
    });
    return Array.from(m.values());
  }, [filteredRows]);

  const monthBlocks = useMemo(() =>
    selectedMonthIndices.map((m) => ({
      key: `${selectedYear}-${m}`,
      label: selectedMonthIndices.length > 1 ? `${MONTH_NAMES[m]} ${selectedYear}` : null,
      monthIdx: m,
      weeks: weeksForMonth(selectedYear, m),
    })),
    [selectedYear, selectedMonthIndices]
  );

  useEffect(() => { setMonthBlockIndex(0); setOccMonthBlockIndex(0); }, [selectedYear, selectedMonthIndices.join(",")]);

  const safeMonthBlockIndex = Math.min(monthBlockIndex, Math.max(monthBlocks.length - 1, 0));
  const currentMonthBlock = monthBlocks[safeMonthBlockIndex];

  function goToMonthBlock(i) {
    if (i < 0 || i >= monthBlocks.length) return;
    setMonthSlideDir(i > safeMonthBlockIndex ? 1 : -1);
    setMonthBlockIndex(i);
  }

  const safeOccMonthBlockIndex = Math.min(occMonthBlockIndex, Math.max(monthBlocks.length - 1, 0));
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
        if (!br[n]) br[n] = { resourceName: n, plannedHrs: 0, actualHrs: 0, tasks: [], hasRunning: false };
        const p = plannedDurationHrs(row) || 0;
        const a = actualDurationHrs(row);
        br[n].plannedHrs += p;
        br[n].actualHrs += a || 0;
        br[n].tasks.push({ row, plannedHrs: p, actualHrs: a });
        if (row.status === "Running") br[n].hasRunning = true;
      });
      const resources = Object.values(br).sort((x, y) => x.resourceName.localeCompare(y.resourceName));
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
    const todayMid = toMidnight(new Date());

    function bucket(dk, rn) {
      if (!map[dk]) map[dk] = {};
      if (!map[dk][rn]) map[dk][rn] = { hours: 0, delayedHours: 0, tasks: [] };
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

      let start, end, totalHours, delayed;

      if (aStart) {
        // Actual work: spread actual hours across the actual date range
        start = aStart;
        const aDuration = actualDurationHrs(r);
        totalHours = aDuration != null ? aDuration : pDuration;
        if (aStop) {
          end = aStop;
        } else if (r.status === "Running" || r.status === "Paused") {
          end = new Date(aStart.getTime() + 3600000);
        } else {
          end = new Date(aStart.getTime() + totalHours * 3600000);
        }
        delayed = false;
      } else if (r.status === "Completed") {
        start = pStart;
        end = pStop || new Date(start.getTime() + pDuration * 3600000);
        totalHours = pDuration;
        delayed = false;
      } else {
        // Planned/future/delayed: spread planned hours across the planned window
        start = pStart;
        end = pStop || new Date(start.getTime() + pDuration * 3600000);
        totalHours = pDuration;
        const pSM = toMidnight(start);
        const pEM = pStop ? toMidnight(pStop) : pSM;
        delayed = pSM <= todayMid && pEM < todayMid;
      }

      const startMid = toMidnight(start);
      const endMid = toMidnight(end);
      const dayCount = Math.max(1, daysBetween(startMid, endMid) + 1);
      const hoursPerDay = totalHours / dayCount;

      const cur = new Date(startMid);
      while (cur <= endMid) {
        const dk = cur.toDateString();
        const b = bucket(dk, res);
        b.hours += hoursPerDay;
        if (delayed) b.delayedHours += hoursPerDay;
        b.tasks.push({
          row: r,
          hours: hoursPerDay,
          delayed,
          delayDays: delayed && pStop ? daysBetween(toMidnight(pStop), todayMid) : 0,
          daysFromStart: daysBetween(toMidnight(start), cur),
          originalPlannedStart: pStart,
          originalPlannedStop: pStop,
          totalPlannedHrs: pDuration,
        });
        cur.setDate(cur.getDate() + 1);
      }
    });

    return map;
  }, [filteredRows]);

  const taskOccupancyByResourceDate = useMemo(() => {
    const map = {};
    const todayMid = toMidnight(new Date());
    filteredRows.forEach((r) => {
      const pS = parseDate(r.plannedStart);
      if (!pS) return;
      const pSt = parseDate(r.plannedStop), aS = parseDate(r.actualStart);
      const rn = r.resourceName, tn = r.task || "Untitled";
      if (!map[rn]) map[rn] = {};
      if (!map[rn][tn]) map[rn][tn] = {};
      const pSM = toMidnight(pS), pEM = pSt ? toMidnight(pSt) : pSM;
      if (aS) {
        const dk = toMidnight(aS).toDateString();
        const hrs = actualDurationHrs(r) || plannedDurationHrs(r) || 0;
        map[rn][tn][dk] = (map[rn][tn][dk] || 0) + hrs;
      } else if (pSM <= todayMid && r.status !== "Completed") {
        const th = plannedDurationHrs(r) || 0;
        const c = new Date(pSM);
        while (c <= todayMid) {
          const dk = c.toDateString();
          map[rn][tn][dk] = (map[rn][tn][dk] || 0) + th;
          c.setDate(c.getDate() + 1);
        }
      } else {
        const dk = pSM.toDateString();
        map[rn][tn][dk] = (map[rn][tn][dk] || 0) + (plannedDurationHrs(r) || 0);
      }
    });
    return map;
  }, [filteredRows]);

  const timelineResources = useMemo(() => {
    const l = selectedResources.length ? selectedResources : resourcePickerOptions;
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

  function pctFromHrs(hrs) { if (hrs == null) return null; return (1 - clamp(hrs / maxDurationHrs, 0, 1)) * 100; }

  const durationLabels = useMemo(() => {
    const s = maxDurationHrs / 5;
    const l = [];
    for (let h = 0; h <= maxDurationHrs + 0.001; h += s)
      l.push({ h, label: `${Math.round(h * 10) / 10}h` });
    return l;
  }, [maxDurationHrs]);

  function toggleMonth(n) { setSelectedMonths((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]); }
  function toggleProject(n) { setSelectedProjects((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]); }
  function toggleResource(n) { setSelectedResources((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]); }
  function toggleExpandedResource(n) { setExpandedResources((p) => ({ ...p, [n]: !p[n] })); }

  const monthSummary = selectedMonths.length === 0 ? "All months" : selectedMonths.length === 1 ? selectedMonths[0] : `${selectedMonths.length} months selected`;
  const projectSummary = selectedProjects.length === 0 ? "All projects" : selectedProjects.length === 1 ? selectedProjects[0] : `${selectedProjects.length} projects selected`;
  const resourceSummary = selectedResources.length === 0 ? "All resources" : selectedResources.length === 1 ? selectedResources[0] : `${selectedResources.length} resources selected`;

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
  const navArrowStyle = {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${t.navBorder}`,
    borderRadius: 6,
    background: t.navBg,
    color: t.navText,
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
  };
  const mkNav = (label, idx, max, go) => (
    <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} style={{ ...navArrowStyle, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? "default" : "pointer" }}>&lsaquo;</button>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.navLabel, minWidth: 110, textAlign: "center" }}>{label}</span>
      <button type="button" onClick={() => go(idx + 1)} disabled={idx === max} style={{ ...navArrowStyle, opacity: idx === max ? 0.4 : 1, cursor: idx === max ? "default" : "pointer" }}>&rsaquo;</button>
    </span>
  );

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

  useEffect(() => { setProjectPageIndex(0); }, [projectBreakdownKey, projectsPerPage]);

  const safeProjectPageIndex = Math.min(projectPageIndex, Math.max(projectPages.length - 1, 0));
  function goToProjectPage(i) {
    if (i < 0 || i >= projectPages.length) return;
    setProjectSlideDir(i > safeProjectPageIndex ? 1 : -1);
    setProjectPageIndex(i);
  }

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
        <style>{`
          .wt-root{--wt-chart-height:170px;--wt-bar-max-width:20px;--wt-dropdown-min-width:150px;}
          @keyframes wtSlideInRight{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}
          @keyframes wtSlideInLeft{from{transform:translateX(-28px);opacity:0}to{transform:translateX(0);opacity:1}}
          .wt-weeks-row{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}
          @media(max-width:900px){.wt-root{padding:14px!important;border-radius:12px!important;--wt-chart-height:150px;}.wt-filter-bar{flex-direction:column!important;align-items:stretch!important;}.wt-filter-field{width:100%;}.wt-refresh-btn{width:100%;}}
          .gantt-resource-row:hover{background:${t.occRowOdd};}
        `}</style>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: t.rangeLabelText, margin: "2px 0 10px" }}>
            {apiLoading && !apiResponse ? "Loading\u2026" : rangeLabel}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.textSubtle, fontWeight: 600 }}>
              <PatternSwatch color={t.swatchDefault}/> P - Planned (left bar)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.textSubtle, fontWeight: 600 }}>
              <PatternSwatch color={t.swatchDefault}/> A - Actual (right bar)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: t.textSubtle }}>
              <span style={{ color: t.earlyColor }}>{"\u25B2"}</span> Under planned Hours
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: t.textSubtle }}>
              <span style={{ color: t.lateColor }}>{"\u25BC"}</span> Over planned Hours
            </span>
          </div>

          <div
            className="wt-filter-bar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              background: t.filterBarBg,
              border: `1px solid ${t.filterBarBorder}`,
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <FilterField label="Year" t={t}>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} disabled={apiLoading} style={dropdownStyle}>
                {availableYears.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </FilterField>

            <FilterField label="Month" t={t}>
              <MultiSelectPicker
                t={t}
                pickerRef={monthPickerRef}
                open={monthPickerOpen}
                setOpen={setMonthPickerOpen}
                disabled={apiLoading}
                summary={monthSummary}
                allLabel="All months"
                allSelected={selectedMonths.length === 0}
                onSelectAll={() => setSelectedMonths([])}
                options={monthPickerOptions}
                selected={selectedMonths}
                onToggle={toggleMonth}
                dropdownStyle={dropdownStyle}
              />
            </FilterField>

            <FilterField label="Project" t={t}>
              <MultiSelectPicker
                t={t}
                pickerRef={projectPickerRef}
                open={projectPickerOpen}
                setOpen={setProjectPickerOpen}
                disabled={apiLoading || !projectPickerOptions.length}
                summary={projectSummary}
                allLabel="All projects"
                allSelected={selectedProjects.length === 0}
                onSelectAll={() => setSelectedProjects([])}
                options={projectPickerOptions}
                selected={selectedProjects}
                onToggle={toggleProject}
                dropdownStyle={dropdownStyle}
              />
            </FilterField>

            <FilterField label="Resource" t={t}>
              <MultiSelectPicker
                t={t}
                pickerRef={resourcePickerRef}
                open={resourcePickerOpen}
                setOpen={setResourcePickerOpen}
                disabled={apiLoading || !resourcePickerOptions.length}
                summary={resourceSummary}
                allLabel="All resources"
                allSelected={selectedResources.length === 0}
                onSelectAll={() => setSelectedResources([])}
                options={resourcePickerOptions}
                selected={selectedResources}
                onToggle={toggleResource}
                dropdownStyle={dropdownStyle}
              />
            </FilterField>

            <div style={{ flex: 1 }}/>

            <button
              onClick={() => loadData()}
              disabled={apiLoading}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: t.btnPrimary,
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                cursor: "pointer",
              }}
              className="wt-refresh-btn"
            >
              {apiLoading ? "Refreshing\u2026" : "Refresh data"}
            </button>
          </div>
        </div>

        {apiLoading && !apiResponse ? (
          <div style={{ padding: 40, textAlign: "center", color: t.loadingText, fontSize: 13 }}>Fetching schedule from API&hellip;</div>
        ) : apiError ? (
          <div style={{ padding: 40, textAlign: "center", color: t.errorText, fontSize: 13 }}>Failed to load schedule: {apiError}</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: t.emptyText, fontSize: 13 }}>No scheduled activity for this selection.</div>
        ) : (
          <>
           <AccordionSection
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span>Resource Occupancy &mdash; Free vs Occupied</span>
                  {monthBlocks.length > 1 && currentOccMonthBlock && mkNav(
                    `${MONTH_NAMES[currentOccMonthBlock.monthIdx]} ${selectedYear}`,
                    safeOccMonthBlockIndex,
                    monthBlocks.length - 1,
                    goToOccMonthBlock
                  )}
                </span>
              }
              t={t}
              defaultOpen
            >
              <div style={{ overflow: "hidden" }}>
                <div
                  key={currentOccMonthBlock ? currentOccMonthBlock.key : "occ-empty"}
                  style={{ animation: `${occMonthSlideDir === 1 ? "wtSlideInRight" : "wtSlideInLeft"} 0.28s ease` }}
                >
                  <ResourceOccupancyTimeline
                    days={currentOccMonthBlock ? currentOccMonthBlock.weeks.flat() : []}
                    resources={timelineResources}
                    occupancyByResourceDate={occupancyByResourceDate}
                    taskOccupancyByResourceDate={taskOccupancyByResourceDate}
                    resourceColorMap={resourceColorMap}
                    capacityHrs={RESOURCE_DAILY_CAPACITY_HRS}
                    expandedResources={expandedResources}
                    onToggleExpand={toggleExpandedResource}
                    showHover={showHover}
                    hideHover={hideHover}
                    filteredRows={filteredRows}
                    t={t}
                    isDark={isDark}
                  />
                </div>
              </div>
            </AccordionSection>

            <AccordionSection title="Resource Gantt" t={t} defaultOpen>
              <GanttView projects={filteredProjectsData}/>
            </AccordionSection>

         
          </>
        )}

        {hovered && (
          <div
            ref={tooltipRef}
            onMouseEnter={() => showHover(hovered)}
            onMouseLeave={hideHover}
            style={{
              position: "fixed",
              left: hovered.x,
              top: hovered.y,
              transform: hovered.side === "left" ? "translate(calc(-100% - 10px),-50%)" : "translate(10px,-50%)",
              zIndex: 50,
              background: t.ttBg,
              color: t.ttText,
              fontSize: 12,
              borderRadius: 10,
              padding: 12,
              maxWidth: "min(280px,90vw)",
              maxHeight: "min(320px,70vh)",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
            }}
          >
            <TooltipContent entry={hovered.entry} kind={hovered.kind} t={t}/>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── sub-components (all receive `t` for theming) ── */
function FilterField({ label, children, t }) {
  return (
    <label className="wt-filter-field" style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: t.textSecondary, fontWeight: 600 }}>
      {label}{children}
    </label>
  );
}

function AccordionSection({ title, defaultOpen = true, children, t }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: t.accBg, borderRadius: 14, border: `1px solid ${t.accBorder}`, marginTop: 16, overflow: "hidden", transition: "background 0.2s" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: t.accTitle }}>{title}</span>
        <span
          style={{
            fontSize: 11,
            color: t.accChevron,
            display: "inline-block",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          {"\u25BC"}
        </span>
      </div>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

function PatternSwatch({ color }) { return <span style={{ display: "inline-block", width: 16, height: 12, borderRadius: 3, background: color, border: `1px solid ${color}` }}/>; }

function MultiSelectPicker({ t, pickerRef, open, setOpen, disabled, summary, allLabel, allSelected, onSelectAll, options, selected, onToggle, dropdownStyle }) {
  return (
    <div ref={pickerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        style={{ ...dropdownStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <span style={{ fontSize: 9, color: t.textMuted }}>{"\u25BC"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 40,
            background: t.pickerBg,
            border: `1px solid ${t.pickerBorder}`,
            borderRadius: 10,
            boxShadow: t.pickerShadow,
            minWidth: 220,
            maxHeight: 260,
            overflowY: "auto",
            padding: 6,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: t.pickerText,
              fontWeight: 600,
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
              borderBottom: `1px solid ${t.pickerDivider}`,
              marginBottom: 2,
            }}
          >
            <input type="checkbox" checked={allSelected} onChange={onSelectAll}/> {allLabel}
          </label>
          {options.map((name) => (
            <label
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: t.pickerText,
                padding: "6px 8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={selected.includes(name)} onChange={() => onToggle(name)}/> {name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── TOOLTIP ── */
function TooltipContent({ entry, kind, t }) {
  if (!entry) return null;

  if (kind === "gantt-task") {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{entry.taskName}</div>
        <div style={{ color: t.ttMuted, marginBottom: 4 }}>{entry.resourceName}</div>
        <div style={{ fontSize: 12, marginBottom: 6 }}>
          {entry.startDate.toLocaleDateString([], { month: "short", day: "numeric" })}
          {entry.startDate.getTime() !== entry.endDate.getTime() && (
            <> &ndash; {entry.endDate.toLocaleDateString([], { month: "short", day: "numeric" })}</>
          )}
          {" \u2022 "}
          <span style={{ fontWeight: 600 }}>{entry.days} day{entry.days > 1 ? "s" : ""}</span>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{fmtDuration(entry.totalHours)}</div>
        {entry.taskRows && entry.taskRows.length > 0 && (
          <div style={{ borderTop: `1px solid ${t.ttDivider}`, paddingTop: 6, fontSize: 11 }}>
            {entry.taskRows.map((row, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <div style={{ color: "#cbd5e1" }}>{row.project} &bull; {row.status}</div>
                <div style={{ fontSize: 10.5 }}>
                  {fmtDateTime(parseDate(row.plannedStart))} &ndash; {fmtDateTime(parseDate(row.plannedStop))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (kind === "occupancy") {
    const occupied = entry.hours ?? 0;
    const free = entry.free ?? Math.max((entry.capacityHrs ?? 8) - occupied, 0);
    const over = Math.max(occupied - (entry.capacityHrs ?? 8), 0);
    const hasTasks = entry.tasks && entry.tasks.length > 0;
    const delayedHours = entry.delayedHours ?? 0;
    const hasDelay = delayedHours > 0;

    const delayedTasks = hasTasks ? entry.tasks.filter((x) => x.delayed) : [];
    const pendingInWindow = hasTasks ? entry.tasks.filter((x) => !x.delayed && !x.row.actualStart && x.originalPlannedStart) : [];
    const normalTasks = hasTasks ? entry.tasks.filter((x) => !x.delayed && (x.row.actualStart || !x.originalPlannedStart)) : [];

    return (
      <div style={{ minWidth: 240 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: t.ttText }}>{entry.resourceName}</div>
        <div style={{ color: t.ttMuted, fontSize: 11, marginBottom: 10 }}>
          {entry.date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </div>

        <div style={{ background: t.ttCardBg, borderRadius: 8, padding: "8px 10px", marginBottom: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: t.ttOccupiedText, fontWeight: 600, fontSize: 12 }}>Occupied</span>
            <span style={{ color: t.ttOccupiedText, fontWeight: 700, fontSize: 14 }}>{fmtDuration(occupied)}</span>
          </div>
          {hasDelay && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: t.ttDelayedText, fontWeight: 600, fontSize: 12 }}>{"\u26A0"} Delayed</span>
              <span style={{ color: t.ttDelayedText, fontWeight: 700, fontSize: 14 }}>{fmtDuration(delayedHours)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: t.ttFreeText, fontWeight: 600, fontSize: 12 }}>Free</span>
            <span style={{ color: t.ttFreeText, fontWeight: 700, fontSize: 14 }}>{fmtDuration(free)}</span>
          </div>
          {over > 0 && (
            <div style={{ color: t.ttOccupiedText, fontSize: 11, fontWeight: 600, marginTop: 2 }}>
              Over by {fmtDuration(over)}
            </div>
          )}
        </div>

        {delayedTasks.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: t.ttDelayedText, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {"\u26A0"} Delayed &mdash; Past planned deadline
            </div>
            {delayedTasks.map(({ row, hours, delayDays, daysFromStart, originalPlannedStart, originalPlannedStop, totalPlannedHrs }) => {
              const pS = originalPlannedStart || parseDate(row.plannedStart);
              const pE = originalPlannedStop || parseDate(row.plannedStop);
              return (
                <div key={row.id} style={{ background: t.ttDelayCardBg, border: `1px solid ${t.ttDelayCardBorder}`, borderRadius: 8, padding: "6px 9px", fontSize: 11, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ background: t.ttDelayChipBg, color: t.ttDelayChipText, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {row.project || "?"}
                    </span>
                    <span style={{ color: t.ttDelayChipText, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {row.task || "Untitled"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: t.ttDelayDateText }}>
                    Planned: {pS ? fmtDateTime(pS) : "\u2014"} &ndash; {pE ? fmtDateTime(pE) : "\u2014"}
                    {totalPlannedHrs != null && <> ({fmtDuration(totalPlannedHrs)})</>}
                  </div>
                  {/* <div style={{ fontSize: 10, color: t.ttDelayBoldText, fontWeight: 700, marginTop: 2 }}>
                    {delayDays} day{delayDays !== 1 ? "s" : ""} past deadline &bull; day {daysFromStart} since planned start
                  </div> */}
                  {/* <div style={{ fontSize: 10, color: t.ttDelaySubText, marginTop: 1 }}>
                    {fmtDurationCompact(hours)} still occupying
                  </div> */}
                </div>
              );
            })}
          </div>
        )}

        {pendingInWindow.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: t.ttMuted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending &mdash; Within planned window
            </div>
            {pendingInWindow.map(({ row, hours, daysFromStart, originalPlannedStart, originalPlannedStop, totalPlannedHrs }) => {
              const pS = originalPlannedStart || parseDate(row.plannedStart);
              const pE = originalPlannedStop || parseDate(row.plannedStop);
              return (
                <div key={row.id} style={{ background: t.ttCardBg, border: `1px solid ${t.ttCardBorder}`, borderRadius: 8, padding: "6px 9px", fontSize: 11, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ background: t.ttChipBg, color: t.ttChipText, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {row.project || "?"}
                    </span>
                    <span style={{ color: t.ttText, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {row.task || "Untitled"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: t.ttMuted }}>
                    Planned: {pS ? fmtDateTime(pS) : "\u2014"} &ndash; {pE ? fmtDateTime(pE) : "\u2014"}
                    {totalPlannedHrs != null && <> ({fmtDuration(totalPlannedHrs)})</>}
                  </div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 1 }}>
                    Day {daysFromStart} &bull; {fmtDurationCompact(hours)} occupying &bull; Not started
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {normalTasks.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: t.textSecondary, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {delayedTasks.length > 0 || pendingInWindow.length > 0 ? "Other tasks" : "Scheduled on this day"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {normalTasks.map(({ row, hours }) => {
                const pS = parseDate(row.plannedStart);
                const pE = parseDate(row.plannedStop);
                const aS = parseDate(row.actualStart);
                const aE = parseDate(row.actualStop);
                return (
                  <div key={row.id} style={{ background: t.ttCardBg, border: `1px solid ${t.ttCardBorder}`, borderRadius: 8, padding: "6px 9px", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ background: t.ttChipBg, color: t.ttChipText, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, whiteSpace: "nowrap" }}>
                        {row.project || "?"}
                      </span>
                      <span style={{ color: t.ttText, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {row.task || "Untitled"}
                      </span>
                      <span style={{ color: t.ttMuted, fontSize: 10, fontWeight: 500, whiteSpace: "nowrap" }}>
                        {fmtDurationCompact(hours)}{row.status && row.status !== "Completed" ? ` \u00B7 ${row.status}` : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: t.ttMuted }}>
                      Planned: {pS ? fmtDateTime(pS) : "—"} &ndash; {pE ? fmtDateTime(pE) : "—"}
                    </div>
                    {aS && (
                      <div style={{ fontSize: 10, color: t.ttActualColor, marginTop: 1 }}>
                        Actual: {aS ? fmtDateTime(aS) : "—"} &ndash; {aE ? fmtDateTime(aE) : "…"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasTasks && (
          <div style={{ marginTop: 4, padding: "6px 10px", background: t.ttFreeBg, borderRadius: 6, color: t.ttFreeText, fontSize: 12, fontWeight: 600, textAlign: "center" }}>
            {"\u2713"} Free all day
          </div>
        )}
      </div>
    );
  }

  if (kind === "task-day") {
    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry.taskName}</div>
        <div style={{ color: t.ttMuted }}>{entry.resourceName}</div>
        <div style={{ color: t.ttMuted }}>{entry.date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</div>
        <div style={{ marginTop: 6 }}>{fmtDuration(entry.hours)} on this task</div>
      </div>
    );
  }

  const hrs = kind === "planned" ? entry.plannedHrs : entry.actualHrs;
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry.resourceName}</div>
      <div style={{ color: t.ttMuted }}>
        {kind === "planned" ? "Planned" : "Actual"} &middot; {fmtDuration(hrs)}
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${t.ttDivider}` }}>
        {entry.tasks.map(({ row, plannedHrs, actualHrs }) => {
          const p = parseDate(row.plannedStart);
          const ps = parseDate(row.plannedStop);
          const a = row.actualStart ? parseDate(row.actualStart) : null;
          const as = row.actualStop ? parseDate(row.actualStop) : null;
          const info = finishedEarlyLateInfo(row);
          return (
            <div key={row.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: t.ttText }}>{row.task}</div>
              <div style={{ color: t.ttMuted }}>{row.module} &middot; {row.project}</div>
              <div>Planned: {fmtDateTime(p)} &ndash; {fmtDateTime(ps)} ({fmtDuration(plannedHrs)})</div>
              <div>Actual: {a ? `${fmtDateTime(a)} \u2013 ${as ? fmtDateTime(as) : "…"}` : "—"} ({fmtDuration(actualHrs)})</div>
              <div>Status: {row.status}</div>
              {info && info.type !== "ontime" && (
                <div style={{ color: info.type === "early" ? t.earlyColor : t.lateColor }}>
                  {info.type === "early" ? `Finished ${fmtDuration(info.diff)} early` : `Finished ${fmtDuration(info.diff)} late`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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

/* ── WeekCard ── */
function WeekCard({ weekIndex, days, aggByDate, durationLabels, pctFromHrs, resourceColorMap, showHover, hideHover, t }) {
  const rD = days.filter(Boolean);
  const sL = rD.length ? fmtDate(rD[0]) : "";
  const eL = rD.length ? fmtDate(rD[rD.length - 1]) : "";
  const rc = durationLabels.length;
  const ch = "var(--wt-chart-height,170px)";
  const ct = "repeat(7,minmax(0,1fr))";
  const DL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Week {weekIndex + 1}</h3>
        <span style={{ fontSize: 11, color: t.textMuted }}>{sL} &ndash; {eL}</span>
      </div>

      <div>
        <div style={{ display: "flex", height: ch, marginTop: 4 }}>
          <div style={{ width: 28, flexShrink: 0, position: "relative" }}>
            {durationLabels.map((x, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: `${(1 - i / (rc - 1)) * 100}%`,
                  transform: "translateY(-50%)",
                  fontSize: 9,
                  color: t.axisText,
                }}
              >
                {x.label}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: "grid", gridTemplateColumns: ct, gap: 2, position: "relative", borderLeft: `1px solid ${t.gridLine}` }}>
            {durationLabels.map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${(1 - i / (rc - 1)) * 100}%`,
                  borderTop: `1px solid ${t.gridLine}`,
                }}
              />
            ))}

            {days.map((date, di) => {
              if (!date) {
                return (
                  <div
                    key={di}
                    style={{
                      position: "relative",
                      borderRight: di < 6 ? `1.5px dashed ${t.gridDashLight}` : "none",
                      background: t.emptySlotBg,
                    }}
                  />
                );
              }
              const k = date.toDateString();
              const agg = aggByDate[k] || { resources: [], plannedTotal: 0, actualTotal: 0 };
              return (
                <div
                  key={di}
                  style={{
                    position: "relative",
                    borderRight: di < 6 ? `1.5px dashed ${t.gridDash}` : "none",
                    background: di % 2 === 0 ? "transparent" : t.barStripeBg,
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, padding: "0 2px" }}>
                    <StackedBar
                      entries={buildStack(agg.resources, "plannedHrs", pctFromHrs)}
                      field="plannedHrs"
                      kind="planned"
                      resourceColorMap={resourceColorMap}
                      showHover={showHover}
                      hideHover={hideHover}
                      t={t}
                    />
                    <StackedBar
                      entries={buildStack(agg.resources, "actualHrs", pctFromHrs)}
                      field="actualHrs"
                      kind="actual"
                      resourceColorMap={resourceColorMap}
                      showHover={showHover}
                      hideHover={hideHover}
                      showEarlyLate
                      compareTotal={agg.plannedTotal}
                      t={t}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 4 }}>
          <div style={{ width: 28, flexShrink: 0 }}/>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: ct, gap: 2 }}>
            {days.map((date, di) => (
              <div
                key={di}
                style={{
                  textAlign: "center",
                  fontSize: 9,
                  color: t.textMuted,
                  lineHeight: 1.25,
                  borderRight: di < 6 ? `1.5px dashed ${t.gridDash}` : "none",
                }}
              >
                {date ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 1 }}>
                      <span>P</span>
                      <span>A</span>
                    </div>
                    <div style={{ fontWeight: 600, color: t.dayLabelDate }}>{date.getDate()}</div>
                    <div style={{ fontWeight: 600 }}>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                  </>
                ) : (
                  <>
                    <div style={{ marginTop: 1, height: 14 }}>&nbsp;</div>
                    <div style={{ fontWeight: 600, color: t.dayLabelEmpty }}>&mdash;</div>
                    <div style={{ fontWeight: 600, color: t.dayLabelEmpty }}>{DL[di]}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── WeekTableView — tabular alternative to the bar-chart WeekCards ── */
function WeekTableView({ weeks, aggByDate, resourceColorMap, t, showHover, hideHover }) {
  const allDays = useMemo(() => weeks.flat().filter(Boolean), [weeks]);

  const allResources = useMemo(() => {
    const set = new Set();
    allDays.forEach((d) => {
      const agg = aggByDate[d.toDateString()];
      if (agg) agg.resources.forEach((r) => set.add(r.resourceName));
    });
    return Array.from(set).sort();
  }, [allDays, aggByDate]);

  const lookup = useMemo(() => {
    const m = {};
    allResources.forEach((rn) => { m[rn] = {}; });
    allDays.forEach((d) => {
      const dk = d.toDateString();
      const agg = aggByDate[dk];
      if (!agg) return;
      agg.resources.forEach((r) => { if (m[r.resourceName]) m[r.resourceName][dk] = r; });
    });
    return m;
  }, [allResources, allDays, aggByDate]);

  const todayKey = new Date().toDateString();
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!allDays.length) return <div style={{ padding: 20, textAlign: "center", color: t.emptyText, fontSize: 13 }}>No data for this month.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {weeks.map((weekDays, wi) => {
        const realDays = weekDays.filter(Boolean);
        if (!realDays.length) return null;
        const startLabel = fmtDate(realDays[0]);
        const endLabel = fmtDate(realDays[realDays.length - 1]);

        const weekResourceNames = (() => {
          const set = new Set();
          realDays.forEach((d) => {
            const agg = aggByDate[d.toDateString()];
            if (agg) agg.resources.forEach((r) => set.add(r.resourceName));
          });
          return Array.from(set).sort();
        })();

        const dayTotals = weekDays.map((d) => {
          if (!d) return null;
          const agg = aggByDate[d.toDateString()];
          return agg ? { planned: agg.plannedTotal, actual: agg.actualTotal } : { planned: 0, actual: 0 };
        });

        return (
          <div key={wi}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Week {wi + 1}</h3>
              <span style={{ fontSize: 11, color: t.textMuted }}>{startLabel} &ndash; {endLabel}</span>
            </div>

            <div style={{ overflowX: "auto", border: `1px solid ${t.cardBorder}`, borderRadius: 10, background: t.cardBg }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{
                      position: "sticky", left: 0, zIndex: 2, background: t.occHeaderBg,
                      borderBottom: `1px solid ${t.gridLineMd}`, borderRight: `1px solid ${t.gridLineMd}`,
                      padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: 10,
                      color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", minWidth: 140,
                    }}>
                      Resource
                    </th>

                    {weekDays.map((d, di) => {
                      if (!d) {
                        return (
                          <th key={di} style={{
                            padding: "6px 4px", borderBottom: `1px solid ${t.gridLineMd}`,
                            borderRight: di < 6 ? `1px solid ${t.gridLineMd}` : "none",
                            background: t.occHeaderBg, textAlign: "center", color: t.dayLabelEmpty,
                            fontWeight: 600, minWidth: 72,
                          }}>
                            <div>{DAY_LABELS[di]}</div>
                            <div>&mdash;</div>
                          </th>
                        );
                      }
                      const isToday = d.toDateString() === todayKey;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <th key={di} style={{
                          padding: "6px 4px", borderBottom: `1px solid ${t.gridLineMd}`,
                          borderRight: di < 6 ? `1px solid ${t.gridLineMd}` : "none",
                          background: isToday ? t.occHeaderToday : t.occHeaderBg,
                          textAlign: "center", fontWeight: 700, minWidth: 72,
                        }}>
                          <div style={{ fontSize: 9, color: isToday ? t.todayText : isWeekend ? t.textMuted : t.textSecondary }}>
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div style={{ fontSize: 13, color: isToday ? t.todayText : t.textPrimary, fontWeight: isToday ? 800 : 700 }}>
                            {d.getDate()}
                          </div>
                        </th>
                      );
                    })}

                    <th style={{
                      padding: "6px 8px", borderBottom: `1px solid ${t.gridLineMd}`,
                      background: t.occHeaderBg, textAlign: "center", fontWeight: 700, fontSize: 10,
                      color: t.textSecondary, textTransform: "uppercase", minWidth: 64,
                    }}>
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {weekResourceNames.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 16, textAlign: "center", color: t.emptyText }}>No activity this week</td></tr>
                  ) : weekResourceNames.map((rn, ri) => {
                    const baseColor = resourceColorMap[rn] || resourceBaseColor(ri);
                    let weekPlanned = 0, weekActual = 0;
                    return (
                      <tr key={rn} style={{ background: ri % 2 === 0 ? t.occRowEven : t.occRowOdd }}>
                        <td style={{
                          position: "sticky", left: 0, zIndex: 1,
                          background: ri % 2 === 0 ? t.occRowEven : t.occRowOdd,
                          borderBottom: `1px solid ${t.gridLine}`, borderRight: `1px solid ${t.gridLineMd}`,
                          padding: "6px 10px", fontWeight: 600, color: t.resNameColor, whiteSpace: "nowrap",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: "50%", background: baseColor.actual,
                              color: "#fff", fontSize: 8, fontWeight: 700, display: "flex",
                              alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              {initialsFor(rn)}
                            </div>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }} title={rn}>{rn}</span>
                          </div>
                        </td>

                        {weekDays.map((d, di) => {
                          if (!d) {
                            return <td key={di} style={{
                              borderBottom: `1px solid ${t.gridLine}`,
                              borderRight: di < 6 ? `1px solid ${t.gridLineMd}` : "none",
                              background: t.emptySlotBg,
                            }}/>;
                          }
                          const dk = d.toDateString();
                          const data = lookup[rn] && lookup[rn][dk];
                          const planned = data ? data.plannedHrs : 0;
                          const actual = data ? data.actualHrs : 0;
                          weekPlanned += planned;
                          weekActual += actual;

                          const isToday = dk === todayKey;
                          const hasData = planned > 0 || actual > 0;
                          const diff = actual - planned;
                          const diffColor = !hasData || actual === 0 ? null : diff < -EARLY_LATE_THRESHOLD_HRS ? t.earlyColor : diff > EARLY_LATE_THRESHOLD_HRS ? t.lateColor : null;

                          return (
                            <td
                              key={di}
                              onMouseEnter={(e) => {
                                if (!data) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const side = (window.innerWidth - rect.right) < 300 ? "left" : "right";
                                showHover({ x: side === "left" ? rect.left : rect.right, y: rect.top + rect.height / 2, side, entry: data, kind: "planned" });
                              }}
                              onMouseLeave={hideHover}
                              style={{
                                borderBottom: `1px solid ${t.gridLine}`,
                                borderRight: di < 6 ? `1px solid ${t.gridLineMd}` : "none",
                                padding: "5px 4px", textAlign: "center", verticalAlign: "middle",
                                background: isToday ? t.occCellToday : "transparent",
                                cursor: hasData ? "pointer" : "default",
                              }}
                            >
                              {hasData ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 500 }}>P</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textPrimary, fontVariantNumeric: "tabular-nums" }}>
                                      {fmtDurationCompact(planned)}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 500 }}>A</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: diffColor || t.textPrimary, fontVariantNumeric: "tabular-nums" }}>
                                      {actual > 0 ? fmtDurationCompact(actual) : "\u2014"}
                                    </span>
                                    {diffColor && <span style={{ fontSize: 9, color: diffColor }}>{diff < 0 ? "\u25B2" : "\u25BC"}</span>}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: t.textMuted, fontSize: 10 }}>&mdash;</span>
                              )}
                            </td>
                          );
                        })}

                        <td style={{ borderBottom: `1px solid ${t.gridLine}`, padding: "5px 6px", textAlign: "center", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          <div style={{ fontSize: 10, color: t.textMuted }}>P {fmtDurationCompact(weekPlanned)}</div>
                          <div style={{ fontSize: 10, color: weekActual > 0 ? t.textPrimary : t.textMuted }}>
                            A {weekActual > 0 ? fmtDurationCompact(weekActual) : "\u2014"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── ResourceOccupancyTimeline ── */
const GANTT_CELL_WIDTH = 46;
const GANTT_NAME_WIDTH = 195;
const GANTT_BAR_HEIGHT = 20;

function ResourceOccupancyTimeline({
  days,
  resources,
  occupancyByResourceDate,
  taskOccupancyByResourceDate,
  resourceColorMap,
  capacityHrs = RESOURCE_DAILY_CAPACITY_HRS,
  expandedResources,
  onToggleExpand,
  showHover,
  hideHover,
  filteredRows,
  t,
  isDark,
}) {
  const todayKey = new Date().toDateString();
  const chartWidth = Math.max(days.length, 1) * GANTT_CELL_WIDTH;

  const resourceDailyData = useMemo(() => {
    const m = {};
    resources.forEach((name) => {
      m[name] = {};
      days.forEach((d) => {
        if (!d) return;
        const k = d.toDateString();
        const data = occupancyByResourceDate[k] && occupancyByResourceDate[k][name];
        const th = data ? data.hours : 0;
        const occ = Math.min(th, capacityHrs);
        const fr = Math.max(0, capacityHrs - th);
        const dh = data ? data.delayedHours || 0 : 0;
        m[name][k] = {
          occupied: occ,
          free: fr,
          tasks: data ? data.tasks : [],
          delayedHours: dh,
          hasDelay: dh > 0,
          totalHours: th,
        };
      });
    });
    return m;
  }, [resources, days, occupancyByResourceDate, capacityHrs]);

  function activateDayCell(e, rn, date, data) {
    const rect = e.currentTarget.getBoundingClientRect();
    const side = window.innerWidth - rect.right < 320 ? "left" : "right";
    showHover({
      x: side === "left" ? rect.left : rect.right,
      y: rect.top + rect.height / 2,
      side,
      kind: "occupancy",
      entry: {
        resourceName: rn,
        date,
        hours: data.occupied,
        capacityHrs,
        tasks: data.tasks,
        free: data.free,
        delayedHours: data.delayedHours || 0,
        hasDelay: data.hasDelay || false,
      },
    });
  }

  if (!resources.length || !days.length) {
    return <div style={{ padding: 24, textAlign: "center", color: t.emptyText, fontSize: 13 }}>No resource activity to show for this selection.</div>;
  }

  const firstDay = days.find(Boolean);
  const startOfMonth = firstDay ? new Date(firstDay.getFullYear(), firstDay.getMonth(), 1) : new Date();
  const weekOverlay = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>
          {resources.length} resource{resources.length !== 1 ? "s" : ""} &bull; {" "}
          {days.filter(Boolean).length} day{days.filter(Boolean).length !== 1 ? "s" : ""} &bull; {capacityHrs}h daily capacity
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10,
          background: t.cardBg,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "inline-block", minWidth: "100%" }}>
          {/* Week chips */}
          <div style={{ display: "flex", borderBottom: `1px solid ${t.gridLineMd}`, background: t.occHeaderBg }}>
            <div
              style={{
                width: GANTT_NAME_WIDTH,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 11,
                background: t.occHeaderBg,
                borderRight: `1px solid ${t.gridLineMd}`,
              }}
            />
            <div style={{ display: "flex", width: chartWidth }}>
              {Array.from({ length: Math.ceil(days.length / 7) }).map((_, wi) => {
                const weekDaysCount = Math.min(7, days.length - wi * 7);
                return (
                  <div
                    key={wi}
                    style={{
                      width: weekDaysCount * GANTT_CELL_WIDTH,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "5px 0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: t.textSecondary,
                        background: t.inputBg,
                        border: `1px solid ${t.inputBorder}`,
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      Week {wi + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Header row */}
          <div style={{ display: "flex", borderBottom: `1px solid ${t.gridLineMd}`, background: t.occHeaderBg, paddingBottom: 4 }}>
            <div
              style={{
                width: GANTT_NAME_WIDTH,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: t.occHeaderBg,
                padding: "8px 12px 4px",
                fontSize: 10,
                fontWeight: 700,
                color: t.textSecondary,
                borderRight: `1px solid ${t.gridLineMd}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              RESOURCE
            </div>

            <div style={{ display: "flex", width: chartWidth }}>
              {days.map((d, i) => {
                const isT = d && d.toDateString() === todayKey;
                const wIdx = Math.floor(i / 7);
                const isAltWeek = wIdx % 2 === 1;
                const baseBg = isT ? t.occHeaderToday : t.occHeaderBg;
                const bg = isAltWeek ? `linear-gradient(${weekOverlay}, ${weekOverlay}), ${baseBg}` : baseBg;
                const endOfWeek = (i + 1) % 7 === 0 && i < days.length - 1;

                if (!d) {
                  return (
                    <div
                      key={i}
                      style={{
                        width: GANTT_CELL_WIDTH,
                        flexShrink: 0,
                        textAlign: "center",
                        padding: "4px 1px",
                        borderRight: endOfWeek ? `2px solid ${t.gridLineMd}` : i < days.length - 1 ? `1px solid ${t.gridLineMd}` : "none",
                        background: bg,
                        opacity: 0.5,
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, lineHeight: 1 }}>{DAY_LABELS[i % 7]}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, marginTop: 1 }}>&ndash;</div>
                    </div>
                  );
                }

                const isW = isWeekend(d);
                return (
                  <div
                    key={i}
                    style={{
                      width: GANTT_CELL_WIDTH,
                      flexShrink: 0,
                      textAlign: "center",
                      padding: "4px 1px",
                      borderRight: endOfWeek ? `2px solid ${t.gridLineMd}` : i < days.length - 1 ? `1px solid ${t.gridLineMd}` : "none",
                      background: bg,
                      boxShadow: isT ? `inset 0 0 0 2px ${t.earlyColor}` : "none",
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 600, color: isT ? t.todayText : isW ? t.textMuted : t.textSecondary, lineHeight: 1 }}>
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: isT ? 800 : 700, color: isT ? t.todayText : t.textPrimary, marginTop: 1 }}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resource rows */}
          {resources.map((resourceName, ri) => {
            const baseColor = resourceColorMap[resourceName] || resourceBaseColor(ri);
            const daily = resourceDailyData[resourceName] || {};
            const rowBg = ri % 2 === 0 ? t.occRowEven : t.occRowOdd;

            return (
              <div key={resourceName} style={{ display: "flex", borderBottom: `1px solid ${t.gridLine}`, background: rowBg, alignItems: "center" }}>
                <div
                  style={{
                    width: GANTT_NAME_WIDTH,
                    flexShrink: 0,
                    position: "sticky",
                    left: 0,
                    zIndex: 9,
                    background: rowBg,
                    borderRight: `1px solid ${t.gridLineMd}`,
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: baseColor.actual,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {initialsFor(resourceName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: t.resNameColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.1 }} title={resourceName}>
                      {resourceName}
                    </div>
                  </div>
                </div>

                <div style={{ width: chartWidth, display: "flex", height: 42, alignItems: "center" }}>
                  {days.map((d, di) => {
                    const isT = d && d.toDateString() === todayKey;
                    const wIdx = Math.floor(di / 7);
                    const isAltWeek = wIdx % 2 === 1;
                    const baseBg = isT ? t.occCellToday : d && isWeekend(d) ? t.occCellWeekend : t.occCellBg;
                    const bg = isAltWeek ? `linear-gradient(${weekOverlay}, ${weekOverlay}), ${baseBg}` : baseBg;
                    const endOfWeek = (di + 1) % 7 === 0 && di < days.length - 1;

                    if (!d) {
                      return (
                        <div
                          key={di}
                          style={{
                            width: GANTT_CELL_WIDTH,
                            flexShrink: 0,
                            height: "100%",
                            borderRight: endOfWeek ? `2px solid ${t.gridLineMd}` : di < days.length - 1 ? `1px solid ${t.gridLineMd}` : "none",
                            background: bg,
                            opacity: 0.5,
                          }}
                        />
                      );
                    }

                    const k = d.toDateString();
                    const data = daily[k] || { occupied: 0, free: capacityHrs, tasks: [], delayedHours: 0, hasDelay: false };
                    const occ = data.occupied;
                    const dH = data.delayedHours || 0;
                    const nH = Math.max(0, occ - dH);
                    const oP = clamp((occ / capacityHrs) * 100, 0, 100);
                    const nP = clamp((nH / capacityHrs) * 100, 0, 100);
                    const dP = clamp((dH / capacityHrs) * 100, 0, 100);
                    const isW = isWeekend(d);
                    const hD = data.hasDelay;
                    const occColor = getOccupancyColor(occ);

                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => activateDayCell(e, resourceName, d, data)}
                        onMouseLeave={hideHover}
                        onClick={(e) => { e.stopPropagation(); activateDayCell(e, resourceName, d, data); }}
                        style={{
                          width: GANTT_CELL_WIDTH,
                          flexShrink: 0,
                          height: "100%",
                          borderRight: endOfWeek ? `2px solid ${t.gridLineMd}` : di < days.length - 1 ? `1px solid ${t.gridLineMd}` : "none",
                          background: bg,
                          boxShadow: isT ? `inset 0 0 0 2px ${t.earlyColor}` : "none",
                          padding: "3px 3px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: GANTT_BAR_HEIGHT,
                            background: t.occFreeBar,
                            borderRadius: 6,
                            position: "relative",
                            overflow: "hidden",
                            border: hD ? `1px solid ${t.occAmberBorder}` : `1px solid ${t.occFreeBarBorder}`,
                            boxShadow: hD ? t.occAmberShadow : t.occFreeBarShadow,
                          }}
                        >
                          {nH > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                height: "100%",
                                width: `${nP}%`,
                                background: occColor,
                                borderRadius: 6,
                                transition: "width 0.2s ease",
                              }}
                            />
                          )}
                          {dH > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                left: `${nP}%`,
                                top: 0,
                                height: "100%",
                                width: `${Math.min(dP, 100 - nP)}%`,
                                backgroundColor: occColor,
                                backgroundImage: "repeating-linear-gradient(135deg,rgba(255,255,255,0.35),rgba(255,255,255,0.35) 3px,transparent 3px,transparent 6px)",
                                borderRadius: nH > 0 ? "0 6px 6px 0" : 6,
                                transition: "width 0.2s ease",
                                boxShadow: "inset 0 0 0 1px rgba(217,119,6,0.6)",
                              }}
                            />
                          )}
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              fontSize: 9,
                              fontWeight: 700,
                              color: occ > 0 ? "#fff" : t.occFreeLabel,
                              textShadow: occ > 0 ? "0 1px 2px rgba(0,0,0,0.35)" : "none",
                              whiteSpace: "nowrap",
                              padding: "0 2px",
                              pointerEvents: "none",
                            }}
                          >
                            {fmtDurationCompact(occ > 0 ? occ : data.free)}
                          </div>
                        </div>

                        {hD && (
                          <div style={{ position: "absolute", top: -1, left: 1, fontSize: 7, color: t.occAmberBorder, lineHeight: 1, pointerEvents: "none" }}>
                            {"⚠"}
                          </div>
                        )}

                        {isT && (
                          <div
                            style={{
                              position: "absolute",
                              top: 1,
                              right: 2,
                              width: 4,
                              height: 4,
                              background: t.todayDot,
                              borderRadius: "50%",
                              boxShadow: "0 0 0 1.5px " + t.cardBg,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 11, color: t.legendText, paddingLeft: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 26, height: 10, background: t.occFreeBar, border: `1px solid ${t.occFreeBarBorder}`, borderRadius: 3 }}/>
          Free capacity
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 26, height: 10, background: "linear-gradient(90deg,#22c55e,#84cc16,#eab308,#f97316,#dc2626)", borderRadius: 3 }}/>
          Occupied (load)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 26, height: 10, background: "repeating-linear-gradient(135deg,#fbbf24,#fbbf24 3px,#f59e0b 3px,#f59e0b 6px)", border: "1px solid #d97706", borderRadius: 3 }}/>
          Delayed
        </span>
        <span style={{ color: t.legendMuted, fontSize: 10 }}>
          <span style={{ color: "#d97706" }}>{"⚠"}</span> = delayed &bull; Hover for details
        </span>
      </div>
    </div>
  );
}


function initialsFor(n) {
  if (!n) return "?";
  const p = n.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

function StackedBar({ entries, field, kind, resourceColorMap, showHover, hideHover, showEarlyLate, compareTotal, t }) {
  const total = entries.reduce((s, e) => s + e[field], 0);
  let g = null;
  if (showEarlyLate && total > 0 && compareTotal > 0) {
    const d = total - compareTotal;
    if (Math.abs(d) > EARLY_LATE_THRESHOLD_HRS) g = d < 0 ? "early" : "late";
  }

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        maxWidth: "var(--wt-bar-max-width,20px)",
        height: "100%",
        border: g ? `1.5px solid ${g === "early" ? t.earlyColor : t.lateColor}` : `1px solid ${t.barBorder}`,
        borderRadius: 6,
        background: t.barBg,
        overflow: "visible",
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 5, overflow: "hidden" }}>
        {entries.map((entry) => {
          const c = resourceColorMap[entry.resourceName] || resourceBaseColor(0);
          const bg = kind === "planned" ? c.planned : c.actual;
          const lp = kind === "actual" && entry.hasRunning;
          const act = (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const s = (window.innerWidth - r.right) < 300 ? "left" : "right";
            showHover({ x: s === "left" ? r.left : r.right, y: r.top + r.height / 2, side: s, entry, kind });
          };
          return (
            <div
              key={entry.resourceName}
              onMouseEnter={act}
              onMouseLeave={hideHover}
              onClick={(e) => { e.stopPropagation(); act(e); }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${entry.topPct}%`,
                height: `${entry.heightPct}%`,
                background: bg,
                borderTop: "1px solid rgba(255,255,255,0.6)",
                cursor: "pointer",
                animation: lp ? "beepPulseRunning 2.8s ease-in-out infinite" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {entry.heightPct >= 3.5 && (
                <span
                  style={{
                    fontSize: "clamp(6px,1.6vw,8px)",
                    lineHeight: 1,
                    fontWeight: 700,
                    color: t.barLabelColor,
                    textShadow: t.barLabelShadow,
                    whiteSpace: "nowrap",
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {fmtDurationCompact(entry[field])}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showEarlyLate && total > 0 && compareTotal > 0 && (() => {
        const d = total - compareTotal;
        if (Math.abs(d) <= EARLY_LATE_THRESHOLD_HRS) return null;
        const e = d < 0;
        return (
          <Tooltip title={e ? "Under planned hours" : "Over planned hours"} arrow>
            <div style={{ position: "absolute", left: "50%", top: 0, transform: "translate(-50%,-140%)", fontSize: 12, fontWeight: 700, color: e ? t.earlyColor : t.lateColor, cursor: "pointer" }}>
              {e ? "\u25B2" : "\u25BC"}
            </div>
          </Tooltip>
        );
      })()}
    </div>
  );
}

function ProjectActivityPieChart({ project, rows }) {
  const activities = useMemo(() => {
    const agg = aggregateActivities(rows);
    const tp = agg.reduce((s, a) => s + a.plannedHrs, 0) || 1;
    let c = 0;
    return agg
      .sort((a, b) => b.plannedHrs - a.plannedHrs)
      .map((a, i) => {
        const w = (a.plannedHrs / tp) * 100;
        const ch = a.finished ? a.plannedHrs : clamp(a.actualHrs, 0, a.plannedHrs);
        const ph = Math.max(a.plannedHrs - ch, 0);
        const cw = (ch / tp) * 100;
        const s = c;
        const ce = s + cw;
        const e = s + w;
        c = e;
        return {
          ...a,
          weightPct: w,
          completedHrs: ch,
          pendingHrs: ph,
          start: s,
          completedEnd: ce,
          end: e,
          progressPct: activityProgressPct(a),
          color: activityColor(i),
          pendingColor: activityColorPending(i),
        };
      });
  }, [rows]);

  const op = useMemo(() => {
    const tp = activities.reduce((s, a) => s + a.plannedHrs, 0);
    if (!tp) return 0;
    return Math.round(activities.reduce((s, a) => s + a.progressPct * a.plannedHrs, 0) / tp);
  }, [activities]);

  if (!activities.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: "#334155", marginBottom: 6 }}>{project}</div>
        No activity to summarize.
      </div>
    );
  }

  const gs = activities
    .flatMap((a) => [`${a.color} ${a.start}% ${a.completedEnd}%`, `${a.pendingColor} ${a.completedEnd}% ${a.end}%`])
    .join(", ");

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project}>
        {project}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
        <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `conic-gradient(${gs})` }}/>
          <div style={{
            position: "absolute", inset: 22, borderRadius: "50%", background: "#fff",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 0 0 1px #f1f5f9",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{op}%</div>
            <div style={{ fontSize: 9, color: "#94a3b8" }}>progress</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 160, maxHeight: 130, overflowY: "auto", paddingRight: 4 }}>
          {activities.map((a) => (
            <div key={a.activity} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0 }}/>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.activity}>{a.activity}</span>
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 10.5, fontWeight: 600, fontVariantNumeric: "tabular-nums", paddingLeft: 17 }}>
                <span style={{ color: "#059669" }}>Completed {fmtDurationCompact(a.completedHrs)}</span>
                <span style={{ color: a.pendingHrs > 0 ? "#d97706" : "#94a3b8" }}>Pending {fmtDurationCompact(a.pendingHrs)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
