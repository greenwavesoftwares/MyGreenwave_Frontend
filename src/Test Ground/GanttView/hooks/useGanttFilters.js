/* ═══════════════════════════════════════════════════════
   useGanttFilters
   Manages global (toolbar) filters + per-project filters.
   Includes auto-cleanup of invalid selections when data changes.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import { computeProjectFilterOptions } from "../helpers/filterOptions";

export function useGanttFilters({ filterOptions, filteredProjects }) {
  // Global toolbar filters
  const [projectFilter, setProjectFilter] = useState([]);
  const [moduleFilter, setModuleFilter] = useState([]);
  const [resourceFilter, setResourceFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);

  // Per-project filters (in left-panel column headers)
  const [projectFilters, setProjectFilters] = useState({});

  // ── Cleanup: remove invalid per-project filter selections ──
  useEffect(() => {
    setProjectFilters((prevFilters) => {
      let hasChanges = false;
      const newFilters = { ...prevFilters };

      filteredProjects.forEach((project) => {
        const currentFilter = prevFilters[project.id];
        if (!currentFilter) return;

        const isEmpty =
          currentFilter.module.length === 0 &&
          currentFilter.resource.length === 0 &&
          currentFilter.status.length === 0;
        if (isEmpty) return;

        const opts = computeProjectFilterOptions(project, currentFilter);
        const validModules = new Set(opts.moduleOpts.map((o) => o.value));
        const validResources = new Set(opts.resourceOpts.map((o) => o.value));
        const validStatuses = new Set(opts.statusOpts.map((o) => o.value));

        const cleanedModule = currentFilter.module.filter((m) =>
          validModules.has(m),
        );
        const cleanedResource = currentFilter.resource.filter((r) =>
          validResources.has(r),
        );
        const cleanedStatus = currentFilter.status.filter((s) =>
          validStatuses.has(s),
        );

        const changed =
          cleanedModule.length !== currentFilter.module.length ||
          cleanedResource.length !== currentFilter.resource.length ||
          cleanedStatus.length !== currentFilter.status.length;

        if (changed) {
          hasChanges = true;
          newFilters[project.id] = {
            module: cleanedModule,
            resource: cleanedResource,
            status: cleanedStatus,
          };
        }
      });

      return hasChanges ? newFilters : prevFilters;
    });
  }, [filteredProjects]);

  // ── Cleanup: remove invalid global filter selections ──
  useEffect(() => {
    const validModuleValues = filterOptions.moduleOpts.map((o) => o.value);
    const validResourceValues = filterOptions.resourceOpts.map((o) => o.value);
    const validStatusValues = filterOptions.statusOpts.map((o) => o.value);

    setModuleFilter((prev) => {
      const filtered = prev.filter((m) => validModuleValues.includes(m));
      return filtered.length === prev.length ? prev : filtered;
    });
    setResourceFilter((prev) => {
      const filtered = prev.filter((r) => validResourceValues.includes(r));
      return filtered.length === prev.length ? prev : filtered;
    });
    setStatusFilter((prev) => {
      const filtered = prev.filter((s) => validStatusValues.includes(s));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [
    filterOptions.moduleOpts,
    filterOptions.resourceOpts,
    filterOptions.statusOpts,
  ]);

  // ── Helpers for per-project filters ──
  const getProjectFilter = useCallback(
    (projectId) => {
      return (
        projectFilters[projectId] || {
          module: [],
          resource: [],
          status: [],
        }
      );
    },
    [projectFilters],
  );

  const updateProjectFilter = useCallback(
    (projectId, filterKey, values) => {
      setProjectFilters((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || { module: [], resource: [], status: [] }),
          [filterKey]: values,
        },
      }));
    },
    [],
  );

  const clearProjectFilters = useCallback((projectId) => {
    setProjectFilters((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  }, []);

  const hasProjectFilters = useCallback(
    (projectId) => {
      const f = getProjectFilter(projectId);
      return (
        f.module.length > 0 || f.resource.length > 0 || f.status.length > 0
      );
    },
    [getProjectFilter],
  );

  return {
    // Global filter state + setters
    projectFilter,
    setProjectFilter,
    moduleFilter,
    setModuleFilter,
    resourceFilter,
    setResourceFilter,
    statusFilter,
    setStatusFilter,

    // Per-project helpers
    projectFilters,
    getProjectFilter,
    updateProjectFilter,
    clearProjectFilters,
    hasProjectFilters,
  };
}