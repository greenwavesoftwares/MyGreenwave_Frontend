/* ═══════════════════════════════════════════════════════
   Date Range Storage
   Persists draft list date range selection to localStorage
   ═══════════════════════════════════════════════════════ */

const LS_KEY = "drafts-date-range";

const toSimpleDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Compute the actual { fromDate, toDate } for a given mode.
 * For "custom" mode, uses the provided customFrom/customTo.
 * For "currentMonth" / "last3Months", recomputes from today.
 */
export function computeRangeFromMode(mode, customFrom, customTo) {
  const now = new Date();

  if (mode === "last3Months") {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { fromDate: toSimpleDate(from), toDate: toSimpleDate(to) };
  }

  if (mode === "custom" && customFrom && customTo) {
    return { fromDate: customFrom, toDate: customTo };
  }

  // Default: currentMonth
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { fromDate: toSimpleDate(first), toDate: toSimpleDate(last) };
}

/**
 * Load saved date-range preferences from localStorage.
 * Returns null if none saved or corrupt.
 */
export function loadSavedDateRange() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.mode) return null;
    return {
      mode: parsed.mode,
      customFrom: parsed.customFrom || null,
      customTo: parsed.customTo || null,
    };
  } catch {
    return null;
  }
}

/**
 * Save date-range preferences to localStorage.
 */
export function saveDateRange({ mode, customFrom, customTo }) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        mode,
        customFrom: customFrom || null,
        customTo: customTo || null,
      }),
    );
  } catch {}
}

/**
 * Get the initial date range at app startup, respecting localStorage.
 * Falls back to current month if nothing saved.
 */
export function getInitialDateRange() {
  const saved = loadSavedDateRange();
  if (saved) {
    return computeRangeFromMode(saved.mode, saved.customFrom, saved.customTo);
  }
  // Default: current month
  return computeRangeFromMode("currentMonth");
}