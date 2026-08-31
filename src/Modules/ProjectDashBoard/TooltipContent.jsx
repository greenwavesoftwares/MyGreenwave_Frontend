import React from "react";
import TaskStatusBadge from "./TaskStatusBadge";

function parseDate(str) { if (!str) return null; return new Date(str); }

function fmtTime(date) { if (!date) return "--:--"; return date?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

function fmtDate(date) { return date?.toLocaleDateString([], { month: "short", day: "numeric" }); }

function fmtDateTime(date) { if (!date) return "—"; return date?.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

function fmtDuration(h) {
  if (h == null || Number.isNaN(h)) return "—";
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
  if (h == null || Number.isNaN(h)) return "";
  if (h < 1) return `${Math.round(h * 60)}m`;
  const r = Math.round(h * 10) / 10;
  return `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}h`;
}

function finishedEarlyLateInfo(row) {
  const EARLY_LATE_THRESHOLD_HRS = 0.25;
  if (!row?.actualStop) return null;
  const p = (typeof row?.durationHrs === "number" ? row?.durationHrs : (parseDate(row?.plannedStop) - parseDate(row?.plannedStart)) / 3600000) || 0;
  const a = row?.actualStart ? (row?.actualStop ? (parseDate(row?.actualStop) - parseDate(row?.actualStart)) / 3600000 : null) : null;
  if (a == null) return null;
  const d = a - p;
  if (d < -EARLY_LATE_THRESHOLD_HRS) return { type: "early", diff: Math.abs(d) };
  if (d > EARLY_LATE_THRESHOLD_HRS) return { type: "late", diff: d };
  return { type: "ontime", diff: d };
}

function plannedDurationHrs(row) {
  if (typeof row?.durationHrs === "number" && !Number.isNaN(row?.durationHrs)) return row?.durationHrs;
  const s = parseDate(row?.plannedStart);
  const e = parseDate(row?.plannedStop);
  if (!s || !e || Number.isNaN(s?.getTime()) || Number.isNaN(e?.getTime())) return null;
  return (e - s) / 3600000;
}

function actualDurationHrs(row) {
  if (!row?.actualStart) return null;
  const s = parseDate(row?.actualStart);
  const e = row?.actualStop
    ? parseDate(row?.actualStop)
    : (row?.status === "running" || row?.status === "paused")
      ? new Date(s?.getTime() + 3600000)
      : null;
  if (!e) return null;
  return (e - s) / 3600000;
}

function toMidnight(d) { return new Date(d?.getFullYear(), d?.getMonth(), d?.getDate()); }

/**
 * Tooltip content component that renders different content based on hover kind
 */
function TooltipContent({ entry, kind, t }) {
  if (!entry) return null;
  console.log("TooltipContent entry:", entry, "kind:", kind);
  if (kind === "gantt-task") {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
          {entry?.taskName}
        </div>
        <div style={{ color: t?.ttMuted, marginBottom: 4 }}>
          {entry?.resourceName}
        </div>
        <div style={{ fontSize: 12, marginBottom: 6 }}>
          {parseDate(entry?.startDate)?.toLocaleDateString([], { month: "short", day: "numeric" })}
          {parseDate(entry?.startDate)?.getTime() !== parseDate(entry?.endDate)?.getTime() && (
            <> &ndash; {parseDate(entry?.endDate)?.toLocaleDateString([], { month: "short", day: "numeric" })}</>
          )}
          {" • "}
          <span style={{ fontWeight: 600 }}>
            {entry?.days} day{entry?.days > 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {fmtDuration(entry?.totalHours)}
        </div>
        {entry?.taskRows?.length > 0 && (
          <div style={{ borderTop: `1px solid ${t?.ttDivider}`, paddingTop: 6, fontSize: 11 }}>
            {entry?.taskRows?.map((row, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <div style={{ color: "#cbd5e1" }}>
                  {row?.project} • {row?.status}
                </div>
                <div style={{ fontSize: 10.5 }}>
                  {fmtDateTime(parseDate(row?.plannedStart))} &ndash; {fmtDateTime(parseDate(row?.plannedStop))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (kind === "occupancy") {
    const occupied = entry?.hours ?? 0;
    const free = entry?.free ?? Math.max((entry?.capacityHrs ?? 8) - occupied, 0);
    const over = Math.max(occupied - (entry?.capacityHrs ?? 8), 0);
    const hasTasks = entry?.tasks?.length > 0;

    return (
      <div style={{ minWidth: 240 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: t?.ttText }}>
          {entry?.resourceName}
        </div>
        <div style={{ color: t?.ttMuted, fontSize: 11, marginBottom: 10 }}>
          {parseDate(entry?.date)?.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </div>
        <div
          style={{
            background: t?.ttCardBg,
            borderRadius: 8,
            padding: "8px 10px",
            marginBottom: 10,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: t?.ttOccupiedText, fontWeight: 600, fontSize: 12 }}>
              Occupied
            </span>
            <span style={{ color: t?.ttOccupiedText, fontWeight: 700, fontSize: 14 }}>
              {fmtDuration(occupied)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: t?.ttFreeText, fontWeight: 600, fontSize: 12 }}>
              Free
            </span>
            <span style={{ color: t?.ttFreeText, fontWeight: 700, fontSize: 14 }}>
              {fmtDuration(free)}
            </span>
          </div>
          {over > 0 && (
            <div style={{ color: t?.ttOccupiedText, fontSize: 11, fontWeight: 600, marginTop: 2 }}>
              Over by {fmtDuration(over)}
            </div>
          )}
        </div>
        {hasTasks && (
          <div>
            <div
              style={{
                fontSize: 10,
                color: t?.textSecondary,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Scheduled on this day
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {entry?.tasks?.map((item, idx) => {
                const row = item?.row ?? item;
                const hours = item?.hours ?? row?.dayHours ?? 0;
                const totalPlannedHrs = plannedDurationHrs(row);
                const pS = parseDate(row?.plannedStart);
                const pE = parseDate(row?.plannedStop);
                const aS = parseDate(row?.actualStart);
                const aE = parseDate(row?.actualStop);

                return (
                  <div
                    key={row?.id ?? `${row?.task || "task"}-${idx}`}
                    style={{
                      background: t?.ttCardBg,
                      border: `1px solid ${t?.ttCardBorder}`,
                      borderRadius: 8,
                      padding: "6px 9px",
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: t?.ttChipBg,
                          color: t?.ttChipText,
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 999,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row?.project || "?"}
                      </span>
                      <span
                        style={{
                          color: t?.ttText,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                          minWidth: 80,
                        }}
                      >
                        {row?.task || "Untitled"}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginLeft: "auto",
                        }}
                      >
                        <span
                          style={{
                            color: t?.ttMuted,
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Planned - {fmtDurationCompact(totalPlannedHrs) || "—"}
                        </span>
                        <span
                          style={{
                            color: t?.ttMuted,
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Day's {fmtDurationCompact(hours) || "—"}
                        </span>
                        <TaskStatusBadge status={row?.status} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: t?.ttMuted }}>
                      Planned: {pS ? fmtDateTime(pS) : "—"} &ndash; {pE ? fmtDateTime(pE) : "—"}
                    </div>
                    {aS && (
                      <div style={{ fontSize: 10, color: t?.ttActualColor, marginTop: 1 }}>
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
          <div
            style={{
              marginTop: 4,
              padding: "6px 10px",
              background: t?.ttFreeBg,
              borderRadius: 6,
              color: t?.ttFreeText,
              fontSize: 12,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {"✓"} Free all day
          </div>
        )}
      </div>
    );
  }

  if (kind === "task-day") {
    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry?.taskName}</div>
        <div style={{ color: t?.ttMuted }}>{entry?.resourceName}</div>
        <div style={{ color: t?.ttMuted }}>
          {parseDate(entry?.date)?.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </div>
        <div style={{ marginTop: 6 }}>{fmtDuration(entry?.hours)} on this task</div>
      </div>
    );
  }

  const hrs = (kind === "planned" ? entry?.plannedHrs : entry?.actualHrs) ?? entry?.hours;
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry?.resourceName}</div>
      <div style={{ color: t?.ttMuted }}>
        {kind === "planned" ? "Planned" : "Actual"} &middot; {fmtDuration(hrs)}
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${t?.ttDivider}` }}>
        {entry?.tasks?.map((item) => {
          const row = item?.row ?? item;
          const plannedHrs = item?.plannedHrs ?? row?.dayHours ?? 0;
          const actualHrs = item?.actualHrs ?? row?.actualDurationHrs ?? 0;
          const totalPlannedHrs = plannedDurationHrs(row);
          const p = parseDate(row?.plannedStart);
          const ps = parseDate(row?.plannedStop);
          const a = row?.actualStart ? parseDate(row?.actualStart) : null;
          const as = row?.actualStop ? parseDate(row?.actualStop) : null;
          const info = finishedEarlyLateInfo(row);

          return (
            <div key={row?.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: t?.ttText }}>{row?.task}</div>
              <div style={{ color: t?.ttMuted }}>
                {row?.module} &middot; {row?.project}
              </div>
              <div>
                Planned: {fmtDateTime(p)} &ndash; {fmtDateTime(ps)} ({fmtDuration(plannedHrs)} this day / {fmtDuration(totalPlannedHrs)} total)
              </div>
              <div>
                Actual: {a ? `${fmtDateTime(a)} – ${as ? fmtDateTime(as) : "…"}` : "—"} ({fmtDuration(actualHrs)})
              </div>
              <div>Status: {row?.status}</div>
              {info && info?.type !== "ontime" && (
                <div style={{ color: info?.type === "early" ? t?.earlyColor : t?.lateColor }}>
                  {info?.type === "early"
                    ? `Finished ${fmtDuration(info?.diff)} early`
                    : `Finished ${fmtDuration(info?.diff)} late`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TooltipContent;
