import React, { useEffect, useMemo, useState } from "react";
import ResumeDialog from "./ResumeDialog";
import { getRequestChanges } from "./ResumeRequestsHistory";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { getUserData } from "../Login/Encrypt";

/* ──────────────────────────────────────────────────────────
   ResumeRequestReview — the assigner's "Review Date Change Request"

   Everything lives in this one file (plus ResumeDialog.jsx for the UI):
     • builds the activity lookup map from `project`
     • turns the request into the shape the dialog needs
     • loads each owner's leave / holidays for the date picker
     • calls the approve / reject API itself

   Usage (assigner page)
     <ResumeRequestReview
       open={!!reviewing}
       project={project}            // the project object the page already has
       changeRequest={reviewing}    // pending request (raw API shape is fine)
       onClose={() => setReviewing(null)}
       onSuccess={(action) => { setReviewing(null); refetch(); }}   // optional
       onError={(action, err) => showToast(...)}                     // optional
     />

   Props
     open, project, changeRequest, onClose     required
     onSuccess("approve" | "reject")           optional — after the API call
     onError("approve" | "reject", err)        optional — dialog stays open
     workCfg  { workStart, workEnd, weekEnd }  optional
     dryRun   boolean — log instead of calling approve / reject (testing)
   ────────────────────────────────────────────────────────── */

// Readable message from an axios error (e.g. the reason behind an HTTP 400).
export const apiErrorMessage = (err) => {
  const d = err?.response?.data;
  if (typeof d === "string" && d.trim()) return d.trim();
  const m = d?.message || d?.error || d?.detail || d?.reason;
  if (typeof m === "string" && m.trim()) return m.trim();
  return err?.message || "";
};

/* ═══════════ 1. API — the only backend-facing part; adjust here ═══════════
   Service methods (activityTrackerApi):
     resumeDialogApprove(requestId, { approvedBy, remarks, changes })
     resumeDialogReject(requestId,  { rejectedBy, remarks })
     getLeavesWithHolidaysByUserId(userId)
   approvedBy / rejectedBy are taken from the logged-in user. */
const currentUserId = () => getUserData()?.userDetails?.userId;

const reviewApi = {
  async getLeaves(userId) {
    const res = await activityTrackerApi.getLeavesWithHolidaysByUserId(userId);
    return res?.[0]?.leaves ?? [];
  },

  // approvedChanges: ticked activities with their FINAL dates.
  // The approve endpoint (ResumeDialogApproveRequest) takes ONLY
  //   { approvedBy, changes: [{ activityId, requestedStart, requestedStop }] }
  // — those dates are applied to the activities. Unticked (declined)
  // activities are simply left out; extra fields are not sent.
  approve({ requestId, approvedChanges, remark }) {
    const approvedBy = currentUserId();
    if (!requestId || !approvedBy) {
      return Promise.reject(
        new Error(
          !requestId
            ? "Request id is missing in the request data."
            : "Logged-in user id is missing.",
        ),
      );
    }
    // Backend fields are java.sql.Timestamp: send clean ISO-8601 strings.
    const iso = (d) => {
      const t = new Date(d);
      return Number.isNaN(t.getTime()) ? null : t.toISOString();
    };
    const changes = approvedChanges.map((c) => ({
      activityId: c.activityId,
      requestedStart: iso(c.requestedStart),
      requestedStop: iso(c.requestedStop),
    }));
    if (changes.some((c) => !c.activityId || !c.requestedStart || !c.requestedStop)) {
      return Promise.reject(
        new Error("A ticked activity has an invalid or missing date."),
      );
    }
    const payload = { approvedBy, resumeDialogapprovedChanges:changes };
    if (remark) payload.remarks = remark;
    console.log("[ResumeReview] approve", requestId, payload);
    return activityTrackerApi.resumeDialogApprove(requestId, payload);
  },

  // assigner cancelled the whole request
  reject({ requestId, remark }) {
    return activityTrackerApi.resumeDialogReject(requestId, {
      rejectedBy: currentUserId(),
      remarks: remark,
    });
  },
};

/* ═══════════ 2. project → { [activityId]: {...} } ═══════════
   Accepts one project, an array of projects (as the API returns), flat
   `rows`, or a nested `modules` tree. */
const toEntry = (n) => ({
  id: n.id,
  name: n.task ?? n.name,
  activityStatus: n.status ?? n.activityStatus,
  resource: n.resource, // owner id / e-mail — key for leave lookups
  resourceName: n.resourceName, // display name
  plannedStart: n.plannedStart,
  plannedStop: n.plannedStop,
  actualStart: n.actualStart,
  actualStop: n.actualStop,
  dependsOn: n.dependsOn || [],
  parentId: n.parentId ?? null,
  module: n.module,
});

export function buildActivityLookupMap(project) {
  const map = {};
  const projects = Array.isArray(project) ? project : project ? [project] : [];
  const walk = (nodes) =>
    (nodes || []).forEach((n) => {
      if (n?.id == null) return;
      map[n.id] = toEntry(n);
      if (n.children?.length) walk(n.children);
    });
  projects.forEach((p) => {
    walk(p?.rows); // flat rows
    walk(p?.modules); // nested tree
  });
  return map;
}

/* ═══════════ 3. raw request → the dialog's changeRequest ═══════════
   Accepts the shape the assignee's Resume dialog posts
   ({ pauseMins, resumeDialogChangeItems, sourceActivityName, ... }) or the
   review shape ({ pauseMs, changes, activityName, ... }). */
export function toChangeRequest(raw) {
  if (!raw) return null;
  const items = getRequestChanges(raw);
  return {
    requestId: raw.requestId ?? raw.id,
    projectId: raw.projectId,
    sourceActivityId: raw.sourceActivityId, // the resumed activity (not listed)
    activityName: raw.activityName ?? raw.sourceActivityName,
    requestedByName: raw.requestedByName,
    pauseMs:
      raw.pauseMs ?? (Number.isFinite(raw.pauseMins) ? raw.pauseMins * 60000 : 0),
    reason: raw.reason,
    createdAt: raw.createdAt,
    changes: items.map((c) => ({
      activityId: c.activityId,
      activityName: c.activityName,
      currentStart: c.currentStart,
      currentStop: c.currentStop,
      requestedStart: c.requestedStart,
      requestedStop: c.requestedStop,
    })),
  };
}

/* ═══════════ 4. component ═══════════ */
const ResumeRequestReview = ({
  open,
  project,
  changeRequest,
  onClose,
  onSuccess,
  onError,
  workCfg,
  dryRun = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [leavesByResource, setLeavesByResource] = useState({});

  const request = useMemo(() => toChangeRequest(changeRequest), [changeRequest]);
  const activityLookupMap = useMemo(
    () => buildActivityLookupMap(project),
    [project],
  );
  const projectId =
    request?.projectId ??
    (Array.isArray(project) ? project[0]?.id : project?.id);

  // Leave / holidays of every activity owner (greys out days in the picker).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const owners = [
      ...new Set(
        Object.values(activityLookupMap)
          .map((a) => a.resource)
          .filter(Boolean),
      ),
    ];
    (async () => {
      const results = await Promise.allSettled(owners.map(reviewApi.getLeaves));
      if (cancelled) return;
      const next = {};
      owners.forEach((o, i) => {
        if (results[i].status === "fulfilled") next[o] = results[i].value;
      });
      setLeavesByResource(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, activityLookupMap]);

  const run = async (action, fn) => {
    setLoading(true);
    try {
      if (dryRun) console.log(`[ResumeReview dry run] ${action}`);
      else await fn();
      if (onSuccess) onSuccess(action);
      else onClose?.();
    } catch (err) {
      console.log("Error:", err, err?.response?.data);
      onError?.(action, err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (approvedChanges, req, remark) => {
    if (dryRun) console.log("[ResumeReview dry run] approved →", approvedChanges);
    return run("approve", () =>
      reviewApi.approve({
        requestId: req?.requestId,
        approvedChanges,
        remark,
      }),
    );
  };

  const handleReject = (req, remark) => {
    if (!remark?.trim()) return; // remark is compulsory to cancel a request
    return run("reject", () =>
      reviewApi.reject({ requestId: req?.requestId, remark }),
    );
  };

  return (
    <ResumeDialog
      mode="review"
      open={open}
      changeRequest={request}
      activityLookupMap={activityLookupMap}
      leavesByResource={leavesByResource}
      {...(workCfg ? { workCfg } : {})}
      onApprove={handleApprove}
      onReject={handleReject}
      onCancel={onClose}
      loading={loading}
    />
  );
};

export default ResumeRequestReview;
