import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "../useTheme";

/**
 * Slide-up bottom sheet for mobile.
 *
 * Props:
 *   open:          boolean — controls visibility
 *   onClose:       () => void
 *   title:         string — displayed in the drag handle area (optional)
 *   showCloseBtn:  boolean (default true)
 *   height:        "auto" | "full" | "90%" (default "90%")
 *   canDismiss:    boolean (default true) — allows drag-to-close and backdrop tap
 *   children:      content
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  showCloseBtn = true,
  height = "90%",
  canDismiss = true,
  contentScroll = true,
  children,
}) {
  const { t } = useTheme();
  const sheetRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle enter/exit animations
  useEffect(() => {
    if (open) {
      // Small delay so CSS transition kicks in
      setMounted(true);
      // Prevent body scroll while open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setMounted(false);
    }
  }, [open]);

  // Drag handlers
  const handleTouchStart = (e) => {
    if (!canDismiss) return;
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = startYRef.current;
    setDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!dragging || !canDismiss) return;
    currentYRef.current = e.touches[0].clientY;
    const delta = currentYRef.current - startYRef.current;
    // Only allow dragging down
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    // Close if dragged more than 100px
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  };

  // Compute sheet height
  const heightStyle =
    height === "full" ? "100dvh" : height === "auto" ? "auto" : height;

  if (!open) return null;

  return (
    <div
      onClick={(e) => canDismiss && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgSheetOverlay || "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        opacity: mounted ? 1 : 0,
        transition: "opacity .25s ease",
      }}
    >
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "95dvh",
          height: heightStyle,
          background: t.bgCard,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: `translateY(${mounted ? dragOffset : 100}%)`,
          transition: dragging
            ? "none"
            : "transform .3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 0)",
          fontFamily: "Sora,sans-serif",
          color: t.textPrimary,
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 6px",
            flexShrink: 0,
            cursor: canDismiss ? "grab" : "default",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 4,
              background: t.handleBar || t.borderStrong,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Title + close */}
        {(title || showCloseBtn) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 16px 12px",
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
            }}
          >
            {title && (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.textPrimary,
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </div>
            )}
            {showCloseBtn && (
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "none",
                  background: t.bgMuted,
                  color: t.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: contentScroll ? "auto" : "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
