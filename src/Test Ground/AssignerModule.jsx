import axios from "axios";
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
} from "lucide-react";
import { ShieldCheck, XCircle, ClipboardList, CalendarX } from "lucide-react";
import {
  PauseCircle, // paused
  PlayCircle, // running
} from "lucide-react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { MdDelete } from "react-icons/md";
import activityTrackerApi from "../Services/activityTrackerApi";
import { getUserData } from "../Modules/Login/Encrypt";

/* ─── Constants ─── */
/* ─── API Configuration ─── */
const API_BASE_URL = "http://localhost:8081/activityTracker";
const ADMIN_API_BASE = "http://localhost:8081/admin";
const TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhc2hvay5zaW5naEBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3ODE2NzQwMjEsImV4cCI6MTc4MTcxMDAyMX0._LL1jlf8Bcu9INwE-lLzon0Ox7IHzF_WHiOdqHPP5Hg";

const API = {
  saveProject: `${API_BASE_URL}/postActivityTree`,
  getAllProjects: `${API_BASE_URL}/getActivityTree`,
};
async function apiGetAllGroups() {
  const response = await activityTrackerApi.getAllGroups();
  //   fetch(`${ADMIN_API_BASE}/getallgroups`, {
  //     method: "GET",
  //     headers: {
  //       Accept: "application/json",
  //       Authorization: `Bearer ${getUserData()?.token}`,
  //     },
  //   });
  //   console.log(response);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch groups (${response.status}): ${response.statusText}`,
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/* ─── Fetch resources (users + leaves) for selected groups ─── */
async function apiGetResourcesByGroupIds(groupIds) {
  if (!groupIds || groupIds.length === 0) return {};

  const response =
    await activityTrackerApi.getUserIdAndLeavesBygroupIds(groupIds);

  //   fetch(
  //     `${ADMIN_API_BASE}/getUserIdAndLeavesBygroupIds`,
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json",
  //         Authorization: `Bearer ${TOKEN}`,
  //       },
  //       body: JSON.stringify(groupIds),
  //     },
  //   );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch resources (${response.status}): ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data && typeof data === "object" ? data : {};
}
async function apiDeleteProject(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to delete (${response.status}): ${text || response.statusText}`,
    );
  }

  // Handle empty response (204 No Content) or JSON response
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  return { success: true, deletedId: projectId };
}
/* ─── API Helpers ─── */
async function apiPostProject(projectData) {
  const response = await fetch(API.saveProject, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to save (${response.status}): ${text || response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

async function apiGetAllProjects() {
  const response = await activityTrackerApi.getAllProjects();
  //   fetch(API.getAllProjects, {
  //     method: "GET",
  //     headers: { Accept: "application/json", Authorization: `Bearer ${TOKEN}` },
  //   });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch projects (${response.status}): ${response.statusText}`,
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.projects || [];
}
/* ─── Draft Storage (localStorage) ─── */
// const STORAGE_KEY = "ess_draft_projects";

// function loadDrafts() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (!raw) return [];
//     const drafts = JSON.parse(raw);

//     return drafts.map((d) => {
//       if (!d.rows) return d;

//       // If old draft has no moduleRegistry, build one from rows
//       if (!d.moduleRegistry) {
//         const synced = syncModuleIds(d.rows, {});
//         return {
//           ...d,
//           rows: synced.rows,
//           moduleRegistry: synced.registry,
//         };
//       }
//       return d;
//     });
//   } catch {
//     return [];
//   }
// }

// async function loadDrafts() {
//   try {
//     const response = await axios.get(
//       "http://localhost:8081/activityTracker/getActivityTree",
//       {
//         headers: {
//           Authorization: `Bearer ${TOKEN}`,
//         },
//       },
//     );

//     const drafts = response.data;
//     console.log("Loaded drafts from API:", drafts);
//     if (!Array.isArray(drafts)) return [];

//     // Strip stale nextId from API response
//     return drafts.map((d) => {
//       const { nextId, ...rest } = d;
//       return rest;
//     });
//   } catch (error) {
//     console.error("Failed to load drafts:", error);
//     return [];
//   }
// }
// function saveDrafts(drafts) {
//   console.log("Saving drafts to API:", drafts);
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
//   } catch (e) {
//     console.error("Failed to save drafts:", e);
//   }
// }
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    Icon: Clock,
    bg: "#F8FAFC",
    color: "#64748B",
    border: "#E2E8F0",
  },
  "not ready": {
    label: "Not Ready",
    Icon: AlertCircle,
    bg: "#FEF3C7",
    color: "#B45309",
    border: "#FCD34D",
  },
  rejected: {
    label: "Rejected",
    Icon: XCircle,
    bg: "#FEE2E2",
    color: "#DC2626",
    border: "#FCA5A5",
  },
  paused: {
    label: "Paused",
    Icon: PauseCircle,
    bg: "#FFEDD5",
    color: "#C2410C",
    border: "#FDBA74",
  },
  running: {
    label: "Running",
    Icon: PlayCircle,
    bg: "#DBEAFE",
    color: "#1D4ED8",
    border: "#93C5FD",
    pulse: true, // ← pulsing animation
  },
  completed: {
    label: "Completed",
    Icon: CheckCircle2,
    bg: "#DCFCE7",
    color: "#15803D",
    border: "#86EFAC",
  },
  loading: {
    // bonus: for any loading state
    label: "Loading",
    Icon: Loader2,
    bg: "#EDE9FE",
    color: "#7C3AED",
    border: "#DDD6FE",
    spin: true, // ← spinning animation
  },
};

function getStatusConfig(status) {
  if (!status) return STATUS_CONFIG.Pending;
  const key = String(status).toLowerCase().trim();
  return (
    STATUS_CONFIG[key] || {
      label: status,
      Icon: HelpCircle,
      bg: "#F1F5F9",
      color: "#94A3B8",
      border: "#E2E8F0",
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

const GROUP_RESOURCES = {
  "Abis@greenwave.co.in": [
    {
      code: "AR",
      name: "Anchit Raj Roy",
      userId: "anchit.roy@greenwave.co.in",
      tone: 1,
      leaves: [],
    },
    {
      code: "AM",
      name: "Arindam Mondal",
      userId: "arindam.mondal@greenwave.co.in",
      tone: 2,
      leaves: [],
    },
    {
      code: "GB",
      name: "Gopal Basak",
      userId: "gopal.basak@greenwave.co.in",
      tone: 3,
      leaves: [],
    },
    {
      code: "GS",
      name: "Goutam Shui",
      userId: "goutam.shui@greenwave.co.in",
      tone: 4,
      leaves: [],
    },
    {
      code: "SP",
      name: "Sannidhya Pan",
      userId: "sannidhya.pan@greenwave.co.in",
      tone: 5,
      leaves: [],
    },
  ],
  "admin@greenwave.co.in": [
    {
      code: "AT",
      name: "Arun Thakur",
      userId: "arun.thakur@greenwave.co.in",
      tone: 1,
      leaves: [],
    },
    {
      code: "DM",
      name: "Deepa Menon",
      userId: "deepa.menon@greenwave.co.in",
      tone: 2,
      leaves: [{ date: "2026-05-14" }],
    },
    {
      code: "KS",
      name: "Kunal Shah",
      userId: "kunal.shah@greenwave.co.in",
      tone: 3,
      leaves: [],
    },
  ],
  "Appraiser@greenwave.co.in": [
    {
      code: "BL",
      name: "Bryan Lee",
      userId: "bryan.lee@greenwave.co.in",
      tone: 1,
      leaves: [],
    },
    {
      code: "CJ",
      name: "Chen Jian",
      userId: "chen.jian@greenwave.co.in",
      tone: 2,
      leaves: [{ date: "2026-05-18" }],
    },
    {
      code: "MR",
      name: "Mei Ramirez",
      userId: "mei.ramirez@greenwave.co.in",
      tone: 3,
      leaves: [],
    },
    {
      code: "TO",
      name: "Tomás Ortega",
      userId: "tomas.ortega@greenwave.co.in",
      tone: 4,
      leaves: [],
    },
  ],
};
const GROUP_LABELS = [
  {
    active: true,
    groupId: "Abis@greenwave.co.in",
    phoneNumber: 7908009891,
    homePage: "",
    groupName: "ABIS",
    groupManager: "avik.samanta@greenwave.co.in",
  },
  {
    active: true,
    groupId: "admin@greenwave.co.in",
    phoneNumber: 9831504426,
    homePage: "",
    groupName: "Admin",
    groupManager: "Swapnila.chakraborty@greenwave.co.in",
  },
  {
    active: true,
    groupId: "Appraiser@greenwave.co.in",
    phoneNumber: 9748066716,
    homePage: "",
    groupName: "Appraiser",
    groupManager: "Arup.Chakraborti@greenwave.co.in",
  },
];
/* ─── Group Helpers ─── */
function getGroupById(groupId) {
  return GROUP_LABELS.find((g) => g.groupId === groupId) || null;
}

function getGroupName(groupId, groupLabels) {
  return groupLabels.find((g) => g.groupId === groupId)?.groupName || groupId;
}

function getActiveGroups(groupLabels) {
  return groupLabels.filter((g) => g.active);
}
const SAMPLE_ROWS = [
  { module: "Logsheet CRM", task: "Scope Identification", durationHrs: 8 },
  {
    module: "Logsheet CRM",
    task: "Data Source Identification",
    durationHrs: 8,
  },
  { module: "Logsheet CRM", task: "FRS Creation & Sign-off", durationHrs: 16 },
  {
    module: "Logsheet CRM",
    task: "Data Integration & Configuration",
    durationHrs: 8,
  },
  {
    module: "Logsheet CRM",
    task: "Log Sheet (Operator Page)",
    durationHrs: 48,
  },
  { module: "Logsheet CRM", task: "Log Sheet Summary", durationHrs: 24 },
  {
    module: "Logsheet CRM",
    task: "Downtime Master & Config Creation",
    durationHrs: 24,
  },
  { module: "FPY CRM", task: "Scope Identification", durationHrs: "" },
  { module: "FPY CRM", task: "Data Source Identification", durationHrs: "" },
  { module: "Milestone", task: "UAT & Sign-off (Onsite)", durationHrs: "" },
];
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
    if (hr >= WORK_END_HR) {
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
  } else if (hr >= WORK_END_HR) {
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

/* ─── Chain computation ─── */
function recomputeChains(rows, groupResources = {}) {
  // Work on shallow copies
  const updated = rows.map((r) => ({ ...r }));

  // Build ID → row map for fast lookups
  const byId = new Map(updated.map((r) => [r.id, r]));

  // Get ordered list (any depth)
  const ordered = flattenOrdered(updated);

  // Get unique resource codes
  const userIds = new Set(updated.map((r) => r.resource).filter(Boolean));

  userIds.forEach((userId) => {
    // Filter chain for this resource, in ordered sequence
    const chain = ordered.filter((r) => r.resource === userId);
    console.log(
      `Chain for ${userId}:`,
      chain.map((r) => ({
        id: r.id,
        task: r.task,
        depth: r.sortOrder,
        dur: r.durationHrs,
        start: r.plannedStart,
        stop: r.plannedStop,
      })),
    );
    let prevEnd = null;

    chain.forEach((row, idx) => {
      // Get the real row from the map (not the spread copy)
      const realRow = byId.get(row.id);
      const dur = Number(realRow.durationHrs);
      let start;

      if (idx === 0) {
        let userStart = realRow.plannedStart
          ? parseISODateTime(realRow.plannedStart)
          : null;
        if (!userStart) userStart = defaultFirstStart(userId, groupResources);
        start = nextWorkMoment(userStart, userId, groupResources);
      } else {
        const base = prevEnd ? new Date(prevEnd) : defaultFirstStart(userId);
        start = nextWorkMoment(base, userId);
      }

      realRow.plannedStart = isoDateTime(start);

      if (dur > 0) {
        const end = addWorkHours(start, dur, userId, groupResources);
        realRow.plannedStop = isoDateTime(end);
        prevEnd = end;
      } else {
        realRow.plannedStop = "";
        prevEnd = start;
      }
    });
  });

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
function runValidations(rows, project, po, site, groups, groupResources) {
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
  const incomplete = rows.filter(
    (r) => !r.resource || !r.durationHrs || !r.plannedStart,
  );
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

  const isPending = (row) =>
    String(row.status || "pending")
      .toLowerCase()
      .trim() === "pending";

  Object.entries(byRes).forEach(([userId, arr]) => {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];

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

          if (aPending && bPending) {
            // Both pending → error (block)
            pendingOverlaps.push(overlapInfo);
          } else {
            // Exactly one is pending → warning (don't block)
            mixedOverlaps.push(overlapInfo);
          }
        }
      }
    }
  });

  // ❌ ERROR: Pending tasks overlap each other — must fix
  results.push({
    ok: pendingOverlaps.length === 0,
    title:
      pendingOverlaps.length === 0
        ? "No pending task overlaps"
        : `${pendingOverlaps.length} pending task overlap${pendingOverlaps.length !== 1 ? "s" : ""} detected`,
    detail:
      pendingOverlaps.length === 0
        ? "Pending tasks for each resource are sequenced cleanly."
        : pendingOverlaps
            .slice(0, 5)
            .map((o) => `• ${o.resource}: "${o.task1}" ⇄ "${o.task2}"`)
            .join("\n") +
          (pendingOverlaps.length > 5
            ? `\n…and ${pendingOverlaps.length - 5} more`
            : ""),
  });

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

  // ── 6. Past Date Check ──
  //    BLOCK if any PENDING task has past start
  //    WARN if non-pending tasks have past start (informational only)
  const now = new Date();
  const pendingPastRows = [];
  const nonPendingPastRows = [];

  rows.forEach((r, idx) => {
    if (!r.plannedStart) return;
    const startDt = parseISODateTime(r.plannedStart);
    if (!startDt || startDt >= now) return;

    const status = String(r.status || "pending")
      .toLowerCase()
      .trim();
    const taskInfo = {
      idx: idx + 1,
      task: r.task || r.module || `Row #${idx + 1}`,
      start: fmtDisplay(startDt),
      status: r.status || "pending",
    };

    if (status === "pending") {
      pendingPastRows.push(taskInfo);
    } else {
      nonPendingPastRows.push(taskInfo);
    }
  });

  // ❌ ERROR: Pending tasks in the past — must fix
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

  // ⚠️ WARNING: Non-pending in the past — informational
  if (nonPendingPastRows.length > 0) {
    warnings.push({
      title: `${nonPendingPastRows.length} active task${nonPendingPastRows.length !== 1 ? "s have" : " has"} a past start time`,
      detail: `These tasks are already in progress or completed:\n${nonPendingPastRows
        .slice(0, 5)
        .map((r) => `• "${r.task}" (${r.status}) — ${r.start}`)
        .join(
          "\n",
        )}${nonPendingPastRows.length > 5 ? `\n…and ${nonPendingPastRows.length - 5} more` : ""}`,
    });
  }

  // ✅ Return BOTH arrays
  return { results, warnings };
}

/* ─── Toast ─── */
function Toast({ toasts, onDismiss }) {
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
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background:
              t.kind === "success"
                ? "#F0FDF4"
                : t.kind === "error"
                  ? "#FEF2F2"
                  : "#EFF6FF",
            border: `1px solid ${t.kind === "success" ? "#86EFAC" : t.kind === "error" ? "#FCA5A5" : "#93C5FD"}`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            fontFamily: "Sora,sans-serif",
            fontSize: 12,
          }}
        >
          <span
            style={{
              fontSize: 15,
              marginTop: 1,
              color:
                t.kind === "success"
                  ? "#16A34A"
                  : t.kind === "error"
                    ? "#DC2626"
                    : "#2563EB",
            }}
          >
            {t.kind === "success" ? (
              <CheckCircle2 size={16} color="#16A34A" />
            ) : t.kind === "error" ? (
              <AlertOctagon size={16} color="#DC2626" />
            ) : (
              <Info size={16} color="#2563EB" />
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#1e293b" }}>{t.title}</div>
            {t.msg && (
              <div style={{ marginTop: 2, color: "#475569", lineHeight: 1.4 }}>
                {t.msg}
              </div>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: 13,
              padding: "0 2px",
              lineHeight: 1,
            }}
          >
            <X size={13} color="#94a3b8" />
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
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          fontFamily: "Sora,sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#DBEAFE",
              color: "#1D4ED8",
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
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
              Comments &amp; Action Points
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>
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
              color: "#94A3B8",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 0 0 0" }}>
          {!(row.comments || []).length ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#94A3B8",
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
                <tr style={{ background: "#F8FAFC" }}>
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
                        color: "#64748B",
                        borderBottom: "1px solid #E2E8F0",
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
                      borderLeft: `3px solid ${i % 2 === 0 ? "#1D4ED8" : "#7C3AED"}`,
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#94A3B8",
                        fontWeight: 600,
                      }}
                    >
                      {c.sno || i + 1}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        maxWidth: 180,
                        color: "#0F172A",
                      }}
                    >
                      {c.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        maxWidth: 160,
                        color: "#475569",
                      }}
                    >
                      {c.actionPoint || (
                        <span style={{ color: "#CBD5E1" }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
                        whiteSpace: "nowrap",
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
                              background: v === "GW" ? "#DBEAFE" : "#FCE7F3",
                              color: v === "GW" ? "#1D4ED8" : "#BE185D",
                              border: `1px solid ${v === "GW" ? "#93C5FD" : "#F9A8D4"}`,
                            }}
                          >
                            {v}
                          </span>
                        ))}
                        {!(c.responsibility || []).length && (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#475569",
                        maxWidth: 120,
                      }}
                    >
                      {c.others || <span style={{ color: "#CBD5E1" }}>—</span>}
                    </td>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#0F172A",
                          fontSize: 11,
                        }}
                      >
                        {c.author || "You"}
                      </div>
                      <div
                        style={{
                          color: "#94A3B8",
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
                          border: "1px solid #FCA5A5",
                          color: "#EF4444",
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
            borderTop: "1px solid #E2E8F0",
            padding: "14px 20px",
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 12,
              color: "#0F172A",
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
                Description <span style={{ color: "#EF4444" }}>*</span>
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
                  ["GW", "#1D4ED8", "#DBEAFE"],
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
                          : "#F1F5F9",
                        color: (v === "GW" ? respGW : respCust) ? c : "#94A3B8",
                        border: `1.5px solid ${(v === "GW" ? respGW : respCust) ? c : "#E2E8F0"}`,
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
            <button onClick={onClose} style={{ ...btnStyle }}>
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                ...btnStyle,
                background: "#1D4ED8",
                color: "#fff",
                borderColor: "#1D4ED8",
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
  warnings = [], // ← NEW prop
  onClose,
  onConfirm,
  isSaving = false,
  isRepublish = false,
}) {
  const allOk = results.every((r) => r.ok);
  const failCount = results.filter((r) => !r.ok).length;
  const hasWarnings = warnings.length > 0;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "#F8FAFC",
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
                ? "#FEF2F2"
                : hasWarnings
                  ? "#FFFBEB"
                  : "#DCFCE7",
              color: !allOk ? "#DC2626" : hasWarnings ? "#B45309" : "#16A34A",
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
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
              {isRepublish ? "Update Published Project" : "Submit for Motion"}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
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
              color: "#94A3B8",
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

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* ── WARNINGS (yellow banner) ── */}
          {hasWarnings && (
            <div
              style={{
                margin: "14px 20px 0",
                padding: 12,
                background: "#FFFBEB",
                border: "1px solid #FCD34D",
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
                  borderBottom: "1px dashed #FCD34D",
                }}
              >
                <AlertTriangle size={16} color="#B45309" />
                <span
                  style={{ fontWeight: 700, fontSize: 12.5, color: "#92400E" }}
                >
                  {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "2px 8px",
                    background: "#FEF3C7",
                    color: "#92400E",
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
                      background: "#fff",
                      border: "1px solid #FDE68A",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#92400E",
                        marginBottom: w.detail ? 4 : 0,
                      }}
                    >
                      {w.title}
                    </div>
                    {w.detail && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#78350F",
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
                  borderTop: "1px dashed #FCD34D",
                  fontSize: 10.5,
                  color: "#92400E",
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

          {/* ── Validation Results ── */}
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
                  background: r.ok ? "#F0FDF4" : "#FEF2F2",
                  border: `1px solid ${r.ok ? "#86EFAC" : "#FCA5A5"}`,
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
                    background: r.ok ? "#DCFCE7" : "#FEE2E2",
                    color: r.ok ? "#16A34A" : "#DC2626",
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
                      color: r.ok ? "#15803D" : "#DC2626",
                      lineHeight: 1.4,
                    }}
                  >
                    {r.title}
                  </div>
                  {r.detail && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748B",
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

        {/* ── Footer ── */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: "#FAFBFC",
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
            <X size={13} />
            Close
          </button>

          {allOk && (
            <button
              onClick={onConfirm}
              disabled={isSaving}
              style={{
                ...btnStyle,
                background: hasWarnings ? "#D97706" : "#1D4ED8",
                color: "#fff",
                borderColor: hasWarnings ? "#D97706" : "#1D4ED8",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: hasWarnings
                  ? "0 2px 6px rgba(217,119,6,0.25)"
                  : "0 2px 6px rgba(29,78,216,0.25)",
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
                  Confirm &amp; Re-publish
                </>
              ) : (
                <>
                  <Rocket size={14} />
                  Confirm &amp; Put in Motion
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
function ModuleInput({ initialValue, onCommit }) {
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
      placeholder="Module name…"
      autoFocus
      style={{ ...inputStyle, height: 28, fontSize: 11.5 }}
    />
  );
}
function TaskInput({ initialValue, onCommit, placeholder, isSubActivity }) {
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
        ...inputStyle,
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
  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isSelectedToday = isSameDay(selectedDate, today);
  const nowHour = today.getHours();
  const nowMinute = today.getMinutes();

  // Minimum hour: only restrict if selected date is TODAY
  const minHour = isSelectedToday
    ? Math.max(WORK_START_HR, nowHour)
    : WORK_START_HR;

  // Available hours
  const hourOptions = Array.from(
    { length: WORK_END_HR - WORK_START_HR + 1 },
    (_, i) => WORK_START_HR + i,
  ).filter((h) => h >= minHour);

  // Available minutes — only restrict if TODAY + current hour
  const minuteOptions = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59,
  ].filter((m) => {
    if (isSelectedToday && hour === nowHour) return m > nowMinute;
    return true;
  });

  // Auto-correct invalid hour/minute when switching to TODAY
  useEffect(() => {
    if (!isSelectedToday) return; // ← only adjust if today selected

    let newHour = hour;
    let newMinute = minute;

    if (newHour < minHour) {
      newHour = minHour;
      newMinute = 0;
    }

    if (newHour === nowHour && newMinute <= nowMinute) {
      const nextValid = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].find(
        (m) => m > nowMinute,
      );
      if (nextValid !== undefined) {
        newMinute = nextValid;
      } else if (newHour + 1 <= WORK_END_HR) {
        newHour = newHour + 1;
        newMinute = 0;
      }
    }

    if (newHour !== hour) setHour(newHour);
    if (newMinute !== minute) setMinute(newMinute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectedToday]); // ← only when switching to/from today

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
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
      <span style={{ fontWeight: 700, color: "#64748B" }}>:</span>
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
      <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>
        (Work: {WORK_START_HR}–{WORK_END_HR}h)
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

  // Position the popup based on the anchor's bounding rect
  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupWidth = 280;
    const popupHeight = 380;

    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;

    // If popup goes off bottom, open upward
    if (rect.bottom + popupHeight > window.innerHeight) {
      top = rect.top + window.scrollY - popupHeight - 4;
    }
    // If popup goes off right, align to right edge of anchor
    if (left + popupWidth > window.innerWidth) {
      left = rect.right + window.scrollX - popupWidth;
    }

    setPosition({ top, left });
  }, [anchorRef]);
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [onClose]);
  // Click-outside handler
  useEffect(() => {
    const handler = (e) => {
      // Don't close if clicking inside the popup itself
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      // Don't close if clicking the anchor button (the one that opened it)
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return;
      onClose();
    };

    // Delay registration so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose, anchorRef]);

  // Reposition on scroll/resize
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

    // ── NEW: Block past dates ──
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

    // ── NEW: Final guard against past selection ──
    if (final.getTime() < today.getTime()) {
      alert("Cannot select a date/time in the past.");
      return;
    }

    onChange(isoDateTime(final));
    onClose();
  };

  const monthName = viewDate.toLocaleString("en-US", { month: "long" });
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  // The actual popup JSX
  const popup = (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 99999, // ← Always on top
        background: "#fff",
        border: "1px solid #CBD5E1",
        borderRadius: 10,
        boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
        padding: 12,
        width: 280,
        fontFamily: "Sora,sans-serif",
      }}
    >
      {/* Month nav */}
      {/* Month + Year navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 4,
        }}
      >
        {/* Previous Year */}
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

        {/* Previous Month */}
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

        {/* Month + Year selectors */}
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
              // Disable past months in current year
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

        {/* Next Month */}
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

        {/* Next Year */}
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
      {/* Days grid */}
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

          // ── NEW: Check if date is in the past ──
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
          let color = "#0F172A";
          let border = "1px solid transparent";
          let cursor = "pointer";

          if (selected) {
            bg = "#1D4ED8";
            color = "#fff";
            border = "1px solid #1D4ED8";
          } else if (isPast) {
            // ── NEW: Past date styling ──
            bg = "#F8FAFC";
            color = "#CBD5E1";
            cursor = "not-allowed";
            border = "1px solid #F1F5F9";
          } else if (isWknd) {
            bg = "#FEF2F2";
            color = "#DC2626";
            cursor = "not-allowed";
            border = "1px solid #FECACA";
          } else if (onLeave) {
            bg = "#FFFBEB";
            color = "#B45309";
            cursor = "not-allowed";
            border = "1px solid #FCD34D";
          } else if (isToday) {
            border = "1px solid #1D4ED8";
            color = "#1D4ED8";
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
                    background: "#B45309",
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
          color: "#64748B",
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: "#F8FAFC",
              border: "1px solid #F1F5F9",
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
              background: "#FEF2F2",
              border: "1px solid #FECACA",
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
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
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
              background: "#1D4ED8",
            }}
          />
          Selected
        </span>
      </div>

      {/* Time picker */}
      <TimePickerSection
        selectedDate={selectedDate}
        today={today}
        hour={hour}
        setHour={setHour}
        minute={minute}
        setMinute={setMinute}
      />
      {/* Actions */}
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
            background: "#1D4ED8",
            color: "#fff",
            borderColor: "#1D4ED8",
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  // Render into body via portal
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
        <span style={{ color: "#94A3B8", fontSize: 12 }}>{placeholder}</span>
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
                  background: "#DBEAFE",
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
              background: "#DBEAFE",
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
        maxHeight: Math.min(420, window.innerHeight - 40), // ← cap height to viewport
        background: "#fff",
        border: "1px solid #CBD5E1",
        borderRadius: 8,
        boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
        zIndex: 99999,
        overflow: "hidden", // ← important
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

      {/* Options list */}
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
          Object.entries(groupedOptions).map(([groupName, opts], gIdx) => (
            <div key={`grp-${gIdx}`}>
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

      {/* Multi-select footer */}
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
  ) : null;

  return (
    <div ref={containerRef} style={{ position: "relative", width }}>
      <button
        ref={triggerRef} // ← ref attached
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 32,
          border: `1px solid ${open ? "#3B82F6" : "#CBD5E1"}`,
          borderRadius: 6,
          background: disabled ? "#F8FAFC" : open ? "#F8FAFC" : "#fff",
          color: "#0F172A",
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
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              flexShrink: 0,
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
          size={13}
          style={{
            color: "#64748B",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s",
            flexShrink: 0,
          }}
        />
      </button>

      {/* ✅ Portal rendering — popup escapes all overflow containers */}
      {open && createPortal(popup, document.body)}
    </div>
  );
}
/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  const { Icon, label, bg, color, border, pulse, spin } = cfg;

  // Pick the right icon component
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

/* ─── Activity Row ─── */
const ActivityRow = React.memo(function ActivityRow({
  row,
  idx,
  isFirstInChain,
  resources,
  groupResources,
  onUpdate,
  onDelete,
  onAddSub,
  onOpenComments,
}) {
  //  const { groupResources } = useData();
  const res = row.resource
    ? resources.find((r) => r.userId === row.resource) // ← lookup by userId
    : null;
  const startDisplay = row.plannedStart ? fmtDisplay(row.plannedStart) : "";
  const stopDisplay = row.plannedStop ? fmtDisplay(row.plannedStop) : "";
  const commentCount = (row.comments || []).length;
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateBtnRef = useRef(null);
  const isPastStart = row.plannedStart
    ? new Date(parseISODateTime(row.plannedStart)) < new Date()
    : false;
  const handleField = (field, value) => {
    // Fields that don't affect scheduling
    const TEXT_ONLY_FIELDS = ["module", "task"];
    const needsRecompute = !TEXT_ONLY_FIELDS.includes(field);

    onUpdate(
      {
        ...row,
        [field]:
          field === "durationHrs" ? (value === "" ? "" : Number(value)) : value,
      },
      { recompute: needsRecompute },
    );
  };

  const cellBg =
    row.sortOrder === 0
      ? "#fff"
      : row.sortOrder === 1
        ? "#FAFAFE"
        : row.sortOrder === 2
          ? "#F5F3FF"
          : "#F0EBFF";
  const tdStyle = {
    padding: "8px 10px", // ← Changed from "7px 10px"
    borderBottom: "1px solid #F1F5F9",
    background: cellBg,
    verticalAlign: "middle",
    fontSize: 12.5, // slightly increased for better look
  };
  const moduleModules = row.module;

  return (
    <tr style={{ transition: "background .12s" }}>
      {/* # */}
      <td
        style={{
          ...tdStyle,
          textAlign: "center",
          color: "#94A3B8",
          fontWeight: 600,
          width: 44,
          fontSize: 11,
        }}
      >
        {row.sortOrder === 0 ? idx : ""}
      </td>
      {/* Module */}
      <td style={{ ...tdStyle, width: 160 }}>
        {row.module && !row._editingModule ? (
          <span
            onClick={() => {
              /* allow re-editing by clicking */
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              background: "#F0F9FF",
              color: "#0369A1",
              border: "1px solid #BAE6FD",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
            title="Click to edit"
          >
            {row.module}
          </span>
        ) : (
          <ModuleInput
            initialValue={row.module || ""}
            onCommit={(val) => handleField("module", val)}
          />
        )}
      </td>
      {/* Task */}
      <td style={{ ...tdStyle, width: 260 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Indent based on depth */}
          {row.sortOrder > 0 && (
            <span
              style={{
                display: "inline-block",
                width: row.sortOrder * 18,
                flexShrink: 0,
              }}
            />
          )}

          {/* Tree connector */}
          {row.sortOrder > 0 && (
            <span
              style={{
                color: "#94A3B8",
                fontFamily: "monospace",
                fontSize: 13,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              <CornerDownRight
                size={13}
                color="#94A3B8"
                style={{ flexShrink: 0 }}
              />
            </span>
          )}

          {/* Level badge */}
          {row.sortOrder > 0 && (
            <span
              style={{
                background:
                  row.sortOrder === 1
                    ? "#EDE9FE"
                    : row.sortOrder === 2
                      ? "#FCE7F3"
                      : "#FEF3C7",
                color:
                  row.sortOrder === 1
                    ? "#7C3AED"
                    : row.sortOrder === 2
                      ? "#BE185D"
                      : "#B45309",
                border: `1px solid ${row.sortOrder === 1 ? "#DDD6FE" : row.sortOrder === 2 ? "#F9A8D4" : "#FCD34D"}`,
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

          {/* <TaskInput
            initialValue={row.task || ""}
            onCommit={(val) => handleField("task", val)}
            placeholder={row.parentId ? "Sub-activity…" : "Task name…"}
            isSubActivity={!!row.parentId}
          /> */}
          <input
            value={row.task || ""}
            onChange={(e) => handleField("task", e.target.value)}
            placeholder={
              row.sortOrder > 0
                ? `Sub-activity (L${row.sortOrder})…`
                : "Task name…"
            }
            style={{
              ...inputStyle,
              height: 28,
              fontSize: 11.5,
              flex: 1,
              minWidth: 0,
            }}
          />
        </div>
      </td>
      {/* Resource */}
      <td style={{ ...tdStyle, width: 240 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
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
              disabled={!resources.length}
              placeholder={
                resources.length ? "Select resource..." : "Pick group first"
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
                    <span style={{ color: "#94A3B8", fontSize: 11.5 }}>
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
                      color: "#0F172A",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: "#64748B", fontWeight: 400 }}>
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
                        color: "#0F172A",
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
                        color: "#94A3B8",
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
        {isFirstInChain && row.resource ? (
          <>
            {isPastStart && (
              <span
                style={{
                  marginLeft: 5,
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FCA5A5",
                  borderRadius: 3,
                  padding: "1px 5px",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                ⚠ PAST
              </span>
            )}
            <button
              ref={dateBtnRef} // ← Attach ref
              onClick={() => setPickerOpen(true)}
              style={{
                ...inputStyle,
                height: 28,
                fontSize: 11,
                fontFamily: "'JetBrains Mono',monospace",
                textAlign: "left",
                cursor: "pointer",
                background: "#fff",
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
                  <span style={{ color: "#94A3B8" }}>Pick date…</span>
                )}
              </span>
            </button>
            {pickerOpen && (
              <WorkingDatePicker
                value={row.plannedStart}
                resourceUserId={row.resource}
                groupResources={groupResources} // ← Pass from context
                anchorRef={dateBtnRef}
                onChange={(val) => handleField("plannedStart", val)}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </>
        ) : !row.resource ? (
          <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
            Assign resource first
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono',monospace",
              color: "#475569",
            }}
          >
            {startDisplay || "—"}
            {startDisplay && (
              <span
                style={{
                  marginLeft: 5,
                  background: "#F0F9FF",
                  color: "#0369A1",
                  border: "1px solid #BAE6FD",
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
        )}
      </td>
      {/* Duration */}
      <td style={{ ...tdStyle, width: 110, textAlign: "right" }}>
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
          style={{
            ...inputStyle,
            height: 28,
            fontSize: 11.5,
            fontFamily: "'JetBrains Mono',monospace",
            textAlign: "right",
            width: "100%",
          }}
        />
      </td>
      {/* Planned Stop */}
      <td style={{ ...tdStyle, width: 180 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono',monospace",
            color: "#475569",
          }}
        >
          {stopDisplay || "—"}
          {stopDisplay && (
            <span
              style={{
                marginLeft: 5,
                background: "#F0F9FF",
                color: "#0369A1",
                border: "1px solid #BAE6FD",
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
      <td style={{ ...tdStyle, width: 140, textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <button
            onClick={() => onOpenComments(row)}
            title={
              commentCount > 0
                ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
                : "Comments"
            }
            style={{
              ...iconBtn,
              background: commentCount > 0 ? "#EDE9FE" : "transparent",
              color: commentCount > 0 ? "#7C3AED" : "#94A3B8",
              borderColor: commentCount > 0 ? "#DDD6FE" : "#E2E8F0",
              position: "relative",
              overflow: "visible", // ← Critical: allow badge to escape
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
                  background: "#7C3AED",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff", // ← White ring for contrast
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  lineHeight: 1,
                  zIndex: 2, // ← Above other elements
                }}
              >
                {commentCount > 99 ? "99+" : commentCount}
              </span>
            )}
          </button>

          {row.sortOrder === 0 &&
            (!row.status || String(row.status).toLowerCase() === "pending") && (
              <button
                onClick={() => onAddSub(row)}
                title="Add sub-activity"
                style={{
                  ...iconBtn,
                  color: "#7C3AED",
                  borderColor: "#DDD6FE",
                  background: "#FAF5FF",
                }}
              >
                <CornerDownRight size={13} />
              </button>
            )}

          {(!row.status || String(row.status).toLowerCase() === "pending") && (
            <button
              onClick={() => onDelete(row)}
              title="Delete row"
              style={{
                ...iconBtn,
                color: "#EF4444",
                borderColor: "#FCA5A5",
                background: "#FEF2F2",
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

/* ─── Main Assigner Module ─── */
function ProjectEditor({
  draft,
  groupLabels,
  groupResources,
  fetchResourcesForGroups,
  onSaveDraft,
  onPublish,
  onBack,
  showToast,
}) {
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

  const [validationWarnings, setValidationWarnings] = useState([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [motionSubmitted, setMotionSubmitted] = useState(
    draft.status === "published",
  );
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
  const [commentRow, setCommentRow] = useState(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({
    type: "info",
    msg: "Download the Excel template, fill it with your activities, then upload back here.",
  });

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const fileInputRef = useRef();
  const groupMenuRef = useRef();

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

  const buildProjectData = useCallback(
    () => ({
      ...draft,
      project,
      po,
      site,
      groups,
      rows,
      moduleRegistry, // ← New field
      status: draft.status === "published" ? "published" : "draft",
    }),
    [draft, project, po, site, groups, rows, moduleRegistry],
  );
  const handleSaveDraft = useCallback(async () => {
    const data = buildProjectData();
    setIsSaving(true);
    try {
      await onSaveDraft(data);

      const ts = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setDraftTime(ts);

      showToast(
        "success",
        "Draft saved",
        `"${data.project || "Untitled"}" — ${data.rows.length} activit${data.rows.length === 1 ? "y" : "ies"} saved.`,
      );
    } catch (err) {
      // Error toast already shown by parent
    } finally {
      setIsSaving(false);
    }
  }, [buildProjectData, onSaveDraft, showToast]);
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
        updated = recomputeChains(updated, groupResources);
        return updated;
      });
      setGroups(newGroups);
    },
    [groupResources],
  );
  const toggleGroup = (g) => {
    const newGs = groups.includes(g)
      ? groups.filter((x) => x !== g)
      : [...groups, g];
    updateGroups(newGs);
  };

  /* CRUD */
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
        moduleId, // ← New field
        task: "",
        resource: "",
        plannedStart: "",
        durationHrs: "",
        plannedStop: "",
        status: "Pending",
        comments: [],
      };
      console.log("➕ New row:", newRow.id);
      setModuleRegistry(newRegistry);
      setRows((prev) => recomputeChains([...prev, newRow], groupResources));
    },
    [moduleRegistry, groupResources],
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
    setRows((prev) => recomputeChains([...prev, newRow], groupResources));
  }, []);

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

        // ✅ Safe recompute
        return recompute && isResourcesReady
          ? recomputeChains(replaced, groupResources)
          : replaced;
      });
    },
    [moduleRegistry, groupResources, isResourcesReady],
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

        return recomputeChains(synced.rows, groupResources);
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

        // Normalize date
        let plannedStart = "";
        if (plannedStartRaw) {
          if (plannedStartRaw instanceof Date) {
            plannedStart = isoDateTime(plannedStartRaw);
          } else {
            const s = String(plannedStartRaw).trim();
            const parsed1 = parseISODateTime(s);
            if (parsed1 && !isNaN(parsed1)) {
              plannedStart = isoDateTime(parsed1);
            } else {
              const m = s.match(
                /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})/,
              );
              if (m) {
                const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
                plannedStart = isoDateTime(d);
              }
            }
          }
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

  const handleExport = () => {
    if (typeof XLSX !== "undefined") {
      const ordered = flattenOrdered(rows);
      const out = ordered.map((r) => {
        const resObj = r.resource
          ? getResourceByUserId(r.resource, groups)
          : null;
        return {
          "Module ID": r.moduleId || "", // ← New column
          "Module Name": r.module,
          Task: (r.parentId ? "  ↳ " : "") + r.task,
          "Resource Code": resObj?.code || "",
          "Resource Name": resObj?.name || "",
          "User ID": r.resource || "",
          "Planned Start": r.plannedStart ? fmtDisplay(r.plannedStart) : "",
          "Duration (hrs)": r.durationHrs ?? "",
          "Planned Stop": r.plannedStop ? fmtDisplay(r.plannedStop) : "",
          Status: r.status || "Pending",
          Comments: (r.comments || [])
            .map((c) => `[${c.author}] ${c.description}`)
            .join(" | "),
        };
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(out);
      XLSX.utils.book_append_sheet(wb, ws, "Activities");
      XLSX.writeFile(wb, "Activity_Tracker_Export.xlsx");
    } else showToast("info", "Export", "SheetJS (xlsx) library required.");
  };
  /* Validation + submit */
  const handleSubmitMotion = () => {
    const { results, warnings } = runValidations(
      rows,
      project,
      po,
      site,
      groups,
      groupResources,
    );
    setValidationResults(results);
    setValidationWarnings(warnings);
    setValidationOpen(true);
  };
  /* Filtered/ordered rows */
  const orderedRows = useMemo(() => flattenOrdered(rows), [rows]);
  const filteredRows = useMemo(() => {
    if (!searchTerm) return orderedRows;
    const q = searchTerm.toLowerCase();
    const matched = new Set();

    orderedRows.forEach((r) => {
      if (
        (r.module || "").toLowerCase().includes(q) ||
        (r.task || "").toLowerCase().includes(q)
      ) {
        matched.add(r.id);

        // Add all ancestors
        let cur = rows.find((x) => x.id === r.parentId);
        while (cur) {
          matched.add(cur.id);
          cur = rows.find((x) => x.id === cur.parentId);
        }

        // Add all descendants
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

    return orderedRows.filter((r) => matched.has(r.id));
  }, [orderedRows, searchTerm, rows]);

  /* Stats */
  const total = rows.length;
  const assigned = rows.filter((r) => r.resource).length;
  const unassigned = total - assigned;
  const totalComments = rows.reduce((s, r) => s + (r.comments || []).length, 0);

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
      const chain = flattenOrdered(rows).filter(
        (r) => r.resource === row.resource,
      );
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
        background: "#F1F5F9",
        color: "#0F172A",
      }}
    >
      <div
        style={{ padding: "16px 20px 32px", maxWidth: 1600, margin: "0 auto" }}
      >
        {/* Back button banner */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={onBack}
            style={{
              ...btnStyle,
              background: "#F8FAFC",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Back to Drafts
          </button>
          <div
            style={{
              fontSize: 12,
              color: "#64748B",
              marginLeft: 4,
            }}
          >
            Editing:{" "}
            <strong style={{ color: "#0F172A" }}>
              {project || "Untitled Project"}
            </strong>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              background: motionSubmitted ? "#DCFCE7" : "#FEF3C7",
              color: motionSubmitted ? "#15803D" : "#B45309",
              border: `1px solid ${motionSubmitted ? "#86EFAC" : "#FCD34D"}`,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {motionSubmitted ? (
              <>
                <Rocket size={11} /> {"Published"}
              </>
            ) : (
              <>
                <FileText size={11} /> {"Draft"}
              </>
            )}
          </span>
        </div>

        {/* ── Setup Card ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
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
            <Settings size={15} />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>
              Project Setup
            </span>
            <span style={{ fontSize: 11.5, color: "#94A3B8", marginLeft: 4 }}>
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
              <label style={labelStyle}>
                Project Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. ThingWorx — Adity FRP"
                style={{ ...inputStyle }}
              />
            </div>
            {/* PO No */}
            <div>
              <label style={labelStyle}>
                PO No <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                value={po}
                onChange={(e) => setPo(e.target.value)}
                placeholder="e.g. PO-20240092"
                style={{ ...inputStyle }}
              />
            </div>
            {/* Site */}
            <div>
              <label style={labelStyle}>
                Site / Customer <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="e.g. Hindalco — Unit 2"
                style={{ ...inputStyle }}
              />
            </div>
            {/* Groups multi-select */}
            <div>
              <label style={labelStyle}>
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
                placeholder="Select group(s)…"
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
              <label style={labelStyle}>Template</label>
              <button
                onClick={handleDownloadTemplate}
                style={{
                  width: "100%",
                  height: 34,
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  background: "#F8FAFC",
                  color: "#475569",
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
              <label style={labelStyle}>Activity Sheet</label>
              <button
                onClick={() => {
                  if (!groups.length) {
                    setUploadStatus({
                      type: "warn",
                      msg: "Pick a group before uploading.",
                    });
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                style={{
                  width: "100%",
                  height: 34,
                  border: "1px dashed #93C5FD",
                  borderRadius: 6,
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  fontFamily: "Sora,sans-serif",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  fontWeight: 500,
                }}
              >
                <Upload size={14} /> Upload Excel
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
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
                  ? "#F0FDF4"
                  : uploadStatus.type === "warn"
                    ? "#FFFBEB"
                    : uploadStatus.type === "err"
                      ? "#FEF2F2"
                      : "#F0F9FF",
              border: `1px solid ${uploadStatus.type === "ok" ? "#86EFAC" : uploadStatus.type === "warn" ? "#FCD34D" : uploadStatus.type === "err" ? "#FCA5A5" : "#BAE6FD"}`,
              fontSize: 11.5,
              color: "#475569",
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
              background: "#fff",
              border: "1px dashed #CBD5E1",
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
                background: "#DBEAFE",
                color: "#1D4ED8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                marginBottom: 14,
              }}
            >
              <FolderOpen size={26} />
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#0F172A",
                marginBottom: 4,
              }}
            >
              No activities loaded yet
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748B",
                maxWidth: 420,
                margin: "0 auto 16px",
                lineHeight: 1.6,
              }}
            >
              Fill in the project details above, pick the responsible group,
              then upload your Excel activity sheet — the editable activity
              table will appear here.
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
                      color: a ? "#1D4ED8" : "#94A3B8",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: a ? "#1D4ED8" : "#E2E8F0",
                        color: a ? "#fff" : "#94A3B8",
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
                    <span style={{ color: "#CBD5E1" }}>›</span>
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
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
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
                borderBottom: "1px solid #E2E8F0",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "#0F172A",
                }}
              >
                <span style={{ color: "#1D4ED8", fontSize: 16 }}>
                  <CheckCircle2 size={16} />
                </span>{" "}
                Activities
                <span
                  style={{
                    background: "#F1F5F9",
                    color: "#64748B",
                    border: "1px solid #E2E8F0",
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
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                      color: "#94A3B8",
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
                      border: "1px solid #E2E8F0",
                      borderRadius: 7,
                      padding: "0 10px 0 32px",
                      fontFamily: "Sora,sans-serif",
                      fontSize: 12,
                      outline: "none",
                      color: "#0F172A",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  onClick={handleExport}
                  style={{ ...btnStyle, height: 32 }}
                >
                  <Download size={14} /> Export
                </button>
                <button
                  onClick={() => addRow()}
                  style={{
                    ...btnStyle,
                    background: "#1D4ED8",
                    color: "#fff",
                    borderColor: "#1D4ED8",
                    height: 32,
                  }}
                >
                  <Plus size={14} /> Add Module
                </button>
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
                  <tr style={{ background: "#F8FAFC" }}>
                    {[
                      { label: "#", width: 48, align: "center" },
                      { label: "MODULE NAME", width: 160, align: "left" },
                      { label: "TASK", width: 240, align: "left" },
                      { label: "RESOURCE", width: 240, align: "left" }, // ← 145 → 240
                      { label: "PLANNED START", width: 175, align: "left" },
                      { label: "DURATION (HRS)", width: 110, align: "right" },
                      { label: "PLANNED STOP", width: 175, align: "left" },
                      { label: "STATUS", width: 105, align: "center" },
                      { label: "ACTIONS", width: 130, align: "center" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        style={{
                          width: col.width,
                          textAlign: col.align,
                          padding: "11px 10px",
                          fontWeight: 600,
                          color: "#64748B",
                          fontSize: "10.5px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          borderBottom: "2px solid #CBD5E1",
                          whiteSpace: "nowrap",
                          background: "#F8FAFC",
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        {col.label}
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
                          color: "#94A3B8",
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background: "#EEF2FF",
                            color: "#4F46E5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 12px",
                            // boxShadow: "0 2px 8px rgba(79, 70, 229, 0.12)",
                          }}
                        >
                          <Plus size={28} strokeWidth={2.5} />
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0F172A",
                            marginBottom: 3,
                          }}
                        >
                          No activities yet
                        </div>
                        <div>
                          Add activities manually or upload your Excel sheet.
                        </div>
                        <button
                          onClick={() => addRow()}
                          style={{
                            ...btnStyle,
                            background: "#1D4ED8",
                            color: "#fff",
                            borderColor: "#1D4ED8",
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

                      // Helper: check if row is descendant of any top-level in this module
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
                          {/* Section Header */}
                          <tr>
                            <td
                              colSpan={9}
                              style={{
                                padding: "10px 14px",
                                background:
                                  "linear-gradient(180deg,#F4F2EC 0%,#EFEDE6 100%)",
                                borderTop: "1px solid #E2E8F0",
                                borderBottom: "1px solid #CBD5E1",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>
                                  <span
                                    style={{
                                      background: "#DBEAFE",
                                      color: "#1D4ED8",
                                      border: "1px solid #B5D4F4",
                                      borderRadius: 5,
                                      padding: "2px 9px",
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      marginRight: 8,
                                    }}
                                    title={`Module ID: ${rows.find((r) => r.module === mod)?.moduleId || "—"}`} // ← Tooltip
                                  >
                                    {mod || "— unnamed —"}
                                  </span>
                                  <span
                                    style={{ color: "#94A3B8", fontSize: 10.5 }}
                                  >
                                    {modCount}{" "}
                                    {modCount === 1 ? "task" : "tasks"}
                                  </span>
                                </span>
                                <button
                                  onClick={() => addRow(mod)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #C7D2FE",
                                    background: "#EEF2FF",
                                    color: "#4338CA",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    fontFamily: "Sora, sans-serif",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                  }}
                                >
                                  <Plus size={14} strokeWidth={2.5} />
                                  Add Row to Module
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Activity Rows */}
                          {modRows.map((r) => {
                            if (r.sortOrder === 0) displayIdx++;
                            return (
                              <ActivityRow
                                key={r.id}
                                row={r}
                                idx={displayIdx}
                                isFirstInChain={isFirstInChain(r)}
                                resources={resources}
                                groupResources={groupResources}
                                onUpdate={updateRow}
                                onDelete={deleteRow}
                                onAddSub={addSubActivity}
                                onOpenComments={setCommentRow}
                              />
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add row button */}
            <button
              onClick={() => addRow()}
              style={{
                width: "100%",
                padding: "11px",
                background: "none",
                border: "none",
                borderTop: "1px solid #F1F5F9",
                color: "#1D4ED8",
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
              <Plus size={14} /> Add new module row
            </button>
          </div>
        )}

        {/* ── Submit / Draft Bar ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              color: "#94A3B8",
              flex: 1,
              minWidth: 0,
              flexWrap: "wrap",
            }}
          >
            <span>
              <Clock size={11} />
            </span>
            <span>Saved as draft:</span>
            <strong style={{ color: "#0F172A" }}>{draftTime || "—"}</strong>
            <span style={{ color: "#E2E8F0", margin: "0 4px" }}>|</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                background: motionSubmitted ? "#DCFCE7" : "#F1F5F9",
                color: motionSubmitted ? "#16A34A" : "#64748B",
                border: `1px solid ${motionSubmitted ? "#86EFAC" : "#E2E8F0"}`,
              }}
            >
              {motionSubmitted ? (
                <>
                  <Rocket size={12} /> Published — edit & re-publish to update
                </>
              ) : (
                <>
                  <Lock size={12} /> Draft — submit for motion to publish
                </>
              )}
            </span>
          </div>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || motionSubmitted}
            title={
              motionSubmitted
                ? "Cannot save — project is already published"
                : ""
            }
            style={{
              ...btnStyle,
              height: 36,
              opacity: isSaving || motionSubmitted ? 0.5 : 1,
              cursor: isSaving || motionSubmitted ? "not-allowed" : "pointer",
              background: motionSubmitted ? "#F1F5F9" : "#fff",
              color: motionSubmitted ? "#94A3B8" : "#475569",
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {" Saving..."}
              </>
            ) : motionSubmitted ? (
              <>
                <Lock size={12} />
                {" Save Draft"}
              </>
            ) : (
              <>
                <Save size={14} />
                {" Save Draft"}
              </>
            )}
          </button>
          <button
            onClick={handleSubmitMotion}
            disabled={isSaving}
            style={{
              ...btnStyle,
              background: "#1D4ED8",
              color: "#fff",
              borderColor: "#1D4ED8",
              height: 36,
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {motionSubmitted ? (
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
              bg: "#F1F5F9",
              color: "#475569",
            },
            {
              label: (
                <>
                  <UserCheck size={12} />
                  {` ${assigned} assigned`}
                </>
              ),
              bg: "#DCFCE7",
              color: "#15803D",
            },
            {
              label: (
                <>
                  <UserX size={12} />
                  {` ${unassigned} unassigned`}
                </>
              ),
              bg: "#F1F5F9",
              color: "#64748B",
            },
            {
              label: (
                <>
                  <MessageSquare size={12} />
                  {` ${totalComments} comment${totalComments !== 1 ? "s" : ""}`}
                </>
              ),
              bg: "#EDE9FE",
              color: "#7C3AED",
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
                border: "1px solid rgba(0,0,0,0.06)",
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
      </div>

      {/* ── Modals ── */}
      {commentRow && (
        <CommentsModal
          row={commentRow}
          onClose={() => setCommentRow(null)}
          onUpdate={(updated) => {
            updateRow(updated);
            setCommentRow(updated);
          }}
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
  groupLabels, // ← NEW
  onOpen,
  onDelete,
  onNew,
  onRefresh,
}) {
  //   const { groupLabels } = useData();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // ← NEW: "all" | "draft" | "published"
  const statusCounts = useMemo(
    () => ({
      all: drafts.length,
      draft: drafts.filter((d) => d.status !== "published").length,
      published: drafts.filter((d) => d.status === "published").length,
    }),
    [drafts],
  );
  const filtered = useMemo(() => {
    let result = drafts;

    // Status filter
    if (statusFilter === "draft") {
      result = result.filter((d) => d.status !== "published");
    } else if (statusFilter === "published") {
      result = result.filter((d) => d.status === "published");
    }

    // Search filter
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
  }, [drafts, search, statusFilter]);

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

  return (
    <div
      style={{ padding: "16px 20px 32px", maxWidth: 1600, margin: "0 auto" }}
    >
      {/* Header */}
      {/* ── Status Filter Tabs ── */}
      {!loading && !error && drafts.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 16,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: 4,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            width: "fit-content",
          }}
        >
          {[
            {
              key: "all",
              label: "All Projects",
              icon: <Briefcase size={14} />,
              color: "#475569",
            },
            {
              key: "draft",
              label: "Drafts",
              icon: <FileText size={11} />,
              color: "#B45309",
            },
            {
              key: "published",
              label: "Published",
              icon: <Rocket size={11} />,
              color: "#15803D",
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
                  background: active ? "#0F172A" : "transparent",
                  color: active ? "#fff" : tab.color,
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
                    background: active ? "rgba(255,255,255,0.2)" : "#F1F5F9",
                    color: active ? "#fff" : "#64748B",
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
      <div
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
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
            background: "#FEF3C7",
            color: "#B45309",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          <Briefcase size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>
            Projects
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            {drafts.length === 0
              ? "No projects yet — create one to get started."
              : `${drafts.length} project${drafts.length !== 1 ? "s" : ""} saved `}
          </div>
        </div>
        <div
          style={{
            position: "relative",
            width: 280,
          }}
        >
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
            }}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, PO, site…"
            style={{
              height: 36,
              width: "100%",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              padding: "0 12px 0 32px", // left padding for icon
              fontFamily: "Sora,sans-serif",
              fontSize: 12.5,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          style={{
            ...btnStyle,
            height: 36,
            opacity: loading ? 0.6 : 1,
          }}
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
            ...btnStyle,
            height: 36,
            background: "#1D4ED8",
            color: "#fff",
            borderColor: "#1D4ED8",
            fontWeight: 600,
          }}
        >
          <>
            <Plus size={20} />
            {"New Project"}
          </>
        </button>
      </div>
      {/* Loading state */}
      {loading && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "60px 20px",
            textAlign: "center",
            color: "#64748B",
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          Loading projects from server...
        </div>
      )}
      {/* Error state */}
      {error &&
        !loading &&
        (() => {
          // Detect error type from message
          let ErrorIcon = AlertOctagon;
          let title = "Failed to load projects";

          if (error.includes("401")) {
            ErrorIcon = ShieldAlert;
            title = "Unauthorized — Please log in again";
          } else if (error.includes("403")) {
            ErrorIcon = ShieldX;
            title = "Access denied";
          } else if (error.includes("404")) {
            ErrorIcon = SearchX;
            title = "Resource not found";
          } else if (
            error.includes("500") ||
            error.includes("502") ||
            error.includes("503")
          ) {
            ErrorIcon = ServerCrash;
            title = "Server error — please try again";
          } else if (
            error.toLowerCase().includes("network") ||
            error.toLowerCase().includes("fetch")
          ) {
            ErrorIcon = WifiOff;
            title = "Network error — check your connection";
          }

          return (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
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
                  background: "#FEE2E2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ErrorIcon size={22} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#DC2626",
                    fontSize: 13.5,
                    marginBottom: 3,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    color: "#7F1D1D",
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(255,255,255,0.5)",
                    padding: "4px 8px",
                    borderRadius: 5,
                    border: "1px solid #FECACA",
                    wordBreak: "break-word",
                  }}
                >
                  {error}
                </div>
              </div>
              <button
                onClick={onRefresh}
                style={{
                  ...btnStyle,
                  background: "#DC2626",
                  color: "#fff",
                  borderColor: "#DC2626",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          );
        })()}
      {/* Empty state */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px dashed #CBD5E1",
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
                    statusFilter === "published" ? "#DCFCE7" : "#FEF3C7",
                  color: statusFilter === "published" ? "#15803D" : "#B45309",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  marginBottom: 14,
                }}
              >
                {statusFilter === "published" ? "🚀" : "📋"}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#0F172A",
                  marginBottom: 4,
                }}
              >
                {search
                  ? "No matching projects"
                  : statusFilter === "draft"
                    ? "No draft projects"
                    : statusFilter === "published"
                      ? "No published projects yet"
                      : "No projects yet"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  maxWidth: 420,
                  margin: "0 auto 16px",
                }}
              >
                {search
                  ? "Try a different search term or filter."
                  : statusFilter === "published"
                    ? "Publish a draft project to see it here."
                    : statusFilter === "draft"
                      ? "Create a new project to get started."
                      : "Create your first project to get started."}
              </div>
              {!search && statusFilter !== "published" && (
                <button
                  onClick={onNew}
                  style={{
                    ...btnStyle,
                    background: "#1D4ED8",
                    color: "#fff",
                    borderColor: "#1D4ED8",
                  }}
                >
                  <Plus size={16} style={{ marginRight: 8 }} />
                  Create your first project
                </button>
              )}
            </div>
          ) : (
            /* Grid of draft cards */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((d) => {
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

                return (
                  <div
                    key={d.id}
                    onClick={() => onOpen(d.id)}
                    style={{
                      background: "#fff",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                      transition: "all .15s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      minHeight: 180,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#93C5FD";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(29,78,216,0.10)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.05)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Status badge + delete */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
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
                            status === "published" ? "#DCFCE7" : "#FEF3C7",
                          color: status === "published" ? "#15803D" : "#B45309",
                          border: `1px solid ${status === "published" ? "#86EFAC" : "#FCD34D"}`,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {status === "published" ? (
                          <>
                            <Rocket size={11} />
                            Published
                          </>
                        ) : (
                          <>
                            <FileText size={11} />
                            Draft
                          </>
                        )}
                      </span>
                      {d.status !== "published" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deletingProjectId !== d.id) {
                              setConfirmDelete(d);
                            }
                          }}
                          disabled={deletingProjectId === d.id}
                          title={
                            deletingProjectId === d.id
                              ? "Deleting..."
                              : "Delete project"
                          }
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: "1px solid #FCA5A5",
                            background:
                              deletingProjectId === d.id
                                ? "#F1F5F9"
                                : "#FEF2F2",
                            color:
                              deletingProjectId === d.id
                                ? "#94A3B8"
                                : "#EF4444",
                            cursor:
                              deletingProjectId === d.id
                                ? "not-allowed"
                                : "pointer",
                            fontSize: 12,
                            opacity: deletingProjectId === d.id ? 0.6 : 1,
                            transition: "all .12s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
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

                    {/* Project title */}
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#0F172A",
                          marginBottom: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.project || "Untitled Project"}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#64748B",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          PO:{" "}
                          <strong style={{ color: "#475569" }}>
                            {d.po || "—"}
                          </strong>
                        </span>
                        <span style={{ color: "#CBD5E1" }}>•</span>
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

                    {/* Stats */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginTop: "auto",
                      }}
                    >
                      <span style={statChip("#F0F9FF", "#0369A1", "#BAE6FD")}>
                        <Package size={11} /> {moduleCount}{" "}
                        {moduleCount === 1 ? "module" : "modules"}
                      </span>
                      <span style={statChip("#F0FDF4", "#15803D", "#86EFAC")}>
                        <CheckCircle2 size={11} /> {taskCount}{" "}
                        {taskCount === 1 ? "task" : "tasks"}
                      </span>
                      {subTaskCount > 0 && (
                        <span style={statChip("#EDE9FE", "#7C3AED", "#DDD6FE")}>
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
                              background: "#DBEAFE",
                              color: "#1D4ED8",
                              border: "1px solid #93C5FD",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {getGroupName(g, groupLabels)}
                          </span>
                        ))}
                        {d.groups.length > 3 && (
                          <span style={{ fontSize: 10, color: "#94A3B8" }}>
                            +{d.groups.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "#94A3B8",
                        borderTop: "1px solid #F1F5F9",
                        paddingTop: 8,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        <Clock size={11} /> {fmtDate(d.updatedAt)}
                      </span>
                      <span style={{ color: "#1D4ED8", fontWeight: 600 }}>
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
            if (deletingProjectId) return; // ← Block closing while deleting
            e.target === e.currentTarget && setConfirmDelete(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              width: "100%",
              maxWidth: 400,
              fontFamily: "Sora,sans-serif",
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "#FEF2F2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}
                >
                  Delete this draft?
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
                  <strong>{confirmDelete.project || "Untitled"}</strong> will be
                  permanently removed. This cannot be undone.
                </div>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button onClick={() => setConfirmDelete(null)} style={btnStyle}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDelete(confirmDelete.id);
                  setConfirmDelete(null); // ← Child closes its OWN modal
                }}
                disabled={deletingProjectId === confirmDelete?.id} // ← Add this
                style={{
                  ...btnStyle,
                  background: "#DC2626",
                  color: "#fff",
                  borderColor: "#DC2626",
                  opacity: deletingProjectId === confirmDelete?.id ? 0.6 : 1, // ← Add this
                }}
              >
                {deletingProjectId === confirmDelete?.id ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {"Deleting..."}
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> {"Delete"}
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

const useData = () => useContext(DataContext);
/* ─── Top-level App with Tab Navigation ─── */
export default function AssignerModule() {
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [tab, setTab] = useState("drafts"); // "drafts" | "editor"
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState(null);
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [pendingDraft, setPendingDraft] = useState(null);

  const [groupLabels, setGroupLabels] = useState([]);
  const [groupResources, setGroupResources] = useState({});
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const showToast = useCallback((kind, title, msg, dur = 3800) => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, kind, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), dur);
  }, []);
  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const groups = await activityTrackerApi.getAllGroups();
      setGroupLabels(Array.isArray(groups) ? groups : []);
    } catch (err) {
      console.error("Failed to load groups:", err);
      setGroupsError(err.message);
      showToast("error", "Failed to load groups", err.message);
    } finally {
      setGroupsLoading(false);
    }
  }, [showToast]);

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
        console.error("Failed to load resources:", err);
        showToast("error", "Failed to load resources", err.message);
        return groupResources;
      } finally {
        setResourcesLoading(false);
      }
    },
    [groupResources, showToast],
  );
  /* ─── Load projects from API on mount ─── */
  const fetchProjects = useCallback(async () => {
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const projects = await activityTrackerApi.getActivityTreeByUser();
      setDrafts(Array.isArray(projects) ? projects : []);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setDraftsError(err.message);
      showToast("error", "Failed to load projects", err.message);
    } finally {
      setDraftsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);
  //   useEffect(() => {
  //     fetchProjects();
  //   }, [fetchProjects]);
  // Save drafts to localStorage whenever they change
  //   useEffect(() => {
  //     saveDrafts(drafts);
  //   }, [drafts]);
  //   useEffect(() => {
  //     const fetchDrafts = async () => {
  //       const data = await loadDrafts(); // ✅ wait for API
  //       setDrafts(data); // now it's an array
  //     };

  //     fetchDrafts();
  //   }, []);
  const currentDraft = useMemo(() => {
    console.log("drafts.find : ", drafts);
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
      //   nextId: 1,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPendingDraft(newProject);
    setCurrentProjectId(newProject.id);
    setTab("editor");
  }, []);
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
        console.error("Delete failed:", err);
        showToast("error", "Delete failed", err.message);
        fetchProjects(); // refresh in case of partial failure
      } finally {
        setDeletingProjectId(null);
      }
    },
    [showToast, fetchProjects, currentProjectId],
  );

  const handleSaveDraft = useCallback(
    async (projectData) => {
      const payload = {
        ...projectData,
        status: projectData.status === "published" ? "published" : "draft",
        updatedAt: new Date().toISOString(),
      };

      setSavingProjectId(projectData.id);
      try {
        // Use postActivityTree — handles full project + rows + comments in one call
        const result = await activityTrackerApi.postActivityTree(payload);

        // API returns boolean (true on success), so use our payload as the "saved" state
        const finalData = { ...payload };

        setDrafts((prev) => {
          const exists = prev.some((d) => d.id === finalData.id);
          return exists
            ? prev.map((d) => (d.id === finalData.id ? finalData : d))
            : [finalData, ...prev];
        });

        setPendingDraft((prev) =>
          prev && prev.id === projectData.id ? null : prev,
        );

        return finalData;
      } catch (err) {
        console.error("Save failed:", err);
        showToast("error", "Save failed", err.message);
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

      const payload = {
        ...projectData,
        status: "published",
        publishedAt: isUpdate
          ? projectData.publishedAt
          : new Date().toISOString(),
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

        setPendingDraft((prev) =>
          prev && prev.id === projectData.id ? null : prev,
        );

        showToast(
          "success",
          isUpdate ? "Project Updated 🔄" : "Project Published 🚀",
          `${finalData.project || "Project"} ${isUpdate ? "has been updated" : "is now live"}.`,
        );
        setTab("drafts");
        setCurrentProjectId(null);
      } catch (err) {
        console.error("Publish failed:", err);
        showToast(
          "error",
          isUpdate ? "Update failed" : "Publish failed",
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
    fetchProjects(); // ← Refresh on return
  }, [fetchProjects]);
  // Show loading screen while fetching groups
  if (groupsLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Sora,sans-serif",
          background: "#F1F5F9",
        }}
      >
        <div style={{ textAlign: "center", color: "#64748B" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if groups failed to load
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
        }}
      >
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 12,
            padding: 24,
            maxWidth: 480,
            textAlign: "center",
          }}
        >
          <AlertOctagon
            size={36}
            color="#DC2626"
            style={{ marginBottom: 12 }}
          />
          <div style={{ fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>
            Cannot load workspace
          </div>
          <div style={{ color: "#7F1D1D", fontSize: 12, marginBottom: 16 }}>
            {groupsError}
          </div>
          <button
            onClick={fetchGroups}
            style={{
              ...btnStyle,
              background: "#DC2626",
              color: "#fff",
              borderColor: "#DC2626",
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
        background: "#F1F5F9",
        color: "#0F172A",
      }}
    >
      {/* ── Top Nav ── */}
      <nav
        style={{
          height: 48,
          background: "#0F172A",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
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
            color: "#F8FAFC",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {/* <span style={{ fontSize: 16 }}>💼</span> ESS Portal */}
        </div>
        <div
          style={{
            marginLeft: 8,
            color: "#64748B",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {/* <span>🏠</span> <span style={{ color: "#475569" }}>›</span>
          <span>Projects</span> <span style={{ color: "#475569" }}>›</span>
          <span style={{ color: "#94A3B8" }}>
            {tab === "drafts" ? "Draft Projects" : "Activity Tracker"}
          </span> */}
        </div>
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
              background: "#1E293B",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #334155",
            }}
          >
            <button
              onClick={handleBackToList}
              style={{
                padding: "6px 14px",
                background: tab === "drafts" ? "#1D4ED8" : "transparent",
                color: tab === "drafts" ? "#fff" : "#94A3B8",
                fontSize: 11.5,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <FolderOpen size={14} /> Drafts
              {drafts.filter((d) => d.status !== "published").length > 0 && (
                <span
                  style={{
                    background:
                      tab === "drafts" ? "rgba(255,255,255,0.25)" : "#475569",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "1px 6px",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {drafts.filter((d) => d.status !== "published").length}
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
                background: tab === "editor" ? "#1D4ED8" : "transparent",
                color:
                  tab === "editor"
                    ? "#fff"
                    : currentDraft
                      ? "#94A3B8"
                      : "#475569",
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
          groupLabels={groupLabels} // ← NEW
          onOpen={handleOpenDraft}
          onDelete={handleDeleteDraft}
          onNew={handleNewProject}
          onRefresh={fetchProjects}
        />
      ) : currentDraft ? (
        <ProjectEditor
          key={currentDraft.id}
          draft={currentDraft}
          groupLabels={groupLabels} // ← NEW
          groupResources={groupResources} // ← NEW
          fetchResourcesForGroups={fetchResourcesForGroups} // ← NEW
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onBack={handleBackToList}
          showToast={showToast}
        />
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
          No project selected.{" "}
          <button onClick={handleBackToList}>Back to drafts</button>
        </div>
      )}

      {/* Global Toasts */}
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  );
}
