import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FastForwardIcon from "@mui/icons-material/FastForward";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import dayjs from "dayjs";
import "./assignee-theme.css";
import ResumeRequestReview, { apiErrorMessage } from "./ResumeRequestReview";
import {
  RequestCard,
  normStatus,
  getRequestChanges,
  STATUS_LABEL,
} from "./ResumeRequestsHistory";
import { formatDuration } from "./ResumeDialog";
import { getPortalContainer } from "./portalContainer";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { showToast } from "./toastService";
import "./ResumeDialog.css";

/* ──────────────────────────────────────────────────────────
   ResumeReviewDialog — the assigner's entry point for resume
   (date-change) requests of a project.

   The parent only passes `projectId` and `open`. When opened, this loads the
   project's activities and ALL pending requests of the project:
     • several requests → a list, grouped by the requesting user; click one
       to review it (approve / reject), then you return to the list
     • a single request → opens the review straight away (as before)

   Usage
     <ResumeReviewDialog
       projectId={projectId}
       open={openReview}
       onClose={() => setOpenReview(false)}
       onDone={(action) => refetch()}        // optional
     />

   Uses getAllResumeDialogRequestsByAssigner(projectId) — one call; requests
   with status PENDING fill the Pending tab, APPROVED / REJECTED the History tab.
   ────────────────────────────────────────────────────────── */

const WORK_CFG = { workStart: 9, workEnd: 18, weekEnd: [0, 6] }; // keep in sync with ProjectActivityInfo

const asArray = (res) => (Array.isArray(res) ? res : res ? [res] : []);

// ONE call returns every request of the project (any status) for the assigner;
// it is split here into pending (to review) and decided (History tab).
const fetchAllRequests = async (projectId) => {
  const res = asArray(
    await activityTrackerApi.getAllResumeDialogRequestsByAssigner(projectId),
  );
  // Debug aid: shows the exact field names the backend returns.
  console.log("[ResumeReview] requests from API:", res);
  return res;
};

const splitByStatus = (all) => ({
  pending: all.filter((r) => normStatus(r) === "pending"),
  decided: all.filter((r) => normStatus(r) !== "pending"),
});

const reqId = (r) => r.requestId ?? r.id;
const reqChanges = (r) => getRequestChanges(r);

const pauseMsOf = (r) =>
  r.pauseMs ?? (Number.isFinite(r.pauseMins) ? r.pauseMins * 60000 : 0);

const initials = (name = "") =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// previewRequest (used by ResumeRequestsList) skips the fetch and reviews the
// request(s) passed in; dryRun logs approve/reject instead of calling the API.
const ResumeReviewDialog = ({
  projectId,
  open,
  onClose,
  onDone,
  previewRequest,
  dryRun = false,
}) => {
  const [project, setProject] = useState(null);
  const [requests, setRequests] = useState([]); // pending
  const [history, setHistory] = useState([]); // approved + rejected
  const [tab, setTab] = useState("pending"); // "pending" | "history"
  const [histFilter, setHistFilter] = useState("all"); // all | approved | rejected
  const [selected, setSelected] = useState(null); // request being reviewed

  const loadProject = () => activityTrackerApi.getAllActivities(projectId);

  // Load fresh data every time the dialog is opened.
  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;

    (async () => {
      try {
        const [projectData, all] = await Promise.all([
          loadProject(),
          previewRequest
            ? Promise.resolve([].concat(previewRequest))
            : fetchAllRequests(projectId),
        ]);
        const { pending: list, decided: past } = previewRequest
          ? { pending: all, decided: [] }
          : splitByStatus(all);
        if (cancelled) return;

        if (!list.length && !past.length) {
          showToast("info", "No requests", "There are no date change requests.");
          onClose?.();
          return;
        }
        const withProject = list.map((r) => ({ ...r, projectId }));
        setProject(projectData);
        setRequests(withProject);
        setHistory(past.map((r) => ({ ...r, projectId })));
        setHistFilter("all");
        setTab(withProject.length ? "pending" : "history");
        // A lone pending request (and no history to browse) opens straight away.
        setSelected(
          withProject.length === 1 && !past.length ? withProject[0] : null,
        );
      } catch (err) {
        console.log("Error:", err);
        if (cancelled) return;
        showToast("error", "Error", "Could not load the date change requests.");
        onClose?.();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  // Clear data when closed so the next open never flashes stale content.
  useEffect(() => {
    if (!open) {
      setProject(null);
      setRequests([]);
      setHistory([]);
      setSelected(null);
    }
  }, [open]);

  // Requests grouped by the user who raised them, newest first.
  const groupBy = (list) => {
    const map = new Map();
    list.forEach((r) => {
      const key = r.requestedBy ?? r.requestedByName ?? "unknown";
      if (!map.has(key)) {
        map.set(key, { key, name: r.requestedByName ?? key, items: [] });
      }
      map.get(key).items.push(r);
    });
    const out = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    out.forEach((g) =>
      g.items.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      ),
    );
    return out;
  };
  const groups = useMemo(() => groupBy(requests), [requests]);

  const histCounts = useMemo(() => {
    const c = { all: history.length, approved: 0, rejected: 0 };
    history.forEach((r) => (c[normStatus(r)] += 1));
    return c;
  }, [history]);
  const histGroups = useMemo(
    () =>
      groupBy(
        history.filter(
          (r) => histFilter === "all" || normStatus(r) === histFilter,
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, histFilter],
  );

  // After approve / reject: drop the handled request, go back to the list,
  // or close when it was the last one.
  const finishReview = (action) => {
    showToast(
      "success",
      action === "approve" ? "Request approved" : "Request rejected",
      dryRun
        ? "Dry run — no API call made."
        : action === "approve"
          ? "The approved dates have been applied."
          : "The date change request was rejected.",
    );
    onDone?.(action);

    const remaining = requests.filter((r) => reqId(r) !== reqId(selected));
    // The handled request moves from Pending to History straight away.
    const decided = {
      ...selected,
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedAt: new Date().toISOString(),
    };
    const nextHistory = [decided, ...history];
    setHistory(nextHistory);
    if (!remaining.length) {
      // Nothing left to review — show the history if there is any, else close.
      setRequests([]);
      setSelected(null);
      if (nextHistory.length) setTab("history");
      else onClose?.();
      return;
    }
    setRequests(remaining);
    setSelected(null);
    // approved dates change the activities — reload so the next review is current
    if (action === "approve" && !dryRun) {
      loadProject().then(setProject).catch((e) => console.log("Error:", e));
    }
  };

  // Close from the review: back to the list if there is one, else close.
  const closeReview = () =>
    requests.length > 1 || history.length > 0 ? setSelected(null) : onClose?.();

  const showReview = open && !!project && !!selected;
  const showList =
    open && !!project && !selected && (requests.length > 0 || history.length > 0);

  return (
    <>
      <Dialog
        open={showList}
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
        {/* ── HEADER (same as ResumeDialog) ── */}
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
              Date Change Requests
            </Typography>
            <Typography
              variant="caption"
              noWrap
              className="rsd-subtitle"
              sx={{ display: "block" }}
            >
              {requests.length} pending · {history.length} in history
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} className="rsd-close-btn">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent className="rsd-content">
          {/* Pending (to review) · History (approved / rejected) */}
          <Box className="rsd-tabs" role="tablist" aria-label="Requests">
            {[
              ["pending", "Pending", requests.length],
              ["history", "History", history.length],
            ].map(([key, label, n]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`rsd-tab ${tab === key ? "rsd-tab--on" : ""}`}
                onClick={() => setTab(key)}
              >
                {label} <span className="rsd-count">{n}</span>
              </button>
            ))}
          </Box>

          {tab === "history" && (
            <>
              <Typography variant="caption" className="rsd-section-hint">
                Requests that have already been approved or rejected.
              </Typography>
              <Box className="rsd-tabs rsd-tabs--sub" role="tablist" aria-label="History filter">
                {["all", "approved", "rejected"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={histFilter === f}
                    className={`rsd-tab ${histFilter === f ? "rsd-tab--on" : ""}`}
                    onClick={() => setHistFilter(f)}
                  >
                    {f === "all" ? "All" : STATUS_LABEL[f]}{" "}
                    <span className="rsd-count">{histCounts[f]}</span>
                  </button>
                ))}
              </Box>
              {histGroups.length === 0 && (
                <Typography variant="body2" className="rsd-empty-note">
                  No {histFilter === "all" ? "" : `${histFilter} `}requests in history.
                </Typography>
              )}
              {histGroups.map((g) => (
                <Box key={g.key} className="rsd-req-group">
                  <Box className="rsd-req-user">
                    <span className="rsd-req-avatar">{initials(g.name)}</span>
                    <Typography variant="body2" fontWeight={700} className="rsd-row-name">
                      {g.name}
                    </Typography>
                    <span className="rsd-count">
                      {g.items.length} {g.items.length === 1 ? "request" : "requests"}
                    </span>
                  </Box>
                  <ul className="rsd-list rsd-hist-list">
                    {g.items.map((r) => (
                      <RequestCard key={reqId(r)} r={r} view="review" />
                    ))}
                  </ul>
                </Box>
              ))}
            </>
          )}

          {tab === "pending" && requests.length === 0 && (
            <Typography variant="body2" className="rsd-empty-note">
              No pending requests to review.
            </Typography>
          )}

          {tab === "pending" && requests.length > 0 && (
            <Typography variant="caption" className="rsd-section-hint">
              Select a request to review the new dates the assignee asked for.
            </Typography>
          )}

          {tab === "pending" && groups.map((g) => (
            <Box key={g.key} className="rsd-req-group">
              <Box className="rsd-req-user">
                <span className="rsd-req-avatar">{initials(g.name)}</span>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  className="rsd-row-name"
                >
                  {g.name}
                </Typography>
                <span className="rsd-count">
                  {g.items.length} {g.items.length === 1 ? "request" : "requests"}
                </span>
              </Box>

              <Box className="rsd-list">
                {g.items.map((r) => {
                  const n = reqChanges(r).length;
                  return (
                    <Box
                      key={reqId(r)}
                      role="button"
                      tabIndex={0}
                      className="rsd-row rsd-req-card"
                      onClick={() => setSelected(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(r);
                        }
                      }}
                    >
                      <Box className="rsd-req-body">
                        <Box className="rsd-row-title">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            className="rsd-row-name"
                          >
                            {r.sourceActivityName ?? r.activityName ?? "Activity"}
                          </Typography>
                          <span className="rsd-tag rsd-tag--next">
                            {n} date {n === 1 ? "change" : "changes"}
                          </span>
                        </Box>
                        <Box className="rsd-row-meta">
                          <span className="rsd-meta-item">
                            <PauseCircleOutlineRoundedIcon className="rsd-req-meta-icon" />
                            Paused {formatDuration(pauseMsOf(r))}
                          </span>
                          {r.createdAt && (
                            <span className="rsd-meta-item">
                              <ScheduleRoundedIcon className="rsd-req-meta-icon" />
                              {dayjs(r.createdAt).format("DD MMM YYYY, HH:mm")}
                            </span>
                          )}
                        </Box>
                        {r.reason && (
                          <Typography variant="caption" className="rsd-req-reason">
                            {r.reason}
                          </Typography>
                        )}
                      </Box>
                      <ChevronRightRoundedIcon className="rsd-req-chevron" />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </DialogContent>

        {/* ── FOOTER ── */}
        <Box className="rsd-footer">
          <Button
            variant="outlined"
            onClick={onClose}
            className="rsd-cancel-btn"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Close
          </Button>
        </Box>
      </Dialog>

      <ResumeRequestReview
        open={showReview}
        project={project}
        changeRequest={selected}
        workCfg={WORK_CFG}
        dryRun={dryRun}
        onClose={closeReview}
        onSuccess={finishReview}
        onError={(action, err) => {
          const reason = apiErrorMessage(err);
          showToast(
            "error",
            "Error",
            `Could not ${action} the request.${reason ? ` ${reason}` : " Please try again."}`,
          );
        }}
      />
    </>
  );
};

export default ResumeReviewDialog;
