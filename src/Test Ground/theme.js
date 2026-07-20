/* ═══════════════════════════════════════════════════════
   theme.js — Centralized color tokens for light/dark mode
   ═══════════════════════════════════════════════════════ */

export function getThemeMode() {
  try {
    return localStorage.getItem("Theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

const light = {
  // Backgrounds
  bgApp: "#F1F5F9",
  bgCard: "#FFFFFF",
  bgCardHover: "#F8FAFC",
  bgSubtle: "#FAFBFC",
  bgMuted: "#F1F5F9",
  bgInput: "#FFFFFF",
  bgInputDisabled: "#F8FAFC",
  bgOverlay: "rgba(0,0,0,0.45)",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  textDisabled: "#CBD5E1",
  textInverse: "#FFFFFF",

  // Borders
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  borderSubtle: "#F1F5F9",
  borderFocus: "#3B82F6",
  borderDashed: "#CBD5E1",

  // Primary (Blue)
  primary: "#1D4ED8",
  primaryHover: "#1E40AF",
  primaryBg: "#DBEAFE",
  primaryBgSubtle: "#EFF6FF",
  primaryBorder: "#93C5FD",
  primaryText: "#1D4ED8",

  // Success (Green)
  success: "#15803D",
  successBg: "#DCFCE7",
  successBgSubtle: "#F0FDF4",
  successBorder: "#86EFAC",
  successText: "#15803D",

  // Warning (Amber)
  warning: "#B45309",
  warningBg: "#FEF3C7",
  warningBgSubtle: "#FFFBEB",
  warningBorder: "#FCD34D",
  warningText: "#B45309",

  // Danger (Red)
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
  dangerBgSubtle: "#FEF2F2",
  dangerBorder: "#FCA5A5",
  dangerText: "#DC2626",
  dangerTextDeep: "#7F1D1D",

  // Info (Sky)
  info: "#0369A1",
  infoBg: "#F0F9FF",
  infoBorder: "#BAE6FD",

  // Violet (co-assigner accent)
  violet: "#7C3AED",
  violetBg: "#EDE9FE",
  violetBorder: "#DDD6FE",

  // Closed (neutral)
  closedBg: "#F1F5F9",
  closedText: "#475569",
  closedBorder: "#CBD5E1",

  // Nav
  navBg: "#0F172A",
  navText: "#F8FAFC",
  navMuted: "#94A3B8",
  navDivider: "#334155",
  navActive: "#1D4ED8",
  navTabBg: "#1E293B",
  navTabBorder: "#334155",

  // Shadows
  shadowSm: "0 1px 3px rgba(0,0,0,0.05)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 24px rgba(0,0,0,0.15)",
  shadowXl: "0 24px 64px rgba(0,0,0,0.18)",
};

const dark = {
  // Backgrounds
  bgApp: "#0B1220",
  bgCard: "#111827",
  bgCardHover: "#1F2937",
  bgSubtle: "#0F172A",
  bgMuted: "#1E293B",
  bgInput: "#1F2937",
  bgInputDisabled: "#111827",
  bgOverlay: "rgba(0,0,0,0.7)",

  // Text
  textPrimary: "#F1F5F9",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  textDisabled: "#475569",
  textInverse: "#0F172A",

  // Borders
  border: "#334155",
  borderStrong: "#475569",
  borderSubtle: "#1E293B",
  borderFocus: "#3B82F6",
  borderDashed: "#475569",

  // Primary (Blue)
  primary: "#3B82F6",
  primaryHover: "#2563EB",
  primaryBg: "#1E3A8A",
  primaryBgSubtle: "#172554",
  primaryBorder: "#2563EB",
  primaryText: "#93C5FD",

  // Success (Green)
  success: "#22C55E",
  successBg: "#14532D",
  successBgSubtle: "#052E16",
  successBorder: "#16A34A",
  successText: "#86EFAC",

  // Warning (Amber)
  warning: "#FBBF24",
  warningBg: "#78350F",
  warningBgSubtle: "#451A03",
  warningBorder: "#D97706",
  warningText: "#FCD34D",

  // Danger (Red)
  danger: "#F87171",
  dangerBg: "#7F1D1D",
  dangerBgSubtle: "#450A0A",
  dangerBorder: "#DC2626",
  dangerText: "#FCA5A5",
  dangerTextDeep: "#FECACA",

  // Info (Sky)
  info: "#38BDF8",
  infoBg: "#0C4A6E",
  infoBorder: "#0369A1",

  // Violet
  violet: "#A78BFA",
  violetBg: "#4C1D95",
  violetBorder: "#6D28D9",

  // Closed
  closedBg: "#1E293B",
  closedText: "#94A3B8",
  closedBorder: "#334155",

  // Nav
  navBg: "#020617",
  navText: "#F1F5F9",
  navMuted: "#64748B",
  navDivider: "#1E293B",
  navActive: "#3B82F6",
  navTabBg: "#0F172A",
  navTabBorder: "#1E293B",

  // Shadows
  shadowSm: "0 1px 3px rgba(0,0,0,0.4)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.5)",
  shadowLg: "0 8px 24px rgba(0,0,0,0.6)",
  shadowXl: "0 24px 64px rgba(0,0,0,0.7)",
};

export const themes = { light, dark };