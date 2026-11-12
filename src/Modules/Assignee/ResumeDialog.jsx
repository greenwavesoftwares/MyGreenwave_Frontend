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
import DateTimePickerPanel, { PICKER_FMT } from "./DateTimePickerPanel";
import {
  DEFAULT_WORK_CFG,
  calculateWorkingHours,
  addWorkingHours,
  snapToWorkingTime,
  formatWorkingHours,
} from "./workingTime";

/* ──────────────────────────────────────────────────────────
   ResumeDialog

   Shown when the user clicks Resume on a paused activity.

   Step 1: a single checkbox — "Request change in planned start & stop" —
   decides whether there will be a time update at all.
   Step 2: only once that is ticked, every open activity is listed with
   its own checkbox. Ticking an activity asks for its planned start &
   stop to be moved later by the time this activity was paused. Nothing
   is typed in — the new dates are calculated:

       new planned start = existing planned start + pause WORKING duration
       new planned stop  = existing planned stop  + pause WORKING duration

   where pause working duration = working hours between (moment paused) and
   (moment of resume) — weekends, leave / holidays and non-working hours are
   NOT counted (same rule as the actual-duration calculation). The shift is
   then applied the same way: it is added as working time, so the new
   dates skip weekends, leave and non-working hours too.

   The assignee only ticks the activities to move. The calculated dates and
   the pause duration are NOT shown to the assignee and cannot be edited —
   they are calculated and sent to the API; only the assigner sees them (in
   review mode).

   Requesting is OPTIONAL: leave step 1 unticked (or tick it but pick no
   activities) and the button just resumes. "Select all" ticks / clears
   every row at once.

   TWO MODES, same dialog
   mode="request" (default) — the assignee's side, described above.
   mode="review"            — the assigner's side. Shows the request the
     assignee made (who, how long the pause was, reason) and lists ALL open
     activities. Only the activities the assignee requested are pre-ticked
     (with their requested dates); the assigner can untick them, tick any
     other activity, and for every ticked activity pick the new start date
     & time (the stop keeps the planned working duration). Then either
     "Confirm Request" (applies the ticked ones, with the final dates) or
     "Cancel Request" (declines it entirely).

   Review-mode props
     activityLookupMap  all activities (to list the non-requested ones)
     leavesByResource   { [resource]: leaveDates[] } (optional)
     workCfg            { workStart, workEnd, weekEnd } (optional)
     changeRequest   { requestId, requestedByName, activityName,
                       sourceActivityId (optional — the resumed activity,
                       left out of the list),
                       pauseMs, reason, createdAt,
                       changes: [{ activityId, activityName, currentStart,
                                   currentStop, requestedStart,
                                   requestedStop }] }
     onApprove(approvedChanges, changeRequest, remark)   "Confirm Request"
        approvedChanges = [{ activityId, activityName, currentStart,
          currentStop, requestedStart, requestedStop, addedByAssigner }]
        — requestedStart / requestedStop are the FINAL dates (as requested,
        or as picked by the assigner); addedByAssigner is true for
        activities the assignee did not request.
     onReject(changeRequest, remark)             "Cancel Request"
        remark = the assigner's free-text note (trimmed string); REQUIRED to cancel
     onCancel()                                  X / click-away (no decision)

   Request-mode props
     open, activityName, loading
     activityId          id of the activity being resumed
     activityLookupMap   { [id]: { name, activityStatus, resource,
                           plannedStart, plannedStop, dependsOn } }
     pauseStart          when this activity was paused (Date | ISO string)
     pauseLoading        true while pauseStart is still being fetched
     leaves              leave / holiday dates of the user who paused
     leavesByResource    { [resource]: leaveDates[] } — leaves of each
                         activity's owner, used when moving that activity
                         (falls back to `leaves`)
     workCfg             { workStart, workEnd, weekEnd } (optional)
     onConfirm({ reason, requests, pauseMs, pauseWorkingHrs })
        reason = the text the assignee typed (required when dates are requested)
        requests = [] when nothing is ticked, otherwise
        [{ activityId, activityName, currentStart, currentStop,
           requestedStart, requestedStop }]  (ISO strings)
     onCancel()
   ────────────────────────────────────────────────────────── */

const INPUT_FMT = PICKER_FMT; // "YYYY-MM-DDTHH:mm"

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

const NOTE_MAX = 500;

/* Labelled free-text field (Reason / Remark). Native <textarea> so the look
   is fully controlled by `.rsd-note-*` in ResumeDialog.css. */
const NoteField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  tagText,
  error = false,
  errorText,
  disabled = false,
}) => (
  <Box className={`rsd-note ${error ? "rsd-note--error" : ""}`}>
    <Box className="rsd-note-head">
      <label htmlFor={id} className="rsd-note-label">
        {label}
      </label>
      <span
        className={`rsd-note-tag ${required ? "rsd-note-tag--required" : ""}`}
      >
        {tagText ?? (required ? "Required" : "Optional")}
      </span>
    </Box>
    <textarea
      id={id}
      className="rsd-note-input"
      rows={3}
      maxLength={NOTE_MAX}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={error}
      aria-required={required}
      onChange={(e) => onChange(e.target.value)}
    />
    <Box className="rsd-note-foot">
      <span className="rsd-note-error">{error ? errorText : ""}</span>
      <span className="rsd-note-count">
        {value.length}/{NOTE_MAX}
      </span>
    </Box>
  </Box>
);

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
  leaves = [],
  leavesByResource = {},
  workCfg = DEFAULT_WORK_CFG,
  onConfirm,
  onCancel,
  loading = false,
  // Request mode: the user already has a PENDING date-change request for
  // this project, so a new one can't be sent until it is reviewed.
  hasPendingRequest = false,
}) => {
  const isReview = mode === "review";
  // The pause-duration / date calculation is shown to the assigner (review
  // mode) only. The assignee (request mode) still gets it calculated and
  // sent to the API (see handleConfirm) — it just isn't displayed.
  const showCalc = isReview;
  const [requestChange, setRequestChange] = useState(false); // step 1
  const [selected, setSelected] = useState(() => new Set()); // step 2
  // "Now" as of opening — drives the on-screen preview only; the request is
  // recalculated with the real time on confirm.
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  // Assigner only — per-activity chosen start:
  //   { [id]: { on: boolean, value: "YYYY-MM-DDTHH:mm" } }
  const [manual, setManual] = useState({});
  // Free-text inputs: assignee's reason (request mode), assigner's remark (review mode).
  const [reasonText, setReasonText] = useState("");
  const [remark, setRemark] = useState("");
  // Review mode: set once the assigner tries to cancel without a remark.
  const [rejectTried, setRejectTried] = useState(false);

  useEffect(() => {
    if (open) {
      setOpenedAt(Date.now());
      setManual({});
      setReasonText("");
      setRemark("");
      setRejectTried(false);
      if (isReview) {
        setSelected(
          new Set((changeRequest?.changes || []).map((c) => c.activityId)),
        );
      }
    } else {
      setRequestChange(false);
      setSelected(new Set());
      setManual({});
      setReasonText("");
      setRemark("");
      setRejectTried(false);
    }
  }, [open, isReview, changeRequest]);

  // Open activities with planned dates (not the one being resumed).
  // Only activities in the dependency chain (Next / Later) are listed, plus
  // any the assignee explicitly requested (review mode).
  const rows = useMemo(() => {
    const srcId = isReview ? changeRequest?.sourceActivityId : activityId;
    const changes = isReview ? changeRequest?.changes || [] : [];
    const requestedIds = new Set(changes.map((c) => c.activityId));
    const ok = (id, e) =>
      id !== srcId &&
      !requestedIds.has(id) &&
      e?.name &&
      e?.activityStatus &&
      isOpenActivity(e) &&
      dayjs(e.plannedStart).isValid() &&
      dayjs(e.plannedStop).isValid();

    const downstream = getDownstreamActivities(srcId, activityLookupMap)
      .filter(({ id }) => ok(id, activityLookupMap[id]))
      .map(({ id, depth }) => ({ id, depth, ...activityLookupMap[id] }));
    // Review mode: the requested activities come first (pre-ticked, with the
    // dates the assignee asked for), then the downstream dependency chain.
    const requested = changes.map((c) => ({
      ...(activityLookupMap?.[c.activityId] || {}),
      id: c.activityId,
      depth: 0,
      isRequested: true,
      name: c.activityName || activityLookupMap?.[c.activityId]?.name,
      plannedStart: c.currentStart,
      plannedStop: c.currentStop,
      newStart: c.requestedStart,
      newStop: c.requestedStop,
    }));
    return [...requested, ...downstream];
  }, [isReview, changeRequest, activityId, activityLookupMap]);

  const pauseValid = Boolean(pauseStart) && dayjs(pauseStart).isValid();
  // Working hours the activity was paused for (weekends / leave / off-hours
  // excluded). Used for the calculation only — never displayed to the assignee.
  const previewWorkingHrs = pauseValid
    ? calculateWorkingHours(pauseStart, openedAt, leaves, workCfg)
    : 0;

  // Move a planned date later by `hrs` working hours, using the leave
  // calendar of the activity's owner (falls back to the pausing user's).
  const shiftDate = (date, hrs, resource) =>
    addWorkingHours(
      date,
      hrs,
      leavesByResource?.[resource] ?? leaves,
      workCfg,
    );
  const canRequest = isReview
    ? rows.length > 0
    : pauseValid && !pauseLoading && rows.length > 0 && !hasPendingRequest;

  const leavesFor = (r) => leavesByResource?.[r.resource] ?? leaves;

  // Dates for a row at moment `nowMs`.
  //   request mode: planned + pause working time (never shown to the assignee)
  //   review mode : as requested, or — when the assigner picks a start (always
  //                 for rows the assignee did not request) — the picked start
  //                 with the stop keeping the planned working duration.
  const resolveDates = (r, nowMs) => {
    if (!isReview) {
      return {
        start: shiftDate(r.plannedStart, previewWorkingHrs, r.resource),
        stop: shiftDate(r.plannedStop, previewWorkingHrs, r.resource),
        invalid: false,
        adjusted: false,
      };
    }
    const m = manual[r.id];
    if (r.isRequested && !m?.on) {
      return {
        start: dayjs(r.newStart),
        stop: dayjs(r.newStop),
        invalid: false,
        adjusted: false,
      };
    }
    const picked = m?.value ? dayjs(m.value) : null;
    if (!picked || !picked.isValid()) {
      return { start: null, stop: null, invalid: true, adjusted: false };
    }
    const rowLeaves = leavesFor(r);
    const start = snapToWorkingTime(picked, rowLeaves, workCfg);
    const workHrs = calculateWorkingHours(
      r.plannedStart,
      r.plannedStop,
      rowLeaves,
      workCfg,
    );
    const stop =
      workHrs > 0
        ? addWorkingHours(start, workHrs, rowLeaves, workCfg)
        : start.add(dayjs(r.plannedStop).diff(dayjs(r.plannedStart)), "ms");
    const isRequestedStart =
      r.isRequested && picked.isSame(dayjs(r.newStart), "minute");
    return {
      start,
      stop,
      // picked time is before now (minute precision) → not allowed
      invalid:
        !isRequestedStart && picked.isBefore(dayjs(nowMs).startOf("minute")),
      adjusted: !start.isSame(picked, "minute"),
    };
  };

  // Where the picker starts for a row: the requested start if there is one,
  // otherwise the later of its planned start and now, on a working moment.
  const defaultStartFor = (r) => {
    const base = r.newStart
      ? dayjs(r.newStart)
      : dayjs(
          Math.max(dayjs(r.plannedStart).valueOf(), dayjs(openedAt).valueOf()),
        );
    return snapToWorkingTime(base, leavesFor(r), workCfg).format(INPUT_FMT);
  };

  const setManualMode = (r, on) =>
    setManual((prev) => {
      const cur = prev[r.id] || {};
      return { ...prev, [r.id]: { on, value: cur.value || defaultStartFor(r) } };
    });

  const setManualValue = (r, value) =>
    setManual((prev) => ({ ...prev, [r.id]: { on: true, value } }));

  // Rows the assignee did not request have no dates yet — as soon as the
  // assigner ticks one, it opens in "choose date & time".
  const initManualFor = (list) =>
    setManual((prev) => {
      const next = { ...prev };
      list.forEach((r) => {
        if (!r.isRequested && !next[r.id]?.on) {
          next[r.id] = { on: true, value: next[r.id]?.value || defaultStartFor(r) };
        }
      });
      return next;
    });

  // A ticked row with no / past picked date blocks the approval.
  const hasInvalidManual =
    isReview &&
    rows.some((r) => selected.has(r.id) && resolveDates(r, openedAt).invalid);

  const toggleMaster = () => {
    if (loading || !canRequest) return;
    setRequestChange((v) => !v);
  };

  const listActive = isReview ? rows.length > 0 : requestChange && canRequest;

  const toggleRow = (id) => {
    if (loading || !listActive) return;
    if (isReview && !selected.has(id)) {
      initManualFor(rows.filter((r) => r.id === id));
    }
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
    if (isReview && !allSelected) initManualFor(rows);
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const n = listActive ? selected.size : 0;

  const reasonMissing = n > 0 && !reasonText.trim();

  const handleConfirm = () => {
    if (loading || reasonMissing) return;
    if (n === 0) {
      onConfirm({ reason: "", requests: [], pauseMs: 0, pauseWorkingHrs: 0 });
      return;
    }
    const now = Date.now();
    const pauseMs = Math.max(0, now - dayjs(pauseStart).valueOf());
    const pauseWorkingHrs = calculateWorkingHours(
      pauseStart,
      now,
      leaves,
      workCfg,
    );
    const requests = rows
      .filter((r) => selected.has(r.id))
      .map((r) => ({
        activityId: r.id,
        activityName: r.name,
        currentStart: r.plannedStart,
        currentStop: r.plannedStop,
        requestedStart: resolveDates(r).start.toISOString(),
        requestedStop: resolveDates(r).stop.toISOString(),
      }));
    onConfirm({
      reason: reasonText.trim(),
      requests,
      pauseMs,
      pauseWorkingHrs,
    });
  };

  const handleCancel = () => {
    if (loading) return;
    onCancel();
  };

  // Review mode: confirm the ticked activities / decline the whole request.
  const handleApprove = () => {
    if (loading || selected.size === 0 || hasInvalidManual) return;
    const now = Date.now();
    const approved = rows
      .filter((r) => selected.has(r.id))
      .map((r) => {
        const d = resolveDates(r, now);
        return {
          activityId: r.id,
          activityName: r.name,
          currentStart: r.plannedStart,
          currentStop: r.plannedStop,
          requestedStart: d.start.toISOString(),
          requestedStop: d.stop.toISOString(),
          addedByAssigner: !r.isRequested,
        };
      });
    onApprove?.(approved, changeRequest, remark.trim());
  };
  // A remark is compulsory when cancelling (declining) a request.
  const remarkMissing = isReview && !remark.trim();
  const handleReject = () => {
    if (loading) return;
    if (remarkMissing) {
      setRejectTried(true);
      return;
    }
    onReject?.(changeRequest, remark.trim());
  };

  let hint;
  if (hasPendingRequest) {
    hint =
      "You already have a pending date change request for this project. You can resume the activity, but you can't send another request until the assigner reviews it.";
  } else if (pauseLoading) {
    hint = "Calculating pause duration…";
  } else if (!pauseValid) {
    hint =
      "Couldn't find when this activity was paused, so new dates can't be calculated.";
  } else if (rows.length === 0) {
    hint = "There are no dependent activities to reschedule.";
  } else {
    // Assignee: no duration / calculation text.
    hint =
      "Ask for planned start & stop of other activities to be moved to account for the pause. Optional.";
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleCancel}
      container={getPortalContainer}
      scroll="paper"
      PaperProps={{
        className: "pj-scope rsd-paper",
        sx: {
          width: 560,
          maxWidth: "calc(100% - 24px)",
          maxHeight: "calc(100% - 24px)",
          m: "12px",
        },
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
                ? "Requested activities are pre-ticked. Untick any you don't want to move, or tick any other activity and pick its new dates. Confirm applies the ticked ones."
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
                // request mode: calculated dates (computed, never displayed)
                // review mode : the dates this row would get if confirmed
                const d = isReview
                  ? checked
                    ? resolveDates(r, openedAt)
                    : null
                  : pauseValid
                    ? resolveDates(r)
                    : null;
                // Unticked requested rows still show what was requested.
                const shown =
                  d ||
                  (isReview && r.newStart
                    ? { start: dayjs(r.newStart), stop: dayjs(r.newStop) }
                    : null);
                const m = manual[r.id];
                const asRequested = r.isRequested && !(checked && m?.on);
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
                          {isReview && r.isRequested && (
                            <span className="rsd-tag rsd-tag--next">
                              Requested
                            </span>
                          )}
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
                              {r.resourceName || r.resource}
                            </span>
                          )}
                          <span className="rsd-meta-item">
                            Planned: {fmtView(r.plannedStart)} →{" "}
                            {fmtView(r.plannedStop)}
                          </span>
                        </Box>
                        {showCalc && shown?.start && (
                          <Box
                            className={`rsd-new ${
                              isReview && !checked ? "rsd-new--off" : ""
                            }`}
                          >
                            {asRequested ? "Requested" : "New"}:{" "}
                            {fmtView(shown.start)} → {fmtView(shown.stop)}
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Assigner: date selection for every ticked activity.
                        Requested rows can keep the requested dates or pick
                        their own; rows the assignee didn't request always
                        need a picked start. */}
                    {isReview && checked && d && (
                      <Box
                        className="rsd-manual"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <Box className="rsd-manual-head">
                          <span className="rsd-manual-badge">
                            {r.isRequested
                              ? "Dates requested by the assignee"
                              : "Not requested — choose new dates"}
                          </span>
                          {r.isRequested && (
                            <div
                              className="rsd-seg"
                              role="radiogroup"
                              aria-label="Start date source"
                            >
                              {[
                                ["auto", "As requested"],
                                ["choose", "Choose date & time"],
                              ].map(([val, label]) => {
                                const active = (m?.on ? "choose" : "auto") === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    disabled={loading}
                                    className={`rsd-seg-btn ${active ? "rsd-seg-btn--on" : ""}`}
                                    onClick={() => setManualMode(r, val === "choose")}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </Box>

                        {m?.on && (
                          <Box className="rsd-manual-body">
                            <DateTimePickerPanel
                              value={m.value || ""}
                              onChange={(v) => setManualValue(r, v)}
                              minDate={dayjs(openedAt)}
                              leaves={leavesFor(r)}
                              workCfg={workCfg}
                              disabled={loading}
                            />
                            <Box className="rsd-manual-side">
                              <Box className="rsd-result">
                                <span className="rsd-result-title">New schedule</span>
                                <dl className="rsd-result-grid">
                                  <dt>Start</dt>
                                  <dd>{fmtView(d.start)}</dd>
                                  <dt>Stop</dt>
                                  <dd>{fmtView(d.stop)}</dd>
                                  <dt>Duration</dt>
                                  <dd>
                                    {formatWorkingHours(
                                      calculateWorkingHours(
                                        r.plannedStart,
                                        r.plannedStop,
                                        leavesFor(r),
                                        workCfg,
                                      ),
                                      workCfg,
                                    )}{" "}
                                    working time
                                  </dd>
                                </dl>
                                <span
                                  className={`rsd-result-note ${
                                    d.invalid ? "rsd-result-note--error" : ""
                                  }`}
                                >
                                  {d.invalid
                                    ? "Pick a date & time from now onwards."
                                    : d.adjusted
                                      ? "Start moved to the next working time."
                                      : "Stop keeps the planned working duration."}
                                </span>
                              </Box>
                              {r.isRequested && (
                                <Box className="rsd-manual-auto">
                                  <span>As requested instead</span>
                                  {fmtView(r.newStart)} → {fmtView(r.newStop)}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Request mode: why the dates need to move (required when any are ticked). */}
        {!isReview && listActive && (
          <NoteField
            id="rsd-reason"
            label="Reason for the change"
            placeholder="e.g. Waiting on client approval, so dependent tasks need to shift"
            value={reasonText}
            onChange={setReasonText}
            required={n > 0}
            error={reasonMissing}
            errorText="Enter a reason for the change."
            disabled={loading}
          />
        )}

        {/* Review mode: optional note from the assigner, sent with approve / reject. */}
        {isReview && (
          <NoteField
            id="rsd-remark"
            label="Remark"
            placeholder="Add a note for the assignee (required to cancel the request)"
            value={remark}
            onChange={setRemark}
            tagText="Required to cancel"
            error={rejectTried && remarkMissing}
            errorText="Enter a remark to cancel this request."
            disabled={loading}
          />
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
            disabled={loading || selected.size === 0 || hasInvalidManual}
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
            disabled={loading || reasonMissing}
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
