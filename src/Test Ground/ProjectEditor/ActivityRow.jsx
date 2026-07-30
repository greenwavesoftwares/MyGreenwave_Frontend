import React, { useState, useRef } from "react";
import {
  Calendar,
  CornerDownRight,
  Plus,
  MessageSquare,
  RotateCcw,
  Star,
  Trash2,
  Link2, // ← NEW: for 🔗 predecessor
  Lock, // ← NEW: for 🔒 successor
  Pin, // ← NEW
  PinOff,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { makeInputStyle, makeIconBtn } from "../helpers/styles";
import { DEFAULT_CUSTOM_COL_WIDTH } from "../helpers/constants";
import {
  parseISODateTime,
  isoDateTime,
  fmtDisplay,
} from "../helpers/dateUtils";
import { isPending } from "../helpers/chains";
import { defaultFirstStart, addWorkHours } from "../helpers/workHours";

import ResChip from "../shared/ResChip";
import StatusBadge from "../shared/StatusBadge";
import ModuleInput from "../shared/ModuleInput";
import WorkingDatePicker from "../shared/WorkingDatePicker";
import SearchableDropdown from "../shared/SearchableDropdown";

import CustomValueCell from "./CustomValueCell";
import { getDependencyBadgeInfo, getSuccessors } from "../helpers/dependencies";

/**
 * One row in the activity table.
 * Handles all cells: #, Module, Task, Resource, Planned Start,
 * Duration, Planned Stop, Status, [Custom columns], Actions.
 */
const ActivityRow = React.memo(function ActivityRow({
  draft,
  row,
  idx,
  isFirstInChain,
  resources,
  groupResources,
  hasChildren,
  moduleColor,
  isOverlapping,
  parentRow,
  autoCalculate,
  customColumns,
  colWidths,
  allRows, // ← NEW: needed to compute deps
  onUpdate,
  onDelete,
  onAddSub,
  onAddRowBelow,
  onOpenComments,
  onRedoReject,
  onFeedback,
  onUpdateCustomValue,
  onOpenDependencies, // ← NEW: opens picker modal
  onViewSuccessors, // ← NEW: opens successors view
  onToggleAnchor,
}) {
  const { t } = useTheme();
  const inputStyle = makeInputStyle(t);
  const iconBtn = makeIconBtn(t);

  const res = row.resource
    ? resources.find((r) => r.userId === row.resource)
    : null;

  const startDisplay = row.plannedStart ? fmtDisplay(row.plannedStart) : "";
  const stopDisplay = row.plannedStop ? fmtDisplay(row.plannedStop) : "";
  const commentCount = row.commentCount || 0;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const dateBtnRef = useRef(null);

  const isPastStart = row.plannedStart
    ? new Date(parseISODateTime(row.plannedStart)) < new Date()
    : false;

  const statusLower = String(row.status || "pending")
    .toLowerCase()
    .trim();
  const isCompleted = statusLower === "completed";
  const isRowPending = !row.status || statusLower === "pending";

  const isParentNotPending = parentRow
    ? String(parentRow.status || "pending")
        .toLowerCase()
        .trim() !== "pending"
    : false;
  const isLockedByParent = !!row.parentId && isParentNotPending;
  const isLocked = !isPending(row) || isLockedByParent;
  // ── NEW: Compute dependency info ──
  const depBadge = allRows ? getDependencyBadgeInfo(row, allRows, t) : null;

  const successors = allRows ? getSuccessors(row.id, allRows) : [];
  const successorCount = successors.length;
  // ── Handle field update ──
  const handleField = (field, value) => {
    const TEXT_ONLY_FIELDS = ["module", "task"];
    const needsRecompute = !TEXT_ONLY_FIELDS.includes(field);

    const updated = {
      ...row,
      [field]:
        field === "durationHrs" ? (value === "" ? "" : Number(value)) : value,
    };

    // Auto-set planned start when a new resource is picked
    if (field === "resource" && value && !row.plannedStart) {
      try {
        const dt = defaultFirstStart(value, groupResources || {});
        if (dt instanceof Date && !isNaN(dt)) {
          updated.plannedStart = isoDateTime(dt);
          if (updated.durationHrs) {
            const stop = addWorkHours(
              dt,
              Number(updated.durationHrs),
              value,
              groupResources || {},
            );
            updated.plannedStop = isoDateTime(stop);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    onUpdate(updated, { recompute: needsRecompute });
  };

  // ── Depth-based cell background ──
  const cellBg = isOverlapping
    ? t.dangerBgSubtle
    : row.sortOrder === 0
      ? t.bgCard
      : row.sortOrder === 1
        ? t.bgSubtle
        : row.sortOrder === 2
          ? t.violetBg
          : t.bgMuted;

  const tdStyle = {
    padding: "8px 10px",
    borderBottom: `1px solid ${t.borderSubtle}`,
    background: cellBg,
    verticalAlign: "middle",
    fontSize: 12.5,
    color: t.textPrimary,
  };

  return (
    <tr
      style={{
        transition: "background .12s",
        background: isOverlapping ? t.dangerBgSubtle : "transparent",
        boxShadow: isOverlapping ? `inset 3px 0 0 0 ${t.danger}` : "none",
      }}
    >
      {/* ─── # ─── */}
      <td
        style={{
          ...tdStyle,
          textAlign: "center",
          color: isOverlapping ? t.danger : t.textFaint,
          fontWeight: 600,
          width: 44,
          fontSize: 11,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          {isOverlapping && (
            <span
              title="⚠ Resource overlap detected"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: t.danger,
                flexShrink: 0,
              }}
            />
          )}
          <span>{row.sortOrder === 0 ? idx : ""}</span>
        </div>
      </td>

      {/* ─── Module ─── */}
      <td style={{ ...tdStyle, width: 160 }}>
        {row.module && !isEditingModule ? (
          <span
            onClick={() => !isLocked && setIsEditingModule(true)}
            title={
              isLocked
                ? isLockedByParent
                  ? "Locked — parent task is not pending"
                  : "Locked — task not pending"
                : `${row.module} (click to edit)`
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              background: moduleColor.bg,
              color: moduleColor.color,
              border: `1px solid ${moduleColor.border}`,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.65 : 1,
            }}
          >
            {row.module}
          </span>
        ) : (
          <ModuleInput
            initialValue={row.module || ""}
            onCommit={(val) => {
              handleField("module", val);
              setIsEditingModule(false);
            }}
            onCancel={() => setIsEditingModule(false)}
          />
        )}
      </td>

      {/* ─── Task ─── */}
      <td style={{ ...tdStyle, width: 260 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {row.sortOrder > 0 && (
            <span
              style={{
                display: "inline-block",
                width: row.sortOrder * 18,
                flexShrink: 0,
              }}
            />
          )}
          {row.sortOrder > 0 && (
            <CornerDownRight
              size={13}
              color={t.textFaint}
              style={{ flexShrink: 0 }}
            />
          )}
          {row.sortOrder > 0 && (
            <span
              style={{
                background:
                  row.sortOrder === 1
                    ? t.violetBg
                    : row.sortOrder === 2
                      ? "#FCE7F3"
                      : t.warningBg,
                color:
                  row.sortOrder === 1
                    ? t.violet
                    : row.sortOrder === 2
                      ? "#BE185D"
                      : t.warning,
                border: `1px solid ${
                  row.sortOrder === 1
                    ? t.violetBorder
                    : row.sortOrder === 2
                      ? "#F9A8D4"
                      : t.warningBorder
                }`,
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: 9,
                fontWeight: 700,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              title={`Level ${row.sortOrder} sub-activity`}
            >
              L{row.sortOrder}
            </span>
          )}

          <input
            value={row.task || ""}
            onChange={(e) => !isLocked && handleField("task", e.target.value)}
            disabled={isLocked}
            title={
              isLocked
                ? isLockedByParent
                  ? "Locked — parent task is not pending"
                  : "Locked — task not pending"
                : row.task || ""
            }
            style={{
              ...inputStyle,
              height: 28,
              fontSize: 11.5,
              flex: 1,
              minWidth: 0,
              opacity: isLocked ? 0.65 : 1,
              cursor: isLocked ? "not-allowed" : "text",
            }}
          />
        </div>
      </td>

      {/* ─── Resource ─── */}
      <td style={{ ...tdStyle, width: 240 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            opacity: isLocked ? 0.65 : 1,
          }}
        >
          {res ? (
            <ResChip
              code={res.code}
              tone={res.tone}
              name={res.name}
              userId={res.userId}
            />
          ) : (
            <ResChip code="?" tone="empty" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchableDropdown
              value={row.resource || ""}
              onChange={(val) => handleField("resource", val)}
              title="Select Resource"
              disabled={!resources.length || isLocked}
              placeholder={
                isLocked
                  ? "Locked"
                  : resources.length
                    ? "Select resource..."
                    : "Pick group first"
              }
              searchPlaceholder="Search by name, code, email..."
              maxHeight={320}
              options={resources
                .filter(
                  (r) =>
                    r && typeof r.userId === "string" && r.userId.length > 0,
                )
                .map((r) => ({
                  value: r.userId,
                  label: r.name || r.userId,
                  code: r.code || "??",
                  tone: r.tone || 1,
                  sublabel: r.userId,
                }))}
              renderTrigger={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: t.textFaint, fontSize: 11.5 }}>
                      {resources.length
                        ? "Select resource..."
                        : "Pick group first"}
                    </span>
                  );
                }
                return (
                  <span
                    style={{
                      fontSize: 11.5,
                      color: t.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: t.textMuted, fontWeight: 400 }}>
                      {selected.code}
                    </span>
                    {" — "}
                    {selected.label}
                  </span>
                );
              }}
              renderOption={(opt, selected) => (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    minWidth: 0,
                  }}
                >
                  <ResChip code={opt.code} tone={opt.tone} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: selected ? 600 : 500,
                        color: t.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: t.textFaint,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                        marginTop: 1,
                      }}
                    >
                      {opt.sublabel}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </td>

      {/* ─── Planned Start ─── */}
      <td style={{ ...tdStyle, width: 180 }}>
        {hasChildren ? (
          // Parent row — show aggregated start (read-only)
          !row.resource ? (
            <span
              style={{ fontSize: 11, color: t.textFaint, fontStyle: "italic" }}
            >
              Assign resource first
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono',monospace",
                color: t.textSecondary,
              }}
            >
              {startDisplay || "—"}
              {startDisplay && (
                <span
                  style={{
                    marginLeft: 5,
                    background: t.infoBg,
                    color: t.info,
                    border: `1px solid ${t.infoBorder}`,
                    borderRadius: 3,
                    padding: "1px 5px",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  AUTO
                </span>
              )}
            </span>
          )
        ) : row.resource ? (
          (() => {
            const isAutoLocked = !!row._autoChained;
            const canPickDate = !isLocked && !isAutoLocked;

            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexWrap: "wrap",
                }}
              >
                {/* ── Auto-chained: read-only ── */}
                {isAutoLocked ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono',monospace",
                      color: t.textSecondary,
                      opacity: 0.9,
                    }}
                  >
                    {startDisplay || (
                      <span style={{ color: t.textFaint, fontStyle: "italic" }}>
                        Waiting…
                      </span>
                    )}
                    {startDisplay && (
                      <span
                        title="Auto-calculated"
                        style={{
                          background: t.infoBg,
                          color: t.info,
                          border: `1px solid ${t.infoBorder}`,
                          borderRadius: 3,
                          padding: "1px 5px",
                          fontSize: 9,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        ⚡ AUTO
                      </span>
                    )}
                  </span>
                ) : canPickDate ? (
                  // ── Editable date picker ──
                  <>
                    {isPastStart && draft.status === "draft" && (
                      <span
                        style={{
                          background: t.dangerBgSubtle,
                          color: t.danger,
                          border: `1px solid ${t.dangerBorder}`,
                          borderRadius: 3,
                          padding: "1px 5px",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "inline-block",
                          marginBottom: 3,
                        }}
                      >
                        ⚠ PAST
                      </span>
                    )}
                    <button
                      ref={dateBtnRef}
                      onClick={() => setPickerOpen(true)}
                      style={{
                        ...inputStyle,
                        height: 28,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono',monospace",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flex: 1,
                      }}
                    >
                      <Calendar size={12} />
                      <span style={{ flex: 1 }}>
                        {startDisplay || (
                          <span style={{ color: t.textFaint }}>Pick date…</span>
                        )}
                      </span>
                    </button>
                    {pickerOpen && (
                      <WorkingDatePicker
                        value={row.plannedStart}
                        resourceUserId={row.resource}
                        groupResources={groupResources}
                        anchorRef={dateBtnRef}
                        onChange={(val) => handleField("plannedStart", val)}
                        onClose={() => setPickerOpen(false)}
                      />
                    )}
                  </>
                ) : (
                  // ── Locked: read-only ──
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono',monospace",
                      color: t.textSecondary,
                      opacity: 0.9,
                    }}
                  >
                    {startDisplay || "—"}
                  </span>
                )}

                {/* ── Anchor toggle badge ── */}
                {/* {!isAutoLocked && ( */}
                {/* ── Anchor toggle switch ── */}
                {/* <div
                  onClick={() => !isLocked && onToggleAnchor(row)}
                  title={
                    isLocked
                      ? "Locked — cannot set anchor"
                      : row.isAnchor
                        ? "Anchor ON — click to remove"
                        : "Set as anchor (auto-chain from here)"
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.4 : 1,
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 11 }}>⚓</span>
                  <span
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: 26,
                      height: 14,
                      background: row.isAnchor ? t.success : t.borderStrong,
                      borderRadius: 999,
                      transition: "background .2s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: row.isAnchor ? 14 : 2,
                        width: 10,
                        height: 10,
                        background: "#fff",
                        borderRadius: "50%",
                        transition: "left .2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    />
                  </span>
                </div> */}
                {/* ── Anchor toggle button ── */}
                <button
                  onClick={() => !isLocked && onToggleAnchor(row)}
                  disabled={isLocked}
                  title={
                    isLocked
                      ? "Locked — cannot set anchor"
                      : row.isAnchor
                        ? "Anchor ON — click to remove"
                        : "Set as anchor (auto-chain from here)"
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    border: `1px solid ${row.isAnchor ? t.successBorder : t.border}`,
                    background: row.isAnchor ? t.successBg : "transparent",
                    color: row.isAnchor ? t.success : t.textFaint,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.4 : 1,
                    flexShrink: 0,
                    transition: "all .15s",
                    padding: 0,
                  }}
                >
                  {row.isAnchor ? (
                    <Pin size={12} fill="currentColor" />
                  ) : (
                    <PinOff size={12} />
                  )}
                </button>
                {/* )} */}
              </div>
            );
          })()
        ) : (
          <span
            style={{ fontSize: 11, color: t.textFaint, fontStyle: "italic" }}
          >
            Assign resource first
          </span>
        )}
      </td>

      {/* ─── Duration ─── */}
      <td style={{ ...tdStyle, width: 110, textAlign: "right" }}>
        {hasChildren && row._autoDuration ? (
          <span
            title="Auto-computed from sub-tasks"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: t.violet,
              background: t.violetBg,
              border: `1px solid ${t.violetBorder}`,
              borderRadius: 5,
              padding: "4px 8px",
              fontWeight: 600,
              cursor: "help",
            }}
          >
            Σ {row.durationHrs ?? "0"}
          </span>
        ) : (
          <input
            type="number"
            min="0"
            step="0.5"
            value={
              row.durationHrs === "" || row.durationHrs == null
                ? ""
                : row.durationHrs
            }
            onChange={(e) => handleField("durationHrs", e.target.value)}
            placeholder="—"
            disabled={isLocked}
            title={
              isLocked
                ? isLockedByParent
                  ? "Locked — parent task is not pending"
                  : "Locked — task not pending"
                : ""
            }
            style={{
              ...inputStyle,
              height: 28,
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono',monospace",
              textAlign: "right",
              width: "100%",
              opacity: isLocked ? 0.65 : 1,
              cursor: isLocked ? "not-allowed" : "text",
            }}
          />
        )}
      </td>

      {/* ─── Planned Stop ─── */}
      <td style={{ ...tdStyle, width: 180 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono',monospace",
            color: t.textSecondary,
          }}
        >
          {stopDisplay || "—"}
          {stopDisplay && (
            <span
              style={{
                marginLeft: 5,
                background: t.infoBg,
                color: t.info,
                border: `1px solid ${t.infoBorder}`,
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              AUTO
            </span>
          )}
        </span>
      </td>

      {/* ─── Status ─── */}
      <td style={{ ...tdStyle, width: 110, textAlign: "center" }}>
        <StatusBadge row={row} />
      </td>

      {/* ─── Custom Column Cells ─── */}
      {customColumns.map((col) => {
        const colWidth = colWidths[col.id] || DEFAULT_CUSTOM_COL_WIDTH;
        return (
          <CustomValueCell
            key={col.id}
            rowId={row.id}
            column={{ ...col, _width: colWidth }}
            value={row.customValues?.[col.id]}
            disabled={isLocked}
            onUpdate={onUpdateCustomValue}
            cellBg={cellBg}
          />
        );
      })}

      {/* ─── Actions ─── */}
      {/* Actions */}
      <td style={{ ...tdStyle, width: 190, textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Add row below */}
          {draft.status !== "closed" && row.sortOrder === 0 && (
            <button
              onClick={() => onAddRowBelow(row)}
              title={`Add row below in "${row.module || "module"}"`}
              style={{
                ...iconBtn,
                color: t.primary,
                borderColor: t.primaryBorder,
                background: t.primaryBgSubtle,
              }}
            >
              <Plus size={13} />
            </button>
          )}

          {/* ─── NEW: 🔗 Dependencies (predecessors) ─── */}
          {false && onOpenDependencies && (
            <button
              onClick={() => !isLocked && onOpenDependencies(row)}
              title={
                isLocked
                  ? "Dependencies locked — task not pending"
                  : depBadge
                    ? depBadge.title
                    : "Add dependencies"
              }
              disabled={isLocked}
              style={{
                ...iconBtn,
                color: depBadge ? depBadge.color : t.textFaint,
                borderColor: depBadge ? depBadge.border : t.border,
                background: depBadge ? depBadge.bg : "transparent",
                position: "relative",
                overflow: "visible",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <Link2 size={13} />
              {depBadge && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    background: depBadge.color,
                    color: t.textInverse,
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${t.bgCard}`,
                    boxShadow: t.shadowSm,
                    lineHeight: 1,
                  }}
                >
                  {depBadge.count > 99 ? "99+" : depBadge.count}
                </span>
              )}
            </button>
          )}

          {/* ─── NEW: 🔒 Successors (this row blocks others) ─── */}
          {onViewSuccessors && successorCount > 0 && (
            <button
              onClick={() => onViewSuccessors(row)}
              title={`${successorCount} task${successorCount !== 1 ? "s" : ""} depend on this task`}
              style={{
                ...iconBtn,
                color: t.warning,
                borderColor: t.warningBorder,
                background: t.warningBgSubtle,
                position: "relative",
                overflow: "visible",
              }}
            >
              <Lock size={13} />
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  background: t.warning,
                  color: t.textInverse,
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${t.bgCard}`,
                  boxShadow: t.shadowSm,
                  lineHeight: 1,
                }}
              >
                {successorCount > 99 ? "99+" : successorCount}
              </span>
            </button>
          )}

          {/* Comments */}
          <button
            onClick={() => onOpenComments(row)}
            title={
              commentCount > 0
                ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
                : "Comments"
            }
            style={{
              ...iconBtn,
              background: commentCount > 0 ? t.violetBg : "transparent",
              color: commentCount > 0 ? t.violet : t.textFaint,
              borderColor: commentCount > 0 ? t.violetBorder : t.border,
              position: "relative",
              overflow: "visible",
            }}
          >
            <MessageSquare size={13} />
            {commentCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  background: t.violet,
                  color: t.textInverse,
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${t.bgCard}`,
                  boxShadow: t.shadowSm,
                  lineHeight: 1,
                }}
              >
                {commentCount > 99 ? "99+" : commentCount}
              </span>
            )}
          </button>

          {/* Add sub-activity */}
          {row.sortOrder === 0 && isRowPending && !isLockedByParent && (
            <button
              onClick={() => onAddSub(row)}
              title="Add sub-activity"
              style={{
                ...iconBtn,
                color: t.violet,
                borderColor: t.violetBorder,
                background: t.violetBg,
              }}
            >
              <CornerDownRight size={13} />
            </button>
          )}

          {/* Redo */}
          {draft.status !== "closed" && isCompleted && (
            <button
              onClick={() => onRedoReject(row)}
              title="Redo / Reject — needs to be redone"
              style={{
                ...iconBtn,
                color: t.warning,
                borderColor: t.warningBorder,
                background: t.warningBgSubtle,
              }}
            >
              <RotateCcw size={13} />
            </button>
          )}

          {/* Feedback */}
          {(isCompleted || statusLower === "finished") && (
            <button
              onClick={() => onFeedback(row)}
              title={isCompleted ? "Rate & Finish task" : "View feedback"}
              style={{
                ...iconBtn,
                color: statusLower === "finished" ? t.violet : t.success,
                borderColor:
                  statusLower === "finished" ? t.violetBorder : t.successBorder,
                background:
                  statusLower === "finished" ? t.violetBg : t.successBgSubtle,
              }}
            >
              <Star
                size={13}
                fill={statusLower === "finished" ? t.violet : "none"}
              />
            </button>
          )}

          {/* Delete */}
          {isRowPending && !isLockedByParent && (
            <button
              onClick={() => onDelete(row)}
              title="Delete row"
              style={{
                ...iconBtn,
                color: t.danger,
                borderColor: t.dangerBorder,
                background: t.dangerBgSubtle,
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default ActivityRow;
