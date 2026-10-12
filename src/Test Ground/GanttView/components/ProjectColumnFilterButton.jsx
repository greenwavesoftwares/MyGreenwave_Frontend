import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";
import { useTheme } from "../../useTheme";

/** Find all overflow scroll ancestors (ProjectEditor page scroll, left panel, etc.) */
function getScrollParents(el) {
  const parents = [];
  if (!el) return parents;

  let node = el.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    const ox = style.overflowX;
    const o = style.overflow;
    if (
      /(auto|scroll|overlay)/.test(oy) ||
      /(auto|scroll|overlay)/.test(ox) ||
      /(auto|scroll|overlay)/.test(o)
    ) {
      parents.push(node);
    }
    node = node.parentElement;
  }
  return parents;
}

export default function ProjectColumnFilterButton({
  color,
  columnKey,
  options = [],
  selected = [],
  onChange,
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false); // don't paint until measured
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const POPUP_WIDTH = 220;
  const POPUP_MAX_HEIGHT = 320;
  const GAP = 4;
  const PAD = 8;

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return false;

    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer below button; flip above if needed
    let top = rect.bottom + GAP;
    if (top + Math.min(POPUP_MAX_HEIGHT, 280) > vh - PAD) {
      top = rect.top - Math.min(POPUP_MAX_HEIGHT, 280) - GAP;
    }
    top = Math.max(PAD, Math.min(top, vh - 100));

    // Align to button's right edge
    let left = rect.right - POPUP_WIDTH;
    if (left < PAD) left = rect.left;
    left = Math.max(PAD, Math.min(left, vw - POPUP_WIDTH - PAD));

    setPosition({ top, left });
    return true;
  }, []);

  // Measure before paint whenever open
  useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const ok = updatePosition();
    setReady(ok);

    // Second measure after layout settles (nested ProjectEditor)
    const id = requestAnimationFrame(() => {
      updatePosition();
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [open, updatePosition]);

  // Listen to WINDOW + every scroll parent of the button
  useEffect(() => {
    if (!open) return;

    const btn = buttonRef.current;
    const scrollParents = getScrollParents(btn);

    const onReposition = () => {
      updatePosition();
    };

    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    scrollParents.forEach((p) => p.addEventListener("scroll", onReposition));

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      scrollParents.forEach((p) =>
        p.removeEventListener("scroll", onReposition),
      );
    };
  }, [open, updatePosition]);

  // Outside click
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      if (buttonRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setOpen(false);
      setReady(false);
      setSearch("");
    };

    const tmr = setTimeout(
      () => document.addEventListener("mousedown", onDown),
      0,
    );
    return () => {
      clearTimeout(tmr);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setReady(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = options.filter((o) =>
    String(o.label || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const isActive = selected.length > 0;

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (open) {
      setOpen(false);
      setReady(false);
      setSearch("");
      return;
    }

    updatePosition();
    setOpen(true);
  };

  const popup =
    open &&
    createPortal(
      <div
        ref={popupRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: POPUP_WIDTH,
          maxHeight: POPUP_MAX_HEIGHT,
          background: t.bgCard,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 8,
          boxShadow: t.shadowLg,
          zIndex: 2147483646,
          fontFamily: "Sora,sans-serif",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          // Hide until we have a real position (prevents "stuck at top")
          opacity: ready ? 1 : 0,
          pointerEvents: ready ? "auto" : "none",
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
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary }}>
            Filter{" "}
            {String(columnKey || "")
              .charAt(0)
              .toUpperCase() + String(columnKey || "").slice(1)}
          </span>
          {isActive && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                background: "none",
                border: "none",
                color: t.danger,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
                padding: 0,
                fontFamily: "Sora,sans-serif",
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
              flexShrink: 0,
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

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
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
              const checked = selected.includes(opt.value);
              return (
                <div
                  key={String(opt.value)}
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
              flexShrink: 0,
            }}
          >
            {selected.length} of {options.length} selected
          </div>
        )}
      </div>,
      document.body,
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
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
              lineHeight: 1,
            }}
          >
            {selected.length}
          </span>
        )}
      </button>
      {popup}
    </>
  );
}
