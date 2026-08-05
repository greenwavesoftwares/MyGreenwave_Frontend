import React from "react";

/**
 * Simple colored pattern swatch for legends
 */
function PatternSwatch({ color }) {
  return <span style={{ display: "inline-block", width: 16, height: 12, borderRadius: 3, background: color, border: `1px solid ${color}` }}/>;
}

export default PatternSwatch;
