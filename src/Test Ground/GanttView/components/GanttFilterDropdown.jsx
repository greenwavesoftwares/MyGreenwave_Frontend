import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../useTheme";

/**
 * Themed global filter dropdown for the toolbar.
 * Multi-select with search.
 */
export default function GanttFilterDropdown({
  label,
  options,
  selected,
  onChange,
  icon,
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    (o.label || "").toLowerCase().includes(search.toLowerCase()),
  );

  const isActive = selected.length > 0;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          height: 30,
          padding: "0 10px",
          borderRadius: 6,
          border: `1px solid ${isActive ? t.primary : t.borderStrong}`,
          background: isActive ? t.primaryBgSubtle : t.bgCard,
          color: isActive ? t.primary : t.textSecondary,
          fontFamily: "Sora,sans-serif",
          fontSize: 11.5,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          position: "relative",
        }}
      >
        {icon}
        {label}
        {isActive && (
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 999,
              background: t.primary,
              color: t.textInverse,
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            width: 240,
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
              Filter by {label}
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
                padding: "6px 8px",
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
                  height: 28,
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

          <div style={{ maxHeight: 240, overflowY: "auto", padding: "4px 0" }}>
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
                      padding: "6px 10px",
                      cursor: "pointer",
                      background: checked ? t.primaryBgSubtle : "transparent",
                      borderLeft: checked
                        ? `3px solid ${t.primary}`
                        : "3px solid transparent",
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!checked)
                        e.currentTarget.style.background = t.bgSubtle;
                    }}
                    onMouseLeave={(e) => {
                      if (!checked)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: `1.5px solid ${checked ? t.primary : t.borderStrong}`,
                        background: checked ? t.primary : t.bgCard,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: t.textInverse,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {checked && "✓"}
                    </span>
                    {opt.color && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: opt.color,
                          flexShrink: 0,
                        }}
                      />
                    )}
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
                padding: "6px 10px",
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
      )}
    </div>
  );
}
