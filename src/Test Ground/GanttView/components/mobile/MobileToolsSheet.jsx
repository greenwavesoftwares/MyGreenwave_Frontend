import React from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import BottomSheet from "../../../shared/BottomSheet";
import { useTheme } from "../../../useTheme";
import {
  ZOOM_CONFIGS,
  MIN_COL_WIDTH,
  MAX_COL_WIDTH,
} from "../../helpers/constants";

/**
 * Mobile "Gantt Options" bottom sheet:
 *   - Zoom level (Hours / Days / Weeks)
 *   - Column width slider
 *   - Legend
 */
export default function MobileToolsSheet({
  open,
  onClose,
  zoom,
  setZoom,
  colWidthPx,
  setColWidthPx,
}) {
  const { t } = useTheme();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Gantt Options"
      height="auto"
    >
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Zoom Level */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: t.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Zoom Level
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(ZOOM_CONFIGS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setZoom(key)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: `1.5px solid ${zoom === key ? t.primary : t.border}`,
                  background: zoom === key ? t.primaryBgSubtle : t.bgCard,
                  color: zoom === key ? t.primary : t.textSecondary,
                  fontFamily: "Sora,sans-serif",
                  fontSize: 13,
                  fontWeight: zoom === key ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column Width */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: t.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Column Width</span>
            <span
              style={{
                color: t.textSecondary,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {colWidthPx}px
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() =>
                setColWidthPx((p) => Math.max(p - 20, MIN_COL_WIDTH))
              }
              disabled={colWidthPx <= MIN_COL_WIDTH}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: `1px solid ${t.borderStrong}`,
                background: t.bgCard,
                color: t.textSecondary,
                fontFamily: "Sora,sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: colWidthPx <= MIN_COL_WIDTH ? 0.4 : 1,
              }}
            >
              <ZoomOut size={16} /> Narrower
            </button>
            <button
              onClick={() =>
                setColWidthPx((p) => Math.min(p + 20, MAX_COL_WIDTH))
              }
              disabled={colWidthPx >= MAX_COL_WIDTH}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: `1px solid ${t.borderStrong}`,
                background: t.bgCard,
                color: t.textSecondary,
                fontFamily: "Sora,sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: colWidthPx >= MAX_COL_WIDTH ? 0.4 : 1,
              }}
            >
              <ZoomIn size={16} /> Wider
            </button>
          </div>
        </div>

        {/* Legend */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: t.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Legend
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              padding: 12,
              background: t.bgSubtle,
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              fontSize: 12,
              color: t.textSecondary,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 18,
                  height: 7,
                  borderRadius: 2,
                  background: "#3B82F6",
                }}
              />
              Planned
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 18,
                  height: 7,
                  borderRadius: 2,
                  background: "#22C55E",
                  border: "1px dashed #15803D",
                }}
              />
              Actual
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 18,
                  height: 7,
                  borderRadius: 2,
                  background: "#EF4444",
                }}
              />
              Delayed
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: t.bgMuted,
                  border: `1px solid ${t.border}`,
                }}
              />
              Weekend
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 2, height: 14, background: t.danger }} />
              Today
            </span>
          </div>
        </div>

        {/* Done button */}
        <button
          onClick={onClose}
          style={{
            height: 46,
            border: "none",
            background: t.primary,
            color: t.textInverse,
            borderRadius: 10,
            fontFamily: "Sora,sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          Done
        </button>
      </div>
    </BottomSheet>
  );
}
