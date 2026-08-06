import React from "react";
import { Clock, Users, MessageSquare, Star, AlertTriangle } from "lucide-react";
import BottomSheet from "../../../shared/BottomSheet";
import { useTheme } from "../../../useTheme";
import { fmtDisplay, fmtHrMin } from "../../helpers/dateUtils";
import { getStatusColor, isDelayed } from "../../helpers/statusColors";
import { getDisplayStatus } from "../../../helpers/statusDisplay";

/**
 * Mobile task detail bottom sheet — opened when a user taps a bar.
 * Shows planned/actual dates, resource, comments, feedback buttons.
 */
export default function MobileTaskDetailSheet({
  row,
  onClose,
  onOpenComments,
  onFeedback,
}) {
  const { t } = useTheme();

  if (!row) return null;

  const displayStatus = getDisplayStatus(row);
  const sc = getStatusColor(displayStatus, t);
  const delayed = isDelayed(row);
  const isFinished =
    String(row.status || "")
      .toLowerCase()
      .trim() === "finished";

  return (
    <BottomSheet
      open={true}
      onClose={onClose}
      title={row.task || row.module || "Task"}
      height="auto"
    >
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Status + delay badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: sc.bg,
              color: sc.color,
              border: `1px solid ${sc.border}`,
              textTransform: "capitalize",
            }}
          >
            {displayStatus}
          </span>

          {delayed && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: t.dangerBg,
                color: t.danger,
                border: `1px solid ${t.dangerBorder}`,
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AlertTriangle size={11} />
              Delayed
            </span>
          )}
        </div>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            color: t.textSecondary,
          }}
        >
          {row.module && (
            <div>
              <strong style={{ color: t.textPrimary }}>Module:</strong>{" "}
              {row.module}
            </div>
          )}
          {row._projectName && (
            <div>
              <strong style={{ color: t.textPrimary }}>Project:</strong>{" "}
              {row._projectName}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={13} color={t.textMuted} />
            <span>{row.resourceName || row.resource || "Unassigned"}</span>
          </div>
        </div>

        {/* Planned dates */}
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: t.primary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Planned
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                background: t.primaryBgSubtle,
                border: `1px solid ${t.primaryBorder}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: t.primary,
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                START
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: t.textPrimary,
                }}
              >
                {fmtDisplay(row.plannedStart)}
              </div>
            </div>
            <div
              style={{
                padding: "8px 10px",
                background: t.primaryBgSubtle,
                border: `1px solid ${t.primaryBorder}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: t.primary,
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                STOP
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: t.textPrimary,
                }}
              >
                {fmtDisplay(row.plannedStop)}
              </div>
            </div>
          </div>
        </div>

        {/* Actual dates */}
        {(row.actualStart || row.actualStop) && (
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: t.success,
                marginBottom: 6,
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
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  background: t.successBgSubtle,
                  border: `1px solid ${t.successBorder}`,
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: t.success,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  START
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: t.textPrimary,
                  }}
                >
                  {fmtDisplay(row.actualStart)}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 10px",
                  background: t.successBgSubtle,
                  border: `1px solid ${t.successBorder}`,
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: t.success,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  STOP
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
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
            padding: "10px 12px",
            background: t.bgSubtle,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: t.textSecondary,
          }}
        >
          <Clock size={13} color={t.textMuted} />
          <span>
            Planned:{" "}
            <strong style={{ color: t.textPrimary }}>
              {fmtHrMin(row.durationHrs)}
            </strong>
            {row.actualElapsedHrs != null && (
              <>
                {" · "}Actual:{" "}
                <strong style={{ color: t.textPrimary }}>
                  {fmtHrMin(Math.abs(row.actualElapsedHrs))}
                </strong>
              </>
            )}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {row.commentCount > 0 && (
            <button
              onClick={() => {
                onOpenComments(row);
                onClose();
              }}
              style={{
                flex: 1,
                height: 46,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 10,
                background: t.violetBg,
                color: t.violet,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <MessageSquare size={15} />
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
                height: 46,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 10,
                background: t.violetBg,
                color: t.violet,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <Star size={15} fill={t.violet} />
              Rating
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
