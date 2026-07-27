/* ═══════════════════════════════════════════════════════
   Theme-aware style factories
   ═══════════════════════════════════════════════════════ */

export const makeLabelStyle = (t) => ({
  fontSize: 10,
  fontWeight: 500,
  color: t.textMuted,
  letterSpacing: "0.3px",
  display: "block",
  marginBottom: 3,
});

export const makeInputStyle = (t) => ({
  width: "100%",
  height: 34,
  border: `1px solid ${t.borderStrong}`,
  borderRadius: 6,
  background: t.bgInput,
  color: t.textPrimary,
  padding: "0 10px",
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  boxSizing: "border-box",
  outline: "none",
});

export const makeBtnStyle = (t) => ({
  height: 32,
  padding: "0 14px",
  borderRadius: 7,
  border: `1px solid ${t.borderStrong}`,
  background: t.bgCard,
  color: t.textSecondary,
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
});

export const makeIconBtn = (t) => ({
  width: 28,
  height: 28,
  borderRadius: 6,
  border: `1px solid ${t.border}`,
  background: "transparent",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  transition: "all .12s",
  position: "relative",
  overflow: "visible",
});

export const makeNavBtn = (t) => ({
  width: 26,
  height: 26,
  borderRadius: 6,
  border: `1px solid ${t.border}`,
  background: t.bgSubtle,
  cursor: "pointer",
  fontSize: 14,
  color: t.textSecondary,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
});

export const makeTimeSelect = (t) => ({
  height: 26,
  border: `1px solid ${t.borderStrong}`,
  borderRadius: 5,
  background: t.bgInput,
  color: t.textPrimary,
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 11,
  padding: "0 4px",
  cursor: "pointer",
  outline: "none",
});

export const makePickerBtn = (t) => ({
  height: 28,
  padding: "0 12px",
  borderRadius: 6,
  border: `1px solid ${t.borderStrong}`,
  background: t.bgCard,
  color: t.textPrimary,
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "Sora,sans-serif",
});