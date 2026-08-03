import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../useTheme";

/**
 * Dropdown toggler for showing/hiding Module, Resource, Status columns.
 * Task column is always visible (shown as disabled entry).
 */
export default function ColumnVisibilityDropdown({ visibleColumns, onToggle }) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalCount = 3; // module, resource, status
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const hasHidden = visibleCount < totalCount;

  const columns = [
    { key: "module", label: "Module" },
    { key: "resource", label: "Resource" },
    { key: "status", label: "Status" },
  ];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Show/hide columns"
        style={{
          height: 30,
          padding: "0 10px",
          borderRadius: 6,
          border: `1px solid ${hasHidden ? t.primary : t.borderStrong}`,
          background: hasHidden ? t.primaryBgSubtle : t.bgCard,
          color: hasHidden ? t.primary : t.textSecondary,
          fontFamily: "Sora,sans-serif",
          fontSize: 11.5,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {hasHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        Columns
        <span
          style={{
            padding: "1px 6px",
            borderRadius: 999,
            background: hasHidden ? t.primary : t.bgMuted,
            color: hasHidden ? t.textInverse : t.textMuted,
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          {visibleCount}/{totalCount}
        </span>
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            width: 200,
            background: t.bgCard,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 8,
            boxShadow: t.shadowLg,
            zIndex: 999,
            fontFamily: "Sora,sans-serif",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderBottom: `1px solid ${t.border}`,
              background: t.bgSubtle,
            }}
          >
            <span
              style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary }}
            >
              Show Columns
            </span>
          </div>

          {/* Task always visible */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: t.bgSubtle,
              opacity: 0.7,
              cursor: "not-allowed",
            }}
            title="Task column is always visible"
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `1.5px solid ${t.borderStrong}`,
                background: t.bgMuted,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: t.textMuted,
                fontSize: 10,
              }}
            >
              <Eye size={10} />
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                fontWeight: 500,
                flex: 1,
              }}
            >
              Task
            </span>
            <span style={{ fontSize: 9, color: t.textFaint }}>Always</span>
          </div>

          <div style={{ padding: "4px 0" }}>
            {columns.map((col) => {
              const isVisible = visibleColumns[col.key];
              return (
                <div
                  key={col.key}
                  onClick={() => onToggle(col.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: isVisible ? t.primaryBgSubtle : "transparent",
                    borderLeft: isVisible
                      ? `3px solid ${t.primary}`
                      : "3px solid transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isVisible)
                      e.currentTarget.style.background = t.bgSubtle;
                  }}
                  onMouseLeave={(e) => {
                    if (!isVisible)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${isVisible ? t.primary : t.borderStrong}`,
                      background: isVisible ? t.primary : t.bgCard,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: t.textInverse,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {isVisible && "✓"}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      color: t.textPrimary,
                      fontWeight: isVisible ? 600 : 400,
                      flex: 1,
                    }}
                  >
                    {col.label}
                  </span>
                  {isVisible ? (
                    <Eye size={12} color={t.primary} />
                  ) : (
                    <EyeOff size={12} color={t.textFaint} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
