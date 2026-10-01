import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  Filter,
  Check,
  X,
  Briefcase,
  FileText,
  Rocket,
  Lock,
  Handshake,
  Users,
  ClipboardList,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ShieldX,
  SearchX,
  ServerCrash,
  WifiOff,
  Package,
  CheckCircle2,
} from "lucide-react";

import { useTheme } from "../useTheme";
import { getGroupName } from "../helpers/resources";
import { makeBtnStyle } from "../helpers/styles";
import { useResponsive } from "../useResponsive";
import BottomSheet from "../shared/BottomSheet";
import { loadSavedDateRange, saveDateRange } from "../helpers/dateRangeStorage";
import GreenWaveLoader, {
  GreenWaveLoaderOverlay,
} from "../loader/GreenWaveLoader";
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

export default function DraftProjectsList({
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
  const themedBtn = {
    ...makeBtnStyle(t),
    height: 32,
  };
  const { isMobile } = useResponsive();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Date range state
  // Date range state — restore from localStorage
  const [dateMode, setDateMode] = useState(
    () => loadSavedDateRange()?.mode || "currentMonth",
  );
  const [lastAppliedCustom, setLastAppliedCustom] = useState(() => {
    const saved = loadSavedDateRange();
    return {
      fromDate: saved?.customFrom || dateRange.fromDate,
      toDate: saved?.customTo || dateRange.toDate,
    };
  });
  const [customFrom, setCustomFrom] = useState(
    () => loadSavedDateRange()?.customFrom || dateRange.fromDate,
  );
  const [customTo, setCustomTo] = useState(
    () => loadSavedDateRange()?.customTo || dateRange.toDate,
  );
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
    saveDateRange({ mode: "currentMonth" });
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
    saveDateRange({ mode: "last3Months" });
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
    saveDateRange({
      mode: "custom",
      customFrom,
      customTo,
    });
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
      const uid = currentUserId.toLowerCase();

      // Not the creator
      if (d.createdBy?.toLowerCase() === uid) return false;

      // Not a co-assigner
      const isCoAssigner = (d.coAssigners || []).some(
        (ca) => ca.userId?.toLowerCase() === uid,
      );
      if (isCoAssigner) return false;

      // API only returns projects you have access to
      // → if not creator and not co-assigner, must be updates-shared
      return true;
    },
    [currentUserId],
  );
  // Helper: determines the SINGLE role for a project (priority: own > co-assigned > shared)
  const getProjectRole = useCallback(
    (d) => {
      if (isMineProject(d)) return "own";
      if (isCoAssignedProject(d)) return "coAssigned";
      if (isUpdatesSharedProject(d)) return "sharedWithMe";
      return "unrelated"; // shouldn't happen if API returns only accessible projects
    },
    [isMineProject, isCoAssignedProject, isUpdatesSharedProject],
  );

  const statusCounts = useMemo(() => {
    const counts = {
      all: drafts.length,
      draft: 0,
      published: 0,
      closed: 0,
      coAssigned: 0,
      sharedWithMe: 0,
    };
    drafts.forEach((d) => {
      const role = getProjectRole(d);
      if (role === "own") {
        if (d.status === "published" || d.status === "finished")
          counts.published++;
        else if (d.status === "closed") counts.closed++;
        else counts.draft++;
      } else if (role === "coAssigned") {
        counts.coAssigned++;
      } else if (role === "sharedWithMe") {
        counts.sharedWithMe++;
      }
    });
    return counts;
  }, [drafts, getProjectRole]);

  const filtered = useMemo(() => {
    let result = drafts;

    if (statusFilter !== "all") {
      result = result.filter((d) => {
        const role = getProjectRole(d);
        if (statusFilter === "draft") {
          return (
            role === "own" &&
            d.status !== "published" &&
            d.status !== "finished" &&
            d.status !== "closed"
          );
        }
        if (statusFilter === "published") {
          return (
            role === "own" &&
            (d.status === "published" || d.status === "finished")
          );
        }
        if (statusFilter === "closed") {
          return role === "own" && d.status === "closed";
        }
        if (statusFilter === "coAssigned") {
          return role === "coAssigned";
        }
        if (statusFilter === "sharedWithMe") {
          return role === "sharedWithMe";
        }
        return true;
      });
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
  }, [drafts, statusFilter, search, getProjectRole]);
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
      {/* ══════════════════════════════════════════════════════ */}
      {/*   DESKTOP / TABLET: Status filter tabs                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {!isMobile && !loading && !error && drafts.length > 0 && (
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

      {/* ══════════════════════════════════════════════════════ */}
      {/*   MOBILE: Status filter tabs (horizontal scroll)       */}
      {/* ══════════════════════════════════════════════════════ */}
      {isMobile && !loading && !error && drafts.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 4,
            // Hide scrollbar
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {[
            {
              key: "all",
              label: "All",
              icon: <Briefcase size={12} />,
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
              icon: <Handshake size={12} />,
              color: t.success,
            },
            {
              key: "sharedWithMe",
              label: "Shared",
              icon: <Users size={12} />,
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
                  gap: 5,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${active ? t.primary : t.border}`,
                  background: active ? t.primary : t.bgCard,
                  color: active ? t.textInverse : tab.color,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Sora,sans-serif",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  height: 34,
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: active ? "rgba(255,255,255,0.25)" : t.bgMuted,
                    color: active ? t.textInverse : t.textMuted,
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

      {/* ══════════════════════════════════════════════════════ */}
      {/*   DESKTOP / TABLET: Full header row                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {!isMobile && (
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
            <div
              style={{ fontWeight: 700, fontSize: 16, color: t.textPrimary }}
            >
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

          {/* ── Desktop Date range tabs ── */}
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
                color:
                  dateMode === "currentMonth" ? t.textInverse : t.textMuted,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Sora,sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Calendar size={12} /> Current Month
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
              <Clock size={12} /> Last 3 Months
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
              <Filter size={12} /> Custom
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
                    cursor:
                      !customFrom || !customTo ? "not-allowed" : "pointer",
                    fontFamily: "Sora,sans-serif",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Check size={12} /> Apply
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

          {/* Desktop Search */}
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
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/*   MOBILE: Compact header row                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {/* Search (flex-1) */}
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
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
              placeholder="Search…"
              style={{
                height: 42,
                width: "100%",
                border: `1px solid ${t.borderStrong}`,
                borderRadius: 10,
                padding: "0 12px 0 34px",
                fontFamily: "Sora,sans-serif",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                background: t.bgInput,
                color: t.textPrimary,
              }}
            />
          </div>

          {/* Filter button (opens bottom sheet) */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
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
            <Filter size={18} />
          </button>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              border: `1px solid ${t.borderStrong}`,
              background: t.bgCard,
              color: t.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <Loader2
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
        </div>
      )}

      {/* Mobile: date range display */}
      {isMobile && (
        <div
          onClick={() => setMobileFiltersOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            background: t.bgSubtle,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            marginBottom: 12,
            cursor: "pointer",
            fontSize: 12,
            color: t.textSecondary,
          }}
        >
          <Calendar size={14} color={t.primary} />
          <span style={{ fontWeight: 600 }}>
            {dateMode === "currentMonth" && "Current Month"}
            {dateMode === "last3Months" && "Last 3 Months"}
            {dateMode === "custom" && "Custom range"}
          </span>
          <span
            style={{ color: t.textFaint, marginLeft: "auto", fontSize: 11 }}
          >
            {formatDateShort(dateRange.fromDate)} →{" "}
            {formatDateShort(dateRange.toDate)}
          </span>
        </div>
      )}
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
          <div
            style={{
              fontSize: 32,
              marginBottom: 10,
              justifyContent: "center",
              display: "flex",
            }}
          >
            <GreenWaveLoader mode="draw" size={90} />
            {/* <GreenWaveLoaderOverlay mode="draw-spin" show={true} size={110} /> */}
          </div>
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
            <AlertOctagon size={22} />
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
            <RefreshCw size={14} /> Retry
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
                gridTemplateColumns: isMobile
                  ? "1fr" // single column on mobile
                  : "repeat(auto-fill, minmax(320px, 1fr))",
                gap: isMobile ? 10 : 14,
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
                      boxShadow: t.shadowSm,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      minHeight: 180,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.hoverBorder;
                      e.currentTarget.style.boxShadow = t.shadowMd;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.borderColor;
                      e.currentTarget.style.boxShadow = t.shadowSm;
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
                                : status === "published" ||
                                    status === "finished"
                                  ? t.successBg
                                  : t.warningBg,
                            color:
                              status === "closed"
                                ? t.closedText
                                : status === "published" ||
                                    status === "finished"
                                  ? t.success
                                  : t.warning,
                            border: `1px solid ${
                              status === "closed"
                                ? t.closedBorder
                                : status === "published" ||
                                    status === "finished"
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
                          ) : status === "published" ||
                            status === "finished" ? (
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
                        d.status !== "finished" &&
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
      {/* ── Mobile FAB: New Project ── */}
      {isMobile && (
        <button
          onClick={onNew}
          title="Create new project"
          style={{
            position: "fixed",
            bottom: "calc(76px + env(safe-area-inset-bottom, 0))", // above bottom tab bar
            right: 16,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            background: t.primary,
            color: t.textInverse,
            boxShadow: "0 6px 20px rgba(29,78,216,0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 80,
            transition: "transform .15s",
          }}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Plus size={26} />
        </button>
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
      {/* ── Mobile Filters Bottom Sheet ── */}
      {isMobile && (
        <BottomSheet
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          title="Filters & Date Range"
          height="auto"
        >
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Date Range Section */}
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
                Date Range
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  {
                    key: "currentMonth",
                    label: "Current Month",
                    icon: <Calendar size={14} />,
                    handler: handleCurrentMonth,
                  },
                  {
                    key: "last3Months",
                    label: "Last 3 Months",
                    icon: <Clock size={14} />,
                    handler: handleLast3Months,
                  },
                ].map((opt) => {
                  const active = dateMode === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        opt.handler();
                        setMobileFiltersOpen(false);
                      }}
                      style={{
                        height: 44,
                        padding: "0 14px",
                        borderRadius: 10,
                        border: `1.5px solid ${active ? t.primary : t.border}`,
                        background: active ? t.primaryBgSubtle : t.bgCard,
                        color: active ? t.primary : t.textPrimary,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontFamily: "Sora,sans-serif",
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                      {active && (
                        <Check size={16} style={{ marginLeft: "auto" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom range */}
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  border: `1.5px solid ${dateMode === "custom" ? t.primary : t.border}`,
                  background:
                    dateMode === "custom" ? t.primaryBgSubtle : t.bgSubtle,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: dateMode === "custom" ? t.primary : t.textSecondary,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Filter size={13} />
                  Custom Range
                </div>

                <div
                  style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        color: t.textMuted,
                        marginBottom: 4,
                        textTransform: "uppercase",
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
                        width: "100%",
                        height: 42,
                        border: `1px solid ${t.borderStrong}`,
                        borderRadius: 8,
                        padding: "0 10px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        outline: "none",
                        color: t.textPrimary,
                        background: t.bgInput,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        color: t.textMuted,
                        marginBottom: 4,
                        textTransform: "uppercase",
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
                        width: "100%",
                        height: 42,
                        border: `1px solid ${t.borderStrong}`,
                        borderRadius: 8,
                        padding: "0 10px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        outline: "none",
                        color: t.textPrimary,
                        background: t.bgInput,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleCustomApply();
                    setMobileFiltersOpen(false);
                  }}
                  disabled={!customFrom || !customTo}
                  style={{
                    width: "100%",
                    height: 42,
                    marginTop: 10,
                    borderRadius: 8,
                    border: "none",
                    background:
                      !customFrom || !customTo ? t.bgMuted : t.primary,
                    color:
                      !customFrom || !customTo ? t.textFaint : t.textInverse,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor:
                      !customFrom || !customTo ? "not-allowed" : "pointer",
                    fontFamily: "Sora,sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Check size={16} /> Apply Custom Range
                </button>
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
