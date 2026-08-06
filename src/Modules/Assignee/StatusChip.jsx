import React from "react";
import {
  Clock,
  AlertCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Loader2,
  Rocket,
  ShieldCheck,
  Lock
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    Icon: Clock,
    bg: "#FDE68A",
    color: "#c35a1d",
    border: "#d79952",
  },
  "yet to start": {
  label: "Yet To Start",
  Icon: AlertCircle,
  bg: "#FEF3C7",      // Warning background
  color: "#B45309",   // Dark amber text
  border: "#F59E0B",  // Amber border
},
  "not ready": {
    label: "Not Ready",
    Icon: AlertCircle,
    bg: "#FEF3C7",
    color: "#B45309",
    border: "#FCD34D",
  },

  rejected: {
    label: "Rejected",
    Icon: XCircle,
    bg: "#FEE2E2",
    color: "#DC2626",
    border: "#FCA5A5",
  },

  paused: {
    label: "Paused",
    Icon: PauseCircle,
    bg: "#FFEDD5",
    color: "#C2410C",
    border: "#FDBA74",
  },

  running: {
    label: "Running",
    Icon: PlayCircle,
    bg: "#DBEAFE",
    color: "#1D4ED8",
    border: "#93C5FD",
    pulse: true,
  },

  completed: {
    label: "Completed",
    Icon: CheckCircle2,
    bg: "#DCFCE7",
    color: "#15803D",
    border: "#86EFAC",
  },

  published: {
    label: "Published",
    Icon: Rocket,
    bg: "#D1FAE5",
    color: "#065F46",
    border: "#6EE7B7",
  },

  loading: {
    label: "Loading",
    Icon: Loader2,
    bg: "#EDE9FE",
    color: "#7C3AED",
    border: "#DDD6FE",
    spin: true,
  },
  finished: {
    label: "Finished",
    Icon: ShieldCheck,
    bg: "#F0FDF4",
    color: "#166534",
    border: "#4ADE80",
  },
 ongoing: {
  label: "Ongoing",
  Icon: PlayCircle,
  bg: "#E8F1FF",
  color: "#2563EB",
  border: "#1D4ED8",
},
closed: {
  label: "Closed",
  Icon: Lock,
  bg: "#F1F5F9",
  color: "#475569",
  border: "#CBD5E1",
},
 
};

const StatusChip = ({ status = "pending" }) => {
  const config =
    STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;

  const Icon = config.Icon;

  return (
    <>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          background: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
          fontFamily: "'Sora', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <Icon
          size={14}
          style={{
            animation: config.spin
              ? "status-spin 1s linear infinite"
              : config.pulse
              ? "status-pulse 1.5s ease-in-out infinite"
              : "none",
          }}
        />

        {config.label}
      </div>

      <style>
        {`
          @keyframes status-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes status-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </>
  );
};

export default StatusChip;