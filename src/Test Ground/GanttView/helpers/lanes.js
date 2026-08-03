/* ═══════════════════════════════════════════════════════
   Lane Assignment (Resource View)
   ═══════════════════════════════════════════════════════ */

import { parseDt } from "./dateUtils";

/**
 * Assign overlapping tasks to swim-lanes so they don't visually collide.
 * Returns { tasks: [...withLaneAssigned], laneCount }
 */
export function assignLanes(tasks) {
  const sorted = tasks
    .map((t) => {
      const start = parseDt(t.plannedStart);
      const end = parseDt(t.plannedStop);
      const actualStart = parseDt(t.actualStart);
      const actualEnd = parseDt(t.actualStop);
      const effectiveStart =
        start && actualStart
          ? Math.min(start.getTime(), actualStart.getTime())
          : (start || actualStart)?.getTime() || 0;
      const effectiveEnd =
        end && actualEnd
          ? Math.max(end.getTime(), actualEnd.getTime())
          : (end || actualEnd)?.getTime() || 0;
      return {
        ...t,
        _effectiveStart: effectiveStart,
        _effectiveEnd: effectiveEnd,
      };
    })
    .filter((t) => t._effectiveStart && t._effectiveEnd)
    .sort((a, b) => a._effectiveStart - b._effectiveStart);

  const lanes = [];
  sorted.forEach((task) => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (task._effectiveStart >= lanes[i]) {
        lanes[i] = task._effectiveEnd;
        task._lane = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      task._lane = lanes.length;
      lanes.push(task._effectiveEnd);
    }
  });

  tasks.forEach((t) => {
    const found = sorted.find((s) => s.id === t.id);
    t._lane = found ? found._lane : 0;
  });

  return {
    tasks: tasks.map((t) => {
      const found = sorted.find((s) => s.id === t.id);
      return { ...t, _lane: found ? found._lane : 0 };
    }),
    laneCount: Math.max(lanes.length, 1),
  };
}