import { getDisplayStatus } from "../../helpers/statusDisplay";

// ── NEW: Date formatting helper ──
function fmtDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    if (
      excludeKey !== "module" &&
      currentFilter.module?.length > 0 &&
      !currentFilter.module.includes(row.module || "")
    )
      return false;
    if (
      excludeKey !== "resource" &&
      currentFilter.resource?.length > 0 &&
      !currentFilter.resource.includes(row.resource || "")
    )
      return false;
    if (
      excludeKey !== "status" &&
      currentFilter.status?.length > 0 &&
      !currentFilter.status.includes(getDisplayStatus(row))
    )
      return false;
    // ── NEW: Date filters ──
    const dateKeys = ["plannedStart", "plannedStop", "actualStart", "actualStop"];
    for (const dk of dateKeys) {
      if (
        excludeKey !== dk &&
        currentFilter[dk]?.length > 0 &&
        !currentFilter[dk].includes(fmtDateShort(row[dk]))
      )
        return false;
    }
    // ── NEW: Custom column filters ──
    for (const col of customColumns) {
      if (
        excludeKey !== col.id &&
        currentFilter[col.id]?.length > 0 &&
        !currentFilter[col.id].includes(
          String(row.customValues?.[col.id] || "").trim(),
        )
      )
        return false;
    }
    return true;
  };

  // Standard options
  const rowsForModules = allRows.filter((r) => matchesFilters(r, "module"));
  const modules = [
    ...new Set(rowsForModules.filter((r) => r.module).map((r) => r.module)),
  ].sort();

  const rowsForResources = allRows.filter((r) =>
    matchesFilters(r, "resource"),
  );
  const resourcesMap = new Map();
  rowsForResources
    .filter((r) => r.resource)
    .forEach((r) => {
      if (!resourcesMap.has(r.resource)) {
        resourcesMap.set(r.resource, {
          value: r.resource,
          label: r.resourceName || r.resource,
        });
      }
    });
  const resources = Array.from(resourcesMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  const rowsForStatuses = allRows.filter((r) => matchesFilters(r, "status"));
  const statuses = [
    ...new Set(rowsForStatuses.map((r) => getDisplayStatus(r))),
  ].sort();

  // ── NEW: Date options ──
  const dateKeys = ["plannedStart", "plannedStop", "actualStart", "actualStop"];
  const dateOpts = {};
  dateKeys.forEach((dk) => {
    const rowsForDate = allRows.filter((r) => matchesFilters(r, dk));
    const uniqueDates = [
      ...new Set(rowsForDate.map((r) => fmtDateShort(r[dk])).filter(Boolean)),
    ].sort();
    dateOpts[dk] = uniqueDates.map((d) => ({ value: d, label: d }));
  });

  // ── NEW: Custom column options ──
  const customOpts = {};
  customColumns.forEach((col) => {
    const rowsForCol = allRows.filter((r) => matchesFilters(r, col.id));
    const uniqueVals = [
      ...new Set(
        rowsForCol
          .map((r) => String(r.customValues?.[col.id] || "").trim())
          .filter(Boolean),
      ),
    ].sort();
    customOpts[col.id] = uniqueVals.map((v) => ({ value: v, label: v }));
  });

  return {
    moduleOpts: modules.map((m) => ({ value: m, label: m })),
    resourceOpts: resources,
    statusOpts: statuses.map((s) => ({ value: s, label: s })),
    ...dateOpts,                    // plannedStart, plannedStop, actualStart, actualStop
    customOpts,                     // { [colId]: [{ value, label }] }
  };
}

export { fmtDateShort };