import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FastForwardIcon from "@mui/icons-material/FastForward";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import dayjs from "dayjs";
import "./assignee-theme.css";
import "./ResumeDialog.css";
import { getPortalContainer } from "./portalContainer";

/* ──────────────────────────────────────────────────────────
   ResumeDialog

   Shown when the user clicks Resume on a paused activity.

   Step 1: a single checkbox — "Request change in planned start & stop" —
   decides whether there will be a time update at all.
   Step 2: only once that is ticked, every open activity is listed with
   its own checkbox. Ticking an activity asks for its planned start &
   stop to be moved later by the time this activity was paused. Nothing
   is typed in — the new dates are calculated:

       new planned start = existing planned start + pause duration
       new planned stop  = existing planned stop  + pause duration

   where pause duration = (moment of resume) − (moment paused).

   Requesting is OPTIONAL: leave step 1 unticked (or tick it but pick no
   activities) and the button just resumes. "Select all" ticks / clears
   every row at once.

   TWO MODES, same dialog
   mode="request" (default) — the assignee's side, described above.
   mode="review"            — the assigner's side. Shows the request the
     assignee made (who, how long the pause was, reason) and the same
     per-activity checkbox list, read-only and pre-ticked, with the
     current vs. requested dates. The assigner can untick any activity,
     then either "Confirm Request" (applies the ticked ones) or
     "Cancel Request" (declines it entirely). Nothing is recalculated —
     the dates are exactly what the assignee asked for.

   Review-mode props
     changeRequest   { requestId, requestedByName, activityName,
                       pauseMs, reason, createdAt,
                       changes: [{ activityId, activityName, currentStart,
                                   currentStop, requestedStart,
                                   requestedStop }] }
     onApprove(approvedChanges, changeRequest)   "Confirm Request"
     onReject(changeRequest)                     "Cancel Request"
     onCancel()                                  X / click-away (no decision)

   Request-mode props
     open, activityName, loading
     activityId          id of the activity being resumed
     activityLookupMap   { [id]: { name, activityStatus, resource,
                           plannedStart, plannedStop, dependsOn } }
     pauseStart          when this activity was paused (Date | ISO string)
     pauseLoading        true while pauseStart is still being fetched
     onConfirm({ reason, requests, pauseMs })
        requests = [] when nothing is ticked, otherwise
        [{ activityId, activityName, currentStart, currentStop,
           requestedStart, requestedStop }]  (ISO strings)
     onCancel()
   ────────────────────────────────────────────────────────── */

const DONE = new Set(["completed", "finished"]);

const isOpenActivity = (entry) =>
  !DONE.has((entry?.activityStatus || "").toLowerCase());

const fmtView = (d) =>
  d && dayjs(d).isValid() ? dayjs(d).format("DD MMM YYYY, HH:mm") : "Not set";

/* 93,720,000 ms -> "1d 2h 2m" (wall-clock elapsed time) */
export function formatDuration(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || !parts.length) parts.push(`${m}m`);
  return parts.join(" ");
}

/* Walk the dependency graph forward from `rootId`.
   Returns [{ id, depth }] — depth 1 = direct next activity, 2+ = further
   downstream. Completed activities are skipped (walk continues through). */
export function getDownstreamActivities(rootId, lookup) {
  if (!rootId || !lookup) return [];
  const dependents = {};
  Object.entries(lookup).forEach(([id, entry]) => {
    (entry?.dependsOn || []).forEach((depId) => {
      (dependents[depId] ||= []).push(id);
    });
  });
  const seen = new Set([rootId]);
  const out = [];
  let frontier = [rootId];
  let depth = 0;
  while (frontier.length) {
    depth += 1;
    const next = [];
    frontier.forEach((id) => {
      (dependents[id] || []).forEach((childId) => {
        if (seen.has(childId)) return;
        seen.add(childId);
        next.push(childId);
        if (isOpenActivity(lookup[childId])) out.push({ id: childId, depth });
      });
    });
    frontier = next;
  }
  return out;
}

const ResumeDialog = ({
  mode = "request",
  changeRequest,
  onApprove,
  onReject,
  open,
  activityId,
  activityName,
  activityLookupMap,
  pauseStart,
  pauseLoading = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const isReview = mode === "review";
  const [requestChange, setRequestChange] = useState(false); // step 1
  const [selected, setSelected] = useState(() => new Set()); // step 2
  // "Now" as of opening — drives the on-screen preview only; the request is
  // recalculated with the real time on confirm.
  const [openedAt, setOpenedAt] = useState(() => Date.now());

  useEffect(() => {
    if (open) {
      setOpenedAt(Date.now());
      if (isReview) {
        setSelected(
          new Set((changeRequest?.changes || []).map((c) => c.activityId)),
        );
      }
    } else {
      setRequestChange(false);
      setSelected(new Set());
    }
  }, [open, isReview, changeRequest]);

  // Open activities with planned dates (not the one being resumed).
  // Dependents first (Next / Later), then the rest by planned start.
  const rows = useMemo(() => {
    // Review mode: the rows are exactly the activities the assignee asked
    // to move, with their requested dates carried along.
    if (isReview) {
      return (changeRequest?.changes || []).map((c) => ({
        id: c.activityId,
        depth: 0,
        name: c.activityName,
        resource: activityLookupMap?.[c.activityId]?.resource,
        plannedStart: c.currentStart,
        plannedStop: c.currentStop,
        newStart: c.requestedStart,
        newStop: c.requestedStop,
      }));
    }
    const ok = (id, e) =>
      id !== activityId &&
      e?.name &&
      e?.activityStatus &&
      isOpenActivity(e) &&
      dayjs(e.plannedStart).isValid() &&
      dayjs(e.plannedStop).isValid();

    const downstream = getDownstreamActivities(activityId, activityLookupMap)
      .filter(({ id }) => ok(id, activityLookupMap[id]))
      .map(({ id, depth }) => ({ id, depth, ...activityLookupMap[id] }));
    const taken = new Set(downstream.map((r) => r.id));
    const others = Object.entries(activityLookupMap || {})
      .filter(([id, e]) => !taken.has(id) && ok(id, e))
      .sort(
        ([, a], [, b]) =>
          dayjs(a.plannedStart).valueOf() - dayjs(b.plannedStart).valueOf(),
      )
      .map(([id, e]) => ({ id, depth: 0, ...e }));
    return [...downstream, ...others];
  }, [isReview, changeRequest, activityId, activityLookupMap]);

  const pauseValid = Boolean(pauseStart) && dayjs(pauseStart).isValid();
  const previewMs = pauseValid
    ? Math.max(0, openedAt - dayjs(pauseStart).valueOf())
    : 0;
  const canRequest = isReview
    ? rows.length > 0
    : pauseValid && !pauseLoading && rows.length > 0;

  const toggleMaster = () => {
    if (loading || !canRequest) return;
    setRequestChange((v) => !v);
  };

  const listActive = isReview ? rows.length > 0 : requestChange && canRequest;

  const toggleRow = (id) => {
    if (loading || !listActive) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => {
    if (loading || !listActive) return;
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const n = listActive ? selected.size : 0;

  const handleConfirm = () => {
    if (loading) return;
    if (n === 0) {
      onConfirm({ reason: "", requests: [], pauseMs: 0 });
      return;
    }
    const pauseMs = Math.max(0, Date.now() - dayjs(pauseStart).valueOf());
    const requests = rows
      .filter((r) => selected.has(r.id))
      .map((r) => ({
        activityId: r.id,
        activityName: r.name,
        currentStart: r.plannedStart,
        currentStop: r.plannedStop,
        requestedStart: dayjs(r.plannedStart).add(pauseMs, "ms").toISOString(),
        requestedStop: dayjs(r.plannedStop).add(pauseMs, "ms").toISOString(),
      }));
    onConfirm({
      reason: `"${activityName || "Activity"}" was paused for ${formatDuration(
        pauseMs,
      )}; planned dates shifted by the same duration.`,
      requests,
      pauseMs,
    });
  };

  const handleCancel = () => {
    if (loading) return;
    onCancel();
  };

  // Review mode: confirm the ticked activities / decline the whole request.
  const handleApprove = () => {
    if (loading || selected.size === 0) return;
    const approved = (changeRequest?.changes || []).filter((c) =>
      selected.has(c.activityId),
    );
    onApprove?.(approved, changeRequest);
  };
  const handleReject = () => {
    if (loading) return;
    onReject?.(changeRequest);
  };

  let hint;
  if (pauseLoading) {
    hint = "Calculating pause duration…";
  } else if (!pauseValid) {
    hint =
      "Couldn't find when this activity was paused, so new dates can't be calculated.";
  } else if (rows.length === 0) {
    hint = "There are no other open activities to reschedule.";
  } else {
    hint = `Paused for ${formatDuration(
      previewMs,
    )}. New dates are calculated by moving each planned start & stop later by that amount. Optional.`;
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleCancel}
      container={getPortalContainer}
      scroll="paper"
      PaperProps={{
        className: "pj-scope rsd-paper",
        sx: { width: 560, maxWidth: "94vw" },
      }}
    >
      {/* ── HEADER ── */}
      <Box className="rsd-header">
        <Box className="rsd-icon-chip">
          <FastForwardIcon sx={{ fontSize: 24 }} className="rsd-icon" />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            lineHeight={1.2}
            className="rsd-title"
          >
            {isReview ? "Review Date Change Request" : "Resume Activity"}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            className="rsd-subtitle"
            sx={{ display: "block" }}
          >
            {(isReview ? changeRequest?.activityName : activityName) ||
              "Untitled activity"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleCancel}
          className="rsd-close-btn"
          disabled={loading}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent className="rsd-content">
        {/* Review mode: who asked, why, and for how long it was paused. */}
        {isReview && (
          <Box className="rsd-summary">
            <Typography variant="body2" className="rsd-summary-line">
              <strong>{changeRequest?.requestedByName || "The assignee"}</strong>{" "}
              resumed this activity after a pause of{" "}
              <strong>{formatDuration(changeRequest?.pauseMs || 0)}</strong> and
              requested these planned dates.
            </Typography>
            {changeRequest?.reason && (
              <Typography variant="caption" className="rsd-summary-reason">
                {changeRequest.reason}
              </Typography>
            )}
          </Box>
        )}

        {/* Step 1 — will there be a time update at all? */}
        {!isReview && (
        <Box
          className={`rsd-optin ${listActive ? "rsd-optin--on" : ""} ${
            !canRequest ? "rsd-optin--disabled" : ""
          }`}
          onClick={toggleMaster}
          role="button"
        >
          {pauseLoading ? (
            <Box className="rsd-optin-spinner">
              <CircularProgress size={18} />
            </Box>
          ) : (
            <Checkbox
              checked={listActive}
              disabled={loading || !canRequest}
              className="rsd-checkbox"
              onClick={(ev) => ev.stopPropagation()}
              onChange={(ev) => setRequestChange(ev.target.checked)}
              inputProps={{
                "aria-label": "Request change in planned start and stop",
              }}
            />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              className="rsd-section-label"
            >
              Request change in planned start &amp; stop
            </Typography>
            <Typography variant="caption" className="rsd-section-hint">
              {hint}
            </Typography>
          </Box>
        </Box>
        )}

        {/* Step 2 — only after step 1 is ticked: choose the activities. */}
        {listActive && (
          <>
            <Typography
              variant="body2"
              fontWeight={700}
              className="rsd-section-label"
              sx={{ mb: 0.25 }}
            >
              {isReview ? "Activities to update" : "Choose activities"}
            </Typography>
            <Typography variant="caption" className="rsd-section-hint">
              {isReview
                ? "Untick any activity you don't want to move. Confirm applies the ticked ones."
                : "Tick each activity whose dates should move. Leave all unticked to just resume."}
            </Typography>
            {/* Select all */}
            <Box
              className={`rsd-selectall ${!canRequest ? "rsd-row--disabled" : ""}`}
              onClick={toggleAll}
              role="button"
            >
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                disabled={loading || !canRequest}
                className="rsd-checkbox"
                onClick={(ev) => ev.stopPropagation()}
                onChange={toggleAll}
                inputProps={{ "aria-label": "Select all activities" }}
              />
              <Typography variant="body2" fontWeight={600} className="rsd-row-name">
                Select all
              </Typography>
              <span className="rsd-count">
                {selected.size} of {rows.length} selected
              </span>
            </Box>

            <Box className="rsd-list">
              {rows.map((r) => {
                const checked = selected.has(r.id);
                const newStart = r.newStart
                  ? dayjs(r.newStart)
                  : pauseValid
                    ? dayjs(r.plannedStart).add(previewMs, "ms")
                    : null;
                const newStop = r.newStop
                  ? dayjs(r.newStop)
                  : pauseValid
                    ? dayjs(r.plannedStop).add(previewMs, "ms")
                    : null;
                return (
                  <Box
                    key={r.id}
                    className={`rsd-row ${checked ? "rsd-row--checked" : ""} ${
                      !canRequest ? "rsd-row--disabled" : ""
                    }`}
                    onClick={() => toggleRow(r.id)}
                    role="button"
                  >
                    <Box className="rsd-row-head">
                      <Checkbox
                        size="small"
                        checked={checked}
                        disabled={loading || !canRequest}
                        className="rsd-checkbox"
                        onClick={(ev) => ev.stopPropagation()}
                        onChange={() => toggleRow(r.id)}
                        inputProps={{ "aria-label": `Select ${r.name}` }}
                      />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box className="rsd-row-title">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                            className="rsd-row-name"
                          >
                            {r.name}
                          </Typography>
                          {r.depth > 0 && (
                            <span
                              className={`rsd-tag ${
                                r.depth === 1 ? "rsd-tag--next" : ""
                              }`}
                            >
                              {r.depth === 1 ? "Next" : "Later"}
                            </span>
                          )}
                        </Box>
                        <Box className="rsd-row-meta">
                          {r.resource && (
                            <span className="rsd-meta-item">
                              <PersonOutlineOutlinedIcon sx={{ fontSize: 13 }} />
                              {r.resource}
                            </span>
                          )}
                          <span className="rsd-meta-item">
                            Planned: {fmtView(r.plannedStart)} →{" "}
                            {fmtView(r.plannedStop)}
                          </span>
                        </Box>
                        {(checked || isReview) && newStart && (
                          <Box
                            className={`rsd-new ${
                              isReview && !checked ? "rsd-new--off" : ""
                            }`}
                          >
                            {isReview ? "Requested" : "New"}:{" "}
                            {fmtView(newStart)} → {fmtView(newStop)}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>

      {/* ── FOOTER ── */}
      {isReview ? (
        <Box className="rsd-footer">
          <Button
            variant="outlined"
            onClick={handleReject}
            className="rsd-reject-btn"
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Cancel Request
          </Button>
          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckRoundedIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={handleApprove}
            disabled={loading || selected.size === 0}
            className="rsd-confirm-btn"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {selected.size > 0
              ? `Confirm Request (${selected.size})`
              : "Confirm Request"}
          </Button>
        </Box>
      ) : (
        <Box className="rsd-footer">
          <Button
            variant="outlined"
            onClick={handleCancel}
            className="rsd-cancel-btn"
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FastForwardIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={handleConfirm}
            disabled={loading}
            className="rsd-confirm-btn"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {n > 0
              ? `Resume & Request ${n} Change${n === 1 ? "" : "s"}`
              : "Resume Activity"}
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

export default ResumeDialog;
