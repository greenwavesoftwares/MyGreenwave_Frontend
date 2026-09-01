import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ProjectsInfo.css";
import activityTrackerApi from "../../Services/activityTrackerApi";
import dayjs from "dayjs";
import StatusChip from "./StatusChip";
import {
  Lock,
  Rocket,
  Star,
  Filter as FilterIcon,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  X as XIcon,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AssignerFeedback from "./AssignerFeedback";
import { getUserData } from "../Login/Encrypt";
import { showToast } from "./toastService";
/* =========================
   ICONS
========================= */

const BriefcaseIcon = (p) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <path d="M2 13h20" />
  </svg>
);

const DocIcon = (p) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const SearchIcon = (p) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);
const RocketIcon = (props) => <Rocket size={16} strokeWidth={2} {...props} />;
const RefreshIcon = (p) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const PlusIcon = (p) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    {...p}
  >
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const LayerIcon = (p) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M12 2 2 7l10 5 10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const CheckCircleIcon = (p) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <circle cx="12" cy="12" r="9" />
    <path
      d="M8.5 12.5l2.3 2.3 4.7-5.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SubtaskIcon = (p) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M5 3v10a4 4 0 0 0 4 4h10" />
    <path d="M15 13l4 4-4 4" />
  </svg>
);

const UserIcon = (p) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClockIcon = (p) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = (p) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    {...p}
  >
    <path
      d="M5 12h14M13 6l6 6-6 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EmptyIcon = (p) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    {...p}
  >
    <rect x="2" y="5" width="20" height="16" rx="2" />
    <path d="M2 10h20" strokeLinecap="round" />
    <path d="M7 15h4M7 18h6" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = (p) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    {...p}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
  </svg>
);
const LockIcon = (props) => <Lock size={14} strokeWidth={2} {...props} />;
/* =========================
   HELPERS
========================= */

function normalizeStatus(status) {
  const s = (status || "").toLowerCase();
  if(s==='finished')
    return 'published'
  return s;
}

const TAB_DEFS = [
  { key: "all", label: "All Projects", icon: BriefcaseIcon },

  { key: "published", label: "Published", icon: RocketIcon },
  { key: "closed", label: "Closed", icon: LockIcon },
];

// Must match AssignerFeedback's OVERALL_KEY — the overall rating/remark
// is stored as just another entry (categoryId: "overall") inside the
// `entries` list, not a separate field. Matches the PUT/GET wire format.
const OVERALL_KEY = "overall";

// Hardcoded until the manager-feedback API is ready. Mirrors the exact
// shape of GET /activityTracker/feedback/:projectId:
// { userId, projectId, submittedAt, assigners: [{assignerId, name, role}],
//   feedback: [{assignerId, entries: [{categoryId, rating, remark}]}] }
// TODO: swap for a real activityTrackerApi.getAssignerFeedback(projectId)
// call once that endpoint is live — see openFeedback below for wiring.
const HARDCODED_FEEDBACK_RESPONSE = {
  assigners: [
    {
      assignerId: "avrajit.roy@greenwave.co.in",
      name: "Avrajit Roy",
      role: "assigner",
    },
    {
      assignerId: "sreepriya.roy@greenwave.co.in",
      name: "Sreepriya Roy",
      role: "co-assigner",
    },
  ],
  feedback: [
    {
      assignerId: "avrajit.roy@greenwave.co.in",
      entries: [
        { categoryId: "communication", rating: 5, remark: "Done fabulously" },
        { categoryId: OVERALL_KEY, rating: 5, remark: "Done Fabulously" },
      ],
    },
  ],
};

/* =========================
   DATE FILTER (Projects toolbar)
========================= */

// Bucket keys for the "created" date quick-filter, offered via the
// filter icon in the toolbar. "Custom" reveals an inline range
// calendar instead of a fixed bucket.
const PROJECT_DATE_BUCKETS = [
  { key: "currentMonth", text: "Current Month", sub: "This calendar month", icon: CalendarDays },
  { key: "last3Months", text: "Last 3 Months", sub: "Rolling 90 days", icon: CalendarClock },
  { key: "custom", text: "Custom Range", sub: "Pick exact dates", icon: CalendarRange },
];

/**
 * Toolbar filter icon + dropdown for narrowing the project list by
 * "created" date. Visually matches the app's other filter popups
 * (opaque surface via --dropdownBG, same header/option chrome as the
 * Activities table's column filters) but is self-contained here since
 * it isn't attached to a table column/header and doesn't need that
 * component's portal-positioning logic — a plain absolutely positioned
 * dropdown anchored to its own wrapper is enough for a toolbar button.
 *
 * "Custom Range" swaps in an inline two-date range calendar
 * (react-datepicker, already used elsewhere in this app) instead of
 * raw <input type="date"> fields — click a start day, then an end day,
 * and the whole range highlights as you go, which reads far more
 * clearly than two disconnected date boxes.
 */
function ProjectDateFilterButton({ mode, onModeChange, customFrom, customTo, onCustomChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const isActive =
    mode === "currentMonth" ||
    mode === "last3Months" ||
    (mode === "custom" && customFrom && customTo);

  const selectBucket = (key) => {
    if (key === "custom") {
      onModeChange("custom");
      return;
    }
    onModeChange(key === mode ? null : key);
  };

  const handleClear = () => {
    onModeChange(null);
    onCustomChange(null, null);
  };

  const rangeLabel =
    customFrom && customTo
      ? `${dayjs(customFrom).format("D MMM YYYY")} – ${dayjs(customTo).format("D MMM YYYY")}`
      : customFrom
        ? `${dayjs(customFrom).format("D MMM YYYY")} – …`
        : "Select a start and end date";

  return (
    <div className="proj-date-filter" ref={wrapperRef}>
      <button
        type="button"
        className={`proj-date-filter-btn${isActive ? " proj-date-filter-btn--active" : ""}`}
        onClick={() => setOpen((p) => !p)}
        title="Filter by date"
      >
        <FilterIcon size={14} />
        Date
        {isActive && <span className="proj-date-filter-dot" />}
      </button>

      {open && (
        <div
          className={`proj-date-filter-panel${mode === "custom" ? " proj-date-filter-panel--wide" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="proj-date-filter-panel__header">
            <span>Filter by created date</span>
            {isActive && (
              <button type="button" className="proj-date-filter-panel__clear" onClick={handleClear}>
                <XIcon size={11} /> Clear
              </button>
            )}
          </div>

          <div className="proj-date-filter-panel__list">
            {PROJECT_DATE_BUCKETS.map(({ key, text, sub, icon: Icon }) => {
              const checked = mode === key;
              return (
                <div
                  key={key}
                  className={`proj-date-filter-option${checked ? " proj-date-filter-option--checked" : ""}`}
                  onClick={() => selectBucket(key)}
                >
                  <span className="proj-date-filter-option__icon">
                    <Icon size={15} />
                  </span>
                  <span className="proj-date-filter-option__text">
                    <span className="proj-date-filter-option__label">{text}</span>
                    <span className="proj-date-filter-option__sub">{sub}</span>
                  </span>
                  <span
                    className={`proj-date-filter-option__radio${checked ? " proj-date-filter-option__radio--checked" : ""}`}
                  />
                </div>
              );
            })}
          </div>

          {mode === "custom" && (
            <div className="proj-date-filter-panel__custom">
              <div className="proj-date-filter-panel__custom-label">
                <CalendarRange size={13} />
                {rangeLabel}
              </div>
              <DatePicker
                selectsRange
                inline
                monthsShown={1}
                startDate={customFrom}
                endDate={customTo}
                onChange={(update) => {
                  const [start, end] = update;
                  onCustomChange(start, end);
                }}
                calendarStartDay={1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectsInfo({ projectSelection }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  // "created" date filter: mode is null | "currentMonth" | "last3Months" |
  // "custom"; customFrom/customTo (Date objects, from the inline range
  // calendar) only apply when mode === "custom".
  const [dateFilterMode, setDateFilterMode] = useState(null);
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  // Project currently open in the "rate your managers" dialog, or null.
  const [feedbackProject, setFeedbackProject] = useState(null);
  // projectId of the card whose feedback (ratings + assigners) is
  // currently being fetched — drives the spinner on that card's star
  // button so only the clicked card shows a loading state, not every
  // card at once.
  const [feedbackLoadingId, setFeedbackLoadingId] = useState(null);

  // Normalizes assigner data into the { assignerId, name, role } shape
  // AssignerFeedback expects, and excludes the current user (nobody
  // should be able to rate themselves even if they show up in their own
  // assigner/co-assigner list). Prefers the feedback response's own
  // `assigners` array (the new API shape); falls back to reconstructing
  // it from a project record's assignerId/assignerName/coAssigners
  // fields for projects where no feedback has been fetched yet.
  const normalizeAssigners = (source) => {
    if (!source) return [];

    let managers = [];

    if (Array.isArray(source.assigners) && source.assigners.length > 0) {
      managers = source.assigners.map((a) => ({
        assignerId: a.assignerId,
        name: a.name,
        role: a.role ?? "assigner",
      }));
    } else {
      if (source.assignerId || source.assignerName) {
        managers.push({
          assignerId: source.assignerId ?? "assigner",
          name: source.assignerName ?? "Assigner",
          role: "assigner",
        });
      }
      const coAssigners = source.coAssigners ?? [];
      coAssigners.forEach((co, i) => {
        managers.push({
          assignerId: co.assignerId ?? co.userId ?? `co_assigner_${i}`,
          name: co.name ?? co.userName ?? `Co-assigner ${i + 1}`,
          role: "co-assigner",
        });
      });
    }

    const currentUserId = getUserData()?.userDetails?.userId?.toLowerCase();
    return managers.filter(
      (m) => m.assignerId?.toLowerCase() !== currentUserId,
    );
  };

  const openFeedback = async(e, project) => {
    // Card itself is clickable (drills into the project) — stop that
    // from firing when the star is what was actually clicked.
    e.stopPropagation();

    // Guard against double-clicks firing a second fetch while the
    // first is still in flight.
    if (feedbackLoadingId) return;

    setFeedbackLoadingId(project.projectId);
    try {
      // TODO: swap for a real
      // activityTrackerApi.getAssignerFeedback(project.projectId) call
      // once GET /activityTracker/feedback/:projectId is live. Response
      // shape: { userId, projectId, submittedAt, assigners, feedback }.
      const userid=getUserData()?.userDetails?.userId;
      const response = await activityTrackerApi.getAssignerRatings(userid,project.projectId);
      const responseAssigners=await activityTrackerApi.getAssigneeAssignerInfoByProjectId(project.projectId)

      const currentUserId = getUserData()?.userDetails?.userId?.toLowerCase();

      const assigners=(responseAssigners ?? []).filter(
        (m) => m.id?.toLowerCase() !== currentUserId,
      );
      console.log("Assigner after filteration::",assigners)

      // Nobody left to rate once you exclude yourself — surface it as
      // an error instead of opening an empty feedback dialog.
      if (assigners.length === 0) {
        showToast(
          "error",
          "No assigners to rate",
          "There are no other assigners on this project apart from yourself.",
        );
        return;
      }

      setFeedbackProject({
        projectId: project.projectId,
        projectName: project.projectName,
        assigners: assigners,
        feedback: response?.feedback ?? [],
      });
    } catch (err) {
      console.error("Failed to load assigner feedback:", err);
      showToast(
        "error",
        "Error",
        "Unable to load feedback for this project. Please try again.",
      );
    } finally {
      setFeedbackLoadingId(null);
    }
  };


  const closeFeedback = () => setFeedbackProject(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectDetails = await activityTrackerApi.getProjectsByAssignee();
      if (projectDetails?.[0]) {
        console.log("Project details::", projectDetails[0]);
        projectDetails[0].assignerId = "avrajit.roy@greenwave.co.in";
        projectDetails[0].assignerName = "Avrajit Roy";
        projectDetails[0].coAssigners = [
          { userId: "ashok.singh@greenwave.co.in", userName: "Ashok Singh" },
        ];
      }
      setProjects(projectDetails ?? []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Unable to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const counts = useMemo(() => {
    const published = projects.filter(
      (p) => normalizeStatus(p.projectStatus) === "published",
    ).length;
    const closed = projects.filter(
      (p) => normalizeStatus(p.projectStatus) === "closed",
    ).length;
    return { all: projects.length, published, closed };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    let list = projects;
    if (activeTab !== "all") {
      list = list.filter((p) => normalizeStatus(p.projectStatus) === activeTab);
    }
    console.log("active tab::", activeTab);
    console.log("List:", list);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) =>
        [p.projectName, p.poNumber, p.siteCustomer]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (dateFilterMode) {
      const now = dayjs();
      list = list.filter((p) => {
        if (!p.createdAt) return false;
        const created = dayjs(p.createdAt);
        if (!created.isValid()) return false;

        if (dateFilterMode === "currentMonth") {
          return created.isSame(now, "month");
        }
        if (dateFilterMode === "last3Months") {
          const start = now.subtract(3, "month").startOf("day");
          return (
            (created.isAfter(start) || created.isSame(start)) &&
            (created.isBefore(now) || created.isSame(now, "day"))
          );
        }
        if (dateFilterMode === "custom") {
          if (!customFrom && !customTo) return true;
          const from = customFrom ? dayjs(customFrom).startOf("day") : null;
          const to = customTo ? dayjs(customTo).endOf("day") : null;
          if (from && created.isBefore(from)) return false;
          if (to && created.isAfter(to)) return false;
          return true;
        }
        return true;
      });
    }
    return list;
  }, [projects, activeTab, query, dateFilterMode, customFrom, customTo]);

  const renderBody = () => {
    if (loading) {
      return (
        <div className="proj-empty">
          <div className="proj-spinner" />
          <p className="proj-empty-title">Loading projects…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="proj-empty proj-empty--error">
          <ErrorIcon />
          <p className="proj-empty-title">{error}</p>
          <button className="proj-retry-btn" onClick={fetchProjects}>
            Try again
          </button>
        </div>
      );
    }

    if (visibleProjects.length === 0) {
      return (
        <div className="proj-empty">
          <EmptyIcon />
          <p className="proj-empty-title">No projects yet</p>
          <p className="proj-empty-sub">
            Projects assigned to you will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="proj-grid">
        {visibleProjects.map((project, index) => {
          const status = normalizeStatus(project.projectStatus);
          const tags = project.groupNames;
          return (
            <div
              className="proj-card"
              key={project.id ?? index}
              style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
              onClick={() => projectSelection && projectSelection(project)}
            >
              <span className="proj-card-top-row">
                <StatusChip status={status} />
                
                {project.projectStatus==='closed'&&<button
                  type="button"
                  className="icon-button icon-btn--feedback"
                  title="Rate managers"
                  onClick={(e) => openFeedback(e, project)}
                  disabled={feedbackLoadingId === project.projectId}
                >
                  {feedbackLoadingId === project.projectId ? (
                    <span className="proj-btn-spinner" />
                  ) : (
                    <Star className="send-icon" size={15} strokeWidth={2} />
                  )}
                </button>
        }
              </span>
              <h3 className="proj-card-title">{project.projectName}</h3>

              <p className="proj-card-meta">
                PO: <strong>{project.poNumber}</strong>
                {project.siteCustomer ? (
                  <> &nbsp;·&nbsp; {project.siteCustomer}</>
                ) : null}
              </p>

              <div className="proj-chip-row">
                {project.moduleCount != null && (
                  <span className="proj-chip proj-chip--module">
                    <LayerIcon /> {project.moduleCount} module
                    {project.moduleCount === 1 ? "" : "s"}
                  </span>
                )}
                {project.activityCount != null && (
                  <span className="proj-chip proj-chip--task">
                    <CheckCircleIcon /> {project.activityCount} task
                    {project.activityCount === 1 ? "" : "s"}
                  </span>
                )}
                {project.subTaskCount != null && (
                  <span className="proj-chip proj-chip--sub">
                    <SubtaskIcon /> {project.subTaskCount} sub
                    {project.subTaskCount === 1 ? "" : "s"}
                  </span>
                )}
                {project.myTaskCount != null && (
                  <span
                    className="proj-chip proj-chip--mine"
                    title="Your pending tasks / total assigned to you"
                  >
                    <span className="proj-chip-segment proj-chip-segment--pending">
                      <ClockIcon />
                      <span className="proj-chip-segment-count">
                        {project.myNotCompletedCount ?? 0}
                        
                      </span>
                      <span className="proj-chip-segment-label">Not Completed</span>
                    </span>
                    <span className="proj-chip-segment proj-chip-segment--total">
                      <UserIcon />
                      <span className="proj-chip-segment-count">
                        {project.myTaskCount}
                        
                      </span>
                      <span className="proj-chip-segment-label">Assigned</span>
                    </span>
                  </span>
                 )} 
              </div>

              {tags.length > 0 && (
                <div className="proj-tag-row">
                  {tags.map((tag, i) => (
                    <span className="proj-tag" key={i}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="proj-card-footer">
                <span className="proj-card-date">
                  <ClockIcon />
                  {project.createdAt && dayjs(project.createdAt).isValid()
                    ? dayjs(project.createdAt).format("D MMM YYYY, HH:mm")
                    : "-"}
                </span>
                <span className="proj-open-link">
                  Open <ArrowIcon />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="proj-page ">
      <div className="proj-tabs">
        {TAB_DEFS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`proj-tab ${activeTab === key ? "proj-tab--active" : ""} proj-tab--${key}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon />
            {label}
            <span className="proj-tab-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="proj-toolbar">
        <div className="proj-toolbar-title">
          <div className="proj-toolbar-icon">
            <BriefcaseIcon />
          </div>
          <div>
            <div className="proj-header">Projects</div>
            <div className="proj-header-saved">
              {projects.length} project{projects.length === 1 ? "" : "s"} saved
            </div>
          </div>
        </div>

        <div className="proj-toolbar-actions">
          <div className="proj-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by project, PO, site…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ProjectDateFilterButton
            mode={dateFilterMode}
            onModeChange={setDateFilterMode}
            customFrom={customFrom}
            customTo={customTo}
            onCustomChange={(from, to) => {
              setCustomFrom(from);
              setCustomTo(to);
            }}
          />
          <button
            className="proj-refresh-btn"
            onClick={fetchProjects}
            disabled={loading}
          >
            {loading ? <span className="proj-btn-spinner" /> : <RefreshIcon />}{" "}
            Refresh
          </button>
        </div>
      </div>

      {renderBody()}

      {feedbackProject && (
        <AssignerFeedback
          open={!!feedbackProject}
          onClose={closeFeedback}
          projectId={feedbackProject.projectId}
          assigners={feedbackProject.assigners}
          feedback={feedbackProject.feedback}
          onSubmit={async (payload) => {
            // TODO: swap for activityTrackerApi.submitAssignerFeedback(payload)
            // once PUT /activityTracker/feedback is live. `payload` already
            // matches that endpoint's expected body:
            // { userId, projectId, submittedAt, feedback: [{assignerId, entries}] }
            //
            // Awaited (and not wrapped in try/catch) on purpose: AssignerFeedback
            // itself awaits this handler, shows its own loading/success state,
            // and catches a thrown/rejected error to show the failure message —
            // so this just needs to do the request and let errors bubble up.
            // Also intentionally does NOT call closeFeedback() here — the dialog
            // shows its own "Feedback submitted" success screen and closes via
            // its Done button, so closing it out from under the user the moment
            // the request resolves would skip that confirmation.
            await activityTrackerApi.createAssignerRating(payload);
            console.log("Manager feedback submitted:", payload);
          }}
        />
      )}
    </div>
  );
}
