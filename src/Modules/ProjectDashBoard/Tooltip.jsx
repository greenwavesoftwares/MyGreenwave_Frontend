import React from "react";
import TooltipContent from "./TooltipContent";

/**
 * Tooltip component that appears on hover
 */
function Tooltip({
  hovered,
  tooltipRef,
  showHover,
  hideHover,
  t
}) {
  
  if (!hovered) return null;

  return (
    <div
      ref={tooltipRef}
      onMouseEnter={() => showHover(hovered)}
      onMouseLeave={hideHover}
      style={{
        position: "fixed",
        left: hovered.x,
        top: hovered.y,
        transform: hovered.side === "left" ? "translate(calc(-100% - 10px),-50%)" : "translate(10px,-50%)",
        zIndex: 50,
        background: t.ttBg,
        color: t.ttText,
        fontSize: 12,
        borderRadius: 10,
        padding: 12,
        maxWidth: "min(280px,90vw)",
        maxHeight: "min(320px,70vh)",
        overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
      }}
    >
      <TooltipContent entry={hovered.entry} kind={hovered.kind} t={t}/>
    </div>
  );
}

export default Tooltip;
