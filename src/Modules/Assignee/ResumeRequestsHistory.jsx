import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import dayjs from "dayjs";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { getPortalContainer } from "./portalContainer";
import "./assignee-theme.css";
import "./ResumeDialog.css";

/* ──────────────────────────────────────────────────────────
   ResumeRequestsHistory — a DIALOG with the resume (date-change) requests
   RAISED BY THE LOGGED-IN ASSIGNEE (the user who resumed an activity):
   pending, approved and rejected. Opened from the "Resume history" button.

   There is no review here — approving / rejecting, and the history of
   decided requests, live in the assigner's Date Change Requests dialog
   (ResumeReviewDialog). This file also exports the shared pieces that
   dialog reuses: RequestCard, normStatus, STATUS_LABEL.

   Status tabs: All · Pending · Approved · Rejected.

   Usage
     <ResumeRequestsHistory
       open={openHistory}
       onClose={() => setOpenHistory(false)}
       projectId={projectId}
       projectName={projectName}   // optional, shown in the header
     />

   API (one call, scoped on the server)
       GET /activityTracker/resumeDialog/myRequests?projectId=
       activityTrackerApi.getMyResumeDialogRequests(projectId)   // NEW method
     The server returns only the requests RAISED BY THE CALLER (requested_by,
     taken from the auth token), with ANY status. The browser does not filter
     by user — the status tabs below filter this one response on `status`.
     → array of requests:
       { requestId, projectId, sourceActivityName, requestedBy,
         requestedByName, reason, pauseMins, createdAt,
         status: "PENDING" | "APPROVED" | "REJECTED",
         remark, reviewedByName, reviewedAt,      // set once reviewed
         resumeDialogChangeItems | changes: [
           { activityId, activityName, currentStart, currentStop,
             requestedStart, requestedStop,
             isApproved }   // null while pending; true / false per item
                            // once the request is APPROVED
         ] }
   ────────────────────────────────────────────────────────── */

const asArray = (res) => (Array.isArray(res) ? res : res ? [res] : []);

// The caller's own requests, every status. A failure is thrown to the caller
// (the dialog shows an inline error with a retry).
const fetchMyRequests = async (projectId) =>
  asArray(await activityTrackerApi.getMyResumeDialogRequests(projectId));

export const normStatus = (r) => {
  const s = String(r.status ?? r.requestStatus ?? "pending").toLowerCase();
  if (["approved", "accepted", "confirmed"].includes(s)) return "approved";
  if (["rejected", "declined", "cancelled", "canceled"].includes(s)) return "rejected";
  return "pending";
};

export const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const TABS = ["all", "pending", "approved", "rejected"];

const fmtDate = (d) => (d && dayjs(d).isValid() ? dayjs(d).format("DD MMM YYYY, HH:mm") : "—");
const fmtPause = (mins) => {
  if (!Number.isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
};

/* One request, in the same card look as the rest of the resume dialogs
   (.rsd-row / .rsd-tag / .rsd-row-meta). Shared with ResumeReviewDialog's
   History tab. */
export const RequestCard = ({ r, view = "mine" }) => {
  const [open, setOpen] = useState(false);
  const status = normStatus(r);
  const changes = r.resumeDialogChangeItems ?? r.changes ?? [];
  const remark = r.remark ?? r.assignerRemark ?? r.reviewRemark;
  const reviewedBy = r.reviewedByName;
  const reviewedAt = r.reviewedAt;
  const pause = fmtPause(r.pauseMins ?? (r.pauseMs ? r.pauseMs / 60000 : undefined));

  return (
    <Box component="li" className={`rsd-row rsd-hist-card rsd-hist-card--${status}`}>
      <Box className="rsd-row-title">
        <Typography variant="body2" fontWeight={600} noWrap className="rsd-row-name">
          {r.sourceActivityName ?? r.activityName ?? "Activity"}
        </Typography>
        <span className={`rsd-tag rsd-tag--${status}`}>{STATUS_LABEL[status]}</span>
      </Box>

      <Box className="rsd-row-meta">
        {view === "review" && r.requestedByName && (
          <span className="rsd-meta-item">
            <PersonOutlineOutlinedIcon className="rsd-req-meta-icon" />
            {r.requestedByName}
          </span>
        )}
        {pause && (
          <span className="rsd-meta-item">
            <PauseCircleOutlineRoundedIcon className="rsd-req-meta-icon" />
            Paused {pause}
          </span>
        )}
        {r.createdAt && (
          <span className="rsd-meta-item">
            <ScheduleRoundedIcon className="rsd-req-meta-icon" />
            {fmtDate(r.createdAt)}
          </span>
        )}
      </Box>

      {r.reason && (
        <Typography variant="caption" className="rsd-hist-reason">
          {r.reason}
        </Typography>
      )}

      {status !== "pending" && (remark || reviewedBy) && (
        <Box className={`rsd-hist-decision rsd-hist-decision--${status}`}>
          <span className="rsd-hist-decision-title">
            {STATUS_LABEL[status]}
            {reviewedBy ? ` by ${reviewedBy}` : ""}
            {reviewedAt ? ` · ${fmtDate(reviewedAt)}` : ""}
          </span>
          {remark ? (
            <span className="rsd-hist-decision-text">{remark}</span>
          ) : (
            <span className="rsd-hist-decision-text rsd-hist-decision-text--none">
              No remark
            </span>
          )}
        </Box>
      )}

      {changes.length > 0 && (
        <>
          <button
            type="button"
            className="rsd-hist-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {changes.length} date {changes.length === 1 ? "change" : "changes"}
            <ExpandMoreRoundedIcon
              className={`rsd-hist-toggle-icon ${open ? "rsd-hist-toggle-icon--open" : ""}`}
            />
          </button>
          {open && (
            <ul className="rsd-hist-changes">
              {changes.map((c) => (
                <li key={c.activityId} className="rsd-hist-change">
                  <span className="rsd-hist-change-name">
                    {c.activityName}
                    {status === "approved" && c.isApproved === false && (
                      <span className="rsd-tag rsd-tag--rejected rsd-hist-change-tag">
                        Not approved
                      </span>
                    )}
                  </span>
                  <span className="rsd-hist-change-old">
                    {fmtDate(c.currentStart)} → {fmtDate(c.currentStop)}
                  </span>
                  <span className="rsd-hist-change-new">
                    {fmtDate(c.requestedStart)} → {fmtDate(c.requestedStop)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Box>
  );
};

const ResumeRequestsHistory = ({
  open,
  onClose,
  projectId,
  projectName,
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); // false until the first fetch of this open finishes
  const [tab, setTab] = useState("all");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (projectId == null) return;
    setLoading(true);
    setError(false);
    try {
      setRequests(await fetchMyRequests(projectId));
    } catch (err) {
      console.log("Error:", err);
      setError(true); // shown inline, with a retry — no extra toast
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [projectId]);

  // Fresh data (and the default tab) every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTab("all");
    setLoaded(false);
    load();
  }, [open, load]);

  // `requests` already holds only this user's requests (the API is scoped by
  // requested_by). Tab counts are over the whole response; the visible list is
  // the response filtered on its `status`, newest first.
  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => (c[normStatus(r)] += 1));
    return c;
  }, [requests]);

  const shown = useMemo(
    () =>
      requests
        .filter((r) => tab === "all" || normStatus(r) === tab)
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [requests, tab],
  );

  const busy = loading || !loaded;

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
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
      {/* ── HEADER (same as the other resume dialogs) ── */}
      <Box className="rsd-header">
        <Box className="rsd-icon-chip">
          <HistoryRoundedIcon sx={{ fontSize: 24 }} className="rsd-icon" />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} className="rsd-title">
            Resume History
          </Typography>
          <Typography variant="caption" noWrap className="rsd-subtitle" sx={{ display: "block" }}>
            {projectName ? `${projectName} · ` : ""}
            {requests.length} {requests.length === 1 ? "request" : "requests"} raised by you
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} className="rsd-close-btn" aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent className="rsd-content rsd-hist-content">
        <Box className="rsd-tabs" role="tablist" aria-label="Status">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`rsd-tab ${tab === t ? "rsd-tab--on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "all" ? "All" : STATUS_LABEL[t]}{" "}
              <span className="rsd-count">{counts[t]}</span>
            </button>
          ))}
        </Box>

        {busy && (
          <Box className="rsd-hist-loader" role="status" aria-live="polite">
            <CircularProgress size={26} thickness={4} />
            <Typography variant="caption" className="rsd-section-hint" sx={{ mb: "0 !important" }}>
              Loading resume history…
            </Typography>
          </Box>
        )}

        {!busy && error && (
          <Box className="rsd-hist-state rsd-hist-state--error">
            <Box className="rsd-hist-state-icon">
              <ErrorOutlineRoundedIcon />
            </Box>
            <Typography variant="body2" fontWeight={700} className="rsd-hist-state-title">
              Couldn't load resume history
            </Typography>
            <Typography variant="caption" className="rsd-hist-state-hint">
              Something went wrong while fetching your requests.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={load}
              className="rsd-cancel-btn"
              sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Try again
            </Button>
          </Box>
        )}

        {!busy && !error && shown.length === 0 && (
          <Box className="rsd-hist-state">
            <Box className="rsd-hist-state-icon">
              <InboxOutlinedIcon />
            </Box>
            <Typography variant="body2" fontWeight={700} className="rsd-hist-state-title">
              {tab === "all"
                ? "No resume requests yet"
                : `No ${STATUS_LABEL[tab].toLowerCase()} requests`}
            </Typography>
            <Typography variant="caption" className="rsd-hist-state-hint">
              {tab === "all"
                ? "When you resume a paused activity and ask for date changes, the request will appear here."
                : "Nothing to show for this status."}
            </Typography>
          </Box>
        )}

        {!busy && !error && shown.length > 0 && (
          <ul className="rsd-list rsd-hist-list">
            {shown.map((r) => (
              <RequestCard key={r.requestId ?? r.id} r={r} view="mine" />
            ))}
          </ul>
        )}
      </DialogContent>

      {/* ── FOOTER ── */}
      <Box className="rsd-footer">
        <Button
          variant="outlined"
          onClick={load}
          disabled={busy}
          className="rsd-cancel-btn"
          startIcon={
            busy ? (
              <CircularProgress size={16} thickness={5} color="inherit" />
            ) : (
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            )
          }
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, minWidth: 112 }}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          className="rsd-confirm-btn"
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
};

export default ResumeRequestsHistory;
