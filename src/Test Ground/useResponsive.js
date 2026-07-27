import { useState, useEffect } from "react";
import { BREAKPOINTS } from "./theme";

/**
 * Reactive hook that returns current viewport info.
 *
 * Returns:
 *   isMobile:  width < 640
 *   isTablet:  640 <= width < 1024
 *   isDesktop: width >= 1024
 *   width, height
 *   orientation: "portrait" | "landscape"
 */
export function useResponsive() {
  const getState = () => {
    if (typeof window === "undefined") {
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: "landscape",
      };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      width: w,
      height: h,
      isMobile: w < BREAKPOINTS.mobile,
      isTablet: w >= BREAKPOINTS.mobile && w < BREAKPOINTS.tablet,
      isDesktop: w >= BREAKPOINTS.tablet,
      orientation: w > h ? "landscape" : "portrait",
    };
  };

  const [state, setState] = useState(getState);

  useEffect(() => {
    let rafId = null;

    const handleResize = () => {
      // Debounce via requestAnimationFrame for smoothness
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setState(getState());
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return state;
}