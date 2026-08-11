import React, { useMemo, useState } from "react";

const CELL = 46;
const NAME = 195;
const MONTH_USAGE = 96;
const TASK_COMPLETION = 112;
const LEFT_WIDTH = NAME + MONTH_USAGE + TASK_COMPLETION;
const BAR_HEIGHT = 20;
const WEEK_HEADER_HEIGHT = 38;
const DAY_HEADER_HEIGHT = 46;
const SCROLL_MAX_HEIGHT = 520;
const DEFAULT_CAPACITY = 8;

const defaultTheme = {
  emptyText: "#64748b", textPrimary: "#1e293b", textSecondary: "#64748b", textMuted: "#94a3b8",
  cardBg: "#ffffff", cardBorder: "#e2e8f0", occHeaderBg: "#f8fafc", occHeaderToday: "#eff6ff",
  gridLine: "#f1f5f9", gridLineMd: "#e2e8f0", btnPrimary: "#2563eb", todayText: "#2563eb",
  todayDot: "#3b82f6", earlyColor: "#3b82f6", occRowEven: "#ffffff", occRowOdd: "#f8fafc",
  resNameColor: "#1e293b", occCellToday: "#f0fdf4", occCellWeekend: "#f8fafc", occCellBg: "#ffffff",
  occFreeBar: "#f1f5f9", occFreeBarBorder: "#cbd5e1", occFreeBarShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
  occFreeLabel: "#64748b", legendText: "#64748b",
};

const initialsFor = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
const duration = (hours) => {
  if (hours == null) return "";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const rounded = Math.round(hours * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
};
const occupancyColor = (hours) => hours < 4 ? "#22c55e" : hours < 5 ? "#84cc16" : hours < 6 ? "#eab308" : hours < 6.75 ? "#f97316" : hours < 7.75 ? "#ea580c" : "#dc2626";
const percentageText = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "—";
const percentageColor = (value, fallback) => !Number.isFinite(Number(value)) ? fallback : Number(value) < 50 ? "#16a34a" : Number(value) < 75 ? "#ca8a04" : Number(value) < 90 ? "#ea580c" : "#dc2626";

/**
 * resourceMetrics accepts either a flat metric list or the monthly API response:
 * [{ month: "August", year: 2026, resourceMetrics: [{ resourceName, resourceId, resourceMonthPercentage, taskCompletionPercentage }] }]
 */
function ResourceOccupancyTimeline({
  weeks = [], resources = [], occupancyByResourceDate = {}, taskOccupancyByResourceDate = {},
  resourceColorMap = {}, capacityHrs = DEFAULT_CAPACITY, expandedResources, onToggleExpand,
  showHover = () => {}, hideHover = () => {}, filteredRows, resourceMetrics = [], t: customTheme = {}, isDark = false,
}) {
  const t = useMemo(() => ({ ...defaultTheme, ...customTheme }), [customTheme]);
  const [hoveredKey, setHoveredKey] = useState(null);
  const todayKey = new Date().toDateString();

  const { days, weekBoundaries } = useMemo(() => {
    const flat = []; const boundaries = []; let total = 0;
    weeks.forEach((week) => { const validDays = (week || []).filter(Boolean); flat.push(...validDays); total += validDays.length; if (validDays.length) boundaries.push(total); });
    return { days: flat, weekBoundaries: boundaries };
  }, [weeks]);

  const currentTimelineMonth = useMemo(() => {
    const date = days.find(Boolean);
    return date ? { month: date.toLocaleDateString("en-US", { month: "long" }), year: date.getFullYear() } : null;
  }, [days]);

  const currentMonthMetrics = useMemo(() => {
    if (!Array.isArray(resourceMetrics)) return [];
    const flatMetrics = resourceMetrics.some((item) => item?.resourceName || item?.resourceId || item?.resourceMonthPercentage !== undefined);
    if (flatMetrics) return resourceMetrics;
    const selected = resourceMetrics.find((item) => item?.month === currentTimelineMonth?.month && Number(item?.year) === Number(currentTimelineMonth?.year));
    return selected?.resourceMetrics || [];
  }, [resourceMetrics, currentTimelineMonth]);

  const metricsByName = useMemo(() => currentMonthMetrics.reduce((result, metric) => {
    if (metric?.resourceName) result[metric.resourceName.trim().toLowerCase()] = metric;
    return result;
  }, {}), [currentMonthMetrics]);

  const weekIndexForDay = (index) => {
    for (let i = 0; i < weekBoundaries.length; i += 1) if (index < weekBoundaries[i]) return i;
    return Math.max(weekBoundaries.length - 1, 0);
  };
  const chartWidth = Math.max(days.length, 1) * CELL;
  const weekOverlay = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  const resourceData = useMemo(() => resources.reduce((result, name) => {
    result[name] = {};
    days.forEach((date) => {
      const key = date.toDateString(); const source = occupancyByResourceDate?.[key]?.[name]; const total = source?.hours || 0;
      result[name][key] = { occupied: Math.min(total, capacityHrs), free: Math.max(0, capacityHrs - total), tasks: source?.tasks || [] };
    });
    return result;
  }, {}), [resources, days, occupancyByResourceDate, capacityHrs]);

  const activate = (event, resourceName, date, data, key) => {
    setHoveredKey(key);
    const rect = event.currentTarget.getBoundingClientRect(); const side = window.innerWidth - rect.right < 320 ? "left" : "right";
    showHover({ x: side === "left" ? rect.left : rect.right, y: rect.top + rect.height / 2, side, kind: "occupancy", entry: { resourceName, date, hours: data.occupied, capacityHrs, tasks: data.tasks, free: data.free } });
  };
  const clearHover = () => { setHoveredKey(null); hideHover(); };
  const headerStyle = { fontSize: 10, fontWeight: 700, color: t.textSecondary, textTransform: "uppercase", textAlign: "center", lineHeight: 1.15, boxSizing: "border-box" };

  if (!resources.length || !days.length) return <div style={{ padding: 24, textAlign: "center", color: t.emptyText, fontSize: 13 }}>No resource activity to show for this selection.</div>;

  return <div>
    <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500, marginBottom: 8 }}>{resources.length} resource{resources.length !== 1 ? "s" : ""} • {days.length} day{days.length !== 1 ? "s" : ""} • {capacityHrs}h daily capacity</div>
    <div style={{ border: `1px solid ${t.cardBorder}`, borderRadius: 10, background: t.cardBg, overflow: "auto", maxHeight: SCROLL_MAX_HEIGHT, position: "relative" }}>
      <div style={{ width: LEFT_WIDTH + chartWidth, minWidth: "100%", position: "relative" }}>
        <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 30, background: t.occHeaderBg, borderBottom: `1px solid ${t.gridLineMd}` }}>
          <div style={{ width: LEFT_WIDTH, height: WEEK_HEADER_HEIGHT, flexShrink: 0, position: "sticky", left: 0, zIndex: 35, background: t.occHeaderBg, borderRight: `1px solid ${t.gridLineMd}` }} />
          <div style={{ display: "flex", width: chartWidth, minHeight: WEEK_HEADER_HEIGHT }}>{weekBoundaries.map((end, index) => { const start = index ? weekBoundaries[index - 1] : 0; const count = end - start; return count > 0 && <div key={index} style={{ width: count * CELL, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 8, fontWeight: 700, color: t.btnPrimary, background: `${t.btnPrimary}1A`, border: `1px solid ${t.btnPrimary}40`, borderRadius: 999, padding: "3px 7px" }}>Week {index + 1}</span></div>; })}</div>
        </div>
        <div style={{ display: "flex", position: "sticky", top: WEEK_HEADER_HEIGHT, zIndex: 29, background: t.occHeaderBg, borderBottom: `1px solid ${t.gridLineMd}`, paddingBottom: 4 }}>
          <div style={{ width: LEFT_WIDTH, minHeight: DAY_HEADER_HEIGHT, display: "flex", flexShrink: 0, position: "sticky", left: 0, zIndex: 34, background: t.occHeaderBg, borderRight: `1px solid ${t.gridLineMd}` }}>
            <div style={{ ...headerStyle, width: NAME, textAlign: "left", padding: "8px 12px 4px" }}>Resource</div><div style={{ ...headerStyle, width: MONTH_USAGE, borderLeft: `1px solid ${t.gridLineMd}`, display: "grid", placeItems: "center" }}>Monthly<br />Progress</div><div style={{ ...headerStyle, width: TASK_COMPLETION, borderLeft: `1px solid ${t.gridLineMd}`, display: "grid", placeItems: "center" }}>Task<br />Completion</div>
          </div>
          <div style={{ display: "flex", width: chartWidth }}>{days.map((date, index) => { const today = date.toDateString() === todayKey; const week = weekIndexForDay(index); const last = weekBoundaries[week] - 1 === index && index < days.length - 1; const base = today ? t.occHeaderToday : t.occHeaderBg; const bg = week % 2 ? `linear-gradient(${weekOverlay},${weekOverlay}),${base}` : base; return <div key={`${date.toDateString()}-${index}`} style={{ width: CELL, flexShrink: 0, textAlign: "center", padding: "4px 1px", borderRight: last ? `2px solid ${t.cardBorder}` : index < days.length - 1 ? `1px solid ${t.gridLineMd}` : "none", background: bg }}><div style={{ fontSize: 9, fontWeight: 600, color: today ? t.todayText : isWeekend(date) ? t.textMuted : t.textSecondary }}>{date.toLocaleDateString("en-US", { weekday: "short" })}</div><div style={{ fontSize: 13, fontWeight: today ? 800 : 700, color: today ? t.todayText : t.textPrimary }}>{date.getDate()}</div></div>; })}</div>
        </div>
        {resources.map((name, resourceIndex) => { const rowBg = resourceIndex % 2 ? t.occRowOdd : t.occRowEven; const metric = metricsByName[name.trim().toLowerCase()] || null; const daily = resourceData[name] || {}; return <div key={name} style={{ display: "flex", alignItems: "center", background: rowBg, borderBottom: `1px solid ${t.gridLine}` }}>
          <div style={{ width: LEFT_WIDTH, height: 42, display: "flex", flexShrink: 0, position: "sticky", left: 0, zIndex: 10, background: rowBg, borderRight: `1px solid ${t.gridLineMd}` }}>
            <div style={{ width: NAME, boxSizing: "border-box", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: resourceColorMap[name]?.actual || "#64748b", color: "#fff", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700 }}>{initialsFor(name)}</div><div title={name} style={{ fontSize: 12.5, fontWeight: 600, color: t.resNameColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div></div>
            <div title={`Month Progress: ${percentageText(metric?.resourceMonthPercentage)}`} style={{ width: MONTH_USAGE, display: "grid", placeItems: "center", borderLeft: `1px solid ${t.gridLineMd}`, color: percentageColor(metric?.resourceMonthPercentage, t.textMuted), fontSize: 12, fontWeight: 700 }}>{percentageText(metric?.resourceMonthPercentage)}</div>
            <div title={`Task Completion: ${percentageText(metric?.taskCompletionPercentage)}`} style={{ width: TASK_COMPLETION, display: "grid", placeItems: "center", borderLeft: `1px solid ${t.gridLineMd}`, color: percentageColor(metric?.taskCompletionPercentage, t.textMuted), fontSize: 12, fontWeight: 700 }}>{percentageText(metric?.taskCompletionPercentage)}</div>
          </div>
          <div style={{ width: chartWidth, display: "flex", height: 42 }}>{days.map((date, index) => { const dateKey = date.toDateString(); const data = daily[dateKey] || { occupied: 0, free: capacityHrs, tasks: [] }; const key = `${name}-${dateKey}`; const hover = hoveredKey === key; const today = dateKey === todayKey; const week = weekIndexForDay(index); const last = weekBoundaries[week] - 1 === index && index < days.length - 1; const base = today ? t.occCellToday : isWeekend(date) ? t.occCellWeekend : t.occCellBg; const bg = week % 2 ? `linear-gradient(${weekOverlay},${weekOverlay}),${base}` : base; const fill = Math.min(data.occupied / capacityHrs * 100, 100); return <div key={index} onMouseEnter={(event) => activate(event, name, date, data, key)} onMouseLeave={clearHover} onClick={(event) => { event.stopPropagation(); activate(event, name, date, data, key); }} style={{ width: CELL, flexShrink: 0, padding: 3, display: "flex", alignItems: "center", borderRight: last ? `2px solid ${t.cardBorder}` : index < days.length - 1 ? `1px solid ${t.gridLineMd}` : "none", background: hover ? (isDark ? "rgba(59,130,246,.2)" : "#e0f2fe") : bg, cursor: "pointer" }}><div style={{ width: "100%", height: BAR_HEIGHT, background: t.occFreeBar, border: hover ? `1.5px solid ${t.btnPrimary}` : `1px solid ${t.occFreeBarBorder}`, borderRadius: 6, position: "relative", overflow: "hidden", boxShadow: t.occFreeBarShadow }}><div style={{ position: "absolute", inset: "0 auto 0 0", width: `${fill}%`, background: occupancyColor(data.occupied) }} /><div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, color: data.occupied ? "#1e293b" : t.occFreeLabel }}>{duration(data.occupied || data.free)}</div></div></div>; })}</div>
        </div>; })}
      </div>
    </div>
    <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 11, color: t.legendText }}><span style={{ display: "flex", alignItems: "center", gap: 5 }}><i style={{ width: 26, height: 10, background: t.occFreeBar, border: `1px solid ${t.occFreeBarBorder}`, borderRadius: 3 }} />Free capacity</span><span style={{ display: "flex", alignItems: "center", gap: 5 }}><i style={{ width: 26, height: 10, background: "linear-gradient(90deg,#22c55e,#84cc16,#eab308,#f97316,#dc2626)", borderRadius: 3 }} />Occupied (load)</span></div>
  </div>;
}

export default ResourceOccupancyTimeline;
