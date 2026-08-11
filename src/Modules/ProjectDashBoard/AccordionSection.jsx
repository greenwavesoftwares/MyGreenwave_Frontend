import React, { useState } from "react";

/**
 * Accordion section that can be expanded/collapsed.
 * Only the arrow button toggles the accordion.
 */
function AccordionSection({
  title,
  defaultOpen = true,
  children,
  t = {},
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: t.accBg,
        borderRadius: 14,
        border: `1px solid ${t.accBorder}`,
        marginTop: 16,
        overflow: "hidden",
        transition: "background 0.2s",
      }}
    >
      {/* Header is not clickable */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "14px 18px",
          background: "transparent",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: t.accTitle,
            minWidth: 0,
          }}
        >
          {title}
        </span>

        {/* Only this button opens/closes the accordion */}
        <button
          type="button"
          aria-label={open ? "Collapse section" : "Expand section"}
          aria-expanded={open}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((currentOpen) => !currentOpen);
          }}
          style={{
            width: 28,
            height: 28,
            padding: 0,
            border: "none",
            borderRadius: 6,
            background: "transparent",
            color: t.accChevron,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              display: "inline-block",
              transition: "transform 0.15s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </button>
      </div>

      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default AccordionSection;