import React, { useState } from "react";

/**
 * Accordion section that can be expanded/collapsed
 */
function AccordionSection({ title, defaultOpen = true, children, t }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ 
      background: t.accBg, 
      borderRadius: 14, 
      border: `1px solid ${t.accBorder}`, 
      marginTop: 16, 
      overflow: "hidden", 
      transition: "background 0.2s" 
    }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { 
          if (e.key === "Enter" || e.key === " ") { 
            e.preventDefault(); 
            setOpen((o) => !o); 
          } 
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: t.accTitle }}>{title}</span>
        <span
          style={{
            fontSize: 11,
            color: t.accChevron,
            display: "inline-block",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          {"▼"}
        </span>
      </div>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

export default AccordionSection;
