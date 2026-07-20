import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
  act,
} from "react";
import { UserCheck, UserX } from "lucide-react";
import {
  WifiOff,
  ServerCrash,
  ShieldAlert,
  ShieldX,
  SearchX,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";

import {
  // Navigation & Layout
  Briefcase,
  Home,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  ArrowRight,
  X,

  // Actions
  Plus,
  Save,
  Send,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Check,

  // Status & Indicators
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Loader2,

  // Domain-Specific
  FolderOpen,
  Folder,
  FileText,
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  Users,
  User,
  MessageSquare,
  Settings,
  Rocket,
  Bell,
  HelpCircle,
  Layers,
  Package,
  Hash,

  // Communication
  CornerDownRight,
  Reply,
  Paperclip,
  AtSign,
  Lightbulb,
} from "lucide-react";
import { ShieldCheck, XCircle, ClipboardList, CalendarX } from "lucide-react";
import {
  PauseCircle, // paused
  PlayCircle, // running
} from "lucide-react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import activityTrackerApi from "../Services/activityTrackerApi";
import { RotateCcw } from "lucide-react";
import { addComment } from "../Modules/Assignee/AssigneeHelper";
import CommentsActionDialog from "../Modules/Assignee/CommentsActionDialog";
import { Star } from "lucide-react";
import FeedbackModal from "./FeedbackModal";
import GanttView from "./GanttView";
import ProjectUpdatesView from "./ProjectUpdatesView";
import { getUserData } from "../Modules/Login/Encrypt";
import CoAssignerModal from "./CoAssignerModal";
import { useTheme } from "./useTheme";
import { Sun, Moon } from "lucide-react";
import {
  computeProjectRole,
  canEditProject,
  canManageCoAssigners,
  canDeleteProject,
  canAccessActivitiesTab,
  canAccessGanttTab,
  computeProjectAccess,
} from "./coAssignerHelpers";
import * as sharingApi from "./sharingApi";
import { Handshake, Crown } from "lucide-react";
/* ─── Constants ─── */

/* ─── Status Config Factory (theme-aware) ─── */
function makeStatusConfig(t) {
  return {
    pending: {
      label: "Pending",
      Icon: Clock,
      bg: t.bgSubtle,
      color: t.textMuted,
      border: t.border,
    },
    "not ready": {
      label: "Not Ready",
      Icon: AlertCircle,
      bg: t.warningBg,
      color: t.warning,
      border: t.warningBorder,
    },
    rejected: {
      label: "Rejected",
      Icon: XCircle,
      bg: t.dangerBg,
      color: t.danger,
      border: t.dangerBorder,
    },
    paused: {
      label: "Paused",
      Icon: PauseCircle,
      bg: "#FFEDD5", // Orange — kept as-is (semantic)
      color: "#C2410C",
      border: "#FDBA74",
    },
    running: {
      label: "Running",
      Icon: PlayCircle,
      bg: t.primaryBg,
      color: t.primary,
      border: t.primaryBorder,
      pulse: true,
    },
    completed: {
      label: "Completed",
      Icon: CheckCircle2,
      bg: t.successBg,
      color: t.success,
      border: t.successBorder,
    },
    loading: {
      label: "Loading",
      Icon: Loader2,
      bg: t.violetBg,
      color: t.violet,
      border: t.violetBorder,
      spin: true,
    },
    finished: {
      label: "Finished",
      Icon: ShieldCheck,
      bg: t.successBgSubtle,
      color: t.success,
      border: t.successBorder,
    },
    closed: {
      label: "Closed",
      Icon: XCircle,
      bg: t.closedBg,
      color: t.closedText,
      border: t.closedBorder,
    },
  };
}

/* ─── Themed status config lookup ─── */
function getStatusConfig(status, t) {
  const CONFIG = makeStatusConfig(t);
  if (!status) return CONFIG.pending;
  const key = String(status).toLowerCase().trim();
  return (
    CONFIG[key] || {
      label: status,
      Icon: HelpCircle,
      bg: t.bgMuted,
      color: t.textFaint,
      border: t.border,
    }
  );
}
function SpinningIcon({
  Icon = Loader2,
  size = 14,
  color = "#1D4ED8",
  duration = 1000,
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let frame;
    let start = performance.now();
    const animate = (now) => {
      const elapsed = (now - start) % duration;
      setRotation((elapsed / duration) * 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return (
    <Icon
      size={size}
      color={color}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: "none",
      }}
    />
  );
}

/* ─── Pulsing Icon (replaces CSS @keyframes pulse) ─── */
function PulsingIcon({
  Icon = PlayCircle,
  size = 11,
  color = "#1D4ED8",
  duration = 1500,
}) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let frame;
    let start = performance.now();
    const animate = (now) => {
      const elapsed = (now - start) % duration;
      const progress = elapsed / duration;
      // Smooth sine wave: 1 → 0.4 → 1
      const value = 0.7 + 0.3 * Math.cos(progress * Math.PI * 2);
      setOpacity(value);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return (
    <Icon size={size} color={color} strokeWidth={2.5} style={{ opacity }} />
  );
}
function generateProjectId() {
  return `prj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
const WORK_START_HR = 10;
const WORK_END_HR = 18;

/* ─── Group Helpers ─── */

function getGroupName(groupId, groupLabels) {
  return groupLabels.find((g) => g.groupId === groupId)?.groupName || groupId;
}

function getActiveGroups(groupLabels) {
  return groupLabels.filter((g) => g.active);
}

/* ─── Ensure moduleId for a moduleName (creates if new) ─── */
function ensureModuleId(moduleName, registry) {
  const name = (moduleName || "").trim();
  if (!name) return { moduleId: "", registry };

  if (registry[name]) {
    return { moduleId: registry[name], registry };
  }

  const newId = generateModuleId();
  return {
    moduleId: newId,
    registry: { ...registry, [name]: newId },
  };
}
/* ─── Sync entire rows with the registry (rebuild from scratch) ─── */
function syncModuleIds(rows, existingRegistry = {}) {
  let registry = { ...existingRegistry };

  // First pass: ensure every unique non-empty moduleName has an id
  rows.forEach((r) => {
    const name = (r.module || "").trim();
    if (name && !registry[name]) {
      registry[name] = generateModuleId();
    }
  });

  // Second pass: assign moduleId to each row
  const updatedRows = rows.map((r) => {
    const name = (r.module || "").trim();
    return {
      ...r,
      moduleId: name ? registry[name] : "",
    };
  });

  // Clean up registry: remove entries for modules no longer present
  const activeNames = new Set(
    rows.map((r) => (r.module || "").trim()).filter(Boolean),
  );
  const cleanedRegistry = {};
  Object.entries(registry).forEach(([name, id]) => {
    if (activeNames.has(name)) cleanedRegistry[name] = id;
  });

  return { rows: updatedRows, registry: cleanedRegistry };
}
function generateModuleId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `mod_${crypto.randomUUID().slice(0, 12)}`;
  }
  return `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
/* ─── Unique ID Generator ─── */
function generateRowId() {
  // Use native crypto.randomUUID (all modern browsers + Node 19+)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
/* ─── Date utilities ─── */
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoDateTime(d) {
  return `${isoDate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function parseISODateTime(s) {
  if (!s) return null;
  const norm = s.replace(" ", "T");
  const m = norm.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4] || WORK_START_HR),
    Number(m[5] || 0),
    0,
    0,
  );
}
function fmtDisplay(d) {
  if (!d) return "";
  if (typeof d === "string") d = parseISODateTime(d);
  if (!(d instanceof Date) || isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${mn}`;
}
/* ─── Status utilities ─── */
function isPending(row) {
  return (
    String(row.status || "pending")
      .toLowerCase()
      .trim() === "pending"
  );
}
function isWeekday(d) {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}
function getResourceByUserId(userId, groups, groupResources) {
  if (!userId || !groupResources) return null;
  return (
    getResources(groups, groupResources).find((r) => r.userId === userId) ||
    null
  );
}
function leavesFor(userId, groupResources) {
  if (!userId || !groupResources || typeof groupResources !== "object")
    return [];

  for (const g of Object.keys(groupResources)) {
    const r = groupResources[g]?.find((x) => x.userId === userId);
    if (r) return r.leaves || [];
  }
  return [];
}
function leaveOnDay(userId, d, groupResources) {
  if (!userId || !d) return null;
  const key = isoDate(d);
  return leavesFor(userId, groupResources).find((l) => l.date === key) || null;
}
function nextWorkMoment(dt, userId, groupResources = {}) {
  let d = new Date(dt);
  for (let i = 0; i < 730; i++) {
    if (!isWeekday(d)) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    if (leaveOnDay(userId, d, groupResources)) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    const hr = d.getHours() + d.getMinutes() / 60;
    if (hr < WORK_START_HR) {
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    // ── FIX: >= instead of > ──
    if (hr >= WORK_END_HR) {
      // ← CHANGED from > to >=
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    return d;
  }
  return d;
}
function addWorkHours(startDt, hours, userId, groupResources = {}) {
  let d = nextWorkMoment(new Date(startDt), userId, groupResources);
  let remaining = Number(hours) || 0;
  if (remaining <= 0) return d;
  for (let i = 0; i < 730 && remaining > 0; i++) {
    const hr = d.getHours() + d.getMinutes() / 60;
    const avail = WORK_END_HR - hr;
    if (avail <= 0) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      d = nextWorkMoment(d, userId, groupResources);
      continue;
    }
    if (remaining <= avail + 1e-9) {
      d = new Date(d.getTime() + Math.round(remaining * 60) * 60000);
      remaining = 0;
    } else {
      remaining -= avail;
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      d = nextWorkMoment(d, userId, groupResources);
    }
  }
  return d;
}
// function defaultFirstStart(userId, groupResources) {
//   return nextWorkMoment(
//     new Date(),
//     userId,
//     groupResources,
//   );
// }
function defaultFirstStart(userId, groupResources = {}) {
  const now = new Date();
  const hr = now.getHours() + now.getMinutes() / 60;

  let baseDate;

  if (hr < WORK_START_HR) {
    // Before work hours today → start today at WORK_START_HR
    baseDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      WORK_START_HR,
      0,
      0,
      0,
    );
  } else if (hr > WORK_END_HR) {
    // After work hours → start tomorrow at WORK_START_HR
    baseDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      WORK_START_HR,
      0,
      0,
      0,
    );
  } else {
    // During work hours → round up to next 15-min mark
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    baseDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      roundedMinutes,
      0,
      0,
    );

    // If rounding pushed past WORK_END_HR, move to tomorrow
    if (baseDate.getHours() >= WORK_END_HR) {
      baseDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        WORK_START_HR,
        0,
        0,
        0,
      );
    }
  }

  // nextWorkMoment will handle weekends/leaves
  return nextWorkMoment(baseDate, userId, groupResources);
}
/* ─── Auto Chain Computation (per-resource sequential) ─── */
function recomputeAutoChains(rows, groupResources = {}) {
  const updated = rows.map((r) => ({ ...r }));
  const byId = new Map(updated.map((r) => [r.id, r]));

  // ── Build parent → children map ──
  const childrenMap = new Map();
  updated.forEach((r) => {
    const pid = r.parentId || "__ROOT__";
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(r);
  });

  const getChildren = (id) => childrenMap.get(id) || [];

  // ── 1. Flatten rows in visible order (top → bottom, parents then children) ──
  const ordered = flattenOrdered(updated);

  // ── 2. Reset _isAnchor and _autoChained flags ──
  updated.forEach((r) => {
    r._isAnchor = false;
    r._autoChained = false;
  });

  // ── 3. Group rows by resource (skip parents with children, skip non-pending) ──
  const byResource = new Map();
  const orderedIds = ordered.map((r) => r.id);

  orderedIds.forEach((id) => {
    const r = byId.get(id);
    if (!r || !r.resource) return;
    if (getChildren(r.id).length > 0) return; // skip parents
    if (!isPending(r)) return;

    if (!byResource.has(r.resource)) byResource.set(r.resource, []);
    byResource.get(r.resource).push(r);
  });

  const warnings = [];

  // ── 4. Chain each resource ──
  byResource.forEach((chain, userId) => {
    if (chain.length === 0) return;

    const anchor = chain[0];
    anchor._isAnchor = true;

    if (!anchor.plannedStart) {
      warnings.push({
        userId,
        taskName: anchor.task || anchor.module || "Untitled",
      });
      return; // skip this resource entirely
    }

    // Anchor: keep user's plannedStart, compute stop from duration
    const anchorStart = parseISODateTime(anchor.plannedStart);
    const anchorDur = Number(anchor.durationHrs);
    const hasAnchorDur =
      anchor.durationHrs !== "" &&
      anchor.durationHrs !== null &&
      anchor.durationHrs !== undefined &&
      !isNaN(anchorDur);

    if (hasAnchorDur && anchorDur > 0) {
      const stop = addWorkHours(anchorStart, anchorDur, userId, groupResources);
      anchor.plannedStop = isoDateTime(stop);
    } else if (hasAnchorDur && anchorDur === 0) {
      anchor.plannedStop = isoDateTime(anchorStart);
    } else {
      anchor.plannedStop = "";
    }

    let prevEnd = anchor.plannedStop
      ? parseISODateTime(anchor.plannedStop)
      : null;

    // Chain the rest
    for (let i = 1; i < chain.length; i++) {
      const row = chain[i];
      row._autoChained = true;

      if (!prevEnd) {
        row.plannedStart = "";
        row.plannedStop = "";
        continue;
      }

      const start = nextWorkMoment(new Date(prevEnd), userId, groupResources);
      row.plannedStart = isoDateTime(start);

      const dur = Number(row.durationHrs);
      const hasDur =
        row.durationHrs !== "" &&
        row.durationHrs !== null &&
        row.durationHrs !== undefined &&
        !isNaN(dur);

      if (hasDur && dur > 0) {
        const stop = addWorkHours(start, dur, userId, groupResources);
        row.plannedStop = isoDateTime(stop);
        prevEnd = stop;
      } else if (hasDur && dur === 0) {
        row.plannedStop = row.plannedStart;
        prevEnd = start;
      } else {
        row.plannedStop = "";
        prevEnd = start;
      }
    }
  });

  // ── 5. Recompute parent rows from children (same as original) ──
  const parentIds = Array.from(childrenMap.keys()).filter(
    (k) => k !== "__ROOT__",
  );
  for (const pid of parentIds) {
    const parent = byId.get(pid);
    if (!parent || !isPending(parent)) continue;

    const children = getChildren(pid);
    const intervals = [];
    const resourcesSet = new Set();

    for (const c of children) {
      if (!c.plannedStart || !c.plannedStop) continue;
      const s = parseISODateTime(c.plannedStart);
      const e = parseISODateTime(c.plannedStop);
      if (!s || !e) continue;
      if (e.getTime() <= s.getTime()) continue;
      intervals.push({
        start: s.getTime(),
        end: e.getTime(),
        resource: c.resource || "",
      });
      resourcesSet.add(c.resource || "");
    }

    if (intervals.length === 0) {
      parent._autoDuration = false;
      continue;
    }

    parent.plannedStart = isoDateTime(
      new Date(Math.min(...intervals.map((i) => i.start))),
    );
    parent.plannedStop = isoDateTime(
      new Date(Math.max(...intervals.map((i) => i.end))),
    );

    let parentMs = 0;
    if (resourcesSet.size === 1) {
      for (const it of intervals) parentMs += it.end - it.start;
    } else {
      const sorted = intervals
        .map((i) => ({ s: i.start, e: i.end }))
        .sort((a, b) => a.s - b.s);
      let curS = sorted[0].s;
      let curE = sorted[0].e;
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.s <= curE) curE = Math.max(curE, it.e);
        else {
          parentMs += curE - curS;
          curS = it.s;
          curE = it.e;
        }
      }
      parentMs += curE - curS;
    }

    parent.durationHrs = Math.round((parentMs / (1000 * 60 * 60)) * 100) / 100;
    parent._autoDuration = true;
  }

  return { rows: updated, warnings };
}

/* ─── Chain computation ─── */
function recomputeChains(rows, groupResources = {}) {
  const updated = rows.map((r) => ({ ...r }));
  const byId = new Map(updated.map((r) => [r.id, r]));

  // ── Build parent → children map ──
  const childrenMap = new Map();
  updated.forEach((r) => {
    const pid = r.parentId || "__ROOT__";
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(r);
  });

  const getChildren = (id) => childrenMap.get(id) || [];

  // ── STEP 1: Process top-level rows (module-scoped chains) ──
  const topRows = childrenMap.get("__ROOT__") || [];
  const chains = new Map();

  topRows.forEach((row) => {
    // Skip auto-scheduling for parent rows (those with children)
    if (getChildren(row.id).length > 0) return;
    // ── SKIP non-pending rows entirely ──
    if (!isPending(row)) return;
    if (!row.resource) return;
    const moduleKey = row.moduleId || row.module || "__no_module__";
    const chainKey = `${moduleKey}|${row.resource}`;
    if (!chains.has(chainKey)) chains.set(chainKey, []);
    chains.get(chainKey).push(row);
  });

  chains.forEach((chainRows, chainKey) => {
    const [, userId] = chainKey.split("|");
    let prevEnd = null;

    chainRows.forEach((row, idx) => {
      const realRow = byId.get(row.id);

      // ── SKIP non-pending rows — preserve their values ──
      if (!isPending(realRow)) return;

      const dur = Number(realRow.durationHrs);

      const hasValidDuration =
        realRow.durationHrs !== "" &&
        realRow.durationHrs !== null &&
        realRow.durationHrs !== undefined &&
        !isNaN(Number(realRow.durationHrs));

      let start;

      // ── Every row: respect user-set plannedStart if present ──
      const userStart = realRow.plannedStart
        ? parseISODateTime(realRow.plannedStart)
        : null;

      if (userStart) {
        start = nextWorkMoment(userStart, userId, groupResources);
      } else if (idx === 0) {
        realRow.plannedStart = "";
        realRow.plannedStop = "";
        prevEnd = null;
        return;
      } else {
        if (!prevEnd) {
          realRow.plannedStart = "";
          realRow.plannedStop = "";
          return;
        }
        start = nextWorkMoment(new Date(prevEnd), userId, groupResources);
      }

      realRow.plannedStart = isoDateTime(start);

      if (hasValidDuration) {
        if (dur === 0) {
          realRow.plannedStop = isoDateTime(start);
          prevEnd = start;
        } else {
          const end = addWorkHours(start, dur, userId, groupResources);
          realRow.plannedStop = isoDateTime(end);
          prevEnd = end;
        }
      } else {
        realRow.plannedStop = "";
        prevEnd = start;
      }
    });
  });

  // ── STEP 2: Process sub-tasks ──
  const processChildren = (parentId) => {
    const parent = byId.get(parentId);
    if (!parent) return;

    const children = getChildren(parentId);
    if (children.length === 0) return;

    children.forEach((child) => {
      const realChild = byId.get(child.id);

      // ── SKIP non-pending sub-tasks — preserve their values ──
      if (!isPending(realChild)) {
        processChildren(realChild.id);
        return;
      }

      const dur = Number(realChild.durationHrs);

      const hasValidDuration =
        realChild.durationHrs !== "" &&
        realChild.durationHrs !== null &&
        realChild.durationHrs !== undefined &&
        !isNaN(Number(realChild.durationHrs));

      if (realChild.plannedStart && hasValidDuration) {
        const start = parseISODateTime(realChild.plannedStart);
        if (start) {
          let end;
          if (dur === 0) {
            end = new Date(start);
          } else {
            end = new Date(start.getTime() + dur * 60 * 60 * 1000);
          }
          realChild.plannedStop = isoDateTime(end);
        }
      } else {
        realChild.plannedStop = "";
      }

      // Recurse into deeper sub-tasks
      processChildren(realChild.id);
    });
  };

  topRows.forEach((row) => processChildren(row.id));

  // ── STEP 3: Compute parent durations from children ──
  const parentIds = Array.from(childrenMap.keys()).filter(
    (k) => k !== "__ROOT__",
  );

  for (const pid of parentIds) {
    const parent = byId.get(pid);
    if (!parent) continue;

    // ── SKIP non-pending parents — preserve their values ──
    if (!isPending(parent)) continue;

    const children = getChildren(pid);
    const intervals = [];
    const resourcesSet = new Set();

    for (const c of children) {
      const realChild = byId.get(c.id);
      if (!realChild) continue;
      if (!realChild.plannedStart || !realChild.plannedStop) continue;
      const s = parseISODateTime(realChild.plannedStart);
      const e = parseISODateTime(realChild.plannedStop);
      if (!s || !e) continue;
      const startMs = s.getTime();
      const endMs = e.getTime();
      if (endMs <= startMs) continue; // zero or invalid
      intervals.push({
        start: startMs,
        end: endMs,
        resource: realChild.resource || "",
      });
      resourcesSet.add(realChild.resource || "");
    }

    // ── No timed children (all 0-duration or no valid intervals) ──
    // Allow manual editing — DON'T clear parent values
    if (intervals.length === 0) {
      parent._autoDuration = false;
      continue;
    }

    // ── Calculate parent timing from sub-tasks ──
    const minStart = Math.min(...intervals.map((i) => i.start));
    parent.plannedStart = isoDateTime(new Date(minStart));

    const maxEnd = Math.max(...intervals.map((i) => i.end));
    parent.plannedStop = isoDateTime(new Date(maxEnd));

    // ── Calculate parent duration ──
    let parentMs = 0;
    if (resourcesSet.size === 1) {
      for (const it of intervals) parentMs += it.end - it.start;
    } else {
      const sorted = intervals
        .map((i) => ({ s: i.start, e: i.end }))
        .sort((a, b) => a.s - b.s);
      let curS = sorted[0].s;
      let curE = sorted[0].e;
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.s <= curE) {
          curE = Math.max(curE, it.e);
        } else {
          parentMs += curE - curS;
          curS = it.s;
          curE = it.e;
        }
      }
      parentMs += curE - curS;
    }

    const hours = Math.round((parentMs / (1000 * 60 * 60)) * 100) / 100;
    parent.durationHrs = hours;
    parent._autoDuration = true;
  }

  return updated;
}

/* ─── Recursive tree flattening ─── */
function flattenOrdered(rows, { withDepth = true } = {}) {
  const out = [];
  const childrenMap = new Map();

  rows.forEach((r) => {
    const key = r.parentId || "ROOT";
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key).push(r);
  });

  const walk = (parentKey, depth) => {
    const children = childrenMap.get(parentKey) || [];
    children.forEach((node) => {
      // Keep original reference; only attach depth when requested
      if (withDepth) {
        out.push(Object.assign(node, { sortOrder: depth }));
      } else {
        out.push(node);
      }
      walk(node.id, depth + 1);
    });
  };

  walk("ROOT", 0);

  // Catch orphans
  rows.forEach((r) => {
    if (!out.find((x) => x.id === r.id)) {
      if (withDepth) r.sortOrder = 0;
      out.push(r);
    }
  });

  return out;
}

/* ─── Resource helpers ─── */
function getResources(groups, groupResources) {
  if (!groupResources || typeof groupResources !== "object") return [];

  const seen = new Set();
  const out = [];

  groups.forEach((g) => {
    const groupArr = groupResources[g];
    if (!Array.isArray(groupArr)) return;

    groupArr.forEach((r) => {
      // Guard: must have a valid string userId
      if (!r || typeof r.userId !== "string" || r.userId.length === 0) {
        console.warn("Skipping invalid resource:", r);
        return;
      }

      // Dedupe
      if (seen.has(r.userId)) return;
      seen.add(r.userId);
      out.push(r);
    });
  });

  return out;
}
// function getResourceByCode(code, groups) {
//   return getResources(groups).find((r) => r.code === code);
// }

/* ─── Validation ─── */
function runValidations(
  rows,
  project,
  po,
  site,
  groups,
  groupResources,
  projectStatus = "draft",
) {
  const results = [];
  const warnings = []; // ← NEW: separate warnings array

  // ── 1. Project Metadata (ERROR) ──
  const metaMissing = [];
  if (!project.trim()) metaMissing.push("Project Name");
  if (!po.trim()) metaMissing.push("PO No");
  if (!site.trim()) metaMissing.push("Site / Customer");
  if (!groups.length) metaMissing.push("Group");
  results.push({
    ok: metaMissing.length === 0,
    title:
      metaMissing.length === 0
        ? "Project metadata complete"
        : "Project metadata incomplete",
    detail:
      metaMissing.length === 0
        ? "Project, PO, Site and Group are all set."
        : `Missing: ${metaMissing.join(", ")}`,
  });

  // ── 2. Activities Loaded (ERROR) ──
  results.push({
    ok: rows.length > 0,
    title:
      rows.length > 0 ? `${rows.length} activities loaded` : "No activities",
    detail:
      rows.length > 0 ? "" : "Upload an Excel sheet or add rows manually.",
  });

  // ── 3. Scheduling Info (ERROR) ──
  const incomplete = rows.filter((r) => {
    const hasDuration =
      r.durationHrs !== "" &&
      r.durationHrs !== null &&
      r.durationHrs !== undefined &&
      !isNaN(Number(r.durationHrs));
    return !r.resource || !hasDuration || !r.plannedStart;
  });
  results.push({
    ok: incomplete.length === 0,
    title:
      incomplete.length === 0
        ? "All rows fully scheduled"
        : `${incomplete.length} row${incomplete.length !== 1 ? "s" : ""} missing scheduling info`,
    detail:
      incomplete.length === 0
        ? "Resource, start datetime and duration set on every row."
        : "Each row needs a resource, planned start, and duration.",
  });

  // ── 4. Resource Overlaps ──
  //    BLOCK if BOTH overlapping tasks are PENDING
  //    WARN only if AT LEAST ONE task is pending (the other can be anything)
  //    SKIP completely if NEITHER task is pending (purely historical overlap)
  const pendingOverlaps = [];
  const mixedOverlaps = []; // ← Renamed: pending + non-pending
  const byRes = {};

  rows.forEach((r) => {
    if (r.resource && r.plannedStart && r.plannedStop) {
      (byRes[r.resource] = byRes[r.resource] || []).push(r);
    }
  });

  const isParentSubPair = (a, b) => a.parentId === b.id || b.parentId === a.id;

  Object.entries(byRes).forEach(([userId, arr]) => {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];

        // ✅ Skip parent ⇄ sub-task overlap check
        if (isParentSubPair(a, b)) continue;

        if (a.plannedStart < b.plannedStop && b.plannedStart < a.plannedStop) {
          const aPending = isPending(a);
          const bPending = isPending(b);

          // ✅ Skip entirely if NEITHER is pending
          if (!aPending && !bPending) continue;

          const resObj = getResourceByUserId(userId, groups, groupResources);
          const overlapInfo = {
            resource: resObj?.name || userId,
            task1: a.task || `Row #${a.id}`,
            task2: b.task || `Row #${b.id}`,
            status1: a.status || "pending",
            status2: b.status || "pending",
          };

          if (
            a.plannedStart < b.plannedStop &&
            b.plannedStart < a.plannedStop
          ) {
            const aPending = isPending(a);
            const bPending = isPending(b);

            // Skip entirely if NEITHER is pending
            if (!aPending && !bPending) continue;

            const resObj = getResourceByUserId(userId, groups, groupResources);
            const overlapInfo = {
              resource: resObj?.name || userId,
              task1: a.task || `Row #${a.id}`,
              task2: b.task || `Row #${b.id}`,
              status1: a.status || "pending",
              status2: b.status || "pending",
              rowId1: a.id, // ← ADD THIS
              rowId2: b.id, // ← ADD THIS
            };

            if (aPending && bPending) {
              pendingOverlaps.push(overlapInfo);
            } else {
              mixedOverlaps.push(overlapInfo);
            }
          }
        }
      }
    }
  });
  // ⚠️ WARNING: Pending tasks overlap each other — can proceed with acknowledgment
  if (pendingOverlaps.length > 0) {
    warnings.push({
      title: `${pendingOverlaps.length} pending task overlap${pendingOverlaps.length !== 1 ? "s" : ""} detected`,
      detail:
        pendingOverlaps
          .slice(0, 5)
          .map((o) => `• ${o.resource}: "${o.task1}" ⇄ "${o.task2}"`)
          .join("\n") +
        (pendingOverlaps.length > 5
          ? `\n…and ${pendingOverlaps.length - 5} more`
          : "") +
        "\n\nOverlapping tasks may cause scheduling conflicts. Review and adjust if needed.",
    });
  }

  // ⚠️ WARNING: Pending overlapping with active/completed tasks
  if (mixedOverlaps.length > 0) {
    warnings.push({
      title: `${mixedOverlaps.length} pending task${mixedOverlaps.length !== 1 ? "s" : ""} overlap${mixedOverlaps.length !== 1 ? "" : "s"} with active work`,
      detail:
        mixedOverlaps
          .slice(0, 5)
          .map(
            (o) =>
              `• ${o.resource}: "${o.task1}" (${o.status1}) ⇄ "${o.task2}" (${o.status2})`,
          )
          .join("\n") +
        (mixedOverlaps.length > 5
          ? `\n…and ${mixedOverlaps.length - 5} more`
          : ""),
    });
  }
  // ✅ SUCCESS indicator (only for the "clean" case)
  if (pendingOverlaps.length === 0) {
    results.push({
      ok: true,
      title: "No pending task overlaps",
      detail: "Pending tasks for each resource are sequenced cleanly.",
    });
  }
  // If overlaps exist, don't add to results (only add to warnings)
  // ── 5. Weekend Stop Check (ERROR) ──
  let badTime = false;
  rows.forEach((r) => {
    if (r.plannedStop) {
      const d = parseISODateTime(r.plannedStop);
      if (d && (d.getDay() === 0 || d.getDay() === 6)) badTime = true;
    }
  });
  results.push({
    ok: !badTime,
    title: !badTime
      ? "All stops within working calendar"
      : "Stop falls on weekend",
    detail: !badTime
      ? "Stops skip weekends and leaves."
      : "A computed stop date is on a non-working day.",
  });

  // ── 7. Sub-task overflow check (WARNING) ──
  const overflowSubs = [];

  rows.forEach((r) => {
    // use `rows` if `updated` not in scope
    if (!r.parentId) return;
    if (!r.plannedStart || !r.plannedStop) return;

    const parent = rows.find((p) => p.id === r.parentId);
    if (!parent || !parent.plannedStart || !parent.plannedStop) return;

    const subStart = parseISODateTime(r.plannedStart);
    const subStop = parseISODateTime(r.plannedStop);
    const parStart = parseISODateTime(parent.plannedStart);
    const parStop = parseISODateTime(parent.plannedStop);

    if (subStart < parStart || subStop > parStop) {
      overflowSubs.push({
        sub: r.task || `Row #${r.id}`,
        parent: parent.task || `Row #${parent.id}`,
      });
    }
  });

  // ── Sub-task overflow check (BLOCKING ERROR) ──

  rows.forEach((r) => {
    if (!r.parentId) return;
    if (!r.plannedStart || !r.plannedStop) return;

    const parent = rows.find((p) => p.id === r.parentId);
    if (!parent || !parent.plannedStart || !parent.plannedStop) return;

    const subStart = parseISODateTime(r.plannedStart);
    const subStop = parseISODateTime(r.plannedStop);
    const parStart = parseISODateTime(parent.plannedStart);
    const parStop = parseISODateTime(parent.plannedStop);

    // Allow small tolerance (1 minute) for rounding
    const tolerance = 60 * 1000;

    if (
      subStart.getTime() < parStart.getTime() - tolerance ||
      subStop.getTime() > parStop.getTime() + tolerance
    ) {
      overflowSubs.push({
        sub: r.task || `Row #${r.id}`,
        parent: parent.task || `Row #${parent.id}`,
      });
    }
  });

  results.push({
    ok: overflowSubs.length === 0,
    title:
      overflowSubs.length === 0
        ? "Sub-tasks fit within parent windows"
        : `${overflowSubs.length} sub-task${overflowSubs.length !== 1 ? "s exceed" : " exceeds"} parent window`,
    detail:
      overflowSubs.length === 0
        ? "All sub-tasks are bounded by their parent task times."
        : `Reduce these sub-task durations:\n${overflowSubs
            .slice(0, 5)
            .map((o) => `• "${o.sub}" — exceeds parent "${o.parent}"`)
            .join(
              "\n",
            )}${overflowSubs.length > 5 ? `\n…and ${overflowSubs.length - 5} more` : ""}`,
  });

  // ── 6. Past Date Check ──
  //    Only check for DRAFT projects
  //    Skip entirely for published/closed projects (work is already ongoing)
  const isDraftProject = !projectStatus || projectStatus === "draft";

  if (isDraftProject) {
    const now = new Date();
    const pendingPastRows = [];

    rows.forEach((r, idx) => {
      if (!r.plannedStart) return;
      const startDt = parseISODateTime(r.plannedStart);
      if (!startDt || startDt >= now) return;

      const status = String(r.status || "pending")
        .toLowerCase()
        .trim();

      // Only flag pending tasks — skip everything else
      if (status !== "pending") return;

      pendingPastRows.push({
        idx: idx + 1,
        task: r.task || r.module || `Row #${idx + 1}`,
        start: fmtDisplay(startDt),
        status: r.status || "pending",
      });
    });

    // ❌ ERROR: Pending tasks in the past — must fix (draft only)
    results.push({
      ok: pendingPastRows.length === 0,
      title:
        pendingPastRows.length === 0
          ? "All pending tasks have future start times"
          : `${pendingPastRows.length} pending task${pendingPastRows.length !== 1 ? "s have" : " has"} a past start time`,
      detail:
        pendingPastRows.length === 0
          ? "Pending tasks are scheduled in the future."
          : `These pending tasks must be rescheduled:\n${pendingPastRows
              .slice(0, 5)
              .map((r) => `• "${r.task}" — ${r.start}`)
              .join(
                "\n",
              )}${pendingPastRows.length > 5 ? `\n…and ${pendingPastRows.length - 5} more` : ""}`,
    });
  }
  // For non-draft projects: skip past-date check entirely

  // ── REMOVED: Non-pending past start warning ──
  // No warning for running/completed/paused tasks with past start times

  // ✅ Return BOTH arrays
  // ── Collect all overlapping row IDs ──
  const overlapIds = new Set();
  pendingOverlaps.forEach((o) => {
    overlapIds.add(o.rowId1);
    overlapIds.add(o.rowId2);
  });
  mixedOverlaps.forEach((o) => {
    overlapIds.add(o.rowId1);
    overlapIds.add(o.rowId2);
  });
  return { results, warnings, overlapIds };
}

/* ─── Toast ─── */
function Toast({ toasts, onDismiss }) {
  const { t } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 340,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background:
              toast.kind === "success"
                ? t.successBgSubtle
                : toast.kind === "error"
                  ? t.dangerBgSubtle
                  : t.primaryBgSubtle,
            border: `1px solid ${
              toast.kind === "success"
                ? t.successBorder
                : toast.kind === "error"
                  ? t.dangerBorder
                  : t.primaryBorder
            }`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: t.shadowMd,
            fontFamily: "Sora,sans-serif",
            fontSize: 12,
          }}
        >
          <span
            style={{
              fontSize: 15,
              marginTop: 1,
              color:
                toast.kind === "success"
                  ? t.success
                  : toast.kind === "error"
                    ? t.danger
                    : t.primary,
            }}
          >
            {toast.kind === "success" ? (
              <CheckCircle2 size={16} color={t.success} />
            ) : toast.kind === "error" ? (
              <AlertOctagon size={16} color={t.danger} />
            ) : (
              <Info size={16} color={t.primary} />
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: t.textPrimary }}>
              {toast.title}
            </div>
            {toast.msg && (
              <div
                style={{
                  marginTop: 2,
                  color: t.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {toast.msg}
              </div>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              fontSize: 13,
              padding: "0 2px",
              lineHeight: 1,
            }}
          >
            <X size={13} color={t.textFaint} />
          </button>
        </div>
      ))}
    </div>
  );
}
/* ─── Resource chip ─── */
const TONE_COLORS = {
  1: { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" }, // Blue
  2: { bg: "#EDE9FE", color: "#7C3AED", border: "#C4B5FD" }, // Violet
  3: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" }, // Green
  4: { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" }, // Amber
  5: { bg: "#CCFBF1", color: "#0F766E", border: "#5EEAD4" }, // Teal
  6: { bg: "#FCE7F3", color: "#BE185D", border: "#F9A8D4" }, // Pink
  7: { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" }, // Red
  8: { bg: "#E0F2FE", color: "#0369A1", border: "#7DD3FC" }, // Sky
  9: { bg: "#ECFCCB", color: "#4D7C0F", border: "#BEF264" }, // Lime
  10: { bg: "#F3E8FF", color: "#9333EA", border: "#D8B4FE" }, // Purple
  empty: { bg: "#F1F5F9", color: "#94A3B8", border: "#CBD5E1" },
};
function ResChip({ code, tone, name, userId }) {
  const { t } = useTheme();

  const TONE_COLORS = {
    1: { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
    2: { bg: "#EDE9FE", color: "#7C3AED", border: "#C4B5FD" },
    3: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
    4: { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" },
    5: { bg: "#CCFBF1", color: "#0F766E", border: "#5EEAD4" },
    6: { bg: "#FCE7F3", color: "#BE185D", border: "#F9A8D4" },
    7: { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" },
    8: { bg: "#E0F2FE", color: "#0369A1", border: "#7DD3FC" },
    9: { bg: "#ECFCCB", color: "#4D7C0F", border: "#BEF264" },
    10: { bg: "#F3E8FF", color: "#9333EA", border: "#D8B4FE" },
    empty: { bg: t.bgMuted, color: t.textFaint, border: t.borderStrong },
  };

  const c = TONE_COLORS[tone] || TONE_COLORS.empty;
  const title = [name, userId].filter(Boolean).join(" — ");
  const isEmpty = !code || code === "?";

  return (
    <span
      title={title || "No resource assigned"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: c.bg,
        color: c.color,
        border: `1.5px solid ${c.border}`,
        fontSize: 9,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: "Sora,sans-serif",
        cursor: title ? "help" : "default",
      }}
    >
      {isEmpty ? <UserX size={12} strokeWidth={2.5} /> : code}
    </span>
  );
}

/* ─── Comments Modal ─── */
function CommentsModal({ row, onClose, onUpdate }) {
  const { t } = useTheme();
  const labelStyle = makeLabelStyle(t);
  const inputStyle = makeInputStyle(t);
  const btnStyle = makeBtnStyle(t);

  const [desc, setDesc] = useState("");
  const [action, setAction] = useState("");
  const [resDate, setResDate] = useState("");
  const [respGW, setRespGW] = useState(false);
  const [respCust, setRespCust] = useState(false);
  const [others, setOthers] = useState("");

  const handleAdd = () => {
    if (!desc.trim()) return;
    const newComment = {
      sno: (row.comments || []).length + 1,
      description: desc.trim(),
      actionPoint: action.trim(),
      resolutionDate: resDate,
      responsibility: [respGW && "GW", respCust && "Customer"].filter(Boolean),
      others: others.trim(),
      attachments: [],
      author: "You",
      time: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      replies: [],
    };
    onUpdate({ ...row, comments: [...(row.comments || []), newComment] });
    setDesc("");
    setAction("");
    setResDate("");
    setRespGW(false);
    setRespCust(false);
    setOthers("");
  };

  const deleteComment = (idx) => {
    const updated = (row.comments || []).filter((_, i) => i !== idx);
    onUpdate({ ...row, comments: updated });
  };

  const fmtDate = (s) => {
    if (!s) return "—";
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: t.shadowXl,
          fontFamily: "Sora,sans-serif",
          overflow: "hidden",
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: t.primaryBg,
              color: t.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            💬
          </div>
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Comments & Action Points
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>
              {row.task || row.module || `Activity #${row.id}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {!(row.comments || []).length ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: t.textFaint,
                fontSize: 12,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>💭</div>
              No entries yet — add the first entry below.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11.5,
              }}
            >
              <thead>
                <tr style={{ background: t.bgSubtle }}>
                  {[
                    "#",
                    "Description",
                    "Action Point",
                    "Resolution Date",
                    "Responsibility",
                    "Others",
                    "Added",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                        fontSize: 10,
                        letterSpacing: "0.4px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(row.comments || []).map((c, i) => (
                  <tr
                    key={i}
                    style={{
                      borderLeft: `3px solid ${i % 2 === 0 ? t.primary : t.violet}`,
                      borderBottom: `1px solid ${t.borderSubtle}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 10px",
                        color: t.textFaint,
                        fontWeight: 600,
                      }}
                    >
                      {c.sno || i + 1}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        maxWidth: 180,
                        color: t.textPrimary,
                      }}
                    >
                      {c.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        maxWidth: 160,
                        color: t.textSecondary,
                      }}
                    >
                      {c.actionPoint || (
                        <span style={{ color: t.textDisabled }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        color: t.textSecondary,
                      }}
                    >
                      {fmtDate(c.resolutionDate)}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {(c.responsibility || []).map((v) => (
                          <span
                            key={v}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 600,
                              background: v === "GW" ? t.primaryBg : "#FCE7F3",
                              color: v === "GW" ? t.primary : "#BE185D",
                              border: `1px solid ${v === "GW" ? t.primaryBorder : "#F9A8D4"}`,
                            }}
                          >
                            {v}
                          </span>
                        ))}
                        {!(c.responsibility || []).length && (
                          <span style={{ color: t.textDisabled }}>—</span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: t.textSecondary,
                        maxWidth: 120,
                      }}
                    >
                      {c.others || (
                        <span style={{ color: t.textDisabled }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: t.textPrimary,
                          fontSize: 11,
                        }}
                      >
                        {c.author || "You"}
                      </div>
                      <div
                        style={{
                          color: t.textFaint,
                          fontSize: 10,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {c.time || ""}
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      <button
                        onClick={() => deleteComment(i)}
                        title="Delete"
                        style={{
                          background: "none",
                          border: `1px solid ${t.dangerBorder}`,
                          color: t.danger,
                          borderRadius: 6,
                          padding: "3px 8px",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form */}
        <div
          style={{
            borderTop: `1px solid ${t.border}`,
            padding: "14px 20px",
            background: t.bgSubtle,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 12,
              color: t.textPrimary,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={12} style={{ marginRight: 8 }} />
            Add new entry
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1.4fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>
                Description <span style={{ color: t.danger }}>*</span>
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What happened…"
                style={{
                  ...inputStyle,
                  height: 34,
                  resize: "vertical",
                  paddingTop: 7,
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Action Point</label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Next step…"
                style={{
                  ...inputStyle,
                  height: 34,
                  resize: "vertical",
                  paddingTop: 7,
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Resolution Date</label>
              <input
                type="date"
                value={resDate}
                onChange={(e) => setResDate(e.target.value)}
                style={{
                  ...inputStyle,
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Responsibility</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[
                  ["GW", t.primary, t.primaryBg],
                  ["Customer", "#BE185D", "#FCE7F3"],
                ].map(([v, c, bg]) => (
                  <label
                    key={v}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={v === "GW" ? respGW : respCust}
                      onChange={(e) =>
                        v === "GW"
                          ? setRespGW(e.target.checked)
                          : setRespCust(e.target.checked)
                      }
                      style={{ display: "none" }}
                    />
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        background: (v === "GW" ? respGW : respCust)
                          ? bg
                          : t.bgMuted,
                        color: (v === "GW" ? respGW : respCust)
                          ? c
                          : t.textFaint,
                        border: `1.5px solid ${(v === "GW" ? respGW : respCust) ? c : t.border}`,
                        cursor: "pointer",
                        transition: "all .12s",
                      }}
                    >
                      {v}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Others</label>
              <textarea
                value={others}
                onChange={(e) => setOthers(e.target.value)}
                placeholder="Other notes…"
                style={{
                  ...inputStyle,
                  height: 34,
                  resize: "vertical",
                  paddingTop: 7,
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={btnStyle}>
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                ...btnStyle,
                background: t.primary,
                color: t.textInverse,
                borderColor: t.primary,
              }}
            >
              <Plus size={12} /> Add Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Validation Modal ─── */
function ValidationModal({
  results,
  warnings = [],
  onClose,
  onConfirm,
  isSaving = false,
  isRepublish = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const allOk = results.every((r) => r.ok);
  const failCount = results.filter((r) => !r.ok).length;
  const hasWarnings = warnings.length > 0;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: !allOk
                ? t.dangerBgSubtle
                : hasWarnings
                  ? t.warningBgSubtle
                  : t.successBg,
              color: !allOk ? t.danger : hasWarnings ? t.warning : t.success,
              flexShrink: 0,
            }}
          >
            {!allOk ? (
              <ShieldAlert size={20} strokeWidth={2} />
            ) : hasWarnings ? (
              <AlertTriangle size={20} strokeWidth={2} />
            ) : (
              <ShieldCheck size={20} strokeWidth={2} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {isRepublish ? "Update Published Project" : "Submit for Motion"}
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
              {!allOk && hasWarnings ? (
                <>
                  {failCount} issue{failCount !== 1 ? "s" : ""} to resolve,{" "}
                  {warnings.length} warning{warnings.length !== 1 ? "s" : ""} to
                  review.
                </>
              ) : !allOk ? (
                <>
                  {failCount} issue{failCount !== 1 ? "s" : ""} to resolve
                  before {isRepublish ? "updating" : "submitting"}.
                </>
              ) : hasWarnings ? (
                <>
                  All checks passed — {warnings.length} warning
                  {warnings.length !== 1 ? "s" : ""} to review before{" "}
                  {isRepublish ? "updating" : "publishing"}.
                </>
              ) : isRepublish ? (
                <>All {results.length} checks passed — ready to update.</>
              ) : (
                <>
                  All {results.length} checks passed — ready to put activities
                  in motion.
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Warnings */}
          {hasWarnings && (
            <div
              style={{
                margin: "14px 20px 0",
                padding: 12,
                background: t.warningBgSubtle,
                border: `1px solid ${t.warningBorder}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: `1px dashed ${t.warningBorder}`,
                }}
              >
                <AlertTriangle size={16} color={t.warning} />
                <span
                  style={{ fontWeight: 700, fontSize: 12.5, color: t.warning }}
                >
                  {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "2px 8px",
                    background: t.warningBg,
                    color: t.warning,
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Can Ignore
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 10px",
                      background: t.bgCard,
                      border: `1px solid ${t.warningBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: t.warning,
                        marginBottom: w.detail ? 4 : 0,
                      }}
                    >
                      {w.title}
                    </div>
                    {w.detail && (
                      <div
                        style={{
                          fontSize: 11,
                          color: t.textSecondary,
                          whiteSpace: "pre-line",
                          lineHeight: 1.5,
                        }}
                      >
                        {w.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: `1px dashed ${t.warningBorder}`,
                  fontSize: 10.5,
                  color: t.warning,
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Info size={11} />
                You can {isRepublish ? "update" : "publish"} anyway — review and
                confirm.
              </div>
            </div>
          )}

          {/* Results */}
          <div
            style={{
              padding: "14px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: r.ok ? t.successBgSubtle : t.dangerBgSubtle,
                  border: `1px solid ${r.ok ? t.successBorder : t.dangerBorder}`,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: r.ok ? t.successBg : t.dangerBg,
                    color: r.ok ? t.success : t.danger,
                    marginTop: 1,
                  }}
                >
                  {r.ok ? (
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                  ) : (
                    <XCircle size={14} strokeWidth={2.5} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: r.ok ? t.success : t.danger,
                      lineHeight: 1.4,
                    }}
                  >
                    {r.title}
                  </div>
                  {r.detail && (
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        marginTop: 4,
                        whiteSpace: "pre-line",
                        lineHeight: 1.5,
                      }}
                    >
                      {r.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              ...btnStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <X size={13} /> Close
          </button>

          {allOk && (
            <button
              onClick={onConfirm}
              disabled={isSaving}
              style={{
                ...btnStyle,
                background: hasWarnings ? t.warning : t.primary,
                color: t.textInverse,
                borderColor: hasWarnings ? t.warning : t.primary,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  {isRepublish ? "Updating..." : "Publishing..."}
                </>
              ) : hasWarnings ? (
                <>
                  <AlertTriangle size={14} />
                  {isRepublish ? "Update Anyway" : "Publish Anyway"}
                </>
              ) : isRepublish ? (
                <>
                  <RefreshCw size={14} />
                  Confirm & Re-publish
                </>
              ) : (
                <>
                  <Rocket size={14} />
                  Confirm & Put in Motion
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared styles ─── */
const labelStyle = {
  fontSize: 10,
  fontWeight: 500,
  color: "#64748B",
  letterSpacing: "0.3px",
  display: "block",
  marginBottom: 3,
};
const inputStyle = {
  width: "100%",
  height: 34,
  border: "1px solid #CBD5E1",
  borderRadius: 6,
  background: "#fff",
  color: "#0F172A",
  padding: "0 10px",
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  boxSizing: "border-box",
  outline: "none",
};
const btnStyle = {
  height: 32,
  padding: "0 14px",
  borderRadius: 7,
  border: "1px solid #CBD5E1",
  background: "#fff",
  color: "#475569",
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};
/* ─── Shared styles (theme-aware factories) ─── */
const makeLabelStyle = (t) => ({
  fontSize: 10,
  fontWeight: 500,
  color: t.textMuted,
  letterSpacing: "0.3px",
  display: "block",
  marginBottom: 3,
});

const makeInputStyle = (t) => ({
  width: "100%",
  height: 34,
  border: `1px solid ${t.borderStrong}`,
  borderRadius: 6,
  background: t.bgInput,
  color: t.textPrimary,
  padding: "0 10px",
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  boxSizing: "border-box",
  outline: "none",
});

const makeBtnStyle = (t) => ({
  height: 32,
  padding: "0 14px",
  borderRadius: 7,
  border: `1px solid ${t.borderStrong}`,
  background: t.bgCard,
  color: t.textSecondary,
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
});

const makeIconBtn = (t) => ({
  width: 28,
  height: 28,
  borderRadius: 6,
  border: `1px solid ${t.border}`,
  background: "transparent",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  transition: "all .12s",
  position: "relative",
  overflow: "visible",
});

const makeNavBtn = (t) => ({
  width: 26,
  height: 26,
  borderRadius: 6,
  border: `1px solid ${t.border}`,
  background: t.bgSubtle,
  cursor: "pointer",
  fontSize: 14,
  color: t.textSecondary,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
});

const makeTimeSelect = (t) => ({
  height: 26,
  border: `1px solid ${t.borderStrong}`,
  borderRadius: 5,
  background: t.bgInput,
  color: t.textPrimary,
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 11,
  padding: "0 4px",
  cursor: "pointer",
  outline: "none",
});

const makePickerBtn = (t) => ({
  height: 28,
  padding: "0 12px",
  borderRadius: 6,
  border: `1px solid ${t.borderStrong}`,
  background: t.bgCard,
  color: t.textPrimary,
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "Sora,sans-serif",
});
function ModuleInput({ initialValue, onCommit, onCancel }) {
  const { t } = useTheme();
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== initialValue) {
      onCommit(trimmed);
    } else {
      // No change or empty — just close the editor
      onCancel?.();
    }
  };

  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          setVal(initialValue); // revert
          onCancel?.();
        }
      }}
      placeholder="Module name…"
      autoFocus
      title={val || ""}
      style={{ ...makeInputStyle(t), height: 28, fontSize: 11.5 }}
    />
  );
}
function TaskInput({ initialValue, onCommit, placeholder, isSubActivity }) {
  const { t } = useTheme();
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) onCommit(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
      }}
      placeholder={placeholder}
      style={{
        ...makeInputStyle(t),
        height: 28,
        fontSize: 11.5,
        flex: 1,
        minWidth: 0,
      }}
    />
  );
}

/* ─── Time Picker Section (handles past-time filtering) ─── */
/* ─── Time Picker Section (handles past-time filtering) ─── */
function TimePickerSection({
  selectedDate,
  today,
  hour,
  setHour,
  minute,
  setMinute,
}) {
  const { t } = useTheme();

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isSelectedToday = isSameDay(selectedDate, today);
  const nowHour = today.getHours();
  const nowMinute = today.getMinutes();

  const minHour = isSelectedToday
    ? Math.max(WORK_START_HR, nowHour)
    : WORK_START_HR;

  const hourOptions = Array.from(
    { length: WORK_END_HR - WORK_START_HR + 1 },
    (_, i) => WORK_START_HR + i,
  ).filter((h) => h >= minHour);

  const minuteOptions = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59,
  ].filter((m) => {
    if (hour === WORK_END_HR) return m === 0;
    if (isSelectedToday && hour === nowHour) return m > nowMinute;
    return true;
  });

  useEffect(() => {
    if (!isSelectedToday) return;
    let newHour = hour;
    let newMinute = minute;
    if (newHour < minHour) {
      newHour = minHour;
      newMinute = 0;
    }
    if (newHour === WORK_END_HR && newMinute > 0) newMinute = 0;
    if (newHour === nowHour && newMinute <= nowMinute) {
      const nextValid = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].find(
        (m) => {
          if (newHour === WORK_END_HR) return m === 0 && m > nowMinute;
          return m > nowMinute;
        },
      );
      if (nextValid !== undefined) newMinute = nextValid;
      else if (newHour + 1 <= WORK_END_HR) {
        newHour = newHour + 1;
        newMinute = 0;
      }
    }
    if (newHour !== hour) setHour(newHour);
    if (newMinute !== minute) setMinute(newMinute);
    // eslint-disable-next-line
  }, [isSelectedToday]);

  const timeSelect = makeTimeSelect(t);

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
        Time:
      </span>
      <select
        value={hour}
        onChange={(e) => setHour(Number(e.target.value))}
        style={timeSelect}
      >
        {hourOptions.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span style={{ fontWeight: 700, color: t.textMuted }}>:</span>
      <select
        value={minute}
        onChange={(e) => setMinute(Number(e.target.value))}
        style={timeSelect}
        disabled={minuteOptions.length === 0}
      >
        {minuteOptions.length > 0 ? (
          minuteOptions.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))
        ) : (
          <option value="">—</option>
        )}
      </select>
      <span style={{ fontSize: 10, color: t.textFaint, marginLeft: 4 }}>
        (Work: {WORK_START_HR}:00–{WORK_END_HR}:00)
      </span>
    </div>
  );
}
/* ─── Working-day Date Picker ─── */
function WorkingDatePicker({
  value,
  onChange,
  resourceUserId,
  groupResources,
  onClose,
  anchorRef,
}) {
  const { t } = useTheme();

  const initial = value
    ? parseISODateTime(value)
    : new Date(2026, 4, 4, WORK_START_HR, 0);
  const [viewDate, setViewDate] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(initial);
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(initial.getMinutes());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef();

  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupHeight = 380;
    const popupWidth = 280;
    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;
    if (rect.bottom + popupHeight > window.innerHeight)
      top = rect.top + window.scrollY - popupHeight - 4;
    if (left + popupWidth > window.innerWidth)
      left = rect.right + window.scrollX - popupWidth;
    setPosition({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return;
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
  }, [onClose, anchorRef]);

  useEffect(() => {
    const reposition = () => {
      if (!anchorRef?.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [anchorRef]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = useMemo(() => new Date(), []);

  const handleDayClick = (d) => {
    if (!d) return;
    const isWknd = d.getDay() === 0 || d.getDay() === 6;
    const onLeave = leaveOnDay(resourceUserId, d, groupResources);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const isPast = startOfDay < startOfToday;
    if (isWknd || onLeave || isPast) return;
    setSelectedDate(d);
  };

  const handleConfirm = () => {
    const final = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      minute,
    );
    if (final.getTime() < today.getTime()) {
      alert("Cannot select a date/time in the past.");
      return;
    }
    if (hour > WORK_END_HR || (hour === WORK_END_HR && minute > 0)) {
      alert("Cannot select time after 18:00.");
      return;
    }
    onChange(isoDateTime(final));
    onClose();
  };

  const navBtn = makeNavBtn(t);
  const timeSelect = makeTimeSelect(t);
  const pickerBtn = makePickerBtn(t);

  const popup = (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 99999,
        background: t.bgCard,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 10,
        boxShadow: t.shadowLg,
        padding: 12,
        width: 280,
        fontFamily: "Sora,sans-serif",
      }}
    >
      {/* Nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year - 1, month, 1));
          }}
          disabled={year - 1 < today.getFullYear()}
          title="Previous year"
          style={{
            ...navBtn,
            opacity: year - 1 < today.getFullYear() ? 0.3 : 1,
            cursor: year - 1 < today.getFullYear() ? "not-allowed" : "pointer",
          }}
        >
          «
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year, month - 1, 1));
          }}
          disabled={year === today.getFullYear() && month <= today.getMonth()}
          title="Previous month"
          style={{
            ...navBtn,
            opacity:
              year === today.getFullYear() && month <= today.getMonth()
                ? 0.3
                : 1,
            cursor:
              year === today.getFullYear() && month <= today.getMonth()
                ? "not-allowed"
                : "pointer",
          }}
        >
          ‹
        </button>

        <div
          style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}
        >
          <select
            value={month}
            onChange={(e) =>
              setViewDate(new Date(year, Number(e.target.value), 1))
            }
            style={{
              ...timeSelect,
              fontSize: 12,
              fontWeight: 700,
              height: 28,
              padding: "0 6px",
            }}
          >
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m, i) => {
              const isPastMonth =
                year === today.getFullYear() && i < today.getMonth();
              return (
                <option key={m} value={i} disabled={isPastMonth}>
                  {m}
                </option>
              );
            })}
          </select>

          <select
            value={year}
            onChange={(e) =>
              setViewDate(new Date(Number(e.target.value), month, 1))
            }
            style={{
              ...timeSelect,
              fontSize: 12,
              fontWeight: 700,
              height: 28,
              padding: "0 6px",
            }}
          >
            {Array.from({ length: 11 }, (_, i) => today.getFullYear() + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year, month + 1, 1));
          }}
          title="Next month"
          style={navBtn}
        >
          ›
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year + 1, month, 1));
          }}
          title="Next year"
          style={navBtn}
        >
          »
        </button>
      </div>

      {/* Days */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const day = d.getDay();
          const isWknd = day === 0 || day === 6;
          const onLeave = leaveOnDay(resourceUserId, d, groupResources);
          const startOfDay = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
          );
          const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const isPast = startOfDay < startOfToday;
          const disabled = isWknd || onLeave || isPast;
          const selected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);

          let bg = "transparent";
          let color = t.textPrimary;
          let border = "1px solid transparent";
          let cursor = "pointer";

          if (selected) {
            bg = t.primary;
            color = t.textInverse;
            border = `1px solid ${t.primary}`;
          } else if (isPast) {
            bg = t.bgSubtle;
            color = t.textDisabled;
            cursor = "not-allowed";
            border = `1px solid ${t.borderSubtle}`;
          } else if (isWknd) {
            bg = t.dangerBgSubtle;
            color = t.danger;
            cursor = "not-allowed";
            border = `1px solid ${t.dangerBorder}`;
          } else if (onLeave) {
            bg = t.warningBgSubtle;
            color = t.warning;
            cursor = "not-allowed";
            border = `1px solid ${t.warningBorder}`;
          } else if (isToday) {
            border = `1px solid ${t.primary}`;
            color = t.primary;
          }

          return (
            <button
              key={i}
              onClick={() => handleDayClick(d)}
              disabled={disabled}
              title={
                isPast
                  ? "Past date — disabled"
                  : isWknd
                    ? "Weekend — disabled"
                    : onLeave
                      ? `Leave (${onLeave.date})`
                      : ""
              }
              style={{
                aspectRatio: "1",
                border,
                background: bg,
                color,
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: selected || isToday ? 700 : 500,
                cursor,
                fontFamily: "Sora,sans-serif",
                padding: 0,
                opacity: disabled ? 0.6 : 1,
                textDecoration: isPast && !selected ? "line-through" : "none",
                position: "relative",
              }}
            >
              {d.getDate()}
              {onLeave && !selected && !isPast && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: t.warning,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 8,
          fontSize: 9.5,
          color: t.textMuted,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.bgSubtle,
              border: `1px solid ${t.borderSubtle}`,
            }}
          />
          Past
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
            }}
          />
          Weekend
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.warningBgSubtle,
              border: `1px solid ${t.warningBorder}`,
            }}
          />
          Leave
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.primary,
            }}
          />
          Selected
        </span>
      </div>

      <TimePickerSection
        selectedDate={selectedDate}
        today={today}
        hour={hour}
        setHour={setHour}
        minute={minute}
        setMinute={setMinute}
      />

      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        <button onClick={onClose} style={pickerBtn}>
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          style={{
            ...pickerBtn,
            background: t.primary,
            color: t.textInverse,
            borderColor: t.primary,
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}

const navBtn = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid #E2E8F0",
  background: "#F8FAFC",
  cursor: "pointer",
  fontSize: 14,
  color: "#475569",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};
const timeSelect = {
  height: 26,
  border: "1px solid #CBD5E1",
  borderRadius: 5,
  background: "#fff",
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 11,
  padding: "0 4px",
  cursor: "pointer",
  outline: "none",
};

const pickerBtn = {
  height: 28,
  padding: "0 12px",
  borderRadius: 6,
  border: "1px solid #CBD5E1",
  background: "#fff",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "Sora,sans-serif",
};
/* ─── Searchable Dropdown Component ─── */
function SearchableDropdown({
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
  // ─── 1. State ──────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // ─── 2. Refs ───────────────────────────────────────────
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const searchInputRef = useRef(null);

  // ─── 3. Position calculation ───────────────────────────
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Measure actual popup height if available, else estimate
    let popupHeight = 320;
    if (popupRef.current) {
      popupHeight = popupRef.current.offsetHeight;
    }

    const popupMaxWidth = 360;
    const spacing = 4;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    // Prefer opening DOWNWARD if there's enough space
    if (spaceBelow >= popupHeight + spacing) {
      top = rect.bottom + window.scrollY + spacing;
    }
    // Open UPWARD only if there's more space above AND not enough below
    else if (spaceAbove > spaceBelow && spaceAbove >= popupHeight + spacing) {
      top = rect.top + window.scrollY - popupHeight - spacing;
    }
    // Default: open downward (popup will scroll internally if needed)
    else {
      top = rect.bottom + window.scrollY + spacing;
    }

    // Horizontal positioning — align right edge if popup would overflow
    let left = rect.left + window.scrollX;
    if (left + popupMaxWidth > viewportWidth) {
      left = Math.max(8, viewportWidth - popupMaxWidth - 8 + window.scrollX);
    }

    setPosition({ top, left, width: rect.width });
  }, []);

  // ─── 4. Main effect: open/close listeners ──────────────
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

  // ─── 5. Focus search input when opened ─────────────────
  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [open, searchable]);

  // ─── 6. Dedupe and validate options ────────────────────
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

  // ─── 7. Filter by search ───────────────────────────────
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

  // ─── 8. Group options ──────────────────────────────────
  const groupedOptions = useMemo(() => {
    const groups = {};
    filteredOptions.forEach((opt) => {
      const key = opt.group || "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  // ─── 9. Normalize selected values ──────────────────────
  const selectedValues = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value.map(String) : [];
    return value ? [String(value)] : [];
  }, [value, multiple]);

  // ─── 10. Find selected option objects ──────────────────
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

  // ─── 11. Re-measure position after popup renders ───────
  // (MUST be after filteredOptions is declared)
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      updatePosition();
    });
    return () => cancelAnimationFrame(id);
  }, [open, filteredOptions.length, updatePosition]);

  // ─── 12. Event handlers (next: handleSelect, etc.) ─────

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
                  color: "#1D4ED8",
                  border: "1px solid #93C5FD",
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
              color: "#1D4ED8",
              border: "1px solid #93C5FD",
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
              background: "#F1F5F9",
              color: "#64748B",
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
          color: "#0F172A",
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

  // ── Portal popup ──
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
                      if (!opt.disabled && !selected)
                        e.currentTarget.style.background = t.bgSubtle;
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = "transparent";
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
/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const { t } = useTheme();
  const cfg = getStatusConfig(status, t); // ← pass t
  const { Icon, label, bg, color, border, pulse, spin } = cfg;

  let IconElement;
  if (spin) {
    IconElement = <SpinningIcon Icon={Icon} size={11} color={color} />;
  } else if (pulse) {
    IconElement = <PulsingIcon Icon={Icon} size={11} color={color} />;
  } else {
    IconElement = <Icon size={11} color={color} strokeWidth={2.5} />;
  }

  return (
    <span
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
        transition: "all .15s",
      }}
    >
      {IconElement}
      <span>{label}</span>
    </span>
  );
}
function getStatusConfigThemed(status, t) {
  const cfg = getStatusConfig(status);
  // In dark mode, dim the backgrounds
  // The status colors are semantic, keep the colors but adjust bg intensity
  return cfg;
}
/* ─── Reject / Redo Reason Modal ─── */
function RejectReasonModal({ row, onClose, onConfirm, isSubmitting = false }) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const trimmed = reason.trim();
  const isValid = trimmed.length >= 5;

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid) return;
    await onConfirm(trimmed);
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 480,
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.warningBgSubtle,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.warningBg,
              color: t.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RotateCcw size={20} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Redo / Reject Task
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.task || row.module || `Row #${row.id}`}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSubmitting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: 10,
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <AlertOctagon
              size={16}
              color={t.danger}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div
              style={{
                fontSize: 11.5,
                color: t.dangerTextDeep,
                lineHeight: 1.5,
              }}
            >
              This will mark the task as <strong>Rejected</strong> and notify
              the assignee that the work needs to be redone.
            </div>
          </div>

          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 600,
              color: t.textPrimary,
              marginBottom: 6,
            }}
          >
            Reason for Redo / Rejection
            <span style={{ color: t.danger, marginLeft: 4 }}>*</span>
          </label>

          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Explain why this task needs to be redone (min. 5 characters)…"
            disabled={isSubmitting}
            rows={4}
            style={{
              width: "100%",
              border: `1px solid ${touched && !isValid ? t.dangerBorder : t.borderStrong}`,
              borderRadius: 8,
              padding: "10px 12px",
              fontFamily: "Sora,sans-serif",
              fontSize: 12.5,
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              minHeight: 80,
              lineHeight: 1.5,
              background: isSubmitting ? t.bgInputDisabled : t.bgInput,
              color: t.textPrimary,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 10.5,
              color: touched && !isValid ? t.danger : t.textFaint,
            }}
          >
            <span>
              {touched && !isValid
                ? "⚠ Reason must be at least 5 characters"
                : "Be specific — this helps the assignee understand what to fix"}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: trimmed.length > 0 ? t.textSecondary : t.textDisabled,
              }}
            >
              {trimmed.length} chars
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              ...btnStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              opacity: isSubmitting ? 0.5 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={{
              ...btnStyle,
              background: isValid ? t.warning : t.bgMuted,
              color: isValid ? t.textInverse : t.textFaint,
              borderColor: isValid ? t.warning : t.border,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: !isValid || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Submitting...
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                Redo & Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
/* ─── Comment Field (defined OUTSIDE FeedbackModal) ─── */
function CommentField({
  label,
  value,
  onChange,
  placeholder,
  readOnly: isReadOnly,
  disabled,
}) {
  const { t } = useTheme();

  return (
    <div style={{ marginTop: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 10.5,
          fontWeight: 600,
          color: t.textMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {isReadOnly ? (
        <div
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "Sora,sans-serif",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: t.textSecondary,
            background: t.bgSubtle,
            minHeight: 36,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        >
          {value || "—"}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "Sora,sans-serif",
            fontSize: 11.5,
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: 48,
            lineHeight: 1.5,
            background: disabled ? t.bgInputDisabled : t.bgInput,
            color: t.textPrimary,
          }}
        />
      )}
    </div>
  );
}

function RatingBar({ value, hover, onChange, onHover, onLeave, disabled }) {
  const { t } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = n <= (disabled ? value : hover || value);

        const getColor = (rating) => {
          if (rating <= 3) return { fill: "#EF4444", border: "#FCA5A5" };
          if (rating <= 5) return { fill: "#F59E0B", border: "#FCD34D" };
          if (rating <= 7) return { fill: "#3B82F6", border: "#93C5FD" };
          return { fill: "#22C55E", border: "#86EFAC" };
        };
        const c = getColor(n);

        return (
          <button
            key={n}
            type="button"
            onClick={() => !disabled && onChange(n)}
            onMouseEnter={() => !disabled && onHover(n)}
            onMouseLeave={() => !disabled && onLeave()}
            disabled={disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1.5px solid ${active ? c.border : t.border}`,
              background: active ? c.fill : t.bgSubtle,
              color: active ? "#fff" : t.textFaint,
              fontSize: 11,
              fontWeight: 700,
              cursor: disabled ? "default" : "pointer",
              fontFamily: "Sora,sans-serif",
              transition: "all 0.12s",
              transform: active ? "scale(1.08)" : "scale(1)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {n}
          </button>
        );
      })}

      {value > 0 && (
        <span
          style={{
            marginLeft: 8,
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background:
              value <= 3
                ? "#FEE2E2"
                : value <= 5
                  ? "#FEF3C7"
                  : value <= 7
                    ? "#DBEAFE"
                    : "#DCFCE7",
            color:
              value <= 3
                ? "#DC2626"
                : value <= 5
                  ? "#B45309"
                  : value <= 7
                    ? "#1D4ED8"
                    : "#15803D",
            border: `1px solid ${
              value <= 3
                ? "#FCA5A5"
                : value <= 5
                  ? "#FCD34D"
                  : value <= 7
                    ? "#93C5FD"
                    : "#86EFAC"
            }`,
          }}
        >
          {value}/10
        </span>
      )}
    </div>
  );
}

/* ─── Reference Card (defined OUTSIDE FeedbackModal) ─── */
// function RefCard({ label, value, icon, color = "#475569" }) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         gap: 8,
//         padding: "6px 10px",
//         background: "#F8FAFC",
//         border: "1px solid #E2E8F0",
//         borderRadius: 6,
//         fontSize: 11,
//         minWidth: 0,
//       }}
//     >
//       <span style={{ color, flexShrink: 0 }}>{icon}</span>
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <div
//           style={{
//             fontSize: 9.5,
//             color: "#94A3B8",
//             fontWeight: 600,
//             textTransform: "uppercase",
//             letterSpacing: "0.3px",
//           }}
//         >
//           {label}
//         </div>
//         <div
//           style={{
//             fontWeight: 600,
//             color: "#0F172A",
//             fontFamily: "'JetBrains Mono',monospace",
//             fontSize: 11,
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {value}
//         </div>
//       </div>
//     </div>
//   );
// }
// function FeedbackModal({ row, onClose, onConfirm, isSubmitting = false }) {
//   // ── Determine mode ──
//   const isFinished =
//     String(row.status || "")
//       .toLowerCase()
//       .trim() === "finished";
//   const readOnly = isFinished;

//   // ── Compute reference data ──
//   const parseDt = (val) => {
//     if (!val) return null;
//     const d = new Date(val);
//     return isNaN(d) ? null : d;
//   };

//   const plannedStartDt = parseDt(row.plannedStart);
//   const plannedStopDt = parseDt(row.plannedStop);
//   const actualStartDt = parseDt(row.actualStart);
//   const actualStopDt = parseDt(row.actualStop);

//   const benchmarkHrs =
//     plannedStartDt && plannedStopDt
//       ? Math.round(
//           ((plannedStopDt.getTime() - plannedStartDt.getTime()) /
//             (1000 * 60 * 60)) *
//             100,
//         ) / 100
//       : row.durationHrs || 0;

//   const actualHrs =
//     actualStartDt && actualStopDt
//       ? Math.round(
//           ((actualStopDt.getTime() - actualStartDt.getTime()) /
//             (1000 * 60 * 60)) *
//             100,
//         ) / 100
//       : row.actualElapsedHrs || 0;

//   const rejectCount = row.actiVityRejectCount || 0;

//   // ── Format helpers ──
//   const fmtHrMin = (hrs) => {
//     if (hrs === null || hrs === undefined || isNaN(hrs)) return "—";
//     const totalMinutes = Math.round(Math.abs(hrs) * 60);
//     const h = Math.floor(totalMinutes / 60);
//     const m = totalMinutes % 60;
//     const sign = hrs < 0 ? "-" : "";
//     if (h === 0) return `${sign}${m}m`;
//     if (m === 0) return `${sign}${h}h`;
//     return `${sign}${h}h ${m}m`;
//   };

//   const fmtPlanned = (val) => {
//     if (!val) return "—";
//     const d = new Date(val);
//     if (isNaN(d)) return "—";
//     return d.toLocaleString("en-GB", {
//       timeZone: "UTC",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const fmtActual = (val) => {
//     if (!val) return "—";
//     const d = new Date(val);
//     if (isNaN(d)) return "—";
//     return d.toLocaleString("en-GB", {
//       timeZone: "Asia/Kolkata",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // ── Auto-suggest: Time Efficiency (1–10) ──
//   const suggestTimeRating = () => {
//     if (!benchmarkHrs || benchmarkHrs <= 0 || !actualHrs) return 5;
//     const ratio = actualHrs / benchmarkHrs;
//     if (ratio <= 0.8) return 10;
//     if (ratio <= 0.9) return 9;
//     if (ratio <= 1.0) return 8;
//     if (ratio <= 1.1) return 7;
//     if (ratio <= 1.2) return 6;
//     if (ratio <= 1.4) return 5;
//     if (ratio <= 1.6) return 4;
//     if (ratio <= 1.8) return 3;
//     if (ratio <= 2.0) return 2;
//     return 1;
//   };

//   // ── Auto-suggest: Fulfillment (1–10) ──
//   const suggestFulfillmentRating = () => {
//     if (rejectCount === 0) return 10;
//     if (rejectCount === 1) return 7;
//     if (rejectCount === 2) return 5;
//     if (rejectCount === 3) return 3;
//     return 1;
//   };

//   // ── State ──
//   const [timeRating, setTimeRating] = useState(
//     readOnly ? row.timeEfficiencyRating || 0 : suggestTimeRating(),
//   );
//   const [fulfillmentRating, setFulfillmentRating] = useState(
//     readOnly ? row.fulfillmentRating || 0 : suggestFulfillmentRating(),
//   );
//   const [innovationRating, setInnovationRating] = useState(
//     readOnly ? row.innovationRating || 0 : 0,
//   );
//   const [hoverTime, setHoverTime] = useState(0);
//   const [hoverFulfillment, setHoverFulfillment] = useState(0);
//   const [hoverInnovation, setHoverInnovation] = useState(0);

//   const [timeComments, setTimeComments] = useState(
//     readOnly ? row.timeEfficiencyComments || "" : "",
//   );
//   const [fulfillmentComments, setFulfillmentComments] = useState(
//     readOnly ? row.fulfillmentComments || "" : "",
//   );
//   const [innovationComments, setInnovationComments] = useState(
//     readOnly ? row.innovationComments || "" : "",
//   );
//   const [overallComments, setOverallComments] = useState(
//     readOnly ? row.feedbackComments || "" : "",
//   );

//   const [touched, setTouched] = useState(false);

//   const isValid =
//     timeRating > 0 &&
//     fulfillmentRating > 0 &&
//     innovationRating > 0 &&
//     overallComments.trim().length >= 5;

//   // ── Rating labels ──
//   const timeLabels = {
//     1: "Very Poor — Took 2x+ longer than planned",
//     2: "Poor — Significant delay (80–100% over)",
//     3: "Below Average — 60–80% over planned time",
//     4: "Slightly Below — 40–60% over planned time",
//     5: "Average — 20–40% over planned time",
//     6: "Slightly Above — 10–20% over planned time",
//     7: "Good — Within 10% over planned time",
//     8: "Very Good — Completed on time",
//     9: "Excellent — Finished slightly ahead of schedule",
//     10: "Outstanding — Finished well ahead of schedule",
//   };

//   const fulfillmentLabels = {
//     1: "Unacceptable — Multiple reworks, major gaps",
//     2: "Very Poor — Extensive rework needed",
//     3: "Poor — Significant quality issues",
//     4: "Below Average — Notable gaps remain",
//     5: "Average — Acceptable with improvements",
//     6: "Slightly Above — Minor issues present",
//     7: "Good — Meets most expectations",
//     8: "Very Good — Meets all expectations",
//     9: "Excellent — Exceeds expectations",
//     10: "Outstanding — Exceptional quality, zero rework",
//   };

//   const innovationLabels = {
//     1: "No Innovation — Followed instructions only",
//     2: "Minimal — Very little creative input",
//     3: "Below Average — Routine approach",
//     4: "Slightly Below — Some effort but conventional",
//     5: "Average — Standard approach with minor improvements",
//     6: "Slightly Above — Some creative solutions applied",
//     7: "Good — Noticeable innovative thinking",
//     8: "Very Good — Creative problem-solving demonstrated",
//     9: "Excellent — Significant innovative contributions",
//     10: "Outstanding — Exceptional creativity and innovation",
//   };

//   const handleSubmit = async () => {
//     if (readOnly) return;
//     setTouched(true);
//     if (!isValid) return;
//     await onConfirm({
//       timeEfficiencyRating: timeRating,
//       timeEfficiencyComments: timeComments.trim(),
//       fulfillmentRating,
//       fulfillmentComments: fulfillmentComments.trim(),
//       innovationRating,
//       innovationComments: innovationComments.trim(),
//       comments: overallComments.trim(),
//     });
//   };

//   // ── Efficiency comparison ──
//   const efficiencyPercent =
//     benchmarkHrs > 0
//       ? Math.round(((actualHrs - benchmarkHrs) / benchmarkHrs) * 100)
//       : 0;
//   const isAhead = efficiencyPercent < 0;
//   const isOnTime = efficiencyPercent === 0;

//   // ── Rating bar component (1–10) ──

//   // ── Comment input component ──

//   return (
//     <div
//       onClick={(e) =>
//         e.target === e.currentTarget && !isSubmitting && onClose()
//       }
//       style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(0,0,0,0.45)",
//         zIndex: 1000,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         padding: 16,
//       }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 14,
//           width: "100%",
//           maxWidth: 680,
//           maxHeight: "92vh",
//           fontFamily: "Sora,sans-serif",
//           boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
//           overflow: "hidden",
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         {/* ── Header ── */}
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 12,
//             padding: "16px 20px",
//             borderBottom: "1px solid #E2E8F0",
//             background: readOnly ? "#EDE9FE" : "#F0FDF4",
//             flexShrink: 0,
//           }}
//         >
//           <div
//             style={{
//               width: 40,
//               height: 40,
//               borderRadius: 10,
//               background: readOnly ? "#DDD6FE" : "#DCFCE7",
//               color: readOnly ? "#7C3AED" : "#15803D",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <Star
//               size={20}
//               strokeWidth={2}
//               fill={readOnly ? "#7C3AED" : "none"}
//             />
//           </div>
//           <div style={{ flex: 1, minWidth: 0 }}>
//             <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
//               {readOnly ? "Task Feedback" : "Rate & Finish Task"}
//             </div>
//             <div
//               style={{
//                 fontSize: 11.5,
//                 color: "#64748B",
//                 marginTop: 2,
//                 overflow: "hidden",
//                 textOverflow: "ellipsis",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               {row.task || row.module || `Row #${row.id}`}
//             </div>
//           </div>

//           {readOnly && (
//             <span
//               style={{
//                 padding: "3px 10px",
//                 borderRadius: 999,
//                 fontSize: 10,
//                 fontWeight: 700,
//                 background: "#EDE9FE",
//                 color: "#7C3AED",
//                 border: "1px solid #DDD6FE",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.5px",
//               }}
//             >
//               Read Only
//             </span>
//           )}

//           <button
//             onClick={onClose}
//             disabled={isSubmitting}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: isSubmitting ? "not-allowed" : "pointer",
//               color: "#94A3B8",
//               padding: 4,
//               opacity: isSubmitting ? 0.5 : 1,
//               display: "flex",
//               alignItems: "center",
//             }}
//           >
//             <X size={18} />
//           </button>
//         </div>

//         {/* ── Scrollable Body ── */}
//         <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
//           {/* ═══════════════════════════════════════════
//               SECTION 1: TIME EFFICIENCY
//              ═══════════════════════════════════════════ */}
//           <div
//             style={{
//               border: "1px solid #E2E8F0",
//               borderRadius: 10,
//               padding: 16,
//               marginBottom: 18,
//               background: "#FAFBFC",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 marginBottom: 12,
//               }}
//             >
//               <div
//                 style={{
//                   width: 28,
//                   height: 28,
//                   borderRadius: 7,
//                   background: "#DBEAFE",
//                   color: "#1D4ED8",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <Clock size={14} />
//               </div>
//               <div>
//                 <div
//                   style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}
//                 >
//                   Time Efficiency
//                   {!readOnly && (
//                     <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
//                   )}
//                 </div>
//                 <div style={{ fontSize: 10.5, color: "#64748B" }}>
//                   How efficiently was the task completed within the planned
//                   timeframe?
//                 </div>
//               </div>
//             </div>

//             {/* Reference Data Grid */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 8,
//                 marginBottom: 12,
//               }}
//             >
//               <RefCard
//                 label="Planned Start"
//                 value={fmtActual(row.plannedStart)}
//                 icon={<CalendarX size={13} />}
//                 color="#1D4ED8"
//               />
//               <RefCard
//                 label="Planned Stop"
//                 value={fmtActual(row.plannedStop)}
//                 icon={<CalendarX size={13} />}
//                 color="#1D4ED8"
//               />
//               <RefCard
//                 label="Actual Start"
//                 value={fmtActual(row.actualStart)}
//                 icon={<ClipboardList size={13} />}
//                 color="#15803D"
//               />
//               <RefCard
//                 label="Actual Stop"
//                 value={fmtActual(row.actualStop)}
//                 icon={<ClipboardList size={13} />}
//                 color="#15803D"
//               />
//             </div>

//             {/* Duration Comparison */}
//             <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
//               <div
//                 style={{
//                   flex: 1,
//                   padding: "8px 12px",
//                   background: "#DBEAFE",
//                   border: "1px solid #93C5FD",
//                   borderRadius: 7,
//                   textAlign: "center",
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: 9.5,
//                     color: "#1D4ED8",
//                     fontWeight: 600,
//                     textTransform: "uppercase",
//                     letterSpacing: "0.3px",
//                     marginBottom: 2,
//                   }}
//                 >
//                   Benchmark Duration
//                 </div>
//                 <div
//                   style={{
//                     fontSize: 16,
//                     fontWeight: 800,
//                     color: "#1E40AF",
//                     fontFamily: "'JetBrains Mono',monospace",
//                   }}
//                 >
//                   {fmtHrMin(benchmarkHrs)}
//                 </div>
//               </div>

//               <div
//                 style={{
//                   flex: 1,
//                   padding: "8px 12px",
//                   background: isAhead
//                     ? "#DCFCE7"
//                     : isOnTime
//                       ? "#DBEAFE"
//                       : "#FEF3C7",
//                   border: `1px solid ${
//                     isAhead ? "#86EFAC" : isOnTime ? "#93C5FD" : "#FCD34D"
//                   }`,
//                   borderRadius: 7,
//                   textAlign: "center",
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: 9.5,
//                     color: isAhead
//                       ? "#15803D"
//                       : isOnTime
//                         ? "#1D4ED8"
//                         : "#B45309",
//                     fontWeight: 600,
//                     textTransform: "uppercase",
//                     letterSpacing: "0.3px",
//                     marginBottom: 2,
//                   }}
//                 >
//                   Actual Duration
//                 </div>
//                 <div
//                   style={{
//                     fontSize: 16,
//                     fontWeight: 800,
//                     color: isAhead
//                       ? "#166534"
//                       : isOnTime
//                         ? "#1E40AF"
//                         : "#92400E",
//                     fontFamily: "'JetBrains Mono',monospace",
//                   }}
//                 >
//                   {fmtHrMin(actualHrs)}
//                 </div>
//               </div>

//               <div
//                 style={{
//                   padding: "8px 12px",
//                   background: isAhead
//                     ? "#DCFCE7"
//                     : isOnTime
//                       ? "#F0F9FF"
//                       : "#FEE2E2",
//                   border: `1px solid ${
//                     isAhead ? "#86EFAC" : isOnTime ? "#BAE6FD" : "#FCA5A5"
//                   }`,
//                   borderRadius: 7,
//                   textAlign: "center",
//                   minWidth: 80,
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: 9.5,
//                     color: "#64748B",
//                     fontWeight: 600,
//                     textTransform: "uppercase",
//                     letterSpacing: "0.3px",
//                     marginBottom: 2,
//                   }}
//                 >
//                   Variance
//                 </div>
//                 <div
//                   style={{
//                     fontSize: 16,
//                     fontWeight: 800,
//                     color: isAhead
//                       ? "#15803D"
//                       : isOnTime
//                         ? "#1D4ED8"
//                         : "#DC2626",
//                     fontFamily: "'JetBrains Mono',monospace",
//                   }}
//                 >
//                   {isAhead ? "" : isOnTime ? "" : "+"}
//                   {efficiencyPercent}%
//                 </div>
//               </div>
//             </div>

//             {/* Suggested badge */}
//             {!readOnly && (
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 6,
//                   marginBottom: 8,
//                   padding: "5px 10px",
//                   background: "#F0F9FF",
//                   border: "1px solid #BAE6FD",
//                   borderRadius: 6,
//                   fontSize: 10.5,
//                   color: "#0369A1",
//                 }}
//               >
//                 <Info size={12} />
//                 <span>
//                   Suggested rating: <strong>{suggestTimeRating()}/10</strong>{" "}
//                   based on{" "}
//                   {efficiencyPercent === 0
//                     ? "on-time delivery"
//                     : isAhead
//                       ? `${Math.abs(efficiencyPercent)}% ahead of schedule`
//                       : `${efficiencyPercent}% over planned time`}
//                 </span>
//                 <button
//                   onClick={() => setTimeRating(suggestTimeRating())}
//                   style={{
//                     marginLeft: "auto",
//                     background: "#1D4ED8",
//                     color: "#fff",
//                     border: "none",
//                     borderRadius: 4,
//                     padding: "2px 8px",
//                     fontSize: 10,
//                     fontWeight: 600,
//                     cursor: "pointer",
//                   }}
//                 >
//                   Apply
//                 </button>
//               </div>
//             )}

//             {/* Rating Bar */}
//             <RatingBar
//               value={timeRating}
//               hover={hoverTime}
//               onChange={setTimeRating}
//               onHover={setHoverTime}
//               onLeave={() => setHoverTime(0)}
//               disabled={readOnly || isSubmitting}
//             />
//             <div
//               style={{
//                 fontSize: 10.5,
//                 color: "#64748B",
//                 fontStyle: "italic",
//                 marginTop: 6,
//                 minHeight: 14,
//               }}
//             >
//               {timeLabels[readOnly ? timeRating : hoverTime || timeRating] ||
//                 "Select a rating"}
//             </div>
//             {!readOnly && touched && timeRating === 0 && (
//               <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 4 }}>
//                 ⚠ Please rate time efficiency
//               </div>
//             )}

//             {/* Time Efficiency Comment */}
//             <CommentField
//               label="Time Efficiency Comments"
//               value={timeComments}
//               onChange={setTimeComments}
//               placeholder="Comments on time management, delays, early delivery…"
//               readOnly={readOnly}
//               disabled={isSubmitting}
//             />
//           </div>

//           {/* ═══════════════════════════════════════════
//               SECTION 2: LEVEL OF FULFILLMENT
//              ═══════════════════════════════════════════ */}
//           <div
//             style={{
//               border: "1px solid #E2E8F0",
//               borderRadius: 10,
//               padding: 16,
//               marginBottom: 18,
//               background: "#FAFBFC",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 marginBottom: 12,
//               }}
//             >
//               <div
//                 style={{
//                   width: 28,
//                   height: 28,
//                   borderRadius: 7,
//                   background: "#EDE9FE",
//                   color: "#7C3AED",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <ShieldCheck size={14} />
//               </div>
//               <div>
//                 <div
//                   style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}
//                 >
//                   Level of Fulfillment
//                   {!readOnly && (
//                     <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
//                   )}
//                 </div>
//                 <div style={{ fontSize: 10.5, color: "#64748B" }}>
//                   Quality of deliverable and completeness of requirements.
//                 </div>
//               </div>
//             </div>

//             {/* Reject Count Reference */}
//             <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
//               <div
//                 style={{
//                   flex: 1,
//                   padding: "8px 12px",
//                   background: rejectCount === 0 ? "#DCFCE7" : "#FEE2E2",
//                   border: `1px solid ${
//                     rejectCount === 0 ? "#86EFAC" : "#FCA5A5"
//                   }`,
//                   borderRadius: 7,
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                 }}
//               >
//                 <div
//                   style={{
//                     width: 36,
//                     height: 36,
//                     borderRadius: 8,
//                     background: rejectCount === 0 ? "#F0FDF4" : "#FEF2F2",
//                     color: rejectCount === 0 ? "#15803D" : "#DC2626",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontFamily: "'JetBrains Mono',monospace",
//                     fontSize: 16,
//                     fontWeight: 800,
//                     flexShrink: 0,
//                   }}
//                 >
//                   {rejectCount}
//                 </div>
//                 <div>
//                   <div
//                     style={{
//                       fontSize: 9.5,
//                       color: rejectCount === 0 ? "#15803D" : "#DC2626",
//                       fontWeight: 600,
//                       textTransform: "uppercase",
//                       letterSpacing: "0.3px",
//                     }}
//                   >
//                     Reject / Redo Count
//                   </div>
//                   <div
//                     style={{
//                       fontSize: 11,
//                       color: rejectCount === 0 ? "#166534" : "#7F1D1D",
//                       fontWeight: 500,
//                     }}
//                   >
//                     {rejectCount === 0
//                       ? "No rejections — first-time acceptance"
//                       : rejectCount === 1
//                         ? "Rejected once — required one rework"
//                         : `Rejected ${rejectCount} times — multiple reworks needed`}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Suggested badge */}
//             {!readOnly && (
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 6,
//                   marginBottom: 8,
//                   padding: "5px 10px",
//                   background: "#F5F3FF",
//                   border: "1px solid #DDD6FE",
//                   borderRadius: 6,
//                   fontSize: 10.5,
//                   color: "#5B21B6",
//                 }}
//               >
//                 <Info size={12} />
//                 <span>
//                   Suggested rating:{" "}
//                   <strong>{suggestFulfillmentRating()}/10</strong> based on{" "}
//                   {rejectCount === 0
//                     ? "zero rejections"
//                     : `${rejectCount} rejection${rejectCount !== 1 ? "s" : ""}`}
//                 </span>
//                 <button
//                   onClick={() =>
//                     setFulfillmentRating(suggestFulfillmentRating())
//                   }
//                   style={{
//                     marginLeft: "auto",
//                     background: "#7C3AED",
//                     color: "#fff",
//                     border: "none",
//                     borderRadius: 4,
//                     padding: "2px 8px",
//                     fontSize: 10,
//                     fontWeight: 600,
//                     cursor: "pointer",
//                   }}
//                 >
//                   Apply
//                 </button>
//               </div>
//             )}

//             {/* Rating Bar */}
//             <RatingBar
//               value={fulfillmentRating}
//               hover={hoverFulfillment}
//               onChange={setFulfillmentRating}
//               onHover={setHoverFulfillment}
//               onLeave={() => setHoverFulfillment(0)}
//               disabled={readOnly || isSubmitting}
//             />
//             <div
//               style={{
//                 fontSize: 10.5,
//                 color: "#64748B",
//                 fontStyle: "italic",
//                 marginTop: 6,
//                 minHeight: 14,
//               }}
//             >
//               {fulfillmentLabels[
//                 readOnly
//                   ? fulfillmentRating
//                   : hoverFulfillment || fulfillmentRating
//               ] || "Select a rating"}
//             </div>
//             {!readOnly && touched && fulfillmentRating === 0 && (
//               <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 4 }}>
//                 ⚠ Please rate level of fulfillment
//               </div>
//             )}

//             {/* Fulfillment Comment */}
//             <CommentField
//               label="Fulfillment Comments"
//               value={fulfillmentComments}
//               onChange={setFulfillmentComments}
//               placeholder="Comments on quality, completeness, rework needed…"
//               readOnly={readOnly}
//               disabled={isSubmitting}
//             />
//           </div>

//           {/* ═══════════════════════════════════════════
//               SECTION 3: LEVEL OF INNOVATION
//              ═══════════════════════════════════════════ */}
//           <div
//             style={{
//               border: "1px solid #E2E8F0",
//               borderRadius: 10,
//               padding: 16,
//               marginBottom: 18,
//               background: "#FAFBFC",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 marginBottom: 12,
//               }}
//             >
//               <div
//                 style={{
//                   width: 28,
//                   height: 28,
//                   borderRadius: 7,
//                   background: "#FEF3C7",
//                   color: "#B45309",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <Lightbulb size={14} />
//               </div>
//               <div>
//                 <div
//                   style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}
//                 >
//                   Level of Innovation
//                   {!readOnly && (
//                     <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
//                   )}
//                 </div>
//                 <div style={{ fontSize: 10.5, color: "#64748B" }}>
//                   Creativity, problem-solving, and innovative thinking applied
//                   to the task.
//                 </div>
//               </div>
//             </div>

//             {/* No reference data — subjective rating */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 6,
//                 marginBottom: 12,
//                 padding: "5px 10px",
//                 background: "#FFFBEB",
//                 border: "1px solid #FDE68A",
//                 borderRadius: 6,
//                 fontSize: 10.5,
//                 color: "#92400E",
//               }}
//             >
//               <Info size={12} />
//               <span>
//                 This is a subjective assessment — rate based on your observation
//                 of creative and innovative effort.
//               </span>
//             </div>

//             {/* Rating Bar */}
//             <RatingBar
//               value={innovationRating}
//               hover={hoverInnovation}
//               onChange={setInnovationRating}
//               onHover={setHoverInnovation}
//               onLeave={() => setHoverInnovation(0)}
//               disabled={readOnly || isSubmitting}
//             />
//             <div
//               style={{
//                 fontSize: 10.5,
//                 color: "#64748B",
//                 fontStyle: "italic",
//                 marginTop: 6,
//                 minHeight: 14,
//               }}
//             >
//               {innovationLabels[
//                 readOnly
//                   ? innovationRating
//                   : hoverInnovation || innovationRating
//               ] || "Select a rating"}
//             </div>
//             {!readOnly && touched && innovationRating === 0 && (
//               <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 4 }}>
//                 ⚠ Please rate level of innovation
//               </div>
//             )}

//             {/* Innovation Comment */}
//             <CommentField
//               label="Innovation Comments"
//               value={innovationComments}
//               onChange={setInnovationComments}
//               placeholder="Comments on creative solutions, novel approaches, improvements…"
//               readOnly={readOnly}
//               disabled={isSubmitting}
//             />
//           </div>

//           {/* ═══════════════════════════════════════════
//               SECTION 4: OVERALL COMMENTS
//              ═══════════════════════════════════════════ */}
//           <div>
//             <label
//               style={{
//                 display: "block",
//                 fontSize: 11.5,
//                 fontWeight: 600,
//                 color: "#0F172A",
//                 marginBottom: 6,
//               }}
//             >
//               Overall Feedback
//               {!readOnly && (
//                 <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
//               )}
//             </label>

//             {readOnly ? (
//               <div
//                 style={{
//                   width: "100%",
//                   border: "1px solid #E2E8F0",
//                   borderRadius: 8,
//                   padding: "10px 12px",
//                   fontFamily: "Sora,sans-serif",
//                   fontSize: 12.5,
//                   lineHeight: 1.6,
//                   color: "#0F172A",
//                   background: "#F8FAFC",
//                   minHeight: 60,
//                   boxSizing: "border-box",
//                   whiteSpace: "pre-wrap",
//                 }}
//               >
//                 {overallComments || "No feedback provided."}
//               </div>
//             ) : (
//               <>
//                 <textarea
//                   value={overallComments}
//                   onChange={(e) => setOverallComments(e.target.value)}
//                   onBlur={() => setTouched(true)}
//                   placeholder="Share your overall assessment of the task — summary of all areas…"
//                   disabled={isSubmitting}
//                   rows={3}
//                   style={{
//                     width: "100%",
//                     border: `1px solid ${
//                       touched && overallComments.trim().length < 5
//                         ? "#FCA5A5"
//                         : "#CBD5E1"
//                     }`,
//                     borderRadius: 8,
//                     padding: "10px 12px",
//                     fontFamily: "Sora,sans-serif",
//                     fontSize: 12.5,
//                     outline: "none",
//                     boxSizing: "border-box",
//                     resize: "vertical",
//                     minHeight: 70,
//                     lineHeight: 1.5,
//                     background: isSubmitting ? "#F8FAFC" : "#fff",
//                   }}
//                 />
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     marginTop: 6,
//                     fontSize: 10.5,
//                     color:
//                       touched && overallComments.trim().length < 5
//                         ? "#DC2626"
//                         : "#94A3B8",
//                   }}
//                 >
//                   <span>
//                     {touched && overallComments.trim().length < 5
//                       ? "⚠ Overall feedback must be at least 5 characters"
//                       : "Summarize your overall assessment"}
//                   </span>
//                   <span
//                     style={{
//                       fontFamily: "'JetBrains Mono', monospace",
//                       color:
//                         overallComments.trim().length > 0
//                           ? "#475569"
//                           : "#CBD5E1",
//                     }}
//                   >
//                     {overallComments.trim().length} chars
//                   </span>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>

//         {/* ── Footer ── */}
//         <div
//           style={{
//             padding: "12px 20px 16px",
//             borderTop: "1px solid #E2E8F0",
//             display: "flex",
//             justifyContent: "flex-end",
//             gap: 8,
//             background: "#FAFBFC",
//             flexShrink: 0,
//           }}
//         >
//           {readOnly ? (
//             <button
//               onClick={onClose}
//               style={{
//                 ...btnStyle,
//                 display: "inline-flex",
//                 alignItems: "center",
//                 gap: 5,
//               }}
//             >
//               <X size={13} />
//               Close
//             </button>
//           ) : (
//             <>
//               <button
//                 onClick={onClose}
//                 disabled={isSubmitting}
//                 style={{
//                   ...btnStyle,
//                   display: "inline-flex",
//                   alignItems: "center",
//                   gap: 5,
//                   opacity: isSubmitting ? 0.5 : 1,
//                   cursor: isSubmitting ? "not-allowed" : "pointer",
//                 }}
//               >
//                 <X size={13} />
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={!isValid || isSubmitting}
//                 style={{
//                   ...btnStyle,
//                   background: isValid ? "#15803D" : "#F1F5F9",
//                   color: isValid ? "#fff" : "#94A3B8",
//                   borderColor: isValid ? "#15803D" : "#E2E8F0",
//                   display: "inline-flex",
//                   alignItems: "center",
//                   gap: 6,
//                   opacity: isSubmitting ? 0.6 : 1,
//                   cursor: !isValid || isSubmitting ? "not-allowed" : "pointer",
//                   boxShadow: isValid
//                     ? "0 2px 6px rgba(21,128,61,0.25)"
//                     : "none",
//                 }}
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2
//                       size={14}
//                       style={{ animation: "spin 1s linear infinite" }}
//                     />
//                     Submitting...
//                   </>
//                 ) : (
//                   <>
//                     <Star size={14} />
//                     Submit & Finish
//                   </>
//                 )}
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

function ProjectCloseModal({
  project,
  rows,
  onClose,
  onConfirm,
  isSubmitting = false,
  readOnly = false,
  savedFeedback = null,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);
  // ── Only top-level tasks (no sub-tasks) ──
  const topLevelRows = useMemo(() => rows.filter((r) => !r.parentId), [rows]);

  // ── Compute per-resource averages ──
  const resourceStats = useMemo(() => {
    const map = {};

    topLevelRows.forEach((r) => {
      if (!r.resource) return;
      const key = r.resource;
      if (!map[key]) {
        map[key] = {
          userId: key,
          name: r.resourceName || key,
          taskCount: 0,
          totalTime: 0,
          totalFulfillment: 0,
          totalInnovation: 0,
          ratedCount: 0,
        };
      }
      map[key].taskCount += 1;

      if (r.timeEfficiencyRating && r.fulfillmentRating && r.innovationRating) {
        map[key].totalTime += r.timeEfficiencyRating;
        map[key].totalFulfillment += r.fulfillmentRating;
        map[key].totalInnovation += r.innovationRating;
        map[key].ratedCount += 1;
      }
    });

    return Object.values(map).map((s) => ({
      ...s,
      avgTime:
        s.ratedCount > 0
          ? Math.round((s.totalTime / s.ratedCount) * 10) / 10
          : 0,
      avgFulfillment:
        s.ratedCount > 0
          ? Math.round((s.totalFulfillment / s.ratedCount) * 10) / 10
          : 0,
      avgInnovation:
        s.ratedCount > 0
          ? Math.round((s.totalInnovation / s.ratedCount) * 10) / 10
          : 0,
    }));
  }, [topLevelRows]);

  // ── Compute total benchmark vs actual duration (top-level only) ──
  const totalBenchmarkHrs = useMemo(() => {
    return topLevelRows.reduce((sum, r) => {
      const planned = r.durationHrs || 0;
      return sum + Number(planned);
    }, 0);
  }, [topLevelRows]);

  const totalActualHrs = useMemo(() => {
    return topLevelRows.reduce((sum, r) => {
      const pStart = r.actualStart ? new Date(r.actualStart) : null;
      const pStop = r.actualStop ? new Date(r.actualStop) : null;
      if (pStart && pStop && !isNaN(pStart) && !isNaN(pStop)) {
        return sum + (pStop.getTime() - pStart.getTime()) / (1000 * 60 * 60);
      }
      if (r.actualElapsedHrs) return sum + Math.abs(Number(r.actualElapsedHrs));
      return sum;
    }, 0);
  }, [topLevelRows]);

  const totalBenchmarkRounded = Math.round(totalBenchmarkHrs * 100) / 100;
  const totalActualRounded = Math.round(totalActualHrs * 100) / 100;

  const fmtHrMin = (hrs) => {
    if (hrs === null || hrs === undefined || isNaN(hrs)) return "—";
    const totalMinutes = Math.round(Math.abs(hrs) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const sign = hrs < 0 ? "-" : "";
    if (h === 0) return `${sign}${m}m`;
    if (m === 0) return `${sign}${h}h`;
    return `${sign}${h}h ${m}m`;
  };

  // ── Efficiency ──
  const efficiencyPercent =
    totalBenchmarkRounded > 0
      ? Math.round(
          ((totalActualRounded - totalBenchmarkRounded) /
            totalBenchmarkRounded) *
            100,
        )
      : 0;
  const isAhead = efficiencyPercent < 0;
  const isOnTime = efficiencyPercent === 0;

  // ── Auto-suggest: Time Efficiency ──
  const suggestTimeRating = () => {
    if (
      !totalBenchmarkRounded ||
      totalBenchmarkRounded <= 0 ||
      !totalActualRounded
    )
      return 5;
    const ratio = totalActualRounded / totalBenchmarkRounded;
    if (ratio <= 0.8) return 10;
    if (ratio <= 0.9) return 9;
    if (ratio <= 1.0) return 8;
    if (ratio <= 1.1) return 7;
    if (ratio <= 1.2) return 6;
    if (ratio <= 1.4) return 5;
    if (ratio <= 1.6) return 4;
    if (ratio <= 1.8) return 3;
    if (ratio <= 2.0) return 2;
    return 1;
  };

  // ── Auto-suggest: Fulfillment (avg of resource averages) ──
  const suggestFulfillmentRating = () => {
    const rated = resourceStats.filter((s) => s.ratedCount > 0);
    if (rated.length === 0) return 5;
    const avg =
      rated.reduce((sum, s) => sum + s.avgFulfillment, 0) / rated.length;
    return Math.round(avg);
  };

  // ── State ──
  const [timeRating, setTimeRating] = useState(
    readOnly && savedFeedback
      ? savedFeedback.timeEfficiencyRating || 0
      : suggestTimeRating(),
  );
  const [fulfillmentRating, setFulfillmentRating] = useState(
    readOnly && savedFeedback
      ? savedFeedback.fulfillmentRating || 0
      : suggestFulfillmentRating(),
  );
  const [innovationRating, setInnovationRating] = useState(
    readOnly && savedFeedback ? savedFeedback.innovationRating || 0 : 0,
  );
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverFulfillment, setHoverFulfillment] = useState(0);
  const [hoverInnovation, setHoverInnovation] = useState(0);

  const [timeComments, setTimeComments] = useState(
    readOnly && savedFeedback ? savedFeedback.timeEfficiencyComments || "" : "",
  );
  const [fulfillmentComments, setFulfillmentComments] = useState(
    readOnly && savedFeedback ? savedFeedback.fulfillmentComments || "" : "",
  );
  const [innovationComments, setInnovationComments] = useState(
    readOnly && savedFeedback ? savedFeedback.innovationComments || "" : "",
  );
  const [overallComments, setOverallComments] = useState(
    readOnly && savedFeedback ? savedFeedback.overallComments || "" : "",
  );
  const [touched, setTouched] = useState(false);
  // ── Per-resource project-level ratings ──
  const [resourceRatings, setResourceRatings] = useState(() => {
    const initial = {};

    if (readOnly && savedFeedback?.resourceRatings) {
      // Load from saved feedback
      savedFeedback.resourceRatings.forEach((r) => {
        initial[r.userId] = {
          rating: r.rating || 0,
          comments: r.comments || "",
        };
      });
      // Fill any missing resources
      resourceStats.forEach((s) => {
        if (!initial[s.userId]) {
          initial[s.userId] = { rating: 0, comments: "" };
        }
      });
    } else {
      // Editable mode — suggest from task averages
      resourceStats.forEach((s) => {
        const overallAvg =
          s.ratedCount > 0
            ? Math.round(
                ((s.avgTime + s.avgFulfillment + s.avgInnovation) / 3) * 10,
              ) / 10
            : 0;
        initial[s.userId] = {
          rating: overallAvg > 0 ? Math.round(overallAvg) : 0,
          comments: "",
        };
      });
    }

    return initial;
  });

  const [resourceHovers, setResourceHovers] = useState({});
  const allResourcesRated = resourceStats.every(
    (s) => resourceRatings[s.userId]?.rating > 0,
  );

  const isValid =
    timeRating > 0 &&
    fulfillmentRating > 0 &&
    innovationRating > 0 &&
    allResourcesRated &&
    overallComments.trim().length >= 5;
  // ── Labels ──
  const timeLabels = {
    1: "Very Poor — Project took 2x+ longer than planned",
    2: "Poor — Significant project delay",
    3: "Below Average — Notable time overrun",
    4: "Slightly Below — Moderate delays",
    5: "Average — Some delays across tasks",
    6: "Slightly Above — Minor delays overall",
    7: "Good — Most tasks on time",
    8: "Very Good — Project completed on time",
    9: "Excellent — Ahead of schedule",
    10: "Outstanding — Well ahead of schedule",
  };

  const fulfillmentLabels = {
    1: "Unacceptable — Major quality failures across team",
    2: "Very Poor — Extensive rework needed",
    3: "Poor — Significant quality issues",
    4: "Below Average — Notable gaps",
    5: "Average — Acceptable overall",
    6: "Slightly Above — Minor issues",
    7: "Good — Meets most expectations",
    8: "Very Good — Meets all expectations",
    9: "Excellent — Exceeds expectations",
    10: "Outstanding — Exceptional quality across all tasks",
  };

  const innovationLabels = {
    1: "No Innovation — Routine execution only",
    2: "Minimal — Very little creative input",
    3: "Below Average — Standard approach",
    4: "Slightly Below — Some effort but conventional",
    5: "Average — Standard with minor improvements",
    6: "Slightly Above — Some creative solutions",
    7: "Good — Noticeable innovative thinking",
    8: "Very Good — Creative problem-solving",
    9: "Excellent — Significant innovation",
    10: "Outstanding — Exceptional creativity",
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid) return;
    await onConfirm({
      timeEfficiencyRating: timeRating,
      timeEfficiencyComments: timeComments.trim(),
      fulfillmentRating,
      fulfillmentComments: fulfillmentComments.trim(),
      innovationRating,
      innovationComments: innovationComments.trim(),
      overallComments: overallComments.trim(),
      resourceRatings: resourceStats.map((s) => ({
        userId: s.userId,
        name: s.name,
        rating: resourceRatings[s.userId]?.rating || 0,
        comments: (resourceRatings[s.userId]?.comments || "").trim(),
        avgTimeFromTasks: s.avgTime,
        avgFulfillmentFromTasks: s.avgFulfillment,
        avgInnovationFromTasks: s.avgInnovation,
      })),
    });
  };
  // ── Rating color helper ──
  const ratingColor = (val) => {
    if (val <= 0)
      return { bg: t.bgMuted, color: t.textFaint, border: t.border };
    if (val <= 3) return { bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5" };
    if (val <= 5) return { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" };
    if (val <= 7) return { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" };
    return { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" };
  };

  // ── Unrated task count ──
  const unratedCount = topLevelRows.filter(
    (r) =>
      !r.timeEfficiencyRating || !r.fulfillmentRating || !r.innovationRating,
  ).length;
  const finishedCount = topLevelRows.filter(
    (r) =>
      String(r.status || "")
        .toLowerCase()
        .trim() === "finished",
  ).length;

  return (
    <div
      onClick={(e) =>
        e.target === e.currentTarget && !isSubmitting && onClose()
      }
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 720,
          maxHeight: "92vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: t.textPrimary,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: readOnly ? t.violetBg : t.dangerBgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: readOnly ? t.violetBg : t.dangerBg,
              color: readOnly ? t.violet : t.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {readOnly ? (
              <Star size={20} strokeWidth={2} fill={t.violet} />
            ) : (
              <XCircle size={20} strokeWidth={2} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {readOnly ? "Project Feedback" : "Close Project"}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project || "Untitled Project"}
            </div>
          </div>

          {readOnly && (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                background: t.violetBg,
                color: t.violet,
                border: `1px solid ${t.violetBorder}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Read Only
            </span>
          )}

          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSubmitting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Warning banner */}
          {!readOnly && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: 10,
                background: t.dangerBgSubtle,
                border: `1px solid ${t.dangerBorder}`,
                borderRadius: 8,
                marginBottom: 18,
              }}
            >
              <AlertOctagon
                size={16}
                color={t.danger}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div
                style={{
                  fontSize: 11.5,
                  color: t.dangerTextDeep,
                  lineHeight: 1.5,
                }}
              >
                This will permanently <strong>close</strong> the project. All
                tasks will be finalized. This action cannot be undone.
              </div>
            </div>
          )}

          {/* Unrated tasks warning */}
          {unratedCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: 10,
                background: t.warningBgSubtle,
                border: `1px solid ${t.warningBorder}`,
                borderRadius: 8,
                marginBottom: 18,
              }}
            >
              <AlertTriangle
                size={16}
                color={t.warning}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div
                style={{ fontSize: 11.5, color: t.warning, lineHeight: 1.5 }}
              >
                <strong>{unratedCount}</strong> of {topLevelRows.length}{" "}
                top-level task
                {topLevelRows.length !== 1 ? "s" : ""} have not been rated yet.
                ({finishedCount} finished, {topLevelRows.length - finishedCount}{" "}
                remaining).
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              SECTION 0: PER-RESOURCE AVERAGE RATINGS
             ═══════════════════════════════════════════ */}
          {false && (
            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: 16,
                marginBottom: 18,
                background: "#FAFBFC",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#DBEAFE",
                    color: "#1D4ED8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={14} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12.5,
                      color: "#0F172A",
                    }}
                  >
                    Resource Performance Summary
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B" }}>
                    Average ratings per resource from individual task feedback
                  </div>
                </div>
              </div>

              {resourceStats.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#94A3B8",
                    fontSize: 12,
                  }}
                >
                  No resources assigned to tasks.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 11.5,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#F8FAFC" }}>
                        {[
                          "Resource",
                          "Tasks",
                          "Rated",
                          "Avg Time",
                          "Avg Fulfillment",
                          "Avg Innovation",
                          "Overall Avg",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "8px 10px",
                              textAlign: h === "Resource" ? "left" : "center",
                              fontWeight: 600,
                              color: "#64748B",
                              fontSize: 10,
                              letterSpacing: "0.4px",
                              textTransform: "uppercase",
                              borderBottom: "1px solid #E2E8F0",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resourceStats.map((s) => {
                        const overallAvg =
                          s.ratedCount > 0
                            ? Math.round(
                                ((s.avgTime +
                                  s.avgFulfillment +
                                  s.avgInnovation) /
                                  3) *
                                  10,
                              ) / 10
                            : 0;
                        const oc = ratingColor(overallAvg);

                        return (
                          <tr
                            key={s.userId}
                            style={{ borderBottom: "1px solid #F1F5F9" }}
                          >
                            <td
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#0F172A",
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <div>{s.name}</div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#94A3B8",
                                  fontWeight: 400,
                                  fontFamily: "'JetBrains Mono',monospace",
                                }}
                              >
                                {s.userId}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "8px 10px",
                                textAlign: "center",
                              }}
                            >
                              {s.taskCount}
                            </td>
                            <td
                              style={{
                                padding: "8px 10px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  color:
                                    s.ratedCount === s.taskCount
                                      ? "#15803D"
                                      : "#B45309",
                                  fontWeight: 600,
                                }}
                              >
                                {s.ratedCount}/{s.taskCount}
                              </span>
                            </td>
                            {[s.avgTime, s.avgFulfillment, s.avgInnovation].map(
                              (val, i) => {
                                const c = ratingColor(val);
                                return (
                                  <td
                                    key={i}
                                    style={{
                                      padding: "8px 10px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: c.bg,
                                        color: c.color,
                                        border: `1px solid ${c.border}`,
                                        fontFamily:
                                          "'JetBrains Mono',monospace",
                                      }}
                                    >
                                      {val > 0 ? val.toFixed(1) : "—"}
                                    </span>
                                  </td>
                                );
                              },
                            )}
                            <td
                              style={{
                                padding: "8px 10px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  background: oc.bg,
                                  color: oc.color,
                                  border: `1.5px solid ${oc.border}`,
                                  fontFamily: "'JetBrains Mono',monospace",
                                }}
                              >
                                {overallAvg > 0 ? overallAvg.toFixed(1) : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* ═══════════════════════════════════════════
    SECTION 0.5: PER-RESOURCE PROJECT RATINGS
   ═══════════════════════════════════════════ */}
          {resourceStats.length > 0 && (
            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: 16,
                marginBottom: 18,
                background: "#FAFBFC",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FCE7F3",
                    color: "#BE185D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Star size={14} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12.5,
                      color: "#0F172A",
                    }}
                  >
                    Rate Each Resource
                    <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B" }}>
                    Based on the task-level averages above, give a final
                    project-level rating to each resource
                  </div>
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {resourceStats.map((s) => {
                  const overallAvg =
                    s.ratedCount > 0
                      ? Math.round(
                          ((s.avgTime + s.avgFulfillment + s.avgInnovation) /
                            3) *
                            10,
                        ) / 10
                      : 0;
                  const rc = ratingColor(overallAvg);
                  const currentRating = resourceRatings[s.userId]?.rating || 0;
                  const currentComments =
                    resourceRatings[s.userId]?.comments || "";
                  const currentHover = resourceHovers[s.userId] || 0;

                  return (
                    <div
                      key={s.userId}
                      style={{
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        padding: 14,
                        background: "#fff",
                      }}
                    >
                      {/* Resource header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#DBEAFE",
                            color: "#1D4ED8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {(s.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 12.5,
                              color: "#0F172A",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#94A3B8",
                              fontFamily: "'JetBrains Mono',monospace",
                            }}
                          >
                            {s.userId}
                          </div>
                        </div>

                        {/* Task-level avg reference */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "#64748B",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Task Avg:
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              background: rc.bg,
                              color: rc.color,
                              border: `1px solid ${rc.border}`,
                              fontFamily: "'JetBrains Mono',monospace",
                            }}
                          >
                            {overallAvg > 0 ? overallAvg.toFixed(1) : "—"}
                          </span>
                        </div>

                        {/* Mini stats */}
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            fontSize: 9.5,
                            color: "#94A3B8",
                          }}
                        >
                          {[
                            { label: "T", val: s.avgTime },
                            { label: "F", val: s.avgFulfillment },
                            { label: "I", val: s.avgInnovation },
                          ].map(({ label, val }) => (
                            <span
                              key={label}
                              title={
                                label === "T"
                                  ? "Avg Time Efficiency"
                                  : label === "F"
                                    ? "Avg Fulfillment"
                                    : "Avg Innovation"
                              }
                              style={{
                                padding: "1px 5px",
                                borderRadius: 3,
                                background: "#F1F5F9",
                                border: "1px solid #E2E8F0",
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 9,
                                fontWeight: 600,
                                cursor: "help",
                              }}
                            >
                              {label}:{val > 0 ? val.toFixed(1) : "—"}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Suggested badge */}
                      {overallAvg > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 8,
                            padding: "4px 10px",
                            background: "#F0F9FF",
                            border: "1px solid #BAE6FD",
                            borderRadius: 6,
                            fontSize: 10.5,
                            color: "#0369A1",
                          }}
                        >
                          <Info size={11} />
                          <span>
                            Suggested:{" "}
                            <strong>{Math.round(overallAvg)}/10</strong> based
                            on task averages ({s.ratedCount}/{s.taskCount}{" "}
                            rated)
                          </span>
                          <button
                            onClick={() =>
                              setResourceRatings((prev) => ({
                                ...prev,
                                [s.userId]: {
                                  ...prev[s.userId],
                                  rating: Math.round(overallAvg),
                                },
                              }))
                            }
                            style={{
                              marginLeft: "auto",
                              background: "#1D4ED8",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      )}

                      {/* Rating bar */}
                      <RatingBar
                        value={currentRating}
                        hover={currentHover}
                        onChange={(val) =>
                          setResourceRatings((prev) => ({
                            ...prev,
                            [s.userId]: { ...prev[s.userId], rating: val },
                          }))
                        }
                        onHover={(val) =>
                          setResourceHovers((prev) => ({
                            ...prev,
                            [s.userId]: val,
                          }))
                        }
                        onLeave={() =>
                          setResourceHovers((prev) => ({
                            ...prev,
                            [s.userId]: 0,
                          }))
                        }
                        disabled={readOnly || isSubmitting}
                      />

                      {touched && currentRating === 0 && (
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#DC2626",
                            marginTop: 4,
                          }}
                        >
                          ⚠ Please rate {s.name}
                        </div>
                      )}

                      {/* Comment */}
                      <CommentField
                        label={`Comments for ${s.name}`}
                        value={currentComments}
                        onChange={(val) =>
                          setResourceRatings((prev) => ({
                            ...prev,
                            [s.userId]: { ...prev[s.userId], comments: val },
                          }))
                        }
                        placeholder={`Project-level feedback for ${s.name}…`}
                        readOnly={readOnly}
                        disabled={readOnly || isSubmitting}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* ═══════════════════════════════════════════
              SECTION 1: TIME EFFICIENCY
             ═══════════════════════════════════════════ */}
          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 16,
              marginBottom: 18,
              background: "#FAFBFC",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#DBEAFE",
                  color: "#1D4ED8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={14} />
              </div>
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}
                >
                  Project Time Efficiency
                  <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#64748B" }}>
                  Overall time efficiency across all top-level tasks (sub-tasks
                  excluded)
                </div>
              </div>
            </div>

            {/* Duration Comparison */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "#DBEAFE",
                  border: "1px solid #93C5FD",
                  borderRadius: 7,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: "#1D4ED8",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: 2,
                  }}
                >
                  Total Benchmark
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1E40AF",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {fmtHrMin(totalBenchmarkRounded)}
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                  {topLevelRows.length} task
                  {topLevelRows.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: isAhead
                    ? "#DCFCE7"
                    : isOnTime
                      ? "#DBEAFE"
                      : "#FEF3C7",
                  border: `1px solid ${
                    isAhead ? "#86EFAC" : isOnTime ? "#93C5FD" : "#FCD34D"
                  }`,
                  borderRadius: 7,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: isAhead
                      ? "#15803D"
                      : isOnTime
                        ? "#1D4ED8"
                        : "#B45309",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: 2,
                  }}
                >
                  Total Actual
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: isAhead
                      ? "#166534"
                      : isOnTime
                        ? "#1E40AF"
                        : "#92400E",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {fmtHrMin(totalActualRounded)}
                </div>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  background: isAhead
                    ? "#DCFCE7"
                    : isOnTime
                      ? "#F0F9FF"
                      : "#FEE2E2",
                  border: `1px solid ${
                    isAhead ? "#86EFAC" : isOnTime ? "#BAE6FD" : "#FCA5A5"
                  }`,
                  borderRadius: 7,
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: "#64748B",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: 2,
                  }}
                >
                  Variance
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: isAhead
                      ? "#15803D"
                      : isOnTime
                        ? "#1D4ED8"
                        : "#DC2626",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {isAhead ? "" : isOnTime ? "" : "+"}
                  {efficiencyPercent}%
                </div>
              </div>
            </div>

            {/* Suggested badge */}
            {!readOnly && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  padding: "5px 10px",
                  background: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: 6,
                  fontSize: 10.5,
                  color: "#0369A1",
                }}
              >
                <Info size={12} />
                <span>
                  Suggested rating: <strong>{suggestTimeRating()}/10</strong>{" "}
                  based on{" "}
                  {efficiencyPercent === 0
                    ? "on-time delivery"
                    : isAhead
                      ? `${Math.abs(efficiencyPercent)}% ahead of schedule`
                      : `${efficiencyPercent}% over planned time`}
                </span>
                <button
                  onClick={() => setTimeRating(suggestTimeRating())}
                  style={{
                    marginLeft: "auto",
                    background: "#1D4ED8",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            )}
            <RatingBar
              value={timeRating}
              hover={hoverTime}
              onChange={setTimeRating}
              onHover={setHoverTime}
              onLeave={() => setHoverTime(0)}
              disabled={readOnly || isSubmitting}
            />
            <div
              style={{
                fontSize: 10.5,
                color: "#64748B",
                fontStyle: "italic",
                marginTop: 6,
                minHeight: 14,
              }}
            >
              {timeLabels[hoverTime || timeRating] || "Select a rating"}
            </div>
            {touched && timeRating === 0 && (
              <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 4 }}>
                ⚠ Please rate time efficiency
              </div>
            )}

            <CommentField
              label="Time Efficiency Comments"
              value={timeComments}
              onChange={setTimeComments}
              placeholder="Comments on overall project time management…"
              readOnly={readOnly}
              disabled={readOnly || isSubmitting}
            />
          </div>

          {/* ═══════════════════════════════════════════
              SECTION 2: LEVEL OF FULFILLMENT
             ═══════════════════════════════════════════ */}
          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 16,
              marginBottom: 18,
              background: "#FAFBFC",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#EDE9FE",
                  color: "#7C3AED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={14} />
              </div>
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}
                >
                  Project Fulfillment
                  <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#64748B" }}>
                  Overall quality and completeness based on per-resource
                  performance above
                </div>
              </div>
            </div>

            {/* Suggested badge */}
            {!readOnly && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  padding: "5px 10px",
                  background: "#F5F3FF",
                  border: "1px solid #DDD6FE",
                  borderRadius: 6,
                  fontSize: 10.5,
                  color: "#5B21B6",
                }}
              >
                <Info size={12} />
                <span>
                  Suggested rating:{" "}
                  <strong>{suggestFulfillmentRating()}/10</strong> based on
                  average resource fulfillment scores
                </span>
                <button
                  onClick={() =>
                    setFulfillmentRating(suggestFulfillmentRating())
                  }
                  style={{
                    marginLeft: "auto",
                    background: "#7C3AED",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            )}
            <RatingBar
              value={fulfillmentRating}
              hover={hoverFulfillment}
              onChange={setFulfillmentRating}
              onHover={setHoverFulfillment}
              onLeave={() => setHoverFulfillment(0)}
              disabled={readOnly || isSubmitting}
            />
            <div
              style={{
                fontSize: 10.5,
                color: "#64748B",
                fontStyle: "italic",
                marginTop: 6,
                minHeight: 14,
              }}
            >
              {fulfillmentLabels[hoverFulfillment || fulfillmentRating] ||
                "Select a rating"}
            </div>
            {touched && fulfillmentRating === 0 && (
              <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 4 }}>
                ⚠ Please rate level of fulfillment
              </div>
            )}

            <CommentField
              label="Fulfillment Comments"
              value={fulfillmentComments}
              onChange={setFulfillmentComments}
              placeholder="Comments on overall project quality…"
              readOnly={readOnly}
              disabled={readOnly || isSubmitting}
            />
          </div>

          {/* ═══════════════════════════════════════════
              SECTION 3: LEVEL OF INNOVATION
             ═══════════════════════════════════════════ */}
          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 16,
              marginBottom: 18,
              background: "#FAFBFC",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#FEF3C7",
                  color: "#B45309",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lightbulb size={14} />
              </div>
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}
                >
                  Project Innovation
                  <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#64748B" }}>
                  Overall creative and innovative effort across the project
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
                padding: "5px 10px",
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 6,
                fontSize: 10.5,
                color: "#92400E",
              }}
            >
              <Info size={12} />
              <span>
                Subjective assessment — rate based on your overall observation
                of innovation across the project.
              </span>
            </div>

            <RatingBar
              value={innovationRating}
              hover={hoverInnovation}
              onChange={setInnovationRating}
              onHover={setHoverInnovation}
              onLeave={() => setHoverInnovation(0)}
              disabled={readOnly || isSubmitting}
            />
            <div
              style={{
                fontSize: 10.5,
                color: "#64748B",
                fontStyle: "italic",
                marginTop: 6,
                minHeight: 14,
              }}
            >
              {innovationLabels[hoverInnovation || innovationRating] ||
                "Select a rating"}
            </div>
            {touched && innovationRating === 0 && (
              <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 4 }}>
                ⚠ Please rate level of innovation
              </div>
            )}

            <CommentField
              label="Innovation Comments"
              value={innovationComments}
              onChange={setInnovationComments}
              placeholder="Comments on creative solutions, novel approaches at project level…"
              readOnly={readOnly}
              disabled={readOnly || isSubmitting}
            />
          </div>

          {/* ═══════════════════════════════════════════
              SECTION 4: OVERALL COMMENTS
             ═══════════════════════════════════════════ */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#0F172A",
                marginBottom: 6,
              }}
            >
              Overall Project Feedback
              <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>
            </label>
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Summarize your overall assessment of the project — delivery, quality, team performance…"
              disabled={readOnly || isSubmitting}
              rows={4}
              style={{
                width: "100%",
                border: `1px solid ${
                  touched && overallComments.trim().length < 5
                    ? "#FCA5A5"
                    : "#CBD5E1"
                }`,
                borderRadius: 8,
                padding: "10px 12px",
                fontFamily: "Sora,sans-serif",
                fontSize: 12.5,
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                minHeight: 80,
                lineHeight: 1.5,
                background: readOnly || isSubmitting ? "#F8FAFC" : "#fff",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
                fontSize: 10.5,
                color:
                  touched && overallComments.trim().length < 5
                    ? "#DC2626"
                    : "#94A3B8",
              }}
            >
              <span>
                {touched && overallComments.trim().length < 5
                  ? "⚠ Overall feedback must be at least 5 characters"
                  : "Summarize your overall project assessment"}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color:
                    overallComments.trim().length > 0 ? "#475569" : "#CBD5E1",
                }}
              >
                {overallComments.trim().length} chars
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          {readOnly ? (
            <button
              onClick={onClose}
              style={{
                ...btnStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <X size={13} /> Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  ...btnStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  opacity: isSubmitting ? 0.5 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                style={{
                  ...btnStyle,
                  background: isValid ? t.danger : t.bgMuted,
                  color: isValid ? t.textInverse : t.textFaint,
                  borderColor: isValid ? t.danger : t.border,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: !isValid || isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Closing...
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    Close Project
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
/* ─── Activity Row ─── */
const ActivityRow = React.memo(function ActivityRow({
  draft,
  row,
  idx,
  isFirstInChain,
  resources,
  groupResources,
  hasChildren,
  moduleColor,
  isOverlapping,
  parentRow,
  autoCalculate, // ← NEW
  onUpdate,
  onDelete,
  onAddSub,
  onAddRowBelow,
  onOpenComments,
  onRedoReject,
  onFeedback,
}) {
  const { t } = useTheme();
  const inputStyle = makeInputStyle(t);
  const iconBtn = makeIconBtn(t);

  const res = row.resource
    ? resources.find((r) => r.userId === row.resource)
    : null;
  const startDisplay = row.plannedStart ? fmtDisplay(row.plannedStart) : "";
  const stopDisplay = row.plannedStop ? fmtDisplay(row.plannedStop) : "";
  const commentCount = row.commentCount || 0;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false); // ← ADD THIS
  const dateBtnRef = useRef(null);
  const isPastStart = row.plannedStart
    ? new Date(parseISODateTime(row.plannedStart)) < new Date()
    : false;

  const handleField = (field, value) => {
    const TEXT_ONLY_FIELDS = ["module", "task"];
    const needsRecompute = !TEXT_ONLY_FIELDS.includes(field);

    const updated = {
      ...row,
      [field]:
        field === "durationHrs" ? (value === "" ? "" : Number(value)) : value,
    };

    if (field === "resource" && value && !row.plannedStart) {
      try {
        const dt = defaultFirstStart(value, groupResources || {});
        if (dt instanceof Date && !isNaN(dt)) {
          updated.plannedStart = isoDateTime(dt);
          if (updated.durationHrs) {
            const stop = addWorkHours(
              dt,
              Number(updated.durationHrs),
              value,
              groupResources || {},
            );
            updated.plannedStop = isoDateTime(stop);
          }
        }
      } catch (e) {}
    }

    onUpdate(updated, { recompute: needsRecompute });
  };

  // Depth-based cell background (theme-aware)
  const cellBg = isOverlapping
    ? t.dangerBgSubtle
    : row.sortOrder === 0
      ? t.bgCard
      : row.sortOrder === 1
        ? t.bgSubtle
        : row.sortOrder === 2
          ? t.violetBg
          : t.bgMuted;

  const tdStyle = {
    padding: "8px 10px",
    borderBottom: `1px solid ${t.borderSubtle}`,
    background: cellBg,
    verticalAlign: "middle",
    fontSize: 12.5,
    color: t.textPrimary,
  };

  const statusLower = String(row.status || "pending")
    .toLowerCase()
    .trim();
  const isCompleted = statusLower === "completed";
  const isRowPending = !row.status || statusLower === "pending";
  const isParentNotPending = parentRow
    ? String(parentRow.status || "pending")
        .toLowerCase()
        .trim() !== "pending"
    : false;
  const isLockedByParent = !!row.parentId && isParentNotPending;
  const isLocked = !isPending(row) || isLockedByParent;

  return (
    <tr
      style={{
        transition: "background .12s",
        background: isOverlapping ? t.dangerBgSubtle : "transparent",
        boxShadow: isOverlapping ? `inset 3px 0 0 0 ${t.danger}` : "none",
      }}
    >
      {/* # */}
      <td
        style={{
          ...tdStyle,
          textAlign: "center",
          color: isOverlapping ? t.danger : t.textFaint,
          fontWeight: 600,
          width: 44,
          fontSize: 11,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          {isOverlapping && (
            <span
              title="⚠ Resource overlap detected"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: t.danger,
                flexShrink: 0,
                animation: "pulse 1.5s infinite",
              }}
            />
          )}
          <span>{row.sortOrder === 0 ? idx : ""}</span>
        </div>
      </td>

      {/* Module */}
      {/* Module */}
      <td style={{ ...tdStyle, width: 160 }}>
        {row.module && !isEditingModule ? (
          <span
            onClick={() => !isLocked && setIsEditingModule(true)}
            title={
              isLocked
                ? isLockedByParent
                  ? "Locked — parent task is not pending"
                  : "Locked — task not pending"
                : `${row.module} (click to edit)`
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              background: moduleColor.bg,
              color: moduleColor.color,
              border: `1px solid ${moduleColor.border}`,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.65 : 1,
            }}
          >
            {row.module}
          </span>
        ) : !isLocked ? (
          <ModuleInput
            initialValue={row.module || ""}
            onCommit={(val) => {
              handleField("module", val);
              setIsEditingModule(false);
            }}
            onCancel={() => setIsEditingModule(false)}
          />
        ) : (
          // placeholder for locked empty modules
          <span
            style={{ fontSize: 11, color: t.textFaint, fontStyle: "italic" }}
          >
            — no module —
          </span>
        )}
      </td>

      {/* Task */}
      <td style={{ ...tdStyle, width: 260 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {row.sortOrder > 0 && (
            <span
              style={{
                display: "inline-block",
                width: row.sortOrder * 18,
                flexShrink: 0,
              }}
            />
          )}
          {row.sortOrder > 0 && (
            <span
              style={{
                color: t.textFaint,
                fontFamily: "monospace",
                fontSize: 13,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              <CornerDownRight
                size={13}
                color={t.textFaint}
                style={{ flexShrink: 0 }}
              />
            </span>
          )}
          {row.sortOrder > 0 && (
            <span
              style={{
                background:
                  row.sortOrder === 1
                    ? t.violetBg
                    : row.sortOrder === 2
                      ? "#FCE7F3"
                      : t.warningBg,
                color:
                  row.sortOrder === 1
                    ? t.violet
                    : row.sortOrder === 2
                      ? "#BE185D"
                      : t.warning,
                border: `1px solid ${row.sortOrder === 1 ? t.violetBorder : row.sortOrder === 2 ? "#F9A8D4" : t.warningBorder}`,
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: 9,
                fontWeight: 700,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              title={`Level ${row.sortOrder} sub-activity`}
            >
              L{row.sortOrder}
            </span>
          )}

          <input
            value={row.task || ""}
            onChange={(e) => !isLocked && handleField("task", e.target.value)}
            disabled={isLocked}
            title={
              isLocked
                ? isLockedByParent
                  ? "Locked — parent task is not pending"
                  : "Locked — task not pending"
                : row.task || "" // ← show full task text on hover
            }
            style={{
              ...inputStyle,
              height: 28,
              fontSize: 11.5,
              flex: 1,
              minWidth: 0,
              opacity: isLocked ? 0.65 : 1,
              cursor: isLocked ? "not-allowed" : "text",
            }}
          />
        </div>
      </td>

      {/* Resource */}
      <td style={{ ...tdStyle, width: 240 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            opacity: isLocked ? 0.65 : 1,
          }}
        >
          {res ? (
            <ResChip
              code={res.code}
              tone={res.tone}
              name={res.name}
              userId={res.userId}
            />
          ) : (
            <ResChip code="?" tone="empty" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchableDropdown
              value={row.resource || ""}
              onChange={(val) => handleField("resource", val)}
              disabled={!resources.length || isLocked}
              placeholder={
                isLocked
                  ? "Locked"
                  : resources.length
                    ? "Select resource..."
                    : "Pick group first"
              }
              searchPlaceholder="Search by name, code, email..."
              maxHeight={320}
              options={resources
                .filter(
                  (r) =>
                    r && typeof r.userId === "string" && r.userId.length > 0,
                )
                .map((r) => ({
                  value: r.userId,
                  label: r.name || r.userId,
                  code: r.code || "??",
                  tone: r.tone || 1,
                  sublabel: r.userId,
                }))}
              renderTrigger={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: t.textFaint, fontSize: 11.5 }}>
                      {resources.length
                        ? "Select resource..."
                        : "Pick group first"}
                    </span>
                  );
                }
                return (
                  <span
                    style={{
                      fontSize: 11.5,
                      color: t.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: t.textMuted, fontWeight: 400 }}>
                      {selected.code}
                    </span>
                    {" — "}
                    {selected.label}
                  </span>
                );
              }}
              renderOption={(opt, selected) => (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    minWidth: 0,
                  }}
                >
                  <ResChip code={opt.code} tone={opt.tone} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: selected ? 600 : 500,
                        color: t.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: t.textFaint,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                        marginTop: 1,
                      }}
                    >
                      {opt.sublabel}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </td>

      {/* Planned Start */}
      <td style={{ ...tdStyle, width: 180 }}>
        {hasChildren ? (
          // Parent with subtasks
          !row.resource ? (
            <span
              style={{ fontSize: 11, color: t.textFaint, fontStyle: "italic" }}
            >
              Assign resource first
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono',monospace",
                color: t.textSecondary,
              }}
            >
              {startDisplay || "—"}
              {startDisplay && (
                <span
                  style={{
                    marginLeft: 5,
                    background: t.infoBg,
                    color: t.info,
                    border: `1px solid ${t.infoBorder}`,
                    borderRadius: 3,
                    padding: "1px 5px",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  AUTO
                </span>
              )}
            </span>
          )
        ) : row.resource ? (
          (() => {
            // ── Determine mode ──
            const isAnchor = !!row._isAnchor;
            const isAutoChained = !!row._autoChained;
            const isAutoLocked = autoCalculate && isAutoChained;
            const canPickDate = !isLocked && !isAutoLocked;

            // ── Auto-locked (chained, not anchor) ──
            if (isAutoLocked) {
              return (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: t.textSecondary,
                    opacity: 0.9,
                  }}
                >
                  {startDisplay || (
                    <span style={{ color: t.textFaint, fontStyle: "italic" }}>
                      Waiting for previous task…
                    </span>
                  )}
                  {startDisplay && (
                    <span
                      title="Auto-calculated from resource chain"
                      style={{
                        background: t.infoBg,
                        color: t.info,
                        border: `1px solid ${t.infoBorder}`,
                        borderRadius: 3,
                        padding: "1px 5px",
                        fontSize: 9,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      ⚡ AUTO
                    </span>
                  )}
                </span>
              );
            }

            // ── Editable (manual mode OR anchor row in auto mode) ──
            if (canPickDate) {
              return (
                <>
                  {isPastStart && draft.status === "draft" && (
                    <span
                      style={{
                        marginLeft: 5,
                        background: t.dangerBgSubtle,
                        color: t.danger,
                        border: `1px solid ${t.dangerBorder}`,
                        borderRadius: 3,
                        padding: "1px 5px",
                        fontSize: 9,
                        fontWeight: 700,
                        marginBottom: 3,
                        display: "inline-block",
                      }}
                    >
                      ⚠ PAST
                    </span>
                  )}
                  <button
                    ref={dateBtnRef}
                    onClick={() => setPickerOpen(true)}
                    style={{
                      ...inputStyle,
                      height: 28,
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono',monospace",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>
                      <Calendar size={12} />
                    </span>
                    <span style={{ flex: 1 }}>
                      {startDisplay || (
                        <span style={{ color: t.textFaint }}>Pick date…</span>
                      )}
                    </span>
                    {false && isAnchor && autoCalculate && (
                      <span
                        title="Anchor row — first task for this resource"
                        style={{
                          background: t.successBg,
                          color: t.success,
                          border: `1px solid ${t.successBorder}`,
                          borderRadius: 3,
                          padding: "1px 5px",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.3px",
                        }}
                      >
                        ⚓
                      </span>
                    )}
                  </button>
                  {pickerOpen && (
                    <WorkingDatePicker
                      value={row.plannedStart}
                      resourceUserId={row.resource}
                      groupResources={groupResources}
                      anchorRef={dateBtnRef}
                      onChange={(val) => handleField("plannedStart", val)}
                      onClose={() => setPickerOpen(false)}
                    />
                  )}
                </>
              );
            }

            // ── Status-locked (not pending) ──
            return (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: t.textSecondary,
                  opacity: 0.9,
                }}
                title={
                  isLockedByParent
                    ? "Locked — parent task is not pending"
                    : "Locked — task not pending"
                }
              >
                {startDisplay || "—"}
              </span>
            );
          })()
        ) : (
          <span
            style={{ fontSize: 11, color: t.textFaint, fontStyle: "italic" }}
          >
            Assign resource first
          </span>
        )}
      </td>

      {/* Duration */}
      <td style={{ ...tdStyle, width: 110, textAlign: "right" }}>
        {hasChildren && row._autoDuration ? (
          <span
            title="Auto-computed from sub-tasks"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: t.violet,
              background: t.violetBg,
              border: `1px solid ${t.violetBorder}`,
              borderRadius: 5,
              padding: "4px 8px",
              fontWeight: 600,
              cursor: "help",
            }}
          >
            Σ {row.durationHrs ?? "0"}
          </span>
        ) : (
          <input
            type="number"
            min="0"
            step="0.5"
            value={
              row.durationHrs === "" || row.durationHrs == null
                ? ""
                : row.durationHrs
            }
            onChange={(e) => handleField("durationHrs", e.target.value)}
            placeholder="—"
            disabled={isLocked}
            title={
              isLocked
                ? isLockedByParent
                  ? "Locked — parent task is not pending"
                  : "Locked — task not pending"
                : ""
            }
            style={{
              ...inputStyle,
              height: 28,
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono',monospace",
              textAlign: "right",
              width: "100%",
              opacity: isLocked ? 0.65 : 1,
              cursor: isLocked ? "not-allowed" : "text",
            }}
          />
        )}
      </td>

      {/* Planned Stop */}
      <td style={{ ...tdStyle, width: 180 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono',monospace",
            color: t.textSecondary,
          }}
        >
          {stopDisplay || "—"}
          {stopDisplay && (
            <span
              style={{
                marginLeft: 5,
                background: t.infoBg,
                color: t.info,
                border: `1px solid ${t.infoBorder}`,
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              AUTO
            </span>
          )}
        </span>
      </td>

      {/* Status */}
      <td style={{ ...tdStyle, width: 110, textAlign: "center" }}>
        <StatusBadge status={row.status} />
      </td>

      {/* Actions */}
      <td style={{ ...tdStyle, width: 160, textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {/* Add row below */}
          {draft.status !== "closed" && row.sortOrder === 0 && (
            <button
              onClick={() => onAddRowBelow(row)}
              title={`Add row below in "${row.module || "module"}"`}
              style={{
                ...iconBtn,
                color: t.primary,
                borderColor: t.primaryBorder,
                background: t.primaryBgSubtle,
              }}
            >
              <Plus size={13} />
            </button>
          )}

          {/* Comments */}
          <button
            onClick={() => onOpenComments(row)}
            title={
              commentCount > 0
                ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
                : "Comments"
            }
            style={{
              ...iconBtn,
              background: commentCount > 0 ? t.violetBg : "transparent",
              color: commentCount > 0 ? t.violet : t.textFaint,
              borderColor: commentCount > 0 ? t.violetBorder : t.border,
              position: "relative",
              overflow: "visible",
            }}
          >
            <MessageSquare size={13} />
            {commentCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  background: t.violet,
                  color: t.textInverse,
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${t.bgCard}`,
                  boxShadow: t.shadowSm,
                  lineHeight: 1,
                }}
              >
                {commentCount > 99 ? "99+" : commentCount}
              </span>
            )}
          </button>

          {/* Add sub-activity */}
          {row.sortOrder === 0 && isRowPending && !isLockedByParent && (
            <button
              onClick={() => onAddSub(row)}
              title="Add sub-activity"
              style={{
                ...iconBtn,
                color: t.violet,
                borderColor: t.violetBorder,
                background: t.violetBg,
              }}
            >
              <CornerDownRight size={13} />
            </button>
          )}

          {/* Redo */}
          {draft.status !== "closed" && isCompleted && (
            <button
              onClick={() => onRedoReject(row)}
              title="Redo / Reject — needs to be redone"
              style={{
                ...iconBtn,
                color: t.warning,
                borderColor: t.warningBorder,
                background: t.warningBgSubtle,
              }}
            >
              <RotateCcw size={13} />
            </button>
          )}

          {/* Feedback */}
          {(isCompleted || statusLower === "finished") && (
            <button
              onClick={() => onFeedback(row)}
              title={isCompleted ? "Rate & Finish task" : "View feedback"}
              style={{
                ...iconBtn,
                color: statusLower === "finished" ? t.violet : t.success,
                borderColor:
                  statusLower === "finished" ? t.violetBorder : t.successBorder,
                background:
                  statusLower === "finished" ? t.violetBg : t.successBgSubtle,
              }}
            >
              <Star
                size={13}
                fill={statusLower === "finished" ? t.violet : "none"}
              />
            </button>
          )}

          {/* Delete */}
          {isRowPending && !isLockedByParent && (
            <button
              onClick={() => onDelete(row)}
              title="Delete row"
              style={{
                ...iconBtn,
                color: t.danger,
                borderColor: t.dangerBorder,
                background: t.dangerBgSubtle,
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});
const iconBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #E2E8F0",
  background: "transparent",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  transition: "all .12s",
  position: "relative", // ← Added
  overflow: "visible", // ← Added — ensures badge isn't clipped
};
function ColumnFilterDropdown({
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

          {type === "text" && (
            <div style={{ padding: "8px" }}>
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

          {type === "multi" && (
            <div
              style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}
            >
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
const MODULE_COLORS = [
  { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" }, // Blue
  { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" }, // Green
  { bg: "#EDE9FE", color: "#7C3AED", border: "#DDD6FE" }, // Violet
  { bg: "#FEF3C7", color: "#B45309", border: "#FCD34D" }, // Amber
  { bg: "#FCE7F3", color: "#BE185D", border: "#F9A8D4" }, // Pink
  { bg: "#CCFBF1", color: "#0F766E", border: "#5EEAD4" }, // Teal
  { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" }, // Red
  { bg: "#E0F2FE", color: "#0369A1", border: "#7DD3FC" }, // Sky
  { bg: "#ECFCCB", color: "#4D7C0F", border: "#BEF264" }, // Lime
  { bg: "#F3E8FF", color: "#9333EA", border: "#D8B4FE" }, // Purple
  { bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" }, // Orange
  { bg: "#F0FDFA", color: "#115E59", border: "#99F6E4" }, // Emerald
];

function getModuleColor(moduleName, moduleColorMap) {
  if (!moduleName)
    return { bg: "#F1F5F9", color: "#94A3B8", border: "#E2E8F0" };
  return (
    moduleColorMap[moduleName] || {
      bg: "#F1F5F9",
      color: "#94A3B8",
      border: "#E2E8F0",
    }
  );
}
/* ─── Main project Module ─── */
function ProjectEditor({
  draft,
  groupLabels,
  groupResources,
  fetchResourcesForGroups,
  onSaveDraft,
  onPublish,
  onBack,
  showToast,
  currentUserId,
  isUpdatesShared = false, // ← NEW prop
}) {
  const { t } = useTheme();
  const [autoCalculate, setAutoCalculate] = useState(false); // OFF by default, session-only
  const labelStyle = makeLabelStyle(t);
  const inputStyle = makeInputStyle(t);
  const btnStyle = makeBtnStyle(t);
  const projectAccess = useMemo(
    () => computeProjectAccess(draft, currentUserId, isUpdatesShared), // ← pass it
    [draft, currentUserId, isUpdatesShared],
  );
  const {
    role: currentUserProjectRole,
    isOwner: isProjectOwner,
    isCoAssigner,
    canAccessActivities,
    canAccessGantt,
    canAccessUpdates,
    canManageCoAssigners,
    canManageProject,
  } = projectAccess;
  const [moduleRegistry, setModuleRegistry] = useState(
    draft.moduleRegistry || {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [project, setProject] = useState(draft.project || "");
  const [po, setPo] = useState(draft.po || "");
  const [site, setSite] = useState(draft.site || "");
  const [groups, setGroups] = useState(draft.groups || []);
  const [rows, setRows] = useState(draft.rows || []);
  //   const [nextId, setNextId] = useState(draft.nextId || 1);
  const [feedbackRow, setFeedbackRow] = useState(null);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [overlapRowIds, setOverlapRowIds] = useState(new Set());
  const [columnFilters, setColumnFilters] = useState({
    module: [],
    task: "",
    resource: [],
    status: [],
  });
  // ─── Role-based access control ───
  // const currentUserProjectRole = useMemo(
  //   () => computeProjectRole(draft, currentUserId),
  //   [draft, currentUserId],
  // );

  // const isProjectOwner = currentUserProjectRole === "owner";
  // const isCoAssigner = currentUserProjectRole === "co-assigner";
  const hasEditAccess = canEditProject(currentUserProjectRole);
  // const canManageCoAssign = canManageCoAssigners(currentUserProjectRole);
  const [showGantt, setShowGantt] = useState(false);
  // const projectOwnerId = draft?.createdBy || currentUserId || "";
  const projectOwnerId = draft?.createdBy || "";
  const isDraft = !draft?.status || draft?.status === "draft";
  const isNewProject = !draft?.createdBy;
  const effectiveCanAccessActivities = canAccessActivities || isNewProject;
  const effectiveCanAccessGantt = canAccessGantt || isNewProject;
  const effectiveCanAccessUpdates = canAccessUpdates || isNewProject;
  const effectiveCanManageProject = canManageProject || isNewProject;
  const effectiveIsOwner = isProjectOwner || isNewProject;
  const effectiveHasAccess = hasEditAccess || isNewProject;
  const activitiesGanttEnabled = effectiveHasAccess;

  // ─── Co-assigner state ───
  const [coAssignerModalOpen, setCoAssignerModalOpen] = useState(false);
  const [allUsersForCoAssigner, setAllUsersForCoAssigner] = useState([]);
  const [loadingUsersForCoAssigner, setLoadingUsersForCoAssigner] =
    useState(false);
  const [usersErrorForCoAssigner, setUsersErrorForCoAssigner] = useState(null);
  // ─── Default View ───
  const defaultView = useMemo(() => {
    if (effectiveCanAccessActivities) return "activities";
    if (effectiveCanAccessUpdates) return "updates";
    return "activities"; // fallback
  }, [effectiveCanAccessActivities, effectiveCanAccessUpdates]);
  const [view, setView] = useState(defaultView);
  useEffect(() => {
    if (view === "activities" && !effectiveCanAccessActivities) {
      setView(effectiveCanAccessUpdates ? "updates" : "activities");
    } else if (view === "gantt" && !effectiveCanAccessGantt) {
      setView(effectiveCanAccessUpdates ? "updates" : "activities");
    } else if (view === "updates" && !effectiveCanAccessUpdates) {
      setView(effectiveCanAccessActivities ? "activities" : "updates");
    }
  }, [
    view,
    effectiveCanAccessActivities,
    effectiveCanAccessGantt,
    effectiveCanAccessUpdates,
  ]);
  const [motionSubmitted, setMotionSubmitted] = useState(
    draft.status === "published",
  );
  const isEditable = draft.status === "draft" || !draft.status;

  const [draftTime, setDraftTime] = useState(
    draft.updatedAt
      ? new Date(draft.updatedAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
  );
  // const [commentRow, setCommentRow] = useState(null);
  // ADD these:
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState([]);
  const [newComment, setNewComment] = useState(null);
  const [commentDialogRow, setCommentDialogRow] = useState(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({
    type: "info",
    msg: "Download the Excel template, fill it with your activities, then upload back here.",
  });
  const [rejectRow, setRejectRow] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const fileInputRef = useRef();
  const groupMenuRef = useRef();
  const [closeProjectOpen, setCloseProjectOpen] = useState(false);
  const [isClosingProject, setIsClosingProject] = useState(false);

  //   const showToast = useCallback((kind, title, msg, dur = 3800) => {
  //     const id = ++toastIdRef.current;
  //     setToasts((p) => [...p, { id, kind, title, msg }]);
  //     setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), dur);
  //   }, []);

  const isResourcesReady = useMemo(() => {
    if (groups.length === 0) return true; // no groups → ready
    return groups.every((g) => g in groupResources);
  }, [groups, groupResources]);
  useEffect(() => {
    if (groups.length > 0) {
      fetchResourcesForGroups(groups);
    }
  }, [groups, fetchResourcesForGroups]);

  const resources = useMemo(
    () => getResources(groups, groupResources),
    [groups, groupResources],
  );
  const filterOptions = useMemo(() => {
    const modules = [
      ...new Set(rows.filter((r) => r.module).map((r) => r.module)),
    ].sort();
    const resources = [
      ...new Set(rows.filter((r) => r.resource).map((r) => r.resource)),
    ].sort();
    const statuses = [
      ...new Set(rows.map((r) => r.status || "Pending")),
    ].sort();

    // Build resource options with names
    const resourceOpts = resources.map((userId) => {
      const row = rows.find((r) => r.resource === userId);
      return {
        value: userId,
        label: row?.resourceName || userId,
      };
    });

    return { modules, resourceOpts, statuses };
  }, [rows]);
  useEffect(() => {
    if (
      !activitiesGanttEnabled &&
      (view === "activities" || view === "gantt")
    ) {
      setView("updates");
    }
  }, [activitiesGanttEnabled, view]);
  const moduleColorMap = useMemo(() => {
    const uniqueModules = [
      ...new Set(rows.filter((r) => r.module).map((r) => r.module)),
    ];

    const map = {};
    uniqueModules.forEach((mod, idx) => {
      map[mod] = MODULE_COLORS[idx % MODULE_COLORS.length];
    });

    return map;
  }, [rows]);
  useEffect(() => {
    if (!coAssignerModalOpen) return;

    const loadUsers = async () => {
      setLoadingUsersForCoAssigner(true);
      setUsersErrorForCoAssigner(null);
      try {
        const data = await sharingApi.getUsersCached({ active: true });
        setAllUsersForCoAssigner(data.users || []);
      } catch (err) {
        setUsersErrorForCoAssigner(err);
      } finally {
        setLoadingUsersForCoAssigner(false);
      }
    };

    loadUsers();
  }, [coAssignerModalOpen]);
  // Clear overlap highlights when rows change (user fixes overlaps)
  useEffect(() => {
    if (overlapRowIds.size > 0) {
      setOverlapRowIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  // Add this useEffect for diagnostics
  useEffect(() => {
    console.log("=== DROPDOWN DATA CHECK ===");
    console.log("groupLabels:", groupLabels);
    console.log(
      "groupLabels types:",
      groupLabels.map((g) => ({
        groupId: g.groupId,
        type: typeof g.groupId,
      })),
    );

    console.log("resources:", resources);
    console.log(
      "resources types:",
      resources.map((r) => ({
        userId: r.userId,
        type: typeof r.userId,
      })),
    );

    // Check for duplicates
    const userIds = resources.map((r) => r.userId);
    const dupes = userIds.filter((id, i) => userIds.indexOf(id) !== i);
    if (dupes.length > 0) {
      console.warn("⚠️ DUPLICATE userIds:", dupes);
    }
  }, [groupLabels, resources]);

  /* Close group dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target))
        setGroupOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    setRows((prev) => recomputeRows(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalculate]);
  const recomputeRows = useCallback(
    (rowsToProcess) => {
      if (autoCalculate) {
        const { rows: computed, warnings } = recomputeAutoChains(
          rowsToProcess,
          groupResources,
        );

        // Show toast for missing anchors
        if (warnings.length > 0) {
          const resourceNames = warnings.map((w) => {
            const res = getResourceByUserId(w.userId, groups, groupResources);
            return res?.name || w.userId;
          });
          showToast(
            "warning",
            "Missing anchor start dates",
            `Please set the first planned start for: ${resourceNames.join(", ")}`,
          );
        }

        return computed;
      } else {
        return recomputeChains(rowsToProcess, groupResources);
      }
    },
    [autoCalculate, groupResources, groups, showToast],
  );
  const onOpenCommentBox = useCallback(
    async (projectId, activityId, moduleId) => {
      try {
        const existingCommentsResp =
          await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
            projectId,
            activityId,
          );

        const newCommentBody = addComment(projectId, activityId, moduleId);
        //                     ↑ returns the correct shape with
        //                       responsibility: "" and attachment: null

        setExistingComments(existingCommentsResp || []);
        setNewComment(newCommentBody);
        setOpenCommentDialog(true);
      } catch (err) {
        console.error("Failed to load comments:", err);
        showToast("error", "Failed to load comments", err.message);
      }
    },
    [showToast],
  );
  const handleFeedbackSubmit = useCallback(
    async ({
      timeEfficiencyRating,
      timeEfficiencyComments,
      fulfillmentRating,
      fulfillmentComments,
      innovationRating,
      innovationComments,
      comments,
    }) => {
      if (!feedbackRow) return;

      setIsFeedbackSubmitting(true);
      try {
        const updatedActivity = {
          ...feedbackRow,
          status: "Finished",
          timeEfficiencyRating,
          timeEfficiencyComments,
          fulfillmentRating,
          fulfillmentComments,
          innovationRating,
          innovationComments,
          feedbackComments: comments,
        };

        await activityTrackerApi.updateActivity(draft.id, updatedActivity);

        setRows((prev) =>
          prev.map((r) => (r.id === feedbackRow.id ? updatedActivity : r)),
        );

        const avg =
          Math.round(
            ((timeEfficiencyRating + fulfillmentRating + innovationRating) /
              3) *
              10,
          ) / 10;

        showToast(
          "success",
          "Task Finished ⭐",
          `"${feedbackRow.task || "Task"}" — Avg: ${avg}/10 (Time: ${timeEfficiencyRating}, Quality: ${fulfillmentRating}, Innovation: ${innovationRating})`,
        );

        setFeedbackRow(null);
      } catch (err) {
        console.error("Feedback submission failed:", err);
        showToast("error", "Feedback failed", err.message);
      } finally {
        setIsFeedbackSubmitting(false);
      }
    },
    [feedbackRow, draft.id, showToast],
  );

  const handleRedoReject = useCallback(
    async (reason) => {
      if (!rejectRow) return;

      setIsRejecting(true);
      try {
        // Call the API
        await activityTrackerApi.rejectActivity(rejectRow.id, reason);

        // Update local state — mark as Rejected
        setRows((prev) =>
          prev.map((r) =>
            r.id === rejectRow.id ? { ...r, status: "Rejected" } : r,
          ),
        );

        showToast(
          "success",
          "Task Rejected",
          `"${rejectRow.task || "Task"}" has been marked for redo.`,
        );

        setRejectRow(null);
      } catch (err) {
        console.error("Reject failed:", err);
        showToast("error", "Reject failed", err.message);
      } finally {
        setIsRejecting(false);
      }
    },
    [rejectRow, showToast],
  );

  // ─── Add a co-assigner (single object POST) ───
  const handleAddCoAssigner = useCallback(
    async (user) => {
      try {
        // Build the co-assigner object (only what backend needs)
        const coAssignerPayload = {
          userId: user.userId,
          userName: user.userName,
          addedAt: new Date().toISOString(),
          addedBy: currentUserId,
        };

        console.log("📤 Adding co-assigner:", coAssignerPayload);

        // Call the dedicated API
        const response = await sharingApi.addCoAssigner(
          draft.id,
          coAssignerPayload,
        );

        console.log("📥 Add co-assigner response:", response);

        // Update local state optimistically
        // Handle different response shapes: full co-assigner, boolean, or wrapped
        const savedCoAssigner =
          typeof response === "object" &&
          response !== null &&
          !("success" in response)
            ? response.coAssigner || response.data || response
            : coAssignerPayload; // Fall back to our payload if boolean response

        const updatedDraft = {
          ...draft,
          coAssigners: [...(draft.coAssigners || []), savedCoAssigner],
        };

        // Update draft state via the save mechanism
        // (this updates the parent state so modal reflects immediately)
        await onSaveDraft(updatedDraft, { skipApiCall: true });

        showToast(
          "success",
          "Co-assigner added",
          `${user.userName} now has ownership rights.`,
        );
      } catch (err) {
        console.error("Failed to add co-assigner:", err);
        showToast(
          "error",
          "Failed to add co-assigner",
          err.userMessage || err.message,
        );
        throw err;
      }
    },
    [draft, currentUserId, onSaveDraft, showToast],
  );

  // ─── Remove a co-assigner (single DELETE with URL params) ───
  const handleRemoveCoAssigner = useCallback(
    async (userId) => {
      try {
        console.log("📤 Removing co-assigner:", {
          projectId: draft.id,
          userId,
        });

        // Find the user (for the success message)
        const removedUser = (draft.coAssigners || []).find(
          (ca) => ca.userId.toLowerCase() === userId.toLowerCase(),
        );

        // Call the dedicated DELETE API
        await sharingApi.removeCoAssigner(draft.id, userId);

        // Update local state
        const updatedCoAssigners = (draft.coAssigners || []).filter(
          (ca) => ca.userId.toLowerCase() !== userId.toLowerCase(),
        );

        const updatedDraft = {
          ...draft,
          coAssigners: updatedCoAssigners,
        };

        // Update draft state (skip full project save)
        await onSaveDraft(updatedDraft, { skipApiCall: true });

        showToast(
          "success",
          "Co-assigner removed",
          `${removedUser?.userName || userId} no longer has access.`,
        );
      } catch (err) {
        console.error("Failed to remove co-assigner:", err);
        showToast(
          "error",
          "Failed to remove co-assigner",
          err.userMessage || err.message,
        );
        throw err;
      }
    },
    [draft, onSaveDraft, showToast],
  );
  const buildProjectData = useCallback(() => {
    // Helper to convert datetime to ISO timestamp format
    const toTimestamp = (val) => {
      if (!val) return null;
      // If already in correct format, return as-is
      if (val.endsWith("Z") && val.includes(".")) return val;
      // Parse and convert
      const d = new Date(val.replace(" ", "T"));
      if (isNaN(d)) return null;
      // Convert to ISO format: "2026-06-29T13:10:00.000Z"
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}:00.000Z`;
    };

    // Convert rows with timestamp format
    const formattedRows = rows.map((r) => ({
      ...r,
      // plannedStart: new Date(r.plannedStart).toISOString(),
      // plannedStop: new Date(r.plannedStop).toISOString(),
    }));

    return {
      ...draft,
      project,
      po,
      site,
      groups,
      rows: formattedRows,
      moduleRegistry,
      status: draft.status === "published" ? "published" : "draft",
    };
  }, [draft, project, po, site, groups, rows, moduleRegistry]);
  const handleSaveDraftClick = useCallback(async () => {
    if (isSaving || motionSubmitted || draft.status === "closed") return;

    setIsSaving(true);

    try {
      await onSaveDraft(buildProjectData());
    } catch (err) {
      // The parent handleSaveDraft already displays the error toast.
      console.error("Draft save failed in ProjectEditor:", err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, motionSubmitted, draft.status, onSaveDraft, buildProjectData]);
  const handleCloseProject = useCallback(
    async (feedback) => {
      setIsClosingProject(true);
      try {
        const payload = {
          ...buildProjectData(),
          status: "closed",
          projectFeedback: feedback,
          timeEfficiencyRating: feedback.timeEfficiencyRating,
          timeEfficiencyComments: feedback.timeEfficiencyComments,
          fulfillmentRating: feedback.fulfillmentRating,
          fulfillmentComments: feedback.fulfillmentComments,
          innovationRating: feedback.innovationRating,
          innovationComments: feedback.innovationComments,
          overallComments: feedback.overallComments,
          projectUserRatings: feedback.resourceRatings || [],
          resourceRatings: feedback.resourceRatings || [],
          closedAt: new Date().toISOString(),
        };

        await onPublish(payload);

        setCloseProjectOpen(false);
      } catch (err) {
        console.error("Close project failed:", err);
        showToast("error", "Close failed", err.message);
      } finally {
        setIsClosingProject(false);
      }
    },
    [buildProjectData, onPublish, showToast],
  );

  /* ─── Publish (after validation passes) ─── */
  const handleConfirmMotion = useCallback(async () => {
    setIsSaving(true);
    try {
      await onPublish(buildProjectData());
      setMotionSubmitted(true);
      setValidationOpen(false);
    } catch (err) {
      // Toast already shown by parent
    } finally {
      setIsSaving(false);
    }
  }, [buildProjectData, onPublish]);
  /* Update rows when groups change — clear invalid resources */
  const updateGroups = useCallback(
    (newGroups) => {
      const validUserIds = new Set(
        getResources(newGroups, groupResources).map((r) => r.userId),
      );
      setRows((prev) => {
        let updated = prev.map((r) => ({
          ...r,
          resource:
            r.resource && validUserIds.has(r.resource) ? r.resource : "",
        }));
        updated = recomputeRows(updated, groupResources);
        return updated;
      });
      setGroups(newGroups);
    },
    [groupResources],
  );

  /* CRUD */
  // Example — addRow
  const addRow = useCallback(
    (moduleName) => {
      const name = typeof moduleName === "string" ? moduleName : "";
      const { moduleId, registry: newRegistry } = ensureModuleId(
        name,
        moduleRegistry,
      );
      const newRow = {
        id: generateRowId(),
        parentId: null,
        module: name,
        moduleId,
        task: "",
        resource: "",
        plannedStart: "",
        durationHrs: "",
        plannedStop: "",
        status: "Pending",
        comments: [],
      };
      setModuleRegistry(newRegistry);
      setRows((prev) => recomputeRows([...prev, newRow])); // ← use recomputeRows
    },
    [moduleRegistry, recomputeRows],
  );

  // ✅ AFTER
  const addSubActivity = useCallback((parentRow) => {
    const newRow = {
      id: generateRowId(),
      parentId: parentRow.id,
      module: parentRow.module,
      moduleId: parentRow.moduleId, // ← Inherit from parent
      task: "",
      resource: parentRow.resource || "",
      plannedStart: "",
      durationHrs: "",
      plannedStop: "",
      status: "Pending",
      comments: [],
    };
    setRows((prev) => recomputeRows([...prev, newRow], groupResources));
  }, []);
  const addRowBelow = useCallback(
    (referenceRow) => {
      const name = referenceRow.module || "";
      const { moduleId, registry: newRegistry } = ensureModuleId(
        name,
        moduleRegistry,
      );

      const newRow = {
        id: generateRowId(),
        parentId: null,
        module: name,
        moduleId,
        task: "",
        resource: "",
        plannedStart: "",
        durationHrs: "",
        plannedStop: "",
        status: "Pending",
        comments: [],
      };

      setModuleRegistry(newRegistry);

      setRows((prev) => {
        // Find the index of the reference row
        const refIndex = prev.findIndex((r) => r.id === referenceRow.id);

        // Find the last row in the same "family" (reference + all its descendants)
        let insertIndex = refIndex + 1;
        const descendants = new Set([referenceRow.id]);

        for (let i = refIndex + 1; i < prev.length; i++) {
          if (prev[i].parentId && descendants.has(prev[i].parentId)) {
            descendants.add(prev[i].id);
            insertIndex = i + 1;
          } else if (
            !prev[i].parentId &&
            prev[i].module === name &&
            prev[i].moduleId === moduleId
          ) {
            // Still same module top-level rows — keep going
            break;
          } else {
            break;
          }
        }

        const updated = [
          ...prev.slice(0, insertIndex),
          newRow,
          ...prev.slice(insertIndex),
        ];

        return recomputeRows(updated, groupResources);
      });
    },
    [moduleRegistry, groupResources],
  );
  const updateRow = useCallback(
    (updated, opts = {}) => {
      const { recompute = true } = opts;
      setRows((prevRows) => {
        let replaced = prevRows.map((r) => (r.id === updated.id ? updated : r));
        const original = prevRows.find((r) => r.id === updated.id);
        const moduleChanged = original?.module !== updated.module;

        if (moduleChanged) {
          const synced = syncModuleIds(replaced, moduleRegistry);
          setModuleRegistry(synced.registry);
          replaced = synced.rows;
        }

        // ✅ Use recomputeRows (dispatches based on autoCalculate)
        return recompute && isResourcesReady
          ? recomputeRows(replaced) // ← changed from recomputeChains
          : replaced;
      });
    },
    [moduleRegistry, recomputeRows, isResourcesReady], // ← updated deps
  );
  const deleteRow = useCallback(
    (row) => {
      setRows((prev) => {
        // Collect all descendants
        const toDelete = new Set([row.id]);
        let changed = true;
        while (changed) {
          changed = false;
          prev.forEach((r) => {
            if (r.parentId && toDelete.has(r.parentId) && !toDelete.has(r.id)) {
              toDelete.add(r.id);
              changed = true;
            }
          });
        }
        let filtered = prev.filter((r) => !toDelete.has(r.id));

        // Sync registry (removes orphaned module entries)
        const synced = syncModuleIds(filtered, moduleRegistry);
        setModuleRegistry(synced.registry);

        return recomputeRows(synced.rows, groupResources);
      });
    },
    [moduleRegistry, groupResources],
  );

  /* Excel upload (uses SheetJS from CDN if available, otherwise loads SAMPLE_ROWS) */
  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!groups.length) {
      setUploadStatus({
        type: "warn",
        msg: "⚠️ Pick a group before uploading.",
      });
      showToast("error", "No group selected", "Select a group first.");
      e.target.value = "";
      return;
    }

    try {
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];

      if (!sheet) throw new Error("No sheet found in the Excel file.");

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      if (!json.length) throw new Error("The Excel sheet is empty.");

      console.log("📥 Raw Excel rows:", json);

      const pick = (rec, keys) => {
        for (const k of keys) {
          if (rec[k] !== undefined && rec[k] !== "") return rec[k];
        }
        return "";
      };

      // ── Resources from currently selected groups ──
      // ⚠️ RENAMED to avoid shadowing the `groupResources` prop
      const localResources = getResources(groups, groupResources);

      let parsed = json.map((rec) => {
        const moduleName = pick(rec, [
          "Module Name",
          "Module",
          "module",
          "MODULE",
        ]);
        const task = pick(rec, [
          "Task",
          "Task Name",
          "Activity",
          "task",
          "TASK",
        ]);

        const resourceInput = String(
          pick(rec, [
            "Resource Code",
            "Resource",
            "User ID",
            "UserId",
            "Email",
            "resource",
            "resource ID",
          ]),
        ).trim();

        const plannedStartRaw = pick(rec, [
          "Planned Start (YYYY-MM-DD HH:mm)",
          "Planned Start",
          "Start",
          "planned start",
        ]);

        const durationRaw = pick(rec, [
          "Duration (hrs)",
          "Planned Duration (hrs)",
          "Duration",
          "Hours",
        ]);

        // Normalize date — always treat as string since raw:false gives us formatted strings
        let plannedStart = "";
        if (plannedStartRaw !== "" && plannedStartRaw != null) {
          // Handle Date objects defensively (just in case)
          let s;
          if (plannedStartRaw instanceof Date) {
            s = isoDateTime(plannedStartRaw);
          } else {
            s = String(plannedStartRaw).trim();
          }

          console.log("📅 Date string to parse:", s);

          // Check if string contains time
          const hasTime = /\d{1,2}:\d{2}/.test(s);

          // Pattern 1: dd-mm-yyyy hh:mm  OR  dd/mm/yyyy hh:mm
          let m = s.match(
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})/,
          );
          if (m) {
            const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], 0, 0);
            plannedStart = isoDateTime(d);
          }
          // Pattern 2: yyyy-mm-dd hh:mm  OR  yyyy-mm-ddThh:mm
          else if (
            (m = s.match(
              /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s]+(\d{1,2}):(\d{2})/,
            ))
          ) {
            const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0);
            plannedStart = isoDateTime(d);
          }
          // Pattern 3: dd-mm-yyyy  OR  dd/mm/yyyy  (date only)
          else if ((m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/))) {
            const d = new Date(+m[3], +m[2] - 1, +m[1], WORK_START_HR, 0, 0, 0);
            plannedStart = isoDateTime(d);
          }
          // Pattern 4: yyyy-mm-dd  (date only)
          else if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/))) {
            const d = new Date(+m[1], +m[2] - 1, +m[3], WORK_START_HR, 0, 0, 0);
            plannedStart = isoDateTime(d);
          }
          // Fallback: try native Date parse
          else {
            const d = new Date(s);
            if (!isNaN(d)) {
              if (!hasTime) {
                d.setHours(WORK_START_HR, 0, 0, 0);
              }
              plannedStart = isoDateTime(d);
            }
          }

          console.log("✅ Parsed plannedStart:", plannedStart);
        }

        // Resolve resource input → userId
        let validResource = "";

        if (resourceInput) {
          // ⚠️ Use localResources (the array), not groupResources (the object)
          const byUserId = localResources.find(
            (r) => r.userId.toLowerCase() === resourceInput.toLowerCase(),
          );

          if (byUserId) {
            validResource = byUserId.userId;
          } else {
            const codeUpper = resourceInput.toUpperCase();
            const matches = localResources.filter((r) => r.code === codeUpper);

            if (matches.length === 1) {
              validResource = matches[0].userId;
            } else if (matches.length > 1) {
              console.warn(
                `⚠️ Ambiguous code "${codeUpper}" matches ${matches.length} users — left blank:`,
                matches.map((m) => `${m.name} (${m.userId})`),
              );
            }
          }
        }

        const dur =
          durationRaw === "" || durationRaw == null
            ? ""
            : Number(durationRaw) || "";

        return {
          id: generateRowId(),
          parentId: null,
          module: String(moduleName || "").trim(),
          task: String(task || "").trim(),
          resource: validResource,
          plannedStart,
          durationHrs: dur,
          plannedStop: "",
          status: "Pending",
          comments: [],
        };
      });

      parsed = parsed.filter(
        (r) => r.module || r.task || r.resource || r.durationHrs,
      );

      if (!parsed.length) {
        throw new Error("No valid rows found in the Excel file.");
      }

      const synced = syncModuleIds(parsed, moduleRegistry);
      setModuleRegistry(synced.registry);

      // ⚠️ Use the PROP groupResources here (the object map)
      setRows(recomputeChains(synced.rows, groupResources));
      setMotionSubmitted(false);

      const unmapped = parsed.filter((r, idx) => {
        const inputHadResource = !!String(
          json[idx]?.["Resource Code"] ||
            json[idx]?.["Resource"] ||
            json[idx]?.["User ID"] ||
            json[idx]?.["Email"] ||
            "",
        ).trim();
        return inputHadResource && !r.resource;
      }).length;

      setUploadStatus({
        type: "ok",
        msg: ` Loaded <b>${f.name}</b> — ${parsed.length} activities imported${
          unmapped > 0
            ? `. <span style="color:#B45309">${unmapped} resource(s) didn't match the selected group(s) and were cleared.</span>`
            : "."
        } Edit any cell directly.`,
      });

      showToast(
        "success",
        "File imported",
        `${parsed.length} activities loaded from ${f.name}`,
      );
    } catch (err) {
      console.error("Excel upload error:", err);
      setUploadStatus({
        type: "err",
        msg: `❌ Could not read the file: ${err.message}. Please check the column headers match the template.`,
      });
      showToast(
        "error",
        "Upload failed",
        err.message || "Could not parse the Excel file.",
      );
    }

    e.target.value = "";
  };
  const handleDownloadTemplate = () => {
    if (typeof XLSX !== "undefined") {
      const cols = [
        "Module Name",
        "Task",
        "Resource Code (or User ID / Email)", // ← Updated label
        "Planned Start (YYYY-MM-DD HH:mm)",
        "Duration (hrs)",
      ];
      const blank = [
        cols,
        ...Array.from({ length: 5 }, () => Array(cols.length).fill("")),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(blank);
      ws["!cols"] = [
        { wch: 22 },
        { wch: 36 },
        { wch: 16 },
        { wch: 28 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Activities");
      XLSX.writeFile(wb, "Activity_Tracker_Template.xlsx");
    } else {
      showToast(
        "info",
        "Template download",
        "SheetJS (xlsx) library required. Add it via CDN.",
      );
    }
  };
  /* ─── Build safe filename from project name ─── */
  function buildExportFilename(projectName) {
    const base = (projectName || "Untitled Project")
      .trim()
      // Replace illegal Windows filename chars with hyphens
      .replace(/[\\/:*?"<>|]/g, "-")
      // Collapse multiple whitespace/dashes into single underscore
      .replace(/\s+/g, "_")
      .replace(/-+/g, "-")
      // Trim leading/trailing dots/dashes/underscores
      .replace(/^[._-]+|[._-]+$/g, "")
      // Cap length to 100 chars (reserve space for date suffix)
      .slice(0, 100);

    // Add timestamp suffix
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, "0");
    const mn = String(now.getMinutes()).padStart(2, "0");
    const timestamp = `${dd}-${mm}-${yyyy}_${hh}${mn}`;

    return `${base || "Untitled_Project"}_${timestamp}.xlsx`;
  }
  //without timestamp
  // function buildExportFilename(projectName) {
  //   const base = (projectName || "Untitled Project")
  //     .trim()
  //     .replace(/[\\/:*?"<>|]/g, "-")
  //     .replace(/\s+/g, "_")
  //     .replace(/-+/g, "-")
  //     .replace(/^[._-]+|[._-]+$/g, "")
  //     .slice(0, 100);

  //   return `${base || "Untitled_Project"}.xlsx`;
  // }
  const handleExport = () => {
    if (typeof XLSX === "undefined") {
      showToast("info", "Export", "SheetJS (xlsx) library required.");
      return;
    }

    const ordered = flattenOrdered(rows);
    const out = ordered.map((r) => {
      const resObj = r.resource
        ? getResourceByUserId(r.resource, groups, groupResources)
        : null;
      return {
        "Module ID": r.moduleId || "",
        "Module Name": r.module,
        Task: (r.parentId ? "  ↳ " : "") + r.task,
        "Resource Code": resObj?.code || "",
        "Resource Name": resObj?.name || "",
        "User ID": r.resource || "",
        "Planned Start": r.plannedStart ? fmtDisplay(r.plannedStart) : "",
        "Duration (hrs)":
          r.durationHrs === "" || r.durationHrs == null ? "" : r.durationHrs,
        "Planned Stop": r.plannedStop ? fmtDisplay(r.plannedStop) : "",
        Status: r.status || "pending",
        Comments: (r.comments || [])
          .map((c) => `[${c.author}] ${c.description}`)
          .join(" | "),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(out);
    XLSX.utils.book_append_sheet(wb, ws, "Activities");

    // ── Build filename from project name ──
    const filename = buildExportFilename(project);
    XLSX.writeFile(wb, filename);

    showToast("success", "Exported", `Downloaded as ${filename}`);
  };
  /* Validation + submit */
  const handleSubmitMotion = () => {
    const { results, warnings, overlapIds } = runValidations(
      rows,
      project,
      po,
      site,
      groups,
      groupResources,
      draft.status,
    );
    setValidationResults(results);
    setValidationWarnings(warnings);
    setOverlapRowIds(overlapIds);
    setValidationOpen(true);
  };
  /* Filtered/ordered rows */
  const orderedRows = useMemo(() => flattenOrdered(rows), [rows]);
  const filteredRows = useMemo(() => {
    let result = orderedRows;

    // ── Global search ──
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matched = new Set();

      result.forEach((r) => {
        if (
          (r.module || "").toLowerCase().includes(q) ||
          (r.task || "").toLowerCase().includes(q)
        ) {
          matched.add(r.id);
          let cur = rows.find((x) => x.id === r.parentId);
          while (cur) {
            matched.add(cur.id);
            cur = rows.find((x) => x.id === cur.parentId);
          }
          const addDescendants = (pid) => {
            rows
              .filter((c) => c.parentId === pid)
              .forEach((c) => {
                matched.add(c.id);
                addDescendants(c.id);
              });
          };
          addDescendants(r.id);
        }
      });

      result = result.filter((r) => matched.has(r.id));
    }

    // ── Column filters ──
    const hasColumnFilter =
      columnFilters.module.length > 0 ||
      columnFilters.task.trim() !== "" ||
      columnFilters.resource.length > 0 ||
      columnFilters.status.length > 0;

    if (hasColumnFilter) {
      const matched = new Set();

      result.forEach((r) => {
        let pass = true;

        // Module filter
        if (columnFilters.module.length > 0) {
          if (!columnFilters.module.includes(r.module || "")) pass = false;
        }

        // Task filter (text search)
        if (columnFilters.task.trim()) {
          const q = columnFilters.task.toLowerCase();
          if (!(r.task || "").toLowerCase().includes(q)) pass = false;
        }

        // Resource filter
        if (columnFilters.resource.length > 0) {
          if (!columnFilters.resource.includes(r.resource || "")) pass = false;
        }

        // Status filter
        if (columnFilters.status.length > 0) {
          const rowStatus = r.status || "Pending";
          if (!columnFilters.status.includes(rowStatus)) pass = false;
        }

        if (pass) {
          matched.add(r.id);
          // Include ancestors
          let cur = rows.find((x) => x.id === r.parentId);
          while (cur) {
            matched.add(cur.id);
            cur = rows.find((x) => x.id === cur.parentId);
          }
          // Include descendants
          const addDescendants = (pid) => {
            rows
              .filter((c) => c.parentId === pid)
              .forEach((c) => {
                matched.add(c.id);
                addDescendants(c.id);
              });
          };
          addDescendants(r.id);
        }
      });

      result = result.filter((r) => matched.has(r.id));
    }

    return result;
  }, [orderedRows, searchTerm, columnFilters, rows]);
  /* Stats */
  const total = rows.length;
  const assigned = rows.filter((r) => r.resource).length;
  const unassigned = total - assigned;
  const totalComments = rows.reduce((s, r) => s + (r.comments || []).length, 0);
  const allTasksDone = useMemo(() => {
    return (
      rows.length > 0 &&
      rows.every((r) => {
        const s = String(r.status || "")
          .toLowerCase()
          .trim();
        return s === "completed" || s === "finished";
      })
    );
  }, [rows]);
  /* Module groups for section headers */
  const sections = useMemo(() => {
    const seen = new Set();
    const result = [];
    filteredRows.forEach((r) => {
      if (r.sortOrder === 0 && !seen.has(r.module)) {
        seen.add(r.module);
        result.push(r.module);
      }
    });
    return result;
  }, [filteredRows]);

  /* first-in-chain check */
  const isFirstInChain = useCallback(
    (row) => {
      if (!row.resource) return true;

      // First in chain WITHIN THE SAME MODULE
      const moduleKey = row.moduleId || row.module || "__no_module__";
      const chain = flattenOrdered(rows).filter((r) => {
        const rModuleKey = r.moduleId || r.module || "__no_module__";
        return r.resource === row.resource && rModuleKey === moduleKey;
      });

      return chain[0]?.id === row.id;
    },
    [rows],
  );

  const showTable = rows.length > 0 || groups.length > 0;
  const showEmpty = !showTable;

  /* Group display */
  const groupChips =
    groups.length === 0
      ? null
      : groups.length <= 2
        ? groups.map((g) => getGroupName(g, groupLabels))
        : [getGroupName(groups[0], groupLabels), `+${groups.length - 1} more`];

  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        minHeight: "100vh",
        background: t.bgApp, // ← was #F1F5F9
        color: t.textPrimary,
      }}
    >
      <div
        style={{ padding: "16px 20px 32px", maxWidth: 1600, margin: "0 auto" }}
      >
        {/* Back button banner */}
        <div
          style={{
            background: t.bgCard,
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button onClick={onBack} style={{ ...btnStyle }}>
            <ArrowLeft size={14} /> Back to Drafts
          </button>

          <div style={{ fontSize: 12, color: "#64748B", marginLeft: 4 }}>
            Editing:{" "}
            <strong style={{ color: "#0F172A" }}>
              {project || "Untitled Project"}
            </strong>
          </div>

          {/* Existing status badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              background:
                draft.status === "closed"
                  ? t.closedBg
                  : motionSubmitted
                    ? t.successBg
                    : t.warningBg,
              color:
                draft.status === "closed"
                  ? t.closedText
                  : motionSubmitted
                    ? t.success
                    : t.warning,
              border: `1px solid ${
                draft.status === "closed"
                  ? t.closedBorder
                  : motionSubmitted
                    ? t.successBorder
                    : t.warningBorder
              }`,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {draft.status === "closed" ? (
              <>
                <Lock size={11} /> Closed
              </>
            ) : motionSubmitted ? (
              <>
                <Rocket size={11} /> Published
              </>
            ) : (
              <>
                <FileText size={11} /> Draft
              </>
            )}
          </span>

          {/* NEW: Role badge for co-assigners */}
          {false && isCoAssigner && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                background: t.successBg,
                color: t.success,
                border: `1px solid ${t.successBorder}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <Handshake size={11} />
              Co-Assigner
            </span>
          )}

          {/* NEW: Co-Assigners button (visible when project exists) */}
          {!isNewProject && draft.createdBy && (
            <button
              onClick={() => setCoAssignerModalOpen(true)}
              style={{
                ...btnStyle,
                marginLeft: "auto",
                background: t.successBgSubtle,
                color: t.success,
                borderColor: t.successBorder,
                fontWeight: 600,
              }}
            >
              <Handshake size={13} />
              Co-Assigners
              {(draft.coAssigners || []).length > 0 && (
                <span
                  style={{
                    padding: "1px 7px",
                    background: t.success,
                    color: t.textInverse,
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {(draft.coAssigners || []).length}
                </span>
              )}
            </button>
          )}
        </div>
        {/* ══ Sub-Tab Bar ══ */}
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            padding: 4,
            marginBottom: 12,
            display: "flex",
            gap: 2,
            boxShadow: t.shadowSm,
            width: "fit-content",
            alignItems: "center",
          }}
        >
          {[
            {
              key: "activities",
              label: "Activities",
              icon: <ClipboardList size={14} />,
              count: rows.length,
              enabled: effectiveCanAccessActivities,
              disabledReason: !canAccessActivities
                ? "Only owner or co-assigner can access Activities"
                : "",
            },
            {
              key: "gantt",
              label: "Gantt",
              icon: <Calendar size={14} />,
              count: null,
              enabled: effectiveCanAccessGantt,
              disabledReason: !canAccessGantt
                ? "Only owner or co-assigner can access Gantt"
                : "",
            },
            {
              key: "updates",
              label: "Updates",
              icon: <FileText size={14} />,
              count: null,
              enabled: effectiveCanAccessUpdates,
              disabledReason: !canAccessUpdates
                ? "You don't have access to any update categories"
                : "",
            },
          ].map((tab) => {
            const active = view === tab.key;
            const isDisabled = !tab.enabled;

            return (
              <button
                key={tab.key}
                onClick={() => !isDisabled && setView(tab.key)}
                disabled={isDisabled}
                title={isDisabled ? tab.disabledReason : ""}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: active ? t.textPrimary : "transparent",
                  color: active
                    ? t.bgCard
                    : isDisabled
                      ? t.textDisabled
                      : t.textMuted,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Sora,sans-serif",
                  transition: "all .15s",
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>

                {isDisabled && (
                  <Lock size={11} style={{ marginLeft: 2, opacity: 0.7 }} />
                )}

                {!isDisabled && tab.count !== null && tab.count > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 20,
                      height: 18,
                      padding: "0 6px",
                      borderRadius: 999,
                      background: active ? "rgba(255,255,255,0.2)" : t.bgMuted,
                      color: active ? t.bgCard : t.textMuted,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Role badge for non-owners */}
          {!isProjectOwner && draft?.createdBy && (
            <div
              style={{
                marginLeft: 10,
                display: "flex",
                gap: 4,
              }}
            >
              {isCoAssigner && (
                <span
                  style={{
                    padding: "4px 10px",
                    background: "#DCFCE7",
                    color: "#15803D",
                    border: "1px solid #86EFAC",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title="You are a co-assigner"
                >
                  <Handshake size={11} />
                  Co-Assigner
                </span>
              )}
              {isUpdatesShared && (
                <span
                  style={{
                    padding: "4px 10px",
                    background: "#DBEAFE",
                    color: "#1D4ED8",
                    border: "1px solid #93C5FD",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title="Updates are shared with you"
                >
                  <FileText size={11} />
                  Updates Access
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── ACTIVITIES VIEW ── */}
        {view === "activities" && (
          <>
            {/* Close Project button — only for published projects */}
            {motionSubmitted &&
              draft.status !== "closed" &&
              allTasksDone &&
              canDeleteProject(currentUserProjectRole) && (
                <button
                  onClick={() => setCloseProjectOpen(true)}
                  style={{
                    ...btnStyle,
                    marginLeft: "auto",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    borderColor: "#FCA5A5",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <XCircle size={14} />
                  Close Project
                </button>
              )}
            {draft.status === "closed" && (
              <button
                onClick={() => setCloseProjectOpen(true)}
                style={{
                  ...btnStyle,
                  marginLeft: "auto",
                  background: "#EDE9FE",
                  color: "#7C3AED",
                  borderColor: "#DDD6FE",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Star size={14} fill="#7C3AED" />
                View Project Feedback
              </button>
            )}

            {/* ── Setup Card ── */}
            <div
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: "18px 20px",
                marginBottom: 16,
                boxShadow: t.shadowSm,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Settings size={15} color={t.textPrimary} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13.5,
                    color: t.textPrimary,
                  }}
                >
                  Project Setup
                </span>
                <span
                  style={{ fontSize: 11.5, color: t.textFaint, marginLeft: 4 }}
                >
                  Fill details, pick group, upload sheet — table appears below.
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 1.5fr 1.5fr 1fr 1.2fr",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                {/* Project Name */}
                <div>
                  <label style={makeLabelStyle(t)}>
                    Project Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    value={project}
                    onChange={(e) => isEditable && setProject(e.target.value)}
                    placeholder="e.g. ThingWorx — Adity FRP"
                    disabled={!isEditable}
                    title={
                      !isEditable ? "Cannot edit — project is not a draft" : ""
                    }
                    style={{
                      ...inputStyle,
                      opacity: !isEditable ? 0.65 : 1,
                      cursor: !isEditable ? "not-allowed" : "text",
                      background: !isEditable ? t.bgInputDisabled : t.bgInput,
                    }}
                  />
                </div>
                {/* PO No */}
                <div>
                  <label style={makeLabelStyle(t)}>
                    PO No <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    value={po}
                    onChange={(e) => isEditable && setPo(e.target.value)}
                    placeholder="e.g. PO-20240092"
                    disabled={!isEditable}
                    title={
                      !isEditable ? "Cannot edit — project is not a draft" : ""
                    }
                    style={{
                      ...makeInputStyle(t),
                      opacity: !isEditable ? 0.65 : 1,
                      cursor: !isEditable ? "not-allowed" : "text",
                      background: !isEditable ? t.bgInputDisabled : t.bgInput,
                    }}
                  />
                </div>
                {/* Site */}
                <div>
                  <label style={makeLabelStyle(t)}>
                    Site / Customer <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    value={site}
                    onChange={(e) => isEditable && setSite(e.target.value)}
                    placeholder="e.g. Hindalco — Unit 2"
                    disabled={!isEditable}
                    title={
                      !isEditable ? "Cannot edit — project is not a draft" : ""
                    }
                    style={{
                      ...makeInputStyle(t),
                      opacity: !isEditable ? 0.65 : 1,
                      cursor: !isEditable ? "not-allowed" : "text",
                      background: !isEditable ? t.bgInputDisabled : t.bgInput,
                    }}
                  />
                </div>
                {/* Groups multi-select */}
                <div>
                  <label style={makeLabelStyle(t)}>
                    Group(s) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  {console.log(
                    "Resource options:",
                    resources.map((r) => ({
                      userId: r.userId,
                      userIdType: typeof r.userId,
                      isString: typeof r.userId === "string",
                    })),
                  )}
                  <SearchableDropdown
                    value={groups}
                    onChange={updateGroups}
                    multiple={true}
                    disabled={!isEditable}
                    placeholder={
                      !isEditable ? "Locked (not a draft)" : "Select group(s)…"
                    }
                    searchPlaceholder="Search groups..."
                    emptyMessage="No groups available"
                    options={getActiveGroups(groupLabels)
                      .filter((g) => g && typeof g.groupId === "string")
                      .map((g) => ({
                        value: g.groupId,
                        label: g.groupName || g.groupId,
                        sublabel: g.groupManager,
                      }))}
                  />
                </div>
                {/* Template */}
                <div>
                  <label style={makeLabelStyle(t)}>Template</label>
                  <button
                    onClick={handleDownloadTemplate}
                    style={{
                      width: "100%",
                      height: 34,
                      border: `1px solid ${t.borderStrong}`,
                      borderRadius: 6,
                      background: t.bgSubtle,
                      color: t.textSecondary,
                      fontFamily: "Sora,sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                    }}
                  >
                    <Download size={14} /> Download Excel
                  </button>
                </div>
                {/* Upload */}
                <div>
                  <label style={makeLabelStyle(t)}>Activity Sheet</label>
                  <button
                    onClick={() => {
                      if (!isEditable) return;
                      if (!groups.length) {
                        setUploadStatus({
                          type: "warn",
                          msg: "Pick a group before uploading.",
                        });
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    disabled={!isEditable}
                    title={
                      !isEditable
                        ? draft.status === "closed"
                          ? "Cannot upload — project is closed"
                          : "Cannot upload — project is already published"
                        : ""
                    }
                    style={{
                      width: "100%",
                      height: 34,
                      border: `1px dashed ${!isEditable ? t.borderStrong : t.primaryBorder}`,
                      borderRadius: 6,
                      background: !isEditable
                        ? t.bgInputDisabled
                        : t.primaryBgSubtle,
                      color: !isEditable ? t.textFaint : t.primary,
                      fontFamily: "Sora,sans-serif",
                      fontSize: 12,
                      cursor: !isEditable ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      fontWeight: 500,
                      opacity: !isEditable ? 0.65 : 1,
                    }}
                  >
                    {!isEditable ? (
                      <>
                        <Lock size={14} /> Upload Excel
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> Upload Excel
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                    disabled={!isEditable}
                  />
                </div>
              </div>
              {/* Upload status */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 7,
                  background:
                    uploadStatus.type === "ok"
                      ? t.successBgSubtle
                      : uploadStatus.type === "warn"
                        ? t.warningBgSubtle
                        : uploadStatus.type === "err"
                          ? t.dangerBgSubtle
                          : t.infoBg,
                  border: `1px solid ${
                    uploadStatus.type === "ok"
                      ? t.successBorder
                      : uploadStatus.type === "warn"
                        ? t.warningBorder
                        : uploadStatus.type === "err"
                          ? t.dangerBorder
                          : t.infoBorder
                  }`,
                  fontSize: 11.5,
                  color: t.textSecondary,
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 13 }}>
                  {uploadStatus.type === "ok" ? (
                    <CheckCircle2 size={13} />
                  ) : uploadStatus.type === "warn" ? (
                    <AlertTriangle size={13} />
                  ) : uploadStatus.type === "err" ? (
                    <AlertCircle size={13} />
                  ) : (
                    <Info size={13} />
                  )}
                </span>
                <span dangerouslySetInnerHTML={{ __html: uploadStatus.msg }} />
              </div>
            </div>

            {/* ── Empty State ── */}
            {showEmpty && (
              <div
                style={{
                  background: t.bgCard,
                  border: `1px dashed ${t.borderDashed}`,
                  borderRadius: 12,
                  padding: "60px 20px",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: t.primaryBg,
                    color: t.primary,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <FolderOpen size={26} />
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: t.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  No activities loaded yet
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    maxWidth: 420,
                    margin: "0 auto 16px",
                    lineHeight: 1.6,
                  }}
                >
                  Fill in the project details above, pick the responsible group,
                  then upload your Excel activity sheet.
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 11.5,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    ["1", "Project details", true],
                    ["2", "Pick group", true],
                    ["3", "Download / fill template", false],
                    ["4", "Upload & edit", false],
                  ].map(([n, l, a], i, arr) => (
                    <span
                      key={n}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          color: a ? t.primary : t.textFaint,
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: a ? t.primary : t.border,
                            color: a ? t.textInverse : t.textFaint,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {n}
                        </span>
                        {l}
                      </span>
                      {i < arr.length - 1 && (
                        <span style={{ color: t.textDisabled }}>›</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Table Card ── */}
            {showTable && (
              <div
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  marginBottom: 16,
                  boxShadow: t.shadowSm,
                  overflow: "hidden",
                }}
              >
                {/* Table header bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 18px",
                    borderBottom: `1px solid ${t.border}`,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: t.textPrimary,
                    }}
                  >
                    <CheckCircle2 size={16} color={t.primary} /> Activities
                    <span
                      style={{
                        background: t.bgMuted,
                        color: t.textMuted,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        padding: "1px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        marginLeft: 2,
                      }}
                    >
                      {total}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginLeft: 8,
                      fontSize: 11,
                      color: "#94A3B8",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#DBEAFE",
                          border: "1.5px solid #93C5FD",
                          display: "inline-block",
                        }}
                      ></span>{" "}
                      Resource leave
                    </span>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#F1F5F9",
                          border: "1.5px solid #CBD5E1",
                          display: "inline-block",
                        }}
                      ></span>{" "}
                      Weekend (disabled)
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginLeft: "auto",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: 200,
                      }}
                    >
                      <Search
                        size={14}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: t.textFaint,
                          pointerEvents: "none",
                        }}
                      />

                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search task or module…"
                        style={{
                          width: "100%",
                          height: 32,
                          border: `1px solid ${t.border}`,
                          borderRadius: 7,
                          padding: "0 10px 0 32px",
                          fontFamily: "Sora,sans-serif",
                          fontSize: 12,
                          outline: "none",
                          color: t.textPrimary,
                          background: t.bgInput,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    {(columnFilters.module.length > 0 ||
                      columnFilters.task.trim() !== "" ||
                      columnFilters.resource.length > 0 ||
                      columnFilters.status.length > 0) && (
                      <button
                        onClick={() =>
                          setColumnFilters({
                            module: [],
                            task: "",
                            resource: [],
                            status: [],
                          })
                        }
                        style={{
                          ...btnStyle,
                          height: 32,
                          color: t.danger,
                          borderColor: t.dangerBorder,
                          background: t.dangerBgSubtle,
                          fontWeight: 600,
                        }}
                      >
                        <X size={13} /> Clear Filters
                      </button>
                    )}
                    {/* <button
                  onClick={() => setShowGantt((p) => !p)}
                  style={{
                    ...btnStyle,
                    height: 32,
                    background: showGantt ? "#1D4ED8" : "#fff",
                    color: showGantt ? "#fff" : "#475569",
                    borderColor: showGantt ? "#1D4ED8" : "#CBD5E1",
                  }}
                >
                  <Calendar size={14} />
                  {showGantt ? "Table View" : "Gantt View"}
                </button> */}
                    <button
                      onClick={handleExport}
                      style={{ ...btnStyle, height: 32 }}
                    >
                      <Download size={14} /> Export
                    </button>
                    {draft.status !== "closed" && (
                      <button
                        onClick={() => addRow()}
                        style={{
                          ...btnStyle,
                          background: t.primary,
                          color: t.textInverse,
                          borderColor: t.primary,
                          height: 32,
                        }}
                      >
                        <Plus size={14} /> Add Module
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      tableLayout: "fixed", // ← Critical fix
                      minWidth: 1400,
                    }}
                  >
                    <thead>
                      <tr style={{ background: t.bgSubtle }}>
                        {[
                          {
                            label: "#",
                            width: 48,
                            align: "center",
                            filterKey: null,
                          },
                          {
                            label: "MODULE NAME",
                            width: 160,
                            align: "left",
                            filterKey: "module",
                          },
                          {
                            label: "TASK",
                            width: 240,
                            align: "left",
                            filterKey: "task",
                          },
                          {
                            label: "RESOURCE",
                            width: 240,
                            align: "left",
                            filterKey: "resource",
                          },
                          {
                            label: "PLANNED START",
                            width: 175,
                            align: "left",
                            filterKey: null,
                            isPlannedStart: true, // ← ADD THIS FLAG
                          },
                          {
                            label: "DURATION (HRS)",
                            width: 110,
                            align: "right",
                            filterKey: null,
                          },
                          {
                            label: "PLANNED STOP",
                            width: 175,
                            align: "left",
                            filterKey: null,
                          },
                          {
                            label: "STATUS",
                            width: 105,
                            align: "center",
                            filterKey: "status",
                          },
                          {
                            label: "ACTIONS",
                            width: 130,
                            align: "center",
                            filterKey: null,
                          },
                        ].map((col) => (
                          <th
                            key={col.label}
                            style={{
                              width: col.width,
                              textAlign: col.align,
                              padding: "11px 10px",
                              fontWeight: 600,
                              color: t.textMuted,
                              fontSize: "10.5px",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                              borderBottom: `2px solid ${t.borderStrong}`,
                              whiteSpace: "nowrap",
                              background: t.bgSubtle,
                              position: "sticky",
                              top: 0,
                              zIndex: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                justifyContent:
                                  col.align === "center"
                                    ? "center"
                                    : col.align === "right"
                                      ? "flex-end"
                                      : "flex-start",
                              }}
                            >
                              <span>{col.label}</span>
                              {col.isPlannedStart && (
                                <div
                                  onClick={() => setAutoCalculate((p) => !p)}
                                  title={
                                    autoCalculate
                                      ? "Auto-calculating start times per resource chain"
                                      : "Enable auto-calculation of start times"
                                  }
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    marginLeft: 0,
                                    padding: "0px 0px",
                                    borderRadius: 999,
                                    background: autoCalculate
                                      ? t.primaryBgSubtle
                                      : "transparent",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    transition: "all .15s",
                                  }}
                                >
                                  <span style={{ fontSize: 10 }}>⚡</span>

                                  {/* Toggle Switch */}
                                  <span
                                    style={{
                                      position: "relative",
                                      display: "inline-block",
                                      width: 26,
                                      height: 14,
                                      background: autoCalculate
                                        ? t.primary
                                        : t.borderStrong,
                                      borderRadius: 999,
                                      transition: "background .2s",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <span
                                      style={{
                                        position: "absolute",
                                        top: 2,
                                        left: autoCalculate ? 14 : 2,
                                        width: 10,
                                        height: 10,
                                        background: "#fff",
                                        borderRadius: "50%",
                                        transition: "left .2s",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                      }}
                                    />
                                  </span>
                                </div>
                              )}
                              {false && col.isPlannedStart && (
                                <button
                                  onClick={() => setAutoCalculate((p) => !p)}
                                  title={
                                    autoCalculate
                                      ? "Auto-calculating start times per resource chain"
                                      : "Enable auto-calculation of start times"
                                  }
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    marginLeft: 6,
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    border: `1px solid ${autoCalculate ? t.primary : t.borderStrong}`,
                                    background: autoCalculate
                                      ? t.primary
                                      : t.bgCard,
                                    color: autoCalculate
                                      ? t.textInverse
                                      : t.textMuted,
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "Sora,sans-serif",
                                    textTransform: "none",
                                    letterSpacing: "0.3px",
                                    transition: "all .15s",
                                  }}
                                >
                                  <span style={{ fontSize: 11 }}>⚡</span>
                                  Auto: {autoCalculate ? "ON" : "OFF"}
                                </button>
                              )}
                              {/* Module filter */}
                              {col.filterKey === "module" && (
                                <ColumnFilterDropdown
                                  label="Module"
                                  type="multi"
                                  options={filterOptions.modules}
                                  selected={columnFilters.module}
                                  onChange={(val) =>
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      module: val,
                                    }))
                                  }
                                />
                              )}

                              {/* Task filter */}
                              {col.filterKey === "task" && (
                                <ColumnFilterDropdown
                                  label="Task"
                                  type="text"
                                  options={[]}
                                  selected={columnFilters.task}
                                  onChange={(val) =>
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      task: val,
                                    }))
                                  }
                                />
                              )}

                              {/* Resource filter */}
                              {col.filterKey === "resource" && (
                                <ColumnFilterDropdown
                                  label="Resource"
                                  type="multi"
                                  options={filterOptions.resourceOpts}
                                  selected={columnFilters.resource}
                                  onChange={(val) =>
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      resource: val,
                                    }))
                                  }
                                />
                              )}

                              {/* Status filter */}
                              {col.filterKey === "status" && (
                                <ColumnFilterDropdown
                                  label="Status"
                                  type="multi"
                                  options={filterOptions.statuses}
                                  selected={columnFilters.status}
                                  onChange={(val) =>
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      status: val,
                                    }))
                                  }
                                />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {!filteredRows.length ? (
                        <tr>
                          <td
                            colSpan={9}
                            style={{
                              padding: "48px 20px",
                              textAlign: "center",
                              color: t.textFaint,
                              fontSize: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: t.primaryBgSubtle,
                                color: t.primary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 12px",
                              }}
                            >
                              <Plus size={28} strokeWidth={2.5} />
                            </div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: t.textPrimary,
                                marginBottom: 3,
                              }}
                            >
                              No activities yet
                            </div>
                            <div>
                              Add activities manually or upload your Excel
                              sheet.
                            </div>
                            <button
                              onClick={() => addRow()}
                              style={{
                                ...btnStyle,
                                background: t.primary,
                                color: t.textInverse,
                                borderColor: t.primary,
                                marginTop: 12,
                              }}
                            >
                              <Plus size={16} style={{ marginRight: 8 }} />
                              Add first activity
                            </button>
                          </td>
                        </tr>
                      ) : (
                        sections.map((mod) => {
                          const topLevelIds = new Set(
                            rows
                              .filter((r) => !r.parentId && r.module === mod)
                              .map((r) => r.id),
                          );

                          const isDescendantOf = (rowId, ancestorSet) => {
                            let cur = rows.find((r) => r.id === rowId);
                            while (cur?.parentId) {
                              if (ancestorSet.has(cur.parentId)) return true;
                              cur = rows.find((r) => r.id === cur.parentId);
                            }
                            return false;
                          };

                          const modRows = filteredRows.filter(
                            (r) =>
                              topLevelIds.has(r.id) ||
                              isDescendantOf(r.id, topLevelIds),
                          );

                          const modCount = rows.filter((r) => {
                            if (r.module === mod && !r.parentId) return true;
                            return isDescendantOf(r.id, topLevelIds);
                          }).length;

                          let displayIdx = 0;

                          return (
                            <React.Fragment key={mod || "unnamed"}>
                              {/* ── Section Header (no add button now) ── */}
                              {false && (
                                <tr>
                                  {(() => {
                                    const mc = getModuleColor(
                                      mod,
                                      moduleColorMap,
                                    );
                                    return (
                                      <td
                                        colSpan={9}
                                        style={{
                                          padding: "10px 14px",
                                          background: `linear-gradient(180deg, ${mc.bg}88 0%, ${mc.bg}44 100%)`,
                                          borderTop: `1px solid ${mc.border}`,
                                          borderBottom: `1px solid ${mc.border}`,
                                          borderLeft: `4px solid ${mc.color}`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <span
                                            style={{
                                              background: mc.bg,
                                              color: mc.color,
                                              border: `1px solid ${mc.border}`,
                                              borderRadius: 5,
                                              padding: "3px 10px",
                                              fontSize: 10.5,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {mod || "— unnamed —"}
                                          </span>
                                          <span
                                            style={{
                                              color: "#94A3B8",
                                              fontSize: 10.5,
                                            }}
                                          >
                                            {modCount}{" "}
                                            {modCount === 1 ? "task" : "tasks"}
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  })()}
                                </tr>
                              )}

                              {/* ── Activity Rows ── */}
                              {modRows.map((r) => {
                                if (r.sortOrder === 0 || r._depth === 0)
                                  displayIdx++;
                                return (
                                  <ActivityRow
                                    draft={draft}
                                    key={r.id}
                                    row={r}
                                    idx={displayIdx}
                                    autoCalculate={autoCalculate}
                                    isFirstInChain={isFirstInChain(r)}
                                    resources={resources}
                                    groupResources={groupResources}
                                    hasChildren={rows.some(
                                      (c) => c.parentId === r.id,
                                    )}
                                    parentRow={
                                      r.parentId
                                        ? rows.find((p) => p.id === r.parentId)
                                        : null
                                    } // ← ADD THIS
                                    moduleColor={getModuleColor(
                                      r.module,
                                      moduleColorMap,
                                    )} // ← ADD THIS
                                    isOverlapping={overlapRowIds.has(r.id)} // ← ADD THIS
                                    onUpdate={updateRow}
                                    onDelete={deleteRow}
                                    onAddSub={addSubActivity}
                                    onAddRowBelow={addRowBelow}
                                    onOpenComments={(row) =>
                                      onOpenCommentBox(
                                        draft.id,
                                        row.id,
                                        row.moduleId,
                                      )
                                    }
                                    onRedoReject={setRejectRow}
                                    onFeedback={setFeedbackRow} // ← ADD THIS
                                  />
                                );
                              })}

                              {/* ── NEW: "Add Row to Module" button (BOTTOM) ── */}
                              {false && (
                                <tr>
                                  <td
                                    colSpan={9}
                                    style={{
                                      padding: "6px 14px 10px",
                                      background: "#FAFBFC",
                                      borderBottom: "1px solid #E2E8F0",
                                    }}
                                  >
                                    {(() => {
                                      const mc = getModuleColor(
                                        mod,
                                        moduleColorMap,
                                      );
                                      return (
                                        <button
                                          onClick={() => addRow(mod)}
                                          style={{
                                            background: "#fff",
                                            border: `1px dashed ${mc.color}`,
                                            color: mc.color,
                                            borderRadius: 7,
                                            padding: "6px 14px 6px 12px",
                                            cursor: "pointer",
                                            fontSize: 11.5,
                                            fontFamily: "Sora,sans-serif",
                                            fontWeight: 600,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            transition: "all .12s",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background =
                                              mc.bg;
                                            e.currentTarget.style.borderStyle =
                                              "solid";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                              "#fff";
                                            e.currentTarget.style.borderStyle =
                                              "dashed";
                                          }}
                                        >
                                          <Plus size={13} />
                                          Add row to {mod || "module"}
                                        </button>
                                      );
                                    })()}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add row button */}
                {draft.status !== "closed" && (
                  <button
                    onClick={() => addRow()}
                    style={{
                      width: "100%",
                      padding: "11px",
                      background: "none",
                      border: "none",
                      borderTop: `1px solid ${t.borderSubtle}`,
                      color: t.primary,
                      fontFamily: "Sora,sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={14} /> Add new module
                  </button>
                )}
              </div>
            )}
            {/* {showTable && showGantt && (
          <div style={{ marginBottom: 16 }}>
            <GanttView
              rows={rows}
              overlapRowIds={overlapRowIds}
              onOpenComments={(row) =>
                onOpenCommentBox(draft.id, row.id, row.moduleId)
              }
              onFeedback={setFeedbackRow}
            />
          </div>
        )} */}

            <div
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                boxShadow: t.shadowSm,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                  color: t.textFaint,
                  flex: 1,
                  minWidth: 0,
                  flexWrap: "wrap",
                }}
              >
                <Clock size={11} />
                <span>Saved as draft:</span>
                <strong style={{ color: t.textPrimary }}>
                  {draftTime || "—"}
                </strong>
                <span style={{ color: t.border, margin: "0 4px" }}>|</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                    background:
                      draft.status === "closed"
                        ? t.closedBg
                        : motionSubmitted
                          ? t.successBg
                          : t.bgMuted,
                    color:
                      draft.status === "closed"
                        ? t.closedText
                        : motionSubmitted
                          ? t.success
                          : t.textMuted,
                    border: `1px solid ${
                      draft.status === "closed"
                        ? t.closedBorder
                        : motionSubmitted
                          ? t.successBorder
                          : t.border
                    }`,
                  }}
                >
                  {draft.status === "closed" ? (
                    <>
                      <Lock size={12} /> Closed — project has been finalized
                    </>
                  ) : motionSubmitted ? (
                    <>
                      <Rocket size={12} /> Published — edit & re-publish to
                      update
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> Draft — submit for motion to publish
                    </>
                  )}
                </span>
              </div>
              {/* ── Save Draft Button inside ProjectEditor Footer ── */}
              <button
                onClick={handleSaveDraftClick}
                disabled={
                  isSaving || motionSubmitted || draft.status === "closed"
                }
                title={
                  draft.status === "closed"
                    ? "Cannot save — project is closed"
                    : motionSubmitted
                      ? "Cannot save — project is already published"
                      : ""
                }
                style={{
                  ...btnStyle,
                  height: 36,
                  opacity:
                    isSaving || motionSubmitted || draft.status === "closed"
                      ? 0.5
                      : 1,
                  cursor:
                    isSaving || motionSubmitted || draft.status === "closed"
                      ? "not-allowed"
                      : "pointer",
                  background:
                    motionSubmitted || draft.status === "closed"
                      ? "#F1F5F9"
                      : "#fff",
                  color:
                    motionSubmitted || draft.status === "closed"
                      ? "#94A3B8"
                      : "#475569",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Draft
                  </>
                )}
              </button>
              <button
                onClick={handleSubmitMotion}
                disabled={isSaving || draft.status === "closed"}
                style={{
                  ...btnStyle,
                  background: draft.status === "closed" ? t.bgMuted : t.primary,
                  color:
                    draft.status === "closed" ? t.textFaint : t.textInverse,
                  borderColor: draft.status === "closed" ? t.border : t.primary,
                  height: 36,
                  opacity: isSaving || draft.status === "closed" ? 0.5 : 1,
                  cursor:
                    isSaving || draft.status === "closed"
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {draft.status === "closed" ? (
                  <>
                    <Lock size={14} />
                    Project Closed
                  </>
                ) : motionSubmitted ? (
                  <>
                    <RefreshCw size={14} />
                    Update &amp; Re-publish
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit for Motion
                  </>
                )}
              </button>
            </div>

            {/* ── Footer stats ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: (
                    <>
                      <Layers size={12} />
                      {` ${total} task${total !== 1 ? "s" : ""}`}
                    </>
                  ),
                  bg: t.bgMuted,
                  color: t.textSecondary,
                },
                {
                  label: (
                    <>
                      <UserCheck size={12} />
                      {` ${assigned} assigned`}
                    </>
                  ),
                  bg: t.successBg,
                  color: t.success,
                },
                {
                  label: (
                    <>
                      <UserX size={12} />
                      {` ${unassigned} unassigned`}
                    </>
                  ),
                  bg: t.bgMuted,
                  color: t.textMuted,
                },
                {
                  label: (
                    <>
                      <MessageSquare size={12} />
                      {` ${totalComments} comment${totalComments !== 1 ? "s" : ""}`}
                    </>
                  ),
                  bg: t.violetBg,
                  color: t.violet,
                },
              ].map((s) => (
                <span
                  key={s.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: s.bg,
                    color: s.color,
                    fontSize: 11.5,
                    fontWeight: 500,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {s.label}
                </span>
              ))}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11.5,
                  color: "#94A3B8",
                }}
              >
                <span>
                  Project:{" "}
                  <strong style={{ color: "#475569" }}>{project || "—"}</strong>
                </span>
                <span style={{ color: "#E2E8F0" }}>|</span>
                <span>
                  PO: <strong style={{ color: "#475569" }}>{po || "—"}</strong>
                </span>
              </div>
            </div>
          </>
        )}
        {/* ── GANTT VIEW ── */}
        {view === "gantt" && (
          <>
            {rows.length > 0 ? (
              <GanttView
                // rows={rows}
                projects={[draft]}
                overlapRowIds={overlapRowIds}
                onOpenComments={(row) =>
                  onOpenCommentBox(draft.id, row.id, row.moduleId)
                }
                onFeedback={setFeedbackRow}
              />
            ) : (
              <div
                style={{
                  background: t.bgCard,
                  border: `1px dashed ${t.borderDashed}`,
                  borderRadius: 12,
                  padding: "60px 20px",
                  textAlign: "center",
                  color: t.textFaint,
                  fontSize: 13,
                }}
              >
                <Calendar
                  size={32}
                  strokeWidth={1.5}
                  style={{ marginBottom: 12, opacity: 0.5 }}
                />
                <div
                  style={{
                    fontWeight: 600,
                    color: t.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  No activities to display
                </div>
                <div>Add activities in the Activities tab first.</div>
              </div>
            )}
          </>
        )}
        {/* ── UPDATES VIEW ── */}
        {view === "updates" && (
          <ProjectUpdatesView
            projectId={draft.id}
            currentUserId={currentUserId}
            projectOwnerId={projectOwnerId} // ← NEW PROP
            showToast={showToast}
            readOnly={draft.status === "closed"}
            projectName={project}
          />
        )}
        {/* ── Submit / Draft Bar ── */}
      </div>

      {/* ── Modals ── */}
      {openCommentDialog && newComment && (
        <CommentsActionDialog
          open={openCommentDialog}
          onClose={() => setOpenCommentDialog(false)}
          existingComments={existingComments}
          setExistingComments={setExistingComments}
          newComment={newComment}
          setNewComment={setNewComment}
          allowActions={draft.status === "closed" ? false : true}
        />
      )}
      {rejectRow && (
        <RejectReasonModal
          row={rejectRow}
          onClose={() => !isRejecting && setRejectRow(null)}
          onConfirm={handleRedoReject}
          isSubmitting={isRejecting}
        />
      )}
      {validationOpen && (
        <ValidationModal
          results={validationResults}
          warnings={validationWarnings} // ← NEW
          onClose={() => setValidationOpen(false)}
          onConfirm={handleConfirmMotion}
          isSaving={isSaving}
          isRepublish={motionSubmitted}
        />
      )}
      {feedbackRow && (
        <FeedbackModal
          row={feedbackRow}
          onClose={() => !isFeedbackSubmitting && setFeedbackRow(null)}
          onConfirm={handleFeedbackSubmit}
          isSubmitting={isFeedbackSubmitting}
        />
      )}
      {closeProjectOpen && (
        <ProjectCloseModal
          project={project}
          rows={rows}
          onClose={() => !isClosingProject && setCloseProjectOpen(false)}
          onConfirm={handleCloseProject}
          isSubmitting={isClosingProject}
          readOnly={draft.status === "closed"}
          savedFeedback={draft.status === "closed" ? draft : null}
        />
      )}
      {coAssignerModalOpen && (
        <CoAssignerModal
          project={draft}
          currentUserId={currentUserId}
          currentUserRole={currentUserProjectRole}
          allUsers={allUsersForCoAssigner}
          isLoadingUsers={loadingUsersForCoAssigner}
          usersError={usersErrorForCoAssigner}
          onRetryLoadUsers={() => {
            setCoAssignerModalOpen(false);
            setTimeout(() => setCoAssignerModalOpen(true), 100);
          }}
          onClose={() => setCoAssignerModalOpen(false)}
          onAddCoAssigner={handleAddCoAssigner} // ← NEW
          onRemoveCoAssigner={handleRemoveCoAssigner} // ← NEW
        />
      )}
      {/* ── Toasts ── */}
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  );
}
/* ─── Draft Projects List View ─── */
function DraftProjectsList({
  drafts,
  loading,
  error,
  deletingProjectId,
  groupLabels,
  currentUserId,
  onOpen,
  onDelete,
  onNew,
  onRefresh,
  dateRange,
  onDateRangeChange,
}) {
  const { t } = useTheme();

  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Date range state
  const [dateMode, setDateMode] = useState("currentMonth");
  const [lastAppliedCustom, setLastAppliedCustom] = useState({
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
  });
  const [customFrom, setCustomFrom] = useState(dateRange.fromDate);
  const [customTo, setCustomTo] = useState(dateRange.toDate);
  const [customOpen, setCustomOpen] = useState(false);

  const customPickerRef = useRef(null);
  const customToggleBtnRef = useRef(null);

  const toSimpleDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateMode("currentMonth");
    setCustomOpen(false);
    onDateRangeChange({
      fromDate: toSimpleDate(first),
      toDate: toSimpleDate(last),
    });
  };

  const handleLast3Months = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateMode("last3Months");
    setCustomOpen(false);
    onDateRangeChange({
      fromDate: toSimpleDate(from),
      toDate: toSimpleDate(to),
    });
  };

  const handleCustomToggle = () => {
    if (!customOpen) {
      setCustomFrom(lastAppliedCustom.fromDate);
      setCustomTo(lastAppliedCustom.toDate);
    }
    setDateMode("custom");
    setCustomOpen((p) => !p);
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    if (customFrom > customTo) {
      alert("From date must be before To date");
      return;
    }
    setLastAppliedCustom({ fromDate: customFrom, toDate: customTo });
    onDateRangeChange({ fromDate: customFrom, toDate: customTo });
    setCustomOpen(false);
  };

  const handleCustomCancel = () => {
    setCustomFrom(lastAppliedCustom.fromDate);
    setCustomTo(lastAppliedCustom.toDate);
    setCustomOpen(false);
  };

  useEffect(() => {
    if (!customOpen) return;
    const handler = (e) => {
      if (customPickerRef.current?.contains(e.target)) return;
      if (customToggleBtnRef.current?.contains(e.target)) return;
      handleCustomCancel();
    };
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      0,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
    // eslint-disable-next-line
  }, [customOpen, lastAppliedCustom]);

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(2)}`;
  };

  const isMineProject = useCallback(
    (d) =>
      d.createdBy &&
      currentUserId &&
      d.createdBy.toLowerCase() === currentUserId.toLowerCase(),
    [currentUserId],
  );

  const isCoAssignedProject = useCallback(
    (d) => {
      if (!currentUserId) return false;
      return (d.coAssigners || []).some(
        (ca) => ca.userId?.toLowerCase() === currentUserId.toLowerCase(),
      );
    },
    [currentUserId],
  );

  const isUpdatesSharedProject = useCallback(
    (d) => {
      if (!currentUserId) return false;
      const categories = d.updates?.categories || [];
      return categories.some((cat) =>
        (cat.sharedWith || []).some(
          (s) => s.userId?.toLowerCase() === currentUserId.toLowerCase(),
        ),
      );
    },
    [currentUserId],
  );

  const statusCounts = useMemo(() => {
    const isMine = (d) => isMineProject(d);
    const isShared = (d) =>
      !isMine(d) && (isCoAssignedProject(d) || isUpdatesSharedProject(d));

    return {
      all: drafts.length,
      draft: drafts.filter(
        (d) => isMine(d) && d.status !== "published" && d.status !== "closed",
      ).length,
      published: drafts.filter((d) => isMine(d) && d.status === "published")
        .length,
      closed: drafts.filter((d) => isMine(d) && d.status === "closed").length,
      coAssigned: drafts.filter((d) => !isMine(d) && isCoAssignedProject(d))
        .length,
      sharedWithMe: drafts.filter((d) => isShared(d)).length,
    };
  }, [drafts, isMineProject, isCoAssignedProject, isUpdatesSharedProject]);

  const filtered = useMemo(() => {
    let result = drafts;

    if (statusFilter === "draft") {
      result = result.filter(
        (d) =>
          isMineProject(d) && d.status !== "published" && d.status !== "closed",
      );
    } else if (statusFilter === "published") {
      result = result.filter(
        (d) => isMineProject(d) && d.status === "published",
      );
    } else if (statusFilter === "closed") {
      result = result.filter((d) => isMineProject(d) && d.status === "closed");
    } else if (statusFilter === "coAssigned") {
      result = result.filter((d) => isCoAssignedProject(d));
    } else if (statusFilter === "sharedWithMe") {
      result = result.filter(
        (d) =>
          d.createdBy &&
          currentUserId &&
          d.createdBy.toLowerCase() !== currentUserId.toLowerCase() &&
          !isCoAssignedProject(d),
      );
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          (d.project || "").toLowerCase().includes(q) ||
          (d.po || "").toLowerCase().includes(q) ||
          (d.site || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [
    drafts,
    search,
    statusFilter,
    currentUserId,
    isMineProject,
    isCoAssignedProject,
  ]);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Themed button style helper
  const themedBtn = {
    height: 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <div
      style={{ padding: "16px 20px 32px", maxWidth: 1600, margin: "0 auto" }}
    >
      {/* Status Filter Tabs */}
      {!loading && !error && drafts.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 16,
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: 4,
            boxShadow: t.shadowSm,
            width: "fit-content",
            flexWrap: "wrap",
          }}
        >
          {[
            {
              key: "all",
              label: "All Projects",
              icon: <Briefcase size={14} />,
              color: t.textSecondary,
            },
            {
              key: "draft",
              label: "Drafts",
              icon: <FileText size={11} />,
              color: t.warning,
            },
            {
              key: "published",
              label: "Published",
              icon: <Rocket size={11} />,
              color: t.success,
            },
            {
              key: "closed",
              label: "Closed",
              icon: <Lock size={11} />,
              color: t.textSecondary,
            },
            {
              key: "coAssigned",
              label: "Co-Assigned",
              icon: <Handshake size={14} />,
              color: t.success,
            },
            {
              key: "sharedWithMe",
              label: "Shared with Me",
              icon: <Users size={14} />,
              color: t.primary,
            },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            const count = statusCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: active ? t.textPrimary : "transparent",
                  color: active ? t.bgCard : tab.color,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Sora,sans-serif",
                  transition: "all .15s",
                }}
              >
                <span style={{ fontSize: 13 }}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 20,
                    height: 18,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: active ? "rgba(255,255,255,0.2)" : t.bgMuted,
                    color: active ? t.bgCard : t.textMuted,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Header + Date Tabs + Search + Actions */}
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 16,
          boxShadow: t.shadowSm,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: t.warningBg,
            color: t.warning,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Briefcase size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: t.textPrimary }}>
            Projects
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
            {drafts.length === 0
              ? "No projects found in this date range."
              : `${drafts.length} project${drafts.length !== 1 ? "s" : ""} `}
            <span style={{ color: t.textFaint }}>
              ({formatDateShort(dateRange.fromDate)} →{" "}
              {formatDateShort(dateRange.toDate)})
            </span>
          </div>
        </div>

        {/* Date Range Preset Tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: t.bgMuted,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 3,
            position: "relative",
          }}
        >
          <button
            onClick={handleCurrentMonth}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background:
                dateMode === "currentMonth" ? t.primary : "transparent",
              color: dateMode === "currentMonth" ? t.textInverse : t.textMuted,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Sora,sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Calendar size={12} />
            Current Month
          </button>
          <button
            onClick={handleLast3Months}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background:
                dateMode === "last3Months" ? t.primary : "transparent",
              color: dateMode === "last3Months" ? t.textInverse : t.textMuted,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Sora,sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Clock size={12} />
            Last 3 Months
          </button>
          <button
            ref={customToggleBtnRef}
            onClick={handleCustomToggle}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: dateMode === "custom" ? t.primary : "transparent",
              color: dateMode === "custom" ? t.textInverse : t.textMuted,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Sora,sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Filter size={12} />
            Custom
          </button>

          {customOpen && (
            <div
              ref={customPickerRef}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: t.bgCard,
                border: `1px solid ${t.borderStrong}`,
                borderRadius: 10,
                padding: 12,
                boxShadow: t.shadowLg,
                zIndex: 100,
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                fontFamily: "Sora,sans-serif",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 600,
                    color: t.textMuted,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  From
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={customTo || undefined}
                  style={{
                    height: 32,
                    border: `1px solid ${t.borderStrong}`,
                    borderRadius: 6,
                    padding: "0 8px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    outline: "none",
                    color: t.textPrimary,
                    background: t.bgInput,
                  }}
                />
              </div>

              <span style={{ color: t.textFaint, paddingBottom: 8 }}>→</span>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 600,
                    color: t.textMuted,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  To
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom || undefined}
                  style={{
                    height: 32,
                    border: `1px solid ${t.borderStrong}`,
                    borderRadius: 6,
                    padding: "0 8px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    outline: "none",
                    color: t.textPrimary,
                    background: t.bgInput,
                  }}
                />
              </div>

              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 6,
                  border: "none",
                  background:
                    !customFrom || !customTo ? t.borderStrong : t.primary,
                  color: t.textInverse,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: !customFrom || !customTo ? "not-allowed" : "pointer",
                  fontFamily: "Sora,sans-serif",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Check size={12} />
                Apply
              </button>

              <button
                onClick={handleCustomCancel}
                style={{
                  height: 32,
                  padding: "0 10px",
                  borderRadius: 6,
                  border: `1px solid ${t.borderStrong}`,
                  background: t.bgCard,
                  color: t.textMuted,
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "Sora,sans-serif",
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: 240 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: t.textFaint,
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, PO, site…"
            style={{
              height: 36,
              width: "100%",
              border: `1px solid ${t.borderStrong}`,
              borderRadius: 8,
              padding: "0 12px 0 32px",
              fontFamily: "Sora,sans-serif",
              fontSize: 12.5,
              outline: "none",
              boxSizing: "border-box",
              background: t.bgInput,
              color: t.textPrimary,
            }}
          />
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          style={{ ...themedBtn, height: 36, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? (
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <RefreshCw size={14} />
          )}{" "}
          Refresh
        </button>

        <button
          onClick={onNew}
          style={{
            ...themedBtn,
            height: 36,
            background: t.primary,
            color: t.textInverse,
            borderColor: t.primary,
            fontWeight: 600,
          }}
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            padding: "60px 20px",
            textAlign: "center",
            color: t.textMuted,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          Loading projects from server...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            background: t.dangerBgSubtle,
            border: `1px solid ${t.dangerBorder}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: t.dangerBg,
              color: t.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertOctagon size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: t.danger,
                fontSize: 13.5,
                marginBottom: 3,
              }}
            >
              Failed to load projects
            </div>
            <div
              style={{
                color: t.dangerTextDeep,
                fontSize: 11.5,
                lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(255,255,255,0.5)",
                padding: "4px 8px",
                borderRadius: 5,
                border: `1px solid ${t.dangerBorder}`,
                wordBreak: "break-word",
              }}
            >
              {error}
            </div>
          </div>
          <button
            onClick={onRefresh}
            style={{
              ...themedBtn,
              background: t.danger,
              color: t.textInverse,
              borderColor: t.danger,
              flexShrink: 0,
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div
              style={{
                background: t.bgCard,
                border: `1px dashed ${t.borderDashed}`,
                borderRadius: 12,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    statusFilter === "sharedWithMe"
                      ? t.primaryBg
                      : statusFilter === "published"
                        ? t.successBg
                        : statusFilter === "closed"
                          ? t.closedBg
                          : t.warningBg,
                  color:
                    statusFilter === "sharedWithMe"
                      ? t.primary
                      : statusFilter === "published"
                        ? t.success
                        : statusFilter === "closed"
                          ? t.closedText
                          : t.warning,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {statusFilter === "sharedWithMe" ? (
                  <Users size={26} />
                ) : statusFilter === "published" ? (
                  <Rocket size={26} />
                ) : statusFilter === "closed" ? (
                  <Lock size={26} />
                ) : (
                  <ClipboardList size={26} />
                )}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: t.textPrimary,
                  marginBottom: 4,
                }}
              >
                {search
                  ? "No matching projects"
                  : statusFilter === "sharedWithMe"
                    ? "No projects shared with you"
                    : statusFilter === "draft"
                      ? "No draft projects"
                      : statusFilter === "published"
                        ? "No published projects yet"
                        : statusFilter === "closed"
                          ? "No closed projects"
                          : "No projects yet"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  maxWidth: 420,
                  margin: "0 auto 16px",
                }}
              >
                {search
                  ? "Try a different search term or filter."
                  : "Create a new project to get started."}
              </div>
              {!search &&
                statusFilter !== "sharedWithMe" &&
                statusFilter !== "published" &&
                statusFilter !== "closed" && (
                  <button
                    onClick={onNew}
                    style={{
                      ...themedBtn,
                      background: t.primary,
                      color: t.textInverse,
                      borderColor: t.primary,
                    }}
                  >
                    <Plus size={16} style={{ marginRight: 8 }} />
                    Create your first project
                  </button>
                )}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((d) => {
                const isMine = isMineProject(d);
                const isCoAssigned = isCoAssignedProject(d);
                const isUpdatesShared = isUpdatesSharedProject(d);
                const moduleCount = new Set(
                  (d.rows || [])
                    .filter((r) => !r.parentId && r.module)
                    .map((r) => r.module),
                ).size;
                const taskCount = (d.rows || []).filter(
                  (r) => !r.parentId,
                ).length;
                const subTaskCount = (d.rows || []).filter(
                  (r) => r.parentId,
                ).length;
                const status = d.status || "draft";

                const isSharedProject =
                  d.createdBy &&
                  currentUserId &&
                  d.createdBy.toLowerCase() !== currentUserId.toLowerCase();

                const cardVariant = isCoAssigned
                  ? "co-assigned"
                  : isSharedProject
                    ? "shared"
                    : "own";

                const variantColors = {
                  "co-assigned": {
                    borderColor: t.successBorder,
                    leftBorder: `4px solid ${t.success}`,
                    shadow: t.shadowSm,
                    shadowHover: t.shadowMd,
                    hoverBorder: t.success,
                    openArrowColor: t.success,
                    avatarBg: t.success,
                    infoBg: t.successBgSubtle,
                    infoBorder: t.successBorder,
                    infoLabelColor: t.success,
                  },
                  shared: {
                    borderColor: t.primaryBorder,
                    leftBorder: `4px solid ${t.primary}`,
                    shadow: t.shadowSm,
                    shadowHover: t.shadowMd,
                    hoverBorder: t.primary,
                    openArrowColor: t.primary,
                    avatarBg: t.primary,
                    infoBg: t.primaryBgSubtle,
                    infoBorder: t.primaryBorder,
                    infoLabelColor: t.primary,
                  },
                  own: {
                    borderColor: t.border,
                    leftBorder: `1px solid ${t.border}`,
                    shadow: t.shadowSm,
                    shadowHover: t.shadowMd,
                    hoverBorder: t.primaryBorder,
                    openArrowColor: t.violet,
                    avatarBg: t.violet,
                    infoBg: t.bgSubtle,
                    infoBorder: t.border,
                    infoLabelColor: t.textSecondary,
                  },
                };
                const colors = variantColors[cardVariant];

                return (
                  <div
                    key={d.id}
                    onClick={() => onOpen(d.id)}
                    style={{
                      background: t.bgCard,
                      border: `1px solid ${colors.borderColor}`,
                      borderLeft: colors.leftBorder,
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                      transition: "all .15s",
                      boxShadow: colors.shadow,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      minHeight: 180,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.hoverBorder;
                      e.currentTarget.style.boxShadow = colors.shadowHover;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.borderColor;
                      e.currentTarget.style.boxShadow = colors.shadow;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Corner ribbons */}
                    {cardVariant === "co-assigned" && (
                      <div
                        style={{
                          position: "absolute",
                          top: 18,
                          right: -40,
                          background: `linear-gradient(135deg, ${t.success} 0%, ${t.success} 100%)`,
                          color: t.textInverse,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          padding: "4px 44px",
                          transform: "rotate(40deg)",
                          transformOrigin: "center",
                          boxShadow: t.shadowSm,
                          zIndex: 1,
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                          textAlign: "center",
                          minWidth: 140,
                        }}
                      >
                        Co-Assigned
                      </div>
                    )}
                    {cardVariant === "shared" && (
                      <div
                        style={{
                          position: "absolute",
                          top: 18,
                          right: -40,
                          background: `linear-gradient(135deg, ${t.primary} 0%, ${t.primaryHover} 100%)`,
                          color: t.textInverse,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          padding: "4px 44px",
                          transform: "rotate(40deg)",
                          transformOrigin: "center",
                          boxShadow: t.shadowSm,
                          zIndex: 1,
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                          textAlign: "center",
                          minWidth: 140,
                        }}
                      >
                        Shared
                      </div>
                    )}

                    {/* Status + delete */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            background:
                              status === "closed"
                                ? t.closedBg
                                : status === "published"
                                  ? t.successBg
                                  : t.warningBg,
                            color:
                              status === "closed"
                                ? t.closedText
                                : status === "published"
                                  ? t.success
                                  : t.warning,
                            border: `1px solid ${
                              status === "closed"
                                ? t.closedBorder
                                : status === "published"
                                  ? t.successBorder
                                  : t.warningBorder
                            }`,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {status === "closed" ? (
                            <>
                              <Lock size={11} /> Closed
                            </>
                          ) : status === "published" ? (
                            <>
                              <Rocket size={11} /> Published
                            </>
                          ) : (
                            <>
                              <FileText size={11} /> Draft
                            </>
                          )}
                        </span>

                        {isCoAssigned && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 9px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              background: t.successBg,
                              color: t.success,
                              border: `1px solid ${t.successBorder}`,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            <Handshake size={11} /> Co-Assigner
                          </span>
                        )}

                        {isUpdatesShared && !isMine && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 9px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              background: t.primaryBg,
                              color: t.primary,
                              border: `1px solid ${t.primaryBorder}`,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            <FileText size={11} /> Updates
                          </span>
                        )}
                      </div>

                      {d.status !== "published" &&
                        d.status !== "closed" &&
                        cardVariant === "own" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (deletingProjectId !== d.id)
                                setConfirmDelete(d);
                            }}
                            disabled={deletingProjectId === d.id}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              border: `1px solid ${t.dangerBorder}`,
                              background:
                                deletingProjectId === d.id
                                  ? t.bgMuted
                                  : t.dangerBgSubtle,
                              color:
                                deletingProjectId === d.id
                                  ? t.textFaint
                                  : t.danger,
                              cursor:
                                deletingProjectId === d.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: deletingProjectId === d.id ? 0.6 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              flexShrink: 0,
                            }}
                          >
                            {deletingProjectId === d.id ? (
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: t.textPrimary,
                          marginBottom: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={d.project || "Untitled Project"}
                      >
                        {d.project || "Untitled Project"}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: t.textMuted,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          PO:{" "}
                          <strong style={{ color: t.textSecondary }}>
                            {d.po || "—"}
                          </strong>
                        </span>
                        <span style={{ color: t.textDisabled }}>•</span>
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.site || "No site"}
                        </span>
                      </div>
                    </div>

                    {/* Owner info */}
                    {d.createdBy && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 10px",
                          background: colors.infoBg,
                          border: `1px solid ${colors.infoBorder}`,
                          borderRadius: 6,
                          fontSize: 10.5,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: colors.avatarBg,
                            color: t.textInverse,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 10,
                            flexShrink: 0,
                          }}
                        >
                          {cardVariant === "own"
                            ? "Y"
                            : (d.createdBy || "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: t.textMuted,
                              fontSize: 9.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              fontWeight: 600,
                            }}
                          >
                            {cardVariant === "own" ? "Created by" : "Owned by"}
                          </div>
                          <div
                            style={{
                              color: colors.infoLabelColor,
                              fontWeight: 600,
                              fontSize: 11,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cardVariant === "own" ? "You" : d.createdBy}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Co-assigner count */}
                    {cardVariant === "own" &&
                      (d.coAssigners || []).length > 0 && (
                        <div
                          style={{
                            padding: "5px 10px",
                            background: t.successBgSubtle,
                            border: `1px solid ${t.successBorder}`,
                            borderRadius: 6,
                            fontSize: 10.5,
                            color: t.success,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Handshake size={11} />
                          <span>
                            Shared with {(d.coAssigners || []).length}{" "}
                            co-assigner
                            {(d.coAssigners || []).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                    {/* Stats */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginTop: "auto",
                      }}
                    >
                      <span style={statChip(t.infoBg, t.info, t.infoBorder)}>
                        <Package size={11} /> {moduleCount}{" "}
                        {moduleCount === 1 ? "module" : "modules"}
                      </span>
                      <span
                        style={statChip(
                          t.successBgSubtle,
                          t.success,
                          t.successBorder,
                        )}
                      >
                        <CheckCircle2 size={11} /> {taskCount}{" "}
                        {taskCount === 1 ? "task" : "tasks"}
                      </span>
                      {subTaskCount > 0 && (
                        <span
                          style={statChip(t.violetBg, t.violet, t.violetBorder)}
                        >
                          └─ {subTaskCount} subs
                        </span>
                      )}
                    </div>

                    {/* Groups */}
                    {(d.groups || []).length > 0 && (
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {d.groups.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            style={{
                              padding: "2px 7px",
                              background: t.primaryBg,
                              color: t.primary,
                              border: `1px solid ${t.primaryBorder}`,
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {getGroupName(g, groupLabels)}
                          </span>
                        ))}
                        {d.groups.length > 3 && (
                          <span style={{ fontSize: 10, color: t.textFaint }}>
                            +{d.groups.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      style={{
                        fontSize: 10.5,
                        color: t.textFaint,
                        borderTop: `1px solid ${t.borderSubtle}`,
                        paddingTop: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={11} /> {fmtDate(d.updatedAt)}
                      </span>
                      <span
                        style={{
                          color: colors.openArrowColor,
                          fontWeight: 600,
                        }}
                      >
                        Open →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          onClick={(e) => {
            if (deletingProjectId) return;
            e.target === e.currentTarget && setConfirmDelete(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: t.bgOverlay,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: t.bgCard,
              borderRadius: 12,
              padding: 20,
              width: "100%",
              maxWidth: 400,
              fontFamily: "Sora,sans-serif",
              color: t.textPrimary,
              boxShadow: t.shadowXl,
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: t.dangerBgSubtle,
                  color: t.danger,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: t.textPrimary,
                  }}
                >
                  Delete this draft?
                </div>
                <div
                  style={{ fontSize: 11.5, color: t.textMuted, marginTop: 4 }}
                >
                  <strong>{confirmDelete.project || "Untitled"}</strong> will be
                  permanently removed. This cannot be undone.
                </div>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button onClick={() => setConfirmDelete(null)} style={themedBtn}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDelete(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                disabled={deletingProjectId === confirmDelete?.id}
                style={{
                  ...themedBtn,
                  background: t.danger,
                  color: t.textInverse,
                  borderColor: t.danger,
                  opacity: deletingProjectId === confirmDelete?.id ? 0.6 : 1,
                }}
              >
                {deletingProjectId === confirmDelete?.id ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// const statChip = (bg, color, border) => ({
//   display: "inline-flex",
//   alignItems: "center",
//   gap: 4,
//   padding: "2px 8px",
//   borderRadius: 4,
//   fontSize: 10.5,
//   fontWeight: 600,
//   background: bg,
//   color,
//   border: `1px solid ${border}`,
// });

const statChip = (bg, color, border) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 10.5,
  fontWeight: 600,
  background: bg,
  color,
  border: `1px solid ${border}`,
});
const DataContext = createContext({
  groupLabels: [],
  groupResources: {},
  resourcesLoading: false,
  fetchResourcesForGroups: async () => {},
});

/* ─── Top-level App with Tab Navigation ─── */
export default function AssignerModule() {
  const { t, isDark, toggle } = useTheme();
  const currentUserId = getUserData()?.userDetails?.userId || null;

  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [tab, setTab] = useState("drafts");
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState(null);
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [ganttCommentOpen, setGanttCommentOpen] = useState(false);
  const [ganttExistingComments, setGanttExistingComments] = useState([]);
  const [ganttNewComment, setGanttNewComment] = useState(null);
  const [ganttFeedbackRow, setGanttFeedbackRow] = useState(null);
  const [groupLabels, setGroupLabels] = useState([]);
  const [groupResources, setGroupResources] = useState({});
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Date range state (default = current month)
  const toSimpleDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentMonthRange = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { fromDate: toSimpleDate(first), toDate: toSimpleDate(last) };
  };

  const [dateRange, setDateRange] = useState(getCurrentMonthRange());

  const showToast = useCallback((kind, title, msg, dur = 3800) => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, kind, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((tt) => tt.id !== id)), dur);
  }, []);

  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const groups = await activityTrackerApi.getAllGroups();
      setGroupLabels(Array.isArray(groups) ? groups : []);
    } catch (err) {
      setGroupsError(err.message);
      showToast("error", "Failed to load groups", err.message);
    } finally {
      setGroupsLoading(false);
    }
  }, [showToast]);

  const handleGanttOpenComments = useCallback(
    async (row) => {
      try {
        const existingCommentsResp =
          await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
            row._projectId,
            row.id,
          );
        const newCommentBody = addComment(row._projectId, row.id, row.moduleId);
        setGanttExistingComments(existingCommentsResp || []);
        setGanttNewComment(newCommentBody);
        setGanttCommentOpen(true);
      } catch (err) {
        showToast("error", "Failed to load comments", err.message);
      }
    },
    [showToast],
  );

  const handleGanttViewFeedback = useCallback((row) => {
    const status = String(row.status || "")
      .toLowerCase()
      .trim();
    if (status !== "finished") return;
    setGanttFeedbackRow(row);
  }, []);

  const fetchResourcesForGroups = useCallback(
    async (groupIds) => {
      if (!groupIds || groupIds.length === 0) return {};
      const missing = groupIds.filter((id) => !(id in groupResources));
      if (missing.length === 0) return groupResources;

      setResourcesLoading(true);
      try {
        const data =
          await activityTrackerApi.getUserIdAndLeavesBygroupIds(missing);
        const safeData = data && typeof data === "object" ? data : {};
        const merged = { ...groupResources, ...safeData };
        setGroupResources(merged);
        return merged;
      } catch (err) {
        showToast("error", "Failed to load resources", err.message);
        return groupResources;
      } finally {
        setResourcesLoading(false);
      }
    },
    [groupResources, showToast],
  );

  const fetchProjects = useCallback(
    async (fromDate, toDate) => {
      setDraftsLoading(true);
      setDraftsError(null);
      try {
        const projects = await activityTrackerApi.getActivityTreeCreatedByUser(
          fromDate,
          toDate,
        );
        setDrafts(Array.isArray(projects) ? projects : []);
      } catch (err) {
        setDraftsError(err.message);
        showToast("error", "Failed to load projects", err.message);
      } finally {
        setDraftsLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchProjects(dateRange.fromDate, dateRange.toDate);
  }, [fetchProjects, dateRange]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const currentDraft = useMemo(() => {
    const saved = drafts?.find((d) => d.id === currentProjectId);
    if (saved) return saved;
    if (pendingDraft && pendingDraft.id === currentProjectId)
      return pendingDraft;
    return null;
  }, [drafts, currentProjectId, pendingDraft]);

  const handleNewProject = useCallback(() => {
    const newProject = {
      id: generateProjectId(),
      project: "",
      po: "",
      site: "",
      groups: [],
      rows: [],
      createdBy: currentUserId,
      coAssigners: [],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPendingDraft(newProject);
    setCurrentProjectId(newProject.id);
    setTab("editor");
  }, [currentUserId]);

  const handleOpenDraft = (id) => {
    setCurrentProjectId(id);
    setTab("editor");
  };

  const handleDeleteDraft = useCallback(
    async (id) => {
      setDeletingProjectId(id);
      try {
        await activityTrackerApi.deleteProject(id);
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        if (currentProjectId === id) {
          setCurrentProjectId(null);
          setTab("drafts");
        }
        showToast(
          "success",
          "Project deleted",
          "The project has been permanently removed.",
        );
      } catch (err) {
        showToast("error", "Delete failed", err.message);
        fetchProjects(dateRange.fromDate, dateRange.toDate);
      } finally {
        setDeletingProjectId(null);
      }
    },
    [showToast, fetchProjects, currentProjectId, dateRange],
  );

  const handleSaveDraft = useCallback(
    async (projectData, options = {}) => {
      const { skipApiCall = false } = options;
      const payload = {
        ...projectData,
        status: projectData.status === "published" ? "published" : "draft",
        updatedAt: new Date().toISOString(),
      };

      setSavingProjectId(projectData.id);
      try {
        if (!skipApiCall) {
          await activityTrackerApi.postActivityTree(payload);
        }
        const finalData = { ...payload };
        setDrafts((prev) => {
          const exists = prev.some((d) => d.id === finalData.id);
          return exists
            ? prev.map((d) => (d.id === finalData.id ? finalData : d))
            : [finalData, ...prev];
        });
        setPendingDraft((prev) => (prev?.id === projectData.id ? null : prev));

        if (!skipApiCall) {
          showToast(
            "success",
            "Draft saved",
            `"${finalData.project || "Untitled Project"}" was saved successfully.`,
          );
        }
        return finalData;
      } catch (err) {
        showToast("error", "Save failed", err?.message || "Save failed");
        throw err;
      } finally {
        setSavingProjectId(null);
      }
    },
    [showToast],
  );

  const handlePublish = useCallback(
    async (projectData) => {
      const isUpdate = projectData.status === "published";
      const isClose = projectData.status === "closed";

      const payload = {
        ...projectData,
        status: isClose ? "closed" : "published",
        publishedAt:
          isUpdate || isClose
            ? projectData.publishedAt
            : new Date().toISOString(),
        closedAt: isClose
          ? projectData.closedAt || new Date().toISOString()
          : projectData.closedAt || null,
        updatedAt: new Date().toISOString(),
      };

      setSavingProjectId(projectData.id);
      try {
        await activityTrackerApi.postActivityTree(payload);
        const finalData = { ...payload };
        setDrafts((prev) => {
          const exists = prev.some((d) => d.id === finalData.id);
          return exists
            ? prev.map((d) => (d.id === finalData.id ? finalData : d))
            : [finalData, ...prev];
        });
        setPendingDraft((prev) => (prev?.id === projectData.id ? null : prev));

        if (isClose) {
          showToast(
            "success",
            "Project Closed 🔒",
            `"${finalData.project}" has been closed.`,
          );
        } else if (isUpdate) {
          showToast(
            "success",
            "Project Updated 🔄",
            `"${finalData.project}" has been updated.`,
          );
        } else {
          showToast(
            "success",
            "Project Published 🚀",
            `"${finalData.project}" is now live.`,
          );
        }

        setTab("drafts");
        setCurrentProjectId(null);
      } catch (err) {
        showToast(
          "error",
          isClose
            ? "Close failed"
            : isUpdate
              ? "Update failed"
              : "Publish failed",
          err.message,
        );
        throw err;
      } finally {
        setSavingProjectId(null);
      }
    },
    [showToast],
  );

  const handleBackToList = useCallback(() => {
    setTab("drafts");
    setCurrentProjectId(null);
    fetchProjects(dateRange.fromDate, dateRange.toDate);
  }, [fetchProjects, dateRange]);

  // Loading screen
  if (groupsLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Sora,sans-serif",
          background: t.bgApp,
        }}
      >
        <div style={{ textAlign: "center", color: t.textMuted }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (groupsError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Sora,sans-serif",
          background: t.bgApp,
        }}
      >
        <div
          style={{
            background: t.dangerBgSubtle,
            border: `1px solid ${t.dangerBorder}`,
            borderRadius: 12,
            padding: 24,
            maxWidth: 480,
            textAlign: "center",
          }}
        >
          <AlertOctagon
            size={36}
            color={t.danger}
            style={{ marginBottom: 12 }}
          />
          <div style={{ fontWeight: 700, color: t.danger, marginBottom: 6 }}>
            Cannot load workspace
          </div>
          <div
            style={{ color: t.dangerTextDeep, fontSize: 12, marginBottom: 16 }}
          >
            {groupsError}
          </div>
          <button
            onClick={fetchGroups}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 7,
              background: t.danger,
              color: t.textInverse,
              border: `1px solid ${t.danger}`,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Sora,sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        minHeight: "100vh",
        background: t.bgApp,
        color: t.textPrimary,
        transition: "background .2s, color .2s",
      }}
    >
      {/* ── Top Nav ── */}
      <nav
        style={{
          height: 48,
          background: t.navBg,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
          boxShadow: t.shadowMd,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: t.navText,
            fontWeight: 700,
            fontSize: 14,
          }}
        />

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: t.navTabBg,
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${t.navTabBorder}`,
            }}
          >
            <button
              onClick={handleBackToList}
              style={{
                padding: "6px 14px",
                background: tab === "drafts" ? t.navActive : "transparent",
                color: tab === "drafts" ? t.textInverse : t.navMuted,
                fontSize: 11.5,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <FolderOpen size={14} /> Projects
              {drafts.filter(
                (d) => d.status !== "published" && d.status !== "closed",
              ).length > 0 && (
                <span
                  style={{
                    background:
                      tab === "drafts"
                        ? "rgba(255,255,255,0.25)"
                        : t.borderStrong,
                    color: t.textInverse,
                    borderRadius: 999,
                    padding: "1px 6px",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {
                    drafts.filter(
                      (d) => d.status !== "published" && d.status !== "closed",
                    ).length
                  }
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (!currentDraft) {
                  showToast(
                    "info",
                    "No project open",
                    "Open a draft or create a new one.",
                  );
                  return;
                }
                setTab("editor");
              }}
              disabled={!currentDraft}
              style={{
                padding: "6px 14px",
                background: tab === "editor" ? t.navActive : "transparent",
                color:
                  tab === "editor"
                    ? t.textInverse
                    : currentDraft
                      ? t.navMuted
                      : t.textDisabled,
                fontSize: 11.5,
                fontWeight: 600,
                border: "none",
                cursor: currentDraft ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 5,
                opacity: !currentDraft ? 0.5 : 1,
              }}
            >
              <Settings size={14} /> Assigner
            </button>

            <button
              onClick={() => setTab("gantt")}
              style={{
                padding: "6px 14px",
                background: tab === "gantt" ? t.navActive : "transparent",
                color: tab === "gantt" ? t.textInverse : t.navMuted,
                fontSize: 11.5,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Calendar size={14} /> Gantt
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      {tab === "drafts" ? (
        <DraftProjectsList
          drafts={drafts}
          loading={draftsLoading}
          error={draftsError}
          deletingProjectId={deletingProjectId}
          groupLabels={groupLabels}
          currentUserId={currentUserId}
          onOpen={handleOpenDraft}
          onDelete={handleDeleteDraft}
          onNew={handleNewProject}
          onRefresh={() => fetchProjects(dateRange.fromDate, dateRange.toDate)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      ) : tab === "gantt" ? (
        <div
          style={{
            padding: "16px 20px 32px",
            maxWidth: 1600,
            margin: "0 auto",
          }}
        >
          <GanttView
            projects={drafts.filter((d) => d.status !== "draft")}
            showGlobalFilters={true}
            onOpenComments={handleGanttOpenComments}
            onFeedback={handleGanttViewFeedback}
          />
        </div>
      ) : currentDraft ? (
        <ProjectEditor
          key={currentDraft.id}
          draft={currentDraft}
          groupLabels={groupLabels}
          groupResources={groupResources}
          fetchResourcesForGroups={fetchResourcesForGroups}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onBack={handleBackToList}
          showToast={showToast}
          currentUserId={currentUserId}
        />
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>
          No project selected.{" "}
          <button onClick={handleBackToList}>Back to drafts</button>
        </div>
      )}

      {/* Modals */}
      {ganttCommentOpen && ganttNewComment && (
        <CommentsActionDialog
          open={ganttCommentOpen}
          onClose={() => setGanttCommentOpen(false)}
          existingComments={ganttExistingComments}
          setExistingComments={setGanttExistingComments}
          newComment={ganttNewComment}
          setNewComment={setGanttNewComment}
        />
      )}
      {ganttFeedbackRow && (
        <FeedbackModal
          row={ganttFeedbackRow}
          onClose={() => setGanttFeedbackRow(null)}
          onConfirm={() => {}}
          isSubmitting={false}
        />
      )}

      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((tt) => tt.id !== id))}
      />
    </div>
  );
}
