/**
 * Zebra + selection row background (light & dark).
 * @param {number} index - 0-based index inside project/resource group
 * @param {boolean} isSelected
 * @param {boolean} isDark
 */
export function getZebraRowStyle(index, isSelected, isDark) {
  if (isSelected) {
    return {
      backgroundColor: isDark
        ? "rgba(59, 130, 246, 0.25)"
        : "rgba(59, 130, 246, 0.12)",
    };
  }

  // odd rows only
  if (index % 2 === 1) {
    return {
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.035)"
        : "rgba(0, 0, 0, 0.025)",
    };
  }

  return { backgroundColor: "transparent" };
}