import React, { useState, useEffect, useRef } from "react";

/**
 * Multi-select dropdown picker component
 */
function MultiSelectPicker({
  t,
  pickerRef,
  open,
  setOpen,
  disabled,
  summary,
  allLabel,
  allSelected,
  onSelectAll,
  options,
  selected,
  onToggle,
  dropdownStyle,
  searchPlaceholder = "Search…",
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  // Reset the search each time the dropdown closes; focus it each time it opens
  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const filteredOptions = q
    ? options.filter((name) => String(name).toLowerCase().includes(q))
    : options;

  return (
    <div ref={pickerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        style={{
          ...dropdownStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {summary}
        </span>
        <span style={{ fontSize: 9, color: t.textMuted }}>{"▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 40,
            background: t.pickerBg,
            border: `1px solid ${t.pickerBorder}`,
            borderRadius: 10,
            boxShadow: t.pickerShadow,
            minWidth: 220,
            maxHeight: 300,
            display: "flex",
            flexDirection: "column",
            padding: 6,
          }}
        >
          {/* Sticky search box */}
          <div style={{ position: "relative", padding: "2px 2px 6px" }}>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (query) {
                    setQuery("");
                  } else {
                    setOpen(false);
                  }
                }
              }}
              placeholder={searchPlaceholder}
              aria-label="Search options"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 12,
                padding: "6px 24px 6px 8px",
                borderRadius: 6,
                border: `1px solid ${t.pickerBorder}`,
                background: t.pickerBg,
                color: t.pickerText,
                outline: "none",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                title="Clear search"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-60%)",
                  border: "none",
                  background: "transparent",
                  color: t.pickerText,
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0.6,
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* Hide "All" while searching, since it would be ambiguous */}
            {!q && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: t.pickerText,
                  fontWeight: 600,
                  padding: "6px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  borderBottom: `1px solid ${t.pickerDivider}`,
                  marginBottom: 2,
                }}
              >
                <input type="checkbox" checked={allSelected} onChange={onSelectAll} /> {allLabel}
              </label>
            )}

            {filteredOptions.map((name) => (
              <label
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: t.pickerText,
                  padding: "6px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(name)}
                  onChange={() => onToggle(name)}
                />{" "}
                {name}
              </label>
            ))}

            {filteredOptions.length === 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                No matches
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelectPicker;