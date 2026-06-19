import React, { useEffect, useMemo, useState } from "react";
import "./ProjectsInfo.css";
import activityTrackerApi from "../../Services/activityTrackerApi";
import dayjs from "dayjs";

/* =========================
   ICONS
========================= */

const BriefcaseIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <path d="M2 13h20" />
  </svg>
);

const DocIcon = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const RocketIcon = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8 1-2.5 1-2.5" />
    <path d="M12 15l-3-3a22 22 0 0 1 6.4-9.4 5 5 0 0 1 5 5A22 22 0 0 1 11 14l-3 3z" />
    <circle cx="15" cy="9" r="1.4" />
  </svg>
);

const SearchIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

const RefreshIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const PlusIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const LayerIcon = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M12 2 2 7l10 5 10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const CheckCircleIcon = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.3 2.3 4.7-5.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SubtaskIcon = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M5 3v10a4 4 0 0 0 4 4h10" />
    <path d="M15 13l4 4-4 4" />
  </svg>
);

const ClockIcon = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = (p) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EmptyIcon = (p) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
    <rect x="2" y="5" width="20" height="16" rx="2" />
    <path d="M2 10h20" strokeLinecap="round" />
    <path d="M7 15h4M7 18h6" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = (p) => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
  </svg>
);

/* =========================
   HELPERS
========================= */

function normalizeStatus(status) {
  const s = (status || "").toLowerCase();
  if (s === "draft") return "draft";
  return "published";
}

const TAB_DEFS = [
  { key: "all", label: "All Projects", icon: BriefcaseIcon },
  { key: "published", label: "Published", icon: RocketIcon },
];

export default function ProjectsInfo({ projectSelection }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectDetails = await activityTrackerApi.getProjectsByAssignee();
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
    const draft = projects.filter((p) => normalizeStatus(p.projectStatus) === "draft").length;
    const published = projects.filter((p) => normalizeStatus(p.projectStatus) === "published").length;
    return { all: projects.length, draft, published };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    let list = projects;
    if (activeTab !== "all") {
      list = list.filter((p) => normalizeStatus(p.projectStatus) === activeTab);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) =>
        [p.projectName, p.poNumber, p.siteCustomer]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return list;
  }, [projects, activeTab, query]);

  const renderBody = () => {
    if (loading) {
      return (
        <div className="pi-empty">
          <div className="pi-spinner" />
          <p className="pi-empty-title">Loading projects…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="pi-empty pi-empty--error">
          <ErrorIcon />
          <p className="pi-empty-title">{error}</p>
          <button className="pi-retry-btn" onClick={fetchProjects}>
            Try again
          </button>
        </div>
      );
    }

    if (visibleProjects.length === 0) {
      return (
        <div className="pi-empty">
          <EmptyIcon />
          <p className="pi-empty-title">No projects yet</p>
          <p className="pi-empty-sub">Projects you create will appear here.</p>
        </div>
      );
    }

    return (
      <div className="pi-grid">
        {visibleProjects.map((project, index) => {
          const status = normalizeStatus(project.projectStatus);
          const tags = project.tags ?? [project.group].filter(Boolean);
          return (
            <div
              className="pi-card"
              key={project.id ?? index}
              style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
              onClick={() => projectSelection && projectSelection(project)}
            >
              <span className={`pi-status pi-status--${status}`}>
                {status === "published" ? <RocketIcon /> : <DocIcon />}
                {status === "published" ? "PUBLISHED" : "DRAFT"}
              </span>

              <h3 className="pi-card-title">{project.projectName}</h3>

              <p className="pi-card-meta">
                PO: <strong>{project.poNumber}</strong>
                {project.siteCustomer ? <> &nbsp;·&nbsp; {project.siteCustomer}</> : null}
              </p>

              <div className="pi-chip-row">
                {project.moduleCount != null && (
                  <span className="pi-chip pi-chip--module">
                    <LayerIcon /> {project.moduleCount} module{project.moduleCount === 1 ? "" : "s"}
                  </span>
                )}
                {project.taskCount != null && (
                  <span className="pi-chip pi-chip--task">
                    <CheckCircleIcon /> {project.taskCount} task{project.taskCount === 1 ? "" : "s"}
                  </span>
                )}
                {project.subTaskCount != null && (
                  <span className="pi-chip pi-chip--sub">
                    <SubtaskIcon /> {project.subTaskCount} sub{project.subTaskCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {tags.length > 0 && (
                <div className="pi-tag-row">
                  {tags.map((tag, i) => (
                    <span className="pi-tag" key={i}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pi-card-footer">
                <span className="pi-card-date">
                  <ClockIcon />
                  {project.createdAt && dayjs(project.createdAt).isValid()
                    ? dayjs(project.createdAt).format("D MMM YYYY, HH:mm")
                    : "-"}
                </span>
                <span className="pi-open-link">
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
    <div className="pi-page container mx-auto">
      <div className="pi-tabs">
        {TAB_DEFS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`pi-tab ${activeTab === key ? "pi-tab--active" : ""} pi-tab--${key}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon />
            {label}
            <span className="pi-tab-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="pi-toolbar">
        <div className="pi-toolbar-title">
          <div className="pi-toolbar-icon">
            <BriefcaseIcon />
          </div>
          <div>
            <h2>Projects</h2>
            <p>{projects.length} project{projects.length === 1 ? "" : "s"} saved</p>
          </div>
        </div>

        <div className="pi-toolbar-actions">
          <div className="pi-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by project, PO, site…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="pi-refresh-btn" onClick={fetchProjects}>
            <RefreshIcon /> Refresh
          </button>
          <button className="pi-new-btn">
            <PlusIcon /> New Project
          </button>
        </div>
      </div>

      {renderBody()}
    </div>
  );
}
