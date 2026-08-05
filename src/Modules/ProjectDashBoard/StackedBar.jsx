import React from "react";
import Tooltip from "@mui/material/Tooltip";
import PatternSwatch from "./PatternSwatch";

const EARLY_LATE_THRESHOLD_HRS = 0.25;

function resourceBaseColor(index) {
  const GOLDEN_ANGLE = 137.508;
  const hue = Math.round((index * GOLDEN_ANGLE) % 360);
  return { hue, actual: `hsl(${hue}, 62%, 48%)`, planned: `hsl(${hue}, 62%, 48%)` };
}

function fmtDurationCompact(h) {
  if (h == null) return "";
  if (h < 1) return `${Math.round(h * 60)}m`;
  const r = Math.round(h * 10) / 10;
  return `${r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)}h`;
}

/**
 * Stacked bar chart component for showing resource allocation
 */
function StackedBar({
  entries,
  field,
  kind,
  resourceColorMap,
  showHover,
  hideHover,
  showEarlyLate,
  compareTotal,
  t
}) {
  
  const total = entries.reduce((s, e) => s + e[field], 0);
  let g = null;
  
  if (showEarlyLate && total > 0 && compareTotal > 0) {
    const d = total - compareTotal;
    if (Math.abs(d) > EARLY_LATE_THRESHOLD_HRS) g = d < 0 ? "early" : "late";
  }

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        maxWidth: "var(--wt-bar-max-width,20px)",
        height: "100%",
        border: g ? `1.5px solid ${g === "early" ? t.earlyColor : t.lateColor}` : `1px solid ${t.barBorder}`,
        borderRadius: 6,
        background: t.barBg,
        overflow: "visible",
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 5, overflow: "hidden" }}>
        {entries.map((entry) => {
          const c = resourceColorMap[entry.resourceName] || resourceBaseColor(0);
          const bg = kind === "planned" ? c.planned : c.actual;
          const lp = kind === "actual" && entry.hasRunning;
          
          const act = (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const s = (window.innerWidth - r.right) < 300 ? "left" : "right";
            showHover({ x: s === "left" ? r.left : r.right, y: r.top + r.height / 2, side: s, entry, kind });
          };

          return (
            <div
              key={entry.resourceName}
              onMouseEnter={act}
              onMouseLeave={hideHover}
              onClick={(e) => { e.stopPropagation(); act(e); }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${entry.topPct}%`,
                height: `${entry.heightPct}%`,
                background: bg,
                borderTop: "1px solid rgba(255,255,255,0.6)",
                cursor: "pointer",
                animation: lp ? "beepPulseRunning 2.8s ease-in-out infinite" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {entry.heightPct >= 3.5 && (
                <span
                  style={{
                    fontSize: "clamp(6px,1.6vw,8px)",
                    lineHeight: 1,
                    fontWeight: 700,
                    color: t.barLabelColor,
                    textShadow: t.barLabelShadow,
                    whiteSpace: "nowrap",
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {fmtDurationCompact(entry[field])}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {showEarlyLate && total > 0 && compareTotal > 0 && (() => {
        const d = total - compareTotal;
        if (Math.abs(d) <= EARLY_LATE_THRESHOLD_HRS) return null;
        const e = d < 0;
        return (
          <Tooltip title={e ? "Under planned hours" : "Over planned hours"} arrow>
            <div style={{ 
              position: "absolute", 
              left: "50%", 
              top: 0, 
              transform: "translate(-50%,-140%)", 
              fontSize: 12, 
              fontWeight: 700, 
              color: e ? t.earlyColor : t.lateColor, 
              cursor: "pointer" 
            }}>
              {e ? "▲" : "▼"}
            </div>
          </Tooltip>
        );
      })()}
    </div>
  );
}

export default StackedBar;
