import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Filter, Search } from "lucide-react";
import "./ColumnFilter.css";

/**
 * Filter icon + checkbox dropdown for a single table column.
 *
 * Visual/behavioral pattern is deliberately the same as the Gantt view's
 * per-column filter button (ProjectColumnFilterButton): a small square icon
 * button (badge shows the active count) that opens a portal-rendered popup
 * positioned from the button's own bounding rect. Rendering the popup
 * through a portal — instead of relying on normal document flow like the
 * old MUI Popover did — keeps it from getting clipped by the table's scroll
 * container, and lets us flip it above the button when there isn't room
 * below.
 *
 * Selections apply immediately on click (no separate Apply step), matching
 * the Gantt reference. "Select All" is kept as a convenience for long lists.
 *
 * The icon itself uses one consistent color across every column (no
 * per-field tinting, no background fill) — only the border/icon color and
 * the count badge signal that a filter is active.
 */
const ICON_COLOR = "#3b5bdb";

export default function ColumnFilterButton({
  label,
  options,
  selected,
  onChange,
  color = "#3b5bdb",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 230 });
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const selectedSet = selected || new Set();
  const isActive = selectedSet.size > 0;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewportWidth = vv ? vv.width : window.innerWidth;
    const viewportHeight = vv ? vv.height : window.innerHeight;
    const offsetLeft = vv ? vv.offsetLeft : 0;
    const offsetTop = vv ? vv.offsetTop : 0;

    const popupWidth = Math.min(230, viewportWidth - 20);
    const popupHeight = Math.min(320, viewportHeight - 20);
    const spacing = 4;

    let top = rect.bottom + spacing;
    if (top + popupHeight > offsetTop + viewportHeight - 10) {
      top = rect.top - popupHeight - spacing;
    }
    let left = rect.left;
    if (left + popupWidth > offsetLeft + viewportWidth - 10) {
      left = offsetLeft + viewportWidth - popupWidth - 10;
    }
    if (left < offsetLeft + 10) left = offsetLeft + 10;
    setPosition({ top, left, width: popupWidth });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const reposition = () => updatePosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
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

  const filteredOptions = useMemo(
    () =>
      (options || []).filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase()),
      ),
    [options, search],
  );

  const toggleOption = (opt) => {
    const next = new Set(selectedSet);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(next);
  };

  const handleClear = () => onChange(new Set());

  const popup = open ? (
    <div
      ref={popupRef}
      onClick={(e) => e.stopPropagation()}
      className="col-filter-panel"
      style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
    >
      <div className="col-filter-panel__header">
        <span className="col-filter-panel__title">Filter {label}</span>
        {isActive && (
          <button className="col-filter-panel__clear" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>

      {(options || []).length > 5 && (
        <div className="col-filter-panel__search">
          <Search size={13} className="col-filter-panel__search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label}...`}
            autoFocus
          />
        </div>
      )}

      <div className="col-filter-panel__list">
        {filteredOptions.length === 0 ? (
          <div className="col-filter-panel__empty">No options</div>
        ) : (
          filteredOptions.map((opt) => {
            const checked = selectedSet.has(opt);
            return (
              <div
                key={opt}
                className="col-filter-option"
                onClick={() => toggleOption(opt)}
                style={{
                  background: checked ? `${color}1A` : undefined,
                  borderLeft: `3px solid ${checked ? color : "transparent"}`,
                }}
              >
                <span
                  className={`col-filter-checkbox${checked ? " col-filter-checkbox--checked" : ""}`}
                  style={
                    checked ? { borderColor: color, background: color } : undefined
                  }
                >
                  {checked && <span className="col-filter-checkbox__mark">✓</span>}
                </span>
                <span className="col-filter-option__label" title={opt}>
                  {opt}
                </span>
              </div>
            );
          })
        )}
      </div>

      {isActive && (
        <div className="col-filter-panel__footer">
          {selectedSet.size} of {(options || []).length} selected
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        title={`Filter ${label}`}
        className={`col-filter-btn${isActive ? " col-filter-btn--active" : ""}`}
        style={isActive ? { borderColor: ICON_COLOR, color: ICON_COLOR } : undefined}
      >
        <Filter size={11} />
        {isActive && (
          <span className="col-filter-badge" style={{ background: ICON_COLOR }}>
            {selectedSet.size}
          </span>
        )}
      </button>
      {open && createPortal(popup, document.body)}
    </>
  );
}
