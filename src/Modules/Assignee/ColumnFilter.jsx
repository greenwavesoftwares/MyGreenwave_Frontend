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

/** Shared portal-popup positioning + outside-click-to-close behavior used by
 * both ColumnFilterButton (checkbox list) and PlannedStartFilterButton
 * (radio-style All/Today). Keeping this in one place means every column's
 * filter popup behaves identically (same flip-above-when-no-room logic,
 * same dismiss behavior) even though the popup contents differ. */
function useFilterPopup(open, onClose, popupWidth = 230) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: popupWidth });
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewportWidth = vv ? vv.width : window.innerWidth;
    const viewportHeight = vv ? vv.height : window.innerHeight;
    const offsetLeft = vv ? vv.offsetLeft : 0;
    const offsetTop = vv ? vv.offsetTop : 0;

    const width = Math.min(popupWidth, viewportWidth - 20);
    const height = Math.min(320, viewportHeight - 20);
    const spacing = 4;

    let top = rect.bottom + spacing;
    if (top + height > offsetTop + viewportHeight - 10) {
      top = rect.top - height - spacing;
    }
    let left = rect.left;
    if (left + width > offsetLeft + viewportWidth - 10) {
      left = offsetLeft + viewportWidth - width - 10;
    }
    if (left < offsetLeft + 10) left = offsetLeft + 10;
    setPosition({ top, left, width });
  }, [popupWidth]);

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
      onClose();
    };
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

  return { position, buttonRef, popupRef };
}

export default function ColumnFilterButton({
  label,
  options,
  selected,
  onChange,
  color = "#3b5bdb",
  currentUser,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);
  const { position, buttonRef, popupRef } = useFilterPopup(open, close);

  const selectedSet = selected || new Set();
  const isActive = selectedSet.size > 0;

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

      {label === "Resource" && currentUser && (
        <div className="col-filter-panel__onlyme">
          {(() => {
            const onlyMeChecked =
              selectedSet.size === 1 && selectedSet.has(currentUser);
            return (
              <div
                className="col-filter-option"
                onClick={() =>
                  onChange(onlyMeChecked ? new Set() : new Set([currentUser]))
                }
                style={{
                  background: onlyMeChecked ? `${color}1A` : undefined,
                  borderLeft: `3px solid ${onlyMeChecked ? color : "transparent"}`,
                }}
              >
                <span
                  className={`col-filter-checkbox${onlyMeChecked ? " col-filter-checkbox--checked" : ""}`}
                  style={
                    onlyMeChecked
                      ? { borderColor: color, background: color }
                      : undefined
                  }
                >
                  {onlyMeChecked && (
                    <span className="col-filter-checkbox__mark">✓</span>
                  )}
                </span>
                <span className="col-filter-option__label">Only me</span>
              </div>
            );
          })()}
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

/** Bucket keys for the date-range quick filter, in the order they're
 * presented in the dropdown: past → present (narrow → wide) → future.
 * "Today" sits right before "Current Month" since it's the narrower,
 * more specific slice of the same "now" the wider option covers. */
export const DATE_RANGE_BUCKETS = [
  { key: "Today", text: "Today" },
  { key: "CurrentMonth", text: "Current Month" },
  { key: "LastMonth", text: "Last Month" },
  { key: "UpcomingMonth", text: "Upcoming Month" },
];

/**
 * Filter icon for any date column (Planned Start, Planned Stop, Actual
 * Start, Actual Stop, ...): same button/popup chrome as ColumnFilterButton,
 * but a single-select radio list ("All" plus the DATE_RANGE_BUCKETS above)
 * instead of a multi-select checkbox list, since only one date range can
 * be active for a column at a time. `label` is whatever column this is
 * attached to (e.g. "Actual Stop") so the popup title and tooltip are
 * accurate for each column that reuses this component.
 *
 * `value` is the selected bucket key (one of DATE_RANGE_BUCKETS' `key`s)
 * or null/undefined for "All". Stays open after a selection — same as
 * ColumnFilterButton's checkboxes — so the person can see the choice
 * register and dismiss it deliberately instead of it vanishing under
 * their cursor.
 */
export function DateRangeFilterButton({
  label = "Date",
  value,
  onChange,
  color = "#B45309",
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { position, buttonRef, popupRef } = useFilterPopup(open, close, 180);

  const select = (key) => {
    // Clicking the option that's already selected unchecks it, same as a
    // checkbox — falls back to "All" rather than being stuck once picked.
    onChange(key === value ? null : key);
  };

  const optionList = [{ key: null, text: "All" }, ...DATE_RANGE_BUCKETS];

  const popup = open ? (
    <div
      ref={popupRef}
      onClick={(e) => e.stopPropagation()}
      className="col-filter-panel"
      style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
    >
      <div className="col-filter-panel__header">
        <span className="col-filter-panel__title">Filter {label}</span>
      </div>

      <div className="col-filter-panel__list">
        {optionList.map(({ key, text }) => {
          const checked = (value || null) === key;
          return (
            <div
              key={text}
              className="col-filter-option"
              onClick={() => select(key)}
              style={{
                background: checked ? `${color}1A` : undefined,
                borderLeft: `3px solid ${checked ? color : "transparent"}`,
              }}
            >
              <span
                className={`col-filter-checkbox${checked ? " col-filter-checkbox--checked" : ""}`}
                style={checked ? { borderColor: color, background: color } : undefined}
              >
                {checked && <span className="col-filter-checkbox__mark">✓</span>}
              </span>
              <span className="col-filter-option__label">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const isActive = !!value;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        title={`Filter ${label}`}
        className={`col-filter-btn${isActive ? " col-filter-btn--active" : ""}`}
        style={isActive ? { borderColor: color, color } : undefined}
      >
        <Filter size={11} />
        {isActive && (
          <span className="col-filter-badge" style={{ background: color }}>
            1
          </span>
        )}
      </button>
      {open && createPortal(popup, document.body)}
    </>
  );
}
