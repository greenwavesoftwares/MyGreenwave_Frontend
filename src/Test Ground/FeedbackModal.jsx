import React, { useState, useMemo } from "react";
import {
  Star,
  X,
  Clock,
  Info,
  ShieldCheck,
  Lightbulb,
  CalendarX,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { useTheme } from "./useTheme";

/* ─── Rating Bar (1–10) ─── */
function RatingBar({ value, hover, onChange, onHover, onLeave, disabled }) {
  const { t } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = n <= (disabled ? value : hover || value);
        const getColor = (rating) => {
          if (rating <= 3) return { fill: "#EF4444", border: "#FCA5A5" };
          if (rating <= 5) return { fill: "#F59E0B", border: "#FCD34D" };
          if (rating <= 7) return { fill: "#3B82F6", border: "#93C5FD" };
          return { fill: "#22C55E", border: "#86EFAC" };
        };
        const c = getColor(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => !disabled && onChange(n)}
            onMouseEnter={() => !disabled && onHover(n)}
            onMouseLeave={() => !disabled && onLeave()}
            disabled={disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1.5px solid ${active ? c.border : t.border}`,
              background: active ? c.fill : t.bgSubtle,
              color: active ? "#fff" : t.textFaint,
              fontSize: 11,
              fontWeight: 700,
              cursor: disabled ? "default" : "pointer",
              fontFamily: "Sora,sans-serif",
              transition: "all 0.12s",
              transform: active ? "scale(1.08)" : "scale(1)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {n}
          </button>
        );
      })}

      {value > 0 && (
        <span
          style={{
            marginLeft: 8,
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background:
              value <= 3
                ? "#FEE2E2"
                : value <= 5
                  ? "#FEF3C7"
                  : value <= 7
                    ? "#DBEAFE"
                    : "#DCFCE7",
            color:
              value <= 3
                ? "#DC2626"
                : value <= 5
                  ? "#B45309"
                  : value <= 7
                    ? "#1D4ED8"
                    : "#15803D",
            border: `1px solid ${
              value <= 3
                ? "#FCA5A5"
                : value <= 5
                  ? "#FCD34D"
                  : value <= 7
                    ? "#93C5FD"
                    : "#86EFAC"
            }`,
          }}
        >
          {value}/10
        </span>
      )}
    </div>
  );
}

/* ─── Reference Card ─── */
function RefCard({ label, value, icon, color }) {
  const { t } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: t.bgSubtle,
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        fontSize: 11,
        minWidth: 0,
      }}
    >
      <span style={{ color: color || t.textSecondary, flexShrink: 0 }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            color: t.textFaint,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontWeight: 600,
            color: t.textPrimary,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Comment Field ─── */
function CommentField({
  label,
  value,
  onChange,
  placeholder,
  readOnly: isReadOnly,
  disabled,
}) {
  const { t } = useTheme();

  return (
    <div style={{ marginTop: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 10.5,
          fontWeight: 600,
          color: t.textMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {isReadOnly ? (
        <div
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "Sora,sans-serif",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: t.textSecondary,
            background: t.bgSubtle,
            minHeight: 36,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        >
          {value || "—"}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "Sora,sans-serif",
            fontSize: 11.5,
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: 48,
            lineHeight: 1.5,
            background: disabled ? t.bgInputDisabled : t.bgInput,
            color: t.textPrimary,
          }}
        />
      )}
    </div>
  );
}

/* ─── Format Helpers ─── */
const WORK_START_HR = 10;

function parseISODateTime(s) {
  if (!s) return null;
  const norm = s.replace(" ", "T");
  const m = norm.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4] || WORK_START_HR),
    Number(m[5] || 0),
    0,
    0,
  );
}

function fmtHrMin(hrs) {
  if (hrs === null || hrs === undefined || isNaN(hrs)) return "—";
  const totalMinutes = Math.round(Math.abs(hrs) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const sign = hrs < 0 ? "-" : "";
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

function fmtPlanned(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return (
    d.toLocaleString("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " UTC"
  );
}

function fmtActual(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Main FeedbackModal Component ─── */
export default function FeedbackModal({
  row,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  const { t } = useTheme();

  const btnStyle = {
    height: 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  const isFinished =
    String(row.status || row.activityStatus || "")
      .toLowerCase()
      .trim() === "finished";
  const readOnly = isFinished;

  const parseDt = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d) ? null : d;
  };

  const plannedStartDt = parseDt(row.plannedStart);
  const plannedStopDt = parseDt(row.plannedStop);
  const actualStartDt = parseDt(row.actualStart);
  const actualStopDt = parseDt(row.actualStop);

  const benchmarkHrs =
    plannedStartDt && plannedStopDt
      ? Math.round(
          ((plannedStopDt.getTime() - plannedStartDt.getTime()) /
            (1000 * 60 * 60)) *
            100,
        ) / 100
      : row.durationHrs || 0;

  const actualHrs =
    actualStartDt && actualStopDt
      ? Math.round(
          ((actualStopDt.getTime() - actualStartDt.getTime()) /
            (1000 * 60 * 60)) *
            100,
        ) / 100
      : row.actualElapsedHrs || 0;

  const rejectCount = row.actiVityRejectCount || 0;

  const suggestTimeRating = () => {
    if (!benchmarkHrs || benchmarkHrs <= 0 || !actualHrs) return 5;
    const ratio = actualHrs / benchmarkHrs;
    if (ratio <= 0.8) return 10;
    if (ratio <= 0.9) return 9;
    if (ratio <= 1.0) return 8;
    if (ratio <= 1.1) return 7;
    if (ratio <= 1.2) return 6;
    if (ratio <= 1.4) return 5;
    if (ratio <= 1.6) return 4;
    if (ratio <= 1.8) return 3;
    if (ratio <= 2.0) return 2;
    return 1;
  };

  const suggestFulfillmentRating = () => {
    if (rejectCount === 0) return 10;
    if (rejectCount === 1) return 7;
    if (rejectCount === 2) return 5;
    if (rejectCount === 3) return 3;
    return 1;
  };

  const [timeRating, setTimeRating] = useState(
    readOnly ? row.timeEfficiencyRating || 0 : suggestTimeRating(),
  );
  const [fulfillmentRating, setFulfillmentRating] = useState(
    readOnly ? row.fulfillmentRating || 0 : suggestFulfillmentRating(),
  );
  const [innovationRating, setInnovationRating] = useState(
    readOnly ? row.innovationRating || 0 : 0,
  );
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverFulfillment, setHoverFulfillment] = useState(0);
  const [hoverInnovation, setHoverInnovation] = useState(0);

  const [timeComments, setTimeComments] = useState(
    readOnly ? row.timeEfficiencyComments || "" : "",
  );
  const [fulfillmentComments, setFulfillmentComments] = useState(
    readOnly ? row.fulfillmentComments || "" : "",
  );
  const [innovationComments, setInnovationComments] = useState(
    readOnly ? row.innovationComments || "" : "",
  );
  const [overallComments, setOverallComments] = useState(
    readOnly ? row.feedbackComments || "" : "",
  );

  const [touched, setTouched] = useState(false);

  const isValid =
    timeRating > 0 &&
    fulfillmentRating > 0 &&
    innovationRating > 0 &&
    overallComments.trim().length >= 5;

  const timeLabels = {
    1: "Very Poor — Took 2x+ longer than planned",
    2: "Poor — Significant delay (80–100% over)",
    3: "Below Average — 60–80% over planned time",
    4: "Slightly Below — 40–60% over planned time",
    5: "Average — 20–40% over planned time",
    6: "Slightly Above — 10–20% over planned time",
    7: "Good — Within 10% over planned time",
    8: "Very Good — Completed on time",
    9: "Excellent — Finished slightly ahead of schedule",
    10: "Outstanding — Finished well ahead of schedule",
  };

  const fulfillmentLabels = {
    1: "Unacceptable — Multiple reworks, major gaps",
    2: "Very Poor — Extensive rework needed",
    3: "Poor — Significant quality issues",
    4: "Below Average — Notable gaps remain",
    5: "Average — Acceptable with improvements",
    6: "Slightly Above — Minor issues present",
    7: "Good — Meets most expectations",
    8: "Very Good — Meets all expectations",
    9: "Excellent — Exceeds expectations",
    10: "Outstanding — Exceptional quality, zero rework",
  };

  const innovationLabels = {
    1: "No Innovation — Followed instructions only",
    2: "Minimal — Very little creative input",
    3: "Below Average — Routine approach",
    4: "Slightly Below — Some effort but conventional",
    5: "Average — Standard approach with minor improvements",
    6: "Slightly Above — Some creative solutions applied",
    7: "Good — Noticeable innovative thinking",
    8: "Very Good — Creative problem-solving demonstrated",
    9: "Excellent — Significant innovative contributions",
    10: "Outstanding — Exceptional creativity and innovation",
  };

  const handleSubmit = async () => {
    if (readOnly) return;
    setTouched(true);
    if (!isValid) return;
    await onConfirm({
      timeEfficiencyRating: timeRating,
      timeEfficiencyComments: timeComments.trim(),
      fulfillmentRating,
      fulfillmentComments: fulfillmentComments.trim(),
      innovationRating,
      innovationComments: innovationComments.trim(),
      comments: overallComments.trim(),
    });
  };

  const efficiencyPercent =
    benchmarkHrs > 0
      ? Math.round(((actualHrs - benchmarkHrs) / benchmarkHrs) * 100)
      : 0;
  const isAhead = efficiencyPercent < 0;
  const isOnTime = efficiencyPercent === 0;

  return (
    <div
      onClick={(e) =>
        e.target === e.currentTarget && !isSubmitting && onClose()
      }
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
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
          maxWidth: 680,
          maxHeight: "92vh",
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
            background: readOnly ? t.violetBg : t.successBgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: readOnly ? t.violetBg : t.successBg,
              color: readOnly ? t.violet : t.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star
              size={20}
              strokeWidth={2}
              fill={readOnly ? t.violet : "none"}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {readOnly ? "Task Feedback" : "Rate & Finish Task"}
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
              {row.task || row.name || row.module || `Row #${row.id}`}
            </div>
          </div>

          {readOnly && (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                background: t.violetBg,
                color: t.violet,
                border: `1px solid ${t.violetBorder}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Read Only
            </span>
          )}

          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSubmitting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* ═══ SECTION 1: TIME EFFICIENCY ═══ */}
          <div
            style={{
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 18,
              background: t.bgSubtle,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: t.primaryBg,
                  color: t.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={14} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: t.textPrimary,
                  }}
                >
                  Time Efficiency
                  {!readOnly && (
                    <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: t.textMuted }}>
                  How efficiently was the task completed within the planned
                  timeframe?
                </div>
              </div>
            </div>

            {/* Reference Data Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <RefCard
                label="Planned Start"
                value={fmtActual(row.plannedStart)}
                icon={<CalendarX size={13} />}
                color={t.primary}
              />
              <RefCard
                label="Planned Stop"
                value={fmtActual(row.plannedStop)}
                icon={<CalendarX size={13} />}
                color={t.primary}
              />
              <RefCard
                label="Actual Start"
                value={fmtActual(row.actualStart)}
                icon={<ClipboardList size={13} />}
                color={t.success}
              />
              <RefCard
                label="Actual Stop"
                value={fmtActual(row.actualStop)}
                icon={<ClipboardList size={13} />}
                color={t.success}
              />
            </div>

            {/* Duration Comparison */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: t.primaryBg,
                  border: `1px solid ${t.primaryBorder}`,
                  borderRadius: 7,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: t.primary,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: 2,
                  }}
                >
                  Benchmark Duration
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: t.primary,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {fmtHrMin(benchmarkHrs)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: isAhead
                    ? t.successBg
                    : isOnTime
                      ? t.primaryBg
                      : t.warningBg,
                  border: `1px solid ${isAhead ? t.successBorder : isOnTime ? t.primaryBorder : t.warningBorder}`,
                  borderRadius: 7,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: isAhead
                      ? t.success
                      : isOnTime
                        ? t.primary
                        : t.warning,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: 2,
                  }}
                >
                  Actual Duration
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: isAhead
                      ? t.success
                      : isOnTime
                        ? t.primary
                        : t.warning,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {fmtHrMin(actualHrs)}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  background: isAhead
                    ? t.successBg
                    : isOnTime
                      ? t.infoBg
                      : t.dangerBg,
                  border: `1px solid ${isAhead ? t.successBorder : isOnTime ? t.infoBorder : t.dangerBorder}`,
                  borderRadius: 7,
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: t.textMuted,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: 2,
                  }}
                >
                  Variance
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: isAhead
                      ? t.success
                      : isOnTime
                        ? t.primary
                        : t.danger,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {isAhead ? "" : isOnTime ? "" : "+"}
                  {efficiencyPercent}%
                </div>
              </div>
            </div>

            {!readOnly && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  padding: "5px 10px",
                  background: t.infoBg,
                  border: `1px solid ${t.infoBorder}`,
                  borderRadius: 6,
                  fontSize: 10.5,
                  color: t.info,
                }}
              >
                <Info size={12} />
                <span>
                  Suggested rating: <strong>{suggestTimeRating()}/10</strong>{" "}
                  based on{" "}
                  {efficiencyPercent === 0
                    ? "on-time delivery"
                    : isAhead
                      ? `${Math.abs(efficiencyPercent)}% ahead of schedule`
                      : `${efficiencyPercent}% over planned time`}
                </span>
                <button
                  onClick={() => setTimeRating(suggestTimeRating())}
                  style={{
                    marginLeft: "auto",
                    background: t.primary,
                    color: t.textInverse,
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            )}

            <RatingBar
              value={timeRating}
              hover={hoverTime}
              onChange={setTimeRating}
              onHover={setHoverTime}
              onLeave={() => setHoverTime(0)}
              disabled={readOnly || isSubmitting}
            />
            <div
              style={{
                fontSize: 10.5,
                color: t.textMuted,
                fontStyle: "italic",
                marginTop: 6,
                minHeight: 14,
              }}
            >
              {timeLabels[readOnly ? timeRating : hoverTime || timeRating] ||
                "Select a rating"}
            </div>
            {!readOnly && touched && timeRating === 0 && (
              <div style={{ fontSize: 10.5, color: t.danger, marginTop: 4 }}>
                ⚠ Please rate time efficiency
              </div>
            )}

            <CommentField
              label="Time Efficiency Comments"
              value={timeComments}
              onChange={setTimeComments}
              placeholder="Comments on time management, delays, early delivery…"
              readOnly={readOnly}
              disabled={isSubmitting}
            />
          </div>

          {/* ═══ SECTION 2: FULFILLMENT ═══ */}
          <div
            style={{
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 18,
              background: t.bgSubtle,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: t.violetBg,
                  color: t.violet,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={14} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: t.textPrimary,
                  }}
                >
                  Level of Fulfillment
                  {!readOnly && (
                    <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: t.textMuted }}>
                  Quality of deliverable and completeness of requirements.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: rejectCount === 0 ? t.successBg : t.dangerBg,
                  border: `1px solid ${rejectCount === 0 ? t.successBorder : t.dangerBorder}`,
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background:
                      rejectCount === 0 ? t.successBgSubtle : t.dangerBgSubtle,
                    color: rejectCount === 0 ? t.success : t.danger,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 16,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {rejectCount}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: rejectCount === 0 ? t.success : t.danger,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Reject / Redo Count
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: rejectCount === 0 ? t.success : t.dangerTextDeep,
                      fontWeight: 500,
                    }}
                  >
                    {rejectCount === 0
                      ? "No rejections — first-time acceptance"
                      : rejectCount === 1
                        ? "Rejected once — required one rework"
                        : `Rejected ${rejectCount} times — multiple reworks needed`}
                  </div>
                </div>
              </div>
            </div>

            {!readOnly && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  padding: "5px 10px",
                  background: t.violetBg,
                  border: `1px solid ${t.violetBorder}`,
                  borderRadius: 6,
                  fontSize: 10.5,
                  color: t.violet,
                }}
              >
                <Info size={12} />
                <span>
                  Suggested rating:{" "}
                  <strong>{suggestFulfillmentRating()}/10</strong> based on{" "}
                  {rejectCount === 0
                    ? "zero rejections"
                    : `${rejectCount} rejection${rejectCount !== 1 ? "s" : ""}`}
                </span>
                <button
                  onClick={() =>
                    setFulfillmentRating(suggestFulfillmentRating())
                  }
                  style={{
                    marginLeft: "auto",
                    background: t.violet,
                    color: t.textInverse,
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            )}

            <RatingBar
              value={fulfillmentRating}
              hover={hoverFulfillment}
              onChange={setFulfillmentRating}
              onHover={setHoverFulfillment}
              onLeave={() => setHoverFulfillment(0)}
              disabled={readOnly || isSubmitting}
            />
            <div
              style={{
                fontSize: 10.5,
                color: t.textMuted,
                fontStyle: "italic",
                marginTop: 6,
                minHeight: 14,
              }}
            >
              {fulfillmentLabels[
                readOnly
                  ? fulfillmentRating
                  : hoverFulfillment || fulfillmentRating
              ] || "Select a rating"}
            </div>
            {!readOnly && touched && fulfillmentRating === 0 && (
              <div style={{ fontSize: 10.5, color: t.danger, marginTop: 4 }}>
                ⚠ Please rate level of fulfillment
              </div>
            )}

            <CommentField
              label="Fulfillment Comments"
              value={fulfillmentComments}
              onChange={setFulfillmentComments}
              placeholder="Comments on quality, completeness, rework needed…"
              readOnly={readOnly}
              disabled={isSubmitting}
            />
          </div>

          {/* ═══ SECTION 3: INNOVATION ═══ */}
          <div
            style={{
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 18,
              background: t.bgSubtle,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: t.warningBg,
                  color: t.warning,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lightbulb size={14} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: t.textPrimary,
                  }}
                >
                  Level of Innovation
                  {!readOnly && (
                    <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: t.textMuted }}>
                  Creativity, problem-solving, and innovative thinking applied
                  to the task.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
                padding: "5px 10px",
                background: t.warningBgSubtle,
                border: `1px solid ${t.warningBorder}`,
                borderRadius: 6,
                fontSize: 10.5,
                color: t.warning,
              }}
            >
              <Info size={12} />
              <span>
                This is a subjective assessment — rate based on your observation
                of creative and innovative effort.
              </span>
            </div>

            <RatingBar
              value={innovationRating}
              hover={hoverInnovation}
              onChange={setInnovationRating}
              onHover={setHoverInnovation}
              onLeave={() => setHoverInnovation(0)}
              disabled={readOnly || isSubmitting}
            />
            <div
              style={{
                fontSize: 10.5,
                color: t.textMuted,
                fontStyle: "italic",
                marginTop: 6,
                minHeight: 14,
              }}
            >
              {innovationLabels[
                readOnly
                  ? innovationRating
                  : hoverInnovation || innovationRating
              ] || "Select a rating"}
            </div>
            {!readOnly && touched && innovationRating === 0 && (
              <div style={{ fontSize: 10.5, color: t.danger, marginTop: 4 }}>
                ⚠ Please rate level of innovation
              </div>
            )}

            <CommentField
              label="Innovation Comments"
              value={innovationComments}
              onChange={setInnovationComments}
              placeholder="Comments on creative solutions, novel approaches, improvements…"
              readOnly={readOnly}
              disabled={isSubmitting}
            />
          </div>

          {/* ═══ SECTION 4: OVERALL COMMENTS ═══ */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11.5,
                fontWeight: 600,
                color: t.textPrimary,
                marginBottom: 6,
              }}
            >
              Overall Feedback
              {!readOnly && (
                <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
              )}
            </label>

            {readOnly ? (
              <div
                style={{
                  width: "100%",
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: "Sora,sans-serif",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: t.textPrimary,
                  background: t.bgSubtle,
                  minHeight: 60,
                  boxSizing: "border-box",
                  whiteSpace: "pre-wrap",
                }}
              >
                {overallComments || "No feedback provided."}
              </div>
            ) : (
              <>
                <textarea
                  value={overallComments}
                  onChange={(e) => setOverallComments(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Describe the quality of work, time management, areas of improvement…"
                  disabled={isSubmitting}
                  rows={4}
                  style={{
                    width: "100%",
                    border: `1px solid ${touched && overallComments.trim().length < 5 ? t.dangerBorder : t.borderStrong}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontFamily: "Sora,sans-serif",
                    fontSize: 12.5,
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                    minHeight: 80,
                    lineHeight: 1.5,
                    background: isSubmitting ? t.bgInputDisabled : t.bgInput,
                    color: t.textPrimary,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontSize: 10.5,
                    color:
                      touched && overallComments.trim().length < 5
                        ? t.danger
                        : t.textFaint,
                  }}
                >
                  <span>
                    {touched && overallComments.trim().length < 5
                      ? "⚠ Feedback must be at least 5 characters"
                      : "Share your overall assessment"}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color:
                        overallComments.trim().length > 0
                          ? t.textSecondary
                          : t.textDisabled,
                    }}
                  >
                    {overallComments.trim().length} chars
                  </span>
                </div>
              </>
            )}
          </div>
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
            flexShrink: 0,
          }}
        >
          {readOnly ? (
            <button
              onClick={onClose}
              style={{
                ...btnStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <X size={13} /> Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  ...btnStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  opacity: isSubmitting ? 0.5 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                style={{
                  ...btnStyle,
                  background: isValid ? t.success : t.bgMuted,
                  color: isValid ? t.textInverse : t.textFaint,
                  borderColor: isValid ? t.success : t.border,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: !isValid || isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star size={14} /> Submit & Finish
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Named Exports for Sub-components ─── */
export { RatingBar, RefCard, CommentField, fmtHrMin, fmtPlanned, fmtActual };
