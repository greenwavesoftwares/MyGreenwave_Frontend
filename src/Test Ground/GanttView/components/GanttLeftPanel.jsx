import React, { useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Briefcase,
  Filter,
  X,
  Maximize2,
  GripVertical,
} from "lucide-react";
import { useTheme } from "../../useTheme";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  SUB_HEADER_HEIGHT,
} from "../helpers/constants";
import { getStatusColor } from "../helpers/statusColors";
import {
  computeProjectFilterOptions,
  fmtDateShort,
} from "../helpers/filterOptions";
import ProjectColumnFilterButton from "./ProjectColumnFilterButton";
import { getModuleColor } from "../../helpers/modules";
import {
  getDisplayStatus,
  DISPLAY_STATUSES,
} from "../../helpers/statusDisplay";

/* ─── Helpers ─── */

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function computeStatusSummary(rows) {
  const counts = {};
  if (!rows?.length) return counts;
  rows.forEach((row) => {
    const s = getDisplayStatus(row);
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}
// Helper to parse ISO strings safely to timestamps
// Helper to parse ISO strings safely to timestamps
function safeTime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d.getTime();
}

// Format date with Year (e.g., "31 Jul 2026")
function fmtDateWithYear(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Adds work hours starting from a date, skipping weekends (Sat/Sun) and non-work hours (10:00 - 18:00).
 */
function addWorkingHours(startDate, totalHours) {
  if (!totalHours || totalHours <= 0) return startDate;

  let current = new Date(startDate.getTime());

  const WORK_START = 10; // 10:00 AM
  const WORK_END = 18; // 6:00 PM

  // Adjust if starting on a weekend
  while (current.getDay() === 0 || current.getDay() === 6) {
    // 0 = Sun, 6 = Sat
    current.setDate(current.getDate() + 1);
    current.setHours(WORK_START, 0, 0, 0);
  }

  // Adjust time of day
  if (current.getHours() < WORK_START) {
    current.setHours(WORK_START, 0, 0, 0);
  } else if (current.getHours() >= WORK_END) {
    current.setDate(current.getDate() + 1);
    current.setHours(WORK_START, 0, 0, 0);
    while (current.getDay() === 0 || current.getDay() === 6) {
      current.setDate(current.getDate() + 1);
    }
  }

  let hoursRemaining = totalHours;

  while (hoursRemaining > 0) {
    // Skip weekend
    while (current.getDay() === 0 || current.getDay() === 6) {
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START, 0, 0, 0);
    }

    const currentHour = current.getHours() + current.getMinutes() / 60;
    const hoursLeftToday = WORK_END - currentHour;

    if (hoursRemaining <= hoursLeftToday) {
      const minutesToAdd = hoursRemaining * 60;
      current.setMinutes(current.getMinutes() + minutesToAdd);
      hoursRemaining = 0;
    } else {
      hoursRemaining -= hoursLeftToday;
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START, 0, 0, 0);
    }
  }

  return current;
}

/**
 * Calculates Project Start, End, and Expected End (Option A)
 */
function computeProjectDates(rows) {
  if (!rows || rows.length === 0)
    return { start: null, end: null, expected: null };

  let minStart = Infinity;
  let maxStop = -Infinity;

  rows.forEach((r) => {
    const pStart = safeTime(r.plannedStart);
    const pStop = safeTime(r.plannedStop);

    if (pStart && pStart < minStart) minStart = pStart;
    if (pStop && pStop > maxStop) maxStop = pStop;
  });

  // Separate non-completed tasks
  const incompleteRows = rows.filter((r) => {
    const status = String(r.status || "")
      .toLowerCase()
      .trim();
    return (
      status !== "completed" && status !== "finished" && status !== "closed"
    );
  });

  let expectedDateMs = null;

  if (incompleteRows.length === 0) {
    // All tasks completed/finished/closed: Expected end = latest actualStop
    let maxCompleteStop = -Infinity;
    rows.forEach((r) => {
      const stop = safeTime(r.actualStop) || safeTime(r.plannedStop);
      if (stop && stop > maxCompleteStop) maxCompleteStop = stop;
    });
    expectedDateMs = maxCompleteStop !== -Infinity ? maxCompleteStop : maxStop;
  } else {
    // Schedule remaining tasks starting from TODAY (Option A)
    const now = new Date();

    // Group incomplete duration by resource (parallel execution across users)
    const resourceDurations = {};

    incompleteRows.forEach((r) => {
      const resKey = r.resource || "__unassigned__";
      const dur = Number(r.durationHrs) || 0;
      resourceDurations[resKey] = (resourceDurations[resKey] || 0) + dur;
    });

    let maxResourceEndMs = -Infinity;

    Object.values(resourceDurations).forEach((totalHrs) => {
      const endDt = addWorkingHours(now, totalHrs);
      if (endDt.getTime() > maxResourceEndMs) {
        maxResourceEndMs = endDt.getTime();
      }
    });

    expectedDateMs =
      maxResourceEndMs !== -Infinity ? maxResourceEndMs : maxStop;
  }

  return {
    start: minStart !== Infinity ? minStart : null,
    end: maxStop !== -Infinity ? maxStop : null,
    expected: expectedDateMs,
  };
}
function StatusBadgesSummary({ summary, t }) {
  const active = DISPLAY_STATUSES.filter((s) => (summary[s] || 0) > 0);
  if (!active.length) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 4,
      }}
    >
      {active.map((status) => {
        const sc = getStatusColor(status, t);
        return (
          <span
            key={status}
            title={`${status}: ${summary[status]}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 6px",
              borderRadius: 4,
              background: sc.bg,
              border: `1px solid ${sc.border}`,
              color: sc.color,
              fontSize: 8.5,
              fontWeight: 700,
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: sc.bar,
                flexShrink: 0,
              }}
            />
            {status}{" "}
            <strong style={{ opacity: 0.85 }}>{summary[status]}</strong>
          </span>
        );
      })}
    </div>
  );
}

function ColResizeHandle({ columnKey, getWidth, getMinWidth, setWidth, t }) {
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = getWidth(columnKey);
      const minW = getMinWidth(columnKey);

      const onMove = (ev) => {
        const next = Math.max(minW, startW + (ev.clientX - startX));
        setWidth(columnKey, next);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnKey, getWidth, getMinWidth, setWidth],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      title="Drag to resize column"
      style={{
        position: "absolute",
        right: -3,
        top: 0,
        bottom: 0,
        width: 6,
        cursor: "col-resize",
        zIndex: 5,
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.primary + "55";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    />
  );
}

function cellShell(width, t, extra = {}) {
  return {
    width,
    minWidth: width,
    maxWidth: width,
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
    borderRight: `1px solid ${t.borderSubtle}`,
    overflow: "hidden",
    boxSizing: "border-box",
    position: "relative",
    flexShrink: 0,
    ...extra,
  };
}

function headerShell(width, t, extra = {}) {
  return {
    ...cellShell(width, t, extra),
    borderRight: `1px solid ${t.border}`,
    justifyContent: "space-between",
    gap: 4,
  };
}

export default function GanttLeftPanel({
  viewMode,
  filteredProjects,
  allRows,
  resourceViewData,
  projectColorMap,
  moduleColorMap,
  expandedProjects,
  setExpandedProjects,
  expandedRows,
  setExpandedRows,
  hasChildren,
  getProjectFilter,
  updateProjectFilter,
  clearProjectFilters,
  hasProjectFilters,
  visibleColumns,
  leftPanelWidth,
  leftPanelRef,
  getWidth,
  getMinWidth,
  setWidth,
  taskWidth,
  contentWidth,
  onOpenFullScreen,
  onOpenFullScreenAll,
  isFullScreen,
  moveColumn,
  getVisibleOrder,
}) {
  const { t } = useTheme();

  const [draggingKey, setDraggingKey] = React.useState(null);
  const [dragOverKey, setDragOverKey] = React.useState(null);

  const gw = getWidth || ((k) => 120);
  const gmin = getMinWidth || (() => 60);
  const sw = setWidth || (() => {});
  const tw = taskWidth || 260;
  const cw = contentWidth || leftPanelWidth;

  const buildColumns = useCallback(
    (project) => {
      const customs = project?.customColumns || [];
      const customMap = Object.fromEntries(customs.map((c) => [c.id, c]));

      const keys =
        typeof getVisibleOrder === "function"
          ? getVisibleOrder(visibleColumns, customs)
          : ["module", "task", "resource", "status"].filter(
              (k) => k === "task" || visibleColumns?.[k],
            );

      const meta = {
        module: { label: "MODULE", filterKey: "module", filterColor: t.violet },
        task: { label: "TASK" },
        resource: {
          label: "RES",
          filterKey: "resource",
          filterColor: t.success,
        },
        plannedStart: {
          label: "PLAN START",
          filterKey: "plannedStart",
          filterColor: t.primary,
        },
        plannedStop: {
          label: "PLAN STOP",
          filterKey: "plannedStop",
          filterColor: t.primary,
        },
        actualStart: {
          label: "ACT START",
          filterKey: "actualStart",
          filterColor: t.warning,
        },
        actualStop: {
          label: "ACT STOP",
          filterKey: "actualStop",
          filterColor: t.warning,
        },
        status: {
          label: "STATUS",
          filterKey: "status",
          filterColor: t.warning,
        },
      };

      return keys.map((key) => {
        if (meta[key]) {
          return {
            key,
            width: key === "task" ? tw : gw(key) || 120,
            ...meta[key],
          };
        }
        const c = customMap[key];
        return {
          key,
          width: gw(key) || 120,
          label: (c?.name || key).toUpperCase(),
          filterKey: key,
          filterColor: t.violet,
          isCustom: true,
          colDef: c,
        };
      });
    },
    [visibleColumns, gw, tw, t, getVisibleOrder],
  );

  return (
    <div
      style={{
        width: leftPanelWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: t.bgCard,
        zIndex: 20,
        overflow: "hidden",
      }}
    >
      {/* Top label bar */}
      <div
        style={{
          height: HEADER_HEIGHT,
          borderBottom: `1px solid ${t.border}`,
          background: t.bgSubtle,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 12px 8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: t.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {viewMode === "task" ? "Project / Task" : "Resource"}
        </span>
        {viewMode === "resource" &&
          !isFullScreen &&
          filteredProjects.length > 0 && (
            <button
              onClick={() => onOpenFullScreenAll?.()}
              title="Expand all projects"
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                border: `1px solid ${t.primaryBorder}`,
                background: t.primaryBgSubtle,
                color: t.primary,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <Maximize2 size={11} />
            </button>
          )}
      </div>

      <div
        ref={leftPanelRef}
        style={{ flex: 1, overflowY: "hidden", overflowX: "auto" }}
      >
        <div style={{ width: Math.max(cw, leftPanelWidth), minWidth: "100%" }}>
          {viewMode === "task"
            ? filteredProjects.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                const pc = projectColorMap[project.id] || t.textMuted;

                const projectRowsFromAll = allRows.filter(
                  (r) => r._projectId === project.id,
                );
                const projectRows =
                  projectRowsFromAll.length > 0
                    ? projectRowsFromAll
                    : (project.rows || []).map((r) => ({
                        ...r,
                        depth: r.parentId ? 1 : 0,
                        _projectId: project.id,
                        _projectName: project.project || "Untitled",
                      }));

                const projectFilter = getProjectFilter(project.id);
                const projectFilterOpts = computeProjectFilterOptions(
                  project,
                  projectFilter,
                );
                const hasFilters = hasProjectFilters(project.id);
                const columns = buildColumns(project);

                return (
                  <React.Fragment key={project.id}>
                    {/* Project header */}
                    <div
                      onClick={() => {
                        setExpandedProjects((prev) => {
                          const next = new Set(prev);
                          if (next.has(project.id)) next.delete(project.id);
                          else next.add(project.id);
                          return next;
                        });
                      }}
                      style={{
                        height: ROW_HEIGHT,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 10px",
                        borderBottom: `1px solid ${t.border}`,
                        background: hasFilters ? t.primaryBgSubtle : t.bgSubtle,
                        cursor: "pointer",
                        gap: 6,
                        borderLeft: `4px solid ${pc}`,
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown
                          size={13}
                          color={t.textMuted}
                          style={{ flexShrink: 0 }}
                        />
                      ) : (
                        <ChevronRight
                          size={13}
                          color={t.textMuted}
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <Briefcase
                        size={12}
                        color={pc}
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Project Title */}
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: t.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={project.project || "Untitled"}
                        >
                          {project.project || "Untitled"}
                        </div>

                        {/* Meta + Dates + Status Summary */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            alignItems: "center",
                            marginTop: 2,
                          }}
                        >
                          {/* Task count / status / filters */}
                          <div
                            style={{
                              fontSize: 9.5,
                              color: t.textFaint,
                              display: "flex",
                              gap: 4,
                              alignItems: "center",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span>{(project.rows || []).length} tasks</span>
                            <span>•</span>
                            <span style={{ textTransform: "capitalize" }}>
                              {project.status || "draft"}
                            </span>
                            {hasFilters && (
                              <>
                                <span>•</span>
                                <span
                                  style={{
                                    color: t.primary,
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    gap: 3,
                                    alignItems: "center",
                                  }}
                                >
                                  <Filter size={9} /> Filtered
                                </span>
                              </>
                            )}
                          </div>

                          {/* Scheduled + Expected dates */}
                          {(() => {
                            const dates = computeProjectDates(project.rows);
                            if (!dates.start && !dates.end) return null;

                            const isDelayed =
                              dates.expected &&
                              dates.end &&
                              dates.expected > dates.end;

                            return (
                              <div
                                style={{
                                  fontSize: 9.5,
                                  color: t.textSecondary,
                                  display: "flex",
                                  gap: 6,
                                  alignItems: "center",
                                  background: t.bgMuted,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  border: `1px solid ${t.border}`,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span title="Scheduled Start – Scheduled End">
                                  📅 {fmtDateWithYear(dates.start)} –{" "}
                                  {fmtDateWithYear(dates.end)}
                                </span>
                                {dates.expected && (
                                  <>
                                    <span style={{ color: t.borderStrong }}>
                                      |
                                    </span>
                                    <span
                                      title="Expected/Actual Project End"
                                      style={{
                                        color: isDelayed
                                          ? t.danger
                                          : t.textSecondary,
                                        fontWeight: isDelayed ? 700 : 500,
                                      }}
                                    >
                                      🎯 Exp: {fmtDateWithYear(dates.expected)}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}

                          {/* Status summary badges — RESTORED */}
                          <StatusBadgesSummary
                            summary={computeStatusSummary(project.rows || [])}
                            t={t}
                          />
                        </div>
                      </div>
                      {!isFullScreen && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFullScreen?.(project.id);
                          }}
                          title="Expand to full screen"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 5,
                            border: `1px solid ${t.primaryBorder}`,
                            background: t.primaryBgSubtle,
                            color: t.primary,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            flexShrink: 0,
                          }}
                        >
                          <Maximize2 size={11} />
                        </button>
                      )}
                      {isExpanded && hasFilters && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearProjectFilters(project.id);
                          }}
                          style={{
                            height: 22,
                            padding: "0 8px",
                            borderRadius: 4,
                            border: `1px solid ${t.dangerBorder}`,
                            background: t.dangerBgSubtle,
                            color: t.danger,
                            cursor: "pointer",
                            display: "inline-flex",
                            gap: 3,
                            alignItems: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          <X size={10} /> Clear
                        </button>
                      )}
                    </div>

                    {/* ── Column sub-header (DRAG LIVES HERE ONLY) ── */}
                    {isExpanded && (
                      <div
                        style={{
                          height: SUB_HEADER_HEIGHT,
                          display: "flex",
                          borderBottom: `1px solid ${t.border}`,
                          background: t.bgSubtle,
                          borderLeft: `4px solid ${pc}80`,
                        }}
                      >
                        {columns.map((col) => {
                          const isDragging = draggingKey === col.key;
                          const isDragOver =
                            dragOverKey === col.key && draggingKey !== col.key;

                          return (
                            <div
                              key={col.key}
                              style={{
                                ...headerShell(col.width, t),
                                opacity: isDragging ? 0.4 : 1,
                                boxShadow: isDragOver
                                  ? `inset 3px 0 0 0 ${t.primary}`
                                  : undefined,
                                background: isDragOver
                                  ? t.primaryBgSubtle
                                  : undefined,
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                if (dragOverKey !== col.key) {
                                  setDragOverKey(col.key);
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverKey === col.key) {
                                  setDragOverKey(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const from =
                                  e.dataTransfer.getData("text/col-key") ||
                                  draggingKey;
                                if (from && typeof moveColumn === "function") {
                                  moveColumn(from, col.key);
                                }
                                setDraggingKey(null);
                                setDragOverKey(null);
                              }}
                            >
                              {/* Draggable header text */}
                              <span
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData(
                                    "text/col-key",
                                    col.key,
                                  );
                                  requestAnimationFrame(() =>
                                    setDraggingKey(col.key),
                                  );
                                }}
                                onDragEnd={() => {
                                  setDraggingKey(null);
                                  setDragOverKey(null);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                title="Drag to reorder column"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  flex: 1,
                                  minWidth: 0,
                                  cursor: "grab",
                                  userSelect: "none",
                                  borderRadius: 4,
                                  padding: "2px 4px",
                                  marginLeft: -4,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = t.bgMuted;
                                  const grip =
                                    e.currentTarget.querySelector(
                                      "[data-grip]",
                                    );
                                  if (grip) grip.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  const grip =
                                    e.currentTarget.querySelector(
                                      "[data-grip]",
                                    );
                                  if (grip) grip.style.opacity = "0";
                                }}
                              >
                                <GripVertical
                                  data-grip="1"
                                  size={11}
                                  color={t.textFaint}
                                  style={{
                                    flexShrink: 0,
                                    opacity: 0,
                                    transition: "opacity .12s",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: col.isCustom
                                      ? t.violet
                                      : t.textFaint,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {col.label}
                                </span>
                              </span>

                              {col.filterKey && (
                                <ProjectColumnFilterButton
                                  color={col.filterColor}
                                  columnKey={col.filterKey}
                                  options={
                                    col.isCustom
                                      ? projectFilterOpts.customOpts?.[
                                          col.key
                                        ] || []
                                      : col.filterKey === "module"
                                        ? projectFilterOpts.moduleOpts || []
                                        : col.filterKey === "resource"
                                          ? projectFilterOpts.resourceOpts || []
                                          : col.filterKey === "status"
                                            ? projectFilterOpts.statusOpts || []
                                            : projectFilterOpts[
                                                col.filterKey
                                              ] || []
                                  }
                                  selected={projectFilter[col.filterKey] || []}
                                  onChange={(vals) =>
                                    updateProjectFilter(
                                      project.id,
                                      col.filterKey,
                                      vals,
                                    )
                                  }
                                />
                              )}

                              <ColResizeHandle
                                columnKey={col.key}
                                getWidth={col.key === "task" ? () => tw : gw}
                                getMinWidth={gmin}
                                setWidth={sw}
                                t={t}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Data rows (ACTUAL CELL CONTENT) ── */}
                    {isExpanded &&
                      projectRows.map((row) => {
                        const isParent = hasChildren?.(row.id);
                        const isRowExpanded = expandedRows.has(row.id);
                        const displayStatus = getDisplayStatus(row);
                        const sc = getStatusColor(displayStatus, t);

                        return (
                          <div
                            key={row.id}
                            style={{
                              height: ROW_HEIGHT,
                              display: "flex",
                              borderBottom: `1px solid ${t.borderSubtle}`,
                              borderLeft: `4px solid transparent`,
                            }}
                          >
                            {columns.map((col) => {
                              // MODULE
                              if (col.key === "module") {
                                const mc = row.module
                                  ? getModuleColor(row.module, moduleColorMap)
                                  : null;
                                return (
                                  <div
                                    key={col.key}
                                    style={cellShell(col.width, t)}
                                  >
                                    {mc ? (
                                      <span
                                        style={{
                                          padding: "2px 7px",
                                          borderRadius: 4,
                                          background: mc.bg,
                                          color: mc.color,
                                          border: `1px solid ${mc.border}`,
                                          fontSize: 10.5,
                                          fontWeight: 600,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          maxWidth: "100%",
                                        }}
                                        title={row.module}
                                      >
                                        {row.module}
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          color: t.textDisabled,
                                          fontSize: 10,
                                        }}
                                      >
                                        —
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              // TASK
                              if (col.key === "task") {
                                return (
                                  <div
                                    key={col.key}
                                    style={cellShell(col.width, t, {
                                      paddingLeft: 8 + (row.depth || 0) * 14,
                                      gap: 6,
                                    })}
                                  >
                                    {isParent ? (
                                      <button
                                        onClick={() =>
                                          setExpandedRows((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(row.id))
                                              next.delete(row.id);
                                            else next.add(row.id);
                                            return next;
                                          })
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          padding: 0,
                                          color: t.textFaint,
                                          display: "flex",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {isRowExpanded ? (
                                          <ChevronDown size={12} />
                                        ) : (
                                          <ChevronRight size={12} />
                                        )}
                                      </button>
                                    ) : (
                                      <span
                                        style={{ width: 12, flexShrink: 0 }}
                                      />
                                    )}
                                    <span
                                      style={{
                                        fontSize: 11.5,
                                        fontWeight:
                                          (row.depth || 0) === 0 ? 600 : 400,
                                        color: t.textPrimary,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                      title={row.task}
                                    >
                                      {row.task || "—"}
                                    </span>
                                  </div>
                                );
                              }

                              // RESOURCE
                              if (col.key === "resource") {
                                const full =
                                  row.resourceName || row.resource || "";
                                return (
                                  <div
                                    key={col.key}
                                    style={cellShell(col.width, t, {
                                      justifyContent: "center",
                                    })}
                                    title={full}
                                  >
                                    {row.resource ? (
                                      <div
                                        style={{
                                          width: 26,
                                          height: 26,
                                          borderRadius: "50%",
                                          background: t.primaryBg,
                                          color: t.primary,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 10,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {getInitials(full)}
                                      </div>
                                    ) : (
                                      <span
                                        style={{
                                          color: t.textDisabled,
                                          fontSize: 10,
                                        }}
                                      >
                                        —
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              // DATES
                              if (
                                col.key === "plannedStart" ||
                                col.key === "plannedStop" ||
                                col.key === "actualStart" ||
                                col.key === "actualStop"
                              ) {
                                const display = fmtDateShort(row[col.key]);
                                return (
                                  <div
                                    key={col.key}
                                    style={cellShell(col.width, t)}
                                  >
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        fontFamily:
                                          "'JetBrains Mono', monospace",
                                        color: display
                                          ? t.textSecondary
                                          : t.textDisabled,
                                        fontStyle: display
                                          ? "normal"
                                          : "italic",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                      title={row[col.key] || ""}
                                    >
                                      {display || "—"}
                                    </span>
                                  </div>
                                );
                              }

                              // STATUS
                              if (col.key === "status") {
                                return (
                                  <div
                                    key={col.key}
                                    style={cellShell(col.width, t)}
                                  >
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        background: sc.bg,
                                        color: sc.color,
                                        border: `1px solid ${sc.border}`,
                                        textTransform: "capitalize",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                      }}
                                      title={displayStatus}
                                    >
                                      {displayStatus}
                                    </span>
                                  </div>
                                );
                              }

                              // CUSTOM
                              if (col.isCustom) {
                                const val = String(
                                  row.customValues?.[col.key] || "",
                                ).trim();
                                return (
                                  <div
                                    key={col.key}
                                    style={cellShell(col.width, t)}
                                  >
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        color: val
                                          ? t.textSecondary
                                          : t.textDisabled,
                                        fontStyle: val ? "normal" : "italic",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                      title={val}
                                    >
                                      {val || "—"}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={col.key}
                                  style={cellShell(col.width, t)}
                                />
                              );
                            })}
                          </div>
                        );
                      })}

                    {isExpanded && hasFilters && projectRows.length === 0 && (
                      <div
                        style={{
                          padding: "16px 12px",
                          textAlign: "center",
                          borderBottom: `1px solid ${t.borderSubtle}`,
                          background: t.bgSubtle,
                        }}
                      >
                        <Filter
                          size={18}
                          color={t.textDisabled}
                          style={{ marginBottom: 6 }}
                        />
                        <div
                          style={{
                            fontSize: 11,
                            color: t.textMuted,
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          No matching tasks
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearProjectFilters(project.id);
                          }}
                          style={{
                            height: 22,
                            padding: "0 8px",
                            borderRadius: 4,
                            border: `1px solid ${t.borderStrong}`,
                            background: t.bgCard,
                            color: t.textMuted,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "Sora,sans-serif",
                            display: "inline-flex",
                            gap: 3,
                            alignItems: "center",
                          }}
                        >
                          <X size={10} /> Clear Filters
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            : resourceViewData.map((res) => {
                const rowHeight = ROW_HEIGHT * res.laneCount;
                return (
                  <div
                    key={res.userId}
                    style={{
                      height: rowHeight,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      borderBottom: `1px solid ${t.borderSubtle}`,
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: t.primaryBg,
                        color: t.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                      title={res.name}
                    >
                      {getInitials(res.name)}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: t.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {res.name}
                        </div>
                        <div style={{ fontSize: 9.5, color: t.textFaint }}>
                          {res.tasks.length} task
                          {res.tasks.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <StatusBadgesSummary
                        summary={computeStatusSummary(res.tasks || [])}
                        t={t}
                      />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
