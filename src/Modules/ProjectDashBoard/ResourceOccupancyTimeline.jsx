import React, { useMemo } from "react";

const GANTT_CELL_WIDTH = 46;
const GANTT_NAME_WIDTH = 195;
const GANTT_BAR_HEIGHT = 20;
const OCC_WEEK_HEADER_HEIGHT = 38;
const OCC_DAY_HEADER_HEIGHT = 46;
const OCC_SCROLL_MAX_HEIGHT = 520;
const RESOURCE_DAILY_CAPACITY_HRS = 8;

function initialsFor(n) {
  if (!n) return "?";
  const p = n.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

function fmtDurationCompact(h) {
  if (h == null) return "";
  if (h < 1) return `${Math.round(h * 60)}m`;
  const r = Math.round(h * 10) / 10;
  return `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}h`;
}

function fmtDuration(h) {
  if (h == null) return "—";
  let totalMinutes = Math.round(h * 60);
  const days = Math.floor(totalMinutes / (24 * 60)); totalMinutes -= days * 24 * 60;
  const hrs = Math.floor(totalMinutes / 60); const mins = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hrs) parts.push(`${hrs}h`);
  if (mins || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(" ");
}

function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }

function toMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function getOccupancyColor(hours) {
  if (hours < 4) return "#22c55e";      // < 4 h  – green
  if (hours < 5) return "#84cc16";      // 4-5 h  – lime
  if (hours < 6) return "#eab308";      // 5-6 h  – yellow
  if (hours < 6.75) return "#f97316";   // 6 h    – orange
  if (hours < 7.75) return "#ea580c";   // 7 h    – dark orange
  return "#dc2626";                     // 8 h+   – red
}

function parseDate(str) { if (!str) return null; return new Date(str); }

/**
 * Resource Occupancy Timeline component
 */
function ResourceOccupancyTimeline({
  weeks,
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
  
  const { days, weekBoundaries } = useMemo(() => {
    const flat = [];
    const boundaries = [];
    let count = 0;
    (weeks || []).forEach((w) => {
      const real = (w || []).filter(Boolean);
      flat.push(...real);
      count += real.length;
      if (real.length > 0) boundaries.push(count);
    });
    return { days: flat, weekBoundaries: boundaries };
  }, [weeks]);

  function weekIndexForDay(i) {
    for (let w = 0; w < weekBoundaries.length; w++) {
      if (i < weekBoundaries[w]) return w;
    }
    return Math.max(weekBoundaries.length - 1, 0);
  }

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
        m[name][k] = {
          occupied: occ,
          free: fr,
          tasks: data ? data.tasks : [],
          totalHours: th,
          hourly: data ? data.hourly : new Array(8).fill(0),
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
      },
    });
  }

  if (!resources.length || !days.length) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: t.emptyText, fontSize: 13 }}>
        No resource activity to show for this selection.
      </div>
    );
  }

  const weekOverlay = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>
          {resources.length} resource{resources.length !== 1 ? "s" : ""} •
          {days.length} day{days.length !== 1 ? "s" : ""} • {capacityHrs}h daily capacity
        </div>
      </div>
      
      <div
        style={{
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10,
          background: t.cardBg,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "auto",
          maxHeight: OCC_SCROLL_MAX_HEIGHT,
          position: "relative",
        }}
      >
        <div
          style={{
            width: GANTT_NAME_WIDTH + chartWidth,
            minWidth: "100%",
            position: "relative",
          }}
        >
          {/* Sticky week header */}
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
                width: GANTT_NAME_WIDTH,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                top: 0,
                zIndex: 35,
                background: t.occHeaderBg,
                borderRight: `1px solid ${t.gridLineMd}`,
                height: OCC_WEEK_HEADER_HEIGHT,
              }}
            />
            <div
              style={{
                display: "flex",
                width: chartWidth,
                minHeight: OCC_WEEK_HEADER_HEIGHT,
              }}
            >
              {weekBoundaries.map((end, wi) => {
                const start = wi === 0 ? 0 : weekBoundaries[wi - 1];
                const weekDaysCount = end - start;
                if (weekDaysCount <= 0) return null;
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
                        letterSpacing: "0.4px",
                        textTransform: "uppercase",
                        color: t.btnPrimary,
                        background: `${t.btnPrimary}1A`,
                        border: `1px solid ${t.btnPrimary}40`,
                        borderRadius: 999,
                        padding: "3px 10px",
                        boxShadow: `0 1px 2px ${t.btnPrimary}14`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Week {wi + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky day/date header */}
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: OCC_WEEK_HEADER_HEIGHT,
              zIndex: 29,
              background: t.occHeaderBg,
              borderBottom: `1px solid ${t.gridLineMd}`,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                width: GANTT_NAME_WIDTH,
                flexShrink: 0,
                position: "sticky",
                left: 0,
                top: OCC_WEEK_HEADER_HEIGHT,
                zIndex: 34,
                background: t.occHeaderBg,
                padding: "8px 12px 4px",
                fontSize: 10,
                fontWeight: 700,
                color: t.textSecondary,
                borderRight: `1px solid ${t.gridLineMd}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxSizing: "border-box",
                minHeight: OCC_DAY_HEADER_HEIGHT,
              }}
            >
              RESOURCE
            </div>
            <div style={{ display: "flex", width: chartWidth }}>
              {days.map((d, i) => {
                const isT = d.toDateString() === todayKey;
                const wIdx = weekIndexForDay(i);
                const isAltWeek = wIdx % 2 === 1;
                const isLastInWeek = weekBoundaries[wIdx] - 1 === i;
                const endOfWeek = isLastInWeek && i < days.length - 1;
                const baseBg = isT ? t.occHeaderToday : t.occHeaderBg;
                const bg = isAltWeek
                  ? `linear-gradient(${weekOverlay}, ${weekOverlay}), ${baseBg}`
                  : baseBg;
                const isW = isWeekend(d);

                return (
                  <div
                    key={i}
                    style={{
                      width: GANTT_CELL_WIDTH,
                      flexShrink: 0,
                      textAlign: "center",
                      padding: "4px 1px",
                      borderRight: endOfWeek
                        ? `2px solid ${t.cardBorder}`
                        : i < days.length - 1
                        ? `1px solid ${t.gridLineMd}`
                        : "none",
                      background: bg,
                      boxShadow: isT
                        ? `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}, inset 0 2px 0 0 ${t.earlyColor}`
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: isT ? t.todayText : isW ? t.textMuted : t.textSecondary,
                        lineHeight: 1,
                      }}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isT ? 800 : 700,
                        color: isT ? t.todayText : t.textPrimary,
                        marginTop: 1,
                      }}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable resource rows */}
          {resources.map((resourceName, ri) => {
            const baseColor = resourceColorMap[resourceName] || { actual: "#64748b" };
            const daily = resourceDailyData[resourceName] || {};
            const rowBg = ri % 2 === 0 ? t.occRowEven : t.occRowOdd;

            return (
              <div
                key={resourceName}
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${t.gridLine}`,
                  background: rowBg,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: GANTT_NAME_WIDTH,
                    flexShrink: 0,
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
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
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: t.resNameColor,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.1,
                      }}
                      title={resourceName}
                    >
                      {resourceName}
                    </div>
                  </div>
                </div>
                <div style={{ width: chartWidth, display: "flex", height: 42, alignItems: "center" }}>
                  {days.map((d, di) => {
                    const isT = d.toDateString() === todayKey;
                    const wIdx = weekIndexForDay(di);
                    const isAltWeek = wIdx % 2 === 1;
                    const isLastInWeek = weekBoundaries[wIdx] - 1 === di;
                    const endOfWeek = isLastInWeek && di < days.length - 1;
                    const baseBg = isT
                      ? t.occCellToday
                      : isWeekend(d)
                      ? t.occCellWeekend
                      : t.occCellBg;
                    const bg = isAltWeek
                      ? `linear-gradient(${weekOverlay}, ${weekOverlay}), ${baseBg}`
                      : baseBg;
                    const k = d.toDateString();
                    const data = daily[k] || { occupied: 0, free: capacityHrs, tasks: [], hourly: new Array(8).fill(0) };
                    const occ = data.occupied;
                    const occColor = getOccupancyColor(occ);
                    const fillPercentage = Math.min((occ / capacityHrs) * 100, 100);

                    let cellBoxShadow = "none";
                    if (isT) {
                      if (ri === resources.length - 1) {
                        cellBoxShadow = `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}, inset 0 -2px 0 0 ${t.earlyColor}`;
                      } else {
                        cellBoxShadow = `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}`;
                      }
                    }

                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => activateDayCell(e, resourceName, d, data)}
                        onMouseLeave={hideHover}
                        onClick={(e) => {
                          e.stopPropagation();
                          activateDayCell(e, resourceName, d, data);
                        }}
                        style={{
                          width: GANTT_CELL_WIDTH,
                          flexShrink: 0,
                          height: "100%",
                          borderRight: endOfWeek
                            ? `2px solid ${t.cardBorder}`
                            : di < days.length - 1
                            ? `1px solid ${t.gridLineMd}`
                            : "none",
                          background: bg,
                          boxShadow: cellBoxShadow,
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
                            border: `1px solid ${t.occFreeBarBorder}`,
                            boxShadow: t.occFreeBarShadow,
                          }}
                        >
                          {occ > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${fillPercentage}%`,
                                background: occColor,
                                borderRadius: "inherit",
                              }}
                            />
                          )}
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              fontSize: 8,
                              fontWeight: 700,
                              color: occ > 0 ? "#1e293b" : t.occFreeLabel,
                              textShadow: occ > 0 ? "0 1px 1.5px rgba(255,255,255,0.55)" : "none",
                              whiteSpace: "nowrap",
                              padding: "0 2px",
                              pointerEvents: "none",
                              zIndex: 2,
                            }}
                          >
                            {fmtDurationCompact(occ > 0 ? occ : data.free)}
                          </div>
                        </div>
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
      
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 10,
          flexWrap: "wrap",
          fontSize: 11,
          color: t.legendText,
          paddingLeft: 2,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
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
          <span
            style={{
              width: 26,
              height: 10,
              background: "linear-gradient(90deg,#22c55e,#84cc16,#eab308,#f97316,#dc2626)",
              borderRadius: 3,
            }}
          />
          Occupied (load)
        </span>
      </div>
    </div>
  );
}

export default ResourceOccupancyTimeline;
