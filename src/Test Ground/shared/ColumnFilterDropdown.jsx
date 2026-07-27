import React, { useState, useEffect, useRef } from "react";
import { Filter, Check, X } from "lucide-react";
import { useTheme } from "../useTheme";
import { useResponsive } from "../useResponsive";
import BottomSheet from "./BottomSheet";

export default function ColumnFilterDropdown({
  label,
  options,
  selected,
  onChange,
  type = "multi",
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  const filtered = options.filter((o) => {
    const lbl = typeof o === "string" ? o : o.label;
    return lbl.toLowerCase().includes(search.toLowerCase());
  });

  const isActive =
    type === "multi" ? selected.length > 0 : selected.trim() !== "";

  /* ─── Shared list content ─── */
  const listContent =
    type === "multi" ? (
      <>
        {options.length > 5 && (
          <div
            style={{
              padding: isMobile ? "12px 16px" : "6px 8px",
              borderBottom: `1px solid ${t.borderSubtle}`,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              autoFocus={!isMobile}
              style={{
                width: "100%",
                height: isMobile ? 42 : 28,
                border: `1px solid ${t.border}`,
                borderRadius: isMobile ? 8 : 5,
                padding: "0 10px",
                fontSize: isMobile ? 14 : 11,
                fontFamily: "Sora,sans-serif",
                outline: "none",
                boxSizing: "border-box",
                background: t.bgInput,
                color: t.textPrimary,
              }}
            />
          </div>
        )}

        <div
          style={{
            maxHeight: isMobile ? "none" : 200,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: t.textFaint,
                fontSize: 11,
              }}
            >
              No options
            </div>
          ) : (
            filtered.map((opt) => {
              const value = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const checked = selected.includes(value);

              return (
                <div
                  key={value}
                  onClick={() =>
                    onChange(
                      checked
                        ? selected.filter((v) => v !== value)
                        : [...selected, value],
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: isMobile ? "12px 16px" : "6px 10px",
                    cursor: "pointer",
                    background: checked ? t.primaryBgSubtle : "transparent",
                    borderLeft: checked
                      ? `3px solid ${t.primary}`
                      : "3px solid transparent",
                    borderBottom: isMobile
                      ? `1px solid ${t.borderSubtle}`
                      : "none",
                    minHeight: isMobile ? 48 : "auto",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!checked && !isMobile)
                      e.currentTarget.style.background = t.bgSubtle;
                  }}
                  onMouseLeave={(e) => {
                    if (!checked && !isMobile)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: isMobile ? 22 : 16,
                      height: isMobile ? 22 : 16,
                      borderRadius: 4,
                      border: `1.5px solid ${checked ? t.primary : t.borderStrong}`,
                      background: checked ? t.primary : t.bgCard,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: t.textInverse,
                    }}
                  >
                    {checked && (
                      <Check size={isMobile ? 14 : 11} strokeWidth={3} />
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: isMobile ? 14 : 11.5,
                      color: t.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: checked ? 600 : 400,
                    }}
                  >
                    {optLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {type === "multi" && selected.length > 0 && !isMobile && (
          <div
            style={{
              padding: "6px 10px",
              borderTop: `1px solid ${t.border}`,
              background: t.bgSubtle,
              fontSize: 10,
              color: t.textMuted,
              textAlign: "center",
            }}
          >
            {selected.length} selected
          </div>
        )}
      </>
    ) : (
      /* Text mode */
      <div style={{ padding: isMobile ? 16 : 8 }}>
        <input
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type to filter…"
          autoFocus={!isMobile}
          style={{
            width: "100%",
            height: isMobile ? 44 : 30,
            border: `1px solid ${t.border}`,
            borderRadius: isMobile ? 10 : 5,
            padding: "0 12px",
            fontSize: isMobile ? 14 : 11.5,
            fontFamily: "Sora,sans-serif",
            outline: "none",
            boxSizing: "border-box",
            background: t.bgInput,
            color: t.textPrimary,
          }}
        />
      </div>
    );

  /* ─── Trigger button ─── */
  const triggerBtn = (
    <button
      onClick={() => setOpen((p) => !p)}
      title={`Filter by ${label}`}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 2,
        display: "flex",
        alignItems: "center",
        color: isActive ? t.primary : t.textFaint,
        position: "relative",
      }}
    >
      <Filter size={12} />
      {isActive && (
        <span
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: t.primary,
            border: `1.5px solid ${t.bgCard}`,
          }}
        />
      )}
    </button>
  );

  // ══════════════════════════════════════════════════════
  //   MOBILE — Bottom Sheet
  // ══════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        {triggerBtn}
        <BottomSheet
          open={open}
          onClose={() => {
            setOpen(false);
            setSearch("");
          }}
          title={`Filter by ${label}`}
          height={type === "multi" ? "90%" : "auto"}
        >
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div style={{ flex: 1, overflowY: "auto" }}>{listContent}</div>

            {/* Footer with Clear + Done */}
            <div
              style={{
                padding: 12,
                borderTop: `1px solid ${t.border}`,
                background: t.bgSubtle,
                display: "flex",
                gap: 8,
              }}
            >
              {isActive && (
                <button
                  onClick={() => {
                    onChange(type === "multi" ? [] : "");
                  }}
                  style={{
                    flex: 1,
                    height: 46,
                    border: `1px solid ${t.dangerBorder}`,
                    background: t.dangerBgSubtle,
                    color: t.danger,
                    borderRadius: 10,
                    fontFamily: "Sora,sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <X size={14} /> Clear
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  flex: isActive ? 1.3 : 1,
                  height: 46,
                  border: "none",
                  background: t.primary,
                  color: t.textInverse,
                  borderRadius: 10,
                  fontFamily: "Sora,sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Check size={14} /> Done
                {type === "multi" && selected.length > 0 && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      padding: "1px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {selected.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </BottomSheet>
      </>
    );
  }

  // ══════════════════════════════════════════════════════
  //   DESKTOP — Popup
  // ══════════════════════════════════════════════════════
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {triggerBtn}

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            width: 220,
            background: t.bgCard,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 8,
            boxShadow: t.shadowLg,
            zIndex: 999,
            fontFamily: "Sora,sans-serif",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderBottom: `1px solid ${t.border}`,
              background: t.bgSubtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary }}
            >
              Filter: {label}
            </span>
            {isActive && (
              <button
                onClick={() => {
                  onChange(type === "multi" ? [] : "");
                  setOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: t.danger,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {listContent}
        </div>
      )}
    </div>
  );
}
