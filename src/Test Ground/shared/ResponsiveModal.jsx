import React from "react";
import { useResponsive } from "../useResponsive";
import BottomSheet from "./BottomSheet";

/**
 * Wraps any content in either:
 *   - A regular centered modal on desktop/tablet
 *   - A bottom sheet on mobile
 *
 * Props:
 *   open:         boolean
 *   onClose:      () => void
 *   title:        string (mobile only — desktop passes children as-is)
 *   maxWidth:     desktop modal max-width (default 640)
 *   sheetHeight:  bottom sheet height on mobile ("full" | "90%" | "auto")
 *   children:     modal content (should include its own header if desktop-style)
 *   forceMobile:  boolean — always show as bottom sheet
 *   desktopChildren: optional separate render for desktop (if content differs)
 *   mobileChildren:  optional separate render for mobile
 */
export default function ResponsiveModal({
  open,
  onClose,
  title = "",
  sheetHeight = "90%",
  children,
  forceMobile = false,
  desktopChildren,
  mobileChildren,
}) {
  const { isMobile } = useResponsive();
  const useSheet = isMobile || forceMobile;

  if (!open) return null;

  const content = useSheet
    ? mobileChildren || children
    : desktopChildren || children;

  if (useSheet) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        height={sheetHeight}
      >
        {content}
      </BottomSheet>
    );
  }

  // Desktop: return children as-is (the modal already has its own overlay + card)
  return content;
}
