import React, { useMemo, useState, useEffect } from "react";
import AccordionSection from "./AccordionSection";

const GANTT_CELL_WIDTH = 46;
const GANTT_NAME_WIDTH = 195;
const GANTT_BAR_HEIGHT = 20;
const OCC_WEEK_HEADER_HEIGHT = 38;
const OCC_DAY_HEADER_HEIGHT = 46;
const OCC_SCROLL_MAX_HEIGHT = 520;
const RESOURCE_DAILY_CAPACITY_HRS = 8;

// Default theme tokens fallback
const defaultThemeTokens = {
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

function isWeekend(d) {
  return d.getDay() === 0 || d.getDay() === 6;
}

/**
 * UnallocatedResourceOccupancy Component
 * Receives the response from getUnallocatedResources() function
 * and renders all unallocated resources with light red chip tags and 100% free capacity bars.
 */
function UnallocatedResourceOccupancy({
  weeks = [],
  getUnallocatedResources,
  unallocatedUsers: initialUsers = null,
  capacityHrs = RESOURCE_DAILY_CAPACITY_HRS,
  showHover = () => {},
  hideHover = () => {},
  t: customTheme = {},
  isDark = false,
  title = "Unallocated Resources",
}) {
  const t = useMemo(() => ({ ...defaultThemeTokens, ...customTheme }), [customTheme]);
  const todayKey = new Date().toDateString();

  const [users, setUsers] = useState(initialUsers || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync if users are passed directly via props
  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers);
    }
  }, [initialUsers]);

  // Execute getUnallocatedResources function without raw fetch calls
  useEffect(() => {
    if (initialUsers !== null) return;
    if (typeof getUnallocatedResources !== "function") return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getUnallocatedResources();
        
        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response && Array.isArray(response.data)) {
          list = response.data;
        } else if (response && Array.isArray(response.users)) {
          list = response.users;
        }

        if (isMounted) {
          setUsers(list);
        }
      } catch (err) {
        console.warn("Failed to execute getUnallocatedResources:", err);
        if (isMounted) {
          setError(err?.message || "Failed to load unallocated resources");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [getUnallocatedResources, initialUsers]);

  // Flatten days and compute week boundaries
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

  function activateDayCell(e, userName, userId, date) {
    const rect = e.currentTarget.getBoundingClientRect();
    const side = window.innerWidth - rect.right < 320 ? "left" : "right";
    showHover({
      x: side === "left" ? rect.left : rect.right,
      y: rect.top + rect.height / 2,
      side,
      kind: "occupancy",
      entry: {
        resourceName: userName,
        userId: userId,
        date: date,
        hours: 0,
        capacityHrs,
        tasks: [],
        free: capacityHrs,
        isUnallocated: true,
      },
    });
  }

  const weekOverlay = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  // Light red chip color styling (adapts to light/dark mode)
  const chipBg = isDark ? "rgba(239, 68, 68, 0.18)" : "#fef2f2";
  const chipBorder = isDark ? "rgba(239, 68, 68, 0.45)" : "#fecaca";
  const chipTextColor = isDark ? "#fca5a5" : "#b91c1c";
  const chipDotColor = isDark ? "#f87171" : "#ef4444";

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: t.textSecondary, fontSize: 13 }}>
        Loading unallocated resources...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#ef4444", fontSize: 13 }}>
        {error}
      </div>
    );
  }

  if (!users.length || !days.length) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: t.emptyText, fontSize: 13 }}>
        No unallocated resources to display.
      </div>
    );
  }

  return (
    <AccordionSection
  title={
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>Unallocated Resources</span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: chipBg,
            color: chipTextColor,
            border: `1px solid ${chipBorder}`,
            borderRadius: 999,
            padding: "1px 8px",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: chipDotColor,
              display: "inline-block",
            }}
          />
          {users.length}
        </span>
      </span>
  }
  t={t}
  defaultOpen
>
    <div
    //  style={{ marginTop: 16 }}
     >
      {/* Top Header Summary */}
      {/* <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary }}>
            {title}
          </span> */}
          {/* Top count chip in light red */}
          {/* <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: chipBg,
              color: chipTextColor,
              border: `1px solid ${chipBorder}`,
              borderRadius: 999,
              padding: "1px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: chipDotColor,
                display: "inline-block",
              }}
            />
            {users.length}
          </span>
          <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>
            • {days.length} day{days.length !== 1 ? "s" : ""} • {capacityHrs}h daily capacity (100% Free)
          </span>
        </div>
      </div> */}

      {/* Main Gantt Grid Card */}
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
          {/* Sticky Week Header */}
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
                        fontSize: 8,
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

          {/* Sticky Day / Date Header */}
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

          {/* Unallocated Resource Rows - Every Bar is 100% Free Capacity */}
          {users.map((user, ri) => {
            const userName = user.UserName || user.userName || user.name || `User ${ri + 1}`;
            const userId = user.UserId || user.userId || user.id || "";
            const rowBg = ri % 2 === 0 ? t.occRowEven : t.occRowOdd;
            const isLastRow = ri === users.length - 1;

            return (
              <div
                key={userId || `${userName}-${ri}`}
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${t.gridLine}`,
                  background: rowBg,
                  alignItems: "center",
                }}
              >
                {/* Resource Name Column (Sticky Left) */}
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
                  {/* Initials Circle */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#94a3b8",
                      color: "#fff",
                      fontSize: 9.5,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "1px dashed #64748b",
                    }}
                  >
                    {initialsFor(userName)}
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
                      title={`${userName} (${userId})`}
                    >
                      {userName}
                    </div>

                    {/* Light Red Chip for Unallocated Tag */}
                    <div style={{ marginTop: 3 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3.5,
                          padding: "1.5px 6px",
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                          color: chipTextColor,
                          background: chipBg,
                          border: `1px solid ${chipBorder}`,
                          lineHeight: 1,
                          letterSpacing: "0.2px",
                        }}
                      >
                        <span
                          style={{
                            width: 4.5,
                            height: 4.5,
                            borderRadius: "50%",
                            background: chipDotColor,
                            display: "inline-block",
                          }}
                        />
                        Unallocated
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day Timeline Cells: Every Bar is Free Capacity */}
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

                    let cellBoxShadow = "none";
                    if (isT) {
                      if (isLastRow) {
                        cellBoxShadow = `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}, inset 0 -2px 0 0 ${t.earlyColor}`;
                      } else {
                        cellBoxShadow = `inset 2px 0 0 ${t.earlyColor}, inset -2px 0 0 ${t.earlyColor}`;
                      }
                    }

                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => activateDayCell(e, userName, userId, d)}
                        onMouseLeave={hideHover}
                        onClick={(e) => {
                          e.stopPropagation();
                          activateDayCell(e, userName, userId, d);
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
                        {/* Free Capacity Bar (100% Free: 8h) */}
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
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              fontSize: 8,
                              fontWeight: 700,
                              color: t.occFreeLabel,
                              whiteSpace: "nowrap",
                              padding: "0 2px",
                              pointerEvents: "none",
                              zIndex: 2,
                            }}
                          >
                            {fmtDurationCompact(capacityHrs)}
                          </div>
                        </div>

                        {/* Today indicator dot */}
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

      {/* Legend */}
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
          Free capacity (100% Available)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3.5,
              padding: "1px 6px",
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 700,
              color: chipTextColor,
              background: chipBg,
              border: `1px solid ${chipBorder}`,
            }}
          >
            <span
              style={{
                width: 4.5,
                height: 4.5,
                borderRadius: "50%",
                background: chipDotColor,
                display: "inline-block",
              }}
            />
            Unallocated
          </span>
          Unallocated resource
        </span>
      </div>
    </div>
    </AccordionSection> 
  );
}

export default UnallocatedResourceOccupancy;
