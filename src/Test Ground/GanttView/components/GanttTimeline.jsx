import React from "react";
import { useTheme } from "../../useTheme";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  SUB_HEADER_HEIGHT,
  ZOOM_CONFIGS,
} from "../helpers/constants";
import {
  getStatusColor,
  getDelayedColor,
  isDelayed,
} from "../helpers/statusColors";
import DependencyArrows from "../../shared/DependencyArrows";

/**
 * Right timeline area:
 *   - Sticky header (major + minor ticks)
 *   - Weekend shades, today line, grid lines
 *   - Task bars OR Resource bars
 *   - Dependency arrows overlay
 */
export default function GanttTimeline({
  timelineRef,
  syncScroll,
  totalChartWidth,
  totalChartHeight,
  zoom,
  colWidthPx,
  ticks,
  majorTicks,
  weekendShades,
  todayLeft,
  projectStart,
  totalMs,
  viewMode,
  filteredProjects,
  allRows,
  resourceViewData,
  expandedProjects,
  projectColorMap,
  hasProjectFilters,
  getBarPosition,
  barsRef,
  handleBarClick,
  hoveredRowId,
  setHoveredRowId,
  showDependencies,
  dependencyArrows,
}) {
  const { t } = useTheme();

  return (
    <div
      ref={timelineRef}
      style={{
        flex: 1,
        overflowX: "auto",
        overflowY: "auto",
        position: "relative",
        WebkitOverflowScrolling: "touch",
      }}
      onScroll={syncScroll}
    >
      <div style={{ width: totalChartWidth, position: "relative" }}>
        {/* ── Timeline header ── */}
        <div
          style={{
            height: HEADER_HEIGHT,
            position: "sticky",
            top: 0,
            zIndex: 15,
            background: t.bgSubtle,
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <div
            style={{
              height: 24,
              position: "relative",
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            {majorTicks.map((tick, i) => {
              const left =
                ((tick.getTime() - projectStart) / totalMs) * totalChartWidth;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    color: t.textSecondary,
                    whiteSpace: "nowrap",
                    borderLeft: `1px solid ${t.border}`,
                  }}
                >
                  {ZOOM_CONFIGS[zoom].majorFormat(tick)}
                </div>
              );
            })}
          </div>
          <div style={{ height: 32, position: "relative" }}>
            {ticks.map((tick, i) => {
              const left =
                ((tick.getTime() - projectStart) / totalMs) * totalChartWidth;
              const isWeekend = tick.getDay() === 0 || tick.getDay() === 6;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left,
                    top: 0,
                    bottom: 0,
                    width: colWidthPx,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 4,
                    fontSize: 9.5,
                    fontWeight: isWeekend ? 700 : 400,
                    color: isWeekend ? t.danger : t.textMuted,
                    whiteSpace: "nowrap",
                    borderLeft: `1px solid ${t.border}`,
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
                  {ZOOM_CONFIGS[zoom].tickFormat(tick)}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chart area ── */}
        <div style={{ position: "relative" }}>
          {/* Weekend shading */}
          {weekendShades.map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.left,
                top: 0,
                bottom: 0,
                width: s.width,
                background: `${t.bgMuted}CC`,
                borderLeft: `1px solid ${t.border}`,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          ))}

          {/* Today line */}
          {todayLeft !== null && (
            <div
              style={{
                position: "absolute",
                left: todayLeft,
                top: 0,
                bottom: 0,
                width: 2,
                background: t.danger,
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: -16,
                  background: t.danger,
                  color: t.textInverse,
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "1px 4px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                TODAY
              </div>
            </div>
          )}

          {/* Grid lines */}
          {ticks.map((tick, i) => {
            const left =
              ((tick.getTime() - projectStart) / totalMs) * totalChartWidth;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: t.borderSubtle,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            );
          })}

          {/* Task view bars */}
          {viewMode === "task" &&
            filteredProjects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const pc = projectColorMap[project.id] || t.textMuted;
              const projectRows = allRows.filter(
                (r) => r._projectId === project.id,
              );
              const hasFilters = hasProjectFilters(project.id);

              return (
                <React.Fragment key={project.id}>
                  <div
                    style={{
                      height: ROW_HEIGHT,
                      position: "relative",
                      borderBottom: `1px solid ${t.border}`,
                      background: hasFilters ? t.primaryBgSubtle : t.bgSubtle,
                    }}
                  />

                  {isExpanded && (
                    <div
                      style={{
                        height: SUB_HEADER_HEIGHT,
                        position: "relative",
                        borderBottom: `1px solid ${t.border}`,
                        background: t.bgSubtle,
                      }}
                    />
                  )}

                  {isExpanded &&
                    projectRows.map((row) => {
                      const plannedBar = getBarPosition(
                        row.plannedStart,
                        row.plannedStop,
                      );
                      const actualBar = getBarPosition(
                        row.actualStart,
                        row.actualStop,
                      );
                      const sc = getStatusColor(row.status, t);
                      const isRunning =
                        String(row.status || "")
                          .toLowerCase()
                          .trim() === "running";

                      return (
                        <div
                          key={row.id}
                          style={{
                            height: ROW_HEIGHT,
                            position: "relative",
                            borderBottom: `1px solid ${t.borderSubtle}`,
                            minHeight: 24,
                            paddingBottom: 4,
                          }}
                        >
                          {/* Planned bar */}
                          {plannedBar && (
                            <div
                              ref={(el) => {
                                if (el) barsRef.current.set(row.id, el);
                                else barsRef.current.delete(row.id);
                              }}
                              onClick={(e) => handleBarClick(e, row)}
                              title={`${row.task} — ${row.status || "Pending"} (Planned)`}
                              style={{
                                position: "absolute",
                                left: plannedBar.left,
                                width: plannedBar.width,
                                top: row.depth === 0 ? 6 : 8,
                                height: row.depth === 0 ? 18 : 14,
                                background: sc.bar,
                                borderRadius: 3,
                                cursor: "pointer",
                                zIndex: 5,
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: 6,
                                overflow: "hidden",
                                boxShadow: t.shadowSm,
                                transition: "opacity 0.12s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "0.85";
                                setHoveredRowId(row.id);
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                                setHoveredRowId(null);
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 3,
                                  background: pc,
                                  borderRadius: "3px 0 0 3px",
                                }}
                              />
                              {isRunning && (
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                                    animation: "ganttPulse 2s infinite",
                                    borderRadius: 3,
                                  }}
                                />
                              )}
                              {plannedBar.width > 50 && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: "#fff",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    paddingLeft: 4,
                                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                    zIndex: 1,
                                    position: "relative",
                                  }}
                                >
                                  {row.task || row.module}{" "}
                                  <span
                                    style={{
                                      fontWeight: 400,
                                      opacity: 0.8,
                                    }}
                                  >
                                    (Planned)
                                  </span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actual bar */}
                          {actualBar &&
                            (() => {
                              const delayed = isDelayed(row);
                              return (
                                <div
                                  onClick={(e) => handleBarClick(e, row)}
                                  title={`${row.task} — Actual${delayed ? " ⚠ DELAYED" : ""}`}
                                  style={{
                                    position: "absolute",
                                    left: actualBar.left,
                                    width: actualBar.width,
                                    bottom: row.depth === 0 ? 2 : 4,
                                    height: row.depth === 0 ? 14 : 10,
                                    background: delayed
                                      ? "rgba(239,68,68,0.2)"
                                      : "rgba(34,197,94,0.2)",
                                    border: `2px solid ${delayed ? "#EF4444" : "#22C55E"}`,
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    zIndex: 6,
                                    boxShadow: t.shadowSm,
                                    display: "flex",
                                    alignItems: "center",
                                    paddingLeft: 6,
                                    overflow: "hidden",
                                  }}
                                >
                                  {actualBar.width > 50 && (
                                    <span
                                      style={{
                                        fontSize: 8.5,
                                        fontWeight: 600,
                                        color: delayed ? "#DC2626" : "#15803D",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        zIndex: 1,
                                        position: "relative",
                                      }}
                                    >
                                      {row.task || row.module}{" "}
                                      <span
                                        style={{
                                          fontWeight: 400,
                                          opacity: 0.8,
                                        }}
                                      >
                                        (Actual){delayed && " ⚠ DELAYED"}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                          {/* No dates */}
                          {!plannedBar && !actualBar && (
                            <div
                              style={{
                                position: "absolute",
                                left: 8,
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: 10,
                                color: t.textDisabled,
                                fontStyle: "italic",
                              }}
                            >
                              No dates
                            </div>
                          )}
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}

          {/* Resource view bars */}
          {viewMode === "resource" &&
            resourceViewData.map((res) => {
              const rowHeight = ROW_HEIGHT * res.laneCount;
              const LANE_HEIGHT = ROW_HEIGHT;
              const BAR_HEIGHT_PLANNED = 16;
              const BAR_HEIGHT_ACTUAL = 10;
              const BAR_GAP = 2;

              return (
                <div
                  key={res.userId}
                  style={{
                    height: rowHeight,
                    position: "relative",
                    borderBottom: `1px solid ${t.borderSubtle}`,
                  }}
                >
                  {res.laneCount > 1 &&
                    Array.from({ length: res.laneCount - 1 }, (_, i) => (
                      <div
                        key={`lane-${i}`}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: (i + 1) * LANE_HEIGHT,
                          height: 1,
                          background: t.borderSubtle,
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      />
                    ))}

                  {res.tasks.map((row) => {
                    const plannedBar = getBarPosition(
                      row.plannedStart,
                      row.plannedStop,
                    );
                    const actualBar = getBarPosition(
                      row.actualStart,
                      row.actualStop,
                    );
                    const delayed = isDelayed(row);
                    const sc = delayed
                      ? getDelayedColor(t)
                      : getStatusColor(row.status, t);
                    const pc = projectColorMap[row._projectId] || t.textMuted;
                    const lane = row._lane || 0;
                    const laneTop = lane * LANE_HEIGHT;

                    return (
                      <React.Fragment key={row.id}>
                        {plannedBar && (
                          <div
                            ref={(el) => {
                              if (el) barsRef.current.set(row.id, el);
                              else barsRef.current.delete(row.id);
                            }}
                            onClick={(e) => handleBarClick(e, row)}
                            title={`${row.task} — ${row._projectName} (Planned)`}
                            style={{
                              position: "absolute",
                              left: plannedBar.left,
                              width: plannedBar.width,
                              top: laneTop + 6,
                              height: BAR_HEIGHT_PLANNED,
                              background: sc.bar,
                              borderRadius: 3,
                              cursor: "pointer",
                              zIndex: 5,
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: 6,
                              overflow: "hidden",
                              boxShadow: t.shadowSm,
                              transition: "opacity 0.12s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "0.85";
                              setHoveredRowId(row.id);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "1";
                              setHoveredRowId(null);
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 3,
                                background: pc,
                                borderRadius: "3px 0 0 3px",
                              }}
                            />
                            {plannedBar.width > 50 && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 600,
                                  color: "#fff",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  paddingLeft: 4,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                  zIndex: 1,
                                  position: "relative",
                                }}
                              >
                                {row.task}{" "}
                                <span
                                  style={{
                                    fontWeight: 400,
                                    opacity: 0.8,
                                  }}
                                >
                                  (Planned)
                                </span>
                              </span>
                            )}
                          </div>
                        )}

                        {actualBar &&
                          (() => {
                            const isTaskDelayed = isDelayed(row);
                            return (
                              <div
                                onClick={(e) => handleBarClick(e, row)}
                                title={`${row.task} — ${row._projectName} (Actual)${isTaskDelayed ? " ⚠ DELAYED" : ""}`}
                                style={{
                                  position: "absolute",
                                  left: actualBar.left,
                                  width: actualBar.width,
                                  top:
                                    laneTop + 6 + BAR_HEIGHT_PLANNED + BAR_GAP,
                                  height: BAR_HEIGHT_ACTUAL,
                                  background: isTaskDelayed
                                    ? "rgba(239,68,68,0.2)"
                                    : "rgba(34,197,94,0.2)",
                                  border: `2px solid ${isTaskDelayed ? "#EF4444" : "#22C55E"}`,
                                  borderRadius: 3,
                                  cursor: "pointer",
                                  zIndex: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 6,
                                  overflow: "hidden",
                                }}
                              >
                                {actualBar.width > 50 && (
                                  <span
                                    style={{
                                      fontSize: 8.5,
                                      fontWeight: 600,
                                      color: isTaskDelayed
                                        ? "#DC2626"
                                        : "#15803D",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      zIndex: 1,
                                      position: "relative",
                                    }}
                                  >
                                    {row.task}{" "}
                                    <span
                                      style={{
                                        fontWeight: 400,
                                        opacity: 0.8,
                                      }}
                                    >
                                      (Actual)
                                      {isTaskDelayed && " ⚠ DELAYED"}
                                    </span>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {/* Dependency arrows overlay */}
        {showDependencies && dependencyArrows.length > 0 && (
          <DependencyArrows
            arrows={dependencyArrows}
            width={totalChartWidth}
            height={totalChartHeight}
            highlightedRowId={hoveredRowId}
          />
        )}
      </div>
    </div>
  );
}
