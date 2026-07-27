/* ═══════════════════════════════════════════════════════
   Row chain computation
   ═══════════════════════════════════════════════════════ */

import {
  isoDateTime,
  parseISODateTime,
} from "./dateUtils";
import { nextWorkMoment, addWorkHours } from "./workHours";

export function isPending(row) {
  return (
    String(row.status || "pending")
      .toLowerCase()
      .trim() === "pending"
  );
}

export function flattenOrdered(rows, { withDepth = true } = {}) {
  const out = [];
  const childrenMap = new Map();

  rows.forEach((r) => {
    const key = r.parentId || "ROOT";
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key).push(r);
  });

  const walk = (parentKey, depth) => {
    const children = childrenMap.get(parentKey) || [];
    children.forEach((node) => {
      if (withDepth) {
        out.push(Object.assign(node, { sortOrder: depth }));
      } else {
        out.push(node);
      }
      walk(node.id, depth + 1);
    });
  };

  walk("ROOT", 0);

  rows.forEach((r) => {
    if (!out.find((x) => x.id === r.id)) {
      if (withDepth) r.sortOrder = 0;
      out.push(r);
    }
  });

  return out;
}

/* ─── Anchor-based chain computation ─── */
export function recomputeAnchorChains(rows, groupResources = {}) {
  // 1. Clone all rows
  const updated = rows.map((r) => ({ ...r }));
  const byId = new Map(updated.map((r) => [r.id, r]));

  // 2. Build childrenMap
  const childrenMap = new Map();
  updated.forEach((r) => {
    const pid = r.parentId || "__ROOT__";
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(r);
  });

  const getChildren = (id) => childrenMap.get(id) || [];

  // 3. Reset auto-chain flags on all rows
  updated.forEach((r) => {
    r._autoChained = false;
    r._isAnchor = false;
  });

  // 4. Get ordered rows (respects tree order)
  const ordered = flattenOrdered(updated);

  // 5. Group rows by resource (ordered)
  const byResource = new Map();
  ordered.forEach((r) => {
    const row = byId.get(r.id);
    if (!row || !row.resource) return;
    // Include ALL rows (top-level + sub-activities)
    if (!byResource.has(row.resource)) byResource.set(row.resource, []);
    byResource.get(row.resource).push(row);
  });

  // 6. Process each resource
  byResource.forEach((resourceRows, userId) => {
    // Find all anchor indices
    // Walk through rows and create segments
    // Segment = [anchorRow, ...subsequentRows until next anchor]

    let currentSegmentStart = -1; // index of current anchor

    for (let i = 0; i < resourceRows.length; i++) {
      const row = resourceRows[i];

      if (row.isAnchor) {
        // ── This row is an anchor ──
        row._isAnchor = true;
        row._autoChained = false;

        // Use row's own plannedStart as segment start
        // (guaranteed to exist — blocked at toggle time if missing)
        const anchorStart = row.plannedStart
          ? parseISODateTime(row.plannedStart)
          : null;

        if (!anchorStart) {
          // Safety: if somehow anchor has no date, skip segment
          currentSegmentStart = -1;
          continue;
        }

        // Recompute anchor's own plannedStop
        const dur = Number(row.durationHrs);
        const hasValidDur =
          row.durationHrs !== "" &&
          row.durationHrs !== null &&
          row.durationHrs !== undefined &&
          !isNaN(dur);

        if (hasValidDur && dur > 0) {
          const stop = addWorkHours(
            anchorStart,
            dur,
            userId,
            groupResources,
          );
          row.plannedStop = isoDateTime(stop);
        } else if (hasValidDur && dur === 0) {
          row.plannedStop = isoDateTime(anchorStart);
        } else {
          row.plannedStop = "";
        }

        currentSegmentStart = i;
      } else if (currentSegmentStart !== -1) {
        // ── This row is inside a segment (after an anchor) ──
        row._autoChained = true;
        row._isAnchor = false;

        // prevRow = the row just before this one in the resource list
        const prevRow = resourceRows[i - 1];
        const prevEnd = prevRow?.plannedStop
          ? parseISODateTime(prevRow.plannedStop)
          : null;

        if (!prevEnd) {
          // Previous row has no stop → can't chain
          row.plannedStart = "";
          row.plannedStop = "";
          continue;
        }

        // Snap to next valid work moment
        const start = nextWorkMoment(
          new Date(prevEnd),
          userId,
          groupResources,
        );
        row.plannedStart = isoDateTime(start);

        // Compute stop
        const dur = Number(row.durationHrs);
        const hasValidDur =
          row.durationHrs !== "" &&
          row.durationHrs !== null &&
          row.durationHrs !== undefined &&
          !isNaN(dur);

        if (hasValidDur && dur > 0) {
          const stop = addWorkHours(start, dur, userId, groupResources);
          row.plannedStop = isoDateTime(stop);
        } else if (hasValidDur && dur === 0) {
          row.plannedStop = isoDateTime(start);
        } else {
          row.plannedStop = "";
        }
      } else {
  // ── No segment started yet → manual mode ──
  row._autoChained = false;
  row._isAnchor = false;
  
  // Still compute plannedStop from plannedStart + duration (manual mode)
  if (row.plannedStart) {
    const start = parseISODateTime(row.plannedStart);
    const dur = Number(row.durationHrs);
    const hasValidDur =
      row.durationHrs !== "" &&
      row.durationHrs !== null &&
      row.durationHrs !== undefined &&
      !isNaN(dur);

    if (start && hasValidDur) {
      if (dur === 0) {
        row.plannedStop = isoDateTime(start);
      } else {
        const stop = addWorkHours(start, dur, userId, groupResources);
        row.plannedStop = isoDateTime(stop);
      }
    } else {
      row.plannedStop = "";
    }
  } else {
    row.plannedStop = "";
  }
}
    }
  });

  // 7. Parent aggregation (same as before)
  const parentIds = Array.from(childrenMap.keys()).filter(
    (k) => k !== "__ROOT__",
  );

  for (const pid of parentIds) {
    const parent = byId.get(pid);
    if (!parent || !isPending(parent)) continue;

    const children = getChildren(pid);
    const intervals = [];
    const resourcesSet = new Set();

    for (const c of children) {
      const realChild = byId.get(c.id);
      if (!realChild) continue;
      if (!realChild.plannedStart || !realChild.plannedStop) continue;
      const s = parseISODateTime(realChild.plannedStart);
      const e = parseISODateTime(realChild.plannedStop);
      if (!s || !e) continue;
      const startMs = s.getTime();
      const endMs = e.getTime();
      if (endMs <= startMs) continue;
      intervals.push({
        start: startMs,
        end: endMs,
        resource: realChild.resource || "",
      });
      resourcesSet.add(realChild.resource || "");
    }

    if (intervals.length === 0) {
      parent._autoDuration = false;
      continue;
    }

    parent.plannedStart = isoDateTime(
      new Date(Math.min(...intervals.map((i) => i.start))),
    );
    parent.plannedStop = isoDateTime(
      new Date(Math.max(...intervals.map((i) => i.end))),
    );

    let parentMs = 0;
    if (resourcesSet.size === 1) {
      for (const it of intervals) parentMs += it.end - it.start;
    } else {
      const sorted = intervals
        .map((i) => ({ s: i.start, e: i.end }))
        .sort((a, b) => a.s - b.s);
      let curS = sorted[0].s;
      let curE = sorted[0].e;
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.s <= curE) curE = Math.max(curE, it.e);
        else {
          parentMs += curE - curS;
          curS = it.s;
          curE = it.e;
        }
      }
      parentMs += curE - curS;
    }

    parent.durationHrs =
      Math.round((parentMs / (1000 * 60 * 60)) * 100) / 100;
    parent._autoDuration = true;
  }

  return updated;
}

/* ─── Manual mode chain computation (kept for plannedStop calc) ─── */
export function recomputeChains(rows, groupResources = {}) {
  const updated = rows.map((r) => ({ ...r }));
  const byId = new Map(updated.map((r) => [r.id, r]));
  const childrenMap = new Map();
  // ── Reset anchor-mode flags (in case they persisted) ──
  updated.forEach((r) => {
    r._autoChained = false;
    r._isAnchor = false;
  });

  const getChildren = (id) => childrenMap.get(id) || [];
  const topRows = childrenMap.get("__ROOT__") || [];

  // Sub-tasks plannedStop computation
  const processChildren = (parentId) => {
    const children = getChildren(parentId);
    children.forEach((child) => {
      const realChild = byId.get(child.id);
      if (!isPending(realChild)) {
        processChildren(realChild.id);
        return;
      }
      const dur = Number(realChild.durationHrs);
      const hasValidDuration =
        realChild.durationHrs !== "" &&
        realChild.durationHrs !== null &&
        realChild.durationHrs !== undefined &&
        !isNaN(dur);

      if (realChild.plannedStart && hasValidDuration) {
        const start = parseISODateTime(realChild.plannedStart);
        if (start) {
          let end;
          if (dur === 0) end = new Date(start);
          else end = new Date(start.getTime() + dur * 60 * 60 * 1000);
          realChild.plannedStop = isoDateTime(end);
        }
      } else {
        realChild.plannedStop = "";
      }
      processChildren(realChild.id);
    });
  };

  topRows.forEach((row) => processChildren(row.id));

  // Compute plannedStop for top-level rows
  updated.forEach((r) => {
    if (r.parentId) return; // already handled
    if (!isPending(r)) return;
    if (!r.plannedStart) {
      r.plannedStop = "";
      return;
    }
    const dur = Number(r.durationHrs);
    const hasValidDur =
      r.durationHrs !== "" &&
      r.durationHrs !== null &&
      r.durationHrs !== undefined &&
      !isNaN(dur);

    if (hasValidDur) {
      const start = parseISODateTime(r.plannedStart);
      if (start) {
        if (dur === 0) {
          r.plannedStop = isoDateTime(start);
        } else {
          const stop = addWorkHours(
            start,
            dur,
            r.resource,
            groupResources,
          );
          r.plannedStop = isoDateTime(stop);
        }
      }
    } else {
      r.plannedStop = "";
    }
  });

  // Parent aggregation
  const parentIds = Array.from(childrenMap.keys()).filter(
    (k) => k !== "__ROOT__",
  );
  for (const pid of parentIds) {
    const parent = byId.get(pid);
    if (!parent || !isPending(parent)) continue;

    const children = getChildren(pid);
    const intervals = [];
    const resourcesSet = new Set();

    for (const c of children) {
      const realChild = byId.get(c.id);
      if (!realChild) continue;
      if (!realChild.plannedStart || !realChild.plannedStop) continue;
      const s = parseISODateTime(realChild.plannedStart);
      const e = parseISODateTime(realChild.plannedStop);
      if (!s || !e) continue;
      const startMs = s.getTime();
      const endMs = e.getTime();
      if (endMs <= startMs) continue;
      intervals.push({
        start: startMs,
        end: endMs,
        resource: realChild.resource || "",
      });
      resourcesSet.add(realChild.resource || "");
    }

    if (intervals.length === 0) {
      parent._autoDuration = false;
      continue;
    }

    parent.plannedStart = isoDateTime(
      new Date(Math.min(...intervals.map((i) => i.start))),
    );
    parent.plannedStop = isoDateTime(
      new Date(Math.max(...intervals.map((i) => i.end))),
    );

    let parentMs = 0;
    if (resourcesSet.size === 1) {
      for (const it of intervals) parentMs += it.end - it.start;
    } else {
      const sorted = intervals
        .map((i) => ({ s: i.start, e: i.end }))
        .sort((a, b) => a.s - b.s);
      let curS = sorted[0].s;
      let curE = sorted[0].e;
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.s <= curE) curE = Math.max(curE, it.e);
        else {
          parentMs += curE - curS;
          curS = it.s;
          curE = it.e;
        }
      }
      parentMs += curE - curS;
    }

    parent.durationHrs =
      Math.round((parentMs / (1000 * 60 * 60)) * 100) / 100;
    parent._autoDuration = true;
  }

  return updated;
}