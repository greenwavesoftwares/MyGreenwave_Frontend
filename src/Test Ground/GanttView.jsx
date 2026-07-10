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

/* ─── Constants ─── */
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const ROW_HEIGHT = 44;
const SUB_HEADER_HEIGHT = 32;
const HEADER_HEIGHT = 56;
const LEFT_PANEL_WIDTH_COLLAPSED = 300; // ← Renamed
const LEFT_PANEL_WIDTH_EXPANDED = 480;
const MIN_COL_WIDTH = 20;
const MAX_COL_WIDTH = 200;
// ── Column widths for the left panel ──
const COL_TASK_WIDTH = 240; // Task name column
const COL_MODULE_WIDTH = 120; // Module column
const COL_RESOURCE_WIDTH = 130; // Resource column
const COL_STATUS_WIDTH = 100; // Status column
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

/* ─── Status Colors ─── */
const STATUS_COLORS = {
  pending: {
    bg: "#F1F5F9",
    color: "#64748B",
    border: "#CBD5E1",
    bar: "#94A3B8",
  },
  "not ready": {
    bg: "#FEF3C7",
    color: "#B45309",
    border: "#FCD34D",
    bar: "#F59E0B",
  },
  rejected: {
    bg: "#FEE2E2",
    color: "#DC2626",
    border: "#FCA5A5",
    bar: "#EF4444",
  },
  paused: {
    bg: "#FFEDD5",
    color: "#C2410C",
    border: "#FDBA74",
    bar: "#F97316",
  },
  running: {
    bg: "#DBEAFE",
    color: "#1D4ED8",
    border: "#93C5FD",
    bar: "#3B82F6",
  },
  completed: {
    bg: "#DCFCE7",
    color: "#15803D",
    border: "#86EFAC",
    bar: "#22C55E",
  },
  finished: {
    bg: "#EDE9FE",
    color: "#7C3AED",
    border: "#DDD6FE",
    bar: "#8B5CF6",
  },
  closed: {
    bg: "#F1F5F9",
    color: "#475569",
    border: "#CBD5E1",
    bar: "#64748B",
  },
};

const getStatusColor = (status) => {
  const key = String(status || "pending")
    .toLowerCase()
    .trim();
  return STATUS_COLORS[key] || STATUS_COLORS.pending;
};

/* ─── Helpers ─── */
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

/* ─── Project Color Palette ─── */
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

/* ─── Tooltip ─── */
function GanttTooltip({ row, x, y, onClose, onOpenComments, onFeedback }) {
  const ref = useRef(null);
  const delayed = isDelayed(row);
  const sc = delayed ? DELAYED_COLOR : getStatusColor(row.status);
  const hasActual = row.actualStart || row.actualStop;
  const isCompleted =
    String(row.status || "")
      .toLowerCase()
      .trim() === "completed";
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
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        zIndex: 9999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
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
              color: "#0F172A",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.task || "—"}
          </div>
          <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>
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
          {isDelayed(row) && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 700,
                background: "#FEE2E2",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
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
            color: "#94A3B8",
            padding: 0,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px" }}>
        {/* Resource */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Users size={12} color="#64748B" />
          <span style={{ fontSize: 11.5, color: "#475569" }}>
            {row.resourceName || row.resource || "Unassigned"}
          </span>
        </div>

        {/* Planned Dates */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: "#1D4ED8",
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
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 8.5, color: "#0369A1", fontWeight: 600 }}>
                START
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: "#0F172A",
                }}
              >
                {fmtDisplay(row.plannedStart)}
              </div>
            </div>
            <div
              style={{
                padding: "4px 6px",
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 8.5, color: "#0369A1", fontWeight: 600 }}>
                STOP
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: "#0F172A",
                }}
              >
                {fmtDisplay(row.plannedStop)}
              </div>
            </div>
          </div>
        </div>

        {/* Actual Dates */}
        {hasActual && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: "#15803D",
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
                  background: "#F0FDF4",
                  border: "1px solid #86EFAC",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{ fontSize: 8.5, color: "#15803D", fontWeight: 600 }}
                >
                  START
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: "#0F172A",
                  }}
                >
                  {fmtDisplay(row.actualStart)}
                </div>
              </div>
              <div
                style={{
                  padding: "4px 6px",
                  background: "#F0FDF4",
                  border: "1px solid #86EFAC",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{ fontSize: 8.5, color: "#15803D", fontWeight: 600 }}
                >
                  STOP
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: "#0F172A",
                  }}
                >
                  {fmtDisplay(row.actualStop)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duration */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            padding: "4px 8px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 5,
          }}
        >
          <Clock size={11} color="#64748B" />
          <span style={{ fontSize: 11, color: "#475569" }}>
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

        {/* Actions */}
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
                border: "1px solid #DDD6FE",
                borderRadius: 6,
                background: "#EDE9FE",
                color: "#7C3AED",
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
                border: "1px solid #DDD6FE",
                borderRadius: 6,
                background: "#EDE9FE",
                color: "#7C3AED",
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
              <Star size={11} fill="#7C3AED" />
              View Rating
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
/* ─── Lane Assignment: Stack overlapping bars ─── */
function assignLanes(tasks) {
  // Sort by start time
  const sorted = tasks
    .map((t) => {
      const start = parseDt(t.plannedStart);
      const end = parseDt(t.plannedStop);
      const actualStart = parseDt(t.actualStart);
      const actualEnd = parseDt(t.actualStop);

      // Use the earliest start and latest end across planned + actual
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

  // Greedy lane assignment
  const lanes = []; // Each lane tracks its "end time"

  sorted.forEach((task) => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      // If this task starts after (or at) the lane's current end, place here
      if (task._effectiveStart >= lanes[i]) {
        lanes[i] = task._effectiveEnd;
        task._lane = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Need a new lane
      task._lane = lanes.length;
      lanes.push(task._effectiveEnd);
    }
  });

  // Tasks without dates get lane 0
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
/* ─── Detect Delay: completed task that finished after planned stop ─── */
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

/* ─── Delayed Color Override ─── */
const DELAYED_COLOR = {
  bg: "#FEE2E2",
  color: "#DC2626",
  border: "#FCA5A5",
  bar: "#EF4444",
};
function GanttFilterDropdown({ label, options, selected, onChange, icon }) {
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
          border: `1px solid ${isActive ? "#1D4ED8" : "#CBD5E1"}`,
          background: isActive ? "#EFF6FF" : "#fff",
          color: isActive ? "#1D4ED8" : "#475569",
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
              background: "#1D4ED8",
              color: "#fff",
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
            background: "#fff",
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 999,
            fontFamily: "Sora,sans-serif",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid #E2E8F0",
              background: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>
              Filter by {label}
            </span>
            {isActive && (
              <button
                onClick={() => onChange([])}
                style={{
                  background: "none",
                  border: "none",
                  color: "#EF4444",
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
                borderBottom: "1px solid #F1F5F9",
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
                  border: "1px solid #E2E8F0",
                  borderRadius: 5,
                  padding: "0 8px",
                  fontSize: 11,
                  fontFamily: "Sora,sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
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
                  color: "#94A3B8",
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
                      background: checked ? "#F0F9FF" : "transparent",
                      borderLeft: checked
                        ? "3px solid #1D4ED8"
                        : "3px solid transparent",
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!checked)
                        e.currentTarget.style.background = "#F8FAFC";
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
                        border: `1.5px solid ${checked ? "#1D4ED8" : "#CBD5E1"}`,
                        background: checked ? "#1D4ED8" : "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "#fff",
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
                        color: "#0F172A",
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
                borderTop: "1px solid #E2E8F0",
                background: "#FAFBFC",
                fontSize: 10,
                color: "#64748B",
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
/* ─── Compact Per-Project Filter Dropdown ─── */
import { createPortal } from "react-dom";

/* ─── Compact Per-Project Filter Dropdown (with Portal) ─── */
function CompactFilterDropdown({
  label,
  icon,
  options,
  selected,
  onChange,
  color = "#1D4ED8",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  // ── Calculate dropdown position ──
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popupWidth = 240;
    const popupHeight = 320;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 4;

    // Vertical positioning
    let top = rect.bottom + spacing;
    if (top + popupHeight > viewportHeight - 20) {
      // Open upward if not enough space below
      top = rect.top - popupHeight - spacing;
    }

    // Horizontal positioning — align to right edge of button
    let left = rect.right - popupWidth;
    if (left < 10) {
      left = 10; // Prevent going off-screen left
    }
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }

    setPosition({ top, left });
  }, []);

  // ── Update position when opened ──
  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  // ── Click outside handler ──
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (buttonRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setOpen(false);
      setSearch("");
    };
    // Delay so opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const filtered = options.filter((o) =>
    (o.label || "").toLowerCase().includes(search.toLowerCase()),
  );

  const isActive = selected.length > 0;

  // ── Dropdown popup (rendered via portal) ──
  const popup = open ? (
    <div
      ref={popupRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: 240,
        background: "#fff",
        border: "1px solid #CBD5E1",
        borderRadius: 8,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        zIndex: 99999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #E2E8F0",
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>
          Filter: {label}
        </span>
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
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

      {/* Search */}
      {options.length > 5 && (
        <div
          style={{
            padding: "6px 10px",
            borderBottom: "1px solid #F1F5F9",
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
              border: "1px solid #E2E8F0",
              borderRadius: 5,
              padding: "0 8px",
              fontSize: 11,
              fontFamily: "Sora,sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Options */}
      <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: "#94A3B8",
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
                onClick={(e) => {
                  e.stopPropagation();
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
                  background: checked ? `${color}15` : "transparent",
                  borderLeft: checked
                    ? `3px solid ${color}`
                    : "3px solid transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.background = "#F8FAFC";
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
                    border: `1.5px solid ${checked ? color : "#CBD5E1"}`,
                    background: checked ? color : "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {checked && "✓"}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#0F172A",
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

      {/* Footer */}
      {selected.length > 0 && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: "1px solid #E2E8F0",
            background: "#FAFBFC",
            fontSize: 10,
            color: "#64748B",
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        title={`Filter by ${label}`}
        style={{
          height: 22,
          padding: "0 6px",
          borderRadius: 4,
          border: `1px solid ${isActive ? color : "#E2E8F0"}`,
          background: isActive ? `${color}15` : "#fff",
          color: isActive ? color : "#64748B",
          fontFamily: "Sora,sans-serif",
          fontSize: 9.5,
          fontWeight: isActive ? 600 : 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        {icon}
        <span>{label}</span>
        {isActive && (
          <span
            style={{
              padding: "0 4px",
              borderRadius: 999,
              background: color,
              color: "#fff",
              fontSize: 8.5,
              fontWeight: 700,
              minWidth: 12,
              textAlign: "center",
            }}
          >
            {selected.length}
          </span>
        )}
      </button>

      {/* Portal renders popup at document.body level */}
      {open && createPortal(popup, document.body)}
    </>
  );
}
/* ─── Column Header Filter Button (with portal) ─── */
function ColumnFilterButton({
  columnKey,
  color,
  filterOptions,
  selected,
  onChange,
}) {
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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 4;

    let top = rect.bottom + spacing;
    if (top + popupHeight > viewportHeight - 20) {
      top = rect.top - popupHeight - spacing;
    }

    let left = rect.right - popupWidth;
    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }

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
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const filtered = filterOptions.filter((o) =>
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
        background: "#fff",
        border: "1px solid #CBD5E1",
        borderRadius: 8,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        zIndex: 99999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #E2E8F0",
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>
          Filter {columnKey.charAt(0).toUpperCase() + columnKey.slice(1)}
        </span>
        {isActive && (
          <button
            onClick={() => onChange([])}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
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

      {filterOptions.length > 5 && (
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #F1F5F9" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            autoFocus
            style={{
              width: "100%",
              height: 26,
              border: "1px solid #E2E8F0",
              borderRadius: 5,
              padding: "0 8px",
              fontSize: 11,
              fontFamily: "Sora,sans-serif",
              outline: "none",
              boxSizing: "border-box",
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
              color: "#94A3B8",
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
                  background: checked ? `${color}15` : "transparent",
                  borderLeft: checked
                    ? `3px solid ${color}`
                    : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.background = "#F8FAFC";
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
                    border: `1.5px solid ${checked ? color : "#CBD5E1"}`,
                    background: checked ? color : "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {checked && "✓"}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#0F172A",
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
            borderTop: "1px solid #E2E8F0",
            background: "#FAFBFC",
            fontSize: 10,
            color: "#64748B",
            textAlign: "center",
          }}
        >
          {selected.length} of {filterOptions.length} selected
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
          width: 22,
          height: 22,
          borderRadius: 4,
          border: `1px solid ${isActive ? color : "#E2E8F0"}`,
          background: isActive ? `${color}15` : "#fff",
          color: isActive ? color : "#94A3B8",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Filter size={11} />
        {isActive && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 14,
              height: 14,
              padding: "0 3px",
              borderRadius: 999,
              background: color,
              color: "#fff",
              fontSize: 8.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #fff",
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
/* ─── Project Column Filter Button (with portal) ─── */
function ProjectColumnFilterButton({
  color,
  columnKey,
  options,
  selected,
  onChange,
}) {
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
    if (top + popupHeight > viewportHeight - 20) {
      top = rect.top - popupHeight - spacing;
    }

    let left = rect.right - popupWidth;
    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }

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
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);
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
        background: "#fff",
        border: "1px solid #CBD5E1",
        borderRadius: 8,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        zIndex: 99999,
        fontFamily: "Sora,sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #E2E8F0",
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>
          Filter {columnKey.charAt(0).toUpperCase() + columnKey.slice(1)}
        </span>
        {isActive && (
          <button
            onClick={() => onChange([])}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
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
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #F1F5F9" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            autoFocus
            style={{
              width: "100%",
              height: 26,
              border: "1px solid #E2E8F0",
              borderRadius: 5,
              padding: "0 8px",
              fontSize: 11,
              fontFamily: "Sora,sans-serif",
              outline: "none",
              boxSizing: "border-box",
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
              color: "#94A3B8",
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
                  background: checked ? `${color}15` : "transparent",
                  borderLeft: checked
                    ? `3px solid ${color}`
                    : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.background = "#F8FAFC";
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
                    border: `1.5px solid ${checked ? color : "#CBD5E1"}`,
                    background: checked ? color : "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {checked && "✓"}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#0F172A",
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
            borderTop: "1px solid #E2E8F0",
            background: "#FAFBFC",
            fontSize: 10,
            color: "#64748B",
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
          border: `1px solid ${isActive ? color : "#E2E8F0"}`,
          background: isActive ? `${color}15` : "#fff",
          color: isActive ? color : "#94A3B8",
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
              color: "#fff",
              fontSize: 8,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #fff",
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
  console.log("project : ", projects);
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
  // ── Column filter state (global across all projects) ──
  const [columnFilters, setColumnFilters] = useState({
    module: [],
    resource: [],
    status: [],
  });

  // ── Filter projects ──
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Project filter
    if (projectFilter.length > 0) {
      result = result.filter((p) => projectFilter.includes(p.id));
    }

    // Apply row-level filters (module, resource, status)
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
            ) {
              return false;
            }
            if (
              resourceFilter.length > 0 &&
              !resourceFilter.includes(r.resource || "")
            ) {
              return false;
            }
            if (
              statusFilter.length > 0 &&
              !statusFilter.includes(r.status || "Pending")
            ) {
              return false;
            }
            return true;
          });

          // Include ancestors of filtered rows
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
        .filter((p) => p.rows.length > 0); // Only show projects with matching rows
    }

    return result;
  }, [projects, projectFilter, moduleFilter, resourceFilter, statusFilter]);
  // Add this near your other computed values in GanttView
  const leftPanelWidth = useMemo(() => {
    // Expand width if any project is expanded (needs room for filter buttons)
    const anyExpanded = filteredProjects.some((p) =>
      expandedProjects.has(p.id),
    );
    return anyExpanded ? LEFT_PANEL_WIDTH_EXPANDED : LEFT_PANEL_WIDTH_COLLAPSED;
  }, [filteredProjects, expandedProjects]);
  // ── Flatten all rows across projects ──
  // ── Compute options for column filters (cascading) ──
  const globalColumnFilterOptions = useMemo(() => {
    // All rows from all filtered projects
    const allRows = filteredProjects.flatMap((p) => p.rows || []);

    // Helper: does row match all filters EXCEPT the given one?
    const matchesExcept = (row, excludeKey) => {
      if (
        excludeKey !== "module" &&
        columnFilters.module.length > 0 &&
        !columnFilters.module.includes(row.module || "")
      ) {
        return false;
      }
      if (
        excludeKey !== "resource" &&
        columnFilters.resource.length > 0 &&
        !columnFilters.resource.includes(row.resource || "")
      ) {
        return false;
      }
      if (
        excludeKey !== "status" &&
        columnFilters.status.length > 0 &&
        !columnFilters.status.includes(row.status || "Pending")
      ) {
        return false;
      }
      return true;
    };

    // Modules
    const modules = [
      ...new Set(
        allRows
          .filter((r) => matchesExcept(r, "module") && r.module)
          .map((r) => r.module),
      ),
    ].sort();
    const moduleOpts = modules.map((m) => ({ value: m, label: m }));

    // Resources
    const resourcesMap = new Map();
    allRows
      .filter((r) => matchesExcept(r, "resource") && r.resource)
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

    // Statuses
    const statuses = [
      ...new Set(
        allRows
          .filter((r) => matchesExcept(r, "status"))
          .map((r) => r.status || "Pending"),
      ),
    ].sort();
    const statusOpts = statuses.map((s) => ({ value: s, label: s }));

    return { moduleOpts, resourceOpts, statusOpts };
  }, [filteredProjects, columnFilters]);
  const syncScroll = useCallback((e) => {
    if (leftPanelRef.current)
      leftPanelRef.current.scrollTop = e.target.scrollTop;
  }, []);
  // ── Resource view ──
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

    // Assign lanes for each resource
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
  // ── Filter options from all projects ──
  const filterOptions = useMemo(() => {
    // ── 1. Project options: always full list ──
    const projectOpts = projects.map((p) => ({
      value: p.id,
      label: p.project || "Untitled",
      color: projectColorMap[p.id],
    }));

    // ── 2. Filter projects by current project filter ──
    const projectsForOpts =
      projectFilter.length > 0
        ? projects.filter((p) => projectFilter.includes(p.id))
        : projects;

    // ── 3. All rows from filtered projects ──
    let scopedRows = projectsForOpts.flatMap((p) => p.rows || []);

    // ── 4. Module options: filter by selected projects ──
    const modules = [
      ...new Set(scopedRows.filter((r) => r.module).map((r) => r.module)),
    ].sort();
    const moduleOpts = modules.map((m) => ({ value: m, label: m }));

    // ── 5. Filter rows by module selection (for resource/status options) ──
    if (moduleFilter.length > 0) {
      scopedRows = scopedRows.filter((r) =>
        moduleFilter.includes(r.module || ""),
      );
    }

    // ── 6. Resource options: filter by projects + modules ──
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

    // ── 7. Filter rows by resource selection (for status options) ──
    if (resourceFilter.length > 0) {
      scopedRows = scopedRows.filter((r) =>
        resourceFilter.includes(r.resource || ""),
      );
    }

    // ── 8. Status options: filter by projects + modules + resources ──
    const statuses = [
      ...new Set(scopedRows.map((r) => r.status || "Pending")),
    ].sort();
    const statusOpts = statuses.map((s) => ({ value: s, label: s }));

    return { projectOpts, moduleOpts, resourceOpts, statusOpts };
  }, [projects, projectColorMap, projectFilter, moduleFilter, resourceFilter]);
  // ═══════════════════════════════════════════════════════
  // 1. Reset column width when zoom changes
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    setColWidthPx(ZOOM_CONFIGS[zoom].defaultColWidth);
  }, [zoom]);

  // ═══════════════════════════════════════════════════════
  // 2. Auto-clean invalid per-project filter selections
  // (Fixed: no infinite loop)
  // ═══════════════════════════════════════════════════════
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

      // CRITICAL: Return same reference if nothing changed (prevents infinite loop)
      return hasChanges ? newFilters : prevFilters;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects]); // ← Only depend on filteredProjects, NOT projectFilters

  // ═══════════════════════════════════════════════════════
  // 3. Auto-clean invalid GLOBAL filter selections
  // ═══════════════════════════════════════════════════════
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
    (rowId) => {
      return filteredProjects.some((p) =>
        (p.rows || []).some((r) => r.parentId === rowId),
      );
    },
    [filteredProjects],
  );

  const handleBarClick = (e, row) => {
    e.stopPropagation();
    setTooltip({ row, x: e.clientX, y: e.clientY });
  };

  const btnStyle = {
    height: 30,
    padding: "0 12px",
    borderRadius: 6,
    border: "1px solid #CBD5E1",
    background: "#fff",
    color: "#475569",
    fontFamily: "Sora,sans-serif",
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };
  // Get filters for a specific project
  const getProjectFilter = (projectId) => {
    return (
      projectFilters[projectId] || {
        module: [],
        resource: [],
        status: [],
      }
    );
  };

  // Update a specific filter for a project
  const updateProjectFilter = (projectId, filterKey, values) => {
    setProjectFilters((prev) => ({
      ...prev,
      [projectId]: {
        ...getProjectFilter(projectId),
        [filterKey]: values,
      },
    }));
  };

  // Clear all filters for a specific project
  const clearProjectFilters = (projectId) => {
    setProjectFilters((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  // Get filter options for a specific project
  // Get filter options for a specific project (with dependent filtering)
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
  // Check if project has active filters
  const hasProjectFilters = (projectId) => {
    const f = getProjectFilter(projectId);
    return f.module.length > 0 || f.resource.length > 0 || f.status.length > 0;
  };
  const allRows = useMemo(() => {
    const result = [];
    filteredProjects.forEach((project, pIdx) => {
      let rows = project.rows || [];

      // ── Apply per-project filters ──
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

        // Include ancestors
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

  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 140px)",
        minHeight: 400,
      }}
    >
      {/* ══ TOOLBAR ══ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderBottom: "1px solid #E2E8F0",
          background: "#F8FAFC",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            background: "#E2E8F0",
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
                background: viewMode === v.key ? "#fff" : "transparent",
                border: "none",
                color: viewMode === v.key ? "#0F172A" : "#64748B",
                fontWeight: viewMode === v.key ? 700 : 500,
                boxShadow:
                  viewMode === v.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />

        {/* Zoom Level */}
        <div
          style={{
            display: "flex",
            background: "#E2E8F0",
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
                background: zoom === key ? "#fff" : "transparent",
                border: "none",
                color: zoom === key ? "#0F172A" : "#64748B",
                fontWeight: zoom === key ? 700 : 500,
                boxShadow: zoom === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                padding: "0 10px",
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setColWidthPx((p) => Math.max(p - 20, MIN_COL_WIDTH))}
          style={btnStyle}
          title="Zoom out"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={() => setColWidthPx((p) => Math.min(p + 20, MAX_COL_WIDTH))}
          style={btnStyle}
          title="Zoom in"
        >
          <ZoomIn size={13} />
        </button>

        <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />

        {/* Project Filter */}
        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />

        {/* Filters */}
        {showGlobalFilters && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#64748B",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Filters:
              </span>

              <GanttFilterDropdown
                label="Project"
                icon={<Briefcase size={11} />}
                options={filterOptions.projectOpts}
                selected={projectFilter}
                onChange={setProjectFilter}
              />

              {viewMode === "task" && (
                <GanttFilterDropdown
                  label="Module"
                  icon={<Calendar size={11} />}
                  options={filterOptions.moduleOpts}
                  selected={moduleFilter}
                  onChange={setModuleFilter}
                />
              )}

              <GanttFilterDropdown
                label="Resource"
                icon={<Users size={11} />}
                options={filterOptions.resourceOpts}
                selected={resourceFilter}
                onChange={setResourceFilter}
              />

              <GanttFilterDropdown
                label="Status"
                icon={<Filter size={11} />}
                options={filterOptions.statusOpts}
                selected={statusFilter}
                onChange={setStatusFilter}
              />

              {(projectFilter.length > 0 ||
                moduleFilter.length > 0 ||
                resourceFilter.length > 0 ||
                statusFilter.length > 0) && (
                <button
                  onClick={() => {
                    setProjectFilter([]);
                    setModuleFilter([]);
                    setResourceFilter([]);
                    setStatusFilter([]);
                  }}
                  style={{
                    height: 30,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid #FCA5A5",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    fontFamily: "Sora,sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X size={11} /> Clear All
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "#64748B",
                marginLeft: 6,
              }}
            >
              <Briefcase size={12} />
              <span>
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""}
              </span>
            </div>
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
            color: "#64748B",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              style={{
                width: 14,
                height: 6,
                borderRadius: 2,
                background: "#3B82F6",
                display: "inline-block",
              }}
            />{" "}
            Planned
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              style={{
                width: 14,
                height: 6,
                borderRadius: 2,
                background: "#22C55E",
                display: "inline-block",
                border: "1px dashed #15803D",
              }}
            />{" "}
            Actual
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              style={{
                width: 14,
                height: 6,
                borderRadius: 2,
                background: "#EF4444",
                display: "inline-block",
              }}
            />{" "}
            Delayed
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                display: "inline-block",
              }}
            />{" "}
            Weekend
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              style={{
                width: 2,
                height: 12,
                background: "#EF4444",
                display: "inline-block",
              }}
            />{" "}
            Today
          </span>
        </div>
      </div>

      {/* ══ GANTT BODY ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── LEFT PANEL ── */}
        <div
          style={{
            width: LEFT_PANEL_WIDTH,
            flexShrink: 0,
            borderRight: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            zIndex: 20,
          }}
        >
          {/* ══ COLUMN HEADERS ══ */}
          <div
            style={{
              height: HEADER_HEIGHT,
              borderBottom: "1px solid #E2E8F0",
              background: "#F8FAFC",
              display: "flex",
              flexShrink: 0,
            }}
          >
            {/* ══ Main Column Header ══ */}
            <div
              style={{
                height: HEADER_HEIGHT,
                borderBottom: "1px solid #E2E8F0",
                background: "#F8FAFC",
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
                  color: "#64748B",
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
                  const pc = projectColorMap[project.id] || "#64748B";
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
                      {/* ══ Project header row (full width) ══ */}
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
                          borderBottom: "1px solid #E2E8F0",
                          background: hasFilters ? "#F0F9FF" : "#F8FAFC",
                          cursor: "pointer",
                          gap: 6,
                          borderLeft: `4px solid ${pc}`,
                          transition: "background 0.15s",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={13}
                            color="#64748B"
                            style={{ flexShrink: 0 }}
                          />
                        ) : (
                          <ChevronRight
                            size={13}
                            color="#64748B"
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
                              color: "#0F172A",
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
                              color: "#94A3B8",
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
                                    color: "#1D4ED8",
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

                        {/* Clear filters button */}
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
                              border: "1px solid #FCA5A5",
                              background: "#FEF2F2",
                              color: "#EF4444",
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

                      {/* ══ Sub-header (only when expanded): Column headers with filters ══ */}
                      {isExpanded && (
                        <div
                          style={{
                            height: SUB_HEADER_HEIGHT,
                            display: "flex",
                            borderBottom: "1px solid #E2E8F0",
                            background: "#FAFBFC",
                            borderLeft: `4px solid ${pc}80`, // Semi-transparent
                          }}
                        >
                          {/* Task name sub-header */}
                          <div
                            style={{
                              width: COL_TASK_WIDTH - 4,
                              padding: "0 12px",
                              display: "flex",
                              alignItems: "center",
                              borderRight: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                              }}
                            >
                              Task
                            </span>
                          </div>

                          {/* Module sub-header */}
                          <div
                            style={{
                              width: COL_MODULE_WIDTH,
                              padding: "0 10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              borderRight: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                              }}
                            >
                              Module
                            </span>
                            <ProjectColumnFilterButton
                              color="#7C3AED"
                              columnKey="module"
                              options={projectFilterOpts.moduleOpts}
                              selected={projectFilter.module}
                              onChange={(vals) =>
                                updateProjectFilter(project.id, "module", vals)
                              }
                            />
                          </div>

                          {/* Resource sub-header */}
                          <div
                            style={{
                              width: COL_RESOURCE_WIDTH,
                              padding: "0 10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              borderRight: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                              }}
                            >
                              Resource
                            </span>
                            <ProjectColumnFilterButton
                              color="#15803D"
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

                          {/* Status sub-header */}
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
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                              }}
                            >
                              Status
                            </span>
                            <ProjectColumnFilterButton
                              color="#B45309"
                              columnKey="status"
                              options={projectFilterOpts.statusOpts}
                              selected={projectFilter.status}
                              onChange={(vals) =>
                                updateProjectFilter(project.id, "status", vals)
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* ══ Task rows with column cells ══ */}
                      {isExpanded &&
                        projectRows.map((row) => {
                          const isParent = hasChildren(row.id);
                          const isRowExpanded = expandedRows.has(row.id);
                          const sc = getStatusColor(row.status);

                          return (
                            <div
                              key={row.id}
                              style={{
                                height: ROW_HEIGHT,
                                display: "flex",
                                borderBottom: "1px solid #F1F5F9",
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
                                  borderRight: "1px solid #F1F5F9",
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
                                      color: "#94A3B8",
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
                                  <span style={{ width: 12, flexShrink: 0 }} />
                                )}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: row.depth === 0 ? 600 : 400,
                                      color: "#0F172A",
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
                                  borderRight: "1px solid #F1F5F9",
                                  overflow: "hidden",
                                }}
                              >
                                {row.module ? (
                                  <span
                                    style={{
                                      padding: "2px 7px",
                                      borderRadius: 4,
                                      background: "#EDE9FE",
                                      color: "#7C3AED",
                                      border: "1px solid #DDD6FE",
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
                                      color: "#CBD5E1",
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
                                  borderRight: "1px solid #F1F5F9",
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
                                        background: "#DBEAFE",
                                        color: "#1D4ED8",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {(row.resourceName || row.resource || "?")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                    <span
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        fontSize: 10.5,
                                        color: "#475569",
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
                                      color: "#CBD5E1",
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

                      {/* Empty state when filters exclude everything */}
                      {isExpanded && hasFilters && projectRows.length === 0 && (
                        <div
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            borderBottom: "1px solid #F1F5F9",
                            background: "#FAFBFC",
                          }}
                        >
                          <Filter
                            size={18}
                            color="#CBD5E1"
                            style={{ marginBottom: 6 }}
                          />
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748B",
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
                              border: "1px solid #CBD5E1",
                              background: "#fff",
                              color: "#64748B",
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
              /* ══ RESOURCE VIEW — unchanged ══ */
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
                      borderBottom: "1px solid #F1F5F9",
                      gap: 8,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#DBEAFE",
                        color: "#1D4ED8",
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
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {res.name}
                      </div>
                      <div style={{ fontSize: 9.5, color: "#94A3B8" }}>
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

        {/* ── RIGHT TIMELINE ── */}
        <div
          ref={timelineRef}
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "auto",
            position: "relative",
          }}
          onScroll={syncScroll}
        >
          <div style={{ width: totalChartWidth, position: "relative" }}>
            {/* Header */}
            <div
              style={{
                height: HEADER_HEIGHT,
                position: "sticky",
                top: 0,
                zIndex: 15,
                background: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  height: 24,
                  position: "relative",
                  borderBottom: "1px solid #E2E8F0",
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
                        color: "#475569",
                        whiteSpace: "nowrap",
                        borderLeft: "1px solid #E2E8F0",
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
                        color: isWeekend ? "#DC2626" : "#64748B",
                        whiteSpace: "nowrap",
                        borderLeft: "1px solid #E2E8F0",
                        minWidth: colWidthPx,
                      }}
                    >
                      {ZOOM_CONFIGS[zoom].tickFormat(tick)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Area */}
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
                    background: "rgba(241,245,249,0.85)",
                    borderLeft: "1px solid #E2E8F0",
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
                    background: "#EF4444",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: -16,
                      background: "#EF4444",
                      color: "#fff",
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
                      background: "#F1F5F9",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                );
              })}

              {/* ── TASK VIEW ── */}
              {viewMode === "task" &&
                filteredProjects.map((project) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const pc = projectColorMap[project.id] || "#64748B";
                  const projectRows = allRows.filter(
                    (r) => r._projectId === project.id,
                  );
                  const hasFilters = hasProjectFilters(project.id);

                  return (
                    <React.Fragment key={project.id}>
                      {/* Project header row */}
                      <div
                        style={{
                          height: ROW_HEIGHT,
                          position: "relative",
                          borderBottom: "1px solid #E2E8F0",
                          background: hasFilters ? "#F0F9FF" : "#F8FAFC",
                        }}
                      />

                      {/* Sub-header row (matches left panel's sub-header) */}
                      {isExpanded && (
                        <div
                          style={{
                            height: SUB_HEADER_HEIGHT,
                            position: "relative",
                            borderBottom: "1px solid #E2E8F0",
                            background: "#FAFBFC",
                          }}
                        />
                      )}
                      {/* Task bars */}
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
                          const sc = getStatusColor(row.status);
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
                                borderBottom: "1px solid #F1F5F9",
                                minHeight: 24, // Top row (chevron + name)
                                paddingBottom: 4,
                              }}
                            >
                              {/* Planned bar */}
                              {plannedBar && (
                                <div
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
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    transition: "opacity 0.12s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.opacity = "0.85")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.opacity = "1")
                                  }
                                >
                                  {/* Project color stripe */}
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

                                  {/* Running animation */}
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

                                  {/* Label */}
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

                              {/* Actual bar (below planned) */}
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
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
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
                                    color: "#CBD5E1",
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

              {/* ── RESOURCE VIEW ── */}
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
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      {/* Lane separators */}
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
                              background: "#F1F5F9",
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
                          ? DELAYED_COLOR
                          : getStatusColor(row.status);
                        const pc = projectColorMap[row._projectId] || "#64748B";
                        const lane = row._lane || 0;
                        const laneTop = lane * LANE_HEIGHT;

                        return (
                          <React.Fragment key={row.id}>
                            {/* Planned bar */}
                            {plannedBar && (
                              <div
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
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                  transition: "opacity 0.12s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.opacity = "0.85")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.opacity = "1")
                                }
                              >
                                {/* Project color stripe */}
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

                                {/* Label */}
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

                            {/* Actual bar — below planned, same lane */}
                            {actualBar &&
                              (() => {
                                const delayed = isDelayed(row);
                                return (
                                  <div
                                    onClick={(e) => handleBarClick(e, row)}
                                    title={`${row.task} — ${row._projectName} (Actual)${delayed ? " ⚠ DELAYED" : ""}`}
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
                                      background: delayed
                                        ? "rgba(239,68,68,0.2)"
                                        : "rgba(34,197,94,0.2)",
                                      border: `2px solid ${delayed ? "#EF4444" : "#22C55E"}`,
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
                                        {row.task}{" "}
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
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <GanttTooltip
          row={tooltip.row}
          x={tooltip.x}
          y={tooltip.y}
          onClose={() => setTooltip(null)}
          onOpenComments={onOpenComments}
          onFeedback={onFeedback}
        />
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
