import React, { useState } from "react";
import { useTheme } from "../useTheme";

/**
 * SVG overlay that draws dependency arrows on top of the Gantt chart.
 *
 * Props:
 *   - arrows: array from computeArrows()
 *   - width: SVG width (should match chart width)
 *   - height: SVG height (should match chart total height)
 *   - highlightedRowId?: string — highlight arrows connected to this row
 *   - onArrowClick?: (arrow) => void
 */
export default function DependencyArrows({
  arrows,
  width,
  height,
  highlightedRowId = null,
  onArrowClick,
}) {
  const { t } = useTheme();
  const [hoveredArrowId, setHoveredArrowId] = useState(null);

  if (!arrows || arrows.length === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none", // let bars underneath be clickable
        zIndex: 8, // above bars but below tooltip
        overflow: "visible",
      }}
    >
      {/* Arrow markers (definitions) */}
      <defs>
        {["#EF4444", "#22C55E", t.primary, t.textDisabled].map((color, i) => (
          <marker
            key={i}
            id={`arrowhead-${i}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        ))}
      </defs>

      {arrows.map((arrow) => {
        const isHighlighted =
          highlightedRowId &&
          (arrow.sourceRow.id === highlightedRowId ||
            arrow.targetRow.id === highlightedRowId);
        const isHovered = hoveredArrowId === arrow.id;
        const isActive = isHovered || isHighlighted;

        // Pick marker index based on color
        let markerIdx = 2; // default primary
        if (arrow.stroke === "#EF4444") markerIdx = 0;
        else if (arrow.stroke === "#22C55E") markerIdx = 1;
        else if (arrow.stroke === t.textDisabled) markerIdx = 3;

        return (
          <g
            key={arrow.id}
            style={{
              pointerEvents: "stroke",
              cursor: onArrowClick ? "pointer" : "default",
            }}
          >
            {/* Invisible wide stroke for easier hover */}
            <path
              d={arrow.path}
              stroke="transparent"
              strokeWidth={10}
              fill="none"
              onMouseEnter={() => setHoveredArrowId(arrow.id)}
              onMouseLeave={() => setHoveredArrowId(null)}
              onClick={() => onArrowClick && onArrowClick(arrow)}
            />

            {/* Actual visible arrow */}
            <path
              d={arrow.path}
              stroke={arrow.stroke}
              strokeWidth={isActive ? arrow.strokeWidth + 1 : arrow.strokeWidth}
              fill="none"
              opacity={
                highlightedRowId
                  ? isHighlighted
                    ? 1
                    : 0.15
                  : isHovered
                    ? 1
                    : arrow.opacity
              }
              markerEnd={`url(#arrowhead-${markerIdx})`}
              style={{ transition: "opacity .15s, stroke-width .15s" }}
            />

            {/* Tooltip label on hover */}
            {isHovered && (
              <foreignObject
                x={(arrow.sourcePos.right + arrow.targetPos.left) / 2 - 100}
                y={Math.min(arrow.sourcePos.midY, arrow.targetPos.midY) - 30}
                width={200}
                height={28}
                style={{ pointerEvents: "none", overflow: "visible" }}
              >
                <div
                  style={{
                    background: t.bgCard,
                    color: t.textPrimary,
                    border: `1px solid ${arrow.stroke}`,
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "Sora,sans-serif",
                    boxShadow: t.shadowMd,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "center",
                  }}
                >
                  {arrow.sourceRow.task || "(untitled)"} →{" "}
                  {arrow.targetRow.task || "(untitled)"}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
