/* ═══════════════════════════════════════════════════════
   useColumnWidths
   Manages per-column widths + left panel width.
   Persists to localStorage.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  COL_TASK_WIDTH,
  COL_MODULE_WIDTH,
  COL_RESOURCE_WIDTH,
  COL_STATUS_WIDTH,
  COL_DATE_WIDTH,
  COL_CUSTOM_WIDTH,
  COL_DURATION_WIDTH,
} from "../helpers/constants";

const LS_COL_WIDTHS = "gantt-column-widths";
const LS_PANEL_WIDTH = "gantt-left-panel-width";

const DEFAULT_WIDTHS = {
  module: COL_MODULE_WIDTH,
  task: COL_TASK_WIDTH,
  resource: COL_RESOURCE_WIDTH,
  status: COL_STATUS_WIDTH,
  plannedStart: COL_DATE_WIDTH,
  plannedStop: COL_DATE_WIDTH,
  actualStart: COL_DATE_WIDTH,
  actualStop: COL_DATE_WIDTH,
   plannedDuration: COL_DURATION_WIDTH,
  actualDuration: COL_DURATION_WIDTH,
};

const MIN_WIDTHS = {
  module: 80,
  task: 120,
  resource: 48,
  status: 80,
  plannedStart: 90,
  plannedStop: 90,
  actualStart: 90,
  actualStop: 90,
  plannedDuration: 72,
  actualDuration: 72,
};

const DEFAULT_PANEL_WIDTH = 520;
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 1200;

export function useColumnWidths(visibleColumns = {}, customColumns = []) {
  // ── Column widths ──
  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COL_WIDTHS);
      if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
    } catch (e) {}
    return { ...DEFAULT_WIDTHS };
  });

  // ── Left panel width ──
  const [panelWidth, setPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_PANEL_WIDTH);
      if (saved) {
        const n = Number(saved);
        if (!isNaN(n) && n >= MIN_PANEL_WIDTH && n <= MAX_PANEL_WIDTH) return n;
      }
    } catch (e) {}
    return DEFAULT_PANEL_WIDTH;
  });

  // Persist column widths
  useEffect(() => {
    try {
      localStorage.setItem(LS_COL_WIDTHS, JSON.stringify(colWidths));
    } catch (e) {}
  }, [colWidths]);

  // Persist panel width
  useEffect(() => {
    try {
      localStorage.setItem(LS_PANEL_WIDTH, String(panelWidth));
    } catch (e) {}
  }, [panelWidth]);

  // Ensure custom columns have a default width entry
  useEffect(() => {
    if (!customColumns.length) return;
    setColWidths((prev) => {
      let changed = false;
      const next = { ...prev };
      customColumns.forEach((c) => {
        if (next[c.id] == null) {
          next[c.id] = COL_CUSTOM_WIDTH;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [customColumns]);

  const getWidth = useCallback(
    (key) => {
      if (colWidths[key] != null) return colWidths[key];
      if (DEFAULT_WIDTHS[key] != null) return DEFAULT_WIDTHS[key];
      return COL_CUSTOM_WIDTH;
    },
    [colWidths],
  );

  const getMinWidth = useCallback((key) => {
    return MIN_WIDTHS[key] != null ? MIN_WIDTHS[key] : 60;
  }, []);

  const setWidth = useCallback((key, width) => {
    const min = MIN_WIDTHS[key] != null ? MIN_WIDTHS[key] : 60;
    const clamped = Math.max(min, Math.min(width, 600));
    setColWidths((prev) => ({ ...prev, [key]: clamped }));
  }, []);

  // Fixed (non-task) visible columns total width
  const fixedColumnsWidth = useMemo(() => {
    let total = 0;
    if (visibleColumns.module) total += getWidth("module");
    if (visibleColumns.resource) total += getWidth("resource");
    if (visibleColumns.plannedStart) total += getWidth("plannedStart");
    if (visibleColumns.plannedStop) total += getWidth("plannedStop");
    if (visibleColumns.actualStart) total += getWidth("actualStart");
    if (visibleColumns.actualStop) total += getWidth("actualStop");
    if (visibleColumns.plannedDuration) total += getWidth("plannedDuration");
if (visibleColumns.actualDuration) total += getWidth("actualDuration");
    if (visibleColumns.status) total += getWidth("status");
    customColumns.forEach((c) => {
      if (visibleColumns[c.id]) total += getWidth(c.id);
    });
    return total;
  }, [visibleColumns, customColumns, getWidth]);

  // Task width = max(stored task width, leftover space in panel)
  // border-left of project rows is 4px; account for it lightly
  const taskWidth = useMemo(() => {
    const stored = getWidth("task");
    const leftover = panelWidth - fixedColumnsWidth - 4;
    return Math.max(stored, leftover, getMinWidth("task"));
  }, [panelWidth, fixedColumnsWidth, getWidth, getMinWidth]);

  // Total content width (for horizontal scroll decision)
  const contentWidth = fixedColumnsWidth + taskWidth;

  const setPanelWidthClamped = useCallback((w) => {
    setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, w)));
  }, []);

  return {
    getWidth,
    getMinWidth,
    setWidth,
    taskWidth,
    contentWidth,
    panelWidth,
    setPanelWidth: setPanelWidthClamped,
    MIN_PANEL_WIDTH,
    MAX_PANEL_WIDTH,
  };
}