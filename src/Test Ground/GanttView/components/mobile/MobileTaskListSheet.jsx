import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Briefcase,
  Eye,
  Maximize2,
} from "lucide-react";
import BottomSheet from "../../../shared/BottomSheet";
import { useTheme } from "../../../useTheme";
import { getStatusColor } from "../../helpers/statusColors";
import { getModuleColor } from "../../../helpers/modules";
import { getDisplayStatus } from "../../../helpers/statusDisplay";

/**
 * Bottom sheet showing the task tree (task view) or resource list (resource view).
 * Tapping a task scrolls the timeline to that bar.
 */
export default function MobileTaskListSheet({
  open,
  onClose,
  viewMode,
  filteredProjects,
  allRows,
  resourceViewData,
  projectColorMap,
  moduleColorMap,
  expandedProjects,
  setExpandedProjects,
  rowPositions,
  timelineRef,
  onOpenFullScreen,
  isFullScreen,
}) {
  const { t } = useTheme();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={viewMode === "task" ? "Tasks" : "Resources"}
      height="full"
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {viewMode === "task" ? (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredProjects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const pc = projectColorMap[project.id] || t.textMuted;
              const projectRows = allRows.filter(
                (r) => r._projectId === project.id,
              );

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
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: t.bgSubtle,
                      borderBottom: `1px solid ${t.border}`,
                      borderLeft: `4px solid ${pc}`,
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} color={t.textMuted} />
                    ) : (
                      <ChevronRight size={16} color={t.textMuted} />
                    )}
                    <Briefcase size={14} color={pc} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: t.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.project || "Untitled"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: t.textFaint,
                          marginTop: 2,
                        }}
                      >
                        {(project.rows || []).length} tasks ·{" "}
                        {project.status || "draft"}
                      </div>
                    </div>
                    {/* Full-screen view button (hidden inside full-screen modal) */}
                    {!isFullScreen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFullScreen?.(project.id);
                          onClose();
                        }}
                        title="Expand to full screen"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 7,
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
                        <Maximize2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Task rows */}
                  {isExpanded &&
                    projectRows.map((row) => {
                      const displayStatus = getDisplayStatus(row);
                      const sc = getStatusColor(displayStatus, t);
                      return (
                        <div
                          key={row.id}
                          onClick={() => {
                            const pos = rowPositions?.get(row.id);
                            if (pos && timelineRef.current) {
                              timelineRef.current.scrollTo({
                                left: Math.max(0, pos.left - 20),
                                behavior: "smooth",
                              });
                            }
                            onClose();
                          }}
                          style={{
                            padding: "12px 16px",
                            paddingLeft: 16 + row.depth * 12,
                            borderBottom: `1px solid ${t.borderSubtle}`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            WebkitTapHighlightColor: "transparent",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: row.depth === 0 ? 600 : 400,
                                color: t.textPrimary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.task || "—"}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: t.textFaint,
                                marginTop: 2,
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              {row.module &&
                                (() => {
                                  const mc = getModuleColor(
                                    row.module,
                                    moduleColorMap,
                                  );
                                  return (
                                    <span
                                      style={{
                                        padding: "1px 6px",
                                        background: mc.bg,
                                        color: mc.color,
                                        border: `1px solid ${mc.border}`,
                                        borderRadius: 3,
                                        fontSize: 10,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {row.module}
                                    </span>
                                  );
                                })()}
                              {row.resource && (
                                <span>{row.resourceName || row.resource}</span>
                              )}
                            </div>
                          </div>
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
                              flexShrink: 0,
                            }}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          /* Resource list */
          <div style={{ flex: 1, overflowY: "auto" }}>
            {resourceViewData.map((res) => (
              <div
                key={res.userId}
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${t.borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: t.primaryBg,
                    color: t.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(res.name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {res.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: t.textFaint,
                      marginTop: 2,
                    }}
                  >
                    {res.tasks.length} task
                    {res.tasks.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
