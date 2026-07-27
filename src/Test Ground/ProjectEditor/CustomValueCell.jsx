import React, { useState, useEffect } from "react";
import { useTheme } from "../useTheme";
import { MAX_CUSTOM_COL_CHARS } from "../helpers/constants";

/**
 * A single custom-column cell.
 *  - Focus-based edit state
 *  - 500 char max
 *  - Shows char counter when nearing limit
 *  - Placeholder "Click to add…"
 *  - Disabled when the row is locked
 */
const CustomValueCell = React.memo(function CustomValueCell({
  rowId,
  column, // { id, name, _width }
  value,
  disabled,
  onUpdate, // (rowId, colId, value) => void
  cellBg,
}) {
  const { t } = useTheme();
  const [localValue, setLocalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);

  // Sync external changes when not focused
  useEffect(() => {
    if (!isFocused) setLocalValue(value || "");
  }, [value, isFocused]);

  const handleChange = (e) => {
    const newVal = e.target.value.slice(0, MAX_CUSTOM_COL_CHARS);
    setLocalValue(newVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== (value || "")) {
      onUpdate(rowId, column.id, localValue);
    }
  };

  const remainingChars = MAX_CUSTOM_COL_CHARS - localValue.length;
  const nearLimit = remainingChars < 50;

  return (
    <td
      style={{
        padding: "8px 10px",
        borderBottom: `1px solid ${t.borderSubtle}`,
        background: cellBg,
        verticalAlign: "middle",
        width: column._width,
        minWidth: column._width,
        maxWidth: column._width,
        position: "relative",
      }}
    >
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.target.blur();
          if (e.key === "Escape") {
            setLocalValue(value || "");
            e.target.blur();
          }
        }}
        disabled={disabled}
        placeholder={disabled ? "" : "Click to add…"}
        title={
          disabled
            ? "Locked — row not editable"
            : localValue || "Click to add value"
        }
        maxLength={MAX_CUSTOM_COL_CHARS}
        style={{
          width: "100%",
          height: 28,
          border: `1px solid ${
            isFocused && !disabled ? t.primary : "transparent"
          }`,
          borderRadius: 5,
          background: isFocused && !disabled ? t.bgInput : "transparent",
          color: t.textPrimary,
          padding: "0 8px",
          fontFamily: "Sora,sans-serif",
          fontSize: 11.5,
          outline: "none",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "text",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color .12s, background .12s",
        }}
        onMouseEnter={(e) => {
          if (!isFocused && !disabled) {
            e.currentTarget.style.background = t.bgSubtle;
            e.currentTarget.style.borderColor = t.border;
          }
        }}
        onMouseLeave={(e) => {
          if (!isFocused && !disabled) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }
        }}
      />

      {/* Char counter (only when focused + near limit) */}
      {isFocused && nearLimit && !disabled && (
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: -14,
            fontSize: 9,
            color: remainingChars < 20 ? t.danger : t.textFaint,
            fontFamily: "'JetBrains Mono', monospace",
            background: t.bgCard,
            padding: "1px 5px",
            borderRadius: 3,
            border: `1px solid ${t.border}`,
            zIndex: 5,
          }}
        >
          {remainingChars} left
        </div>
      )}
    </td>
  );
});

export default CustomValueCell;
