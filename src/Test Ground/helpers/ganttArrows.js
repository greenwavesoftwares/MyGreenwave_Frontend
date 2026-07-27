/* ═══════════════════════════════════════════════════════
   Gantt Dependency Arrow Geometry
   Pure functions for computing SVG paths.
   ═══════════════════════════════════════════════════════ */

import { parseISODateTime } from "./dateUtils";
import { checkDependencyConflict } from "./dependencies";

/**
 * Compute the pixel position of a bar given a row.
 * Returns null if no dates.
 */
export function computeBarBox(row, projectStart, totalMs, totalChartWidth) {
  const start = parseISODateTime(row.plannedStart);
  const end = parseISODateTime(row.plannedStop);
  if (!start || !end) return null;

  const left =
    ((start.getTime() - projectStart) / totalMs) * totalChartWidth;
  const width =
    ((end.getTime() - start.getTime()) / totalMs) * totalChartWidth;

  return {
    left: Math.max(0, left),
    right: Math.max(0, left) + Math.max(width, 4),
    width: Math.max(width, 4),
  };
}

/**
 * Build a right-angle SVG path from a source bar's END to a target bar's START.
 *
 * Path shape:
 *
 *     sourceRight, sourceY ●───┐
 *                              │
 *                              │  (vertical elbow)
 *                              │
 *                              └──● targetLeft, targetY  →  (arrowhead)
 *
 * Adds an 8px right-offset from source before turning.
 */
export function buildElbowPath({
  sourceRight,
  sourceY,
  targetLeft,
  targetY,
  offset = 8,
}) {
  // Simple case: target is to the right of source
  if (targetLeft >= sourceRight) {
    // Standard 3-segment elbow: right → down → right
    const midX = sourceRight + offset;
    return `M ${sourceRight} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetLeft} ${targetY}`;
  }

  // Backward case: target starts BEFORE source ends
  // Route: right from source → down (halfway) → left to before target → down to target row → right to target
  const rightOfSource = sourceRight + offset;
  const leftOfTarget = targetLeft - offset;
  const midY = (sourceY + targetY) / 2;

  return `M ${sourceRight} ${sourceY} L ${rightOfSource} ${sourceY} L ${rightOfSource} ${midY} L ${leftOfTarget} ${midY} L ${leftOfTarget} ${targetY} L ${targetLeft} ${targetY}`;
}
/**
 * Determine arrow color based on dependency state.
 */
export function getArrowColor(sourceRow, targetRow, theme) {
  const conflictStatus = checkDependencyConflict(targetRow, sourceRow);
  const sourceStatus = String(sourceRow.status || "").toLowerCase().trim();
  const isSourceDone =
    sourceStatus === "completed" || sourceStatus === "finished";

  if (conflictStatus === "conflict") {
    return {
      stroke: "#EF4444",
      strokeWidth: 1.5,
      opacity: 0.85,
      state: "conflict",
    };
  }
  if (conflictStatus === "missing-dates") {
    return {
      stroke: theme.textDisabled,
      strokeWidth: 1,
      opacity: 0.5,
      state: "missing",
    };
  }
  if (isSourceDone) {
    return {
      stroke: "#22C55E",
      strokeWidth: 1.5,
      opacity: 0.75,
      state: "done",
    };
  }
  // Pending / normal
  return {
    stroke: theme.primary,
    strokeWidth: 1.5,
    opacity: 0.7,
    state: "pending",
  };
}

/**
 * Compute all arrows for a given set of rows + their pixel positions.
 *
 * @param positions - Map<rowId, {left, right, width, top, bottom, midY}>
 * @param rows - all rows in the project (flat)
 * @param theme - theme tokens for colors
 *
 * @returns array of arrow objects ready to render
 */
export function computeArrows(rows, positions, theme) {
  const arrows = [];

  rows.forEach((targetRow) => {
    if (!Array.isArray(targetRow.dependsOn) || targetRow.dependsOn.length === 0)
      return;

    const targetPos = positions.get(targetRow.id);
    if (!targetPos) return;

    targetRow.dependsOn.forEach((sourceId) => {
      const sourceRow = rows.find((r) => r.id === sourceId);
      if (!sourceRow) return;

      const sourcePos = positions.get(sourceId);
      if (!sourcePos) return;

      const path = buildElbowPath({
        sourceRight: sourcePos.right,
        sourceY: sourcePos.midY,
        targetLeft: targetPos.left,
        targetY: targetPos.midY,
      });

      const style = getArrowColor(sourceRow, targetRow, theme);

      arrows.push({
        id: `${sourceId}-${targetRow.id}`,
        sourceRow,
        targetRow,
        sourcePos,
        targetPos,
        path,
        ...style,
      });
    });
  });

  return arrows;
}