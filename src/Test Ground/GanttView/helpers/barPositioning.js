/* ═══════════════════════════════════════════════════════
   Bar Positioning Helper
   ═══════════════════════════════════════════════════════ */

import { parseDt } from "./dateUtils";

/**
 * Factory that returns a function to compute a bar's left+width
 * within the chart based on start/stop dates.
 *
 * Returns null if either date is invalid.
 */
export function makeGetBarPosition(projectStart, totalMs, totalChartWidth) {
  return function getBarPosition(startVal, stopVal) {
    const start = parseDt(startVal);
    const end = parseDt(stopVal);
    if (!start || !end) return null;
    const left =
      ((start.getTime() - projectStart) / totalMs) * totalChartWidth;
    const width =
      ((end.getTime() - start.getTime()) / totalMs) * totalChartWidth;
    return { left: Math.max(0, left), width: Math.max(width, 4) };
  };
}