import React from "react";
import { X, Lock, ArrowRight, Link2, Info } from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle } from "../helpers/styles";
import { fmtDisplay } from "../helpers/dateUtils";
import { getSuccessors } from "../helpers/dependencies";
import StatusBadge from "../shared/StatusBadge";
import { useResponsive } from "../useResponsive";
import BottomSheet from "../shared/BottomSheet";
/**
 * Read-only viewer showing which rows depend on this row.
 * Click a successor row → jump to its dependency editor.
 */
export default function SuccessorViewerModal({
  row,
  rows,
  onClose,
  onOpenDependencies,
}) {
  const { isMobile } = useResponsive();
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const successors = getSuccessors(row.id, rows);
  // ── Mobile: bottom sheet ──
  if (isMobile) {
    return (
      <BottomSheet
        open={true}
        onClose={onClose}
        title={`🔒 Blocks ${successors.length} task${successors.length !== 1 ? "s" : ""}`}
        height="90%"
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Subtitle */}
          <div
            style={{
              padding: "10px 16px",
              background: t.bgSubtle,
              borderBottom: `1px solid ${t.border}`,
              fontSize: 12,
              color: t.textMuted,
            }}
          >
            This task:{" "}
            <strong style={{ color: t.textPrimary }}>
              {row.task || row.module || `Row #${row.id}`}
            </strong>
          </div>

          {/* Info */}
          <div
            style={{
              padding: "10px 16px",
              background: t.infoBg,
              borderBottom: `1px solid ${t.infoBorder}`,
              fontSize: 12,
              color: t.info,
              display: "flex",
              gap: 8,
              lineHeight: 1.5,
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              These tasks depend on this one — they can't start until it's
              finished. Tap any to view its dependencies.
            </span>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {successors.length === 0 ? (
              <div
                style={{ padding: 40, textAlign: "center", color: t.textFaint }}
              >
                <Lock
                  size={28}
                  strokeWidth={1.5}
                  style={{ marginBottom: 8, opacity: 0.5 }}
                />
                <div>No tasks depend on this one.</div>
              </div>
            ) : (
              successors.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onOpenDependencies(s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderBottom: `1px solid ${t.borderSubtle}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: t.warningBg,
                      color: t.warning,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Link2 size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: t.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.task || "(untitled)"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        marginTop: 3,
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
                        {s.module || "— no module —"}
                      </span>
                      {s.plannedStart && (
                        <span
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {fmtDisplay(s.plannedStart)}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                  <ArrowRight size={14} color={t.textFaint} />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${t.border}`,
              background: t.bgSubtle,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "100%",
                height: 46,
                border: `1px solid ${t.borderStrong}`,
                background: t.bgCard,
                color: t.textSecondary,
                borderRadius: 10,
                fontFamily: "Sora, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
          maxWidth: 560,
          maxHeight: "88vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.warningBgSubtle,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.warningBg,
              color: t.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Blocks {successors.length} task
              {successors.length !== 1 ? "s" : ""}
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
              This task:{" "}
              <strong>{row.task || row.module || `Row #${row.id}`}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info banner */}
        <div
          style={{
            padding: "10px 20px",
            background: t.infoBg,
            borderBottom: `1px solid ${t.infoBorder}`,
            fontSize: 11.5,
            color: t.info,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            lineHeight: 1.5,
          }}
        >
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            These tasks depend on <strong>{row.task || "this task"}</strong> —
            they can't start until it's finished. Click any task to view/edit
            its dependencies.
          </span>
        </div>

        {/* Successor list */}
        <div style={{ flex: 1, overflowY: "auto", background: t.bgCard }}>
          {successors.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: t.textFaint,
                fontSize: 12,
              }}
            >
              <Lock
                size={28}
                strokeWidth={1.5}
                style={{ marginBottom: 8, opacity: 0.5 }}
              />
              <div>No tasks depend on this one.</div>
            </div>
          ) : (
            successors.map((s) => (
              <div
                key={s.id}
                onClick={() => onOpenDependencies(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  borderBottom: `1px solid ${t.borderSubtle}`,
                  cursor: "pointer",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = t.bgSubtle)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: t.warningBg,
                    color: t.warning,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Link2 size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: t.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.task || "(untitled)"}
                    {s.parentId && (
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
                      >
                        SUB
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: t.textMuted,
                      marginTop: 3,
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
                      {s.module || "— no module —"}
                    </span>
                    {s.plannedStart && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9.5,
                        }}
                      >
                        Starts: {fmtDisplay(s.plannedStart)}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={s.status} />
                <ArrowRight size={13} color={t.textFaint} />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
          }}
        >
          <button onClick={onClose} style={btnStyle}>
            <X size={13} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
