import React, { useState, useMemo } from "react";
import {
  X,
  Star,
  XCircle,
  Clock,
  ShieldCheck,
  Lightbulb,
  Users,
  Info,
  Loader2,
  AlertOctagon,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { useResponsive } from "../useResponsive";
import BottomSheet from "../shared/BottomSheet";
import { makeBtnStyle } from "../helpers/styles";
import CommentField from "../shared/CommentField";
import RatingBar from "../shared/RatingBar";

export default function ProjectCloseModal({
  project,
  rows,
  onClose,
  onConfirm,
  isSubmitting = false,
  readOnly = false,
  savedFeedback = null,
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();
  const btnStyle = makeBtnStyle(t);

  // ── Top-level rows only ──
  const topLevelRows = useMemo(() => rows.filter((r) => !r.parentId), [rows]);

  // ── Per-resource stats ──
  const resourceStats = useMemo(() => {
    const map = {};
    topLevelRows.forEach((r) => {
      if (!r.resource) return;
      const key = r.resource;
      if (!map[key]) {
        map[key] = {
          userId: key,
          name: r.resourceName || key,
          taskCount: 0,
          totalTime: 0,
          totalFulfillment: 0,
          totalInnovation: 0,
          ratedCount: 0,
        };
      }
      map[key].taskCount += 1;
      if (r.timeEfficiencyRating && r.fulfillmentRating && r.innovationRating) {
        map[key].totalTime += r.timeEfficiencyRating;
        map[key].totalFulfillment += r.fulfillmentRating;
        map[key].totalInnovation += r.innovationRating;
        map[key].ratedCount += 1;
      }
    });
    return Object.values(map).map((s) => ({
      ...s,
      avgTime:
        s.ratedCount > 0
          ? Math.round((s.totalTime / s.ratedCount) * 10) / 10
          : 0,
      avgFulfillment:
        s.ratedCount > 0
          ? Math.round((s.totalFulfillment / s.ratedCount) * 10) / 10
          : 0,
      avgInnovation:
        s.ratedCount > 0
          ? Math.round((s.totalInnovation / s.ratedCount) * 10) / 10
          : 0,
    }));
  }, [topLevelRows]);

  // ── Duration comparison ──
  const totalBenchmarkHrs = useMemo(
    () => topLevelRows.reduce((sum, r) => sum + Number(r.durationHrs || 0), 0),
    [topLevelRows],
  );

  const totalActualHrs = useMemo(
    () =>
      topLevelRows.reduce((sum, r) => {
        const s = r.actualStart ? new Date(r.actualStart) : null;
        const e = r.actualStop ? new Date(r.actualStop) : null;
        if (s && e && !isNaN(s) && !isNaN(e)) {
          return sum + (e.getTime() - s.getTime()) / (1000 * 60 * 60);
        }
        if (r.actualElapsedHrs)
          return sum + Math.abs(Number(r.actualElapsedHrs));
        return sum;
      }, 0),
    [topLevelRows],
  );

  const totalBenchmarkRounded = Math.round(totalBenchmarkHrs * 100) / 100;
  const totalActualRounded = Math.round(totalActualHrs * 100) / 100;

  const fmtHrMin = (hrs) => {
    if (hrs == null || isNaN(hrs)) return "—";
    const min = Math.round(Math.abs(hrs) * 60);
    const h = Math.floor(min / 60);
    const m = min % 60;
    const sign = hrs < 0 ? "-" : "";
    if (h === 0) return `${sign}${m}m`;
    if (m === 0) return `${sign}${h}h`;
    return `${sign}${h}h ${m}m`;
  };

  const efficiencyPercent =
    totalBenchmarkRounded > 0
      ? Math.round(
          ((totalActualRounded - totalBenchmarkRounded) /
            totalBenchmarkRounded) *
            100,
        )
      : 0;
  const isAhead = efficiencyPercent < 0;
  const isOnTime = efficiencyPercent === 0;

  const suggestTimeRating = () => {
    if (
      !totalBenchmarkRounded ||
      totalBenchmarkRounded <= 0 ||
      !totalActualRounded
    )
      return 5;
    const ratio = totalActualRounded / totalBenchmarkRounded;
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
    const rated = resourceStats.filter((s) => s.ratedCount > 0);
    if (rated.length === 0) return 5;
    return Math.round(
      rated.reduce((sum, s) => sum + s.avgFulfillment, 0) / rated.length,
    );
  };

  const [timeRating, setTimeRating] = useState(
    readOnly && savedFeedback
      ? savedFeedback.timeEfficiencyRating || 0
      : suggestTimeRating(),
  );
  const [fulfillmentRating, setFulfillmentRating] = useState(
    readOnly && savedFeedback
      ? savedFeedback.fulfillmentRating || 0
      : suggestFulfillmentRating(),
  );
  const [innovationRating, setInnovationRating] = useState(
    readOnly && savedFeedback ? savedFeedback.innovationRating || 0 : 0,
  );
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverFulfillment, setHoverFulfillment] = useState(0);
  const [hoverInnovation, setHoverInnovation] = useState(0);

  const [timeComments, setTimeComments] = useState(
    readOnly && savedFeedback ? savedFeedback.timeEfficiencyComments || "" : "",
  );
  const [fulfillmentComments, setFulfillmentComments] = useState(
    readOnly && savedFeedback ? savedFeedback.fulfillmentComments || "" : "",
  );
  const [innovationComments, setInnovationComments] = useState(
    readOnly && savedFeedback ? savedFeedback.innovationComments || "" : "",
  );
  const [overallComments, setOverallComments] = useState(
    readOnly && savedFeedback ? savedFeedback.overallComments || "" : "",
  );
  const [touched, setTouched] = useState(false);

  const [resourceRatings, setResourceRatings] = useState(() => {
    const initial = {};
    if (readOnly && savedFeedback?.resourceRatings) {
      savedFeedback.resourceRatings.forEach((r) => {
        initial[r.userId] = {
          rating: r.rating || 0,
          comments: r.comments || "",
        };
      });
      resourceStats.forEach((s) => {
        if (!initial[s.userId]) initial[s.userId] = { rating: 0, comments: "" };
      });
    } else {
      resourceStats.forEach((s) => {
        const avg =
          s.ratedCount > 0
            ? Math.round(
                ((s.avgTime + s.avgFulfillment + s.avgInnovation) / 3) * 10,
              ) / 10
            : 0;
        initial[s.userId] = {
          rating: avg > 0 ? Math.round(avg) : 0,
          comments: "",
        };
      });
    }
    return initial;
  });

  const [resourceHovers, setResourceHovers] = useState({});

  const allResourcesRated = resourceStats.every(
    (s) => resourceRatings[s.userId]?.rating > 0,
  );

  const isValid =
    timeRating > 0 &&
    fulfillmentRating > 0 &&
    innovationRating > 0 &&
    allResourcesRated &&
    overallComments.trim().length >= 5;

  const timeLabels = {
    1: "Very Poor — Project took 2x+ longer than planned",
    2: "Poor — Significant project delay",
    3: "Below Average — Notable time overrun",
    4: "Slightly Below — Moderate delays",
    5: "Average — Some delays across tasks",
    6: "Slightly Above — Minor delays overall",
    7: "Good — Most tasks on time",
    8: "Very Good — Project completed on time",
    9: "Excellent — Ahead of schedule",
    10: "Outstanding — Well ahead of schedule",
  };

  const fulfillmentLabels = {
    1: "Unacceptable — Major quality failures across team",
    2: "Very Poor — Extensive rework needed",
    3: "Poor — Significant quality issues",
    4: "Below Average — Notable gaps",
    5: "Average — Acceptable overall",
    6: "Slightly Above — Minor issues",
    7: "Good — Meets most expectations",
    8: "Very Good — Meets all expectations",
    9: "Excellent — Exceeds expectations",
    10: "Outstanding — Exceptional quality across all tasks",
  };

  const innovationLabels = {
    1: "No Innovation — Routine execution only",
    2: "Minimal — Very little creative input",
    3: "Below Average — Standard approach",
    4: "Slightly Below — Some effort but conventional",
    5: "Average — Standard with minor improvements",
    6: "Slightly Above — Some creative solutions",
    7: "Good — Noticeable innovative thinking",
    8: "Very Good — Creative problem-solving",
    9: "Excellent — Significant innovation",
    10: "Outstanding — Exceptional creativity",
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid) return;
    await onConfirm({
      timeEfficiencyRating: timeRating,
      timeEfficiencyComments: timeComments.trim(),
      fulfillmentRating,
      fulfillmentComments: fulfillmentComments.trim(),
      innovationRating,
      innovationComments: innovationComments.trim(),
      overallComments: overallComments.trim(),
      resourceRatings: resourceStats.map((s) => ({
        userId: s.userId,
        name: s.name,
        rating: resourceRatings[s.userId]?.rating || 0,
        comments: (resourceRatings[s.userId]?.comments || "").trim(),
        avgTimeFromTasks: s.avgTime,
        avgFulfillmentFromTasks: s.avgFulfillment,
        avgInnovationFromTasks: s.avgInnovation,
      })),
    });
  };

  const ratingColor = (val) => {
    if (val <= 0)
      return { bg: t.bgMuted, color: t.textFaint, border: t.border };
    if (val <= 3) return { bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5" };
    if (val <= 5) return { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" };
    if (val <= 7) return { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" };
    return { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" };
  };

  const unratedCount = topLevelRows.filter(
    (r) =>
      !r.timeEfficiencyRating || !r.fulfillmentRating || !r.innovationRating,
  ).length;
  const finishedCount = topLevelRows.filter(
    (r) =>
      String(r.status || "")
        .toLowerCase()
        .trim() === "finished",
  ).length;

  const modalTitle = readOnly ? "Project Feedback" : "Close Project";

  /* ─── Body content (shared between mobile & desktop) ─── */
  const bodyContent = (
    <div style={{ padding: isMobile ? "16px 14px" : "20px" }}>
      {/* Warning banner */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: 10,
            background: t.dangerBgSubtle,
            border: `1px solid ${t.dangerBorder}`,
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          <AlertOctagon
            size={16}
            color={t.danger}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div
            style={{ fontSize: 12, color: t.dangerTextDeep, lineHeight: 1.5 }}
          >
            This will permanently <strong>close</strong> the project. All tasks
            will be finalized. This action cannot be undone.
          </div>
        </div>
      )}

      {/* Unrated warning */}
      {unratedCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: 10,
            background: t.warningBgSubtle,
            border: `1px solid ${t.warningBorder}`,
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          <AlertTriangle
            size={16}
            color={t.warning}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div style={{ fontSize: 12, color: t.warning, lineHeight: 1.5 }}>
            <strong>{unratedCount}</strong> of {topLevelRows.length} top-level
            task{topLevelRows.length !== 1 ? "s" : ""} not rated. (
            {finishedCount} finished, {topLevelRows.length - finishedCount}{" "}
            remaining).
          </div>
        </div>
      )}

      {/* ═══ Per-Resource Ratings ═══ */}
      {resourceStats.length > 0 && (
        <div
          style={{
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: isMobile ? 12 : 16,
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
                background: "#FCE7F3",
                color: "#BE185D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary }}
              >
                Rate Each Resource
                <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted }}>
                Project-level rating per resource
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {resourceStats.map((s) => {
              const avg =
                s.ratedCount > 0
                  ? Math.round(
                      ((s.avgTime + s.avgFulfillment + s.avgInnovation) / 3) *
                        10,
                    ) / 10
                  : 0;
              const rc = ratingColor(avg);
              const currentRating = resourceRatings[s.userId]?.rating || 0;
              const currentComments = resourceRatings[s.userId]?.comments || "";
              const currentHover = resourceHovers[s.userId] || 0;

              return (
                <div
                  key={s.userId}
                  style={{
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    padding: 12,
                    background: t.bgCard,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: t.primaryBg,
                        color: t.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(s.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: t.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: t.textFaint,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {s.userId}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: rc.bg,
                        color: rc.color,
                        border: `1px solid ${rc.border}`,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      Avg: {avg > 0 ? avg.toFixed(1) : "—"}
                    </span>
                  </div>

                  {avg > 0 && !readOnly && (
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
                        fontSize: 11,
                        color: t.info,
                      }}
                    >
                      <Info size={11} />
                      <span>
                        Suggested: <strong>{Math.round(avg)}/10</strong>
                      </span>
                      <button
                        onClick={() =>
                          setResourceRatings((prev) => ({
                            ...prev,
                            [s.userId]: {
                              ...prev[s.userId],
                              rating: Math.round(avg),
                            },
                          }))
                        }
                        style={{
                          marginLeft: "auto",
                          background: t.primary,
                          color: t.textInverse,
                          border: "none",
                          borderRadius: 4,
                          padding: "3px 10px",
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
                    value={currentRating}
                    hover={currentHover}
                    onChange={(val) =>
                      setResourceRatings((prev) => ({
                        ...prev,
                        [s.userId]: { ...prev[s.userId], rating: val },
                      }))
                    }
                    onHover={(val) =>
                      setResourceHovers((prev) => ({
                        ...prev,
                        [s.userId]: val,
                      }))
                    }
                    onLeave={() =>
                      setResourceHovers((prev) => ({ ...prev, [s.userId]: 0 }))
                    }
                    disabled={readOnly || isSubmitting}
                  />

                  {touched && currentRating === 0 && (
                    <div
                      style={{ fontSize: 11, color: t.danger, marginTop: 4 }}
                    >
                      ⚠ Please rate {s.name}
                    </div>
                  )}

                  <CommentField
                    label={`Comments for ${s.name}`}
                    value={currentComments}
                    onChange={(val) =>
                      setResourceRatings((prev) => ({
                        ...prev,
                        [s.userId]: { ...prev[s.userId], comments: val },
                      }))
                    }
                    placeholder="Feedback…"
                    readOnly={readOnly}
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Time Efficiency ═══ */}
      <div
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: isMobile ? 12 : 16,
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
              style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary }}
            >
              Project Time Efficiency
              <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>
              Overall efficiency across all top-level tasks
            </div>
          </div>
        </div>

        {/* Duration comparison */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Total Benchmark",
              value: fmtHrMin(totalBenchmarkRounded),
              bg: t.primaryBg,
              color: t.primary,
              border: t.primaryBorder,
              extra: `${topLevelRows.length} task${topLevelRows.length !== 1 ? "s" : ""}`,
            },
            {
              label: "Total Actual",
              value: fmtHrMin(totalActualRounded),
              bg: isAhead ? t.successBg : isOnTime ? t.primaryBg : t.warningBg,
              color: isAhead ? t.success : isOnTime ? t.primary : t.warning,
              border: isAhead
                ? t.successBorder
                : isOnTime
                  ? t.primaryBorder
                  : t.warningBorder,
            },
            {
              label: "Variance",
              value: `${isAhead || isOnTime ? "" : "+"}${efficiencyPercent}%`,
              bg: isAhead ? t.successBg : isOnTime ? t.infoBg : t.dangerBg,
              color: isAhead ? t.success : isOnTime ? t.primary : t.danger,
              border: isAhead
                ? t.successBorder
                : isOnTime
                  ? t.infoBorder
                  : t.dangerBorder,
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 100px",
                padding: "8px 12px",
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 7,
                textAlign: "center",
                minWidth: 90,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: c.color,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: 2,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: c.color,
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {c.value}
              </div>
              {c.extra && (
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
                  {c.extra}
                </div>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <SuggestionRow
            t={t}
            bg={t.infoBg}
            border={t.infoBorder}
            color={t.info}
            btnBg={t.primary}
            text={
              <>
                Suggested: <strong>{suggestTimeRating()}/10</strong> based on{" "}
                {efficiencyPercent === 0
                  ? "on-time delivery"
                  : isAhead
                    ? `${Math.abs(efficiencyPercent)}% ahead`
                    : `${efficiencyPercent}% over`}
              </>
            }
            onApply={() => setTimeRating(suggestTimeRating())}
          />
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
            fontSize: 11,
            color: t.textMuted,
            fontStyle: "italic",
            marginTop: 6,
            minHeight: 14,
          }}
        >
          {timeLabels[hoverTime || timeRating] || "Select a rating"}
        </div>
        {touched && timeRating === 0 && (
          <div style={{ fontSize: 11, color: t.danger, marginTop: 4 }}>
            ⚠ Please rate time efficiency
          </div>
        )}

        <CommentField
          label="Time Efficiency Comments"
          value={timeComments}
          onChange={setTimeComments}
          placeholder="Comments on time management…"
          readOnly={readOnly}
          disabled={readOnly || isSubmitting}
        />
      </div>

      {/* ═══ Fulfillment ═══ */}
      <div
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: isMobile ? 12 : 16,
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
              style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary }}
            >
              Project Fulfillment
              <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>
              Overall quality and completeness
            </div>
          </div>
        </div>

        {!readOnly && (
          <SuggestionRow
            t={t}
            bg={t.violetBg}
            border={t.violetBorder}
            color={t.violet}
            btnBg={t.violet}
            text={
              <>
                Suggested: <strong>{suggestFulfillmentRating()}/10</strong> from
                resource averages
              </>
            }
            onApply={() => setFulfillmentRating(suggestFulfillmentRating())}
          />
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
            fontSize: 11,
            color: t.textMuted,
            fontStyle: "italic",
            marginTop: 6,
            minHeight: 14,
          }}
        >
          {fulfillmentLabels[hoverFulfillment || fulfillmentRating] ||
            "Select a rating"}
        </div>
        {touched && fulfillmentRating === 0 && (
          <div style={{ fontSize: 11, color: t.danger, marginTop: 4 }}>
            ⚠ Please rate fulfillment
          </div>
        )}

        <CommentField
          label="Fulfillment Comments"
          value={fulfillmentComments}
          onChange={setFulfillmentComments}
          placeholder="Comments on quality…"
          readOnly={readOnly}
          disabled={readOnly || isSubmitting}
        />
      </div>

      {/* ═══ Innovation ═══ */}
      <div
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: isMobile ? 12 : 16,
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
              style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary }}
            >
              Project Innovation
              <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>
              Creative and innovative effort
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
            fontSize: 11,
            color: t.warning,
          }}
        >
          <Info size={11} />
          <span>Subjective — rate based on observed innovation</span>
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
            fontSize: 11,
            color: t.textMuted,
            fontStyle: "italic",
            marginTop: 6,
            minHeight: 14,
          }}
        >
          {innovationLabels[hoverInnovation || innovationRating] ||
            "Select a rating"}
        </div>
        {touched && innovationRating === 0 && (
          <div style={{ fontSize: 11, color: t.danger, marginTop: 4 }}>
            ⚠ Please rate innovation
          </div>
        )}

        <CommentField
          label="Innovation Comments"
          value={innovationComments}
          onChange={setInnovationComments}
          placeholder="Creative solutions…"
          readOnly={readOnly}
          disabled={readOnly || isSubmitting}
        />
      </div>

      {/* ═══ Overall Comments ═══ */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: t.textPrimary,
            marginBottom: 6,
          }}
        >
          Overall Project Feedback
          <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
        </label>
        <textarea
          value={overallComments}
          onChange={(e) => setOverallComments(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Summarize your overall assessment…"
          disabled={readOnly || isSubmitting}
          rows={isMobile ? 5 : 4}
          style={{
            width: "100%",
            border: `1px solid ${touched && overallComments.trim().length < 5 ? t.dangerBorder : t.borderStrong}`,
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: "Sora,sans-serif",
            fontSize: isMobile ? 14 : 12.5,
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: isMobile ? 100 : 80,
            lineHeight: 1.5,
            background:
              readOnly || isSubmitting ? t.bgInputDisabled : t.bgInput,
            color: t.textPrimary,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 6,
            fontSize: 11,
            color:
              touched && overallComments.trim().length < 5
                ? t.danger
                : t.textFaint,
          }}
        >
          <span>
            {touched && overallComments.trim().length < 5
              ? "⚠ Overall feedback must be at least 5 characters"
              : "Summarize your assessment"}
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
      </div>
    </div>
  );

  /* ─── Footer buttons ─── */
  const footerButtons = readOnly ? (
    <button
      onClick={onClose}
      style={{
        ...btnStyle,
        flex: isMobile ? 1 : "initial",
        height: isMobile ? 46 : 32,
        justifyContent: "center",
        fontSize: isMobile ? 14 : 12,
        fontWeight: isMobile ? 600 : 500,
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
          flex: isMobile ? 1 : "initial",
          height: isMobile ? 46 : 32,
          justifyContent: "center",
          fontSize: isMobile ? 14 : 12,
          fontWeight: isMobile ? 600 : 500,
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
          flex: isMobile ? 1.2 : "initial",
          height: isMobile ? 46 : 32,
          background: isValid ? t.danger : t.bgMuted,
          color: isValid ? t.textInverse : t.textFaint,
          borderColor: isValid ? t.danger : t.border,
          justifyContent: "center",
          fontSize: isMobile ? 14 : 12,
          fontWeight: isMobile ? 700 : 600,
          opacity: isSubmitting ? 0.6 : 1,
          cursor: !isValid || isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Closing...
          </>
        ) : (
          <>
            <XCircle size={14} /> Close Project
          </>
        )}
      </button>
    </>
  );

  // ══════════════════════════════════════════════════════
  //   MOBILE — Bottom Sheet
  // ══════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <BottomSheet
        open={true}
        onClose={onClose}
        title={modalTitle}
        height="full"
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Subtitle */}
          <div
            style={{
              padding: "10px 16px",
              background: readOnly ? t.violetBg : t.dangerBgSubtle,
              borderBottom: `1px solid ${t.border}`,
              fontSize: 12,
              color: readOnly ? t.violet : t.danger,
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {readOnly ? (
              <Star size={14} fill={t.violet} />
            ) : (
              <XCircle size={14} />
            )}
            <span style={{ fontWeight: 600 }}>
              {project || "Untitled Project"}
            </span>
            {readOnly && (
              <span
                style={{
                  marginLeft: "auto",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: t.violetBg,
                  color: t.violet,
                  border: `1px solid ${t.violetBorder}`,
                  textTransform: "uppercase",
                }}
              >
                Read Only
              </span>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto" }}>{bodyContent}</div>

          {/* Footer */}
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${t.border}`,
              display: "flex",
              gap: 8,
              background: t.bgSubtle,
            }}
          >
            {footerButtons}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ══════════════════════════════════════════════════════
  //   DESKTOP — Existing modal
  // ══════════════════════════════════════════════════════
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: readOnly ? t.violetBg : t.dangerBgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: readOnly ? t.violetBg : t.dangerBg,
              color: readOnly ? t.violet : t.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {readOnly ? (
              <Star size={20} strokeWidth={2} fill={t.violet} />
            ) : (
              <XCircle size={20} strokeWidth={2} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {modalTitle}
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
              {project || "Untitled Project"}
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
        <div style={{ flex: 1, overflowY: "auto" }}>{bodyContent}</div>

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
          {footerButtons}
        </div>
      </div>
    </div>
  );
}

/* ─── Suggestion Row helper ─── */
function SuggestionRow({ t, bg, border, color, btnBg, text, onApply }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
        padding: "6px 10px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        fontSize: 11,
        color,
        flexWrap: "wrap",
      }}
    >
      <Info size={11} />
      <span style={{ flex: 1, minWidth: 100 }}>{text}</span>
      <button
        onClick={onApply}
        style={{
          background: btnBg,
          color: t.textInverse,
          border: "none",
          borderRadius: 4,
          padding: "3px 10px",
          fontSize: 10,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Apply
      </button>
    </div>
  );
}
