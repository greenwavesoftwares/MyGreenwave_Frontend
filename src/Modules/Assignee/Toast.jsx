import { CheckCircle2, AlertOctagon, Info, X } from "lucide-react";

export default function Toast({ toasts, onDismiss }) {
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
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background:
              t.kind === "success"
                ? "#F0FDF4"
                : t.kind === "error"
                ? "#FEF2F2"
                : "#EFF6FF",
            border: `1px solid ${
              t.kind === "success"
                ? "#86EFAC"
                : t.kind === "error"
                ? "#FCA5A5"
                : "#93C5FD"
            }`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            fontFamily: "Sora,sans-serif",
            fontSize: 12,
          }}
        >
          {t.kind === "success" ? (
            <CheckCircle2 size={16} color="#16A34A" />
          ) : t.kind === "error" ? (
            <AlertOctagon size={16} color="#DC2626" />
          ) : (
            <Info size={16} color="#2563EB" />
          )}

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t.title}</div>

            {t.msg && (
              <div style={{ marginTop: 2, color: "#475569" }}>
                {t.msg}
              </div>
            )}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}