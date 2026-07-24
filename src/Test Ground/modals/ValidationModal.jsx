import React from "react";
import {
  X,
  Loader2,
  Info,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle } from "../helpers/styles";

/**
 * Pre-publish validation modal.
 * Props:
 *  - results: array of { ok, title, detail }
 *  - warnings: array of { title, detail }
 *  - isRepublish: true for "update" flow, false for first publish
 */
export default function ValidationModal({
  results,
  warnings = [],
  onClose,
  onConfirm,
  isSaving = false,
  isRepublish = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const allOk = results.every((r) => r.ok);
  const failCount = results.filter((r) => !r.ok).length;
  const hasWarnings = warnings.length > 0;

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
          maxWidth: 540,
          maxHeight: "90vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: !allOk
                ? t.dangerBgSubtle
                : hasWarnings
                  ? t.warningBgSubtle
                  : t.successBg,
              color: !allOk ? t.danger : hasWarnings ? t.warning : t.success,
              flexShrink: 0,
            }}
          >
            {!allOk ? (
              <ShieldAlert size={20} strokeWidth={2} />
            ) : hasWarnings ? (
              <AlertTriangle size={20} strokeWidth={2} />
            ) : (
              <ShieldCheck size={20} strokeWidth={2} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {isRepublish ? "Update Published Project" : "Submit for Motion"}
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
              {!allOk && hasWarnings ? (
                <>
                  {failCount} issue{failCount !== 1 ? "s" : ""} to resolve,{" "}
                  {warnings.length} warning{warnings.length !== 1 ? "s" : ""} to
                  review.
                </>
              ) : !allOk ? (
                <>
                  {failCount} issue{failCount !== 1 ? "s" : ""} to resolve
                  before {isRepublish ? "updating" : "submitting"}.
                </>
              ) : hasWarnings ? (
                <>
                  All checks passed — {warnings.length} warning
                  {warnings.length !== 1 ? "s" : ""} to review before{" "}
                  {isRepublish ? "updating" : "publishing"}.
                </>
              ) : isRepublish ? (
                <>All {results.length} checks passed — ready to update.</>
              ) : (
                <>
                  All {results.length} checks passed — ready to put activities
                  in motion.
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Warnings */}
          {hasWarnings && (
            <div
              style={{
                margin: "14px 20px 0",
                padding: 12,
                background: t.warningBgSubtle,
                border: `1px solid ${t.warningBorder}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: `1px dashed ${t.warningBorder}`,
                }}
              >
                <AlertTriangle size={16} color={t.warning} />
                <span
                  style={{ fontWeight: 700, fontSize: 12.5, color: t.warning }}
                >
                  {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "2px 8px",
                    background: t.warningBg,
                    color: t.warning,
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Can Ignore
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 10px",
                      background: t.bgCard,
                      border: `1px solid ${t.warningBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: t.warning,
                        marginBottom: w.detail ? 4 : 0,
                      }}
                    >
                      {w.title}
                    </div>
                    {w.detail && (
                      <div
                        style={{
                          fontSize: 11,
                          color: t.textSecondary,
                          whiteSpace: "pre-line",
                          lineHeight: 1.5,
                        }}
                      >
                        {w.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: `1px dashed ${t.warningBorder}`,
                  fontSize: 10.5,
                  color: t.warning,
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Info size={11} />
                You can {isRepublish ? "update" : "publish"} anyway — review and
                confirm.
              </div>
            </div>
          )}

          {/* Results */}
          <div
            style={{
              padding: "14px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: r.ok ? t.successBgSubtle : t.dangerBgSubtle,
                  border: `1px solid ${r.ok ? t.successBorder : t.dangerBorder}`,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: r.ok ? t.successBg : t.dangerBg,
                    color: r.ok ? t.success : t.danger,
                    marginTop: 1,
                  }}
                >
                  {r.ok ? (
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                  ) : (
                    <XCircle size={14} strokeWidth={2.5} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: r.ok ? t.success : t.danger,
                      lineHeight: 1.4,
                    }}
                  >
                    {r.title}
                  </div>
                  {r.detail && (
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        marginTop: 4,
                        whiteSpace: "pre-line",
                        lineHeight: 1.5,
                      }}
                    >
                      {r.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              ...btnStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <X size={13} /> Close
          </button>

          {allOk && (
            <button
              onClick={onConfirm}
              disabled={isSaving}
              style={{
                ...btnStyle,
                background: hasWarnings ? t.warning : t.primary,
                color: t.textInverse,
                borderColor: hasWarnings ? t.warning : t.primary,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  {isRepublish ? "Updating..." : "Publishing..."}
                </>
              ) : hasWarnings ? (
                <>
                  <AlertTriangle size={14} />
                  {isRepublish ? "Update Anyway" : "Publish Anyway"}
                </>
              ) : isRepublish ? (
                <>
                  <RefreshCw size={14} />
                  Confirm &amp; Re-publish
                </>
              ) : (
                <>
                  <Rocket size={14} />
                  Confirm &amp; Put in Motion
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
