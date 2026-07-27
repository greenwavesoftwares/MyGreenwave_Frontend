import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Clock,
  Users,
  ZoomIn,
  ZoomOut,
  Calendar,
  MessageSquare,
  Star,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  X,
  Briefcase,
  Filter,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useTheme } from "./useTheme";
import { Link2 } from "lucide-react";
import { computeArrows } from "./helpers/ganttArrows";
import DependencyArrows from "./shared/DependencyArrows";
import { useResponsive } from "./useResponsive";
import BottomSheet from "./shared/BottomSheet";
import { Menu, ChevronLeft, Sliders } from "lucide-react";
/* ─── Constants ─── */
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const ROW_HEIGHT = 44;
const SUB_HEADER_HEIGHT = 32;
const HEADER_HEIGHT = 56;
const LEFT_PANEL_WIDTH_COLLAPSED = 300;
const LEFT_PANEL_WIDTH_EXPANDED = 480;
const MIN_COL_WIDTH = 20;
const MAX_COL_WIDTH = 200;

const COL_TASK_WIDTH = 240;
const COL_MODULE_WIDTH = 120;
const COL_RESOURCE_WIDTH = 130;
const COL_STATUS_WIDTH = 100;
const LEFT_PANEL_WIDTH =
  COL_TASK_WIDTH + COL_MODULE_WIDTH + COL_RESOURCE_WIDTH + COL_STATUS_WIDTH;

/* ─── Zoom Config ─── */
const ZOOM_CONFIGS = {
  hour: {
    label: "Hours",
    unitMs: HOUR_MS,
    defaultColWidth: 60,
    tickFormat: (d) => `${String(d.getHours()).padStart(2, "0")}:00`,
    majorFormat: (d) =>
      d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    majorUnitMs: DAY_MS,
  },
  day: {
    label: "Days",
    unitMs: DAY_MS,
    defaultColWidth: 80,
    tickFormat: (d) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    majorFormat: (d) =>
      d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    majorUnitMs: 30 * DAY_MS,
  },
  week: {
    label: "Weeks",
    unitMs: WEEK_MS,
    defaultColWidth: 100,
    tickFormat: (d) => {
      const start = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
      return `W ${start}`;
    },
    majorFormat: (d) =>
      d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    majorUnitMs: 30 * DAY_MS,
  },
};

/* ─── Status Colors Factory (theme-aware) ─── */
function makeStatusColors(t) {
  return {
    pending: {
      bg: t.bgMuted,
      color: t.textMuted,
      border: t.borderStrong,
      bar: t.textFaint,
    },
    "not ready": {
      bg: t.warningBg,
      color: t.warning,
      border: t.warningBorder,
      bar: "#F59E0B",
    },
    rejected: {
      bg: t.dangerBg,
      color: t.danger,
      border: t.dangerBorder,
      bar: "#EF4444",
    },
    paused: {
      bg: "#FFEDD5",
      color: "#C2410C",
      border: "#FDBA74",
      bar: "#F97316",
    },
    running: {
      bg: t.primaryBg,
      color: t.primary,
      border: t.primaryBorder,
      bar: "#3B82F6",
    },
    completed: {
      bg: t.successBg,
      color: t.success,
      border: t.successBorder,
      bar: "#22C55E",
    },
    finished: {
      bg: t.violetBg,
      color: t.violet,
      border: t.violetBorder,
      bar: "#8B5CF6",
    },
    closed: {
      bg: t.closedBg,
      color: t.closedText,
      border: t.closedBorder,
      bar: "#64748B",
    },
  };
}

function getStatusColor(status, t) {
  const STATUS_COLORS = makeStatusColors(t);
  const key = String(status || "pending")
    .toLowerCase()
    .trim();
  return STATUS_COLORS[key] || STATUS_COLORS.pending;
}

/* ─── Helpers (pure, no theme) ─── */
function parseDt(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

function fmtDisplay(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtHrMin(hrs) {
  if (hrs === null || hrs === undefined || isNaN(hrs)) return "—";
  const totalMinutes = Math.round(Math.abs(hrs) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const sign = hrs < 0 ? "-" : "";
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

function generateTicks(startMs, endMs, unitMs) {
  const ticks = [];
  const first = Math.floor(startMs / unitMs) * unitMs;
  let cur = first;
  while (cur <= endMs + unitMs) {
    ticks.push(new Date(cur));
    cur += unitMs;
  }
  return ticks;
}

function generateMajorTicks(startMs, endMs) {
  const ticks = [];
  const start = new Date(startMs);
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur.getTime() <= endMs + DAY_MS * 31) {
    ticks.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return ticks;
}

/* ─── Project Color Palette (kept vibrant for identity) ─── */
const PROJECT_COLORS = [
  "#1D4ED8",
  "#15803D",
  "#7C3AED",
  "#B45309",
  "#BE185D",
  "#0F766E",
  "#B91C1C",
  "#0369A1",
  "#4D7C0F",
  "#9333EA",
  "#C2410C",
  "#115E59",
];

/* ─── Delay Detection ─── */
function isDelayed(row) {
  const status = String(row.status || "")
    .toLowerCase()
    .trim();
  if (status !== "completed" && status !== "finished") return false;
  const plannedStop = parseDt(row.plannedStop);
  const actualStop = parseDt(row.actualStop);
  if (!plannedStop || !actualStop) return false;
  return actualStop.getTime() > plannedStop.getTime();
}

function getDelayedColor(t) {
  return {
    bg: t.dangerBg,
    color: t.danger,
    border: t.dangerBorder,
    bar: "#EF4444",
  };
}

/* ─── Lane Assignment ─── */
function assignLanes(tasks) {
  const sorted = tasks
    .map((t) => {
      const start = parseDt(t.plannedStart);
      const end = parseDt(t.plannedStop);
      const actualStart = parseDt(t.actualStart);
      const actualEnd = parseDt(t.actualStop);
      const effectiveStart =
        start && actualStart
          ? Math.min(start.getTime(), actualStart.getTime())
          : (start || actualStart)?.getTime() || 0;
      const effectiveEnd =
        end && actualEnd
          ? Math.max(end.getTime(), actualEnd.getTime())
          : (end || actualEnd)?.getTime() || 0;
      return {
        ...t,
        _effectiveStart: effectiveStart,
        _effectiveEnd: effectiveEnd,
      };
    })
    .filter((t) => t._effectiveStart && t._effectiveEnd)
    .sort((a, b) => a._effectiveStart - b._effectiveStart);

  const lanes = [];
  sorted.forEach((task) => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (task._effectiveStart >= lanes[i]) {
        lanes[i] = task._effectiveEnd;
        task._lane = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      task._lane = lanes.length;
      lanes.push(task._effectiveEnd);
    }
  });

  tasks.forEach((t) => {
    const found = sorted.find((s) => s.id === t.id);
    t._lane = found ? found._lane : 0;
  });

  return {
    tasks: tasks.map((t) => {
      const found = sorted.find((s) => s.id === t.id);
      return { ...t, _lane: found ? found._lane : 0 };
    }),
    laneCount: Math.max(lanes.length, 1),
  };
}

/* ─── Themed Tooltip ─── */
function GanttTooltip({ row, x, y, onClose, onOpenComments, onFeedback }) {
  const { t } = useTheme();
  const ref = useRef(null);
  const delayed = isDelayed(row);
  const sc = delayed ? getDelayedColor(t) : getStatusColor(row.status, t);
  const hasActual = row.actualStart || row.actualStop;
  const isFinished =
    String(row.status || "")
      .toLowerCase()
      .trim() === "finished";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: Math.min(x, window.innerWidth - 300),
        top: Math.min(y + 10, window.innerHeight - 380),
        width: 280,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        boxShadow: t.shadowLg,
        zIndex: 9999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          background: sc.bg,
          borderBottom: `1px solid ${sc.border}`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              color: t.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.task || "—"}
          </div>
          <div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 2 }}>
            {row.module || "—"} {row._projectName && `• ${row._projectName}`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 9.5,
              fontWeight: 700,
              background: sc.bg,
              color: sc.color,
              border: `1px solid ${sc.border}`,
              whiteSpace: "nowrap",
              textTransform: "capitalize",
            }}
          >
            {row.status || "Pending"}
          </span>
          {delayed && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 700,
                background: t.dangerBg,
                color: t.danger,
                border: `1px solid ${t.dangerBorder}`,
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <AlertTriangle size={9} />
              Delayed
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: t.textFaint,
            padding: 0,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Users size={12} color={t.textMuted} />
          <span style={{ fontSize: 11.5, color: t.textSecondary }}>
            {row.resourceName || row.resource || "Unassigned"}
          </span>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: t.primary,
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Planned
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}
          >
            <div
              style={{
                padding: "4px 6px",
                background: t.primaryBgSubtle,
                border: `1px solid ${t.primaryBorder}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 8.5, color: t.primary, fontWeight: 600 }}>
                START
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: t.textPrimary,
                }}
              >
                {fmtDisplay(row.plannedStart)}
              </div>
            </div>
            <div
              style={{
                padding: "4px 6px",
                background: t.primaryBgSubtle,
                border: `1px solid ${t.primaryBorder}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 8.5, color: t.primary, fontWeight: 600 }}>
                STOP
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: t.textPrimary,
                }}
              >
                {fmtDisplay(row.plannedStop)}
              </div>
            </div>
          </div>
        </div>

        {hasActual && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: t.success,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              Actual
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
              }}
            >
              <div
                style={{
                  padding: "4px 6px",
                  background: t.successBgSubtle,
                  border: `1px solid ${t.successBorder}`,
                  borderRadius: 4,
                }}
              >
                <div
                  style={{ fontSize: 8.5, color: t.success, fontWeight: 600 }}
                >
                  START
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: t.textPrimary,
                  }}
                >
                  {fmtDisplay(row.actualStart)}
                </div>
              </div>
              <div
                style={{
                  padding: "4px 6px",
                  background: t.successBgSubtle,
                  border: `1px solid ${t.successBorder}`,
                  borderRadius: 4,
                }}
              >
                <div
                  style={{ fontSize: 8.5, color: t.success, fontWeight: 600 }}
                >
                  STOP
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: t.textPrimary,
                  }}
                >
                  {fmtDisplay(row.actualStop)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            padding: "4px 8px",
            background: t.bgSubtle,
            border: `1px solid ${t.border}`,
            borderRadius: 5,
          }}
        >
          <Clock size={11} color={t.textMuted} />
          <span style={{ fontSize: 11, color: t.textSecondary }}>
            Planned: <strong>{fmtHrMin(row.durationHrs)}</strong>
            {row.actualElapsedHrs != null && (
              <>
                {" "}
                | Actual:{" "}
                <strong>{fmtHrMin(Math.abs(row.actualElapsedHrs))}</strong>
              </>
            )}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {row.commentCount > 0 && (
            <button
              onClick={() => {
                onOpenComments(row);
                onClose();
              }}
              style={{
                flex: 1,
                height: 28,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 6,
                background: t.violetBg,
                color: t.violet,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <MessageSquare size={11} />
              Comments ({row.commentCount})
            </button>
          )}
          {isFinished && (
            <button
              onClick={() => {
                onFeedback(row);
                onClose();
              }}
              style={{
                flex: 1,
                height: 28,
                border: `1px solid ${t.violetBorder}`,
                borderRadius: 6,
                background: t.violetBg,
                color: t.violet,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <Star size={11} fill={t.violet} />
              View Rating
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Themed Filter Dropdown (Global toolbar) ─── */
function GanttFilterDropdown({ label, options, selected, onChange, icon }) {
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

/* ─── Themed Project Column Filter Button (Portal) ─── */
function ProjectColumnFilterButton({
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
/* ─── Main GanttView ─── */
export default function GanttView({
  projects = [],
  onOpenComments,
  onFeedback,
  showGlobalFilters = false,
}) {
  const { isMobile } = useResponsive();

  // Mobile-specific state
  const [mobileLeftPanelOpen, setMobileLeftPanelOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileTooltipRow, setMobileTooltipRow] = useState(null);
  console.log("Projects : ", projects);
  const { t } = useTheme();

  const [viewMode, setViewMode] = useState("task");
  const [zoom, setZoom] = useState("day");
  const [colWidthPx, setColWidthPx] = useState(
    ZOOM_CONFIGS.day.defaultColWidth,
  );
  const [tooltip, setTooltip] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(
    () => new Set(projects.map((p) => p.id)),
  );
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [projectFilter, setProjectFilter] = useState([]);
  const [moduleFilter, setModuleFilter] = useState([]);
  const [resourceFilter, setResourceFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const timelineRef = useRef(null);
  const leftPanelRef = useRef(null);

  const [projectFilters, setProjectFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({
    module: [],
    resource: [],
    status: [],
  });
  const [showDependencies, setShowDependencies] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  // Add near your other refs
  const barsRef = useRef(new Map()); // Map<rowId, DOM element>

  // Force re-measure when arrows toggle or data changes
  const [measureVersion, setMeasureVersion] = useState(0);

  // ── Filter projects ──
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (projectFilter.length > 0) {
      result = result.filter((p) => projectFilter.includes(p.id));
    }
    if (
      moduleFilter.length > 0 ||
      resourceFilter.length > 0 ||
      statusFilter.length > 0
    ) {
      result = result
        .map((p) => {
          const filteredRows = (p.rows || []).filter((r) => {
            if (
              moduleFilter.length > 0 &&
              !moduleFilter.includes(r.module || "")
            )
              return false;
            if (
              resourceFilter.length > 0 &&
              !resourceFilter.includes(r.resource || "")
            )
              return false;
            if (
              statusFilter.length > 0 &&
              !statusFilter.includes(r.status || "Pending")
            )
              return false;
            return true;
          });
          const finalIds = new Set(filteredRows.map((r) => r.id));
          filteredRows.forEach((r) => {
            let cur = (p.rows || []).find((x) => x.id === r.parentId);
            while (cur) {
              finalIds.add(cur.id);
              cur = (p.rows || []).find((x) => x.id === cur.parentId);
            }
          });
          return {
            ...p,
            rows: (p.rows || []).filter((r) => finalIds.has(r.id)),
          };
        })
        .filter((p) => p.rows.length > 0);
    }
    return result;
  }, [projects, projectFilter, moduleFilter, resourceFilter, statusFilter]);

  const leftPanelWidth = useMemo(() => {
    const anyExpanded = filteredProjects.some((p) =>
      expandedProjects.has(p.id),
    );
    return anyExpanded ? LEFT_PANEL_WIDTH_EXPANDED : LEFT_PANEL_WIDTH_COLLAPSED;
  }, [filteredProjects, expandedProjects]);

  const syncScroll = useCallback((e) => {
    if (leftPanelRef.current)
      leftPanelRef.current.scrollTop = e.target.scrollTop;
  }, []);

  // ── Resource view data ──
  const resourceViewData = useMemo(() => {
    const map = new Map();
    filteredProjects.forEach((project) => {
      (project.rows || [])
        .filter((r) => !r.parentId)
        .forEach((r) => {
          const key = r.resource || "__unassigned__";
          if (!map.has(key)) {
            map.set(key, {
              userId: key,
              name: r.resourceName || r.resource || "Unassigned",
              tasks: [],
            });
          }
          map.get(key).tasks.push({
            ...r,
            _projectId: project.id,
            _projectName: project.project,
          });
        });
    });
    return Array.from(map.values()).map((res) => {
      const { tasks, laneCount } = assignLanes(res.tasks);
      return { ...res, tasks, laneCount };
    });
  }, [filteredProjects]);

  // ── Date range ──
  const { projectStart, projectEnd, totalMs } = useMemo(() => {
    const allDates = [];
    filteredProjects.forEach((p) => {
      (p.rows || []).forEach((r) => {
        const ps = parseDt(r.plannedStart);
        const pe = parseDt(r.plannedStop);
        const as = parseDt(r.actualStart);
        const ae = parseDt(r.actualStop);
        if (ps) allDates.push(ps.getTime());
        if (pe) allDates.push(pe.getTime());
        if (as) allDates.push(as.getTime());
        if (ae) allDates.push(ae.getTime());
      });
    });
    if (!allDates.length) {
      const now = Date.now();
      return {
        projectStart: now - DAY_MS * 7,
        projectEnd: now + DAY_MS * 7,
        totalMs: DAY_MS * 14,
      };
    }
    const start = Math.min(...allDates) - DAY_MS;
    const end = Math.max(...allDates) + DAY_MS;
    return { projectStart: start, projectEnd: end, totalMs: end - start };
  }, [filteredProjects]);

  const totalChartWidth = useMemo(() => {
    const totalUnits = totalMs / ZOOM_CONFIGS[zoom].unitMs;
    return Math.max(totalUnits * colWidthPx, 800);
  }, [zoom, colWidthPx, totalMs]);

  const ticks = useMemo(
    () => generateTicks(projectStart, projectEnd, ZOOM_CONFIGS[zoom].unitMs),
    [projectStart, projectEnd, zoom],
  );
  const majorTicks = useMemo(
    () => generateMajorTicks(projectStart, projectEnd),
    [projectStart, projectEnd],
  );

  const todayLeft = useMemo(() => {
    const now = Date.now();
    if (now < projectStart || now > projectEnd) return null;
    return ((now - projectStart) / totalMs) * totalChartWidth;
  }, [projectStart, projectEnd, totalMs, totalChartWidth]);

  const weekendShades = useMemo(() => {
    const shades = [];
    let cur = new Date(projectStart);
    cur.setHours(0, 0, 0, 0);
    while (cur.getTime() <= projectEnd) {
      if (cur.getDay() === 0 || cur.getDay() === 6) {
        const left =
          ((cur.getTime() - projectStart) / totalMs) * totalChartWidth;
        const width = (DAY_MS / totalMs) * totalChartWidth;
        shades.push({ left, width });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return shades;
  }, [projectStart, projectEnd, totalMs, totalChartWidth]);

  const getBarPosition = useCallback(
    (startVal, stopVal) => {
      const start = parseDt(startVal);
      const end = parseDt(stopVal);
      if (!start || !end) return null;
      const left =
        ((start.getTime() - projectStart) / totalMs) * totalChartWidth;
      const width =
        ((end.getTime() - start.getTime()) / totalMs) * totalChartWidth;
      return { left: Math.max(0, left), width: Math.max(width, 4) };
    },
    [projectStart, totalMs, totalChartWidth],
  );

  const projectColorMap = useMemo(() => {
    const map = {};
    filteredProjects.forEach((p, i) => {
      map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length];
    });
    return map;
  }, [filteredProjects]);

  const filterOptions = useMemo(() => {
    const projectOpts = projects.map((p) => ({
      value: p.id,
      label: p.project || "Untitled",
      color: projectColorMap[p.id],
    }));
    const projectsForOpts =
      projectFilter.length > 0
        ? projects.filter((p) => projectFilter.includes(p.id))
        : projects;
    let scopedRows = projectsForOpts.flatMap((p) => p.rows || []);
    const modules = [
      ...new Set(scopedRows.filter((r) => r.module).map((r) => r.module)),
    ].sort();
    const moduleOpts = modules.map((m) => ({ value: m, label: m }));
    if (moduleFilter.length > 0) {
      scopedRows = scopedRows.filter((r) =>
        moduleFilter.includes(r.module || ""),
      );
    }
    const resourcesMap = new Map();
    scopedRows
      .filter((r) => r.resource)
      .forEach((r) => {
        if (!resourcesMap.has(r.resource)) {
          resourcesMap.set(r.resource, {
            value: r.resource,
            label: r.resourceName || r.resource,
          });
        }
      });
    const resourceOpts = Array.from(resourcesMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    if (resourceFilter.length > 0) {
      scopedRows = scopedRows.filter((r) =>
        resourceFilter.includes(r.resource || ""),
      );
    }
    const statuses = [
      ...new Set(scopedRows.map((r) => r.status || "Pending")),
    ].sort();
    const statusOpts = statuses.map((s) => ({ value: s, label: s }));
    return { projectOpts, moduleOpts, resourceOpts, statusOpts };
  }, [projects, projectColorMap, projectFilter, moduleFilter, resourceFilter]);

  useEffect(() => {
    setColWidthPx(ZOOM_CONFIGS[zoom].defaultColWidth);
  }, [zoom]);

  useEffect(() => {
    setProjectFilters((prevFilters) => {
      let hasChanges = false;
      const newFilters = { ...prevFilters };
      filteredProjects.forEach((project) => {
        const currentFilter = prevFilters[project.id];
        if (!currentFilter) return;
        const isEmpty =
          currentFilter.module.length === 0 &&
          currentFilter.resource.length === 0 &&
          currentFilter.status.length === 0;
        if (isEmpty) return;
        const opts = getProjectFilterOptions(project, currentFilter);
        const validModules = new Set(opts.moduleOpts.map((o) => o.value));
        const validResources = new Set(opts.resourceOpts.map((o) => o.value));
        const validStatuses = new Set(opts.statusOpts.map((o) => o.value));
        const cleanedModule = currentFilter.module.filter((m) =>
          validModules.has(m),
        );
        const cleanedResource = currentFilter.resource.filter((r) =>
          validResources.has(r),
        );
        const cleanedStatus = currentFilter.status.filter((s) =>
          validStatuses.has(s),
        );
        const changed =
          cleanedModule.length !== currentFilter.module.length ||
          cleanedResource.length !== currentFilter.resource.length ||
          cleanedStatus.length !== currentFilter.status.length;
        if (changed) {
          hasChanges = true;
          newFilters[project.id] = {
            module: cleanedModule,
            resource: cleanedResource,
            status: cleanedStatus,
          };
        }
      });
      return hasChanges ? newFilters : prevFilters;
    });
    // eslint-disable-next-line
  }, [filteredProjects]);

  useEffect(() => {
    const validModuleValues = filterOptions.moduleOpts.map((o) => o.value);
    const validResourceValues = filterOptions.resourceOpts.map((o) => o.value);
    const validStatusValues = filterOptions.statusOpts.map((o) => o.value);
    setModuleFilter((prev) => {
      const filtered = prev.filter((m) => validModuleValues.includes(m));
      return filtered.length === prev.length ? prev : filtered;
    });
    setResourceFilter((prev) => {
      const filtered = prev.filter((r) => validResourceValues.includes(r));
      return filtered.length === prev.length ? prev : filtered;
    });
    setStatusFilter((prev) => {
      const filtered = prev.filter((s) => validStatusValues.includes(s));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [
    filterOptions.moduleOpts,
    filterOptions.resourceOpts,
    filterOptions.statusOpts,
  ]);

  const hasChildren = useCallback(
    (rowId) =>
      filteredProjects.some((p) =>
        (p.rows || []).some((r) => r.parentId === rowId),
      ),
    [filteredProjects],
  );

  const handleBarClick = (e, row) => {
    e.stopPropagation();
    setTooltip({ row, x: e.clientX, y: e.clientY });
  };

  // Themed button style
  const btnStyle = {
    height: 30,
    padding: "0 12px",
    borderRadius: 6,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  const getProjectFilter = (projectId) => {
    return (
      projectFilters[projectId] || { module: [], resource: [], status: [] }
    );
  };

  const updateProjectFilter = (projectId, filterKey, values) => {
    setProjectFilters((prev) => ({
      ...prev,
      [projectId]: { ...getProjectFilter(projectId), [filterKey]: values },
    }));
  };

  const clearProjectFilters = (projectId) => {
    setProjectFilters((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const getProjectFilterOptions = useCallback((project, currentFilter) => {
    const allRows = project.rows || [];
    const matchesFilters = (row, excludeKey) => {
      if (
        excludeKey !== "module" &&
        currentFilter.module.length > 0 &&
        !currentFilter.module.includes(row.module || "")
      )
        return false;
      if (
        excludeKey !== "resource" &&
        currentFilter.resource.length > 0 &&
        !currentFilter.resource.includes(row.resource || "")
      )
        return false;
      if (
        excludeKey !== "status" &&
        currentFilter.status.length > 0 &&
        !currentFilter.status.includes(row.status || "Pending")
      )
        return false;
      return true;
    };
    const rowsForModules = allRows.filter((r) => matchesFilters(r, "module"));
    const modules = [
      ...new Set(rowsForModules.filter((r) => r.module).map((r) => r.module)),
    ].sort();
    const rowsForResources = allRows.filter((r) =>
      matchesFilters(r, "resource"),
    );
    const resourcesMap = new Map();
    rowsForResources
      .filter((r) => r.resource)
      .forEach((r) => {
        if (!resourcesMap.has(r.resource)) {
          resourcesMap.set(r.resource, {
            value: r.resource,
            label: r.resourceName || r.resource,
          });
        }
      });
    const resources = Array.from(resourcesMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const rowsForStatuses = allRows.filter((r) => matchesFilters(r, "status"));
    const statuses = [
      ...new Set(rowsForStatuses.map((r) => r.status || "Pending")),
    ].sort();
    return {
      moduleOpts: modules.map((m) => ({ value: m, label: m })),
      resourceOpts: resources,
      statusOpts: statuses.map((s) => ({ value: s, label: s })),
    };
  }, []);

  const hasProjectFilters = (projectId) => {
    const f = getProjectFilter(projectId);
    return f.module.length > 0 || f.resource.length > 0 || f.status.length > 0;
  };

  const allRows = useMemo(() => {
    const result = [];
    filteredProjects.forEach((project, pIdx) => {
      let rows = project.rows || [];
      const pFilter = getProjectFilter(project.id);
      const hasAnyFilter =
        pFilter.module.length > 0 ||
        pFilter.resource.length > 0 ||
        pFilter.status.length > 0;
      if (hasAnyFilter) {
        const filteredRows = rows.filter((r) => {
          if (
            pFilter.module.length > 0 &&
            !pFilter.module.includes(r.module || "")
          )
            return false;
          if (
            pFilter.resource.length > 0 &&
            !pFilter.resource.includes(r.resource || "")
          )
            return false;
          if (
            pFilter.status.length > 0 &&
            !pFilter.status.includes(r.status || "Pending")
          )
            return false;
          return true;
        });
        const finalIds = new Set(filteredRows.map((r) => r.id));
        filteredRows.forEach((r) => {
          let cur = rows.find((x) => x.id === r.parentId);
          while (cur) {
            finalIds.add(cur.id);
            cur = rows.find((x) => x.id === cur.parentId);
          }
        });
        rows = rows.filter((r) => finalIds.has(r.id));
      }
      const childrenMap = new Map();
      rows.forEach((r) => {
        const key = r.parentId || "__ROOT__";
        if (!childrenMap.has(key)) childrenMap.set(key, []);
        childrenMap.get(key).push(r);
      });
      const walk = (parentKey, depth) => {
        const children = childrenMap.get(parentKey) || [];
        children.forEach((node) => {
          result.push({
            ...node,
            depth,
            _projectId: project.id,
            _projectName: project.project || "Untitled",
            _projectIdx: pIdx,
            _isProjectRow: false,
          });
          if (childrenMap.has(node.id) && expandedRows.has(node.id)) {
            walk(node.id, depth + 1);
          }
        });
      };
      if (expandedProjects.has(project.id)) {
        walk("__ROOT__", 0);
      }
    });

    return result;
  }, [filteredProjects, expandedProjects, expandedRows, projectFilters]);
  // ── Compute position map for all rows (needed for arrows) ──
  // ── Compute row positions from actual DOM (reliable) ──
  const rowPositions = useMemo(() => {
    const positions = new Map();

    if (!showDependencies) return positions;

    // Get the timeline container as reference point
    const container = timelineRef.current;
    if (!container) return positions;

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    barsRef.current.forEach((el, rowId) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();

      // Convert to coordinates relative to the scrollable content
      const left = rect.left - containerRect.left + scrollLeft;
      const top = rect.top - containerRect.top + scrollTop;

      positions.set(rowId, {
        left,
        right: left + rect.width,
        width: rect.width,
        top,
        bottom: top + rect.height,
        midY: top + rect.height / 2,
      });
    });

    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDependencies, measureVersion, allRows, resourceViewData]);
  // ── Compute dependency arrows ──
  const dependencyArrows = useMemo(() => {
    if (!showDependencies) return [];

    // Collect all rows currently rendered
    const allRenderedRows =
      viewMode === "task"
        ? allRows
        : resourceViewData.flatMap((res) => res.tasks);

    return computeArrows(allRenderedRows, rowPositions, t);
  }, [showDependencies, viewMode, allRows, resourceViewData, rowPositions, t]);

  // ── Compute total chart height ──
  const totalChartHeight = useMemo(() => {
    if (!timelineRef.current) return 1000;
    const contentDiv = timelineRef.current.querySelector("div");
    return contentDiv ? contentDiv.offsetHeight : 1000;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDependencies, measureVersion, allRows]);
  useEffect(() => {
    if (showDependencies) {
      // Trigger re-measure after render
      const timer = setTimeout(() => setMeasureVersion((v) => v + 1), 50);
      return () => clearTimeout(timer);
    }
  }, [
    showDependencies,
    viewMode,
    expandedProjects,
    expandedRows,
    filteredProjects,
    colWidthPx,
    zoom,
  ]);
  useEffect(() => {
    if (!showDependencies) return;
    const el = timelineRef.current;
    if (!el) return;

    const handler = () => setMeasureVersion((v) => v + 1);
    el.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);
    return () => {
      el.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [showDependencies]);
  useEffect(() => {
    if (showDependencies) {
      console.log("📍 Bars captured:", barsRef.current.size);
      console.log("📍 Positions computed:", rowPositions.size);
      console.log("📍 Arrows built:", dependencyArrows.length);
      console.log("📍 Sample position:", Array.from(rowPositions.entries())[0]);
      console.log("📍 Sample arrow:", dependencyArrows[0]);
    }
  }, [showDependencies, rowPositions, dependencyArrows]);
  useEffect(() => {
    if (showDependencies && dependencyArrows.length > 0) {
      console.log(`📍 ${dependencyArrows.length} arrows built:`);
      dependencyArrows.forEach((a, i) => {
        console.log(
          `  ${i + 1}. "${a.sourceRow.task}" → "${a.targetRow.task}"`,
        );
        console.log(
          `     source: right=${a.sourcePos.right}, midY=${a.sourcePos.midY}`,
        );
        console.log(
          `     target: left=${a.targetPos.left}, midY=${a.targetPos.midY}`,
        );
      });
    }
  }, [dependencyArrows]);
  // ── Auto-zoom to "Today + 7 days" on mobile mount ──
  useEffect(() => {
    if (!isMobile) return;

    // Set day zoom mode with tighter column width for phones
    setZoom("day");

    // Calculate col width so 8 days (today + 7) fit the viewport
    // Assume left panel is hidden on mobile; timeline takes ~90% of width
    const availableWidth = window.innerWidth - 32; // account for padding
    const idealColWidth = Math.floor(availableWidth / 8);
    setColWidthPx(Math.max(idealColWidth, 50)); // minimum 50px per day
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps
  // ── Scroll to "today" on mobile ──
  useEffect(() => {
    if (!isMobile || !timelineRef.current || todayLeft === null) return;

    // Scroll so today is near the left edge (with small padding)
    const scrollTarget = Math.max(0, todayLeft - 20);
    requestAnimationFrame(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollLeft = scrollTarget;
      }
    });
  }, [isMobile, todayLeft]);
  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: isMobile
          ? "calc(100vh - 48px - 60px - 24px)" // top bar + bottom tab + padding
          : "calc(100vh - 140px)",
        minHeight: 400,
        color: t.textPrimary,
      }}
    >
      {/* ══ TOOLBAR ══ */}
      {!isMobile ? (
        /* ═══ DESKTOP TOOLBAR (existing) ═══ */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              background: t.bgMuted,
              borderRadius: 7,
              padding: 2,
              gap: 2,
            }}
          >
            {[
              {
                key: "task",
                label: "Project View",
                icon: <Calendar size={13} />,
              },
              {
                key: "resource",
                label: "Resource View",
                icon: <Users size={13} />,
              },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                style={{
                  ...btnStyle,
                  background: viewMode === v.key ? t.bgCard : "transparent",
                  border: "none",
                  color: viewMode === v.key ? t.textPrimary : t.textMuted,
                  fontWeight: viewMode === v.key ? 700 : 500,
                  boxShadow: viewMode === v.key ? t.shadowSm : "none",
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: t.border }} />

          {/* Zoom Level */}
          <div
            style={{
              display: "flex",
              background: t.bgMuted,
              borderRadius: 7,
              padding: 2,
              gap: 2,
            }}
          >
            {Object.entries(ZOOM_CONFIGS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setZoom(key)}
                style={{
                  ...btnStyle,
                  background: zoom === key ? t.bgCard : "transparent",
                  border: "none",
                  color: zoom === key ? t.textPrimary : t.textMuted,
                  fontWeight: zoom === key ? 700 : 500,
                  boxShadow: zoom === key ? t.shadowSm : "none",
                  padding: "0 10px",
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setColWidthPx((p) => Math.max(p - 20, MIN_COL_WIDTH))
            }
            style={btnStyle}
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() =>
              setColWidthPx((p) => Math.min(p + 20, MAX_COL_WIDTH))
            }
            style={btnStyle}
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>

          <div style={{ width: 1, height: 20, background: t.border }} />

          {/* Dependencies toggle */}
          <button
            onClick={() => setShowDependencies((p) => !p)}
            title={
              showDependencies
                ? "Hide dependency arrows"
                : "Show dependency arrows"
            }
            style={{
              ...btnStyle,
              background: showDependencies ? t.primary : t.bgCard,
              color: showDependencies ? t.textInverse : t.textSecondary,
              borderColor: showDependencies ? t.primary : t.borderStrong,
              fontWeight: showDependencies ? 700 : 500,
            }}
          >
            <Link2 size={13} />
            Dependencies {showDependencies ? "ON" : "OFF"}
          </button>

          {/* Global filters section — unchanged */}
          {showGlobalFilters && (
            <>
              <div style={{ width: 1, height: 20, background: t.border }} />
              {/* Your existing filter dropdowns */}
              {/* ... */}
            </>
          )}

          {/* Legend */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 10,
              color: t.textMuted,
              flexWrap: "wrap",
            }}
          >
            {/* Your existing legend items */}
          </div>
        </div>
      ) : (
        /* ═══ MOBILE TOOLBAR (compact) ═══ */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 10px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          {/* Left panel toggle */}
          <button
            onClick={() => setMobileLeftPanelOpen(true)}
            title="Show task list"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1px solid ${t.borderStrong}`,
              background: t.bgCard,
              color: t.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Menu size={16} />
          </button>

          {/* View mode toggle (compact) */}
          <div
            style={{
              display: "flex",
              background: t.bgMuted,
              borderRadius: 8,
              padding: 3,
            }}
          >
            {[
              { key: "task", icon: <Calendar size={14} />, label: "Project" },
              { key: "resource", icon: <Users size={14} />, label: "Resource" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                title={v.label}
                style={{
                  width: 34,
                  height: 32,
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === v.key ? t.bgCard : "transparent",
                  color: viewMode === v.key ? t.primary : t.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: viewMode === v.key ? t.shadowSm : "none",
                }}
              >
                {v.icon}
              </button>
            ))}
          </div>

          {/* Jump to today */}
          <button
            onClick={() => {
              if (timelineRef.current && todayLeft !== null) {
                timelineRef.current.scrollTo({
                  left: Math.max(0, todayLeft - 20),
                  behavior: "smooth",
                });
              }
            }}
            title="Jump to today"
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 8,
              border: `1px solid ${t.dangerBorder}`,
              background: t.dangerBgSubtle,
              color: t.danger,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "Sora,sans-serif",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: t.danger,
              }}
            />
            Today
          </button>

          {/* Dependencies quick toggle */}
          <button
            onClick={() => setShowDependencies((p) => !p)}
            title={showDependencies ? "Hide dependencies" : "Show dependencies"}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1px solid ${showDependencies ? t.primary : t.borderStrong}`,
              background: showDependencies ? t.primary : t.bgCard,
              color: showDependencies ? t.textInverse : t.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Link2 size={16} />
          </button>

          {/* Tools/Settings button */}
          <button
            onClick={() => setMobileToolsOpen(true)}
            title="More options"
            style={{
              marginLeft: "auto",
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1px solid ${t.borderStrong}`,
              background: t.bgCard,
              color: t.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sliders size={16} />
          </button>
        </div>
      )}

      {/* ══ GANTT BODY ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── LEFT PANEL (hidden on mobile) ── */}
        {!isMobile && (
          <div
            style={{
              width: LEFT_PANEL_WIDTH,
              flexShrink: 0,
              borderRight: `1px solid ${t.border}`,
              display: "flex",
              flexDirection: "column",
              background: t.bgCard,
              zIndex: 20,
            }}
          >
            <div
              style={{
                height: HEADER_HEIGHT,
                borderBottom: `1px solid ${t.border}`,
                background: t.bgSubtle,
                display: "flex",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  height: HEADER_HEIGHT,
                  borderBottom: `1px solid ${t.border}`,
                  background: t.bgSubtle,
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "0 12px 8px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {viewMode === "task" ? "Project / Task" : "Resource"}
                </span>
              </div>
            </div>

            <div ref={leftPanelRef} style={{ flex: 1, overflowY: "hidden" }}>
              {viewMode === "task" ? (
                <>
                  {filteredProjects.map((project, pIdx) => {
                    const isExpanded = expandedProjects.has(project.id);
                    const pc = projectColorMap[project.id] || t.textMuted;
                    const projectRows = allRows.filter(
                      (r) => r._projectId === project.id,
                    );
                    const projectFilter = getProjectFilter(project.id);
                    const projectFilterOpts = getProjectFilterOptions(
                      project,
                      projectFilter,
                    );
                    const hasFilters = hasProjectFilters(project.id);

                    return (
                      <React.Fragment key={project.id}>
                        {/* Project header */}
                        <div
                          onClick={() => {
                            setExpandedProjects((prev) => {
                              const next = new Set(prev);
                              if (next.has(project.id)) next.delete(project.id);
                              else next.add(project.id);
                              return next;
                            });
                          }}
                          style={{
                            height: ROW_HEIGHT,
                            display: "flex",
                            alignItems: "center",
                            padding: "0 8px",
                            borderBottom: `1px solid ${t.border}`,
                            background: hasFilters
                              ? t.primaryBgSubtle
                              : t.bgSubtle,
                            cursor: "pointer",
                            gap: 6,
                            borderLeft: `4px solid ${pc}`,
                            transition: "background 0.15s",
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown
                              size={13}
                              color={t.textMuted}
                              style={{ flexShrink: 0 }}
                            />
                          ) : (
                            <ChevronRight
                              size={13}
                              color={t.textMuted}
                              style={{ flexShrink: 0 }}
                            />
                          )}
                          <Briefcase
                            size={12}
                            color={pc}
                            style={{ flexShrink: 0 }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: t.textPrimary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={project.project || "Untitled"}
                            >
                              {project.project || "Untitled"}
                            </div>
                            <div
                              style={{
                                fontSize: 9.5,
                                color: t.textFaint,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>{(project.rows || []).length} tasks</span>
                              <span>•</span>
                              <span
                                style={{
                                  textTransform: "capitalize",
                                  fontWeight: 500,
                                }}
                              >
                                {project.status || "draft"}
                              </span>
                              {hasFilters && (
                                <>
                                  <span>•</span>
                                  <span
                                    style={{
                                      color: t.primary,
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                    }}
                                  >
                                    <Filter size={9} />
                                    Filtered
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {isExpanded && hasFilters && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearProjectFilters(project.id);
                              }}
                              title="Clear all filters"
                              style={{
                                height: 22,
                                padding: "0 8px",
                                borderRadius: 4,
                                border: `1px solid ${t.dangerBorder}`,
                                background: t.dangerBgSubtle,
                                color: t.danger,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              <X size={10} /> Clear
                            </button>
                          )}
                        </div>

                        {/* Sub-header with column filters */}
                        {isExpanded && (
                          <div
                            style={{
                              height: SUB_HEADER_HEIGHT,
                              display: "flex",
                              borderBottom: `1px solid ${t.border}`,
                              background: t.bgSubtle,
                              borderLeft: `4px solid ${pc}80`,
                            }}
                          >
                            {/* Task */}
                            <div
                              style={{
                                width: COL_TASK_WIDTH - 4,
                                padding: "0 12px",
                                display: "flex",
                                alignItems: "center",
                                borderRight: `1px solid ${t.border}`,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  color: t.textFaint,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.4px",
                                }}
                              >
                                Task
                              </span>
                            </div>

                            {/* Module */}
                            <div
                              style={{
                                width: COL_MODULE_WIDTH,
                                padding: "0 10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderRight: `1px solid ${t.border}`,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  color: t.textFaint,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.4px",
                                }}
                              >
                                Module
                              </span>
                              <ProjectColumnFilterButton
                                color={t.violet}
                                columnKey="module"
                                options={projectFilterOpts.moduleOpts}
                                selected={projectFilter.module}
                                onChange={(vals) =>
                                  updateProjectFilter(
                                    project.id,
                                    "module",
                                    vals,
                                  )
                                }
                              />
                            </div>

                            {/* Resource */}
                            <div
                              style={{
                                width: COL_RESOURCE_WIDTH,
                                padding: "0 10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderRight: `1px solid ${t.border}`,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  color: t.textFaint,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.4px",
                                }}
                              >
                                Resource
                              </span>
                              <ProjectColumnFilterButton
                                color={t.success}
                                columnKey="resource"
                                options={projectFilterOpts.resourceOpts}
                                selected={projectFilter.resource}
                                onChange={(vals) =>
                                  updateProjectFilter(
                                    project.id,
                                    "resource",
                                    vals,
                                  )
                                }
                              />
                            </div>

                            {/* Status */}
                            <div
                              style={{
                                width: COL_STATUS_WIDTH,
                                padding: "0 10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  color: t.textFaint,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.4px",
                                }}
                              >
                                Status
                              </span>
                              <ProjectColumnFilterButton
                                color={t.warning}
                                columnKey="status"
                                options={projectFilterOpts.statusOpts}
                                selected={projectFilter.status}
                                onChange={(vals) =>
                                  updateProjectFilter(
                                    project.id,
                                    "status",
                                    vals,
                                  )
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* Task rows */}
                        {isExpanded &&
                          projectRows.map((row) => {
                            const isParent = hasChildren(row.id);
                            const isRowExpanded = expandedRows.has(row.id);
                            const sc = getStatusColor(row.status, t);

                            return (
                              <div
                                key={row.id}
                                style={{
                                  height: ROW_HEIGHT,
                                  display: "flex",
                                  borderBottom: `1px solid ${t.borderSubtle}`,
                                }}
                              >
                                {/* Task cell */}
                                <div
                                  style={{
                                    width: COL_TASK_WIDTH,
                                    padding: "0 8px",
                                    paddingLeft: 12 + row.depth * 16,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    borderRight: `1px solid ${t.borderSubtle}`,
                                  }}
                                >
                                  {isParent ? (
                                    <button
                                      onClick={() => {
                                        setExpandedRows((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(row.id))
                                            next.delete(row.id);
                                          else next.add(row.id);
                                          return next;
                                        });
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        color: t.textFaint,
                                        display: "flex",
                                        alignItems: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {isRowExpanded ? (
                                        <ChevronDown size={12} />
                                      ) : (
                                        <ChevronRight size={12} />
                                      )}
                                    </button>
                                  ) : (
                                    <span
                                      style={{ width: 12, flexShrink: 0 }}
                                    />
                                  )}

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: row.depth === 0 ? 600 : 400,
                                        color: t.textPrimary,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                      title={row.task}
                                    >
                                      {row.task || "—"}
                                    </div>
                                  </div>
                                </div>

                                {/* Module cell */}
                                <div
                                  style={{
                                    width: COL_MODULE_WIDTH,
                                    padding: "0 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    borderRight: `1px solid ${t.borderSubtle}`,
                                    overflow: "hidden",
                                  }}
                                >
                                  {row.module ? (
                                    <span
                                      style={{
                                        padding: "2px 7px",
                                        borderRadius: 4,
                                        background: t.violetBg,
                                        color: t.violet,
                                        border: `1px solid ${t.violetBorder}`,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "100%",
                                      }}
                                      title={row.module}
                                    >
                                      {row.module}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color: t.textDisabled,
                                        fontStyle: "italic",
                                        fontSize: 10,
                                      }}
                                    >
                                      —
                                    </span>
                                  )}
                                </div>

                                {/* Resource cell */}
                                <div
                                  style={{
                                    width: COL_RESOURCE_WIDTH,
                                    padding: "0 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    borderRight: `1px solid ${t.borderSubtle}`,
                                    overflow: "hidden",
                                  }}
                                >
                                  {row.resource ? (
                                    <>
                                      <div
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: "50%",
                                          background: t.primaryBg,
                                          color: t.primary,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 9,
                                          fontWeight: 700,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {(
                                          row.resourceName ||
                                          row.resource ||
                                          "?"
                                        )
                                          .charAt(0)
                                          .toUpperCase()}
                                      </div>
                                      <span
                                        style={{
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          fontSize: 10.5,
                                          color: t.textSecondary,
                                          fontWeight: 500,
                                        }}
                                        title={row.resourceName || row.resource}
                                      >
                                        {row.resourceName || row.resource}
                                      </span>
                                    </>
                                  ) : (
                                    <span
                                      style={{
                                        color: t.textDisabled,
                                        fontStyle: "italic",
                                        fontSize: 10,
                                      }}
                                    >
                                      —
                                    </span>
                                  )}
                                </div>

                                {/* Status cell */}
                                <div
                                  style={{
                                    width: COL_STATUS_WIDTH,
                                    padding: "0 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    overflow: "hidden",
                                  }}
                                >
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      fontSize: 9.5,
                                      fontWeight: 700,
                                      background: sc.bg,
                                      color: sc.color,
                                      border: `1px solid ${sc.border}`,
                                      textTransform: "capitalize",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                    title={row.status || "Pending"}
                                  >
                                    {row.status || "Pending"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                        {/* Empty state */}
                        {isExpanded &&
                          hasFilters &&
                          projectRows.length === 0 && (
                            <div
                              style={{
                                padding: "16px 12px",
                                textAlign: "center",
                                borderBottom: `1px solid ${t.borderSubtle}`,
                                background: t.bgSubtle,
                              }}
                            >
                              <Filter
                                size={18}
                                color={t.textDisabled}
                                style={{ marginBottom: 6 }}
                              />
                              <div
                                style={{
                                  fontSize: 11,
                                  color: t.textMuted,
                                  fontWeight: 600,
                                  marginBottom: 3,
                                }}
                              >
                                No matching tasks
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearProjectFilters(project.id);
                                }}
                                style={{
                                  height: 22,
                                  padding: "0 8px",
                                  borderRadius: 4,
                                  border: `1px solid ${t.borderStrong}`,
                                  background: t.bgCard,
                                  color: t.textMuted,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  fontFamily: "Sora,sans-serif",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  marginTop: 4,
                                }}
                              >
                                <X size={10} /> Clear Filters
                              </button>
                            </div>
                          )}
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                /* Resource view */
                resourceViewData.map((res) => {
                  const rowHeight = ROW_HEIGHT * res.laneCount;
                  return (
                    <div
                      key={res.userId}
                      style={{
                        height: rowHeight,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        borderBottom: `1px solid ${t.borderSubtle}`,
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: t.primaryBg,
                          color: t.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(res.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: t.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {res.name}
                        </div>
                        <div style={{ fontSize: 9.5, color: t.textFaint }}>
                          {res.tasks.length} task
                          {res.tasks.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        {/* ── Mobile: Tools & filters bottom sheet ── */}
        {isMobile && (
          <BottomSheet
            open={mobileToolsOpen}
            onClose={() => setMobileToolsOpen(false)}
            title="Gantt Options"
            height="auto"
          >
            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Zoom Level */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  Zoom Level
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(ZOOM_CONFIGS).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setZoom(key)}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 10,
                        border: `1.5px solid ${zoom === key ? t.primary : t.border}`,
                        background: zoom === key ? t.primaryBgSubtle : t.bgCard,
                        color: zoom === key ? t.primary : t.textSecondary,
                        fontFamily: "Sora,sans-serif",
                        fontSize: 13,
                        fontWeight: zoom === key ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Width */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Column Width</span>
                  <span
                    style={{
                      color: t.textSecondary,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {colWidthPx}px
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() =>
                      setColWidthPx((p) => Math.max(p - 20, MIN_COL_WIDTH))
                    }
                    disabled={colWidthPx <= MIN_COL_WIDTH}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      border: `1px solid ${t.borderStrong}`,
                      background: t.bgCard,
                      color: t.textSecondary,
                      fontFamily: "Sora,sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      opacity: colWidthPx <= MIN_COL_WIDTH ? 0.4 : 1,
                    }}
                  >
                    <ZoomOut size={16} /> Narrower
                  </button>
                  <button
                    onClick={() =>
                      setColWidthPx((p) => Math.min(p + 20, MAX_COL_WIDTH))
                    }
                    disabled={colWidthPx >= MAX_COL_WIDTH}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      border: `1px solid ${t.borderStrong}`,
                      background: t.bgCard,
                      color: t.textSecondary,
                      fontFamily: "Sora,sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      opacity: colWidthPx >= MAX_COL_WIDTH ? 0.4 : 1,
                    }}
                  >
                    <ZoomIn size={16} /> Wider
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  Legend
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    padding: 12,
                    background: t.bgSubtle,
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    fontSize: 12,
                    color: t.textSecondary,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 7,
                        borderRadius: 2,
                        background: "#3B82F6",
                      }}
                    />
                    Planned
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 7,
                        borderRadius: 2,
                        background: "#22C55E",
                        border: "1px dashed #15803D",
                      }}
                    />
                    Actual
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 7,
                        borderRadius: 2,
                        background: "#EF4444",
                      }}
                    />
                    Delayed
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: t.bgMuted,
                        border: `1px solid ${t.border}`,
                      }}
                    />
                    Weekend
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{ width: 2, height: 14, background: t.danger }}
                    />
                    Today
                  </span>
                </div>
              </div>

              {/* Done button */}
              <button
                onClick={() => setMobileToolsOpen(false)}
                style={{
                  height: 46,
                  border: "none",
                  background: t.primary,
                  color: t.textInverse,
                  borderRadius: 10,
                  fontFamily: "Sora,sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Done
              </button>
            </div>
          </BottomSheet>
        )}
        {/* ── RIGHT TIMELINE ── */}
        <div
          ref={timelineRef}
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "auto",
            position: "relative",
            WebkitOverflowScrolling: "touch",
          }}
          onScroll={syncScroll}
        >
          <div style={{ width: totalChartWidth, position: "relative" }}>
            {/* Timeline header */}
            <div
              style={{
                height: HEADER_HEIGHT,
                position: "sticky",
                top: 0,
                zIndex: 15,
                background: t.bgSubtle,
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <div
                style={{
                  height: 24,
                  position: "relative",
                  borderBottom: `1px solid ${t.border}`,
                }}
              >
                {majorTicks.map((tick, i) => {
                  const left =
                    ((tick.getTime() - projectStart) / totalMs) *
                    totalChartWidth;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left,
                        top: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        color: t.textSecondary,
                        whiteSpace: "nowrap",
                        borderLeft: `1px solid ${t.border}`,
                      }}
                    >
                      {ZOOM_CONFIGS[zoom].majorFormat(tick)}
                    </div>
                  );
                })}
              </div>
              <div style={{ height: 32, position: "relative" }}>
                {ticks.map((tick, i) => {
                  const left =
                    ((tick.getTime() - projectStart) / totalMs) *
                    totalChartWidth;
                  const isWeekend = tick.getDay() === 0 || tick.getDay() === 6;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left,
                        top: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 4,
                        fontSize: 9.5,
                        fontWeight: isWeekend ? 700 : 400,
                        color: isWeekend ? t.danger : t.textMuted,
                        whiteSpace: "nowrap",
                        borderLeft: `1px solid ${t.border}`,
                        minWidth: colWidthPx,
                      }}
                    >
                      {ZOOM_CONFIGS[zoom].tickFormat(tick)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart area */}
            <div style={{ position: "relative" }}>
              {/* Weekend shading */}
              {weekendShades.map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: s.left,
                    top: 0,
                    bottom: 0,
                    width: s.width,
                    background: `${t.bgMuted}CC`,
                    borderLeft: `1px solid ${t.border}`,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              ))}

              {/* Today line */}
              {todayLeft !== null && (
                <div
                  style={{
                    position: "absolute",
                    left: todayLeft,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: t.danger,
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: -16,
                      background: t.danger,
                      color: t.textInverse,
                      fontSize: 8,
                      fontWeight: 700,
                      padding: "1px 4px",
                      borderRadius: 3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    TODAY
                  </div>
                </div>
              )}

              {/* Grid lines */}
              {ticks.map((tick, i) => {
                const left =
                  ((tick.getTime() - projectStart) / totalMs) * totalChartWidth;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: t.borderSubtle,
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                );
              })}

              {/* Task view bars */}
              {viewMode === "task" &&
                filteredProjects.map((project) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const pc = projectColorMap[project.id] || t.textMuted;
                  const projectRows = allRows.filter(
                    (r) => r._projectId === project.id,
                  );
                  const hasFilters = hasProjectFilters(project.id);

                  return (
                    <React.Fragment key={project.id}>
                      <div
                        style={{
                          height: ROW_HEIGHT,
                          position: "relative",
                          borderBottom: `1px solid ${t.border}`,
                          background: hasFilters
                            ? t.primaryBgSubtle
                            : t.bgSubtle,
                        }}
                      />

                      {isExpanded && (
                        <div
                          style={{
                            height: SUB_HEADER_HEIGHT,
                            position: "relative",
                            borderBottom: `1px solid ${t.border}`,
                            background: t.bgSubtle,
                          }}
                        />
                      )}

                      {isExpanded &&
                        projectRows.map((row) => {
                          const plannedBar = getBarPosition(
                            row.plannedStart,
                            row.plannedStop,
                          );
                          const actualBar = getBarPosition(
                            row.actualStart,
                            row.actualStop,
                          );
                          const sc = getStatusColor(row.status, t);
                          const isRunning =
                            String(row.status || "")
                              .toLowerCase()
                              .trim() === "running";

                          return (
                            <div
                              key={row.id}
                              style={{
                                height: ROW_HEIGHT,
                                position: "relative",
                                borderBottom: `1px solid ${t.borderSubtle}`,
                                minHeight: 24,
                                paddingBottom: 4,
                              }}
                            >
                              {/* Planned bar */}
                              {plannedBar && (
                                <div
                                  ref={(el) => {
                                    if (el) barsRef.current.set(row.id, el);
                                    else barsRef.current.delete(row.id);
                                  }}
                                  onClick={(e) => handleBarClick(e, row)}
                                  title={`${row.task} — ${row.status || "Pending"} (Planned)`}
                                  style={{
                                    position: "absolute",
                                    left: plannedBar.left,
                                    width: plannedBar.width,
                                    top: row.depth === 0 ? 6 : 8,
                                    height: row.depth === 0 ? 18 : 14,
                                    background: sc.bar,
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    zIndex: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    paddingLeft: 6,
                                    overflow: "hidden",
                                    boxShadow: t.shadowSm,
                                    transition: "opacity 0.12s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.85";
                                    setHoveredRowId(row.id); // ← NEW
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                    setHoveredRowId(null); // ← NEW
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: 3,
                                      background: pc,
                                      borderRadius: "3px 0 0 3px",
                                    }}
                                  />
                                  {isRunning && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                                        animation: "ganttPulse 2s infinite",
                                        borderRadius: 3,
                                      }}
                                    />
                                  )}
                                  {plannedBar.width > 50 && (
                                    <span
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 600,
                                        color: "#fff",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        paddingLeft: 4,
                                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                        zIndex: 1,
                                        position: "relative",
                                      }}
                                    >
                                      {row.task || row.module}{" "}
                                      <span
                                        style={{
                                          fontWeight: 400,
                                          opacity: 0.8,
                                        }}
                                      >
                                        (Planned)
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Actual bar */}
                              {actualBar &&
                                (() => {
                                  const delayed = isDelayed(row);
                                  return (
                                    <div
                                      onClick={(e) => handleBarClick(e, row)}
                                      title={`${row.task} — Actual${delayed ? " ⚠ DELAYED" : ""}`}
                                      style={{
                                        position: "absolute",
                                        left: actualBar.left,
                                        width: actualBar.width,
                                        bottom: row.depth === 0 ? 2 : 4,
                                        height: row.depth === 0 ? 14 : 10,
                                        background: delayed
                                          ? "rgba(239,68,68,0.2)"
                                          : "rgba(34,197,94,0.2)",
                                        border: `2px solid ${delayed ? "#EF4444" : "#22C55E"}`,
                                        borderRadius: 3,
                                        cursor: "pointer",
                                        zIndex: 6,
                                        boxShadow: t.shadowSm,
                                        display: "flex",
                                        alignItems: "center",
                                        paddingLeft: 6,
                                        overflow: "hidden",
                                      }}
                                    >
                                      {actualBar.width > 50 && (
                                        <span
                                          style={{
                                            fontSize: 8.5,
                                            fontWeight: 600,
                                            color: delayed
                                              ? "#DC2626"
                                              : "#15803D",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            zIndex: 1,
                                            position: "relative",
                                          }}
                                        >
                                          {row.task || row.module}{" "}
                                          <span
                                            style={{
                                              fontWeight: 400,
                                              opacity: 0.8,
                                            }}
                                          >
                                            (Actual){delayed && " ⚠ DELAYED"}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}

                              {/* No dates */}
                              {!plannedBar && !actualBar && (
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: 10,
                                    color: t.textDisabled,
                                    fontStyle: "italic",
                                  }}
                                >
                                  No dates
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </React.Fragment>
                  );
                })}

              {/* Resource view bars */}
              {viewMode === "resource" &&
                resourceViewData.map((res) => {
                  const rowHeight = ROW_HEIGHT * res.laneCount;
                  const LANE_HEIGHT = ROW_HEIGHT;
                  const BAR_HEIGHT_PLANNED = 16;
                  const BAR_HEIGHT_ACTUAL = 10;
                  const BAR_GAP = 2;

                  return (
                    <div
                      key={res.userId}
                      style={{
                        height: rowHeight,
                        position: "relative",
                        borderBottom: `1px solid ${t.borderSubtle}`,
                      }}
                    >
                      {res.laneCount > 1 &&
                        Array.from({ length: res.laneCount - 1 }, (_, i) => (
                          <div
                            key={`lane-${i}`}
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              top: (i + 1) * LANE_HEIGHT,
                              height: 1,
                              background: t.borderSubtle,
                              pointerEvents: "none",
                              zIndex: 2,
                            }}
                          />
                        ))}

                      {res.tasks.map((row) => {
                        const plannedBar = getBarPosition(
                          row.plannedStart,
                          row.plannedStop,
                        );
                        const actualBar = getBarPosition(
                          row.actualStart,
                          row.actualStop,
                        );
                        const delayed = isDelayed(row);
                        const sc = delayed
                          ? getDelayedColor(t)
                          : getStatusColor(row.status, t);
                        const pc =
                          projectColorMap[row._projectId] || t.textMuted;
                        const lane = row._lane || 0;
                        const laneTop = lane * LANE_HEIGHT;

                        return (
                          <React.Fragment key={row.id}>
                            {plannedBar && (
                              <div
                                ref={(el) => {
                                  // ← ADD THIS
                                  if (el) barsRef.current.set(row.id, el);
                                  else barsRef.current.delete(row.id);
                                }}
                                onClick={(e) => handleBarClick(e, row)}
                                title={`${row.task} — ${row._projectName} (Planned)`}
                                style={{
                                  position: "absolute",
                                  left: plannedBar.left,
                                  width: plannedBar.width,
                                  top: laneTop + 6,
                                  height: BAR_HEIGHT_PLANNED,
                                  background: sc.bar,
                                  borderRadius: 3,
                                  cursor: "pointer",
                                  zIndex: 5,
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 6,
                                  overflow: "hidden",
                                  boxShadow: t.shadowSm,
                                  transition: "opacity 0.12s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = "0.85";
                                  setHoveredRowId(row.id); // ← optional: for hover highlight
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = "1";
                                  setHoveredRowId(null);
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    background: pc,
                                    borderRadius: "3px 0 0 3px",
                                  }}
                                />
                                {plannedBar.width > 50 && (
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 600,
                                      color: "#fff",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      paddingLeft: 4,
                                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                      zIndex: 1,
                                      position: "relative",
                                    }}
                                  >
                                    {row.task}{" "}
                                    <span
                                      style={{ fontWeight: 400, opacity: 0.8 }}
                                    >
                                      (Planned)
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}

                            {actualBar &&
                              (() => {
                                const isTaskDelayed = isDelayed(row);
                                return (
                                  <div
                                    onClick={(e) => handleBarClick(e, row)}
                                    title={`${row.task} — ${row._projectName} (Actual)${isTaskDelayed ? " ⚠ DELAYED" : ""}`}
                                    style={{
                                      position: "absolute",
                                      left: actualBar.left,
                                      width: actualBar.width,
                                      top:
                                        laneTop +
                                        6 +
                                        BAR_HEIGHT_PLANNED +
                                        BAR_GAP,
                                      height: BAR_HEIGHT_ACTUAL,
                                      background: isTaskDelayed
                                        ? "rgba(239,68,68,0.2)"
                                        : "rgba(34,197,94,0.2)",
                                      border: `2px solid ${isTaskDelayed ? "#EF4444" : "#22C55E"}`,
                                      borderRadius: 3,
                                      cursor: "pointer",
                                      zIndex: 6,
                                      display: "flex",
                                      alignItems: "center",
                                      paddingLeft: 6,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {actualBar.width > 50 && (
                                      <span
                                        style={{
                                          fontSize: 8.5,
                                          fontWeight: 600,
                                          color: isTaskDelayed
                                            ? "#DC2626"
                                            : "#15803D",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          zIndex: 1,
                                          position: "relative",
                                        }}
                                      >
                                        {row.task}{" "}
                                        <span
                                          style={{
                                            fontWeight: 400,
                                            opacity: 0.8,
                                          }}
                                        >
                                          (Actual)
                                          {isTaskDelayed && " ⚠ DELAYED"}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              {/* Dependency arrows overlay */}
            </div>
            {showDependencies && dependencyArrows.length > 0 && (
              <DependencyArrows
                arrows={dependencyArrows}
                width={totalChartWidth}
                height={totalChartHeight}
                highlightedRowId={hoveredRowId}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: Task list bottom sheet ── */}
      {isMobile && (
        <BottomSheet
          open={mobileLeftPanelOpen}
          onClose={() => setMobileLeftPanelOpen(false)}
          title={viewMode === "task" ? "Tasks" : "Resources"}
          height="full"
        >
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {viewMode === "task" ? (
              /* Project → Task tree */
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredProjects.map((project, pIdx) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const pc = projectColorMap[project.id] || t.textMuted;
                  const projectRows = allRows.filter(
                    (r) => r._projectId === project.id,
                  );

                  return (
                    <React.Fragment key={project.id}>
                      {/* Project header */}
                      <div
                        onClick={() => {
                          setExpandedProjects((prev) => {
                            const next = new Set(prev);
                            if (next.has(project.id)) next.delete(project.id);
                            else next.add(project.id);
                            return next;
                          });
                        }}
                        style={{
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: t.bgSubtle,
                          borderBottom: `1px solid ${t.border}`,
                          borderLeft: `4px solid ${pc}`,
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} color={t.textMuted} />
                        ) : (
                          <ChevronRight size={16} color={t.textMuted} />
                        )}
                        <Briefcase
                          size={14}
                          color={pc}
                          style={{ flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: t.textPrimary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.project || "Untitled"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: t.textFaint,
                              marginTop: 2,
                            }}
                          >
                            {(project.rows || []).length} tasks ·{" "}
                            {project.status || "draft"}
                          </div>
                        </div>
                      </div>

                      {/* Task rows */}
                      {isExpanded &&
                        projectRows.map((row) => {
                          const sc = getStatusColor(row.status, t);
                          return (
                            <div
                              key={row.id}
                              onClick={() => {
                                // Scroll timeline to this row's bar
                                const pos = rowPositions?.get(row.id);
                                if (pos && timelineRef.current) {
                                  timelineRef.current.scrollTo({
                                    left: Math.max(0, pos.left - 20),
                                    behavior: "smooth",
                                  });
                                }
                                setMobileLeftPanelOpen(false);
                              }}
                              style={{
                                padding: "12px 16px",
                                paddingLeft: 16 + row.depth * 12,
                                borderBottom: `1px solid ${t.borderSubtle}`,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                WebkitTapHighlightColor: "transparent",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: row.depth === 0 ? 600 : 400,
                                    color: t.textPrimary,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.task || "—"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: t.textFaint,
                                    marginTop: 2,
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {row.module && (
                                    <span
                                      style={{
                                        padding: "1px 6px",
                                        background: t.violetBg,
                                        color: t.violet,
                                        border: `1px solid ${t.violetBorder}`,
                                        borderRadius: 3,
                                        fontSize: 10,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {row.module}
                                    </span>
                                  )}
                                  {row.resource && (
                                    <span>
                                      {row.resourceName || row.resource}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  background: sc.bg,
                                  color: sc.color,
                                  border: `1px solid ${sc.border}`,
                                  textTransform: "capitalize",
                                  flexShrink: 0,
                                }}
                              >
                                {row.status || "Pending"}
                              </span>
                            </div>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              /* Resource list */
              <div style={{ flex: 1, overflowY: "auto" }}>
                {resourceViewData.map((res) => (
                  <div
                    key={res.userId}
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${t.borderSubtle}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: t.primaryBg,
                        color: t.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(res.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: t.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {res.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: t.textFaint,
                          marginTop: 2,
                        }}
                      >
                        {res.tasks.length} task
                        {res.tasks.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* Tooltip — desktop */}
      {tooltip && !isMobile && (
        <GanttTooltip
          row={tooltip.row}
          x={tooltip.x}
          y={tooltip.y}
          onClose={() => setTooltip(null)}
          onOpenComments={onOpenComments}
          onFeedback={onFeedback}
        />
      )}

      {/* Mobile: tap on bar opens bottom sheet with details */}
      {isMobile && tooltip && (
        <BottomSheet
          open={true}
          onClose={() => setTooltip(null)}
          title={tooltip.row.task || tooltip.row.module || "Task"}
          height="auto"
        >
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Status + delay badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {(() => {
                const sc = getStatusColor(tooltip.row.status, t);
                return (
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                      textTransform: "capitalize",
                    }}
                  >
                    {tooltip.row.status || "Pending"}
                  </span>
                );
              })()}

              {isDelayed(tooltip.row) && (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: t.dangerBg,
                    color: t.danger,
                    border: `1px solid ${t.dangerBorder}`,
                    textTransform: "uppercase",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={11} />
                  Delayed
                </span>
              )}
            </div>

            {/* Meta */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13,
                color: t.textSecondary,
              }}
            >
              {tooltip.row.module && (
                <div>
                  <strong style={{ color: t.textPrimary }}>Module:</strong>{" "}
                  {tooltip.row.module}
                </div>
              )}
              {tooltip.row._projectName && (
                <div>
                  <strong style={{ color: t.textPrimary }}>Project:</strong>{" "}
                  {tooltip.row._projectName}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color={t.textMuted} />
                <span>
                  {tooltip.row.resourceName ||
                    tooltip.row.resource ||
                    "Unassigned"}
                </span>
              </div>
            </div>

            {/* Planned dates */}
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: t.primary,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Planned
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    padding: "8px 10px",
                    background: t.primaryBgSubtle,
                    border: `1px solid ${t.primaryBorder}`,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: t.primary,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    START
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: t.textPrimary,
                    }}
                  >
                    {fmtDisplay(tooltip.row.plannedStart)}
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px 10px",
                    background: t.primaryBgSubtle,
                    border: `1px solid ${t.primaryBorder}`,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: t.primary,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    STOP
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: t.textPrimary,
                    }}
                  >
                    {fmtDisplay(tooltip.row.plannedStop)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actual dates */}
            {(tooltip.row.actualStart || tooltip.row.actualStop) && (
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: t.success,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Actual
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      background: t.successBgSubtle,
                      border: `1px solid ${t.successBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: t.success,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      START
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: t.textPrimary,
                      }}
                    >
                      {fmtDisplay(tooltip.row.actualStart)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "8px 10px",
                      background: t.successBgSubtle,
                      border: `1px solid ${t.successBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: t.success,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      STOP
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: t.textPrimary,
                      }}
                    >
                      {fmtDisplay(tooltip.row.actualStop)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duration */}
            <div
              style={{
                padding: "10px 12px",
                background: t.bgSubtle,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: t.textSecondary,
              }}
            >
              <Clock size={13} color={t.textMuted} />
              <span>
                Planned:{" "}
                <strong style={{ color: t.textPrimary }}>
                  {fmtHrMin(tooltip.row.durationHrs)}
                </strong>
                {tooltip.row.actualElapsedHrs != null && (
                  <>
                    {" · "}Actual:{" "}
                    <strong style={{ color: t.textPrimary }}>
                      {fmtHrMin(Math.abs(tooltip.row.actualElapsedHrs))}
                    </strong>
                  </>
                )}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              {tooltip.row.commentCount > 0 && (
                <button
                  onClick={() => {
                    onOpenComments(tooltip.row);
                    setTooltip(null);
                  }}
                  style={{
                    flex: 1,
                    height: 46,
                    border: `1px solid ${t.violetBorder}`,
                    borderRadius: 10,
                    background: t.violetBg,
                    color: t.violet,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: "Sora,sans-serif",
                  }}
                >
                  <MessageSquare size={15} />
                  Comments ({tooltip.row.commentCount})
                </button>
              )}
              {String(tooltip.row.status || "")
                .toLowerCase()
                .trim() === "finished" && (
                <button
                  onClick={() => {
                    onFeedback(tooltip.row);
                    setTooltip(null);
                  }}
                  style={{
                    flex: 1,
                    height: 46,
                    border: `1px solid ${t.violetBorder}`,
                    borderRadius: 10,
                    background: t.violetBg,
                    color: t.violet,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: "Sora,sans-serif",
                  }}
                >
                  <Star size={15} fill={t.violet} />
                  Rating
                </button>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      <style>{`
        @keyframes ganttPulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
