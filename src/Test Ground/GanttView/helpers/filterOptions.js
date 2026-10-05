import { getDisplayStatus } from "../../helpers/statusDisplay";

// ── NEW: Date formatting helper ──
function fmtDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const dateStr = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeStr = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24-hour format e.g. "10:00", "18:30"
  });

  return `${dateStr} ${timeStr}`;
}



/**
 * Format duration hours as "Xh Ym". Empty/null → null (caller shows "—").
 * 8 → "8h 0m", 2.5 → "2h 30m", 0.02 → "0h 1m" (rounds minutes)
 */
export function formatDurationHrs(val) {
  if (val === "" || val == null || isNaN(Number(val))) return null;
  const total = Number(val);
  if (total < 0) return null;
  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  if (minutes === 60) return `${hours + 1}h 0m`;
  return `${hours}h ${minutes}m`;
}
/**
 * Compute the top-level filter options (global toolbar).
 */
export function computeGlobalFilterOptions({
  projects,
  projectColorMap,
  projectFilter,
  moduleFilter,
  resourceFilter,
}) {
  const projectOpts = projects.map((p) => ({
    value: p.id,
    label: p.project || "Untitled",
    color: projectColorMap[p.id],
  }));

  const projectsForOpts =
    projectFilter.length > 0
      ? projects.filter((p) => projectFilter.includes(p.id))
      : projects;

  let scopedRows = projectsForOpts.flatMap((p) => p.rows || []);
  const modules = [
    ...new Set(scopedRows.filter((r) => r.module).map((r) => r.module)),
  ].sort();
  const moduleOpts = modules.map((m) => ({ value: m, label: m }));

  if (moduleFilter.length > 0) {
    scopedRows = scopedRows.filter((r) =>
      moduleFilter.includes(r.module || ""),
    );
  }

  const resourcesMap = new Map();
  scopedRows
    .filter((r) => r.resource)
    .forEach((r) => {
      if (!resourcesMap.has(r.resource)) {
        resourcesMap.set(r.resource, {
          value: r.resource,
          label: r.resourceName || r.resource,
        });
      }
    });
  const resourceOpts = Array.from(resourcesMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  if (resourceFilter.length > 0) {
    scopedRows = scopedRows.filter((r) =>
      resourceFilter.includes(r.resource || ""),
    );
  }

  const statuses = [
    ...new Set(scopedRows.map((r) => getDisplayStatus(r))),
  ].sort();
  const statusOpts = statuses.map((s) => ({ value: s, label: s }));

  return { projectOpts, moduleOpts, resourceOpts, statusOpts };
}

/**
 * Compute filter options for a single project (per-project column filters).
 * Now includes date columns and custom columns.
 */
export function computeProjectFilterOptions(project, currentFilter) {
  const allRows = project.rows || [];
  const customColumns = project.customColumns || [];

  const matchesFilters = (row, excludeKey) => {
    if (excludeKey !== "module" && currentFilter.module?.length > 0 && !currentFilter.module.includes(row.module || "")) return false;
    if (excludeKey !== "resource" && currentFilter.resource?.length > 0 && !currentFilter.resource.includes(row.resource || "")) return false;
    if (excludeKey !== "status" && currentFilter.status?.length > 0 && !currentFilter.status.includes(getDisplayStatus(row))) return false;
    
    // Date filters
    const dateKeys = ["plannedStart", "plannedStop", "actualStart", "actualStop"];
    for (const dk of dateKeys) {
      if (excludeKey !== dk && currentFilter[dk]?.length > 0 && !currentFilter[dk].includes(fmtDateShort(row[dk]))) return false;
    }

    // ── NEW: Duration filters ──
    if (excludeKey !== "plannedDuration" && currentFilter.plannedDuration?.length > 0) {
      const raw = row.durationHrs === "" || row.durationHrs == null ? "" : String(Number(row.durationHrs));
      if (!currentFilter.plannedDuration.includes(raw)) return false;
    }
    if (excludeKey !== "actualDuration" && currentFilter.actualDuration?.length > 0) {
      const raw = row.actualDurationHrs === "" || row.actualDurationHrs == null ? "" : String(Number(row.actualDurationHrs));
      if (!currentFilter.actualDuration.includes(raw)) return false;
    }

    // Custom column filters
    for (const col of customColumns) {
      if (excludeKey !== col.id && currentFilter[col.id]?.length > 0 && !currentFilter[col.id].includes(String(row.customValues?.[col.id] || "").trim())) return false;
    }
    return true;
  };

  // Standard options
  const rowsForModules = allRows.filter((r) => matchesFilters(r, "module"));
  const modules = [...new Set(rowsForModules.filter((r) => r.module).map((r) => r.module))].sort();

  const rowsForResources = allRows.filter((r) => matchesFilters(r, "resource"));
  const resourcesMap = new Map();
  rowsForResources.filter((r) => r.resource).forEach((r) => {
    if (!resourcesMap.has(r.resource)) resourcesMap.set(r.resource, { value: r.resource, label: r.resourceName || r.resource });
  });
  const resources = Array.from(resourcesMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  const rowsForStatuses = allRows.filter((r) => matchesFilters(r, "status"));
  const statuses = [...new Set(rowsForStatuses.map((r) => getDisplayStatus(r)))].sort();

  // Date options
  const dateKeys = ["plannedStart", "plannedStop", "actualStart", "actualStop"];
  const dateOpts = {};
  dateKeys.forEach((dk) => {
    const rowsForDate = allRows.filter((r) => matchesFilters(r, dk));
    const uniqueDates = [...new Set(rowsForDate.map((r) => fmtDateShort(r[dk])).filter(Boolean))].sort();
    dateOpts[dk] = uniqueDates.map((d) => ({ value: d, label: d }));
  });

  // ── NEW: Duration options ──
  const rowsForPlanDur = allRows.filter((r) => matchesFilters(r, "plannedDuration"));
  const planDurSet = new Set();
  rowsForPlanDur.forEach(r => { if (r.durationHrs !== "" && r.durationHrs != null) planDurSet.add(String(Number(r.durationHrs))); });
  const plannedDuration = [...planDurSet].sort((a, b) => Number(a) - Number(b)).map(v => ({ value: v, label: formatDurationHrs(v) || v }));

  const rowsForActDur = allRows.filter((r) => matchesFilters(r, "actualDuration"));
  const actDurSet = new Set();
  rowsForActDur.forEach(r => { if (r.actualDurationHrs !== "" && r.actualDurationHrs != null) actDurSet.add(String(Number(r.actualDurationHrs))); });
  const actualDuration = [...actDurSet].sort((a, b) => Number(a) - Number(b)).map(v => ({ value: v, label: formatDurationHrs(v) || v }));

  // Custom column options
  const customOpts = {};
  customColumns.forEach((col) => {
    const rowsForCol = allRows.filter((r) => matchesFilters(r, col.id));
    const uniqueVals = [...new Set(rowsForCol.map((r) => String(r.customValues?.[col.id] || "").trim()).filter(Boolean))].sort();
    customOpts[col.id] = uniqueVals.map((v) => ({ value: v, label: v }));
  });

  return {
    moduleOpts: modules.map((m) => ({ value: m, label: m })),
    resourceOpts: resources,
    statusOpts: statuses.map((s) => ({ value: s, label: s })),
    ...dateOpts,
    plannedDuration, // ← Added here
    actualDuration,  // ← Added here
    customOpts,
  };
}

export { fmtDateShort };