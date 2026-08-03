import React from "react";
import { Menu, Calendar, Users, Sliders, Link2 } from "lucide-react";
import { useTheme } from "../../useTheme";

/**
 * Compact mobile toolbar with view toggle, today jump, tools sheet.
 */
export default function GanttMobileToolbar({
  viewMode,
  setViewMode,
  showDependencies,
  setShowDependencies,
  onOpenTaskList,
  onJumpToToday,
  onOpenTools,
  todayEnabled,
}) {
  const { t } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 10px",
        borderBottom: `1px solid ${t.border}`,
        background: t.bgSubtle,
        flexShrink: 0,
      }}
    >
      {/* Left panel toggle */}
      <button
        onClick={onOpenTaskList}
        title="Show task list"
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1px solid ${t.borderStrong}`,
          background: t.bgCard,
          color: t.textSecondary,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Menu size={16} />
      </button>

      {/* View mode toggle (compact) */}
      <div
        style={{
          display: "flex",
          background: t.bgMuted,
          borderRadius: 8,
          padding: 3,
        }}
      >
        {[
          { key: "task", icon: <Calendar size={14} />, label: "Project" },
          { key: "resource", icon: <Users size={14} />, label: "Resource" },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            title={v.label}
            style={{
              width: 34,
              height: 32,
              borderRadius: 6,
              border: "none",
              background: viewMode === v.key ? t.bgCard : "transparent",
              color: viewMode === v.key ? t.primary : t.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: viewMode === v.key ? t.shadowSm : "none",
            }}
          >
            {v.icon}
          </button>
        ))}
      </div>

      {/* Jump to today */}
      <button
        onClick={onJumpToToday}
        disabled={!todayEnabled}
        title="Jump to today"
        style={{
          height: 38,
          padding: "0 12px",
          borderRadius: 8,
          border: `1px solid ${t.dangerBorder}`,
          background: t.dangerBgSubtle,
          color: t.danger,
          cursor: todayEnabled ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          fontWeight: 700,
          fontFamily: "Sora,sans-serif",
          flexShrink: 0,
          opacity: todayEnabled ? 1 : 0.5,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: t.danger,
          }}
        />
        Today
      </button>

      {/* Dependencies quick toggle */}
      <button
        onClick={() => setShowDependencies((p) => !p)}
        title={showDependencies ? "Hide dependencies" : "Show dependencies"}
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1px solid ${showDependencies ? t.primary : t.borderStrong}`,
          background: showDependencies ? t.primary : t.bgCard,
          color: showDependencies ? t.textInverse : t.textSecondary,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Link2 size={16} />
      </button>

      {/* Tools/Settings button */}
      <button
        onClick={onOpenTools}
        title="More options"
        style={{
          marginLeft: "auto",
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1px solid ${t.borderStrong}`,
          background: t.bgCard,
          color: t.textSecondary,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Sliders size={16} />
      </button>
    </div>
  );
}
