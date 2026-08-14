import React, { useEffect, useMemo, useState } from "react";

const CELL = 46;
const NAME = 195;
const MONTH_PROGRESS = 96;
const TASK_COMPLETION = 150;
const LEFT_WIDTH = NAME + MONTH_PROGRESS + TASK_COMPLETION;
const BAR_HEIGHT = 20;
const WEEK_HEADER_HEIGHT = 38;
const DAY_HEADER_HEIGHT = 46;
const SCROLL_MAX_HEIGHT = 520;
const DEFAULT_CAPACITY = 8;

const defaultTheme = {
  emptyText: "#64748b",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  cardBg: "#ffffff",
  cardBorder: "#e2e8f0",
  occHeaderBg: "#f8fafc",
  occHeaderToday: "#eff6ff",
  gridLine: "#f1f5f9",
  gridLineMd: "#e2e8f0",
  btnPrimary: "#2563eb",
  todayText: "#2563eb",
  todayDot: "#3b82f6",
  earlyColor: "#3b82f6",
  occRowEven: "#ffffff",
  occRowOdd: "#f8fafc",
  resNameColor: "#1e293b",
  occCellToday: "#f0fdf4",
  occCellWeekend: "#f8fafc",
  occCellBg: "#ffffff",
  occFreeBar: "#f1f5f9",
  occFreeBarBorder: "#cbd5e1",
  occFreeBarShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
  occFreeLabel: "#64748b",
  legendText: "#64748b",
};

const initialsFor = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
const localDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const duration = (hours) => {
  if (hours == null) return "";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const rounded = Math.round(hours * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
};
const occupancyColor = (hours) =>
  hours < 4
    ? "#22c55e"
    : hours < 5
      ? "#84cc16"
      : hours < 6
        ? "#eab308"
        : hours < 6.75
          ? "#f97316"
          : hours < 7.75
            ? "#ea580c"
            : "#dc2626";
const percentageText = (value) =>
  Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "—";
const percentageColor = (value, fallback) =>
  !Number.isFinite(Number(value))
    ? fallback
    : Number(value) < 50
      ? "#16a34a"
      : Number(value) < 75
        ? "#ca8a04"
        : Number(value) < 90
          ? "#ea580c"
          : "#dc2626";
const completionPercentage = (completed, assigned) => {
  const completedNumber = Number(completed);
  const assignedNumber = Number(assigned);
  if (!Number.isFinite(completedNumber) || !Number.isFinite(assignedNumber) || assignedNumber <= 0)
    return null;
  return Math.round((completedNumber / assignedNumber) * 100);
};

/**
 * One timeline for allocated and unallocated people.
 * Allocated rows use occupancy/metric data. Unallocated rows display 8h free and — for both metrics.
 */
function ResourceOccupancyTimeline({
  weeks = [],
  resources = [],
  unallocatedUsers: suppliedUnallocatedUsers = null,
  getUnallocatedResources,
  occupancyByResourceDate = {},
  taskOccupancyByResourceDate = {},
  resourceColorMap = {},
  capacityHrs = DEFAULT_CAPACITY,
  expandedResources,
  onToggleExpand,
  showHover = () => {},
  hideHover = () => {},
  filteredRows,
  resourceMetrics = [],
  t: customTheme = {},
  isDark = false,
}) {
  const t = useMemo(() => ({ ...defaultTheme, ...customTheme }), [customTheme]);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [loadedUnallocatedUsers, setLoadedUnallocatedUsers] = useState([]);
  const [loadingUnallocated, setLoadingUnallocated] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const todayKey = new Date().toDateString();

  useEffect(() => {
    if (suppliedUnallocatedUsers !== null || typeof getUnallocatedResources !== "function")
      return undefined;
    let mounted = true;
    async function loadUnallocatedUsers() {
      setLoadingUnallocated(true);
      try {
        const response = await getUnallocatedResources();
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.users)
              ? response.users
              : [];
        if (mounted) setLoadedUnallocatedUsers(list);
      } catch (error) {
        console.warn("Could not load unallocated resources", error);
        if (mounted) setLoadedUnallocatedUsers([]);
      } finally {
        if (mounted) setLoadingUnallocated(false);
      }
    }
    loadUnallocatedUsers();
    return () => {
      mounted = false;
    };
  }, [getUnallocatedResources, suppliedUnallocatedUsers]);

  const unallocatedUsers = suppliedUnallocatedUsers ?? loadedUnallocatedUsers;
  const { days, weekBoundaries } = useMemo(() => {
    const flat = [];
    const boundaries = [];
    let total = 0;
    weeks.forEach((week) => {
      const validDays = (week || []).filter(Boolean);
      flat.push(...validDays);
      total += validDays.length;
      if (validDays.length) boundaries.push(total);
    });
    return { days: flat, weekBoundaries: boundaries };
  }, [weeks]);

  const currentTimelineMonth = useMemo(() => {
    const date = days.find(Boolean);
    return date
      ? { month: date.toLocaleDateString("en-US", { month: "long" }), year: date.getFullYear() }
      : null;
  }, [days]);

  const currentMonthMetrics = useMemo(() => {
    if (!Array.isArray(resourceMetrics)) return [];
    const flat = resourceMetrics.some(
      (item) =>
        item?.resourceName || item?.resourceId || item?.resourceMonthUtilization !== undefined,
    );
    if (flat) return resourceMetrics;
    return (
      resourceMetrics.find(
        (item) =>
          item?.month === currentTimelineMonth?.month &&
          (item?.year == null || Number(item.year) === Number(currentTimelineMonth?.year)),
      )?.resourceMetrics || []
    );
  }, [resourceMetrics, currentTimelineMonth]);

  const metricsByName = useMemo(
    () =>
      currentMonthMetrics.reduce((result, metric) => {
        if (metric?.resourceName) result[metric.resourceName.trim().toLowerCase()] = metric;
        return result;
      }, {}),
    [currentMonthMetrics],
  );

  const timelineRows = useMemo(() => {
    const allocated = resources.map((name) => ({
      id: `allocated-${name}`,
      name,
      isUnallocated: false,
    }));
    const unallocated = (unallocatedUsers || []).map((user, index) => {
      const name = user.UserName || user.userName || user.name || `User ${index + 1}`;
      const userId =
        user.UserId || user.userId || user.id || user.email || user.emailId || `${name}-${index}`;
      return { id: `unallocated-${userId}`, name, userId, isUnallocated: true };
    });
    return [...allocated, ...unallocated];
  }, [resources, unallocatedUsers]);

  // Resource and Monthly Utilization each cycle: ascending → descending → original (no sort).
  const toggleSort = (key) => {
    setSortConfig((current) => {
      if (current.key !== key || !current.direction) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key || !sortConfig.direction) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const sortedTimelineRows = useMemo(() => {
    // No sort: preserve the incoming/original order, allocated rows followed by unallocated rows.
    if (!sortConfig.key || !sortConfig.direction) return timelineRows;

    return [...timelineRows].sort((a, b) => {
      if (sortConfig.key === "name") {
        const comparison = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      // Monthly Utilization sort: use the resourceMonthPercentage numeric value.
      // Unallocated rows show —, and participate in this numerical sort as 0.
      const aMetric = metricsByName[a.name.trim().toLowerCase()] || {};
      const bMetric = metricsByName[b.name.trim().toLowerCase()] || {};
      const aRaw = a.isUnallocated ? 0 : Number(aMetric.resourceMonthUtilization);
      const bRaw = b.isUnallocated ? 0 : Number(bMetric.resourceMonthUtilization);
      const aValue = Number.isFinite(aRaw) ? aRaw : 0;
      const bValue = Number.isFinite(bRaw) ? bRaw : 0;
      const comparison = aValue - bValue;

      // Alphabetical tie-breaker for equal percentages.
      if (comparison === 0) return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [timelineRows, metricsByName, sortConfig]);

  const resourceData = useMemo(
    () =>
      resources.reduce((result, name) => {
        result[name] = {};
        days.forEach((date) => {
          const key = date.toDateString();
          const source = occupancyByResourceDate?.[key]?.[name];
          const total = source?.hours || 0;
          result[name][key] = {
            occupied: Math.min(total, capacityHrs),
            free: Math.max(0, capacityHrs - total),
            tasks: source?.tasks || [],
          };
        });
        return result;
      }, {}),
    [resources, days, occupancyByResourceDate, capacityHrs],
  );

  const weekIndexForDay = (index) => {
    for (let i = 0; i < weekBoundaries.length; i += 1) if (index < weekBoundaries[i]) return i;
    return Math.max(weekBoundaries.length - 1, 0);
  };
  const chartWidth = Math.max(days.length, 1) * CELL;
  const weekOverlay = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const chipBg = isDark ? "rgba(239,68,68,0.18)" : "#fef2f2";
  const chipBorder = isDark ? "rgba(239,68,68,0.45)" : "#fecaca";
  const chipText = isDark ? "#fca5a5" : "#b91c1c";
  const chipDot = isDark ? "#f87171" : "#ef4444";

  const activate = (event, row, date, data, key) => {
    setHoveredKey(key);
    const rect = event.currentTarget.getBoundingClientRect();
    const side = window.innerWidth - rect.right < 320 ? "left" : "right";
    showHover({
      x: side === "left" ? rect.left : rect.right,
      y: rect.top + rect.height / 2,
      side,
      kind: "occupancy",
      entry: {
        resourceName: row.name,
        userId: row.userId,
        date,
        hours: data.occupied,
        capacityHrs,
        tasks: data.tasks,
        free: data.free,
        isUnallocated: row.isUnallocated,
      },
    });
  };
  const clearHover = () => {
    setHoveredKey(null);
    hideHover();
  };
  const headerStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: t.textSecondary,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1.15,
    boxSizing: "border-box",
  };

  if (!timelineRows.length || !days.length)
    return (
      <div style={{ padding: 24, textAlign: "center", color: t.emptyText, fontSize: 13 }}>
        {loadingUnallocated
          ? "Loading resources..."
          : "No resource activity to show for this selection."}
      </div>
    );

  return (
    <div>
      <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500, marginBottom: 8 }}>
        {timelineRows.length} resource{timelineRows.length !== 1 ? "s" : ""} • {days.length} day
        {days.length !== 1 ? "s" : ""} • {capacityHrs}h daily capacity
      </div>
      <div
        style={{
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10,
          background: t.cardBg,
          overflow: "auto",
          maxHeight: SCROLL_MAX_HEIGHT,
          position: "relative",
        }}
      >
        <div style={{ width: LEFT_WIDTH + chartWidth, minWidth: "100%", position: "relative" }}>
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: 0,
              zIndex: 30,
              background: t.occHeaderBg,
              borderBottom: `1px solid ${t.gridLineMd}`,
            }}
          >
            <div
              style={{
                width: LEFT_WIDTH,
                height: WEEK_HEADER_HEIGHT,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 35,
                background: t.occHeaderBg,
                borderRight: `1px solid ${t.gridLineMd}`,
              }}
            />
            <div style={{ display: "flex", width: chartWidth, minHeight: WEEK_HEADER_HEIGHT }}>
              {weekBoundaries.map((end, index) => {
                const start = index ? weekBoundaries[index - 1] : 0;
                const count = end - start;
                return (
                  count > 0 && (
                    <div
                      key={index}
                      style={{
                        width: count * CELL,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: t.btnPrimary,
                          background: `${t.btnPrimary}1A`,
                          border: `1px solid ${t.btnPrimary}40`,
                          borderRadius: 999,
                          padding: "3px 7px",
                        }}
                      >
                        Week {index + 1}
                      </span>
                    </div>
                  )
                );
              })}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: WEEK_HEADER_HEIGHT,
              zIndex: 29,
              background: t.occHeaderBg,
              borderBottom: `1px solid ${t.gridLineMd}`,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                width: LEFT_WIDTH,
                minHeight: DAY_HEADER_HEIGHT,
                display: "flex",
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 34,
                background: t.occHeaderBg,
                borderRight: `1px solid ${t.gridLineMd}`,
              }}
            >
              <button
                type="button"
                onClick={() => toggleSort("name")}
                title="Sort resource name"
                style={{
                  ...headerStyle,
                  width: NAME,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: "8px 12px 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Resource</span>
                <span
                  style={{
                    color: sortConfig.key === "name" ? t.btnPrimary : t.textMuted,
                    fontSize: 10,
                  }}
                >
                  {sortIndicator("name")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleSort("monthlyUtilization")}
                title="Sort by monthly utilization percentage"
                style={{
                  ...headerStyle,
                  width: MONTH_PROGRESS,
                  border: "none",
                  borderLeft: `1px solid ${t.gridLineMd}`,
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span>
                  Monthly
                  <br />
                  Utilization
                </span>
                <span
                  style={{
                    color: sortConfig.key === "monthlyUtilization" ? t.btnPrimary : t.textMuted,
                    fontSize: 9,
                  }}
                >
                  {sortIndicator("monthlyUtilization")}
                </span>
              </button>
              <div
                style={{
                  ...headerStyle,
                  width: TASK_COMPLETION,
                  borderLeft: `1px solid ${t.gridLineMd}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                Task
                <br />
                Completion
              </div>
            </div>
            <div style={{ display: "flex", width: chartWidth }}>
              {days.map((date, index) => {
                const today = date.toDateString() === todayKey;
                const week = weekIndexForDay(index);
                const last = weekBoundaries[week] - 1 === index && index < days.length - 1;
                const base = today ? t.occHeaderToday : t.occHeaderBg;
                const bg =
                  week % 2 ? `linear-gradient(${weekOverlay},${weekOverlay}),${base}` : base;
                return (
                  <div
                    key={`${date.toDateString()}-${index}`}
                    style={{
                      width: CELL,
                      flexShrink: 0,
                      textAlign: "center",
                      padding: "4px 1px",
                      borderRight: last
                        ? `2px solid ${t.cardBorder}`
                        : index < days.length - 1
                          ? `1px solid ${t.gridLineMd}`
                          : "none",
                      background: bg,
                      boxShadow: today
                        ? `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}, inset 0 2px 0 ${t.earlyColor}`
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: today
                          ? t.todayText
                          : isWeekend(date)
                            ? t.textMuted
                            : t.textSecondary,
                      }}
                    >
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: today ? 800 : 700,
                        color: today ? t.todayText : t.textPrimary,
                      }}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {sortedTimelineRows.map((row, index) => {
            const rowBg = index % 2 ? t.occRowOdd : t.occRowEven;
            const metric = row.isUnallocated
              ? null
              : metricsByName[row.name.trim().toLowerCase()] || null;
            const daily = row.isUnallocated ? {} : resourceData[row.name] || {};
            return (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: rowBg,
                  borderBottom: `1px solid ${t.gridLine}`,
                }}
              >
                <div
                  style={{
                    width: LEFT_WIDTH,
                    height: 42,
                    display: "flex",
                    flexShrink: 0,
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                    background: rowBg,
                    borderRight: `1px solid ${t.gridLineMd}`,
                  }}
                >
                  <div
                    style={{
                      width: NAME,
                      boxSizing: "border-box",
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
                        background: row.isUnallocated
                          ? "#94a3b8"
                          : resourceColorMap[row.name]?.actual || "#64748b",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {initialsFor(row.name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        title={row.name}
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: t.resNameColor,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.name}
                      </div>
                      {row.isUnallocated && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            marginTop: 3,
                            padding: "1.5px 6px",
                            borderRadius: 999,
                            fontSize: 9,
                            fontWeight: 700,
                            color: chipText,
                            background: chipBg,
                            border: `1px solid ${chipBorder}`,
                          }}
                        >
                          <i
                            style={{
                              width: 4.5,
                              height: 4.5,
                              borderRadius: "50%",
                              background: chipDot,
                            }}
                          />
                          Unallocated
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    title={
                      row.isUnallocated
                        ? "Monthly Utilization is unavailable for unallocated resources"
                        : `Monthly Utilization: ${percentageText(metric?.resourceMonthUtilization)}`
                    }
                    style={{
                      width: MONTH_PROGRESS,
                      display: "grid",
                      placeItems: "center",
                      borderLeft: `1px solid ${t.gridLineMd}`,
                      color: row.isUnallocated
                        ? t.textMuted
                        : percentageColor(metric?.resourceMonthUtilization, t.textMuted),
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {row.isUnallocated ? "—" : percentageText(metric?.resourceMonthUtilization)}
                  </div>
                  <div
                    title={
                      row.isUnallocated
                        ? "Task completion is unavailable for unallocated resources"
                        : `On time: ${metric?.onTimeTasks ?? 0} | Delayed: ${metric?.DelayedTasks ?? 0} | Completed: ${metric?.totalCompletedTasks ?? 0}/${metric?.totalAssignedTasks ?? 0} (${completionPercentage(metric?.totalCompletedTasks, metric?.totalAssignedTasks) ?? "—"}%)`
                    }
                    style={{
                      width: TASK_COMPLETION,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      borderLeft: `1px solid ${t.gridLineMd}`,
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {row.isUnallocated ? (
                      <span style={{ color: t.textMuted, fontSize: 12 }}>—</span>
                    ) : (
                      <>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                            fontSize: 9,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                              color: "#15803d",
                            }}
                          >
                            <span style={{ fontSize: 11 }}>✓</span>On time{" "}
                            {metric?.onTimeTasks ?? 0}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                              color: "#c2410c",
                            }}
                          >
                            <span style={{ fontSize: 11 }}>◷</span>Delayed{" "}
                            {metric?.DelayedTasks ?? 0}
                          </span>
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            color:
                              completionPercentage(
                                metric?.totalCompletedTasks,
                                metric?.totalAssignedTasks,
                              ) == null
                                ? t.textMuted
                                : t.textPrimary,
                            fontSize: 9,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            padding: "1.5px 6px",
                            borderRadius: 999,
                            background: isDark ? "rgba(255,255,255,0.08)" : t.occFreeBar,
                            border: `1px solid ${t.occFreeBarBorder}`,
                          }}
                        >Completed-
                          {metric?.totalCompletedTasks ?? 0}/{metric?.totalAssignedTasks ?? 0} ·{" "}
                          {completionPercentage(
                            metric?.totalCompletedTasks,
                            metric?.totalAssignedTasks,
                          ) ?? "—"}
                          %
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ width: chartWidth, display: "flex", height: 42 }}>
                  {days.map((date, dayIndex) => {
                    const dateKey = date.toDateString();
                    const isOnLeave =
                      !row.isUnallocated &&
                      Array.isArray(metric?.leaveDates) &&
                      metric.leaveDates.includes(localDateKey(date));
                    const data = isOnLeave
                      ? { occupied: 0, free: 0, tasks: [], isOnLeave: true }
                      : row.isUnallocated
                        ? { occupied: 0, free: capacityHrs, tasks: [] }
                        : daily[dateKey] || { occupied: 0, free: capacityHrs, tasks: [] };
                    const key = `${row.id}-${dateKey}`;
                    const hover = hoveredKey === key;
                    const today = dateKey === todayKey;
                    const week = weekIndexForDay(dayIndex);
                    const last =
                      weekBoundaries[week] - 1 === dayIndex && dayIndex < days.length - 1;
                    const base = today
                      ? t.occCellToday
                      : isWeekend(date)
                        ? t.occCellWeekend
                        : t.occCellBg;
                    const bg =
                      week % 2 ? `linear-gradient(${weekOverlay},${weekOverlay}),${base}` : base;
                    const fill = Math.min((data.occupied / capacityHrs) * 100, 100);
                    return (
                      <div
                        key={dayIndex}
                        onMouseEnter={(event) => activate(event, row, date, data, key)}
                        onMouseLeave={clearHover}
                        onClick={(event) => {
                          event.stopPropagation();
                          activate(event, row, date, data, key);
                        }}
                        style={{
                          width: CELL,
                          flexShrink: 0,
                          padding: 3,
                          display: "flex",
                          alignItems: "center",
                          borderRight: last
                            ? `2px solid ${t.cardBorder}`
                            : dayIndex < days.length - 1
                              ? `1px solid ${t.gridLineMd}`
                              : "none",
                          background: hover ? (isDark ? "rgba(59,130,246,.2)" : "#e0f2fe") : bg,
                          boxShadow: today
                            ? `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}`
                            : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: BAR_HEIGHT,
                            background: data.isOnLeave
                              ? isDark
                                ? "#475569"
                                : "#cbd5e1"
                              : t.occFreeBar,
                            border: hover
                              ? `1.5px solid ${t.btnPrimary}`
                              : `1px solid ${t.occFreeBarBorder}`,
                            borderRadius: 6,
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: t.occFreeBarShadow,
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: "0 auto 0 0",
                              width: `${fill}%`,
                              background: occupancyColor(data.occupied),
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "grid",
                              placeItems: "center",
                              fontSize: 8,
                              fontWeight: 700,
                              color: data.occupied
                                ? isDark
                                  ? "#ffffff"
                                  : "#1e293b"
                                : t.occFreeLabel,
                            }}
                          >
                            {data.isOnLeave ? "Leave" : duration(data.occupied || data.free)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 10,
          flexWrap: "wrap",
          fontSize: 11,
          color: t.legendText,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i
            style={{
              width: 26,
              height: 10,
              background: t.occFreeBar,
              border: `1px solid ${t.occFreeBarBorder}`,
              borderRadius: 3,
            }}
          />
          Free capacity
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i
            style={{
              width: 26,
              height: 10,
              background: "linear-gradient(90deg,#22c55e,#84cc16,#eab308,#f97316,#dc2626)",
              borderRadius: 3,
            }}
          />
          Occupied (load)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 8, height: 8, background: chipDot, borderRadius: "50%" }} />
          Unallocated
        </span>
      </div>
    </div>
  );
}

export default ResourceOccupancyTimeline;
