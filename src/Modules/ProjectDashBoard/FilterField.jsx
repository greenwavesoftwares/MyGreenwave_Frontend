import React from "react";

/**
 * Simple filter field wrapper with label
 */
function FilterField({ label, children, t }) {
  return (
    <label className="wt-filter-field" style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: t.textSecondary, fontWeight: 600 }}>
      {label}{children}
    </label>
  );
}

export default FilterField;
