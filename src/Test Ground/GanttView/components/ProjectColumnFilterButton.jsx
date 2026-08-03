import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";
import { useTheme } from "../../useTheme";

/**
 * Themed filter button for a per-project column header.
 * Uses createPortal so the popup can escape overflow containers.
 */
export default function ProjectColumnFilterButton({
  color,
  columnKey,
  options,
  selected,
  onChange,
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popupWidth = 220;
    const popupHeight = 320;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spacing = 4;

    let top = rect.bottom + spacing;
    if (top + popupHeight > viewportHeight - 20)
      top = rect.top - popupHeight - spacing;
    let left = rect.right - popupWidth;
    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10)
      left = viewportWidth - popupWidth - 10;
    setPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const reposition = () => updatePosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (buttonRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setOpen(false);
      setSearch("");
    };
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const filtered = options.filter((o) =>
    (o.label || "").toLowerCase().includes(search.toLowerCase()),
  );

  const isActive = selected.length > 0;

  const popup = open ? (
    <div
      ref={popupRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: 220,
        background: t.bgCard,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 8,
        boxShadow: t.shadowLg,
        zIndex: 99999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${t.border}`,
          background: t.bgSubtle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary }}>
          Filter {columnKey.charAt(0).toUpperCase() + columnKey.slice(1)}
        </span>
        {isActive && (
          <button
            onClick={() => onChange([])}
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

      {options.length > 5 && (
        <div
          style={{
            padding: "6px 10px",
            borderBottom: `1px solid ${t.borderSubtle}`,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            autoFocus
            style={{
              width: "100%",
              height: 26,
              border: `1px solid ${t.border}`,
              borderRadius: 5,
              padding: "0 8px",
              fontSize: 11,
              fontFamily: "Sora,sans-serif",
              outline: "none",
              boxSizing: "border-box",
              background: t.bgInput,
              color: t.textPrimary,
            }}
          />
        </div>
      )}

      <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: t.textFaint,
              fontSize: 11,
            }}
          >
            No options
          </div>
        ) : (
          filtered.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(
                    checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value],
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  background: checked ? `${color}20` : "transparent",
                  borderLeft: checked
                    ? `3px solid ${color}`
                    : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.background = t.bgSubtle;
                }}
                onMouseLeave={(e) => {
                  if (!checked)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 4,
                    border: `1.5px solid ${checked ? color : t.borderStrong}`,
                    background: checked ? color : t.bgCard,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: t.textInverse,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {checked && "✓"}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: t.textPrimary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: checked ? 600 : 400,
                    flex: 1,
                  }}
                  title={opt.label}
                >
                  {opt.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: `1px solid ${t.border}`,
            background: t.bgSubtle,
            fontSize: 10,
            color: t.textMuted,
            textAlign: "center",
          }}
        >
          {selected.length} of {options.length} selected
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((p) => !p)}
        title={`Filter ${columnKey}`}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: `1px solid ${isActive ? color : t.border}`,
          background: isActive ? `${color}20` : t.bgCard,
          color: isActive ? color : t.textFaint,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Filter size={10} />
        {isActive && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 13,
              height: 13,
              padding: "0 3px",
              borderRadius: 999,
              background: color,
              color: t.textInverse,
              fontSize: 8,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1.5px solid ${t.bgCard}`,
            }}
          >
            {selected.length}
          </span>
        )}
      </button>
      {open && createPortal(popup, document.body)}
    </>
  );
}
