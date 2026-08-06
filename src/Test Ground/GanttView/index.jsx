import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { useTheme } from "../useTheme";
import { useResponsive } from "../useResponsive";
import { computeArrows } from "../helpers/ganttArrows";
import FullScreenProjectModal from "./components/FullScreenProjectModal";
// Constants + helpers
import {
  ZOOM_CONFIGS,
  LEFT_PANEL_WIDTH_COLLAPSED,
  LEFT_PANEL_WIDTH_EXPANDED,
  COL_TASK_WIDTH,
  COL_MODULE_WIDTH,
  COL_RESOURCE_WIDTH,
  COL_STATUS_WIDTH,
} from "./helpers/constants";

// Hooks
import { useColumnVisibility } from "./hooks/useColumnVisibility";
import { useGanttFilters } from "./hooks/useGanttFilters";
import { useGanttData } from "./hooks/useGanttData";
import { useGanttGeometry } from "./hooks/useGanttGeometry";

// Components
import GanttToolbar from "./components/GanttToolbar";
import GanttMobileToolbar from "./components/GanttMobileToolbar";
import GanttLeftPanel from "./components/GanttLeftPanel";
import GanttTimeline from "./components/GanttTimeline";
import GanttTooltip from "./components/GanttTooltip";
import MobileTaskListSheet from "./components/mobile/MobileTaskListSheet";
import MobileToolsSheet from "./components/mobile/MobileToolsSheet";
import MobileTaskDetailSheet from "./components/mobile/MobileTaskDetailSheet";
import { getDisplayStatus } from "../helpers/statusDisplay";

/* ═══════════════════════════════════════════════════════
   GanttView — main orchestrator
   ═══════════════════════════════════════════════════════ */
export default function GanttView({
  projects = [],
  onOpenComments,
  onFeedback,
  showGlobalFilters = false, // reserved for future toolbar filters
  isFullScreen = false,
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();

  // ── Mobile-only UI state ──
  const [mobileLeftPanelOpen, setMobileLeftPanelOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // ── View / zoom / interaction state ──
  const [viewMode, setViewMode] = useState("task");
  const [zoom, setZoom] = useState("day");
  const [colWidthPx, setColWidthPx] = useState(
    ZOOM_CONFIGS.day.defaultColWidth,
  );
  const [tooltip, setTooltip] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(
    () => new Set(projects.map((p) => p.id)),
  );
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [showDependencies, setShowDependencies] = useState(false);
  // Full-screen project modal
  const [fullScreenProjectId, setFullScreenProjectId] = useState(null);
  const fullScreenProject = useMemo(
    () => projects.find((p) => p.id === fullScreenProjectId) || null,
    [projects, fullScreenProjectId],
  );

  // ── Refs ──
  const timelineRef = useRef(null);
  const leftPanelRef = useRef(null);
  const barsRef = useRef(new Map()); // Map<rowId, DOM element>

  // Force re-measure when arrows toggle or data changes
  const [measureVersion, setMeasureVersion] = useState(0);

  // ── Column visibility ──
  const { visibleColumns, toggleColumn } = useColumnVisibility();

  // ── Filters hook (needs filterOptions + filteredProjects passed later via re-order) ──
  // We use a placeholder + build data below; filters cleanup uses filteredProjects
  // Because of interdependence, we compute in stages:

  // Stage 1: placeholder filter state
  const [projectFilter, setProjectFilter] = useState([]);
  const [moduleFilter, setModuleFilter] = useState([]);
  const [resourceFilter, setResourceFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [projectFilters, setProjectFilters] = useState({});

  const getProjectFilter = useCallback(
    (projectId) =>
      projectFilters[projectId] || { module: [], resource: [], status: [] },
    [projectFilters],
  );

  const updateProjectFilter = useCallback((projectId, filterKey, values) => {
    setProjectFilters((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || { module: [], resource: [], status: [] }),
        [filterKey]: values,
      },
    }));
  }, []);

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

  // Stage 2: compute data (depends on filter values)
  const {
    filteredProjects,
    projectColorMap,
    moduleColorMap,
    filterOptions,
    resourceViewData,
    allRows,
    hasChildren,
  } = useGanttData({
    projects,
    projectFilter,
    moduleFilter,
    resourceFilter,
    statusFilter,
    expandedProjects,
    expandedRows,
    getProjectFilter,
  });

  // Stage 3: cleanup effects for filters (auto-remove invalid selections)
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

        // Recompute per-project filter opts
        const allProjectRows = project.rows || [];
        const validModules = new Set(
          allProjectRows.filter((r) => r.module).map((r) => r.module),
        );
        const validResources = new Set(
          allProjectRows.filter((r) => r.resource).map((r) => r.resource),
        );
        const validStatuses = new Set(
          allProjectRows.map((r) => getDisplayStatus(r)),
        );

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

  // Stage 4: geometry (depends on filteredProjects, zoom, colWidthPx)
  const {
    projectStart,
    projectEnd,
    totalMs,
    totalChartWidth,
    ticks,
    majorTicks,
    todayLeft,
    weekendShades,
    getBarPosition,
  } = useGanttGeometry({ filteredProjects, zoom, colWidthPx });

  // ── Dynamic left panel width (based on visible columns) ──
  const dynamicLeftPanelWidth = useMemo(() => {
    return (
      COL_TASK_WIDTH +
      (visibleColumns.module ? COL_MODULE_WIDTH : 0) +
      (visibleColumns.resource ? COL_RESOURCE_WIDTH : 0) +
      (visibleColumns.status ? COL_STATUS_WIDTH : 0)
    );
  }, [visibleColumns]);

  // ── Sync scroll (timeline vertical → left panel) ──
  const syncScroll = useCallback((e) => {
    if (leftPanelRef.current)
      leftPanelRef.current.scrollTop = e.target.scrollTop;
  }, []);

  // ── Zoom preset reset ──
  useEffect(() => {
    setColWidthPx(ZOOM_CONFIGS[zoom].defaultColWidth);
  }, [zoom]);

  // ── Row DOM positions (for dependency arrows) ──
  const rowPositions = useMemo(() => {
    const positions = new Map();
    if (!showDependencies) return positions;

    const container = timelineRef.current;
    if (!container) return positions;

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    barsRef.current.forEach((el, rowId) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = rect.left - containerRect.left + scrollLeft;
      const top = rect.top - containerRect.top + scrollTop;
      positions.set(rowId, {
        left,
        right: left + rect.width,
        width: rect.width,
        top,
        bottom: top + rect.height,
        midY: top + rect.height / 2,
      });
    });

    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDependencies, measureVersion, allRows, resourceViewData]);

  // ── Dependency arrows ──
  const dependencyArrows = useMemo(() => {
    if (!showDependencies) return [];
    const allRenderedRows =
      viewMode === "task"
        ? allRows
        : resourceViewData.flatMap((res) => res.tasks);
    return computeArrows(allRenderedRows, rowPositions, t);
  }, [showDependencies, viewMode, allRows, resourceViewData, rowPositions, t]);

  // ── Total chart height ──
  const totalChartHeight = useMemo(() => {
    if (!timelineRef.current) return 1000;
    const contentDiv = timelineRef.current.querySelector("div");
    return contentDiv ? contentDiv.offsetHeight : 1000;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDependencies, measureVersion, allRows]);

  // Force re-measure on data/scroll changes
  useEffect(() => {
    if (showDependencies) {
      const timer = setTimeout(() => setMeasureVersion((v) => v + 1), 50);
      return () => clearTimeout(timer);
    }
  }, [
    showDependencies,
    viewMode,
    expandedProjects,
    expandedRows,
    filteredProjects,
    colWidthPx,
    zoom,
  ]);

  useEffect(() => {
    if (!showDependencies) return;
    const el = timelineRef.current;
    if (!el) return;
    const handler = () => setMeasureVersion((v) => v + 1);
    el.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);
    return () => {
      el.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [showDependencies]);

  // ── Mobile: auto-zoom on mount ──
  useEffect(() => {
    if (!isMobile) return;
    setZoom("day");
    const availableWidth = window.innerWidth - 32;
    const idealColWidth = Math.floor(availableWidth / 8);
    setColWidthPx(Math.max(idealColWidth, 50));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // ── Mobile: scroll to today ──
  useEffect(() => {
    if (!isMobile || !timelineRef.current || todayLeft === null) return;
    const scrollTarget = Math.max(0, todayLeft - 20);
    requestAnimationFrame(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollLeft = scrollTarget;
      }
    });
  }, [isMobile, todayLeft]);

  // ── Bar click handler ──
  const handleBarClick = (e, row) => {
    e.stopPropagation();
    setTooltip({ row, x: e.clientX, y: e.clientY });
  };

  // ── Mobile: jump to today ──
  const handleJumpToToday = useCallback(() => {
    if (timelineRef.current && todayLeft !== null) {
      timelineRef.current.scrollTo({
        left: Math.max(0, todayLeft - 20),
        behavior: "smooth",
      });
    }
  }, [todayLeft]);

  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: isMobile
          ? "calc(100vh - 48px - 60px - 24px)"
          : "calc(100vh - 140px)",
        minHeight: 400,
        color: t.textPrimary,
      }}
    >
      {/* Toolbar */}
      {!isMobile ? (
        <GanttToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          zoom={zoom}
          setZoom={setZoom}
          colWidthPx={colWidthPx}
          setColWidthPx={setColWidthPx}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          showDependencies={showDependencies}
          setShowDependencies={setShowDependencies}
        />
      ) : (
        <GanttMobileToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          showDependencies={showDependencies}
          setShowDependencies={setShowDependencies}
          onOpenTaskList={() => setMobileLeftPanelOpen(true)}
          onJumpToToday={handleJumpToToday}
          onOpenTools={() => setMobileToolsOpen(true)}
          todayEnabled={todayLeft !== null}
        />
      )}

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel (desktop only) */}
        {!isMobile && (
          <GanttLeftPanel
            viewMode={viewMode}
            filteredProjects={filteredProjects}
            allRows={allRows}
            resourceViewData={resourceViewData}
            projectColorMap={projectColorMap}
            moduleColorMap={moduleColorMap}
            expandedProjects={expandedProjects}
            setExpandedProjects={setExpandedProjects}
            expandedRows={expandedRows}
            setExpandedRows={setExpandedRows}
            hasChildren={hasChildren}
            getProjectFilter={getProjectFilter}
            updateProjectFilter={updateProjectFilter}
            clearProjectFilters={clearProjectFilters}
            hasProjectFilters={hasProjectFilters}
            visibleColumns={visibleColumns}
            leftPanelWidth={dynamicLeftPanelWidth}
            leftPanelRef={leftPanelRef}
            onOpenFullScreen={setFullScreenProjectId} // ← NEW
            isFullScreen={isFullScreen}
          />
        )}

        {/* Timeline */}
        <GanttTimeline
          timelineRef={timelineRef}
          syncScroll={syncScroll}
          totalChartWidth={totalChartWidth}
          totalChartHeight={totalChartHeight}
          zoom={zoom}
          colWidthPx={colWidthPx}
          ticks={ticks}
          majorTicks={majorTicks}
          weekendShades={weekendShades}
          todayLeft={todayLeft}
          projectStart={projectStart}
          totalMs={totalMs}
          viewMode={viewMode}
          filteredProjects={filteredProjects}
          allRows={allRows}
          resourceViewData={resourceViewData}
          expandedProjects={expandedProjects}
          projectColorMap={projectColorMap}
          hasProjectFilters={hasProjectFilters}
          getBarPosition={getBarPosition}
          barsRef={barsRef}
          handleBarClick={handleBarClick}
          hoveredRowId={hoveredRowId}
          setHoveredRowId={setHoveredRowId}
          showDependencies={showDependencies}
          dependencyArrows={dependencyArrows}
        />
      </div>

      {/* Desktop tooltip */}
      {tooltip && !isMobile && (
        <GanttTooltip
          row={tooltip.row}
          x={tooltip.x}
          y={tooltip.y}
          onClose={() => setTooltip(null)}
          onOpenComments={onOpenComments}
          onFeedback={onFeedback}
        />
      )}

      {/* Mobile: task list bottom sheet */}
      {isMobile && (
        <MobileTaskListSheet
          open={mobileLeftPanelOpen}
          onClose={() => setMobileLeftPanelOpen(false)}
          viewMode={viewMode}
          filteredProjects={filteredProjects}
          allRows={allRows}
          resourceViewData={resourceViewData}
          projectColorMap={projectColorMap}
          moduleColorMap={moduleColorMap}
          expandedProjects={expandedProjects}
          setExpandedProjects={setExpandedProjects}
          rowPositions={rowPositions}
          timelineRef={timelineRef}
          onOpenFullScreen={setFullScreenProjectId} // ← NEW
          isFullScreen={isFullScreen}
        />
      )}

      {/* Mobile: tools bottom sheet */}
      {isMobile && (
        <MobileToolsSheet
          open={mobileToolsOpen}
          onClose={() => setMobileToolsOpen(false)}
          zoom={zoom}
          setZoom={setZoom}
          colWidthPx={colWidthPx}
          setColWidthPx={setColWidthPx}
        />
      )}

      {/* Mobile: task detail bottom sheet */}
      {isMobile && tooltip && (
        <MobileTaskDetailSheet
          row={tooltip.row}
          onClose={() => setTooltip(null)}
          onOpenComments={onOpenComments}
          onFeedback={onFeedback}
        />
      )}
      {/* Full-screen project modal */}
      {fullScreenProject && (
        <FullScreenProjectModal
          project={fullScreenProject}
          onClose={() => setFullScreenProjectId(null)}
          onOpenComments={onOpenComments}
          onFeedback={onFeedback}
        />
      )}
      {/* Pulse animation for running bars */}
      <style>{`
        @keyframes ganttPulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
