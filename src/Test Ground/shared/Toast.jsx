import React from "react";
import { CheckCircle2, AlertOctagon, Info, X } from "lucide-react";
import { useTheme } from "../useTheme";

/**
 * Bottom-right stacked toast notifications
 * Expected shape:
 *   toasts: [{ id, kind: "success"|"error"|"info", title, msg }]
 */
export default function Toast({ toasts, onDismiss }) {
  const { t } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 340,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background:
              toast.kind === "success"
                ? t.successBgSubtle
                : toast.kind === "error"
                  ? t.dangerBgSubtle
                  : t.primaryBgSubtle,
            border: `1px solid ${
              toast.kind === "success"
                ? t.successBorder
                : toast.kind === "error"
                  ? t.dangerBorder
                  : t.primaryBorder
            }`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: t.shadowMd,
            fontFamily: "Sora,sans-serif",
            fontSize: 12,
          }}
        >
          <span
            style={{
              fontSize: 15,
              marginTop: 1,
              color:
                toast.kind === "success"
                  ? t.success
                  : toast.kind === "error"
                    ? t.danger
                    : t.primary,
            }}
          >
            {toast.kind === "success" ? (
              <CheckCircle2 size={16} color={t.success} />
            ) : toast.kind === "error" ? (
              <AlertOctagon size={16} color={t.danger} />
            ) : (
              <Info size={16} color={t.primary} />
            )}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: t.textPrimary }}>
              {toast.title}
            </div>
            {toast.msg && (
              <div
                style={{
                  marginTop: 2,
                  color: t.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {toast.msg}
              </div>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              fontSize: 13,
              padding: "0 2px",
              lineHeight: 1,
            }}
          >
            <X size={13} color={t.textFaint} />
          </button>
        </div>
      ))}
    </div>
  );
}
