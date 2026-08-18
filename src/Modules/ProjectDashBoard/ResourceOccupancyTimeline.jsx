import React, { useEffect, useMemo, useState } from "react";

const DESKTOP_LAYOUT = {
  cell: 46,
  name: 195,
  monthProgress: 96,
  taskCompletion: 150,
  barHeight: 20,
  weekHeaderHeight: 38,
  dayHeaderHeight: 46,
  rowHeight: 42,
  maxHeight: 520,
};

const MOBILE_LAYOUT = {
  cell: 44,
  name: 148,
  monthProgress: 0,
  taskCompletion: 0,
  barHeight: 22,
  weekHeaderHeight: 34,
  dayHeaderHeight: 44,
  rowHeight: 56,
  maxHeight: "min(72vh, 560px)",
};

const MOBILE_BREAKPOINT = 720;
const DEFAULT_CAPACITY = 8;
const MAX_SPAN_DAYS = 1096;

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

/** Switch to the compact timeline layout on narrow/mobile viewports. */
const useMobileLayout = (breakpoint = MOBILE_BREAKPOINT) => {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(query);
    const update = () => setIsMobile(media.matches);
    update();
    if (media.addEventListener) media.addEventListener("change", update);
    else media.addListener(update);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update);
      else media.removeListener(update);
    };
  }, [query]);

  return isMobile;
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
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

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
  if (
    !Number.isFinite(completedNumber) ||
    !Number.isFinite(assignedNumber) ||
    assignedNumber <= 0
  )
    return null;
  return Math.round((completedNumber / assignedNumber) * 100);
};

/* ------------------------------------------------------------------ */
/* Task -> per-day distribution helpers                               */
/* ------------------------------------------------------------------ */

const parseLocalDate = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? null
      : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? null
      : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return null;
};

const minDate = (...dates) => {
  const valid = dates.filter(Boolean);
  return valid.length ? new Date(Math.min(...valid.map((date) => date.getTime()))) : null;
};

const maxDate = (...dates) => {
  const valid = dates.filter(Boolean);
  return valid.length ? new Date(Math.max(...valid.map((date) => date.getTime()))) : null;
};

const eachDayInRange = (start, stop, skipWeekends) => {
  if (!start) return [];
  const end = !stop || stop < start ? start : stop;
  const days = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < MAX_SPAN_DAYS) {
    if (!skipWeekends || !isWeekend(cursor)) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  if (!days.length) days.push(new Date(start));
  return days;
};

const readTaskHours = (task) => {
  const raw =
    task?.durationHrs ??
    task?.durationHours ??
    task?.plannedHours ??
    task?.plannedHrs ??
    task?.allocatedHours ??
    task?.actualDurationHrs ??
    task?.actualHours ??
    task?.hours;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const taskMatchesResource = (task, name) => {
  const wanted = String(name || "")
    .trim()
    .toLowerCase();
  if (!wanted) return false;
  const candidates = [
    task?.resourceName,
    task?.userName,
    task?.assignedTo,
    task?.assigneeName,
    task?.assignee,
    task?.resource,
    task?.owner,
  ];
  return candidates.some(
    (candidate) => typeof candidate === "string" && candidate.trim().toLowerCase() === wanted,
  );
};

const resolveTasksForResource = (source, name) => {
  if (!source) return [];
  if (Array.isArray(source)) return source.filter((task) => taskMatchesResource(task, name));
  if (typeof source !== "object") return [];
  if (Array.isArray(source[name])) return source[name];
  const match = Object.keys(source).find(
    (key) => key.trim().toLowerCase() === String(name).trim().toLowerCase(),
  );
  return match && Array.isArray(source[match]) ? source[match] : [];
};

const distributeHours = (totalHours, spanDays, spreadMode, capacityHrs) => {
  if (!spanDays.length) return [];
  if (totalHours <= 0) return spanDays.map(() => 0);
  if (spreadMode === "fill") {
    let remaining = totalHours;
    return spanDays.map(() => {
      const take = Math.min(remaining, capacityHrs);
      remaining -= take;
      return take;
    });
  }
  const perDay = totalHours / spanDays.length;
  return spanDays.map(() => perDay);
};

const buildTaskDayMap = (tasks, { spreadMode, skipWeekends, capacityHrs }) => {
  const byDay = {};
  tasks.forEach((task) => {
    if (!task || typeof task !== "object") return;
    const plannedStart = parseLocalDate(
      task.plannedStart ?? task.plannedStartDate ?? task.startDate ?? task.start,
    );
    const plannedStop = parseLocalDate(
      task.plannedStop ??
        task.plannedStopDate ??
        task.plannedEndDate ??
        task.endDate ??
        task.end,
    );
    const actualStart = parseLocalDate(
      task.actualStart ?? task.actualStartDate ?? task.startedAt ?? task.startedOn,
    );
    const actualStop = parseLocalDate(
      task.actualStop ?? task.actualStopDate ?? task.actualEndDate ?? task.actualEnd,
    );
    const start = minDate(plannedStart, actualStart);
    const stop = maxDate(plannedStop, actualStop);
    if (!start) return;
    const spanDays = eachDayInRange(start, stop, skipWeekends);
    const perDayHours = distributeHours(readTaskHours(task), spanDays, spreadMode, capacityHrs);
    spanDays.forEach((day, index) => {
      const key = day.toDateString();
      if (!byDay[key]) byDay[key] = { hours: 0, tasks: [] };
      const hoursForDay = perDayHours[index];
      byDay[key].hours += hoursForDay;
      byDay[key].tasks.push({
        ...task,
        dayHours: Math.round(hoursForDay * 100) / 100,
        totalDays: spanDays.length,
        beganEarlier: Boolean(plannedStart && actualStart && actualStart < plannedStart),
      });
    });
  });
  return byDay;
};

/**
 * Responsive behavior:
 * - Desktop keeps the three fixed columns from the original component.
 * - At <= 720px only the resource column remains sticky. Monthly utilization
 *   and completion move below the resource name, leaving room for timeline days.
 * - Touch users can swipe the grid and tap a weekday to open its details.
 */
function ResourceOccupancyTimeline({
  weeks = [],
  resources = [],
  unallocatedUsers: suppliedUnallocatedUsers = null,
  getUnallocatedResources,
  occupancyByResourceDate = {},
  taskOccupancyByResourceDate = {},
  spreadMode = "even",
  skipWeekends = false,
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
  const isMobile = useMobileLayout();
  const layout = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
  const leftWidth = layout.name + layout.monthProgress + layout.taskCompletion;
  const dailyCapacity =
    Number.isFinite(Number(capacityHrs)) && Number(capacityHrs) > 0
      ? Number(capacityHrs)
      : DEFAULT_CAPACITY;

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
    if (!sortConfig.key || !sortConfig.direction) return timelineRows;

    return [...timelineRows].sort((a, b) => {
      if (sortConfig.key === "name") {
        const comparison = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      const aMetric = metricsByName[a.name.trim().toLowerCase()] || {};
      const bMetric = metricsByName[b.name.trim().toLowerCase()] || {};
      const aRaw = a.isUnallocated ? 0 : Number(aMetric.resourceMonthUtilization);
      const bRaw = b.isUnallocated ? 0 : Number(bMetric.resourceMonthUtilization);
      const aValue = Number.isFinite(aRaw) ? aRaw : 0;
      const bValue = Number.isFinite(bRaw) ? bRaw : 0;
      const comparison = aValue - bValue;

      if (comparison === 0)
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [timelineRows, metricsByName, sortConfig]);

  const resourceData = useMemo(() => {
    const taskMapsByResource = {};
    resources.forEach((name) => {
      const tasks = resolveTasksForResource(taskOccupancyByResourceDate, name);
      taskMapsByResource[name] = tasks.length
        ? buildTaskDayMap(tasks, {
            spreadMode,
            skipWeekends,
            capacityHrs: dailyCapacity,
          })
        : null;
    });

    return resources.reduce((result, name) => {
      result[name] = {};
      const taskMap = taskMapsByResource[name];
      days.forEach((date) => {
        const key = date.toDateString();
        const source = occupancyByResourceDate?.[key]?.[name];
        const total = taskMap ? taskMap[key]?.hours || 0 : source?.hours || 0;
        const tasks = taskMap ? taskMap[key]?.tasks || [] : source?.tasks || [];
        result[name][key] = {
          occupied: Math.min(total, dailyCapacity),
          free: Math.max(0, dailyCapacity - total),
          tasks,
        };
      });
      return result;
    }, {});
  }, [
    resources,
    days,
    occupancyByResourceDate,
    taskOccupancyByResourceDate,
    spreadMode,
    skipWeekends,
    dailyCapacity,
  ]);

  const weekIndexForDay = (index) => {
    for (let i = 0; i < weekBoundaries.length; i += 1)
      if (index < weekBoundaries[i]) return i;
    return Math.max(weekBoundaries.length - 1, 0);
  };

  const chartWidth = Math.max(days.length, 1) * layout.cell;
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
        capacityHrs: dailyCapacity,
        tasks: data.tasks,
        free: data.free,
        isOnLeave: data.isOnLeave,
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
    <div style={{ width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          color: t.textSecondary,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500 }}>
          {timelineRows.length} resource{timelineRows.length !== 1 ? "s" : ""} • {days.length}{" "}
          day{days.length !== 1 ? "s" : ""} • {dailyCapacity}h daily capacity
        </span>
        {isMobile && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => toggleSort("monthlyUtilization")}
              title="Sort by monthly utilization"
              style={{
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 999,
                padding: "3px 7px",
                background: t.cardBg,
                color:
                  sortConfig.key === "monthlyUtilization" ? t.btnPrimary : t.textSecondary,
                font: "inherit",
                fontSize: 9,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Utilization {sortIndicator("monthlyUtilization")}
            </button>
            <span style={{ fontSize: 10, color: t.textMuted }} aria-hidden="true">
              Swipe for more days
            </span>
          </span>
        )}
      </div>

      <div
        style={{
          border: `1px solid ${t.cardBorder}`,
          borderRadius: isMobile ? 8 : 10,
          background: t.cardBg,
          overflow: "auto",
          maxHeight: layout.maxHeight,
          width: "100%",
          position: "relative",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-x pan-y",
          scrollbarGutter: "stable",
        }}
      >
        <div style={{ width: leftWidth + chartWidth, minWidth: "100%", position: "relative" }}>
          {/* Week header */}
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
                width: leftWidth,
                height: layout.weekHeaderHeight,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 35,
                background: t.occHeaderBg,
                borderRight: `1px solid ${t.gridLineMd}`,
              }}
            />
            <div
              style={{
                display: "flex",
                width: chartWidth,
                minHeight: layout.weekHeaderHeight,
              }}
            >
              {weekBoundaries.map((end, index) => {
                const start = index ? weekBoundaries[index - 1] : 0;
                const count = end - start;
                return (
                  count > 0 && (
                    <div
                      key={index}
                      style={{
                        width: count * layout.cell,
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

          {/* Day and metric headers */}
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: layout.weekHeaderHeight,
              zIndex: 29,
              background: t.occHeaderBg,
              borderBottom: `1px solid ${t.gridLineMd}`,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                width: leftWidth,
                minHeight: layout.dayHeaderHeight,
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
                  width: layout.name,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: isMobile ? "8px 9px 4px" : "8px 12px 4px",
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

              {!isMobile && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleSort("monthlyUtilization")}
                    title="Sort by monthly utilization percentage"
                    style={{
                      ...headerStyle,
                      width: layout.monthProgress,
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
                        color:
                          sortConfig.key === "monthlyUtilization" ? t.btnPrimary : t.textMuted,
                        fontSize: 9,
                      }}
                    >
                      {sortIndicator("monthlyUtilization")}
                    </span>
                  </button>
                  <div
                    style={{
                      ...headerStyle,
                      width: layout.taskCompletion,
                      borderLeft: `1px solid ${t.gridLineMd}`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    Task
                    <br />
                    Completion
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", width: chartWidth }}>
              {days.map((date, index) => {
                const today = date.toDateString() === todayKey;
                const week = weekIndexForDay(index);
                const last = weekBoundaries[week] - 1 === index && index < days.length - 1;
                const base = today ? t.occHeaderToday : t.occHeaderBg;
                const background =
                  week % 2 ? `linear-gradient(${weekOverlay},${weekOverlay}),${base}` : base;
                return (
                  <div
                    key={`${date.toDateString()}-${index}`}
                    style={{
                      width: layout.cell,
                      flexShrink: 0,
                      textAlign: "center",
                      padding: "4px 1px",
                      borderRight: last
                        ? `2px solid ${t.cardBorder}`
                        : index < days.length - 1
                          ? `1px solid ${t.gridLineMd}`
                          : "none",
                      background,
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

          {/* Resource rows */}
          {sortedTimelineRows.map((row, index) => {
            const rowBg = index % 2 ? t.occRowOdd : t.occRowEven;
            const metric = row.isUnallocated
              ? null
              : metricsByName[row.name.trim().toLowerCase()] || null;
            const daily = row.isUnallocated ? {} : resourceData[row.name] || {};
            const completed = metric?.totalCompletedTasks ?? 0;
            const assigned = metric?.totalAssignedTasks ?? 0;
            const completion = completionPercentage(completed, assigned);

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
                    width: leftWidth,
                    height: layout.rowHeight,
                    display: "flex",
                    flexShrink: 0,
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                    background: rowBg,
                    borderRight: `1px solid ${t.gridLineMd}`,
                    boxShadow: isMobile ? `3px 0 7px rgba(15,23,42,0.08)` : "none",
                  }}
                >
                  <div
                    style={{
                      width: layout.name,
                      boxSizing: "border-box",
                      padding: isMobile ? "6px 7px" : "6px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 6 : 8,
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 22 : 20,
                        height: isMobile ? 22 : 20,
                        flex: "0 0 auto",
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
                          fontSize: isMobile ? 11.5 : 12.5,
                          fontWeight: 600,
                          color: t.resNameColor,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.name}
                      </div>

                      {row.isUnallocated ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            marginTop: 3,
                            padding: "1.5px 5px",
                            borderRadius: 999,
                            fontSize: 8.5,
                            fontWeight: 700,
                            color: chipText,
                            background: chipBg,
                            border: `1px solid ${chipBorder}`,
                            maxWidth: "100%",
                          }}
                        >
                          <i
                            aria-hidden="true"
                            style={{
                              width: 4.5,
                              height: 4.5,
                              flex: "0 0 auto",
                              borderRadius: "50%",
                              background: chipDot,
                            }}
                          />
                          Unallocated
                        </span>
                      ) : (
                        isMobile && (
                          <div
                            title={`Monthly utilization: ${percentageText(
                              metric?.resourceMonthUtilization,
                            )}. Completed: ${completed}/${assigned}. On time: ${
                              metric?.onTimeTasks ?? 0
                            }. Delayed: ${metric?.delayedTasks ?? 0}.`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              minWidth: 0,
                              marginTop: 4,
                              color: t.textMuted,
                              fontSize: 8.5,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                color: percentageColor(
                                  metric?.resourceMonthUtilization,
                                  t.textMuted,
                                ),
                              }}
                            >
                              {percentageText(metric?.resourceMonthUtilization)} utilization
                            </span>
                            <span aria-hidden="true">·</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                              {completed}/{assigned} done
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {!isMobile && (
                    <>
                      <div
                        title={
                          row.isUnallocated
                            ? "Monthly Utilization is unavailable for unallocated resources"
                            : `Monthly Utilization: ${percentageText(
                                metric?.resourceMonthUtilization,
                              )}`
                        }
                        style={{
                          width: layout.monthProgress,
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
                        {row.isUnallocated
                          ? "—"
                          : percentageText(metric?.resourceMonthUtilization)}
                      </div>

                      <div
                        title={
                          row.isUnallocated
                            ? "Task completion is unavailable for unallocated resources"
                            : `On time: ${metric?.onTimeTasks ?? 0} | Delayed: ${
                                metric?.delayedTasks ?? 0
                              } | Completed: ${completed}/${assigned} (${completion ?? "—"}%)`
                        }
                        style={{
                          width: layout.taskCompletion,
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
                                {metric?.delayedTasks ?? 0}
                              </span>
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                color: completion == null ? t.textMuted : t.textPrimary,
                                fontSize: 9,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                padding: "1.5px 6px",
                                borderRadius: 999,
                                background: isDark ? "rgba(255,255,255,0.08)" : t.occFreeBar,
                                border: `1px solid ${t.occFreeBarBorder}`,
                              }}
                            >
                              Completed-{completed}/{assigned} · {completion ?? "—"}%
                            </span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ width: chartWidth, display: "flex", height: layout.rowHeight }}>
                  {days.map((date, dayIndex) => {
                    const dateKey = date.toDateString();
                    const weekend = isWeekend(date);
                    const isOnLeave =
                      !row.isUnallocated &&
                      Array.isArray(metric?.leaveDates) &&
                      metric.leaveDates.includes(localDateKey(date));
                    const data = isOnLeave
                      ? { occupied: 0, free: 0, tasks: [], isOnLeave: true }
                      : row.isUnallocated
                        ? { occupied: 0, free: dailyCapacity, tasks: [] }
                        : daily[dateKey] || {
                            occupied: 0,
                            free: dailyCapacity,
                            tasks: [],
                          };
                    const key = `${row.id}-${dateKey}`;
                    const hover = hoveredKey === key;
                    const today = dateKey === todayKey;
                    const week = weekIndexForDay(dayIndex);
                    const last =
                      weekBoundaries[week] - 1 === dayIndex && dayIndex < days.length - 1;
                    const base = today
                      ? t.occCellToday
                      : weekend
                        ? t.occCellWeekend
                        : t.occCellBg;
                    const background =
                      week % 2 ? `linear-gradient(${weekOverlay},${weekOverlay}),${base}` : base;
                    const fill = weekend
                      ? 0
                      : Math.min((data.occupied / dailyCapacity) * 100, 100);
                    const dateLabel = date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    const statusLabel = data.isOnLeave
                      ? "on leave"
                      : `${duration(data.occupied)} occupied, ${duration(data.free)} free`;

                    return (
                      <div
                        key={dayIndex}
                        role={weekend ? undefined : "button"}
                        tabIndex={weekend ? undefined : 0}
                        aria-label={weekend ? undefined : `${row.name}, ${dateLabel}: ${statusLabel}`}
                        onPointerEnter={(event) => {
                          if (!weekend && event.pointerType !== "touch")
                            activate(event, row, date, data, key);
                        }}
                        onPointerLeave={(event) => {
                          if (!weekend && event.pointerType !== "touch") clearHover();
                        }}
                        onFocus={(event) => {
                          if (!weekend) activate(event, row, date, data, key);
                        }}
                        onBlur={() => {
                          if (!weekend) clearHover();
                        }}
                        onClick={(event) => {
                          if (weekend) return;
                          event.stopPropagation();
                          activate(event, row, date, data, key);
                        }}
                        onKeyDown={(event) => {
                          if (weekend) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            activate(event, row, date, data, key);
                          } else if (event.key === "Escape") {
                            clearHover();
                            event.currentTarget.blur();
                          }
                        }}
                        style={{
                          width: layout.cell,
                          flexShrink: 0,
                          padding: isMobile ? 4 : 3,
                          boxSizing: "border-box",
                          display: "flex",
                          alignItems: "center",
                          borderRight: last
                            ? `2px solid ${t.cardBorder}`
                            : dayIndex < days.length - 1
                              ? `1px solid ${t.gridLineMd}`
                              : "none",
                          background: hover
                            ? isDark
                              ? "rgba(59,130,246,.2)"
                              : "#e0f2fe"
                            : background,
                          boxShadow: today
                            ? `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}`
                            : "none",
                          cursor: weekend ? "default" : "pointer",
                          outline: hover ? `2px solid ${t.btnPrimary}` : "none",
                          outlineOffset: -2,
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: layout.barHeight,
                            background:
                              !weekend && data.isOnLeave
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
                              fontSize: isMobile ? 8.5 : 8,
                              fontWeight: 700,
                              color: data.occupied
                                ? isDark
                                  ? "#ffffff"
                                  : "#1e293b"
                                : t.occFreeLabel,
                            }}
                          >
                            {weekend
                              ? ""
                              : data.isOnLeave
                                ? "Leave"
                                : duration(data.occupied || data.free)}
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
          gap: isMobile ? 12 : 16,
          marginTop: 10,
          paddingBottom: 2,
          flexWrap: isMobile ? "nowrap" : "wrap",
          overflowX: isMobile ? "auto" : "visible",
          WebkitOverflowScrolling: "touch",
          fontSize: 11,
          color: t.legendText,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
          <i
            aria-hidden="true"
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
        <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
          <i
            aria-hidden="true"
            style={{
              width: 26,
              height: 10,
              background: "linear-gradient(90deg,#22c55e,#84cc16,#eab308,#f97316,#dc2626)",
              borderRadius: 3,
            }}
          />
          Occupied (load)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
          <i
            aria-hidden="true"
            style={{ width: 8, height: 8, background: chipDot, borderRadius: "50%" }}
          />
          Unallocated
        </span>
      </div>
    </div>
  );
}

export default ResourceOccupancyTimeline;
