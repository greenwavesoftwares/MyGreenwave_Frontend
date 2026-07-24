import React, { useState, useEffect, useRef } from "react";
import { X, RotateCcw, Loader2, AlertOctagon } from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle } from "../helpers/styles";

/**
 * Modal to reject / redo a completed task.
 * Requires a reason (min 5 characters).
 */
export default function RejectReasonModal({
  row,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const trimmed = reason.trim();
  const isValid = trimmed.length >= 5;

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid) return;
    await onConfirm(trimmed);
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
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
          maxWidth: 480,
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
            background: t.warningBgSubtle,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.warningBg,
              color: t.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RotateCcw size={20} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Redo / Reject Task
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.task || row.module || `Row #${row.id}`}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSubmitting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: 10,
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <AlertOctagon
              size={16}
              color={t.danger}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div
              style={{
                fontSize: 11.5,
                color: t.dangerTextDeep,
                lineHeight: 1.5,
              }}
            >
              This will mark the task as <strong>Rejected</strong> and notify
              the assignee that the work needs to be redone.
            </div>
          </div>

          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 600,
              color: t.textPrimary,
              marginBottom: 6,
            }}
          >
            Reason for Redo / Rejection
            <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
          </label>

          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Explain why this task needs to be redone (min. 5 characters)…"
            disabled={isSubmitting}
            rows={4}
            style={{
              width: "100%",
              border: `1px solid ${
                touched && !isValid ? t.dangerBorder : t.borderStrong
              }`,
              borderRadius: 8,
              padding: "10px 12px",
              fontFamily: "Sora,sans-serif",
              fontSize: 12.5,
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              minHeight: 80,
              lineHeight: 1.5,
              background: isSubmitting ? t.bgInputDisabled : t.bgInput,
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
            }}
          >
            <span>
              {touched && !isValid
                ? "⚠ Reason must be at least 5 characters"
                : "Be specific — this helps the assignee understand what to fix"}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: trimmed.length > 0 ? t.textSecondary : t.textDisabled,
              }}
            >
              {trimmed.length} chars
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
            disabled={isSubmitting}
            style={{
              ...btnStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              opacity: isSubmitting ? 0.5 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={{
              ...btnStyle,
              background: isValid ? t.warning : t.bgMuted,
              color: isValid ? t.textInverse : t.textFaint,
              borderColor: isValid ? t.warning : t.border,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: !isValid || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Submitting...
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                Redo & Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
