import React from "react";
import { useTheme } from "../useTheme";

/**
 * Multiline text input with a label.
 * When `readOnly` is true, renders as a static formatted block.
 */
export default function CommentField({
  label,
  value,
  onChange,
  placeholder,
  readOnly: isReadOnly,
  disabled,
}) {
  const { t } = useTheme();

  return (
    <div style={{ marginTop: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 10.5,
          fontWeight: 600,
          color: t.textMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </label>

      {isReadOnly ? (
        <div
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "Sora,sans-serif",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: t.textSecondary,
            background: t.bgSubtle,
            minHeight: 36,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        >
          {value || "—"}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "Sora,sans-serif",
            fontSize: 11.5,
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: 48,
            lineHeight: 1.5,
            background: disabled ? t.bgInputDisabled : t.bgInput,
            color: t.textPrimary,
          }}
        />
      )}
    </div>
  );
}
