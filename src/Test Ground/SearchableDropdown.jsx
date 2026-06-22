import { Search, ChevronDown, X, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ─── Searchable Dropdown Component ─── */
function SearchableDropdown({
  value,
  onChange,
  options = [], // [{ value, label, sublabel?, icon?, disabled?, group? }]
  placeholder = "Select...",
  emptyMessage = "No options available",
  searchPlaceholder = "Search...",
  disabled = false,
  multiple = false, // for multi-select
  width = "100%",
  maxHeight = 280,
  searchable = true,
  renderOption, // optional custom renderer
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [open, searchable]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        (o.label || "").toLowerCase().includes(q) ||
        (o.sublabel || "").toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q),
    );
  }, [options, search]);

  // Group options
  const groupedOptions = useMemo(() => {
    const groups = {};
    filteredOptions.forEach((opt) => {
      const key = opt.group || "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  const selectedValues = useMemo(
    () => (multiple ? value || [] : value ? [value] : []),
    [value, multiple],
  );

  const selectedOptions = options.filter((o) =>
    selectedValues.includes(o.value),
  );

  const handleSelect = (optValue) => {
    if (multiple) {
      const newValue = selectedValues.includes(optValue)
        ? selectedValues.filter((v) => v !== optValue)
        : [...selectedValues, optValue];
      onChange(newValue);
    } else {
      onChange(optValue);
      setOpen(false);
      setSearch("");
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : "");
  };

  // Display text for trigger
  const triggerText = () => {
    if (selectedOptions.length === 0) {
      return <span style={{ color: "#94A3B8" }}>{placeholder}</span>;
    }
    if (multiple) {
      if (selectedOptions.length <= 2) {
        return (
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {selectedOptions.map((o) => (
              <span
                key={o.value}
                style={{
                  background: "#DBEAFE",
                  color: "#1D4ED8",
                  border: "1px solid #93C5FD",
                  borderRadius: 4,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {o.label}
              </span>
            ))}
          </span>
        );
      }
      return (
        <span style={{ display: "flex", gap: 4 }}>
          <span
            style={{
              background: "#DBEAFE",
              color: "#1D4ED8",
              border: "1px solid #93C5FD",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {selectedOptions[0].label}
          </span>
          <span
            style={{
              background: "#F1F5F9",
              color: "#64748B",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            +{selectedOptions.length - 1} more
          </span>
        </span>
      );
    }
    return <span style={{ color: "#0F172A" }}>{selectedOptions[0].label}</span>;
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        style={{
          ...inputStyle,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          paddingRight: 28,
          position: "relative",
          opacity: disabled ? 0.6 : 1,
          background: open ? "#F8FAFC" : "#fff",
          borderColor: open ? "#3B82F6" : "#CBD5E1",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textAlign: "left",
          }}
        >
          {triggerText()}
        </span>

        {selectedOptions.length > 0 && !disabled && (
          <span
            onClick={handleClear}
            title="Clear"
            style={{
              padding: 2,
              borderRadius: 4,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
              e.currentTarget.style.color = "#475569";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            <X size={12} />
          </span>
        )}

        <ChevronDown
          size={14}
          style={{
            color: "#64748B",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
            zIndex: 100,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Bar */}
          {searchable && options.length > 5 && (
            <div
              style={{
                padding: "8px",
                borderBottom: "1px solid #E2E8F0",
                background: "#F8FAFC",
                position: "relative",
              }}
            >
              <Search
                size={13}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearch("");
                  }
                }}
                style={{
                  width: "100%",
                  height: 30,
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  padding: "0 10px 0 28px",
                  fontFamily: "Sora,sans-serif",
                  fontSize: 12,
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div
            style={{
              maxHeight,
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E1 transparent",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: 12,
                }}
              >
                {search ? `No results for "${search}"` : emptyMessage}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, opts]) => (
                <div key={groupName || "default"}>
                  {groupName && (
                    <div
                      style={{
                        padding: "6px 12px 4px",
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background: "#FAFBFC",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      {groupName}
                    </div>
                  )}
                  {opts.map((opt) => {
                    const selected = selectedValues.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "8px 12px",
                          cursor: opt.disabled ? "not-allowed" : "pointer",
                          background: selected ? "#F0F9FF" : "transparent",
                          opacity: opt.disabled ? 0.5 : 1,
                          transition: "background .1s",
                          borderLeft: selected
                            ? "3px solid #1D4ED8"
                            : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!opt.disabled && !selected) {
                            e.currentTarget.style.background = "#F8FAFC";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {/* Checkbox for multi-select */}
                        {multiple && (
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: `1.5px solid ${selected ? "#1D4ED8" : "#CBD5E1"}`,
                              background: selected ? "#1D4ED8" : "#fff",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              color: "#fff",
                            }}
                          >
                            {selected && <Check size={11} strokeWidth={3} />}
                          </span>
                        )}

                        {/* Custom or default render */}
                        {renderOption ? (
                          renderOption(opt, selected)
                        ) : (
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: selected ? 600 : 500,
                                color: "#0F172A",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {opt.icon && (
                                <span style={{ marginRight: 5 }}>
                                  {opt.icon}
                                </span>
                              )}
                              {opt.label}
                            </div>
                            {opt.sublabel && (
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "#94A3B8",
                                  marginTop: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {opt.sublabel}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Selected indicator for single-select */}
                        {!multiple && selected && (
                          <Check size={14} color="#1D4ED8" strokeWidth={2.5} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer for multi-select */}
          {multiple && filteredOptions.length > 0 && (
            <div
              style={{
                padding: "6px 12px",
                borderTop: "1px solid #E2E8F0",
                background: "#FAFBFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 10.5,
                color: "#64748B",
              }}
            >
              <span>
                {selectedValues.length} of {filteredOptions.length} selected
              </span>
              {selectedValues.length > 0 && (
                <button
                  onClick={() => onChange([])}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    cursor: "pointer",
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default SearchableDropdown;
