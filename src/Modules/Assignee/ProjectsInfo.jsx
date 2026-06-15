import React, { useEffect, useState } from "react";
import "./ProjectsInfo.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import activityTrackerApi from "../../Services/activityTrackerApi";
import dayjs from "dayjs";

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getStatusClass(status) {
  switch (status.toLowerCase()) {
    case "active":
      return "status-active";
    case "pending":
      return "status-pending";
    case "closed":
      return "status-closed";
    default:
      return "";
  }
}

function getUserInitials(username) {
  return username
    .split(".")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CalendarIcon = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const BuildingIcon = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 21h18M9 21V9l6-6v18" />
  </svg>
);

const EmptyIcon = () => (
  <svg
    width="48"
    height="48"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.2"
  >
    <rect x="2" y="5" width="20" height="16" rx="2" />
    <path d="M2 10h20" strokeLinecap="round" />
    <path d="M7 15h4M7 18h6" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    width="48"
    height="48"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
  </svg>
);

export default function ProjectsInfo({ projectSelection }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading projects…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="empty-state empty-state--error">
          <ErrorIcon />
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchProjects}>
            Try again
          </button>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="empty-state">
          <EmptyIcon />
          <p className="empty-title">No projects yet</p>
          <p className="empty-sub">Projects you create will appear here.</p>
        </div>
      );
    }

    return (
      <Table className="project-table">
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>PO No</TableCell>
            <TableCell>Site / Customer</TableCell>
            <TableCell>Group</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow
              key={project.id ?? index}
              hover
              onClick={() => projectSelection(project)}
            >
              <TableCell>
                <div className="cell-project">
                  <div
                    className={`project-avatar avatar-${project.avatarColor}`}
                  >
                    {getInitials(project.projectName)}
                  </div>
                  <span className="project-name">{project.projectName}</span>
                </div>
              </TableCell>

              <TableCell>
                <span className="po-number">{project.poNumber}</span>
              </TableCell>

              <TableCell>
                <div className="site-customer">
                  <BuildingIcon />
                  {project.siteCustomer}
                </div>
              </TableCell>

              <TableCell>
                <span className={`group-pill group-${project.groupVariant}`}>
                  {project.group}
                </span>
              </TableCell>

              <TableCell>
                <span
                  className={`status-badge ${getStatusClass(project.projectStatus)}`}
                >
                  <span className="dot" />
                  {project.projectStatus}
                </span>
              </TableCell>

              <TableCell>
                <div className="created-by">
                  <div className={`user-dot userdot-${project.avatarColor}`}>
                    {getUserInitials(project.createdBy)}
                  </div>
                  {project.createdBy}
                </div>
              </TableCell>

              <TableCell>
                <div className="created-at">
                  <CalendarIcon />
                  {project.createdAt && dayjs(project.createdAt).isValid()
                    ? dayjs(project.createdAt).format("YYYY-MM-DD HH:mm")
                    : "-"}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="projects-page">
      <div className="card">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="5"
                  stroke="#38a169"
                  strokeWidth="1.5"
                />
                <path
                  d="M3.5 6l2 2 3-3"
                  stroke="#38a169"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            Projects
          </div>

          {!loading && !error && (
            <div className="record-count">{projects.length} records</div>
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
