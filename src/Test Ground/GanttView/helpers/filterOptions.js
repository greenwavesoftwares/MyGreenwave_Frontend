/* ═══════════════════════════════════════════════════════
   Filter Options Computation
   ═══════════════════════════════════════════════════════ */

/**
 * Compute the top-level filter options (global toolbar).
 *
 * Scoping order: project → module → resource → status.
 * Each filter narrows the options available for the next.
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
    ...new Set(scopedRows.map((r) => r.status || "Pending")),
  ].sort();
  const statusOpts = statuses.map((s) => ({ value: s, label: s }));

  return { projectOpts, moduleOpts, resourceOpts, statusOpts };
}

/**
 * Compute filter options for a single project (per-project column filters).
 * Uses cross-filtering so each dropdown shows only currently-valid options.
 */
export function computeProjectFilterOptions(project, currentFilter) {
  const allRows = project.rows || [];

  const matchesFilters = (row, excludeKey) => {
    if (
      excludeKey !== "module" &&
      currentFilter.module.length > 0 &&
      !currentFilter.module.includes(row.module || "")
    )
      return false;
    if (
      excludeKey !== "resource" &&
      currentFilter.resource.length > 0 &&
      !currentFilter.resource.includes(row.resource || "")
    )
      return false;
    if (
      excludeKey !== "status" &&
      currentFilter.status.length > 0 &&
      !currentFilter.status.includes(row.status || "Pending")
    )
      return false;
    return true;
  };

  const rowsForModules = allRows.filter((r) => matchesFilters(r, "module"));
  const modules = [
    ...new Set(rowsForModules.filter((r) => r.module).map((r) => r.module)),
  ].sort();

  const rowsForResources = allRows.filter((r) => matchesFilters(r, "resource"));
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
    ...new Set(rowsForStatuses.map((r) => r.status || "Pending")),
  ].sort();

  return {
    moduleOpts: modules.map((m) => ({ value: m, label: m })),
    resourceOpts: resources,
    statusOpts: statuses.map((s) => ({ value: s, label: s })),
  };
}