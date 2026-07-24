import React from "react";
import { UserX } from "lucide-react";
import { useTheme } from "../useTheme";
import { TONE_COLORS } from "../helpers/constants";

/**
 * Small circular chip showing a resource's initials/code with color tone.
 * Falls back to a UserX icon when empty.
 */
export default function ResChip({ code, tone, name, userId }) {
  const { t } = useTheme();

  const empty = {
    bg: t.bgMuted,
    color: t.textFaint,
    border: t.borderStrong,
  };

  const c = TONE_COLORS[tone] || empty;
  const title = [name, userId].filter(Boolean).join(" — ");
  const isEmpty = !code || code === "?";

  return (
    <span
      title={title || "No resource assigned"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: c.bg,
        color: c.color,
        border: `1.5px solid ${c.border}`,
        fontSize: 9,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: "Sora,sans-serif",
        cursor: title ? "help" : "default",
      }}
    >
      {isEmpty ? <UserX size={12} strokeWidth={2.5} /> : code}
    </span>
  );
}
