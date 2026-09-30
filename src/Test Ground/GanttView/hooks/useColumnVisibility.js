import { useState, useEffect, useCallback } from "react";
import { LS_VISIBLE_COLUMNS } from "../helpers/constants";

const DEFAULT_VISIBLE = {
  module: true,
  resource: true,
  status: true,
  // ── NEW: Date columns (hidden by default) ──
  plannedStart: false,
  plannedStop: false,
  actualStart: false,
  actualStop: false,
};

export function useColumnVisibility() {
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_VISIBLE_COLUMNS);
      if (saved) return { ...DEFAULT_VISIBLE, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_VISIBLE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_VISIBLE_COLUMNS,
        JSON.stringify(visibleColumns),
      );
    } catch (e) {}
  }, [visibleColumns]);

  const toggleColumn = useCallback((columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  return { visibleColumns, toggleColumn };
}