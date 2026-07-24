/* ═══════════════════════════════════════════════════════
   Row chain computation (auto + manual modes)
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

/* ─── Manual mode chain computation ─── */
export function recomputeChains(rows, groupResources = {}) {
  const updated = rows.map((r) => ({ ...r }));
  const byId = new Map(updated.map((r) => [r.id, r]));

  const childrenMap = new Map();
  updated.forEach((r) => {
    const pid = r.parentId || "__ROOT__";
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(r);
  });

  const getChildren = (id) => childrenMap.get(id) || [];
  const topRows = childrenMap.get("__ROOT__") || [];
  const chains = new Map();

  topRows.forEach((row) => {
    if (getChildren(row.id).length > 0) return;
    if (!isPending(row)) return;
    if (!row.resource) return;
    const moduleKey = row.moduleId || row.module || "__no_module__";
    const chainKey = `${moduleKey}|${row.resource}`;
    if (!chains.has(chainKey)) chains.set(chainKey, []);
    chains.get(chainKey).push(row);
  });

  chains.forEach((chainRows, chainKey) => {
    const [, userId] = chainKey.split("|");
    let prevEnd = null;

    chainRows.forEach((row, idx) => {
      const realRow = byId.get(row.id);
      if (!isPending(realRow)) return;

      const dur = Number(realRow.durationHrs);
      const hasValidDuration =
        realRow.durationHrs !== "" &&
        realRow.durationHrs !== null &&
        realRow.durationHrs !== undefined &&
        !isNaN(Number(realRow.durationHrs));

      let start;
      const userStart = realRow.plannedStart
        ? parseISODateTime(realRow.plannedStart)
        : null;

      if (userStart) {
        start = nextWorkMoment(userStart, userId, groupResources);
      } else if (idx === 0) {
        realRow.plannedStart = "";
        realRow.plannedStop = "";
        prevEnd = null;
        return;
      } else {
        if (!prevEnd) {
          realRow.plannedStart = "";
          realRow.plannedStop = "";
          return;
        }
        start = nextWorkMoment(new Date(prevEnd), userId, groupResources);
      }

      realRow.plannedStart = isoDateTime(start);

      if (hasValidDuration) {
        if (dur === 0) {
          realRow.plannedStop = isoDateTime(start);
          prevEnd = start;
        } else {
          const end = addWorkHours(start, dur, userId, groupResources);
          realRow.plannedStop = isoDateTime(end);
          prevEnd = end;
        }
      } else {
        realRow.plannedStop = "";
        prevEnd = start;
      }
    });
  });

  // Sub-tasks
  const processChildren = (parentId) => {
    const parent = byId.get(parentId);
    if (!parent) return;
    const children = getChildren(parentId);
    if (children.length === 0) return;

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
        !isNaN(Number(realChild.durationHrs));

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

  // Parent aggregation
  const parentIds = Array.from(childrenMap.keys()).filter((k) => k !== "__ROOT__");
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

    parent.plannedStart = isoDateTime(new Date(Math.min(...intervals.map((i) => i.start))));
    parent.plannedStop = isoDateTime(new Date(Math.max(...intervals.map((i) => i.end))));

    let parentMs = 0;
    if (resourcesSet.size === 1) {
      for (const it of intervals) parentMs += it.end - it.start;
    } else {
      const sorted = intervals.map((i) => ({ s: i.start, e: i.end })).sort((a, b) => a.s - b.s);
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

    parent.durationHrs = Math.round((parentMs / (1000 * 60 * 60)) * 100) / 100;
    parent._autoDuration = true;
  }

  return updated;
}

/* ─── Auto mode chain (per-resource across all modules) ─── */
export function recomputeAutoChains(rows, groupResources = {}) {
  const updated = rows.map((r) => ({ ...r }));
  const byId = new Map(updated.map((r) => [r.id, r]));

  const childrenMap = new Map();
  updated.forEach((r) => {
    const pid = r.parentId || "__ROOT__";
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(r);
  });

  const getChildren = (id) => childrenMap.get(id) || [];
  const ordered = flattenOrdered(updated);

  updated.forEach((r) => {
    r._isAnchor = false;
    r._autoChained = false;
  });

  const byResource = new Map();
  const orderedIds = ordered.map((r) => r.id);

  orderedIds.forEach((id) => {
    const r = byId.get(id);
    if (!r || !r.resource) return;
    if (getChildren(r.id).length > 0) return;
    if (!isPending(r)) return;
    if (!byResource.has(r.resource)) byResource.set(r.resource, []);
    byResource.get(r.resource).push(r);
  });

  const warnings = [];

  byResource.forEach((chain, userId) => {
    if (chain.length === 0) return;
    const anchor = chain[0];
    anchor._isAnchor = true;

    if (!anchor.plannedStart) {
      warnings.push({ userId, taskName: anchor.task || anchor.module || "Untitled" });
      return;
    }

    const anchorStart = parseISODateTime(anchor.plannedStart);
    const anchorDur = Number(anchor.durationHrs);
    const hasAnchorDur =
      anchor.durationHrs !== "" &&
      anchor.durationHrs !== null &&
      anchor.durationHrs !== undefined &&
      !isNaN(anchorDur);

    if (hasAnchorDur && anchorDur > 0) {
      const stop = addWorkHours(anchorStart, anchorDur, userId, groupResources);
      anchor.plannedStop = isoDateTime(stop);
    } else if (hasAnchorDur && anchorDur === 0) {
      anchor.plannedStop = isoDateTime(anchorStart);
    } else {
      anchor.plannedStop = "";
    }

    let prevEnd = anchor.plannedStop ? parseISODateTime(anchor.plannedStop) : null;

    for (let i = 1; i < chain.length; i++) {
      const row = chain[i];
      row._autoChained = true;

      if (!prevEnd) {
        row.plannedStart = "";
        row.plannedStop = "";
        continue;
      }

      const start = nextWorkMoment(new Date(prevEnd), userId, groupResources);
      row.plannedStart = isoDateTime(start);

      const dur = Number(row.durationHrs);
      const hasDur =
        row.durationHrs !== "" &&
        row.durationHrs !== null &&
        row.durationHrs !== undefined &&
        !isNaN(dur);

      if (hasDur && dur > 0) {
        const stop = addWorkHours(start, dur, userId, groupResources);
        row.plannedStop = isoDateTime(stop);
        prevEnd = stop;
      } else if (hasDur && dur === 0) {
        row.plannedStop = row.plannedStart;
        prevEnd = start;
      } else {
        row.plannedStop = "";
        prevEnd = start;
      }
    }
  });

  // Parent aggregation (same as recomputeChains)
  const parentIds = Array.from(childrenMap.keys()).filter((k) => k !== "__ROOT__");
  for (const pid of parentIds) {
    const parent = byId.get(pid);
    if (!parent || !isPending(parent)) continue;

    const children = getChildren(pid);
    const intervals = [];
    const resourcesSet = new Set();

    for (const c of children) {
      if (!c.plannedStart || !c.plannedStop) continue;
      const s = parseISODateTime(c.plannedStart);
      const e = parseISODateTime(c.plannedStop);
      if (!s || !e) continue;
      if (e.getTime() <= s.getTime()) continue;
      intervals.push({ start: s.getTime(), end: e.getTime(), resource: c.resource || "" });
      resourcesSet.add(c.resource || "");
    }

    if (intervals.length === 0) {
      parent._autoDuration = false;
      continue;
    }

    parent.plannedStart = isoDateTime(new Date(Math.min(...intervals.map((i) => i.start))));
    parent.plannedStop = isoDateTime(new Date(Math.max(...intervals.map((i) => i.end))));

    let parentMs = 0;
    if (resourcesSet.size === 1) {
      for (const it of intervals) parentMs += it.end - it.start;
    } else {
      const sorted = intervals.map((i) => ({ s: i.start, e: i.end })).sort((a, b) => a.s - b.s);
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

    parent.durationHrs = Math.round((parentMs / (1000 * 60 * 60)) * 100) / 100;
    parent._autoDuration = true;
  }

  return { rows: updated, warnings };
}