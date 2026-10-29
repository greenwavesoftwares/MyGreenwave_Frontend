import React, { useState, useMemo, useRef } from "react";
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
import "./assignee-theme.css"; // REFACTOR: shared --pj-* tokens + reset
import "./AssignerFeedback.css";
import { getPortalContainer } from "./portalContainer";
import { getUserData } from "../Login/Encrypt";
import { managerFeedback } from "./AssigneeHelper";
import { showToast } from "./toastService";

/**
 * StarRating
 * Small reusable 1-5 star control with half-star precision (0.5 steps).
 * Clicking/hovering the left half of a star selects the .5 value, the
 * right half selects the whole number. Color comes entirely from the
 * `af-star-icon` classes (which read the --pj-warning token), so it
 * stays in sync with light/dark mode automatically.
 *
 * Uses Pointer Events rather than mouse events so it behaves correctly
 * on touch devices: onClick can be silently cancelled by the browser if
 * it detects finger movement between touchstart/touchend, which left
 * touch users with a rating that looked filled in (from a stray
 * mousemove-driven hover state) but was never actually committed to
 * state. onPointerUp fires reliably for mouse, touch, and pen, and the
 * hover preview is now gated to real mouse input only.
 *
 * `readOnly` disables all interaction — used once feedback has already
 * been submitted for this project, so a previously-submitted rating
 * can be viewed but not changed.
 */
const StarRating = ({ value, onChange, readOnly = false }) => {
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
    <Box className={`af-stars${readOnly ? " af-stars--readonly" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const full = star <= display;
        const half = !full && star - 0.5 <= display;
        const Icon = half ? StarHalf : Star;

        return (
          <IconButton
            key={star}
            size="small"
            className="af-star-btn"
            disabled={readOnly}
            onPointerUp={
              readOnly
                ? undefined
                : (e) => onChange(valueFromPointer(e, star))
            }
            onPointerMove={
              readOnly
                ? undefined
                : (e) => {
                    // Hover preview only makes sense for an actual mouse —
                    // touch/pen shouldn't leave a "phantom" preview behind.
                    if (e.pointerType === "mouse") {
                      setHovered(valueFromPointer(e, star));
                    }
                  }
            }
            onPointerLeave={readOnly ? undefined : () => setHovered(0)}
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
 * If `feedback` is already populated (i.e. the GET response for this
 * project came back with entries), the whole dialog renders read-only:
 * stars and remarks can be viewed but not edited, and the submit button
 * is replaced with a simple Close button. This assumes one feedback
 * array covers the whole project (all assigners rated together) — if
 * your API can return partial feedback per-assigner instead, switch
 * `isReadOnly` to a per-manager check against `toInternalData(feedback)`.
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
 *  - assigners: [{ id, name, role }]
 *      role is free text, e.g. "assigner" | "co-assigner" — pass as
 *      many co-assigners as needed, the tab strip scrolls.
 *  - feedback: [{ assignerId, entries: [{ categoryId, rating, remark }] }]
 *      pre-fills the form from the GET response's `feedback` array
 *      (e.g. previously submitted feedback for this project). A
 *      non-empty array also locks the form into read-only mode.
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
    { id: "riya.sharma@greenwave.co.in", name: "Riya Sharma", role: "assigner" },
    { id: "devansh.kapoor@greenwave.co.in", name: "Devansh Kapoor", role: "co-assigner" },
    { id: "ayesha.khan@greenwave.co.in", name: "Ayesha Khan", role: "co-assigner" },
  ],
  feedback,
  onSubmit = () => {},
}) => {  // Converts the GET-response `feedback` array (list of
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

  // Already-submitted feedback locks the whole form: no editing stars
  // or remarks, no re-submitting. Derived straight from the prop rather
  // than local state, so it can't drift from what the server told us.
  const isReadOnly = Array.isArray(feedback) && feedback.length > 0;

  const [activeAssignerId, setActiveAssignerId] = useState(assigners[0]?.id);
  // data keyed by assignerId -> { entries: { [categoryId]: {rating, remark} } }
  // The overall rating/remark lives at entries[OVERALL_KEY], same shape
  // as any other category entry.
  const [data, setData] = useState(() => toInternalData(feedback));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // True while the PUT request from handleSubmit is in flight — drives
  // the spinner on the submit button and blocks a second submit/close
  // from firing mid-request.
  const [submitting, setSubmitting] = useState(false);

  // Tabs row scrolls horizontally once there's more than one assigner —
  // gated purely on count rather than a measured-overflow check, since
  // the measurement approach (ResizeObserver + scrollWidth) was proving
  // unreliable: it could report "no overflow" on first paint (e.g. before
  // web fonts finished loading), leaving the row silently clipped with no
  // way to reach the remaining tabs. Enabling overflow-x unconditionally
  // for 2+ assigners guarantees the extra tabs are always reachable, even
  // if a couple of assigners technically fit without needing to scroll.
  const tabsRef = useRef(null);
  const tabsScrollable = assigners.length > 1;

  // Trackpads pan horizontally on their own, but a plain mouse wheel only
  // sends vertical delta — without this the tabs row would be scrollable
  // in principle but undiscoverable for most desktop mouse users. Redirect
  // vertical wheel movement into horizontal scroll on this row only.
  const handleTabsWheel = (e) => {
    if (!tabsScrollable) return;
    if (e.deltaY === 0) return;
    e.currentTarget.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  const getAssignerData = (assignerId) => data[assignerId] || { entries: {} };

  const points = managerFeedback();

  // Generic setters — used for both the per-category cards and the overall
  // rating/remark card, since both just write into entries[key]. Both read
  // the previous manager entry from `prev` (not the outer `data` closure),
  // so two updates that land in the same React batch (e.g. two quick taps
  // across different categories) merge correctly instead of the second
  // update clobbering the first.
  const setRating = (assignerId, key, rating) => {
    setData((prev) => {
      const ad = prev[assignerId] || { entries: {} };
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
      const ad = prev[assignerId] || { entries: {} };
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
    assigners.length > 0 && assigners.every((m) => isManagerComplete(m.id));

  const activeManager =
    assigners.find((m) => m.id === activeAssignerId) || assigners[0];
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

  const handleSubmit = async () => {
    if (isReadOnly || submitting) return;

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
        const ad = getAssignerData(m.id);

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
        return { assignerId: m.id, entries };
      }),
    };

    setSubmitting(true);
    try {
      // `onSubmit` may or may not be async depending on the caller —
      // awaiting a non-promise value just resolves immediately, so this
      // works either way. If the caller's handler throws (or its promise
      // rejects), the catch below treats it as a failed submission.
      await onSubmit(payload);
      setSubmitted(true);
      showToast("success", "Success", "Feedback submitted successfully");
    } catch (err) {
      console.error("Failed to submit assigner feedback:", err);
      setError("Failed to submit feedback. Please try again.");
      showToast("error", "Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Ignore close attempts (backdrop click, Escape, the X button, or
    // Cancel) while a submit is in flight so we don't tear down the
    // dialog mid-request.
    if (submitting) return;
    setData({});
    setError("");
    setSubmitted(false);
    setActiveAssignerId(assigners[0]?.id);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      // REFACTOR: no longer needs `.pai-page` / `.proj-page`. `pj-scope`
      // supplies the tokens, so it renders the same from any screen.
      container={getPortalContainer}
      PaperProps={{
        className: "pj-scope af-paper",
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
          disabled={submitting}
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
            onWheel={handleTabsWheel}
            className={`af-tabs${tabsScrollable ? " af-tabs--scrollable" : ""}`}
          >
            {assigners.map((m) => {
              const complete = isManagerComplete(m.id);
              const active = m.id === activeAssignerId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveAssignerId(m.id)}
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
                      readOnly={isReadOnly}
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
                    disabled={isReadOnly}
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
                  readOnly={isReadOnly}
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
                disabled={isReadOnly}
              />
            </Box>
          </DialogContent>

          {/* ── FOOTER ── */}
          <Box className="af-footer">
            <Box className="af-footer-status">
              <Typography variant="caption" className="af-progress-text">
                {isReadOnly
                  ? `Feedback already submitted for ${activeManager?.name}`
                  : `${ratedCount} of ${points.length} points rated for ${activeManager?.name}`}
              </Typography>
              {averageRating > 0 && (
                <Box className="af-avg-badge">
                  <Star size={13} className="af-avg-icon" />
                  {averageRating} average
                </Box>
              )}
            </Box>
            {error && !isReadOnly && (
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
                disabled={submitting}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  className="af-submit-btn"
                  disabled={submitting}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  {submitting ? (
                    <>
                      <span className="af-btn-spinner" />
                      Submitting…
                    </>
                  ) : (
                    "Submit all feedback"
                  )}
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
    </Dialog>
  );
};

export default AssignerFeedback;
