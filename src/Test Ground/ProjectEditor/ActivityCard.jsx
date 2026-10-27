import React, { useState, useRef } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Plus,
  MessageSquare,
  RotateCcw,
  Star,
  Trash2,
  Link2,
  Lock,
  MoreVertical,
  Edit,
  User,
  Pin, // ← NEW
  PinOff,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { makeInputStyle } from "../helpers/styles";
import {
  parseISODateTime,
  isoDateTime,
  fmtDisplay,
} from "../helpers/dateUtils";
import { isPending } from "../helpers/chains";
import { defaultFirstStart, addWorkHours } from "../helpers/workHours";
import { getDependencyBadgeInfo, getSuccessors } from "../helpers/dependencies";
import ResChip from "../shared/ResChip";
import StatusBadge from "../shared/StatusBadge";
import ModuleInput from "../shared/ModuleInput";
import WorkingDatePicker from "../shared/WorkingDatePicker";
import SearchableDropdown from "../shared/SearchableDropdown";

/**
 * Mobile-friendly card version of an activity row.
 * Shows the same data as ActivityRow but stacked vertically.
 */
const ActivityCard = React.memo(function ActivityCard({
  draft,
  row,
  idx,
  resources,
  groupResources,
  holidays = [],
  hasChildren,
  moduleColor,
  isOverlapping,
  parentRow,
  autoCalculate,
  customColumns,
  allRows,
  onUpdate,
  onDelete,
  onAddSub,
  onAddRowBelow,
  onOpenComments,
  onRedoReject,
  onFeedback,
  onUpdateCustomValue,
  onOpenDependencies,
  onViewSuccessors,
  onToggleAnchor,
  copiedResourceUserId,
  onCopyResource,
  onPasteResource,
}) {
  const { t } = useTheme();
  const inputStyle = makeInputStyle(t);

  const [expanded, setExpanded] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const dateBtnRef = useRef(null);

  const res = row.resource
    ? resources.find((r) => r.userId === row.resource)
    : null;

  const startDisplay = row.plannedStart ? fmtDisplay(row.plannedStart) : "";
  const stopDisplay = row.plannedStop ? fmtDisplay(row.plannedStop) : "";
  const commentCount = row.commentCount || 0;

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

  const depBadge = allRows ? getDependencyBadgeInfo(row, allRows, t) : null;
  const successors = allRows ? getSuccessors(row.id, allRows) : [];
  const successorCount = successors.length;
  // ── Copy/Paste derived state ──
  const isCopied = copiedResourceUserId === row.resource;
  const canPaste =
    copiedResourceUserId && copiedResourceUserId !== row.resource && !isLocked;
  const handleField = (field, value) => {
    const TEXT_ONLY_FIELDS = ["module", "task"];
    const needsRecompute = !TEXT_ONLY_FIELDS.includes(field);

    const updated = {
      ...row,
      [field]:
        field === "durationHrs" ? (value === "" ? "" : Number(value)) : value,
    };

    // Keep resourceName in sync when resource changes
    if (field === "resource") {
      if (!value) {
        updated.resourceName = "";
      } else {
        const resObj = resources.find((r) => r.userId === value);
        updated.resourceName = resObj?.name || value;
      }
    }

    if (field === "resource" && value && !row.plannedStart) {
      try {
        const dt = defaultFirstStart(value, groupResources || {}, holidays);
        if (dt instanceof Date && !isNaN(dt)) {
          updated.plannedStart = isoDateTime(dt);
          if (updated.durationHrs) {
            const stop = addWorkHours(
              dt,
              Number(updated.durationHrs),
              value,
              groupResources || {},
              holidays,
            );
            updated.plannedStop = isoDateTime(stop);
          }
        }
      } catch (e) {}
    }
    onUpdate(updated, { recompute: needsRecompute });
  };

  const cardBg = isOverlapping ? t.dangerBgSubtle : t.bgCard;
  const indent = (row.sortOrder || 0) * 16;

  // ── Card body rendered when expanded ──
  const renderExpandedBody = () => (
    <div
      style={{
        borderTop: `1px solid ${t.borderSubtle}`,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Module (editable) */}
      <div>
        <div style={fieldLabelStyle(t)}>Module</div>
        {row.module && !isEditingModule ? (
          <span
            onClick={() => !isLocked && setIsEditingModule(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 10px",
              background: moduleColor.bg,
              color: moduleColor.color,
              border: `1px solid ${moduleColor.border}`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.65 : 1,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
      </div>

      {/* Task */}
      <div>
        <div style={fieldLabelStyle(t)}>Task</div>
        <input
          value={row.task || ""}
          onChange={(e) => !isLocked && handleField("task", e.target.value)}
          disabled={isLocked}
          placeholder="Task name…"
          style={{
            ...inputStyle,
            height: 42,
            fontSize: 14,
            opacity: isLocked ? 0.65 : 1,
            cursor: isLocked ? "not-allowed" : "text",
          }}
        />
      </div>

      {/* Resource */}
      <div>
        <div style={fieldLabelStyle(t)}>Resource</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    ? "Select resource…"
                    : "Pick group first"
              }
              searchPlaceholder="Search by name, code…"
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
                    <span style={{ color: t.textFaint, fontSize: 13 }}>
                      Select resource…
                    </span>
                  );
                }
                return (
                  <span
                    style={{
                      fontSize: 13,
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
                  }}
                >
                  <ResChip code={opt.code} tone={opt.tone} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: selected ? 600 : 500,
                        color: t.textPrimary,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: t.textFaint }}>
                      {opt.sublabel}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>
      {/* ── Copy / Paste Resource Buttons ── */}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {row.resource && onCopyResource && (
          <button
            onClick={() => onCopyResource(row.resource)}
            title={
              isCopied ? "Click again to clear clipboard" : "Copy this resource"
            }
            style={{
              ...actionBtnStyle(t),
              color: isCopied ? t.success : t.textMuted,
              borderColor: isCopied ? t.successBorder : t.border,
              background: isCopied ? t.successBg : "transparent",
            }}
          >
            <Copy size={13} />
            <span>{isCopied ? "Copied!" : "Copy"}</span>
          </button>
        )}
        {canPaste && onPasteResource && (
          <button
            onClick={() => onPasteResource(row)}
            title="Paste copied resource here"
            style={{
              ...actionBtnStyle(t),
              color: t.primary,
              borderColor: t.primaryBorder,
              background: t.primaryBgSubtle,
            }}
          >
            <ClipboardPaste size={13} />
            <span>Paste</span>
          </button>
        )}
      </div>
      {/* Planned Start */}
      {/* Planned Start */}
      <div>
        <div style={fieldLabelStyle(t)}>Planned Start</div>
        {hasChildren ? (
          <span
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: t.textSecondary,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {startDisplay || "—"}
            {startDisplay && (
              <span
                style={{
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
        ) : row.resource ? (
          (() => {
            const isAutoLocked = !!row._autoChained;
            const canPickDate = !isLocked && !isAutoLocked;

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {/* Date display / picker */}
                {isAutoLocked ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: t.textSecondary,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {startDisplay || "Waiting…"}
                    {startDisplay && (
                      <span
                        style={{
                          background: t.infoBg,
                          color: t.info,
                          border: `1px solid ${t.infoBorder}`,
                          borderRadius: 3,
                          padding: "1px 5px",
                          fontSize: 9,
                          fontWeight: 600,
                        }}
                      >
                        ⚡ AUTO
                      </span>
                    )}
                  </span>
                ) : canPickDate ? (
                  <>
                    <button
                      ref={dateBtnRef}
                      onClick={() => setPickerOpen(true)}
                      style={{
                        ...inputStyle,
                        height: 42,
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Calendar size={14} />
                      <span style={{ flex: 1 }}>
                        {startDisplay || (
                          <span style={{ color: t.textFaint }}>Pick date…</span>
                        )}
                      </span>
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
                          }}
                        >
                          ⚠ PAST
                        </span>
                      )}
                    </button>
                    {pickerOpen && (
                      <WorkingDatePicker
                        value={row.plannedStart}
                        resourceUserId={row.resource}
                        groupResources={groupResources}
                        holidays={holidays}
                        anchorRef={dateBtnRef}
                        onChange={(val) => handleField("plannedStart", val)}
                        onClose={() => setPickerOpen(false)}
                      />
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: t.textSecondary,
                    }}
                  >
                    {startDisplay || "—"}
                  </span>
                )}

                {/* ── Anchor toggle button ── */}

                {/* ── Anchor toggle button ── */}
                <button
                  onClick={() => !isLocked && onToggleAnchor(row)}
                  disabled={isLocked}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 7,
                    border: `1px solid ${row.isAnchor ? t.successBorder : t.border}`,
                    background: row.isAnchor ? t.successBg : "transparent",
                    color: row.isAnchor ? t.success : t.textMuted,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "Sora, sans-serif",
                    opacity: isLocked ? 0.4 : 1,
                    transition: "all .15s",
                    alignSelf: "flex-start",
                  }}
                >
                  {row.isAnchor ? (
                    <Pin size={14} fill="currentColor" />
                  ) : (
                    <PinOff size={14} />
                  )}
                  <span>
                    {row.isAnchor ? "Pinned as Anchor" : "Set as Anchor"}
                  </span>
                </button>
              </div>
            );
          })()
        ) : (
          <span
            style={{ fontSize: 12, color: t.textFaint, fontStyle: "italic" }}
          >
            Assign resource first
          </span>
        )}
      </div>

      {/* Duration + Planned Stop (2 cols) */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10 }}
      >
        <div>
          <div style={fieldLabelStyle(t)}>Duration (hrs)</div>
          {hasChildren && row._autoDuration ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: t.violet,
                background: t.violetBg,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 5,
                padding: "8px 10px",
                fontWeight: 600,
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
              style={{
                ...inputStyle,
                height: 42,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                textAlign: "right",
                width: "100%",
                opacity: isLocked ? 0.65 : 1,
                cursor: isLocked ? "not-allowed" : "text",
              }}
            />
          )}
        </div>
        <div>
          <div style={fieldLabelStyle(t)}>Planned Stop</div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: t.textSecondary,
              padding: "10px 0",
            }}
          >
            {stopDisplay || "—"}
            {stopDisplay && (
              <span
                style={{
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
        </div>
      </div>

      {/* Custom Columns */}
      {customColumns.length > 0 && (
        <div>
          <div style={fieldLabelStyle(t)}>Custom Fields</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {customColumns.map((col) => (
              <MobileCustomInput
                key={col.id}
                col={col}
                value={row.customValues?.[col.id] || ""}
                disabled={isLocked}
                onUpdate={(val) => onUpdateCustomValue(row.id, col.id, val)}
                t={t}
                inputStyle={inputStyle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          paddingTop: 8,
          borderTop: `1px solid ${t.borderSubtle}`,
        }}
      >
        {/* Dependencies */}
        {onOpenDependencies && (
          <button
            onClick={() => !isLocked && onOpenDependencies(row)}
            disabled={isLocked}
            style={{
              ...actionBtnStyle(t),
              color: depBadge ? depBadge.color : t.textMuted,
              borderColor: depBadge ? depBadge.border : t.border,
              background: depBadge ? depBadge.bg : "transparent",
              opacity: isLocked ? 0.5 : 1,
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            <Link2 size={13} />
            <span>Dependencies</span>
            {depBadge && (
              <span
                style={{
                  padding: "1px 6px",
                  background: depBadge.color,
                  color: t.textInverse,
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {depBadge.count}
              </span>
            )}
          </button>
        )}

        {/* Successors */}
        {onViewSuccessors && successorCount > 0 && (
          <button
            onClick={() => onViewSuccessors(row)}
            style={{
              ...actionBtnStyle(t),
              color: t.warning,
              borderColor: t.warningBorder,
              background: t.warningBgSubtle,
            }}
          >
            <Lock size={13} />
            <span>Blocks</span>
            <span
              style={{
                padding: "1px 6px",
                background: t.warning,
                color: t.textInverse,
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {successorCount}
            </span>
          </button>
        )}

        {/* Comments */}
        <button
          onClick={() => onOpenComments(row)}
          style={{
            ...actionBtnStyle(t),
            color: commentCount > 0 ? t.violet : t.textMuted,
            borderColor: commentCount > 0 ? t.violetBorder : t.border,
            background: commentCount > 0 ? t.violetBg : "transparent",
          }}
        >
          <MessageSquare size={13} />
          <span>Comments</span>
          {commentCount > 0 && (
            <span
              style={{
                padding: "1px 6px",
                background: t.violet,
                color: t.textInverse,
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 700,
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
            style={{
              ...actionBtnStyle(t),
              color: t.violet,
              borderColor: t.violetBorder,
              background: t.violetBg,
            }}
          >
            <CornerDownRight size={13} /> Sub-activity
          </button>
        )}

        {/* Add row below */}
        {draft.status !== "closed" && row.sortOrder === 0 && (
          <button
            onClick={() => onAddRowBelow(row)}
            style={{
              ...actionBtnStyle(t),
              color: t.primary,
              borderColor: t.primaryBorder,
              background: t.primaryBgSubtle,
            }}
          >
            <Plus size={13} /> Add Row
          </button>
        )}

        {/* Redo */}
        {draft.status !== "closed" && isCompleted && (
          <button
            onClick={() => onRedoReject(row)}
            style={{
              ...actionBtnStyle(t),
              color: t.warning,
              borderColor: t.warningBorder,
              background: t.warningBgSubtle,
            }}
          >
            <RotateCcw size={13} /> Redo
          </button>
        )}

        {/* Feedback */}
        {(isCompleted || statusLower === "finished") && (
          <button
            onClick={() => onFeedback(row)}
            style={{
              ...actionBtnStyle(t),
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
            <span>{isCompleted ? "Rate" : "Feedback"}</span>
          </button>
        )}

        {/* Delete */}
        {isRowPending && !isLockedByParent && (
          <button
            onClick={() => onDelete(row)}
            style={{
              ...actionBtnStyle(t),
              color: t.danger,
              borderColor: t.dangerBorder,
              background: t.dangerBgSubtle,
              marginLeft: "auto",
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        marginLeft: indent,
        background: cardBg,
        border: `1px solid ${isOverlapping ? t.dangerBorder : t.border}`,
        borderLeft: `4px solid ${
          isOverlapping ? t.danger : moduleColor.border || t.primary
        }`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: t.shadowSm,
      }}
    >
      {/* Compact header (always visible) */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Expand chevron */}
        <div style={{ paddingTop: 2, flexShrink: 0 }}>
          {expanded ? (
            <ChevronDown size={16} color={t.textMuted} />
          ) : (
            <ChevronRight size={16} color={t.textMuted} />
          )}
        </div>

        {/* Row content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: # + level + status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            {row.sortOrder === 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.textFaint,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                #{idx}
              </span>
            )}
            {row.sortOrder > 0 && (
              <span
                style={{
                  background: t.violetBg,
                  color: t.violet,
                  border: `1px solid ${t.violetBorder}`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                L{row.sortOrder}
              </span>
            )}

            {row.module && (
              <span
                style={{
                  padding: "2px 7px",
                  background: moduleColor.bg,
                  color: moduleColor.color,
                  border: `1px solid ${moduleColor.border}`,
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.module}
              </span>
            )}

            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {isOverlapping && (
                <span
                  title="Overlap"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: t.danger,
                    marginTop: 6,
                  }}
                />
              )}
              <StatusBadge row={row} />
            </div>
          </div>

          {/* Task name */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: t.textPrimary,
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.task || <span style={{ color: t.textFaint }}>(untitled)</span>}
          </div>

          {/* Meta row: resource, dates, duration */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              fontSize: 11,
              color: t.textMuted,
            }}
          >
            {res && (
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <User size={11} />
                {res.name || res.userId}
              </span>
            )}
            {row.durationHrs != null && row.durationHrs !== "" && (
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Clock size={11} />
                {row.durationHrs}h
              </span>
            )}
            {startDisplay && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
                }}
              >
                <Calendar size={11} />
                {startDisplay.split(" ")[0]}
              </span>
            )}
          </div>

          {/* Badges row: deps + successors + comments */}
          {(depBadge || successorCount > 0 || commentCount > 0) && (
            <div
              style={{
                display: "flex",
                gap: 5,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {depBadge && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "1px 6px",
                    background: depBadge.bg,
                    color: depBadge.color,
                    border: `1px solid ${depBadge.border}`,
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <Link2 size={9} />
                  {depBadge.count}
                </span>
              )}
              {successorCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "1px 6px",
                    background: t.warningBgSubtle,
                    color: t.warning,
                    border: `1px solid ${t.warningBorder}`,
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <Lock size={9} />
                  {successorCount}
                </span>
              )}
              {commentCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "1px 6px",
                    background: t.violetBg,
                    color: t.violet,
                    border: `1px solid ${t.violetBorder}`,
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <MessageSquare size={9} />
                  {commentCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded editable body */}
      {expanded && renderExpandedBody()}
    </div>
  );
});

/* ─── Helpers ─── */

function fieldLabelStyle(t) {
  return {
    fontSize: 10,
    fontWeight: 700,
    color: t.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: 5,
  };
}

function actionBtnStyle(t) {
  return {
    height: 36,
    padding: "0 10px",
    borderRadius: 7,
    border: `1px solid ${t.border}`,
    background: "transparent",
    color: t.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: "Sora, sans-serif",
    whiteSpace: "nowrap",
  };
}

/* ─── Mobile Custom Input (memoized) ─── */
const MobileCustomInput = React.memo(function MobileCustomInput({
  col,
  value,
  disabled,
  onUpdate,
  t,
  inputStyle,
}) {
  const [localValue, setLocalValue] = useState(value || "");
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!focused) setLocalValue(value || "");
  }, [value, focused]);

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: t.textMuted,
          marginBottom: 4,
        }}
      >
        {col.name}
      </label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value.slice(0, 500))}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (localValue !== (value || "")) onUpdate(localValue);
        }}
        placeholder={disabled ? "" : "Enter value…"}
        disabled={disabled}
        maxLength={500}
        style={{
          ...inputStyle,
          height: 40,
          fontSize: 13,
          background: disabled ? t.bgInputDisabled : t.bgInput,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
});

export default ActivityCard;
