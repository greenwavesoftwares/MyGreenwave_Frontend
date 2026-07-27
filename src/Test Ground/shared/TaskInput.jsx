import React, { useState, useEffect } from "react";
import { useTheme } from "../useTheme";
import { makeInputStyle } from "../helpers/styles";

/**
 * Inline editable input for a task/sub-task name.
 * - Commits on blur
 * - Enter → blur
 */
export default function TaskInput({
  initialValue,
  onCommit,
  placeholder,
  isSubActivity,
}) {
  const { t } = useTheme();
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) onCommit(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
      }}
      placeholder={placeholder}
      title={val || ""}
      style={{
        ...makeInputStyle(t),
        height: 28,
        fontSize: 11.5,
        flex: 1,
        minWidth: 0,
      }}
    />
  );
}
