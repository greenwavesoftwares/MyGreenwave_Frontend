import React, { useState, useEffect } from "react";
import { useTheme } from "../useTheme";
import { makeInputStyle } from "../helpers/styles";

/**
 * Inline editable input for a module name.
 * - Commits on blur (only if value changed)
 * - Enter → blur (save), Escape → cancel revert
 */
export default function ModuleInput({ initialValue, onCommit, onCancel }) {
  const { t } = useTheme();
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== initialValue) {
      onCommit(trimmed);
    } else {
      onCancel?.();
    }
  };

  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          setVal(initialValue);
          onCancel?.();
        }
      }}
      placeholder="Module name…"
      autoFocus
      title={val || ""}
      style={{ ...makeInputStyle(t), height: 28, fontSize: 11.5 }}
    />
  );
}
