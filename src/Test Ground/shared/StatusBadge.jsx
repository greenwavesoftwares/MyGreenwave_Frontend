import React from "react";
import {
  Clock,
  CheckCircle2,
  Star,
  XCircle,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { getDisplayStatus } from "../helpers/statusDisplay";
import PulsingIcon from "./PulsingIcon";

export default function StatusBadge({ row, status: explicitStatus }) {
  const { t } = useTheme();

  const displayStatus = row
    ? getDisplayStatus(row)
    : String(explicitStatus || "Pending").trim();

  const normalized = displayStatus.toLowerCase();

  let bg, color, border, Icon, label;

  switch (normalized) {
    case "yet to start":
      bg = t.warningBgSubtle || "#FED7AA";
      color = "#C2410C";
      border = "#FDBA74";
      Icon = AlertCircle;
      label = "Yet to Start";
      break;

    // ── NEW: Pending Late ──
    case "pending late":
      bg = "#FEE2E2"; // red-100
      color = "#DC2626"; // red-600
      border = "#FCA5A5"; // red-300
      Icon = AlertTriangle;
      label = "Pending Late";
      break;

    case "running":
      bg = "#DBEAFE";
      color = "#1D4ED8";
      border = "#93C5FD";
      Icon = PlayCircle;
      label = "Running";
      break;

    // ── NEW: Running Late ──
    case "running late":
      bg = "#FEE2E2"; // red-100
      color = "#DC2626"; // red-600
      border = "#FCA5A5"; // red-300
      Icon = PlayCircle;
      label = "Running Late";
      break;

    case "paused":
      bg = t.bgMuted;
      color = t.textSecondary;
      border = t.borderStrong;
      Icon = PauseCircle;
      label = "Paused";
      break;

    case "completed":
      bg = t.successBg;
      color = t.success;
      border = t.successBorder;
      Icon = CheckCircle2;
      label = "Completed";
      break;

    case "finished":
      bg = t.violetBg;
      color = t.violet;
      border = t.violetBorder;
      Icon = Star;
      label = "Finished";
      break;

    case "rejected":
      bg = t.dangerBgSubtle;
      color = t.danger;
      border = t.dangerBorder;
      Icon = XCircle;
      label = "Rejected";
      break;

    case "pending":
    default:
      bg = t.warningBg;
      color = t.warning;
      border = t.warningBorder;
      Icon = Clock;
      label = "Pending";
      break;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        background: bg,
        color,
        border: `1px solid ${border}`,
        fontSize: 10.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {normalized === "running" || normalized === "running late" ? (
        <PulsingIcon Icon={PlayCircle} size={11} color={color} />
      ) : (
        <Icon size={11} />
      )}
      {label}
    </span>
  );
}
