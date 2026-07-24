/* ═══════════════════════════════════════════════════════
   Status configuration (theme-aware)
   ═══════════════════════════════════════════════════════ */

import {
  Clock, AlertCircle, XCircle, PauseCircle, PlayCircle,
  CheckCircle2, Loader2, ShieldCheck, HelpCircle,
} from "lucide-react";

export function makeStatusConfig(t) {
  return {
    pending: {
      label: "Pending",
      Icon: Clock,
      bg: t.bgSubtle,
      color: t.textMuted,
      border: t.border,
    },
    "not ready": {
      label: "Not Ready",
      Icon: AlertCircle,
      bg: t.warningBg,
      color: t.warning,
      border: t.warningBorder,
    },
    rejected: {
      label: "Rejected",
      Icon: XCircle,
      bg: t.dangerBg,
      color: t.danger,
      border: t.dangerBorder,
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
      bg: t.primaryBg,
      color: t.primary,
      border: t.primaryBorder,
      pulse: true,
    },
    completed: {
      label: "Completed",
      Icon: CheckCircle2,
      bg: t.successBg,
      color: t.success,
      border: t.successBorder,
    },
    loading: {
      label: "Loading",
      Icon: Loader2,
      bg: t.violetBg,
      color: t.violet,
      border: t.violetBorder,
      spin: true,
    },
    finished: {
      label: "Finished",
      Icon: ShieldCheck,
      bg: t.successBgSubtle,
      color: t.success,
      border: t.successBorder,
    },
    closed: {
      label: "Closed",
      Icon: XCircle,
      bg: t.closedBg,
      color: t.closedText,
      border: t.closedBorder,
    },
  };
}

export function getStatusConfig(status, t) {
  const CONFIG = makeStatusConfig(t);
  if (!status) return CONFIG.pending;
  const key = String(status).toLowerCase().trim();
  return (
    CONFIG[key] || {
      label: status,
      Icon: HelpCircle,
      bg: t.bgMuted,
      color: t.textFaint,
      border: t.border,
    }
  );
}