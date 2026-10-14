import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress, Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import activityTrackerApi from "../../Services/activityTrackerApi";
import StatusChip from "./StatusChip";
import { modifyStatus } from "./activityFilterUtils";
import dayjs from "dayjs";
import "./CpmDialog.css";

/* ─────────────────────────────────────────────────────────────
   Critical Path Method (CPM) view for a project's activities.

   WHAT IS CPM?
   CPM finds the longest chain of dependent tasks in a project.
   That chain decides the earliest the project can finish. Any delay
   on a task in that chain delays the whole project ("critical").
   Tasks outside the chain have "slack" (spare time) they can use
   without moving the project end date.

   Input  : a `projectId`. The dialog fetches the activity tree itself with
            activityTrackerApi.getAllActivities(projectId). Nodes carry
            id, name, type, children, dependsOn, durationHrs,
            plannedStart/plannedStop, activityStatus, resourceName.
   Work items : every non-MODULE node that has no children (the
            leaf activities / sub-activities). A dependency that
            points at a parent task is expanded to that task's leaves.
   Units  : hours (the app's working day is 10:00–18:00, so 8h/day).
   ───────────────────────────────────────────────────────────── */

/* ── constants & tiny helpers ── */

const HOURS_PER_DAY = 8; // used only to convert hours → days for display
const NEAR_CRITICAL_HRS = 8; // slack up to one working day = near-critical
const DONE = new Set(["completed", "finished"]); // statuses that count as 100% done
const ACTIVE = new Set(["running", "paused", "redo"]); // statuses that count as "in progress"

// Normalise a status string so comparisons are case-insensitive and null-safe.
const statusKey = (s) => (s || "").toLowerCase();

// Rough progress estimate from status alone (there is no % field):
// done = 100%, in progress = 50%, anything else (pending etc.) = 0%.
const progressOf = (s) =>
  DONE.has(statusKey(s)) ? 1 : ACTIVE.has(statusKey(s)) ? 0.5 : 0;
const isDone = (s) => DONE.has(statusKey(s));

// The human-readable ("modified") status shown everywhere else in the app, e.g.
// Pending -> "Yet to Start" / "Start Due", Running -> "Running Late".
// Same rule as TreeRows.jsx: a running task is judged against its planned stop,
// anything else against its planned start. Falls back to the raw status when
// modifyStatus has no mapping for it (e.g. "redo").
// Note: this is for DISPLAY only. The calculations above keep using the raw status.
const displayStatusOf = (t) => {
  const time = t.status === "Running" ? t.plannedStop : t.plannedStart;
  return modifyStatus(t.status, time) ?? t.status;
};

// Format hours, rounded to 1 decimal, e.g. 7.25 → "7.3h".
const fmtH = (h) => {
  const v = Math.round(h * 10) / 10;
  return `${v}h`;
};
// Format hours as working days, e.g. 20 → "2.5d".
const fmtDays = (h) => {
  const d = h / HOURS_PER_DAY;
  return `${Math.round(d * 10) / 10}d`;
};

// Initials for a resource id, same rule as TreeRows.jsx: "sreepriya.roy@x.com" -> "SR".
const initialsOf = (userId) => {
  if (!userId) return "?";
  const out = String(userId)
    .split("@")[0]
    .split(".")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return out || "?";
};

// Neutral colours used when no colour is available for a resource
// (e.g. the resource has no entry in the parent's colour map yet).
const NO_COLOR = { color: "#3077da", bgColor: "#E2E8F0", border: "#CBD5E1" };

// Look up a resource's colour via the `fetchColor` function the parent passes in
// (the same one the Activities table uses, so a person has the SAME colour in
// both places). Never throws: falls back to a neutral grey.
const colorOf = (fetchColor, resource) =>
  (resource && typeof fetchColor === "function" && fetchColor(resource)) || NO_COLOR;

/* ── CPM engine ──
   Takes the module/activity tree and returns:
     list            – all work items with computed CPM valuessss, in dependency order
     map             – the same items keyed by id
     total           – project duration in hours (length of the critical path)
     skipped         – number of items dropped because of a dependency cycle
     dependencyCount – total number of dependency links found
   Computed per task: es/ef (earliest start/finish), ls/lf (latest start/finish),
   slack, critical (boolean) and level (column in the network diagram). */
function buildCpm(modules) {
  // `modules` = top-level array from the API. Each node may have `children`.

  // Step 1: flatten the tree into a single array, remembering inherited dependencies.
  const all = [];
  // `all` will hold every node (modules, activities, sub-activities) in one flat list.

  // A dependency set on a parent task also applies to its sub-activities,
  // so each node remembers the dependsOn ids it inherits from its ancestors.
  const inherited = new Map();
  // Map: node id -> array of dependency ids inherited from its ancestors.
  // Map (not a plain object) because it is built for id -> value lookups with .get/.set.

  const walk = (nodes, inheritedDeps) =>
    // Recursive visitor. `inheritedDeps` = deps handed down from the parent node.
    (nodes || []).forEach((n) => {
      // `nodes || []` avoids a crash when a leaf has no `children`;
      // an empty array loops zero times, which is what ends the recursion.
      all.push(n);
      // Add the current node to the flat list.
      inherited.set(n.id, inheritedDeps);
      // Store what this node inherits (NOT its own dependsOn).
      // Children inherit everything the parent inherited plus the parent's own dependsOn.
      walk(n.children, [...inheritedDeps, ...(n.dependsOn || [])]);
      // Recurse into children. Spread builds a NEW array so siblings never share
      // (and accidentally mutate) one list.
    });
  walk(modules, []);
  // Start the walk at the top level. Nothing is inherited at the root, so [].
  console.log("All:::",all)
  // Debug output: the flattened list. Remove when done.
  console.log("Inherited:::",inherited)
  // Debug output: the inherited map. Remove when done.

  const byId = new Map(all.map((n) => [n.id, n]));
  // Fast id -> node lookup. all.map turns each node into an [id, node] pair,
  // and new Map(pairs) builds the table. Avoids searching `all` every time.

  // Resolve a node to its leaf ids (a parent task stands for all of its leaves).
  const leafIds = (n) =>
    // Recursive. Returns the ids of every leaf under a node.
    n.children?.length ? n.children.flatMap(leafIds) : [n.id];
  // Has children -> call leafIds on each child and merge the id arrays into one flat array.
  // No children (it is a leaf) -> return just its own id, wrapped in an array.
  // Needed because only leaves have durations: "depends on a parent" must mean
  // "depends on all of that parent's leaves".

  // Step 2: pick the "work items" – leaf nodes that are not MODULEs.
  // Only these have real durations and take part in the calculation.
  const work = all.filter((n) => n.type !== "MODULE" && !n.children?.length);
  // Keep nodes that are not modules AND have no children. Containers have no duration of their own.
  const workIds = new Set(work.map((n) => n.id));
  // Set of work-item ids for fast "is this a real task?" checks (workIds.has(id)) later.

  // Duration in hours: use durationHrs if set, otherwise fall back to
  // the gap between plannedStart and plannedStop. Missing/negative → 0.
  const durationOf = (n) => {
    // Helper that returns one task's duration in hours. A function because it is called per task.
    let d = Number(n.durationHrs);
    // Convert to a number (null -> 0, undefined -> NaN). `let` because it may be reassigned below.
    if (!(d > 0)) {
      // Not a positive number (0, NaN, negative) -> use the fallback.
      // `!(d > 0)` also catches NaN, which `d <= 0` would miss.
      const diff = dayjs(n.plannedStop).diff(dayjs(n.plannedStart), "minute") / 60;
      // Gap between planned start and stop in minutes, divided by 60 to get hours.
      // Minutes are used so partial hours (e.g. 90 min) are not truncated.
      d = diff > 0 ? diff : 0;
      // Keep only a positive gap. Negative or invalid dates become 0.
    }
    return Math.round(d * 100) / 100;
    // Round to 2 decimals to avoid floating-point noise (e.g. 0.30000000000000004).
  };

  // Step 3: build a normalised task record for each work item,
  // with its list of predecessor (dependency) ids.
  const map = {};
  // Main store: task id -> task record. Later passes add es/ef/ls/lf/slack to these records.
  let dependencyCount = 0;
  // Running total of dependency links, returned for the UI. `let` because it is incremented.
  work.forEach((n) => {
    // Process each work item one at a time.
    const deps = [
      // Set removes duplicates (the same predecessor can arrive via several paths).
      // Duplicates would inflate `indeg` later and break the topological sort.
      ...new Set(
        // Combine inherited deps (from ancestors) with the task's own deps,
        // then expand each to its leaf work items.
        [...(inherited.get(n.id) || []), ...(n.dependsOn || [])].flatMap((depId) => {
          // Merge both lists (|| [] handles missing values), then convert each dep id into leaf ids.
          const target = byId.get(depId);
          // Find the node that this dependency id points to.
          return target ? leafIds(target) : [];
          // Found -> expand to its leaves (a module/parent becomes all its leaf tasks).
          // Not found (stale or deleted id) -> return [] so it is ignored.
        }),
      ),
      // Keep only real work items, and never let a task depend on itself.
    ].filter((id) => workIds.has(id) && id !== n.id);
    // workIds.has(id): drops ids that are modules or unknown.
    // id !== n.id: drops self-dependency (a one-task cycle).
    dependencyCount += deps.length;
    // Add this task's final dependency count to the total.
    map[n.id] = {
      // A separate record so CPM can add fields without mutating your original API objects.
      id: n.id,
      // Task id.
      name: n.name || "(unnamed)",
      // Display name with a fallback.
      resource: n.resource || "",
      // Assigned person; empty string if none.
      status: n.activityStatus || "Pending",
      // Status with a default.
      plannedStart: n.plannedStart,
      // Kept for display only.
      plannedStop: n.plannedStop,
      // Kept for display only.
      dur: durationOf(n),
      // Duration in hours. CPM uses this.
      deps,
      // Predecessor ids. CPM uses this.
    };
  });

  // Step 4: topological sort (Kahn's algorithm).
  // This orders tasks so every task comes after all its predecessors.
  // Tasks that can never be reached belong to a circular dependency.
  const succ = {}; // successors: task id → ids of tasks that depend on it
  // Reverse of `deps`. Needed for the sort and the backward pass.
  const indeg = {}; // in-degree: how many unresolved predecessors a task has
  // A countdown per task. A task is ready when it reaches 0.
  Object.values(map).forEach((t) => {
    // Loop over every task record.
    succ[t.id] = [];
    // Start with an empty successor list.
    indeg[t.id] = t.deps.length;
    // Starting countdown = number of predecessors.
  });
  // This loop must finish BEFORE the next one, so every succ[d] already exists when pushed to.
  Object.values(map).forEach((t) => t.deps.forEach((d) => succ[d].push(t.id)));
  // For each arrow d -> t, record t as a successor of d.
  const order = [];
  // Result: task ids in a valid processing order.
  // Start with tasks that have no predecessors.
  const queue = Object.keys(map).filter((id) => indeg[id] === 0);
  // Tasks with in-degree 0 are ready immediately, so they seed the queue.
  while (queue.length) {
    // Keep going while there are ready tasks (0 is falsy, so the loop ends when empty).
    const id = queue.shift();
    // Take the first ready task (first in, first out).
    order.push(id);
    // Place it in the final order. Safe, because all its predecessors were placed earlier.
    // "Remove" this task: its successors now wait on one fewer predecessor.
    succ[id].forEach((s) => {
      // Visit every task that was waiting on the one just placed.
      if (--indeg[s] === 0) queue.push(s);
      // Prefix -- decrements first and returns the NEW value.
      // When it hits 0 all predecessors are placed, so `s` is ready; push it exactly once.
    });
  }
  // Anything not in `order` is stuck in a cycle and is excluded from results.
  const skipped = Object.keys(map).length - order.length;
  // Total tasks minus placed tasks = tasks in (or downstream of) a cycle.
  // Returned so the UI can warn the user.

  // Step 5: FORWARD PASS – earliest times, walking from start to end.
  // ES (earliest start) = latest EF among predecessors (0 if none).
  // EF (earliest finish) = ES + duration.
  order.forEach((id) => {
    // Walk in topological order, so every predecessor already has `ef` and `level`.
    const t = map[id];
    // Shorthand for this task's record. Objects are by reference, so changes to `t` update `map`.
    t.es = t.deps.length ? Math.max(...t.deps.map((d) => map[d].ef)) : 0;
    // Has predecessors -> map their ids to their EFs and take the max (must wait for the slowest).
    // No predecessors -> 0 (also avoids Math.max() returning -Infinity on an empty list).
    t.ef = t.es + t.dur;
    // Earliest finish = earliest start + duration.
    // level = column index for the network diagram (longest chain of predecessors).
    t.level = t.deps.length ? 1 + Math.max(...t.deps.map((d) => map[d].level)) : 0;
    // One column right of the deepest predecessor; 0 if none. Used only for drawing, not CPM.
  });
  // Project duration = the latest finish of any task.
  const total = order.length ? Math.max(...order.map((id) => map[id].ef)) : 0;
  // Largest EF across all tasks. Empty check avoids -Infinity.
  // Needed as the deadline for tasks that have no successors in the backward pass.

  // Step 6: BACKWARD PASS – latest times, walking from end to start.
  // LF (latest finish) = earliest LS among successors (project total if none).
  // LS (latest start)  = LF − duration.
  // Slack = how much the task can slip without delaying the project.
  [...order].reverse().forEach((id) => {
    // Copy first because reverse() mutates in place and `order` is returned later in forward order.
    // Reverse order means every task is processed after all of its successors.
    const t = map[id];
    // Shorthand for this task's record.
    t.lf = succ[id].length ? Math.min(...succ[id].map((s) => map[s].ls)) : total;
    // Has successors -> take the min of their latest starts (the tightest deadline).
    // No successors -> it is an end task, so its deadline is the project total.
    t.ls = t.lf - t.dur;
    // Latest start = latest finish - duration.
    t.slack = Math.round((t.ls - t.es) * 100) / 100;
    // Slack = latest start - earliest start, rounded to 2 decimals.
    // Zero slack = critical (small epsilon guards against floating-point error).
    t.critical = t.slack <= 0.0001;
    // <= with a tiny epsilon instead of === 0, so float noise or a tiny negative still counts as critical.
  });

  return {
    list: order.map((id) => map[id]),
    // Task records in topological order (for tables).
    map,
    // id -> record lookup (for drawing arrows).
    total,
    // Project duration in hours.
    skipped,
    // Number of tasks lost to cycles (for a UI warning).
    dependencyCount,
    // Total dependency links (summary stat).
  };
}
/* ── small pieces ── */

// Coloured pill showing a task's risk level based on its slack.
function RiskBadge({ t }) {
  if (t.critical) return <span className="cpm-badge cpm-badge--crit">Critical</span>;
  if (t.slack <= NEAR_CRITICAL_HRS)
    return <span className="cpm-badge cpm-badge--near">Near-critical</span>;
  return <span className="cpm-badge cpm-badge--safe">Safe</span>;
}

// One summary card (big value + caption). `hot` highlights it (used for overdue items).
function Kpi({ value, label, hot }) {
  return (
    <div className={`cpm-kpi${hot ? " cpm-kpi--hot" : ""}`}>
      <div className="cpm-kpi-v">{value}</div>
      <div className="cpm-kpi-l">{label}</div>
    </div>
  );
}

// Horizontal strip of chips: the critical activities in the order they start,
// joined by arrows. Done tasks are dimmed, running tasks are highlighted.
function PathStrip({ cpm }) {
  const crit = cpm.list.filter((t) => t.critical).sort((a, b) => a.es - b.es);
  if (!crit.length) return null;
  return (
    <div className="cpm-chain" aria-label="Critical path">
      <span className="cpm-chain-label">Critical path:</span>
      {crit.map((t, i) => (
        <React.Fragment key={t.id}>
          {i > 0 && <span className="cpm-arrow">→</span>}
          <span
            className={`cpm-chip${isDone(t.status) ? " cpm-chip--done" : ""}${
              ACTIVE.has(statusKey(t.status)) ? " cpm-chip--active" : ""
            }`}
            title={`${t.name} · ${displayStatusOf(t)}`}
          >
            {/* Truncate long names so the chips stay compact */}
            {t.name.length > 22 ? `${t.name.slice(0, 21)}…` : t.name} · {fmtH(t.dur)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Colour key so the reader knows what red / amber / neutral mean (and how near-critical is defined).
function Legend() {
  return (
    <div className="cpm-legend" aria-label="Legend">
      <span className="cpm-legend-item"><i className="cpm-dot cpm-dot--crit" /> Critical · 0h slack</span>
      <span className="cpm-legend-item"><i className="cpm-dot cpm-dot--near" /> Near-critical · up to {NEAR_CRITICAL_HRS}h slack</span>
      <span className="cpm-legend-item"><i className="cpm-dot cpm-dot--safe" /> Safe · more than {NEAR_CRITICAL_HRS}h slack</span>
    </div>
  );
}

// Round initials badge, coloured per resource. The full name shows on hover (title).
// Reuses the .avatar-resource class from ProjectActivityInfo.css (the dialog is mounted
// inside .pai-page, so that class applies here) and the same CSS variables TreeRows sets.
function ResourceCell({ resource, fetchColor }) {
  if (!resource) return <span>—</span>;
  const c = colorOf(fetchColor, resource);
  return (
    <span className="cpm-resource" title={resource}>
      <span
        className="avatar-resource"
        style={{
          "--avatar-bg": c.bgColor,
          "--avatar-border": c.border,
          "--avatar-text": c.color,
        }}
      >
        {initialsOf(resource)}
      </span>
    </span>
  );
}

// Network (PERT-style) diagram drawn as SVG: boxes for tasks, arrows for dependencies.
// Columns are dependency "levels"; each box shows ES/EF/duration and LS/LF/slack.
function Network({ cpm, fetchColor }) {
  // Layout constants: W/H = box size, GX/GY = gaps between columns/rows, PAD = outer padding.
  const W = 168, H = 76, GX = 56, GY = 24, PAD = 12;

  // Group tasks by level (column).
  const byLevel = {};
  cpm.list.forEach((t) => (byLevel[t.level] = byLevel[t.level] || []).push(t));
  const keys = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  const maxRows = Math.max(...keys.map((k) => byLevel[k].length)); // tallest column

  // Overall SVG size from the number of columns and the tallest column.
  const width = PAD * 2 + keys.length * W + (keys.length - 1) * GX;
  const height = PAD * 2 + maxRows * H + (maxRows - 1) * GY;

  // Compute the top-left (x, y) of each box. Shorter columns are vertically centred.
  const pos = {};
  keys.forEach((k) => {
    const col = byLevel[k];
    const colH = col.length * H + (col.length - 1) * GY;
    col.forEach((t, i) => {
      pos[t.id] = {
        x: PAD + k * (W + GX),
        y: PAD + (height - PAD * 2 - colH) / 2 + i * (H + GY),
      };
    });
  });
  const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  return (
    <div className="cpm-scroll">
      <svg
        className="cpm-net"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Activity dependency network"
      >
        {/* Arrowhead shapes: a normal one and a highlighted one for critical edges */}
        <defs>
          <marker id="cpm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="cpm-mk" />
          </marker>
          <marker id="cpm-arr-crit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="cpm-mk cpm-mk--crit" />
          </marker>
        </defs>

        {/* Edges: one curved arrow from each predecessor (right edge) to its successor (left edge) */}
        {cpm.list.flatMap((t) =>
          t.deps.map((d) => {
            const a = pos[d], b = pos[t.id], from = cpm.map[d];
            const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2;
            const mx = (x1 + x2) / 2; // control-point x for a smooth S-curve
            // An edge is on the critical path only if both ends are critical
            // AND the successor starts exactly when the predecessor finishes
            // (i.e. this predecessor is what actually drives the start).
            const onCrit = from.critical && t.critical && Math.abs(from.ef - t.es) < 0.0001;
            return (
              <path
                key={`${d}>${t.id}`}
                className={`cpm-edge${onCrit ? " cpm-edge--crit" : ""}`}
                d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                markerEnd={onCrit ? "url(#cpm-arr-crit)" : "url(#cpm-arr)"}
              />
            );
          }),
        )}

        {/* Task boxes, coloured by criticality */}
        {cpm.list.map((t) => {
          const q = pos[t.id];
          const cls = t.critical ? " cpm-box--crit" : t.slack <= NEAR_CRITICAL_HRS ? " cpm-box--near" : " cpm-box--safe";
          const rc = colorOf(fetchColor, t.resource);
          return (
            <g key={t.id}>
              <title>{t.name}</title>
              <rect className={`cpm-box${cls}`} x={q.x} y={q.y} width={W} height={H} rx="8" />
              {/* Task name */}
              <text className="cpm-t cpm-t--b" x={q.x + 10} y={q.y + 20}>{trunc(t.name, 17)}</text>
              {/* Resource badge (top-right): initials on the resource's colour */}
              {t.resource && (
                <g>
                  <title>{t.resource}</title>
                  <circle
                    cx={q.x + W - 18}
                    cy={q.y + 14}
                    r="10"
                    fill={rc.bgColor}
                    stroke={rc.border}
                  />
                  <text
                    x={q.x + W - 18}
                    y={q.y + 14}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fontWeight="700"
                    fill={rc.color}
                  >
                    {initialsOf(t.resource)}
                  </text>
                </g>
              )}
              <line className="cpm-sep" x1={q.x} x2={q.x + W} y1={q.y + 28} y2={q.y + 28} />
              {/* Forward-pass values */}
              <text className="cpm-t" x={q.x + 10} y={q.y + 46}>
                ES {t.es} · EF {t.ef} · {t.dur}h
              </text>
              {/* Backward-pass values and slack */}
              <text className="cpm-t cpm-t--m" x={q.x + 10} y={q.y + 62}>
                LS {t.ls} · LF {t.lf} · slack {t.slack}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Tabular view of every task with all CPM numbers.
// Sorted by slack (critical tasks first), then by earliest start.
function CpmTable({ cpm, fetchColor }) {
  const rows = [...cpm.list].sort((a, b) => a.slack - b.slack || a.es - b.es);
  return (
    <div className="cpm-scroll cpm-scroll--table">
      <table className="cpm-table">
        <thead>
          <tr>
            <th className="cpm-l">Activity</th>
            <th className="cpm-l" style={{ width: "1%", whiteSpace: "nowrap" }}>Resource</th>
            <th>Duration</th>
            <th>ES</th>
            <th>EF</th>
            <th>LS</th>
            <th>LF</th>
            <th>Slack</th>
            <th className="cpm-l">Risk</th>
            <th className="cpm-l">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr
              key={t.id}
              className={t.critical ? "cpm-row--crit" : t.slack <= NEAR_CRITICAL_HRS ? "cpm-row--near" : "cpm-row--safe"}
            >
              <td className="cpm-l cpm-name" title={t.name}>{t.name}</td>
              <td className="cpm-l" style={{ width: "1%" }}><ResourceCell resource={t.resource} fetchColor={fetchColor} /></td>
              <td>{fmtH(t.dur)}</td>
              <td>{t.es}</td>
              <td>{t.ef}</td>
              <td>{t.ls}</td>
              <td>{t.lf}</td>
              <td>{t.slack}</td>
              <td className="cpm-l"><RiskBadge t={t} /></td>
              <td className="cpm-l">
                <StatusChip status={displayStatusOf(t)?.toLowerCase()} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── dialog ──
   Main component. Props:
     open      – whether the dialog is visible
     onClose   – called when the user closes it
     fetchColor – (resource) => { color, bgColor, border } colour lookup shared with the
                 Activities table, so each resource keeps the same colour in this dialog
     projectId – id of the project to analyse; the data is fetched here
                 (each time the dialog opens, so it is always up to date) */
export default function CpmDialog({ open, onClose, projectId, fetchColor }) {
  // Which visualisation is shown: "network" | "table".
  const [tab, setTab] = useState("network");
  // Windowed by default; the header button toggles full screen.
  const [fullScreen, setFullScreen] = useState(false);

  // Fetched data + request state.
  const [project, setProject] = useState(null); // { modules, projectName }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0); // bump to retry after a failure

  // Fetch the activity tree whenever the dialog opens (or the project changes / retry is pressed).
  useEffect(() => {
    if (!open || !projectId) return undefined;
    let cancelled = false; // ignore a response that arrives after close / project change
    setProject(null); // never show the previous project's data while loading
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const res = await activityTrackerApi.getAllActivities(projectId);
        if (cancelled) return;
        if (!res) throw new Error("Empty response");
        setProject({ modules: res.modules ?? [], projectName: res.projectName });
      } catch (e) {
        if (!cancelled) setError("Could not load the activities for this project.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, projectId, reloadKey]);

  // Only run the (potentially heavy) calculation while open and once data has arrived,
  // and re-run only when the data changes.
  const cpm = useMemo(() => (open && project ? buildCpm(project.modules) : null), [open, project]);

  // Summary numbers for the KPI cards and warning banners.
  const stats = useMemo(() => {
    if (!cpm) return null;
    const crit = cpm.list.filter((t) => t.critical);
    // Near-critical = not critical, but with at most NEAR_CRITICAL_HRS of slack.
    const near = cpm.list.filter((t) => !t.critical && t.slack <= NEAR_CRITICAL_HRS);
    const sum = (arr, f) => arr.reduce((a, t) => a + f(t), 0);
    const critDur = sum(crit, (t) => t.dur);
    const allDur = sum(cpm.list, (t) => t.dur);
    const now = dayjs();
    // Overdue critical tasks: not done, and their planned end is already in the past.
    const late = crit.filter(
      (t) => !isDone(t.status) && t.plannedStop && dayjs(t.plannedStop).isBefore(now),
    );
    return {
      crit,
      near,
      late,
      // Duration-weighted completion % (longer tasks count for more).
      critPct: critDur ? Math.round((sum(crit, (t) => t.dur * progressOf(t.status)) / critDur) * 100) : 0,
      allPct: allDur ? Math.round((sum(cpm.list, (t) => t.dur * progressOf(t.status)) / allDur) * 100) : 0,
    };
  }, [cpm]);

  // No work items at all → show a helpful empty-state message.
  const empty = cpm && cpm.list.length === 0;
  // Tasks exist but none are linked → the "critical path" is meaningless, so warn the user.
  const noDeps = cpm && !empty && cpm.dependencyCount === 0;

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={false}
      // MUI portals to document.body, outside `.pai-page` where the --pj-* theme
      // variables (and the .dark class) live. Mount inside it so the dialog follows
      // light/dark mode like PauseReasonDialog; fall back to body if it isn't found.
      container={() => document.querySelector(".pai-page") || document.body}
      PaperProps={{ className: `cpm-paper${fullScreen ? "" : " cpm-paper--window"}` }}
    >
      {/* Header: title, subtitle, full-screen toggle and close button */}
      <div className="cpm-head">
        <div>
          <h2 className="cpm-title">Critical path</h2>
          <p className="cpm-sub">
            {project?.projectName ? `${project.projectName} · ` : ""}durations in working hours ({HOURS_PER_DAY}h = 1 day)
          </p>
        </div>
        <div className="cpm-head-actions">
          <IconButton
            className="cpm-icon-btn"
            onClick={() => setFullScreen((v) => !v)}
            aria-label={fullScreen ? "Exit full screen" : "Enter full screen"}
            title={fullScreen ? "Exit full screen" : "Full screen"}
            size="small"
          >
            {fullScreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
          <IconButton
            className="cpm-icon-btn"
            onClick={onClose}
            aria-label="Close critical path view"
            title="Close"
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="cpm-body">
        {/* No project id was supplied */}
        {!projectId && <div className="cpm-note cpm-note--bad">No project selected.</div>}

        {/* Loading */}
        {projectId && loading && (
          <div className="cpm-state" role="status" aria-live="polite">
            <CircularProgress size={26} thickness={4} sx={{ color: "var(--cpm-accent)" }} />
            <span>Loading activities…</span>
          </div>
        )}

        {/* Error with retry */}
        {projectId && !loading && error && (
          <div className="cpm-note cpm-note--bad cpm-note--row">
            <span>{error}</span>
            <button type="button" className="cpm-btn" onClick={() => setReloadKey((k) => k + 1)}>
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {empty && (
          <div className="cpm-note">
            There are no activities to analyse yet. Add activities (and dependencies between them) to see the critical path.
          </div>
        )}

        {cpm && !empty && (
          <>
            {/* KPI cards */}
            <div className="cpm-kpis">
              <Kpi value={`${fmtH(cpm.total)} · ${fmtDays(cpm.total)}`} label="Project duration (critical path)" />
              <Kpi value={`${stats.allPct}%`} label="Overall complete" />
              <Kpi value={`${stats.critPct}%`} label="Critical path complete" />
              <Kpi value={`${stats.crit.length} / ${stats.near.length}`} label="Critical / near-critical" />
              <Kpi value={stats.late.length} label="Overdue critical activities" hot={stats.late.length > 0} />
            </div>

            {/* Info / warning banners */}
            {noDeps && (
              <div className="cpm-note">
                No dependencies are set on these activities, so each one is treated as independent and the
                "critical path" is just the longest single activity. Add "depends on" links to get a real path.
              </div>
            )}
            {cpm.skipped > 0 && (
              <div className="cpm-note cpm-note--warn">
                {cpm.skipped} activit{cpm.skipped === 1 ? "y was" : "ies were"} left out because of a circular
                dependency (A waits on B, B waits on A). Fix the dependency loop to include them.
              </div>
            )}
            {stats.late.length > 0 && (
              <div className="cpm-note cpm-note--bad">
                <b>{stats.late.length} critical activit{stats.late.length === 1 ? "y is" : "ies are"} past its planned end:</b>{" "}
                {stats.late.map((t) => t.name).join(", ")}. Any further delay here moves the project end.
              </div>
            )}

            {/* The critical path as a chain of chips */}
            <PathStrip cpm={cpm} />
            <Legend />

            {/* Tab switcher: [key, label] pairs */}
            <div className="cpm-tabs" role="tablist">
              {[
                ["network", "Network"],
                ["table", "Table"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  className={`cpm-tab${tab === k ? " cpm-tab--on" : ""}`}
                  onClick={() => setTab(k)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Render the selected view */}
            {tab === "network" && <Network cpm={cpm} fetchColor={fetchColor} />}
            {tab === "table" && <CpmTable cpm={cpm} fetchColor={fetchColor} />}

            {/* Glossary of the abbreviations used above */}
            <p className="cpm-foot">
              ES/EF = earliest start/finish, LS/LF = latest start/finish (hours from project start). Slack = LS − ES.
              Critical = zero slack. Near-critical = up to {NEAR_CRITICAL_HRS}h of slack.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}