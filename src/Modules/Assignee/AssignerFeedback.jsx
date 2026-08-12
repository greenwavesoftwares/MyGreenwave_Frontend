import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Star, StarHalf, Send, Check } from "lucide-react";
import "./AssignerFeedback.css";
import { getUserData } from "../Login/Encrypt";
import { managerFeedback } from "./AssigneeHelper";

/**
 * StarRating
 * Small reusable 1-5 star control with half-star precision (0.5 steps).
 * Clicking/hovering the left half of a star selects the .5 value, the
 * right half selects the whole number. Color comes entirely from the
 * `af-star-icon` classes (which read the --pj-warning token), so it
 * stays in sync with light/dark mode automatically.
 */
const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  // Given a pointer event over a given star's button, figure out whether
  // the pointer is in the left half (→ star - 0.5) or right half (→ star).
  const valueFromPointer = (e, star) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? star - 0.5 : star;
  };

  const display = hovered || value;

  return (
    <Box className="af-stars">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = star <= display;
        const half = !full && star - 0.5 <= display;
        const Icon = half ? StarHalf : Star;

        return (
          <IconButton
            key={star}
            size="small"
            className="af-star-btn"
            onClick={(e) => onChange(valueFromPointer(e, star))}
            onMouseMove={(e) => setHovered(valueFromPointer(e, star))}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star - 0.5} or ${star} out of 5`}
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              className={
                full || half
                  ? "af-star-icon af-star-icon--filled"
                  : "af-star-icon"
              }
            />
          </IconButton>
        );
      })}
    </Box>
  );
};

// Key used to store the overall rating/remark inside a manager's
// `entries` map, alongside the regular per-point entries. Keeping it
// in the same map means one set of getters/setters (setRating/setRemark)
// handles both per-point ratings and the overall rating — no separate
// finalRating/finalRemark state to keep in sync.
const OVERALL_KEY = "overall";

/**
 * AssignerFeedback
 *
 * Dialog for rating one or more assigners (the assigner and any number
 * of co-assigners) across a dynamic set of criteria ("categories"), plus
 * one overall rating + remark per assigner. The overall rating/remark is
 * stored as just another entry (categoryId: "overall") inside the same
 * `entries` list as the per-category ratings — matches the wire format
 * for both GET and PUT, and is rendered separately at the bottom of the
 * form using the same read/write helpers.
 *
 * A tab strip lets the user move between assigners, with a checkmark
 * once an assigner's per-category ratings are complete.
 *
 * Colors and dark mode come entirely from the shared --pj-* tokens
 * defined in ProjectActivityInfo.css — this file defines no colors
 * of its own, same pattern as PauseReasonDialog.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - projectId: string
 *      required to build the PUT payload; forwarded as-is from whatever
 *      screen renders this dialog.
 *  - assigners: [{ assignerId, name, role }]
 *      role is free text, e.g. "assigner" | "co-assigner" — pass as
 *      many co-assigners as needed, the tab strip scrolls. Can be
 *      passed straight through from the GET response's `assigners`.
 *  - feedback: [{ assignerId, entries: [{ categoryId, rating, remark }] }]
 *      pre-fills the form from the GET response's `feedback` array
 *      (e.g. previously submitted feedback for this project).
 *  - onSubmit: (payload) => void   payload matches the PUT shape:
 *      {
 *        userId, projectId, submittedAt,
 *        feedback: [{ assignerId, entries: [{ categoryId, rating, remark }] }]
 *      }
 */
const AssignerFeedback = ({
  open = true,
  onClose = () => {},
  projectId,
  assigners = [
    { assignerId: "riya.sharma@greenwave.co.in", name: "Riya Sharma", role: "assigner" },
    { assignerId: "devansh.kapoor@greenwave.co.in", name: "Devansh Kapoor", role: "co-assigner" },
    { assignerId: "ayesha.khan@greenwave.co.in", name: "Ayesha Khan", role: "co-assigner" },
  ],
  feedback,
  onSubmit = () => {},
}) => {
  // Converts the GET-response `feedback` array (list of
  // { assignerId, entries: [{ categoryId, rating, remark }] }) into the
  // shape this component edits internally: a map keyed by assignerId,
  // each holding a map keyed by categoryId, for O(1) lookups while
  // rendering/editing. Converted back to the list shape on submit.
  const toInternalData = (feedbackList = []) =>
    feedbackList.reduce((acc, f) => {
      acc[f.assignerId] = {
        entries: Object.fromEntries(
          (f.entries || []).map((e) => [
            e.categoryId,
            { rating: e.rating, remark: e.remark },
          ]),
        ),
      };
      return acc;
    }, {});

  const [activeAssignerId, setActiveAssignerId] = useState(
    assigners[0]?.assignerId,
  );
  // data keyed by assignerId -> { entries: { [categoryId]: {rating, remark} } }
  // The overall rating/remark lives at entries[OVERALL_KEY], same shape
  // as any other category entry.
  const [data, setData] = useState(() => toInternalData(feedback));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Tabs row only needs to scroll (and show a scrollbar) once the manager
  // chips actually overflow the available width. With just 1-2 managers
  // they fit on a single line, so we keep overflow hidden and skip the
  // scrollbar entirely in that case.
  const tabsRef = useRef(null);
  const [tabsOverflowing, setTabsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setTabsOverflowing(el.scrollWidth > el.clientWidth + 1);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [assigners]);

  const getAssignerData = (assignerId) =>
    data[assignerId] || { entries: {} };

  const points = managerFeedback()

  // Generic setters — used for both the per-category cards and the overall
  // rating/remark card, since both just write into entries[key].
  const setRating = (assignerId, key, rating) => {
    setData((prev) => {
      const ad = getAssignerData(assignerId);
      return {
        ...prev,
        [assignerId]: {
          ...ad,
          entries: { ...ad.entries, [key]: { ...ad.entries[key], rating } },
        },
      };
    });
  };

  const setRemark = (assignerId, key, remark) => {
    setData((prev) => {
      const ad = getAssignerData(assignerId);
      return {
        ...prev,
        [assignerId]: {
          ...ad,
          entries: { ...ad.entries, [key]: { ...ad.entries[key], remark } },
        },
      };
    });
  };

  const isManagerComplete = (assignerId) => {
    const ad = getAssignerData(assignerId);
    return points.length > 0 && points.every((p) => ad.entries[p.id]?.rating);
  };

  const allComplete =
    assigners.length > 0 &&
    assigners.every((m) => isManagerComplete(m.assignerId));

  const activeManager =
    assigners.find((m) => m.assignerId === activeAssignerId) || assigners[0];
  const activeData = getAssignerData(activeAssignerId);
  const activeOverall = activeData.entries[OVERALL_KEY] || {};
  const ratedCount = points.filter(
    (p) => activeData.entries[p.id]?.rating,
  ).length;

  const averageRating = useMemo(() => {
    const ratings = points
      .map((p) => activeData.entries[p.id]?.rating)
      .filter(Boolean);
    if (ratings.length === 0) return 0;
    return Number(
      (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
    );
  }, [points, activeData]);

  const handleSubmit = () => {
    if (!allComplete) {
      setError("Please rate every point for each manager before submitting.");
      return;
    }
    setError("");

    const payload = {
      userId: getUserData()?.userDetails?.userId,
      projectId,
      submittedAt: new Date().toISOString(),
      feedback: assigners.map((m) => {
        const ad = getAssignerData(m.assignerId);

        const entries = [
          ...points.map((p) => ({
            categoryId: p.id,
            rating: ad.entries[p.id]?.rating || 0,
            remark: ad.entries[p.id]?.remark || "",
          })),
          {
            categoryId: OVERALL_KEY,
            rating: ad.entries[OVERALL_KEY]?.rating || 0,
            remark: ad.entries[OVERALL_KEY]?.remark || "",
          },
        ];

        return { assignerId: m.assignerId, entries };
      }),
    };

    console.log("Onsubmit :::", payload);
    onSubmit(payload);
    setSubmitted(true);
  };

  const handleClose = () => {
    setData({});
    setError("");
    setSubmitted(false);
    setActiveAssignerId(assigners[0]?.assignerId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      // Mounts the portal inside whichever page-level element owns the
      // --pj-* CSS variables (and dark-mode overrides) for this screen —
      // ProjectActivityInfo (.pai-page) or ProjectsInfo (.proj-page).
      // Falls back to the default body portal if neither is found.
      container={() =>
        document.querySelector(".pai-page") ||
        document.querySelector(".proj-page") ||
        document.body
      }
      PaperProps={{
        className: "af-paper",
        sx: { width: 560, maxWidth: "94vw" },
      }}
    >
      {/* ── HEADER ── */}
      <Box className="af-header">
        <Box className="af-icon-chip">
          <Star size={22} className="af-header-icon" />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            lineHeight={1.2}
            className="af-title"
          >
            Rate your assigners
          </Typography>
          <Typography variant="caption" className="af-subtitle">
            {assigners.length} {assigners.length === 1 ? "manager" : "people"}{" "}
            to review
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          className="af-close-btn"
          sx={{ mt: -3 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {submitted ? (
        <Box className="af-success-state">
          <Box className="af-success-icon-chip">
            <Send size={20} className="af-success-icon" />
          </Box>
          <Typography variant="body1" fontWeight={700} className="af-title">
            Feedback submitted
          </Typography>
          <Typography variant="body2" className="af-subtitle" sx={{ mb: 2 }}>
            Thanks — your input has been recorded for all assigners.
          </Typography>
          <Button
            variant="contained"
            className="af-submit-btn"
            onClick={handleClose}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Done
          </Button>
        </Box>
      ) : (
        <>
          {/* ── MANAGER TABS ── */}
          <Box
            ref={tabsRef}
            className={`af-tabs${tabsOverflowing ? " af-tabs--scrollable" : ""}`}
          >
            {assigners.map((m) => {
              const complete = isManagerComplete(m.assignerId);
              const active = m.assignerId === activeAssignerId;
              return (
                <button
                  key={m.assignerId}
                  type="button"
                  onClick={() => setActiveAssignerId(m.assignerId)}
                  className={`af-tab${active ? " af-tab--active" : ""}`}
                >
                  {complete && <Check size={13} className="af-tab-check" />}
                  <span className="af-tab-name">{m.name}</span>
                  <span className="af-tab-role">· {m.role}</span>
                </button>
              );
            })}
          </Box>

          {/* ── CONTENT ── */}
          <DialogContent className="af-content">
            {points.map((point, idx) => {
              const entry = activeData.entries[point.id] || {};
              return (
                <Box key={point.id} className="af-point-card">
                  <Box className="af-point-row">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        className="af-point-label"
                      >
                        {idx + 1}. {point.label}
                      </Typography>
                      {point.description && (
                        <Typography variant="caption" className="af-point-desc">
                          {point.description}
                        </Typography>
                      )}
                    </Box>
                    <StarRating
                      value={entry.rating || 0}
                      onChange={(rating) =>
                        setRating(activeAssignerId, point.id, rating)
                      }
                    />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    className="af-textfield"
                    placeholder={`Remark about ${point.label.toLowerCase()} (optional)`}
                    value={entry.remark || ""}
                    onChange={(e) =>
                      setRemark(activeAssignerId, point.id, e.target.value)
                    }
                  />
                </Box>
              );
            })}

            {/* ── OVERALL RATING + REMARK ──
                Same entries map, same setRating/setRemark helpers, just
                keyed by OVERALL_KEY instead of a point id. */}
            <Box className="af-point-card">
              <Box className="af-point-row">
                <Typography
                  variant="body2"
                  fontWeight={700}
                  className="af-point-label"
                >
                  Overall remark for {activeManager?.name}
                </Typography>
                <StarRating
                  value={activeOverall.rating || 0}
                  onChange={(rating) =>
                    setRating(activeAssignerId, OVERALL_KEY, rating)
                  }
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                className="af-textfield"
                placeholder="Any final thoughts on this manager's performance"
                value={activeOverall.remark || ""}
                onChange={(e) =>
                  setRemark(activeAssignerId, OVERALL_KEY, e.target.value)
                }
              />
            </Box>
          </DialogContent>

          {/* ── FOOTER ── */}
          <Box className="af-footer">
            <Box className="af-footer-status">
              <Typography variant="caption" className="af-progress-text">
                {ratedCount} of {points.length} points rated for{" "}
                {activeManager?.name}
              </Typography>
              {averageRating > 0 && (
                <Box className="af-avg-badge">
                  <Star size={13} className="af-avg-icon" />
                  {averageRating} average
                </Box>
              )}
            </Box>
            {error && (
              <Typography
                variant="caption"
                className="af-error-text"
                sx={{ display: "block", mb: 1 }}
              >
                {error}
              </Typography>
            )}
            <Box className="af-footer-actions">
              <Button
                variant="outlined"
                onClick={handleClose}
                className="af-cancel-btn"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                className="af-submit-btn"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Submit all feedback
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Dialog>
  );
};

export default AssignerFeedback;
