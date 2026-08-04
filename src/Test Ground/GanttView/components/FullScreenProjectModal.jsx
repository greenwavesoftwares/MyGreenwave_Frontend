import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../useTheme";
import { useResponsive } from "../../useResponsive";
import GanttView from "../index";

/**
 * Full-screen modal displaying a single project's Gantt view.
 * Reuses the main GanttView component with a filtered projects array.
 */
export default function FullScreenProjectModal({
  project,
  onClose,
  onOpenComments,
  onFeedback,
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();

  // Close on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (!project) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay || "rgba(0,0,0,0.55)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 16,
        fontFamily: "Sora, sans-serif",
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: isMobile ? 0 : 14,
          width: "100%",
          height: "100%",
          maxWidth: isMobile ? "100%" : "calc(100vw - 32px)",
          maxHeight: isMobile ? "100%" : "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: t.shadowXl,
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: isMobile ? "12px 14px" : "14px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: `linear-gradient(135deg, ${t.primaryBg} 0%, ${t.bgSubtle} 100%)`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.primary,
              color: t.textInverse,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {(project.project || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 14 : 15,
                color: t.textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project.project || "Untitled Project"}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span>{(project.rows || []).length} tasks</span>
              <span>•</span>
              <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
                {project.status || "draft"}
              </span>
              {project.po && (
                <>
                  <span>•</span>
                  <span>PO: {project.po}</span>
                </>
              )}
            </div>
          </div>

          <span
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              background: t.primaryBg,
              color: t.primary,
              border: `1px solid ${t.primaryBorder}`,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              flexShrink: 0,
            }}
          >
            Full View
          </span>

          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              width: 36,
              height: 36,
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
            <X size={18} />
          </button>
        </div>

        {/* Gantt body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <GanttView
            projects={[project]}
            onOpenComments={onOpenComments}
            onFeedback={onFeedback}
            isFullScreen={true}
          />
        </div>
      </div>
    </div>
  );
}
