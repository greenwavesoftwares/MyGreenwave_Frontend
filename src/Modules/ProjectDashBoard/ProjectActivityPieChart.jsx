import React, { useMemo } from "react";

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function parseDate(str) { if (!str) return null; return new Date(str); }

function plannedDurationHrs(row) { 
  if (typeof row.durationHrs === "number") return row.durationHrs; 
  return (parseDate(row.plannedStop) - parseDate(row.plannedStart)) / 3600000; 
}

function actualDurationHrs(row) {
  if (!row.actualStart) return null;
  const s = parseDate(row.actualStart);
  const e = row.actualStop
    ? parseDate(row.actualStop)
    : (row.status === "running" || row.status === "paused")
      ? new Date(s.getTime() + 3600000)
      : null;
  if (!e) return null;
  return (e - s) / 3600000;
}

function fmtDurationCompact(h) {
  if (h == null) return "";
  if (h < 1) return `${Math.round(h * 60)}m`;
  const r = Math.round(h * 10) / 10;
  return `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}h`;
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

function activityProgressPct(e) {
  if (e.finished) return 100;
  if (!e.started || !e.plannedHrs) return 0;
  return clamp(Math.round((e.actualHrs / e.plannedHrs) * 100), 0, 99);
}

function activityColor(i) {
  const GOLDEN_ANGLE = 137.508;
  const hue = Math.round((i * GOLDEN_ANGLE) % 360);
  return `hsl(${hue}, 60%, 52%)`;
}

function activityColorPending(i) {
  const GOLDEN_ANGLE = 137.508;
  const hue = Math.round((i * GOLDEN_ANGLE) % 360);
  return `hsl(${hue}, 35%, 88%)`;
}

/**
 * Project Activity Pie Chart component
 */
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
    .flatMap((a) => `${a.color} ${a.start}% ${a.completedEnd}%`, `${a.pendingColor} ${a.completedEnd}% ${a.end}%`)
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

export default ProjectActivityPieChart;
