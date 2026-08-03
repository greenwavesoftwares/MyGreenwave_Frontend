/* ═══════════════════════════════════════════════════════
   useGanttGeometry
   Computes:
     - projectStart / projectEnd / totalMs (date range)
     - totalChartWidth
     - ticks / majorTicks
     - todayLeft (position of today's marker)
     - weekendShades (positions for weekend backgrounds)
     - getBarPosition helper
   ═══════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { DAY_MS, ZOOM_CONFIGS } from "../helpers/constants";
import {
  parseDt,
  generateTicks,
  generateMajorTicks,
} from "../helpers/dateUtils";
import { makeGetBarPosition } from "../helpers/barPositioning";

export function useGanttGeometry({ filteredProjects, zoom, colWidthPx }) {
  // ── Date range ──
  const { projectStart, projectEnd, totalMs } = useMemo(() => {
    const allDates = [];
    filteredProjects.forEach((p) => {
      (p.rows || []).forEach((r) => {
        const ps = parseDt(r.plannedStart);
        const pe = parseDt(r.plannedStop);
        const as = parseDt(r.actualStart);
        const ae = parseDt(r.actualStop);
        if (ps) allDates.push(ps.getTime());
        if (pe) allDates.push(pe.getTime());
        if (as) allDates.push(as.getTime());
        if (ae) allDates.push(ae.getTime());
      });
    });
    if (!allDates.length) {
      const now = Date.now();
      return {
        projectStart: now - DAY_MS * 7,
        projectEnd: now + DAY_MS * 7,
        totalMs: DAY_MS * 14,
      };
    }
    const start = Math.min(...allDates) - DAY_MS;
    const end = Math.max(...allDates) + DAY_MS;
    return { projectStart: start, projectEnd: end, totalMs: end - start };
  }, [filteredProjects]);

  // ── Chart width ──
  const totalChartWidth = useMemo(() => {
    const totalUnits = totalMs / ZOOM_CONFIGS[zoom].unitMs;
    return Math.max(totalUnits * colWidthPx, 800);
  }, [zoom, colWidthPx, totalMs]);

  // ── Ticks ──
  const ticks = useMemo(
    () => generateTicks(projectStart, projectEnd, ZOOM_CONFIGS[zoom].unitMs),
    [projectStart, projectEnd, zoom],
  );

  const majorTicks = useMemo(
    () => generateMajorTicks(projectStart, projectEnd),
    [projectStart, projectEnd],
  );

  // ── Today marker position ──
  const todayLeft = useMemo(() => {
    const now = Date.now();
    if (now < projectStart || now > projectEnd) return null;
    return ((now - projectStart) / totalMs) * totalChartWidth;
  }, [projectStart, projectEnd, totalMs, totalChartWidth]);

  // ── Weekend background shades ──
  const weekendShades = useMemo(() => {
    const shades = [];
    let cur = new Date(projectStart);
    cur.setHours(0, 0, 0, 0);
    while (cur.getTime() <= projectEnd) {
      if (cur.getDay() === 0 || cur.getDay() === 6) {
        const left =
          ((cur.getTime() - projectStart) / totalMs) * totalChartWidth;
        const width = (DAY_MS / totalMs) * totalChartWidth;
        shades.push({ left, width });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return shades;
  }, [projectStart, projectEnd, totalMs, totalChartWidth]);

  // ── Bar position helper ──
  const getBarPosition = useMemo(
    () => makeGetBarPosition(projectStart, totalMs, totalChartWidth),
    [projectStart, totalMs, totalChartWidth],
  );

  return {
    projectStart,
    projectEnd,
    totalMs,
    totalChartWidth,
    ticks,
    majorTicks,
    todayLeft,
    weekendShades,
    getBarPosition,
  };
}