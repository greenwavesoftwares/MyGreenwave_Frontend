import React from "react";
import { useResponsive } from "../useResponsive";
import BottomSheet from "./BottomSheet";

/**
 * Simplest wrapper — just tells you which mode to render in.
 * Use like:
 *
 *   <ModalOrSheet
 *     open={open}
 *     onClose={onClose}
 *     title="My Modal"
 *     sheetHeight="90%"
 *     desktopMaxWidth={640}
 *   >
 *     {(mode) => (
 *       mode === "sheet"
 *         ? <MyContent isMobile />
 *         : <MyContent isMobile={false} />
 *     )}
 *   </ModalOrSheet>
 */
export default function ModalOrSheet({
  open,
  onClose,
  title = "",
  sheetHeight = "90%",
  desktopMaxWidth = 640,
  children,
}) {
  const { isMobile } = useResponsive();
  if (!open) return null;

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        height={sheetHeight}
      >
        {typeof children === "function" ? children("sheet") : children}
      </BottomSheet>
    );
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: desktopMaxWidth,
          maxHeight: "92vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {typeof children === "function" ? children("modal") : children}
      </div>
    </div>
  );
}
