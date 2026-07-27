import React from "react";
import { useTheme } from "../useTheme";
import { getStatusConfig } from "../helpers/statusConfig";
import SpinningIcon from "./SpinningIcon";
import PulsingIcon from "./PulsingIcon";

/**
 * Status pill for an activity row.
 * Automatically animates for statuses marked spin/pulse in config.
 */
export default function StatusBadge({ status }) {
  const { t } = useTheme();
  const cfg = getStatusConfig(status, t);
  const { Icon, label, bg, color, border, pulse, spin } = cfg;

  let IconElement;
  if (spin) {
    IconElement = <SpinningIcon Icon={Icon} size={11} color={color} />;
  } else if (pulse) {
    IconElement = <PulsingIcon Icon={Icon} size={11} color={color} />;
  } else {
    IconElement = <Icon size={11} color={color} strokeWidth={2.5} />;
  }

  return (
    <span
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
        transition: "all .15s",
      }}
    >
      {IconElement}
      <span>{label}</span>
    </span>
  );
}
