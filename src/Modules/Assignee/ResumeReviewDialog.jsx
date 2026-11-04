import React, { useEffect, useState } from "react";
import ResumeRequestReview from "./ResumeRequestReview";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { showToast } from "./toastService";

/* ──────────────────────────────────────────────────────────
   ResumeReviewDialog — self-contained wrapper around ResumeRequestReview

   The parent only passes `projectId` and `open`. When opened, this component
   loads the project (activities) and the pending date-change request itself,
   then renders <ResumeRequestReview>.

   Usage
     <ResumeReviewDialog
       projectId={projectId}
       open={openReview}
       onClose={() => setOpenReview(false)}   // see note below
     />

   Note: a dialog can't close itself without the parent flipping `open`, so
   `onClose` is accepted as an optional third prop. If you truly want only two
   props, replace `onClose` with internal state (see `internalOpen` below).
   ────────────────────────────────────────────────────────── */

const WORK_CFG = { workStart: 9, workEnd: 18, weekEnd: [0, 6] }; // keep in sync with ProjectActivityInfo

/* ⚠ ASSUMED API — there is no "get pending request" method in the code I was
   given. Rename to your real service method; it should return the pending
   request for the project (or null/undefined when there is none). The raw
   shape is fine: ResumeRequestReview normalises it via toChangeRequest(). */
const fetchPendingRequest = async (projectId) => {
  const res = await activityTrackerApi.getPendingResumeRequestByProjectId(projectId);
  return Array.isArray(res) ? res[0] ?? null : res ?? null;
};

// TEST-ONLY props: previewRequest skips the pending-request fetch (pass a
// sample request); dryRun logs approve/reject instead of calling the API.
const ResumeReviewDialog = ({
  projectId,
  open,
  onClose,
  onDone,
  previewRequest,
  dryRun = false,
}) => {
  const [project, setProject] = useState(null);
  const [changeRequest, setChangeRequest] = useState(null);

  // Load fresh data every time the dialog is opened.
  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;

    (async () => {
      try {
        const [projectData, request] = await Promise.all([
          activityTrackerApi.getAllActivities(projectId),
          previewRequest ? Promise.resolve(previewRequest) : fetchPendingRequest(projectId),
        ]);
        if (cancelled) return;

        if (!request) {
          showToast("info", "No pending request", "There is nothing to review.");
          onClose?.();
          return;
        }
        setProject(projectData);
        setChangeRequest({ ...request, projectId });
      } catch (err) {
        console.log("Error:", err);
        if (cancelled) return;
        showToast("error", "Error", "Could not load the date change request.");
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
      setChangeRequest(null);
    }
  }, [open]);

  // Only render the review once both pieces have loaded.
  const ready = open && !!project && !!changeRequest;

  return (
    <ResumeRequestReview
      open={ready}
      project={project}
      changeRequest={changeRequest}
      workCfg={WORK_CFG}
      dryRun={dryRun}
      onClose={onClose}
      onSuccess={(action) => {
        showToast(
          "success",
          action === "approve" ? "Request approved" : "Request rejected",
          dryRun
            ? "Dry run — no API call made."
            : action === "approve"
              ? "The approved dates have been applied."
              : "The date change request was rejected.",
        );
        onDone?.(action); // optional: let the parent refetch
        onClose?.();
      }}
      onError={(action) =>
        showToast(
          "error",
          "Error",
          `Could not ${action} the request. Please try again.`,
        )
      }
    />
  );
};

export default ResumeReviewDialog;
