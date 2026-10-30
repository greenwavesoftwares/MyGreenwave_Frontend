import React, { useState } from "react";
import ResumeDialog from "./ResumeDialog";

/* ──────────────────────────────────────────────────────────
   ResumeRequestReview  (for the assigner page — any page)

   Thin, page-agnostic wrapper around <ResumeDialog mode="review" />.
   It knows NOTHING about your API, user, or toast system: the host page
   passes in what to do on Confirm / Cancel, and this just handles the
   in-flight loading state and error reporting.

     <ResumeRequestReview
       open={!!reviewing}
       changeRequest={reviewing}
       onClose={() => setReviewing(null)}
       onApprove={async (approvedChanges, request) => {
         await myApi.approve({ requestId: request.requestId, changes: approvedChanges });
       }}
       onReject={async (request) => {
         await myApi.reject({ requestId: request.requestId });
       }}
       onSuccess={(action) => { toast(...); setReviewing(null); refetch(); }}  // optional
       onError={(action, err) => toast(...)}                                  // optional
     />

   - onApprove / onReject are async; the dialog shows a spinner and locks
     its buttons until they settle.
   - If they throw, the dialog stays open and onError is called.
   - If they resolve, onSuccess("approve" | "reject") is called; when
     onSuccess is omitted the dialog just closes via onClose.

   changeRequest shape:
     { requestId, requestedByName, activityName, pauseMs, reason,
       createdAt, changes: [{ activityId, activityName, currentStart,
                              currentStop, requestedStart, requestedStop }] }

   Unticked activities: onApprove receives only the ticked ones; derive
   the declined ones from `request.changes` if your backend needs them.
   ────────────────────────────────────────────────────────── */

const ResumeRequestReview = ({
  open,
  changeRequest,
  onClose,
  onApprove,
  onReject,
  onSuccess,
  onError,
  activityLookupMap, // optional — only used to show each activity's owner
}) => {
  const [loading, setLoading] = useState(false);

  const run = async (action, fn) => {
    setLoading(true);
    try {
      await fn();
      if (onSuccess) onSuccess(action);
      else onClose?.();
    } catch (err) {
      console.log("Error:", err);
      onError?.(action, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResumeDialog
      mode="review"
      open={open}
      changeRequest={changeRequest}
      activityLookupMap={activityLookupMap}
      onApprove={(approved, request) =>
        run("approve", () => onApprove?.(approved, request))
      }
      onReject={(request) => run("reject", () => onReject?.(request))}
      onCancel={onClose}
      loading={loading}
    />
  );
};

export default ResumeRequestReview;
