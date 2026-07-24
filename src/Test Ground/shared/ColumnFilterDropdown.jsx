import React, { useState, useEffect, useRef } from "react";
import { Filter, Check } from "lucide-react";
import { useTheme } from "../useTheme";

/**
 * Small dropdown attached to column headers.
 * Two modes:
 *  - "multi": checkbox list, options=[string|{value,label}], selected=string[]
 *  - "text":  single free-text filter, selected=string, options=[]
 */
export default function ColumnFilterDropdown({
  label,
  options,
  selected,
  onChange,
  type = "multi",
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => {
    const lbl = typeof o === "string" ? o : o.label;
    return lbl.toLowerCase().includes(search.toLowerCase());
  });

  const isActive =
    type === "multi" ? selected.length > 0 : selected.trim() !== "";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
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
          {/* Header */}
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

          {/* Multi-select search box */}
          {type === "multi" && options.length > 5 && (
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

          {/* Text mode input */}
          {type === "text" && (
            <div style={{ padding: 8 }}>
              <input
                value={selected}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type to filter…"
                autoFocus
                style={{
                  width: "100%",
                  height: 30,
                  border: `1px solid ${t.border}`,
                  borderRadius: 5,
                  padding: "0 8px",
                  fontSize: 11.5,
                  fontFamily: "Sora,sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
            </div>
          )}

          {/* Multi-select options list */}
          {type === "multi" && (
            <div
              style={{
                maxHeight: 200,
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
                  const label = typeof opt === "string" ? opt : opt.label;
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
                        }}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: t.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: checked ? 600 : 400,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Multi-select footer count */}
          {type === "multi" && selected.length > 0 && (
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
        </div>
      )}
    </div>
  );
}
