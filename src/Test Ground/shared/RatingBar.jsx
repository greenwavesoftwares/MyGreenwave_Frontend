import React from "react";
import { useTheme } from "../useTheme";

/**
 * 1-10 rating bar with color gradient:
 *   1-3 = red, 4-5 = amber, 6-7 = blue, 8-10 = green.
 * Shows current value as a colored pill at the end.
 */
export default function RatingBar({
  value,
  hover,
  onChange,
  onHover,
  onLeave,
  disabled,
}) {
  const { t } = useTheme();

  const getColor = (rating) => {
    if (rating <= 3) return { fill: "#EF4444", border: "#FCA5A5" };
    if (rating <= 5) return { fill: "#F59E0B", border: "#FCD34D" };
    if (rating <= 7) return { fill: "#3B82F6", border: "#93C5FD" };
    return { fill: "#22C55E", border: "#86EFAC" };
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = n <= (disabled ? value : hover || value);
        const c = getColor(n);

        return (
          <button
            key={n}
            type="button"
            onClick={() => !disabled && onChange(n)}
            onMouseEnter={() => !disabled && onHover(n)}
            onMouseLeave={() => !disabled && onLeave()}
            disabled={disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1.5px solid ${active ? c.border : t.border}`,
              background: active ? c.fill : t.bgSubtle,
              color: active ? "#fff" : t.textFaint,
              fontSize: 11,
              fontWeight: 700,
              cursor: disabled ? "default" : "pointer",
              fontFamily: "Sora,sans-serif",
              transition: "all 0.12s",
              transform: active ? "scale(1.08)" : "scale(1)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {n}
          </button>
        );
      })}

      {value > 0 && (
        <span
          style={{
            marginLeft: 8,
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background:
              value <= 3
                ? "#FEE2E2"
                : value <= 5
                  ? "#FEF3C7"
                  : value <= 7
                    ? "#DBEAFE"
                    : "#DCFCE7",
            color:
              value <= 3
                ? "#DC2626"
                : value <= 5
                  ? "#B45309"
                  : value <= 7
                    ? "#1D4ED8"
                    : "#15803D",
            border: `1px solid ${
              value <= 3
                ? "#FCA5A5"
                : value <= 5
                  ? "#FCD34D"
                  : value <= 7
                    ? "#93C5FD"
                    : "#86EFAC"
            }`,
          }}
        >
          {value}/10
        </span>
      )}
    </div>
  );
}
