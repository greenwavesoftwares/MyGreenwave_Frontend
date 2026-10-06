import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../useTheme";

/**
 * Dropdown toggler for showing/hiding columns.
 * Has a fixed header and a scrollable list body for handling many custom/standard columns.
 */
export default function ColumnVisibilityDropdown({
  visibleColumns,
  onToggle,
  customColumns = [],
}) {
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

  const standardColumns = [
    { key: "module", label: "Module" },
    { key: "resource", label: "Resource" },
    { key: "status", label: "Status" },
  ];

  const dateColumns = [
    { key: "plannedStart", label: "Planned Start" },
    { key: "plannedStop", label: "Planned Stop" },
    { key: "actualStart", label: "Actual Start" },
    { key: "actualStop", label: "Actual Stop" },
  ];

  const durationColumns = [
    { key: "plannedDuration", label: "Planned Dur(hrs)" },
    { key: "actualDuration", label: "Actual Dur(hrs)" },
  ];

  const customCols = customColumns.map((c) => ({
    key: c.id,
    label: c.name,
  }));

  const allToggleable = [
    ...standardColumns,
    ...dateColumns,
    ...durationColumns,
    ...customCols,
  ];
  const totalCount = allToggleable.length;
  const visibleCount = allToggleable.filter(
    (c) => visibleColumns[c.key],
  ).length;
  const hasHidden = visibleCount < totalCount;

  const renderColumnItem = (col, isAlwaysVisible = false) => {
    const isVisible = isAlwaysVisible || visibleColumns[col.key];
    return (
      <div
        key={col.key}
        onClick={() => !isAlwaysVisible && onToggle(col.key)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          cursor: isAlwaysVisible ? "not-allowed" : "pointer",
          background: isVisible ? t.primaryBgSubtle : "transparent",
          borderLeft: isVisible
            ? `3px solid ${t.primary}`
            : "3px solid transparent",
          opacity: isAlwaysVisible ? 0.7 : 1,
          transition: "background .1s",
        }}
        onMouseEnter={(e) => {
          if (!isVisible && !isAlwaysVisible)
            e.currentTarget.style.background = t.bgSubtle;
        }}
        onMouseLeave={(e) => {
          if (!isVisible && !isAlwaysVisible)
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
        {isAlwaysVisible ? (
          <span style={{ fontSize: 9, color: t.textFaint }}>Always</span>
        ) : isVisible ? (
          <Eye size={12} color={t.primary} />
        ) : (
          <EyeOff size={12} color={t.textFaint} />
        )}
      </div>
    );
  };

  const renderSectionLabel = (label) => (
    <div
      style={{
        padding: "6px 12px 3px",
        fontSize: 9,
        fontWeight: 700,
        color: t.textFaint,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        background: t.bgSubtle,
        borderTop: `1px solid ${t.border}`,
        marginTop: 2,
      }}
    >
      {label}
    </div>
  );

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
            width: 220,
            maxHeight: 380, // Lock max height
            display: "flex",
            flexDirection: "column",
            background: t.bgCard,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 8,
            boxShadow: t.shadowLg,
            zIndex: 999,
            fontFamily: "Sora,sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Header (stays fixed at top) */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: `1px solid ${t.border}`,
              background: t.bgSubtle,
              flexShrink: 0,
            }}
          >
            <span
              style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary }}
            >
              Show Columns
            </span>
          </div>

          {/* Scrollable List Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
            {/* Task — always visible */}
            {renderColumnItem({ key: "task", label: "Task" }, true)}

            {/* Standard columns */}
            {standardColumns.map((col) => renderColumnItem(col))}

            {/* Date columns */}
            {/* {renderSectionLabel("Date Columns")} */}
            {dateColumns.map((col) => renderColumnItem(col))}

            {/* Duration columns */}
            {/* {renderSectionLabel("Duration Columns")} */}
            {durationColumns.map((col) => renderColumnItem(col))}

            {/* Custom columns */}
            {customCols.length > 0 && (
              <>
                {renderSectionLabel("Custom Columns")}
                {customCols.map((col) => renderColumnItem(col))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
