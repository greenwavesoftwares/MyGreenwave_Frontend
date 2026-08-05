import React from "react";

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function getTaskStatusMeta(status) {
  const s = normalizeStatus(status);

  if (s === "running") {
    return {
      label: "Running",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.14)",
      borderColor: "rgba(34,197,94,0.4)",
      borderStyle: "solid",
      pulse: true,
      icon: null,
    };
  }

  if (s === "completed" || s === "finished") {
    return {
      label: s === "finished" ? "Finished" : "Completed",
      color: "#16a34a",
      bg: "rgba(34,197,94,0.14)",
      borderColor: "rgba(34,197,94,0.4)",
      borderStyle: "solid",
      pulse: false,
      icon: "✔",
    };
  }

  if (s === "paused") {
    return {
      label: "Paused",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.14)",
      borderColor: "rgba(245,158,11,0.45)",
      borderStyle: "dashed",
      pulse: false,
      icon: "⏸",
    };
  }

  return {
    label: status || "Unknown",
    color: "#94a3b8",
    bg: "transparent",
    borderColor: "rgba(148,163,184,0.35)",
    borderStyle: "solid",
    pulse: false,
    icon: "•",
  };
}

/**
 * Badge component showing task status
 */
function TaskStatusBadge({ status }) {
  const meta = getTaskStatusMeta(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 7px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        color: meta.color,
        background: meta.bg,
        border: `1px ${meta.borderStyle} ${meta.borderColor}`,
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
    >
      {meta.pulse ? (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: meta.color,
            display: "inline-block",
            animation: "wtStatusPulse 1s ease-in-out infinite",
            boxShadow: `0 0 0 2px ${meta.bg}`,
          }}
        />
      ) : (
        <span style={{ lineHeight: 1 }}>{meta.icon}</span>
      )}
      {meta.label}
    </span>
  );
}

export { normalizeStatus, getTaskStatusMeta, TaskStatusBadge as default };
