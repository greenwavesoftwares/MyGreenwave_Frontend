import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Edit, Info, Check, Loader2 } from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle } from "../helpers/styles";
import { isColumnNameUnique } from "../helpers/customColumns";

/**
 * Add or rename a custom column.
 * Props:
 *  - mode: "add" | "rename"
 *  - initialName: current value (for rename mode)
 *  - existingColumns: array of custom columns (used for uniqueness check)
 *  - excludeId: for rename mode, exclude this ID from uniqueness check
 */
export default function AddColumnModal({
  mode = "add",
  initialName = "",
  existingColumns = [],
  excludeId = null,
  onClose,
  onConfirm,
  isSaving = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, []);

  const trimmed = name.trim();
  const isEmpty = trimmed.length === 0;
  const isDuplicate =
    !isEmpty && !isColumnNameUnique(trimmed, existingColumns, excludeId);
  const isTooLong = trimmed.length > 50;
  const isValid = !isEmpty && !isDuplicate && !isTooLong;

  const validationMessage = touched
    ? isEmpty
      ? "Column name is required"
      : isDuplicate
        ? "A column with this name already exists"
        : isTooLong
          ? "Column name must be 50 characters or less"
          : ""
    : "";

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm(trimmed);
  };

  const isRenameMode = mode === "rename";

  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 440,
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: t.violetBg,
              color: t.violet,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isRenameMode ? <Edit size={18} /> : <Plus size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {isRenameMode ? "Rename Column" : "Add Custom Column"}
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
              {isRenameMode
                ? "Change the column name"
                : "Add a new text column to the table"}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSaving ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px" }}>
          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 600,
              color: t.textPrimary,
              marginBottom: 6,
            }}
          >
            Column Name <span style={{ color: t.danger }}>*</span>
          </label>

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched) setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSaving) handleSubmit();
              if (e.key === "Escape" && !isSaving) onClose();
            }}
            placeholder="e.g. PO Number, Location, Remark…"
            maxLength={50}
            disabled={isSaving}
            style={{
              width: "100%",
              height: 38,
              border: `1px solid ${
                touched && !isValid ? t.dangerBorder : t.borderStrong
              }`,
              borderRadius: 7,
              padding: "0 12px",
              fontFamily: "Sora,sans-serif",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              background: isSaving ? t.bgInputDisabled : t.bgInput,
              color: t.textPrimary,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 10.5,
              color: touched && !isValid ? t.danger : t.textFaint,
              minHeight: 14,
            }}
          >
            <span>
              {validationMessage ||
                (isRenameMode
                  ? "The column and all its data will keep the same values"
                  : "This column will hold free-form text (max 500 chars per cell)")}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: trimmed.length > 0 ? t.textSecondary : t.textDisabled,
              }}
            >
              {trimmed.length}/50
            </span>
          </div>

          {/* Info banner */}
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: t.infoBg,
              border: `1px solid ${t.infoBorder}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 11,
              color: t.info,
              lineHeight: 1.5,
            }}
          >
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {isRenameMode
                ? "Renaming will not affect any existing cell values."
                : "The new column will appear at the end of the table (before Actions). All rows will get an empty input field."}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              ...btnStyle,
              opacity: isSaving ? 0.5 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
            style={{
              ...btnStyle,
              background: isValid && !isSaving ? t.violet : t.bgMuted,
              color: isValid && !isSaving ? t.textInverse : t.textFaint,
              borderColor: isValid && !isSaving ? t.violet : t.border,
              cursor: isValid && !isSaving ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {isRenameMode ? "Renaming..." : "Adding..."}
              </>
            ) : (
              <>
                {isRenameMode ? <Check size={13} /> : <Plus size={13} />}
                {isRenameMode ? "Rename" : "Insert Column"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
