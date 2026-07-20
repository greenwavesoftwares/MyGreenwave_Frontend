import { useEffect, useState } from "react";
import { getThemeMode, themes } from "./theme";

export function useTheme() {
  const [mode, setMode] = useState(getThemeMode);

  useEffect(() => {
    // Cross-tab sync via storage event
    function onStorage(e) {
      if (e.key === "Theme") {
        setMode(e.newValue === "dark" ? "dark" : "light");
      }
    }

    // Same-tab sync via polling (catches menu toggle)
    const interval = setInterval(() => {
      const current = getThemeMode();
      setMode((prev) => (prev !== current ? current : prev));
    }, 500);

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  return {
    mode,
    isDark: mode === "dark",
    t: themes[mode],
  };
}