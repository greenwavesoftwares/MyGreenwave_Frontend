import React from "react";
import { useTheme } from "../useTheme";

/**
 * Bottom tab bar for mobile navigation.
 *
 * Props:
 *   tabs: [{ key, label, icon, badge?: number, disabled?, disabledReason? }]
 *   activeKey: current active tab key
 *   onTabChange: (key) => void
 */
export default function BottomTabBar({ tabs, activeKey, onTabChange }) {
  const { t } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: t.bgCard,
        borderTop: `1px solid ${t.border}`,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        zIndex: 90,
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "stretch",
        height: "calc(60px + env(safe-area-inset-bottom, 0))",
      }}
    >
      {tabs.map((tab) => {
        const active = activeKey === tab.key;
        const isDisabled = !!tab.disabled;

        return (
          <button
            key={tab.key}
            onClick={() => !isDisabled && onTabChange(tab.key)}
            disabled={isDisabled}
            title={isDisabled ? tab.disabledReason : ""}
            style={{
              flex: 1,
              minWidth: 0,
              height: 60,
              background: "transparent",
              border: "none",
              cursor: isDisabled ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "6px 4px",
              color: active
                ? t.primary
                : isDisabled
                  ? t.textDisabled
                  : t.textMuted,
              fontFamily: "Sora,sans-serif",
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              transition: "color .15s",
              position: "relative",
              WebkitTapHighlightColor: "transparent",
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            {/* Active indicator bar */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 32,
                  height: 3,
                  background: t.primary,
                  borderRadius: "0 0 3px 3px",
                }}
              />
            )}

            {/* Icon with badge */}
            <div style={{ position: "relative" }}>
              {React.cloneElement(tab.icon, {
                size: 22,
                strokeWidth: active ? 2.5 : 2,
              })}
              {tab.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: t.danger,
                    color: t.textInverse,
                    fontSize: 9,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${t.bgCard}`,
                    lineHeight: 1,
                  }}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: 10,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
