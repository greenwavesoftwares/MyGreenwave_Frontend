import React from "react";
import { X, Link2, Users } from "lucide-react";

export default function AutoChainConfirmModal({
  preview,
  onConfirm,
  onCancel,
  theme,
}) {
  if (!preview) return null;

  const { changes } = preview;
  const resourceNames = [...new Set(changes.map((c) => c.userName))];

  const byUser = {};
  changes.forEach((c) => {
    if (!byUser[c.userName]) byUser[c.userName] = [];
    byUser[c.userName].push(c);
  });

  const overlay = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };

  const card = {
    background: theme.bgCard,
    borderRadius: 12,
    width: "100%",
    maxWidth: 540,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    border: `1px solid ${theme.border}`,
  };

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link2 size={18} color={theme.primary} />
            <span
              style={{
                fontWeight: 700,
                color: theme.textPrimary,
                fontSize: 15,
              }}
            >
              Auto Chain Dependencies
            </span>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.textMuted,
              padding: 4,
              borderRadius: 4,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Summary Banner ── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              background: theme.primaryBgSubtle || `${theme.primary}15`,
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Users size={22} color={theme.primary} />
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: theme.textPrimary,
                  fontSize: 15,
                }}
              >
                {changes.length} new dependenc
                {changes.length === 1 ? "y" : "ies"}
              </div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>
                across {resourceNames.length} resource
                {resourceNames.length === 1 ? "" : "s"} · existing dependencies
                preserved
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable Detail List ── */}
        <div style={{ padding: "12px 20px", overflowY: "auto", flex: 1 }}>
          {Object.entries(byUser).map(([user, userChanges]) => (
            <div key={user} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: theme.primary,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {user} ({userChanges.length})
              </div>
              {userChanges.map((c, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: theme.textPrimary,
                    padding: "5px 0 5px 14px",
                    borderLeft: `2px solid ${theme.primary}40`,
                    marginBottom: 2,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: theme.textMuted }}>
                    {c.addedDepName}
                  </span>
                  <span style={{ color: theme.primary, margin: "0 6px" }}>
                    →
                  </span>
                  <span style={{ fontWeight: 600 }}>{c.taskName}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              background: theme.bgMuted,
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              background: theme.primary,
              color: theme.textInverse || "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Apply {changes.length} Dependenc
            {changes.length === 1 ? "y" : "ies"}
          </button>
        </div>
      </div>
    </div>
  );
}
