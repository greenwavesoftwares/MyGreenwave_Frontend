import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { showToast } from "./toastService";
import ResumeReviewDialog from "./ResumeReviewDialog";
import "./ResumeRequestsList.css";

/* ──────────────────────────────────────────────────────────
   ResumeRequestsList — every pending resume (date-change) request
   addressed to the logged-in assigner, grouped by the requesting user.

   Frontend-only: uses APIs the code already calls, nothing new.
     • getProjectsByAssignee()                  (ProjectsInfo) → the logged-in
                                                 assigner's projects
     • getResumeDialogRequests(id, "PENDING")   (ResumeReviewDialog) → pending
                                                 requests of one project

   Usage
     <ResumeRequestsList projectId={projectId} onChanged={refetch} />  // one project
     <ResumeRequestsList />                        // all of the assigner's projects
   ────────────────────────────────────────────────────────── */

const asArray = (res) => (Array.isArray(res) ? res : res ? [res] : []);

const fetchForProject = async (projectId, projectName) => {
  const res = await activityTrackerApi.getResumeDialogRequests(projectId, "PENDING");
  return asArray(res).map((r) => ({
    ...r,
    projectId: r.projectId ?? projectId,
    projectName: r.projectName ?? projectName,
  }));
};

const fetchRequests = async (projectId) => {
  if (projectId != null) return fetchForProject(projectId);

  const projects = (await activityTrackerApi.getProjectsByAssignee()) ?? [];
  const settled = await Promise.allSettled(
    projects.map((p) => fetchForProject(p.projectId, p.projectName)),
  );
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
};

const fmtPause = (mins) => {
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
};

const ResumeRequestsList = ({ projectId, onChanged }) => {

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [reviewing, setReviewing] = useState(null); // raw request

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await fetchRequests(projectId));
    } catch (err) {
      console.log("Error:", err);
      showToast("error", "Error", "Could not load resume requests.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setUserFilter("all");
    setProjectFilter("all");
    load();
  }, [load]);

  // Projects present in the result (only used when no projectId prop is given).
  const projects = useMemo(() => {
    const m = new Map();
    requests.forEach((r) =>
      m.set(String(r.projectId), r.projectName ?? `Project ${r.projectId}`),
    );
    return [...m.entries()];
  }, [requests]);

  const scoped = useMemo(
    () =>
      projectFilter === "all"
        ? requests
        : requests.filter((r) => String(r.projectId) === projectFilter),
    [requests, projectFilter],
  );

  // Group by requesting user → [{ id, name, items: [...] }], newest first.
  const groups = useMemo(() => {
    const map = new Map();
    scoped.forEach((r) => {
      const id = r.requestedBy ?? r.requestedByName ?? "unknown";
      if (!map.has(id)) {
        map.set(id, { id, name: r.requestedByName ?? id, items: [] });
      }
      map.get(id).items.push(r);
    });
    const out = [...map.values()];
    out.forEach((g) =>
      g.items.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    );
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [scoped]);

  const visible =
    userFilter === "all" ? groups : groups.filter((g) => g.id === userFilter);

  return (
    <div className="rrl">
      <div className="rrl-head">
        <h2 className="rrl-title">
          Resume requests <span className="rrl-count">{scoped.length}</span>
        </h2>
        <div className="rrl-tools">
          {projectId == null && projects.length > 1 && (
            <select
              className="rrl-select"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setUserFilter("all");
              }}
              aria-label="Filter by project"
            >
              <option value="all">All projects</option>
              {projects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <select
            className="rrl-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            aria-label="Filter by user"
          >
            <option value="all">All users</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.items.length})
              </option>
            ))}
          </select>
          <button className="rrl-btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {!loading && visible.length === 0 && (
        <div className="rrl-empty">No pending resume requests.</div>
      )}

      {visible.map((g) => (
        <section key={g.id} className="rrl-group">
          <h3 className="rrl-user">
            {g.name} <span className="rrl-count">{g.items.length}</span>
          </h3>
          <ul className="rrl-list">
            {g.items.map((r) => {
              const id = r.requestId ?? r.id;
              const changes = r.resumeDialogChangeItems ?? r.changes ?? [];
              return (
                <li key={id} className="rrl-card">
                  <div className="rrl-main">
                    <div className="rrl-activity">
                      {r.sourceActivityName ?? r.activityName ?? "Activity"}
                    </div>
                    <div className="rrl-meta">
                      {projectId == null && r.projectName && <span>{r.projectName}</span>}
                      <span>Paused {fmtPause(r.pauseMins)}</span>
                      <span>
                        {changes.length}{" "}
                        {changes.length === 1 ? "activity" : "activities"} to
                        reschedule
                      </span>
                      {r.createdAt && (
                        <span>{dayjs(r.createdAt).format("DD MMM YYYY, HH:mm")}</span>
                      )}
                    </div>
                    {r.reason && <div className="rrl-reason">{r.reason}</div>}
                  </div>
                  <button className="rrl-btn rrl-primary" onClick={() => setReviewing(r)}>
                    Review
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* previewRequest skips the dialog's own single-request fetch, so the
          exact request clicked is the one reviewed (not just the first one). */}
      <ResumeReviewDialog
        open={!!reviewing}
        projectId={reviewing?.projectId}
        previewRequest={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => {
          load();
          onChanged?.();
        }}
      />
    </div>
  );
};

export default ResumeRequestsList;
