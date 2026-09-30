import { useMemo, useCallback } from "react";
import { PROJECT_COLORS } from "../helpers/constants";
import { MODULE_COLORS } from "../../helpers/constants";
import { assignLanes } from "../helpers/lanes";
import { computeGlobalFilterOptions } from "../helpers/filterOptions";
import { getDisplayStatus } from "../../helpers/statusDisplay";
import { fmtDateShort } from "../helpers/filterOptions"; // ← NEW

export function useGanttData({
  projects,
  projectFilter,
  moduleFilter,
  resourceFilter,
  statusFilter,
  expandedProjects,
  expandedRows,
  getProjectFilter,
}) {
  // ── Apply GLOBAL filters to projects ──
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (projectFilter.length > 0) {
      result = result.filter((p) => projectFilter.includes(p.id));
    }

    if (
      moduleFilter.length > 0 ||
      resourceFilter.length > 0 ||
      statusFilter.length > 0
    ) {
      result = result
        .map((p) => {
          const filteredRows = (p.rows || []).filter((r) => {
            if (
              moduleFilter.length > 0 &&
              !moduleFilter.includes(r.module || "")
            )
              return false;
            if (
              resourceFilter.length > 0 &&
              !resourceFilter.includes(r.resource || "")
            )
              return false;
            if (
              statusFilter.length > 0 &&
              !statusFilter.includes(getDisplayStatus(r))
            )
              return false;
            return true;
          });
          const finalIds = new Set(filteredRows.map((r) => r.id));
          filteredRows.forEach((r) => {
            let cur = (p.rows || []).find((x) => x.id === r.parentId);
            while (cur) {
              finalIds.add(cur.id);
              cur = (p.rows || []).find((x) => x.id === cur.parentId);
            }
          });
          return {
            ...p,
            rows: (p.rows || []).filter((r) => finalIds.has(r.id)),
          };
        })
        .filter((p) => p.rows.length > 0);
    }
    return result;
  }, [projects, projectFilter, moduleFilter, resourceFilter, statusFilter]);

  // ── Project color mapping ──
  const projectColorMap = useMemo(() => {
    const map = {};
    filteredProjects.forEach((p, i) => {
      map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length];
    });
    return map;
  }, [filteredProjects]);

  // ── Module color mapping ──
  const moduleColorMap = useMemo(() => {
    const uniqueModules = new Set();
    filteredProjects.forEach((p) => {
      (p.rows || []).forEach((r) => {
        if (r.module) uniqueModules.add(r.module);
      });
    });
    const map = {};
    Array.from(uniqueModules)
      .sort()
      .forEach((mod, idx) => {
        map[mod] = MODULE_COLORS[idx % MODULE_COLORS.length];
      });
    return map;
  }, [filteredProjects]);

  // ── Global filter options ──
  const filterOptions = useMemo(
    () =>
      computeGlobalFilterOptions({
        projects,
        projectColorMap,
        projectFilter,
        moduleFilter,
        resourceFilter,
      }),
    [projects, projectColorMap, projectFilter, moduleFilter, resourceFilter],
  );

  // ── Resource view data ──
  const resourceViewData = useMemo(() => {
    const map = new Map();
    filteredProjects.forEach((project) => {
      (project.rows || [])
        .filter((r) => !r.parentId)
        .forEach((r) => {
          const key = r.resource || "__unassigned__";
          if (!map.has(key)) {
            map.set(key, {
              userId: key,
              name: r.resourceName || r.resource || "Unassigned",
              tasks: [],
            });
          }
          map.get(key).tasks.push({
            ...r,
            _projectId: project.id,
            _projectName: project.project,
          });
        });
    });
    return Array.from(map.values()).map((res) => {
      const { tasks, laneCount } = assignLanes(res.tasks);
      return { ...res, tasks, laneCount };
    });
  }, [filteredProjects]);

  // ── hasChildren helper ──
  const hasChildren = useCallback(
    (rowId) =>
      filteredProjects.some((p) =>
        (p.rows || []).some((r) => r.parentId === rowId),
      ),
    [filteredProjects],
  );

  // ── Flattened rows list respecting expansion + per-project filters ──
  const allRows = useMemo(() => {
    const result = [];
    filteredProjects.forEach((project, pIdx) => {
      let rows = project.rows || [];
      const pFilter = getProjectFilter(project.id);
      const customColumns = project.customColumns || [];

      // ── Check if ANY filter is active (generic) ──
      const hasAnyFilter = Object.values(pFilter).some(
        (v) => Array.isArray(v) && v.length > 0,
      );

      if (hasAnyFilter) {
        const filteredRows = rows.filter((r) => {
          // Standard filters
          if (
            pFilter.module?.length > 0 &&
            !pFilter.module.includes(r.module || "")
          )
            return false;
          if (
            pFilter.resource?.length > 0 &&
            !pFilter.resource.includes(r.resource || "")
          )
            return false;
          if (
            pFilter.status?.length > 0 &&
            !pFilter.status.includes(getDisplayStatus(r))
          )
            return false;

          // ── NEW: Date filters ──
          const dateKeys = [
            "plannedStart",
            "plannedStop",
            "actualStart",
            "actualStop",
          ];
          for (const dk of dateKeys) {
            if (
              pFilter[dk]?.length > 0 &&
              !pFilter[dk].includes(fmtDateShort(r[dk]))
            )
              return false;
          }

          // ── NEW: Custom column filters ──
          for (const col of customColumns) {
            if (
              pFilter[col.id]?.length > 0 &&
              !pFilter[col.id].includes(
                String(r.customValues?.[col.id] || "").trim(),
              )
            )
              return false;
          }

          return true;
        });

        const finalIds = new Set(filteredRows.map((r) => r.id));
        filteredRows.forEach((r) => {
          let cur = rows.find((x) => x.id === r.parentId);
          while (cur) {
            finalIds.add(cur.id);
            cur = rows.find((x) => x.id === cur.parentId);
          }
        });
        rows = rows.filter((r) => finalIds.has(r.id));
      }

      const childrenMap = new Map();
      rows.forEach((r) => {
        const key = r.parentId || "__ROOT__";
        if (!childrenMap.has(key)) childrenMap.set(key, []);
        childrenMap.get(key).push(r);
      });

      const walk = (parentKey, depth) => {
        const children = childrenMap.get(parentKey) || [];
        children.forEach((node) => {
          result.push({
            ...node,
            depth,
            _projectId: project.id,
            _projectName: project.project || "Untitled",
            _projectIdx: pIdx,
            _isProjectRow: false,
          });
          if (childrenMap.has(node.id) && expandedRows.has(node.id)) {
            walk(node.id, depth + 1);
          }
        });
      };

      if (expandedProjects.has(project.id)) {
        walk("__ROOT__", 0);
      }
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects, expandedProjects, expandedRows, getProjectFilter]);

  return {
    filteredProjects,
    projectColorMap,
    moduleColorMap,
    filterOptions,
    resourceViewData,
    allRows,
    hasChildren,
  };
}