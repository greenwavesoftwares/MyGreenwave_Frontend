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
import { Star, Send, Check } from "lucide-react";
import "./AssignerFeedback.css";
import { getUserData } from "../Login/Encrypt";
import { managerFeedback } from "./AssigneeHelper";

/**
 * StarRating
 * Small reusable 1-5 star control. Color comes entirely from the
 * `af-star-icon` classes (which read the --pj-warning token), so it
 * stays in sync with light/dark mode automatically.
 */
const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <Box className="af-stars">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <IconButton
            key={star}
            size="small"
            className="af-star-btn"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              size={20}
              strokeWidth={1.5}
              className={
                filled ? "af-star-icon af-star-icon--filled" : "af-star-icon"
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
 * of co-assigners) across a dynamic set of criteria ("points"), plus one
 * overall rating + remark per manager. The overall rating/remark is
 * stored as just another entry (keyed by OVERALL_KEY) inside the same
 * `entries` map as the per-point ratings — it is rendered separately at
 * the bottom of the form, but uses the same read/write helpers.
 *
 * A tab strip lets the user move between assigners, with a checkmark
 * once a manager's per-point ratings are complete.
 *
 * Colors and dark mode come entirely from the shared --pj-* tokens
 * defined in ProjectActivityInfo.css — this file defines no colors
 * of its own, same pattern as PauseReasonDialog.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - assigners: [{ id, name, role }]
 *      role is free text, e.g. "Assigner" | "Co-assigner" — pass as
 *      many co-assigners as needed, the tab strip scrolls.
 *  - feedbackData: { [managerId]: { entries: { [pointId]: {rating, remark}, overall?: {rating, remark} } } }
 *      pre-fills the form, e.g. from previously submitted feedback.
 *  - onSubmit: (payload) => void   payload = [{
 *      managerId, managerName, role,
 *      ratings: [{ pointId, label, rating, remark }],
 *      finalRemark, finalRating, averageRating
 *    }, ...]
 */
const AssignerFeedback = ({
  open = true,
  onClose = () => {},
  assigners = [
    { id: "mgr_1", name: "Riya Sharma", role: "Assigner" },
    { id: "mgr_2", name: "Devansh Kapoor", role: "Co-assigner" },
    { id: "mgr_3", name: "Ayesha Khan", role: "Co-assigner" },
  ],
  entries,
  feedbackData,
  onSubmit = () => {},
}) => {
  const [activeManagerId, setActiveManagerId] = useState(assigners[0]?.id);
  // data keyed by managerId -> { entries: { [pointId]: {rating, remark} } }
  // The overall rating/remark lives at entries[OVERALL_KEY], same shape
  // as any other point entry.
  const [data, setData] = useState(feedbackData || {});
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

  const getManagerData = (managerId) => data[managerId] || { entries: {} };

  const points = managerFeedback()

  // Generic setters — used for both the per-point cards and the overall
  // rating/remark card, since both just write into entries[key].
  const setRating = (managerId, key, rating) => {
    setData((prev) => {
      const md = getManagerData(managerId);
      return {
        ...prev,
        [managerId]: {
          ...md,
          entries: { ...md.entries, [key]: { ...md.entries[key], rating } },
        },
      };
    });
  };

  const setRemark = (managerId, key, remark) => {
    setData((prev) => {
      const md = getManagerData(managerId);
      return {
        ...prev,
        [managerId]: {
          ...md,
          entries: { ...md.entries, [key]: { ...md.entries[key], remark } },
        },
      };
    });
  };

  const isManagerComplete = (managerId) => {
    const md = getManagerData(managerId);
    return points.length > 0 && points.every((p) => md.entries[p.id]?.rating);
  };

  const allComplete =
    assigners.length > 0 && assigners.every((m) => isManagerComplete(m.id));

  const activeManager =
    assigners.find((m) => m.id === activeManagerId) || assigners[0];
  const activeData = getManagerData(activeManagerId);
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

      data: assigners.reduce((acc, m) => {
        const md = getManagerData(m.id);

        const ratings = points
          .map((p) => md.entries[p.id]?.rating)
          .filter((rating) => rating !== undefined && rating !== null);

        const avg = ratings.length
          ? Number(
              (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
            )
          : 0;

        const overall = md.entries[OVERALL_KEY] || {};

        acc[m.id] = {
          entries: Object.fromEntries(
            points.map((p) => [
              p.id,
              {
                rating: md.entries[p.id]?.rating || 0,
                remark: md.entries[p.id]?.remark || "",
              },
            ]),
          ),

          finalRemark: overall.remark || "",
          finalRating: overall.rating || 0,
          averageRating: avg,
        };

        return acc;
      }, {}),
    };
    console.log("Onsubmit :::", payload);
    onSubmit(payload);
    setSubmitted(true);
  };

  const handleClose = () => {
    setData({});
    setError("");
    setSubmitted(false);
    setActiveManagerId(assigners[0]?.id);
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
              const complete = isManagerComplete(m.id);
              const active = m.id === activeManagerId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveManagerId(m.id)}
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
                        setRating(activeManagerId, point.id, rating)
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
                      setRemark(activeManagerId, point.id, e.target.value)
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
                    setRating(activeManagerId, OVERALL_KEY, rating)
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
                  setRemark(activeManagerId, OVERALL_KEY, e.target.value)
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
