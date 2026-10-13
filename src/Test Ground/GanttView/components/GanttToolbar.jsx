import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Calendar,
  Users,
  Download,
  Link2,
  Activity,
} from "lucide-react"; // ← Add Download
import { useTheme } from "../../useTheme";
import {
  ZOOM_CONFIGS,
  MIN_COL_WIDTH,
  MAX_COL_WIDTH,
} from "../helpers/constants";
import ColumnVisibilityDropdown from "./ColumnVisibilityDropdown";

export default function GanttToolbar({
  viewMode,
  setViewMode,
  zoom,
  setZoom,
  colWidthPx,
  setColWidthPx,
  visibleColumns,
  toggleColumn,
  customColumns = [],
  showDependencies,
  setShowDependencies,
  isFullScreen, // ← NEW
  onDownloadExcel, // ← NEW
}) {
  const { t } = useTheme();

  const btnStyle = {
    height: 30,
    padding: "0 12px",
    borderRadius: 6,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderBottom: `1px solid ${t.border}`,
        background: t.bgSubtle,
        flexShrink: 0,
        flexWrap: "wrap",
      }}
    >
      {/* View Toggle */}
      <div
        style={{
          display: "flex",
          background: t.bgMuted,
          borderRadius: 7,
          padding: 2,
          gap: 2,
        }}
      >
        {[
          { key: "task", label: "Project View", icon: <Calendar size={13} /> },
          {
            key: "resource",
            label: "Resource View",
            icon: <Users size={13} />,
          },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            style={{
              ...btnStyle,
              background: viewMode === v.key ? t.bgCard : "transparent",
              border: "none",
              color: viewMode === v.key ? t.textPrimary : t.textMuted,
              fontWeight: viewMode === v.key ? 700 : 500,
              boxShadow: viewMode === v.key ? t.shadowSm : "none",
            }}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 20, background: t.border }} />

      {/* Zoom Level */}
      <div
        style={{
          display: "flex",
          background: t.bgMuted,
          borderRadius: 7,
          padding: 2,
          gap: 2,
        }}
      >
        {Object.entries(ZOOM_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setZoom(key)}
            style={{
              ...btnStyle,
              background: zoom === key ? t.bgCard : "transparent",
              border: "none",
              color: zoom === key ? t.textPrimary : t.textMuted,
              fontWeight: zoom === key ? 700 : 500,
              boxShadow: zoom === key ? t.shadowSm : "none",
              padding: "0 10px",
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setColWidthPx((p) => Math.max(p - 20, MIN_COL_WIDTH))}
        style={btnStyle}
        title="Zoom out"
      >
        <ZoomOut size={13} />
      </button>
      <button
        onClick={() => setColWidthPx((p) => Math.min(p + 20, MAX_COL_WIDTH))}
        style={btnStyle}
        title="Zoom in"
      >
        <ZoomIn size={13} />
      </button>

      <div style={{ width: 1, height: 20, background: t.border }} />
      {false && (
        <>
          <button
            onClick={() => setShowDependencies((p) => !p)}
            title={
              showDependencies
                ? "Hide dependency arrows"
                : "Show dependency arrows"
            }
            style={{
              ...btnStyle,
              background: showDependencies ? t.primary : t.bgCard,
              color: showDependencies ? t.textInverse : t.textSecondary,
              borderColor: showDependencies ? t.primary : t.borderStrong,
              fontWeight: showDependencies ? 700 : 500,
            }}
          >
            <Link2 size={13} />
            Dependencies {showDependencies ? "ON" : "OFF"}
          </button>

          <div style={{ width: 1, height: 20, background: t.border }} />
        </>
      )}
      <ColumnVisibilityDropdown
        visibleColumns={visibleColumns}
        onToggle={toggleColumn}
        customColumns={customColumns}
      />

      {/* ── NEW: Export Button (Only in Full Screen) ── */}
      {isFullScreen && (
        <>
          <div
            style={{
              width: 1,
              height: 20,
              background: t.border,
              marginLeft: "auto",
            }}
          />
          <button
            onClick={onDownloadExcel}
            style={{
              ...btnStyle,
              background: t.primaryBgSubtle,
              color: t.primary,
              borderColor: t.primaryBorder,
              fontWeight: 700,
            }}
            title="Download colored Excel timeline"
          >
            <Download size={13} /> Export Excel
          </button>
        </>
      )}
    </div>
  );
}
