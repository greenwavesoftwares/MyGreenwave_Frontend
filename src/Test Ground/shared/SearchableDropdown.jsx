import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { useTheme } from "../useTheme";

/**
 * A dropdown with search, single or multi-select, grouped options,
 * portal-rendered popup, and full theming support.
 *
 * Options shape:
 *   { value, label, sublabel?, group?, disabled? }
 */
export default function SearchableDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  emptyMessage = "No options available",
  searchPlaceholder = "Search...",
  disabled = false,
  multiple = false,
  width = "100%",
  maxHeight = 280,
  searchable = true,
  renderOption,
  renderTrigger,
}) {
  const { t } = useTheme();

  // ── State ─────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // ── Refs ──────────────────────────────────────────────
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const searchInputRef = useRef(null);

  // ── Position calculation ──────────────────────────────
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let popupHeight = 320;
    if (popupRef.current) popupHeight = popupRef.current.offsetHeight;

    const popupMaxWidth = 360;
    const spacing = 4;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow >= popupHeight + spacing) {
      top = rect.bottom + window.scrollY + spacing;
    } else if (spaceAbove > spaceBelow && spaceAbove >= popupHeight + spacing) {
      top = rect.top + window.scrollY - popupHeight - spacing;
    } else {
      top = rect.bottom + window.scrollY + spacing;
    }

    let left = rect.left + window.scrollX;
    if (left + popupMaxWidth > viewportWidth) {
      left = Math.max(8, viewportWidth - popupMaxWidth - 8 + window.scrollX);
    }

    setPosition({ top, left, width: rect.width });
  }, []);

  // ── Open/close listeners ──────────────────────────────
  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handler = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setOpen(false);
      setSearch("");
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);

    const repositionHandler = () => updatePosition();
    window.addEventListener("scroll", repositionHandler, true);
    window.addEventListener("resize", repositionHandler);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", repositionHandler, true);
      window.removeEventListener("resize", repositionHandler);
    };
  }, [open, updatePosition]);

  // ── Focus search input when opened ────────────────────
  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [open, searchable]);

  // ── Dedupe + validate options ─────────────────────────
  const safeOptions = useMemo(() => {
    const seen = new Set();
    return options.filter((opt) => {
      if (!opt) return false;
      const v = opt.value;
      if (typeof v !== "string" && typeof v !== "number") return false;
      const key = String(v);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [options]);

  // ── Filter by search ──────────────────────────────────
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return safeOptions;
    const q = search.toLowerCase();
    return safeOptions.filter(
      (o) =>
        (o.label || "").toLowerCase().includes(q) ||
        (o.sublabel || "").toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q),
    );
  }, [safeOptions, search]);

  // ── Group options ─────────────────────────────────────
  const groupedOptions = useMemo(() => {
    const groups = {};
    filteredOptions.forEach((opt) => {
      const key = opt.group || "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  // ── Normalize selected values ─────────────────────────
  const selectedValues = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value.map(String) : [];
    return value ? [String(value)] : [];
  }, [value, multiple]);

  // ── Find selected option objects ──────────────────────
  const selectedOptions = useMemo(() => {
    const seen = new Set();
    return safeOptions.filter((o) => {
      const k = String(o.value);
      if (!selectedValues.includes(k)) return false;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [safeOptions, selectedValues]);

  // ── Re-measure position after popup renders ───────────
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [open, filteredOptions.length, updatePosition]);

  // ── Event handlers ────────────────────────────────────
  const handleSelect = (optValue) => {
    const strValue = String(optValue);
    if (multiple) {
      const newValue = selectedValues.includes(strValue)
        ? selectedValues.filter((v) => v !== strValue)
        : [...selectedValues, strValue];
      onChange(newValue);
    } else {
      onChange(strValue);
      setOpen(false);
      setSearch("");
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : "");
  };

  const triggerText = () => {
    if (selectedOptions.length === 0) {
      return (
        <span style={{ color: t.textFaint, fontSize: 12 }}>{placeholder}</span>
      );
    }

    if (!multiple && renderTrigger) {
      return renderTrigger(selectedOptions[0]);
    }

    if (multiple) {
      if (selectedOptions.length <= 2) {
        return (
          <span
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "nowrap",
              overflow: "hidden",
            }}
          >
            {selectedOptions.map((o) => (
              <span
                key={`badge-${String(o.value)}`}
                style={{
                  background: t.primaryBg,
                  color: t.primary,
                  border: `1px solid ${t.primaryBorder}`,
                  borderRadius: 4,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 100,
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
              background: t.primaryBg,
              color: t.primary,
              border: `1px solid ${t.primaryBorder}`,
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 500,
              maxWidth: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedOptions[0].label}
          </span>
          <span
            style={{
              background: t.bgMuted,
              color: t.textMuted,
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            +{selectedOptions.length - 1} more
          </span>
        </span>
      );
    }

    return (
      <span
        style={{
          color: t.textPrimary,
          fontSize: 12,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {selectedOptions[0].label}
      </span>
    );
  };

  // ── Portal popup ──────────────────────────────────────
  const popup = open ? (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        minWidth: position.width,
        width: "max-content",
        maxWidth: 360,
        maxHeight: Math.min(420, window.innerHeight - 40),
        background: t.bgCard,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 8,
        boxShadow: t.shadowLg,
        zIndex: 99999,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Sora,sans-serif",
      }}
    >
      {/* Search bar */}
      {searchable && safeOptions.length > 5 && (
        <div
          style={{
            padding: "8px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
            position: "relative",
          }}
        >
          <Search
            size={13}
            color={t.textFaint}
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
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: "0 10px 0 28px",
              fontFamily: "Sora,sans-serif",
              fontSize: 12,
              outline: "none",
              background: t.bgInput,
              color: t.textPrimary,
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Options list */}
      <div style={{ maxHeight, overflowY: "auto" }}>
        {filteredOptions.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: t.textFaint,
              fontSize: 12,
            }}
          >
            {search ? `No results for "${search}"` : emptyMessage}
          </div>
        ) : (
          Object.entries(groupedOptions).map(([groupName, opts], gIdx) => (
            <div key={`grp-${gIdx}`}>
              {groupName && (
                <div
                  style={{
                    padding: "6px 12px 4px",
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: t.textFaint,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: t.bgSubtle,
                    borderBottom: `1px solid ${t.borderSubtle}`,
                  }}
                >
                  {groupName}
                </div>
              )}
              {opts.map((opt, oIdx) => {
                const optKey = `opt-${gIdx}-${oIdx}-${String(opt.value)}`;
                const selected = selectedValues.includes(String(opt.value));
                return (
                  <div
                    key={optKey}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "8px 12px",
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                      background: selected ? t.primaryBgSubtle : "transparent",
                      opacity: opt.disabled ? 0.5 : 1,
                      transition: "background .1s",
                      borderLeft: selected
                        ? `3px solid ${t.primary}`
                        : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!opt.disabled && !selected) {
                        e.currentTarget.style.background = t.bgSubtle;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {multiple && (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `1.5px solid ${selected ? t.primary : t.borderStrong}`,
                          background: selected ? t.primary : t.bgCard,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: t.textInverse,
                        }}
                      >
                        {selected && <Check size={11} strokeWidth={3} />}
                      </span>
                    )}

                    {renderOption ? (
                      renderOption(opt, selected)
                    ) : (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: selected ? 600 : 500,
                            color: t.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {opt.label}
                        </div>
                        {opt.sublabel && (
                          <div
                            style={{
                              fontSize: 10.5,
                              color: t.textFaint,
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

                    {!multiple && selected && (
                      <Check size={14} color={t.primary} strokeWidth={2.5} />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Multi-select footer */}
      {multiple && filteredOptions.length > 0 && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: `1px solid ${t.border}`,
            background: t.bgSubtle,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 10.5,
            color: t.textMuted,
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
                color: t.danger,
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
  ) : null;

  // ── Trigger button ────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: "relative", width }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 32,
          border: `1px solid ${open ? t.borderFocus : t.borderStrong}`,
          borderRadius: 6,
          background: disabled
            ? t.bgInputDisabled
            : open
              ? t.bgSubtle
              : t.bgInput,
          color: t.textPrimary,
          padding: "0 8px 0 10px",
          fontFamily: "Sora,sans-serif",
          fontSize: 12,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: disabled ? 0.6 : 1,
          outline: "none",
          boxSizing: "border-box",
          textAlign: "left",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
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
              color: t.textFaint,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.bgMuted;
              e.currentTarget.style.color = t.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = t.textFaint;
            }}
          >
            <X size={12} />
          </span>
        )}

        <ChevronDown
          size={13}
          style={{
            color: t.textMuted,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s",
            flexShrink: 0,
          }}
        />
      </button>

      {open && createPortal(popup, document.body)}
    </div>
  );
}
