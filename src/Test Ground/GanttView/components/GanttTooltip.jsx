import React, { useEffect, useRef } from "react";
import {
  Clock,
  Users,
  MessageSquare,
  Star,
  AlertTriangle,
  X,
} from "lucide-react";
import { useTheme } from "../../useTheme";
import { fmtDisplay, fmtHrMin } from "../helpers/dateUtils";
import {
  getStatusColor,
  getDelayedColor,
  isDelayed,
} from "../helpers/statusColors";

/**
 * Themed tooltip popup for a task bar (desktop only).
 * Shows planned/actual dates, resource, comments, feedback buttons.
 */
export default function GanttTooltip({
  row,
  x,
  y,
  onClose,
  onOpenComments,
  onFeedback,
}) {
  const { t } = useTheme();
  const ref = useRef(null);
  const delayed = isDelayed(row);
  const sc = delayed ? getDelayedColor(t) : getStatusColor(row.status, t);
  const hasActual = row.actualStart || row.actualStop;
  const isFinished =
    String(row.status || "")
      .toLowerCase()
      .trim() === "finished";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: Math.min(x, window.innerWidth - 300),
        top: Math.min(y + 10, window.innerHeight - 380),
        width: 280,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        boxShadow: t.shadowLg,
        zIndex: 9999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px",
          background: sc.bg,
          borderBottom: `1px solid ${sc.border}`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              color: t.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.task || "—"}
          </div>
          <div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 2 }}>
            {row.module || "—"} {row._projectName && `• ${row._projectName}`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "flex-end",
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
              whiteSpace: "nowrap",
              textTransform: "capitalize",
            }}
          >
            {row.status || "Pending"}
          </span>
          {delayed && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 700,
                background: t.dangerBg,
                color: t.danger,
                border: `1px solid ${t.dangerBorder}`,
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <AlertTriangle size={9} />
              Delayed
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: t.textFaint,
            padding: 0,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Users size={12} color={t.textMuted} />
          <span style={{ fontSize: 11.5, color: t.textSecondary }}>
            {row.resourceName || row.resource || "Unassigned"}
          </span>
        </div>

        {/* Planned dates */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: t.primary,
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Planned
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}
          >
            <div
              style={{
                padding: "4px 6px",
                background: t.primaryBgSubtle,
                border: `1px solid ${t.primaryBorder}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 8.5, color: t.primary, fontWeight: 600 }}>
                START
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: t.textPrimary,
                }}
              >
                {fmtDisplay(row.plannedStart)}
              </div>
            </div>
            <div
              style={{
                padding: "4px 6px",
                background: t.primaryBgSubtle,
                border: `1px solid ${t.primaryBorder}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 8.5, color: t.primary, fontWeight: 600 }}>
                STOP
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: t.textPrimary,
                }}
              >
                {fmtDisplay(row.plannedStop)}
              </div>
            </div>
          </div>
        </div>

        {/* Actual dates */}
        {hasActual && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: t.success,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              Actual
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
              }}
            >
              <div
                style={{
                  padding: "4px 6px",
                  background: t.successBgSubtle,
                  border: `1px solid ${t.successBorder}`,
                  borderRadius: 4,
                }}
              >
                <div
                  style={{ fontSize: 8.5, color: t.success, fontWeight: 600 }}
                >
                  START
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: t.textPrimary,
                  }}
                >
                  {fmtDisplay(row.actualStart)}
                </div>
              </div>
              <div
                style={{
                  padding: "4px 6px",
                  background: t.successBgSubtle,
                  border: `1px solid ${t.successBorder}`,
                  borderRadius: 4,
                }}
              >
                <div
                  style={{ fontSize: 8.5, color: t.success, fontWeight: 600 }}
                >
                  STOP
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: t.textPrimary,
                  }}
                >
                  {fmtDisplay(row.actualStop)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duration */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            padding: "4px 8px",
            background: t.bgSubtle,
            border: `1px solid ${t.border}`,
            borderRadius: 5,
          }}
        >
          <Clock size={11} color={t.textMuted} />
          <span style={{ fontSize: 11, color: t.textSecondary }}>
            Planned: <strong>{fmtHrMin(row.durationHrs)}</strong>
            {row.actualElapsedHrs != null && (
              <>
                {" "}
                | Actual:{" "}
                <strong>{fmtHrMin(Math.abs(row.actualElapsedHrs))}</strong>
              </>
            )}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {row.commentCount > 0 && (
            <button
              onClick={() => {
                onOpenComments(row);
                onClose();
              }}
              style={{
                flex: 1,
                height: 28,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 6,
                background: t.violetBg,
                color: t.violet,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <MessageSquare size={11} />
              Comments ({row.commentCount})
            </button>
          )}
          {isFinished && (
            <button
              onClick={() => {
                onFeedback(row);
                onClose();
              }}
              style={{
                flex: 1,
                height: 28,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 6,
                background: t.violetBg,
                color: t.violet,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <Star size={11} fill={t.violet} />
              View Rating
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
