/* ═══════════════════════════════════════════════════════
   Dependency Helpers (FS - Finish-to-Start)
   Pure functions for managing activity dependencies.
   ═══════════════════════════════════════════════════════ */

import { parseISODateTime } from "./dateUtils";

/* ─── Get direct dependencies (predecessors) of a row ─── */
export function getDependencies(rowId, rows) {
  const row = rows.find((r) => r.id === rowId);
  if (!row || !Array.isArray(row.dependsOn)) return [];
  return row.dependsOn
    .map((depId) => rows.find((r) => r.id === depId))
    .filter(Boolean);
}

/* ─── Get rows that depend on this one (successors) ─── */
export function getSuccessors(rowId, rows) {
  return rows.filter((r) => Array.isArray(r.dependsOn) && r.dependsOn.includes(rowId));
}

/* ─── Get all descendants (recursive dependents down the tree) ─── */
export function getAllDescendantIds(rowId, rows) {
  const visited = new Set();
  const stack = [rowId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    const successors = getSuccessors(currentId, rows);
    successors.forEach((s) => {
      if (!visited.has(s.id)) {
        visited.add(s.id);
        stack.push(s.id);
      }
    });
  }
  return visited;
}

/* ─── Get all ancestors (recursive predecessors up the tree) ─── */
export function getAllAncestorIds(rowId, rows) {
  const visited = new Set();
  const stack = [rowId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    const row = rows.find((r) => r.id === currentId);
    if (!row || !Array.isArray(row.dependsOn)) continue;
    row.dependsOn.forEach((depId) => {
      if (!visited.has(depId)) {
        visited.add(depId);
        stack.push(depId);
      }
    });
  }
  return visited;
}

/* ─── Would adding this dependency create a cycle? ─── */
export function wouldCreateCycle(sourceId, targetId, rows) {
  // If source depends on target, we need to check:
  // does target (directly or indirectly) already depend on source?
  if (sourceId === targetId) return true;
  const ancestors = getAllAncestorIds(targetId, rows);
  return ancestors.has(sourceId);
}

/* ─── Get set of IDs that would create cycles or invalid deps if added ─── */
export function getCycleBlockedIds(rowId, rows) {
  const blocked = new Set();
  blocked.add(rowId); // self
  // Any descendant (or descendant of descendant, etc.) would create a cycle
  const descendants = getAllDescendantIds(rowId, rows);
  descendants.forEach((id) => blocked.add(id));
  return blocked;
}

/* ─── Check date conflict between a row and its dependency ─── */
export function checkDependencyConflict(row, depRow) {
  if (!row || !depRow) return "missing-dates";
  if (!row.plannedStart || !depRow.plannedStop) return "missing-dates";

  const rowStart = parseISODateTime(row.plannedStart);
  const depStop = parseISODateTime(depRow.plannedStop);
  if (!rowStart || !depStop) return "missing-dates";

  return depStop.getTime() <= rowStart.getTime() ? "ok" : "conflict";
}

/* ─── Compute readiness state for a row's dependencies ─── */
export function getDependencyReadiness(row, rows) {
  const deps = getDependencies(row.id, rows);
  if (deps.length === 0) {
    return {
      total: 0,
      finished: 0,
      pending: 0,
      conflicts: 0,
      missingDates: 0,
      canStart: true,
      state: "none", // no deps
    };
  }

  let finished = 0;
  let pending = 0;
  let conflicts = 0;
  let missingDates = 0;

  deps.forEach((dep) => {
    const status = String(dep.status || "pending").toLowerCase().trim();
    const isDone = status === "completed" || status === "finished";
    if (isDone) finished++;
    else pending++;

    const conflict = checkDependencyConflict(row, dep);
    if (conflict === "conflict") conflicts++;
    else if (conflict === "missing-dates") missingDates++;
  });

  const canStart = pending === 0;
  let state = "ready"; // green
  if (conflicts > 0) state = "conflict"; // red
  else if (pending > 0) state = "pending"; // amber

  return {
    total: deps.length,
    finished,
    pending,
    conflicts,
    missingDates,
    canStart,
    state,
  };
}

/* ─── Compute label + color for the 🔗 badge ─── */
export function getDependencyBadgeInfo(row, rows, theme) {
  const r = getDependencyReadiness(row, rows);
  if (r.total === 0) return null;

  let bg = theme.bgMuted;
  let color = theme.textMuted;
  let border = theme.border;
  let title = "";

  if (r.state === "ready") {
    bg = theme.successBg;
    color = theme.success;
    border = theme.successBorder;
    title = `All ${r.total} dependencies finished — ready to start`;
  } else if (r.state === "conflict") {
    bg = theme.dangerBg;
    color = theme.danger;
    border = theme.dangerBorder;
    title = `${r.conflicts} scheduling conflict${r.conflicts !== 1 ? "s" : ""} in dependencies`;
  } else if (r.state === "pending") {
    bg = theme.warningBg;
    color = theme.warning;
    border = theme.warningBorder;
    title = `${r.pending} of ${r.total} dependencies not finished`;
  }

  return { count: r.total, bg, color, border, title, readiness: r };
}

/* ─── Detect all circular dependencies in the project ─── */
export function findAllCycles(rows) {
  const cycles = [];
  const WHITE = 0; // unvisited
  const GRAY = 1;  // in current DFS path
  const BLACK = 2; // fully processed
  const color = new Map();

  rows.forEach((r) => color.set(r.id, WHITE));

  const dfs = (rowId, path) => {
    color.set(rowId, GRAY);
    path.push(rowId);
    const row = rows.find((r) => r.id === rowId);
    if (row && Array.isArray(row.dependsOn)) {
      for (const depId of row.dependsOn) {
        const c = color.get(depId);
        if (c === GRAY) {
          // Found a cycle — extract from path
          const cycleStart = path.indexOf(depId);
          const cyclePath = path.slice(cycleStart);
          cyclePath.push(depId); // close the loop
          cycles.push(cyclePath);
        } else if (c === WHITE) {
          dfs(depId, [...path]);
        }
      }
    }
    color.set(rowId, BLACK);
  };

  rows.forEach((r) => {
    if (color.get(r.id) === WHITE) {
      dfs(r.id, []);
    }
  });

  return cycles;
}

/* ─── Detect dependencies pointing to deleted rows ─── */
export function findOrphanedDependencies(rows) {
  const validIds = new Set(rows.map((r) => r.id));
  const orphans = [];
  rows.forEach((r) => {
    if (!Array.isArray(r.dependsOn)) return;
    const missingIds = r.dependsOn.filter((depId) => !validIds.has(depId));
    if (missingIds.length > 0) {
      orphans.push({
        row: r,
        missingIds,
      });
    }
  });
  return orphans;
}

/* ─── Detect all scheduling conflicts (warning) ─── */
export function findAllSchedulingConflicts(rows) {
  const conflicts = [];
  rows.forEach((row) => {
    if (!Array.isArray(row.dependsOn) || row.dependsOn.length === 0) return;
    row.dependsOn.forEach((depId) => {
      const dep = rows.find((r) => r.id === depId);
      if (!dep) return; // orphan, handled elsewhere
      const status = checkDependencyConflict(row, dep);
      if (status === "conflict") {
        conflicts.push({
          row,
          dep,
          rowStart: row.plannedStart,
          depStop: dep.plannedStop,
        });
      }
    });
  });
  return conflicts;
}

/* ─── Clean up orphan IDs from dependsOn arrays ─── */
export function cleanupOrphanedDependencies(rows) {
  const validIds = new Set(rows.map((r) => r.id));
  let changed = false;
  const cleaned = rows.map((r) => {
    if (!Array.isArray(r.dependsOn) || r.dependsOn.length === 0) return r;
    const filtered = r.dependsOn.filter((id) => validIds.has(id));
    if (filtered.length !== r.dependsOn.length) {
      changed = true;
      return { ...r, dependsOn: filtered };
    }
    return r;
  });
  return { rows: cleaned, changed };
}

/* ─── Format cycle for display (with names) ─── */
export function formatCyclePath(cycleIds, rows) {
  return cycleIds
    .map((id) => {
      const row = rows.find((r) => r.id === id);
      return row?.task || row?.module || `Row #${id}`;
    })
    .join(" → ");
}

/* ─── Compute auto-chain dependencies per resource ─── */
export function computeAutoChain(rows, resources = []) {
  const getUserName = (uid) => {
    const res = resources.find((r) => r.userId === uid);
    return res?.name || uid;
  };

  // 1. Filter eligible rows:
  //    - Top-level only (skip sub-activities)
  //    - Must have plannedStart AND plannedStop
  //    - Must have a resource (r.resource is a userId string)
  const eligible = rows.filter((r) => {
    if (r.parentId) return false;
    if (!r.plannedStart) return false;
    if (!r.plannedStop) return false;
    if (!r.resource) return false;
    return true;
  });

  // 2. Group by resource userId
  const byUser = {};
  eligible.forEach((r) => {
    const uid = r.resource;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push(r);
  });

  const changes = [];
  const updates = {};

  Object.entries(byUser).forEach(([userId, tasks]) => {
    // 3a. Sort by plannedStart ascending
    tasks.sort((a, b) => {
      const ta = parseISODateTime(a.plannedStart);
      const tb = parseISODateTime(b.plannedStart);
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta.getTime() - tb.getTime();
    });

    const userName = getUserName(userId);

    // 3b. Walk consecutive pairs
    for (let i = 1; i < tasks.length; i++) {
      const prev = tasks[i - 1];
      const curr = tasks[i];

      // FS rule: curr must start AFTER prev finishes
      // (both dates already guaranteed to exist by the filter above)
      const prevStop = parseISODateTime(prev.plannedStop);
      const currStart = parseISODateTime(curr.plannedStart);
      if (!prevStop || !currStart) continue;
      if (currStart.getTime() < prevStop.getTime()) continue; // overlap → skip

      // Skip if curr already depends on prev (preserve existing)
      const currDeps = Array.isArray(curr.dependsOn) ? curr.dependsOn : [];
      if (currDeps.includes(prev.id)) continue;

      // Skip if adding prev as dependency of curr would create a cycle
      if (wouldCreateCycle(curr.id, prev.id, rows)) continue;

      // Record
      if (!updates[curr.id]) updates[curr.id] = [];
      updates[curr.id].push(prev.id);
      changes.push({
        taskId: curr.id,
        taskName: curr.task || curr.module || `Row #${curr.id}`,
        addedDepId: prev.id,
        addedDepName: prev.task || prev.module || `Row #${prev.id}`,
        userName,
      });
    }
  });

  return { changes, updates };
}