import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Search,
  Check,
  Link2,
  AlertTriangle,
  CircleDot,
  ChevronDown,
  ChevronRight,
  Info,
  Filter,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle, makeInputStyle } from "../helpers/styles";
import { fmtDisplay } from "../helpers/dateUtils";
import {
  getCycleBlockedIds,
  checkDependencyConflict,
  getDependencyReadiness,
} from "../helpers/dependencies";
import StatusBadge from "../shared/StatusBadge";

/**
 * DependencyPickerModal
 * Props:
 *  - row: the activity row we're editing (source)
 *  - rows: all rows in the project
 *  - onClose: () => void
 *  - onSave: (newDependsOnIds: string[]) => Promise<void>|void
 *  - isSaving: boolean
 */
export default function DependencyPickerModal({
  row,
  rows,
  onClose,
  onSave,
  isSaving = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);
  const inputStyle = makeInputStyle(t);

  const [selectedIds, setSelectedIds] = useState(
    () => new Set(row.dependsOn || []),
  );
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [collapsedModules, setCollapsedModules] = useState(new Set());
  const searchRef = useRef();

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 80);
  }, []);

  // ── Blocked (cycle) IDs ──
  const blockedIds = useMemo(
    () => getCycleBlockedIds(row.id, rows),
    [row.id, rows],
  );

  // ── All available rows (excluding self + cycle offenders) ──
  const availableRows = useMemo(() => {
    return rows.filter((r) => !blockedIds.has(r.id));
  }, [rows, blockedIds]);

  // ── Module options ──
  const modules = useMemo(() => {
    const set = new Set(availableRows.map((r) => r.module).filter(Boolean));
    return Array.from(set).sort();
  }, [availableRows]);

  // ── Filter by search + module ──
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return availableRows.filter((r) => {
      if (moduleFilter && r.module !== moduleFilter) return false;
      if (!q) return true;
      return (
        (r.task || "").toLowerCase().includes(q) ||
        (r.module || "").toLowerCase().includes(q)
      );
    });
  }, [availableRows, search, moduleFilter]);

  // ── Currently selected rows (with full data) ──
  const selectedRows = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => rows.find((r) => r.id === id))
      .filter(Boolean);
  }, [selectedIds, rows]);

  // ── Group filtered rows by module ──
  const grouped = useMemo(() => {
    const groups = {};
    filteredRows.forEach((r) => {
      // Exclude currently selected from "available" list
      if (selectedIds.has(r.id)) return;
      const key = r.module || "— No module —";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredRows, selectedIds]);

  // ── Compute conflict summary ──
  const conflictSummary = useMemo(() => {
    let conflicts = 0;
    let missing = 0;
    let ok = 0;
    selectedRows.forEach((dep) => {
      const status = checkDependencyConflict(row, dep);
      if (status === "conflict") conflicts++;
      else if (status === "missing-dates") missing++;
      else ok++;
    });
    return { conflicts, missing, ok };
  }, [selectedRows, row]);

  // ── Compute readiness of currently selected deps ──
  const readiness = useMemo(() => {
    // Temporarily attach selected IDs to the row for computation
    const rowWithDeps = { ...row, dependsOn: Array.from(selectedIds) };
    return getDependencyReadiness(rowWithDeps, rows);
  }, [row, selectedIds, rows]);

  // ── Handlers ──
  const toggleId = (id) => {
    if (isSaving) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModuleCollapse = (mod) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selectedIds));
  };

  const hasChanges = useMemo(() => {
    const orig = new Set(row.dependsOn || []);
    if (orig.size !== selectedIds.size) return true;
    for (const id of selectedIds) {
      if (!orig.has(id)) return true;
    }
    return false;
  }, [row.dependsOn, selectedIds]);

  // ── Renderers ──
  const renderConflictIcon = (dep) => {
    const status = checkDependencyConflict(row, dep);
    if (status === "ok") {
      return (
        <span
          title="Dates align: dependency finishes before this task starts"
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: t.successBg,
            color: t.success,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            flexShrink: 0,
            border: `1px solid ${t.successBorder}`,
          }}
        >
          <Check size={10} strokeWidth={3} />
        </span>
      );
    }
    if (status === "conflict") {
      return (
        <span
          title="⚠ Scheduling conflict — dependency ends after this task starts"
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: t.dangerBg,
            color: t.danger,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1px solid ${t.dangerBorder}`,
          }}
        >
          <AlertTriangle size={9} />
        </span>
      );
    }
    return (
      <span
        title="Dates not fully set on either task"
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          background: t.bgMuted,
          color: t.textFaint,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `1px solid ${t.border}`,
        }}
      >
        <CircleDot size={9} />
      </span>
    );
  };

  const renderRow = (r, isSelected) => {
    const status = checkDependencyConflict(row, r);
    const rowBg =
      status === "conflict"
        ? t.dangerBgSubtle
        : isSelected
          ? t.primaryBgSubtle
          : "transparent";

    return (
      <div
        key={r.id}
        onClick={() => toggleId(r.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          cursor: "pointer",
          background: rowBg,
          borderLeft: isSelected
            ? `3px solid ${t.primary}`
            : "3px solid transparent",
          borderBottom: `1px solid ${t.borderSubtle}`,
          transition: "background .1s",
        }}
        onMouseEnter={(e) => {
          if (!isSelected && status !== "conflict") {
            e.currentTarget.style.background = t.bgSubtle;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected && status !== "conflict") {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {/* Checkbox */}
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            border: `1.5px solid ${isSelected ? t.primary : t.borderStrong}`,
            background: isSelected ? t.primary : t.bgCard,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: t.textInverse,
          }}
        >
          {isSelected && <Check size={12} strokeWidth={3} />}
        </span>

        {/* Conflict indicator */}
        {renderConflictIcon(r)}

        {/* Task info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: isSelected ? 600 : 500,
              color: t.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={r.task || "(untitled)"}
          >
            {r.task || "(untitled task)"}
            {r.parentId && (
              <span
                style={{
                  marginLeft: 5,
                  fontSize: 9,
                  color: t.violet,
                  fontWeight: 700,
                  background: t.violetBg,
                  padding: "1px 5px",
                  borderRadius: 3,
                  border: `1px solid ${t.violetBorder}`,
                }}
                title="Sub-activity"
              >
                SUB
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 10,
              color: t.textMuted,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "1px 6px",
                background: t.bgMuted,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              {r.module || "— no module —"}
            </span>
            {r.plannedStart && r.plannedStop ? (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5,
                }}
              >
                {fmtDisplay(r.plannedStart)} → {fmtDisplay(r.plannedStop)}
              </span>
            ) : (
              <span style={{ color: t.textFaint, fontStyle: "italic" }}>
                No dates
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={r.status} />
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 720,
          maxHeight: "92vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: t.textPrimary,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.primaryBg,
              color: t.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Link2 size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Dependencies
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              For: <strong>{row.task || row.module || `Row #${row.id}`}</strong>
              {row.module && (
                <>
                  {" "}
                  <span style={{ color: t.textFaint }}>· {row.module}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSaving ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Summary Bar ── */}
        <div
          style={{
            padding: "10px 20px",
            background: t.bgSubtle,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              color: t.textPrimary,
              fontWeight: 600,
            }}
          >
            <Info size={12} />
            {selectedIds.size === 0
              ? "No dependencies selected"
              : `${selectedIds.size} dependenc${selectedIds.size === 1 ? "y" : "ies"} selected`}
          </div>

          {selectedIds.size > 0 && (
            <>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: t.successBg,
                  color: t.success,
                  border: `1px solid ${t.successBorder}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
                title="Finished dependencies"
              >
                <Check size={9} strokeWidth={3} />
                {readiness.finished} done
              </span>
              {readiness.pending > 0 && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    background: t.warningBg,
                    color: t.warning,
                    border: `1px solid ${t.warningBorder}`,
                  }}
                >
                  {readiness.pending} pending
                </span>
              )}
              {conflictSummary.conflicts > 0 && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    background: t.dangerBg,
                    color: t.danger,
                    border: `1px solid ${t.dangerBorder}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <AlertTriangle size={9} />
                  {conflictSummary.conflicts} conflict
                  {conflictSummary.conflicts !== 1 ? "s" : ""}
                </span>
              )}
              {conflictSummary.missing > 0 && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    background: t.bgMuted,
                    color: t.textFaint,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {conflictSummary.missing} no dates
                </span>
              )}
            </>
          )}

          {hasChanges && !isSaving && (
            <span
              style={{
                marginLeft: "auto",
                padding: "2px 8px",
                background: t.warningBg,
                color: t.warning,
                border: `1px solid ${t.warningBorder}`,
                borderRadius: 999,
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Unsaved
            </span>
          )}
        </div>

        {/* ── Search + Filter ── */}
        <div
          style={{
            padding: "10px 20px",
            display: "flex",
            gap: 8,
            borderBottom: `1px solid ${t.border}`,
            background: t.bgCard,
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={13}
              color={t.textFaint}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task or module…"
              style={{
                ...inputStyle,
                height: 32,
                paddingLeft: 32,
                fontSize: 12,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: t.textFaint,
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {modules.length > 0 && (
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                ...inputStyle,
                height: 32,
                width: 180,
                cursor: "pointer",
                background: moduleFilter ? t.primaryBgSubtle : t.bgInput,
                color: moduleFilter ? t.primary : t.textPrimary,
                borderColor: moduleFilter ? t.primaryBorder : t.borderStrong,
                fontWeight: moduleFilter ? 600 : 400,
              }}
            >
              <option value="">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", background: t.bgCard }}>
          {/* Currently Selected Section */}
          {selectedRows.length > 0 && (
            <>
              <div
                style={{
                  padding: "8px 20px",
                  background: t.primaryBgSubtle,
                  borderBottom: `1px solid ${t.primaryBorder}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: t.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                }}
              >
                <Check size={11} strokeWidth={3} />
                Currently Selected ({selectedRows.length})
              </div>
              {selectedRows.map((r) => renderRow(r, true))}
            </>
          )}

          {/* Available Section */}
          {Object.keys(grouped).length === 0 ? (
            selectedRows.length === 0 && (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: t.textFaint,
                  fontSize: 12,
                }}
              >
                <Search
                  size={28}
                  strokeWidth={1.5}
                  style={{ marginBottom: 8, opacity: 0.5 }}
                />
                <div>
                  {search || moduleFilter
                    ? "No tasks match your filters"
                    : "No available tasks to depend on"}
                </div>
              </div>
            )
          ) : (
            <>
              <div
                style={{
                  padding: "8px 20px",
                  background: t.bgSubtle,
                  borderBottom: `1px solid ${t.border}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                }}
              >
                Available Tasks
              </div>
              {Object.entries(grouped).map(([mod, tasks]) => {
                const isCollapsed = collapsedModules.has(mod);
                return (
                  <div key={mod}>
                    <div
                      onClick={() => toggleModuleCollapse(mod)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 20px",
                        background: t.bgSubtle,
                        borderBottom: `1px solid ${t.borderSubtle}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.textSecondary,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      {isCollapsed ? (
                        <ChevronRight size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                      <span>{mod}</span>
                      <span
                        style={{
                          color: t.textFaint,
                          fontWeight: 500,
                          marginLeft: "auto",
                          fontSize: 10,
                        }}
                      >
                        {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {!isCollapsed && tasks.map((r) => renderRow(r, false))}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Legend ── */}
        <div
          style={{
            padding: "8px 20px",
            borderTop: `1px solid ${t.border}`,
            background: t.bgSubtle,
            display: "flex",
            gap: 12,
            fontSize: 10,
            color: t.textMuted,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: t.successBg,
                border: `1px solid ${t.successBorder}`,
              }}
            />
            Dates align
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: t.dangerBg,
                border: `1px solid ${t.dangerBorder}`,
              }}
            />
            Scheduling conflict
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: t.bgMuted,
                border: `1px solid ${t.border}`,
              }}
            />
            Missing dates
          </span>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              ...btnStyle,
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            style={{
              ...btnStyle,
              background: hasChanges && !isSaving ? t.primary : t.bgMuted,
              color: hasChanges && !isSaving ? t.textInverse : t.textFaint,
              borderColor: hasChanges && !isSaving ? t.primary : t.border,
              cursor: hasChanges && !isSaving ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Saving...
              </>
            ) : (
              <>
                <Check size={13} /> Save Dependencies
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
