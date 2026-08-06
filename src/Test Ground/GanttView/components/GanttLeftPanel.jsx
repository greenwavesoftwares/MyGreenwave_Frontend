import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Briefcase,
  Filter,
  X,
  Eye,
  Maximize2,
} from "lucide-react";
import { useTheme } from "../../useTheme";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  SUB_HEADER_HEIGHT,
  COL_TASK_WIDTH,
  COL_MODULE_WIDTH,
  COL_RESOURCE_WIDTH,
  COL_STATUS_WIDTH,
} from "../helpers/constants";
import { getStatusColor } from "../helpers/statusColors";
import { computeProjectFilterOptions } from "../helpers/filterOptions";
import ProjectColumnFilterButton from "./ProjectColumnFilterButton";
import { getModuleColor } from "../../helpers/modules";
import { getDisplayStatus } from "../../helpers/statusDisplay";

/**
 * Desktop left panel with task list (task view) or resource list (resource view).
 * Handles project expand/collapse, per-project column filters, and row rendering.
 */
export default function GanttLeftPanel({
  viewMode,
  filteredProjects,
  allRows,
  resourceViewData,
  projectColorMap,
  moduleColorMap,
  expandedProjects,
  setExpandedProjects,
  expandedRows,
  setExpandedRows,
  hasChildren,
  getProjectFilter,
  updateProjectFilter,
  clearProjectFilters,
  hasProjectFilters,
  visibleColumns,
  leftPanelWidth,
  leftPanelRef,
  onOpenFullScreen,
  isFullScreen,
}) {
  const { t } = useTheme();

  return (
    <div
      style={{
        width: leftPanelWidth,
        flexShrink: 0,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        background: t.bgCard,
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: HEADER_HEIGHT,
          borderBottom: `1px solid ${t.border}`,
          background: t.bgSubtle,
          display: "flex",
          alignItems: "flex-end",
          padding: "0 12px 8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: t.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {viewMode === "task" ? "Project / Task" : "Resource"}
        </span>
      </div>

      <div ref={leftPanelRef} style={{ flex: 1, overflowY: "hidden" }}>
        {viewMode === "task"
          ? filteredProjects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const pc = projectColorMap[project.id] || t.textMuted;
              const projectRows = allRows.filter(
                (r) => r._projectId === project.id,
              );
              const projectFilter = getProjectFilter(project.id);
              const projectFilterOpts = computeProjectFilterOptions(
                project,
                projectFilter,
              );
              const hasFilters = hasProjectFilters(project.id);

              return (
                <React.Fragment key={project.id}>
                  {/* Project header */}
                  <div
                    onClick={() => {
                      setExpandedProjects((prev) => {
                        const next = new Set(prev);
                        if (next.has(project.id)) next.delete(project.id);
                        else next.add(project.id);
                        return next;
                      });
                    }}
                    style={{
                      height: ROW_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                      borderBottom: `1px solid ${t.border}`,
                      background: hasFilters ? t.primaryBgSubtle : t.bgSubtle,
                      cursor: "pointer",
                      gap: 6,
                      borderLeft: `4px solid ${pc}`,
                      transition: "background 0.15s",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown
                        size={13}
                        color={t.textMuted}
                        style={{ flexShrink: 0 }}
                      />
                    ) : (
                      <ChevronRight
                        size={13}
                        color={t.textMuted}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                    <Briefcase size={12} color={pc} style={{ flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: t.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={project.project || "Untitled"}
                      >
                        {project.project || "Untitled"}
                      </div>
                      <div
                        style={{
                          fontSize: 9.5,
                          color: t.textFaint,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>{(project.rows || []).length} tasks</span>
                        <span>•</span>
                        <span
                          style={{
                            textTransform: "capitalize",
                            fontWeight: 500,
                          }}
                        >
                          {project.status || "draft"}
                        </span>
                        {hasFilters && (
                          <>
                            <span>•</span>
                            <span
                              style={{
                                color: t.primary,
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Filter size={9} />
                              Filtered
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Full-screen view button (hidden inside full-screen modal) */}
                    {!isFullScreen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFullScreen?.(project.id);
                        }}
                        title="Expand to full screen"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 5,
                          border: `1px solid ${t.primaryBorder}`,
                          background: t.primaryBgSubtle,
                          color: t.primary,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        <Maximize2 size={11} />
                      </button>
                    )}
                    {isExpanded && hasFilters && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearProjectFilters(project.id);
                        }}
                        title="Clear all filters"
                        style={{
                          height: 22,
                          padding: "0 8px",
                          borderRadius: 4,
                          border: `1px solid ${t.dangerBorder}`,
                          background: t.dangerBgSubtle,
                          color: t.danger,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        <X size={10} /> Clear
                      </button>
                    )}
                  </div>

                  {/* Sub-header with column filters */}
                  {isExpanded && (
                    <div
                      style={{
                        height: SUB_HEADER_HEIGHT,
                        display: "flex",
                        borderBottom: `1px solid ${t.border}`,
                        background: t.bgSubtle,
                        borderLeft: `4px solid ${pc}80`,
                      }}
                    >
                      {/* Task */}
                      <div
                        style={{
                          width: COL_TASK_WIDTH - 4,
                          padding: "0 12px",
                          display: "flex",
                          alignItems: "center",
                          borderRight: `1px solid ${t.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: t.textFaint,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          Task
                        </span>
                      </div>

                      {/* Module */}
                      {visibleColumns.module && (
                        <div
                          style={{
                            width: COL_MODULE_WIDTH,
                            padding: "0 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRight: `1px solid ${t.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: t.textFaint,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Module
                          </span>
                          <ProjectColumnFilterButton
                            color={t.violet}
                            columnKey="module"
                            options={projectFilterOpts.moduleOpts}
                            selected={projectFilter.module}
                            onChange={(vals) =>
                              updateProjectFilter(project.id, "module", vals)
                            }
                          />
                        </div>
                      )}

                      {/* Resource */}
                      {visibleColumns.resource && (
                        <div
                          style={{
                            width: COL_RESOURCE_WIDTH,
                            padding: "0 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRight: `1px solid ${t.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: t.textFaint,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Resource
                          </span>
                          <ProjectColumnFilterButton
                            color={t.success}
                            columnKey="resource"
                            options={projectFilterOpts.resourceOpts}
                            selected={projectFilter.resource}
                            onChange={(vals) =>
                              updateProjectFilter(project.id, "resource", vals)
                            }
                          />
                        </div>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <div
                          style={{
                            width: COL_STATUS_WIDTH,
                            padding: "0 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: t.textFaint,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Status
                          </span>
                          <ProjectColumnFilterButton
                            color={t.warning}
                            columnKey="status"
                            options={projectFilterOpts.statusOpts}
                            selected={projectFilter.status}
                            onChange={(vals) =>
                              updateProjectFilter(project.id, "status", vals)
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task rows */}
                  {isExpanded &&
                    projectRows.map((row) => {
                      const isParent = hasChildren(row.id);
                      const isRowExpanded = expandedRows.has(row.id);
                      const displayStatus = getDisplayStatus(row);
                      const sc = getStatusColor(displayStatus, t);

                      return (
                        <div
                          key={row.id}
                          style={{
                            height: ROW_HEIGHT,
                            display: "flex",
                            borderBottom: `1px solid ${t.borderSubtle}`,
                          }}
                        >
                          {/* Task cell */}
                          <div
                            style={{
                              width: COL_TASK_WIDTH,
                              padding: "0 8px",
                              paddingLeft: 12 + row.depth * 16,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              borderRight: `1px solid ${t.borderSubtle}`,
                            }}
                          >
                            {isParent ? (
                              <button
                                onClick={() => {
                                  setExpandedRows((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(row.id)) next.delete(row.id);
                                    else next.add(row.id);
                                    return next;
                                  });
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0,
                                  color: t.textFaint,
                                  display: "flex",
                                  alignItems: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isRowExpanded ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronRight size={12} />
                                )}
                              </button>
                            ) : (
                              <span style={{ width: 12, flexShrink: 0 }} />
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: row.depth === 0 ? 600 : 400,
                                  color: t.textPrimary,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={row.task}
                              >
                                {row.task || "—"}
                              </div>
                            </div>
                          </div>

                          {/* Module cell */}
                          {visibleColumns.module && (
                            <div
                              style={{
                                width: COL_MODULE_WIDTH,
                                padding: "0 10px",
                                display: "flex",
                                alignItems: "center",
                                borderRight: `1px solid ${t.borderSubtle}`,
                                overflow: "hidden",
                              }}
                            >
                              {row.module ? (
                                (() => {
                                  const mc = getModuleColor(
                                    row.module,
                                    moduleColorMap,
                                  );
                                  return (
                                    <span
                                      style={{
                                        padding: "2px 7px",
                                        borderRadius: 4,
                                        background: mc.bg,
                                        color: mc.color,
                                        border: `1px solid ${mc.border}`,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "100%",
                                      }}
                                      title={row.module}
                                    >
                                      {row.module}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span
                                  style={{
                                    color: t.textDisabled,
                                    fontStyle: "italic",
                                    fontSize: 10,
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </div>
                          )}

                          {/* Resource cell */}
                          {visibleColumns.resource && (
                            <div
                              style={{
                                width: COL_RESOURCE_WIDTH,
                                padding: "0 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                borderRight: `1px solid ${t.borderSubtle}`,
                                overflow: "hidden",
                              }}
                            >
                              {row.resource ? (
                                <>
                                  <div
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      background: t.primaryBg,
                                      color: t.primary,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 9,
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {(row.resourceName || row.resource || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <span
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: 10.5,
                                      color: t.textSecondary,
                                      fontWeight: 500,
                                    }}
                                    title={row.resourceName || row.resource}
                                  >
                                    {row.resourceName || row.resource}
                                  </span>
                                </>
                              ) : (
                                <span
                                  style={{
                                    color: t.textDisabled,
                                    fontStyle: "italic",
                                    fontSize: 10,
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </div>
                          )}

                          {/* Status cell */}
                          {visibleColumns.status && (
                            <div
                              style={{
                                width: COL_STATUS_WIDTH,
                                padding: "0 10px",
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  background: sc.bg,
                                  color: sc.color,
                                  border: `1px solid ${sc.border}`,
                                  textTransform: "capitalize",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "100%",
                                }}
                                title={displayStatus}
                              >
                                {displayStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Empty state */}
                  {isExpanded && hasFilters && projectRows.length === 0 && (
                    <div
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        borderBottom: `1px solid ${t.borderSubtle}`,
                        background: t.bgSubtle,
                      }}
                    >
                      <Filter
                        size={18}
                        color={t.textDisabled}
                        style={{ marginBottom: 6 }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: t.textMuted,
                          fontWeight: 600,
                          marginBottom: 3,
                        }}
                      >
                        No matching tasks
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearProjectFilters(project.id);
                        }}
                        style={{
                          height: 22,
                          padding: "0 8px",
                          borderRadius: 4,
                          border: `1px solid ${t.borderStrong}`,
                          background: t.bgCard,
                          color: t.textMuted,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "Sora,sans-serif",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          marginTop: 4,
                        }}
                      >
                        <X size={10} /> Clear Filters
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          : /* Resource view */
            resourceViewData.map((res) => {
              const rowHeight = ROW_HEIGHT * res.laneCount;
              return (
                <div
                  key={res.userId}
                  style={{
                    height: rowHeight,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    borderBottom: `1px solid ${t.borderSubtle}`,
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: t.primaryBg,
                      color: t.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(res.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: t.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {res.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: t.textFaint }}>
                      {res.tasks.length} task
                      {res.tasks.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
