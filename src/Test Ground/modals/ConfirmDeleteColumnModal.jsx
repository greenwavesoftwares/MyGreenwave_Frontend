import React from "react";
import { X, AlertTriangle, AlertOctagon, Trash2, Loader2 } from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle } from "../helpers/styles";

/**
 * Confirm dialog for deleting a custom column.
 * Warns about filled cell data loss.
 */
export default function ConfirmDeleteColumnModal({
  column,
  rowCount = 0,
  filledCount = 0,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  return (
    <div
      onClick={(e) => !isDeleting && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1002,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 12,
          padding: 20,
          width: "100%",
          maxWidth: 420,
          fontFamily: "Sora,sans-serif",
          color: t.textPrimary,
          boxShadow: t.shadowXl,
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: t.dangerBgSubtle,
              color: t.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14.5, color: t.textPrimary }}
            >
              Delete column "{column?.name}"?
            </div>
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              This column will be permanently removed.
              {filledCount > 0 && (
                <>
                  {" "}
                  <strong style={{ color: t.danger }}>
                    {filledCount} filled cell{filledCount !== 1 ? "s" : ""}
                  </strong>{" "}
                  will be lost.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning box for data loss */}
        {filledCount > 0 && (
          <div
            style={{
              padding: "10px 12px",
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 11.5,
              color: t.dangerTextDeep,
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            <AlertOctagon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>This action cannot be undone.</strong> All data in this
              column across {rowCount} row{rowCount !== 1 ? "s" : ""} will be
              deleted.
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              ...btnStyle,
              opacity: isDeleting ? 0.6 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              ...btnStyle,
              background: t.danger,
              color: t.textInverse,
              borderColor: t.danger,
              opacity: isDeleting ? 0.7 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={13} /> Delete Column
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
