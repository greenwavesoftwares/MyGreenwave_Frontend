/* hooks/useColumnOrder.js */
import { useState, useEffect, useCallback } from "react";

const LS_COLUMN_ORDER = "gantt-column-order";

export const DEFAULT_COLUMN_ORDER = [
  "module",
  "task",
  "resource",
  "plannedStart",
  "plannedStop",
  "actualStart",
  "actualStop",
  "plannedDuration",  // NEW
  "actualDuration",   // NEW
  "status",
];

export function useColumnOrder(customColumns = []) {
  const [order, setOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COLUMN_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          // merge with defaults so missing keys still exist
          const merged = [...parsed];
          DEFAULT_COLUMN_ORDER.forEach((k) => {
            if (!merged.includes(k)) merged.push(k);
          });
          return merged;
        }
      }
    } catch (e) {}
    return [...DEFAULT_COLUMN_ORDER];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMN_ORDER, JSON.stringify(order));
    } catch (e) {}
  }, [order]);

  useEffect(() => {
    if (!customColumns.length) return;
    setOrder((prev) => {
      const missing = customColumns
        .map((c) => c.id)
        .filter((id) => !prev.includes(id));
      return missing.length ? [...prev, ...missing] : prev;
    });
  }, [customColumns]);

  const moveColumn = useCallback((dragKey, dropKey) => {
    if (!dragKey || !dropKey || dragKey === dropKey) return;
    setOrder((prev) => {
      const next = prev.filter((k) => k !== dragKey);
      const dropIdx = next.indexOf(dropKey);
      if (dropIdx === -1) next.push(dragKey);
      else next.splice(dropIdx, 0, dragKey);
      return next;
    });
  }, []);

  const getVisibleOrder = useCallback(
    (visibleColumns = {}, projectCustomColumns = []) => {
      const customIds = new Set(
        (projectCustomColumns || []).map((c) => c.id),
      );

      const base = [...order];

      // ensure defaults exist
      DEFAULT_COLUMN_ORDER.forEach((k) => {
        if (!base.includes(k)) base.push(k);
      });

      // ensure this project's custom cols exist
      (projectCustomColumns || []).forEach((c) => {
        if (!base.includes(c.id)) base.push(c.id);
      });

      return base.filter((key) => {
        if (key === "task") return true;
        if (customIds.has(key)) return !!visibleColumns[key];
        // standard toggle columns
        if (
  [
    "module",
    "resource",
    "status",
    "plannedStart",
    "plannedStop",
    "actualStart",
    "actualStop",
    "plannedDuration",
    "actualDuration",
  ].includes(key)
) {
  return !!visibleColumns[key];
}
        return false;
      });
    },
    [order],
  );

  return { order, moveColumn, getVisibleOrder };
}