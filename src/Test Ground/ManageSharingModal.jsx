import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Users,
  Check,
  Save,
  Search,
  Filter,
  UserPlus,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Trash2,
  Sparkles,
  UserCheck,
  UserX,
  Grid3x3,
  Loader2,
  ClipboardList,
  Plus,
} from "lucide-react";
import * as sharingApi from "./sharingApi";
import { getUsersCached } from "./sharingApi";
import { useTheme } from "./useTheme";
import { useResponsive } from "./useResponsive";
import BottomSheet from "./shared/BottomSheet";

/* ─── Multi-Select Filter Dropdown (unchanged) ─── */
function FilterDropdown({ label, options, selected, onChange, icon: Icon }) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = selected.length > 0;

  const btnStyle = {
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
    transition: "all .12s",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          ...btnStyle,
          background: isActive ? t.primaryBgSubtle : t.bgCard,
          borderColor: isActive ? t.primaryBorder : t.borderStrong,
          color: isActive ? t.primary : t.textSecondary,
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {Icon && <Icon size={12} />}
        {label}
        {isActive && (
          <span
            style={{
              padding: "1px 6px",
              background: t.primary,
              color: t.textInverse,
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              marginLeft: 2,
            }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={12}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: 220,
            background: t.bgCard,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 8,
            boxShadow: t.shadowLg,
            zIndex: 100,
            overflow: "hidden",
            fontFamily: "Sora,sans-serif",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: t.bgSubtle,
              borderBottom: `1px solid ${t.border}`,
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
          <div style={{ maxHeight: 240, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  color: t.textFaint,
                  fontSize: 11,
                }}
              >
                No options
              </div>
            ) : (
              options.map((opt) => {
                const checked = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() =>
                      onChange(
                        checked
                          ? selected.filter((s) => s !== opt)
                          : [...selected, opt],
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 12px",
                      cursor: "pointer",
                      background: checked ? t.primaryBgSubtle : "transparent",
                      borderLeft: checked
                        ? `3px solid ${t.primary}`
                        : "3px solid transparent",
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
                      {checked && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: t.textPrimary,
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      {opt}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Add User Panel (with mobile support) ─── */
function AddUserPanel({
  availableUsers,
  onAdd,
  onClose,
  isLoading,
  error,
  onRetry,
  isMobile,
}) {
  const { t } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const searchRef = useRef();

  useEffect(() => {
    if (!isMobile) setTimeout(() => searchRef.current?.focus(), 100);
  }, [isMobile]);

  const departments = useMemo(() => {
    const set = new Set(
      availableUsers.map((u) => u.department).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [availableUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return availableUsers.filter((u) => {
      if (selectedDepts.length > 0 && !selectedDepts.includes(u.department))
        return false;
      if (!q) return true;
      return (
        u.userName.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q) ||
        (u.designation || "").toLowerCase().includes(q)
      );
    });
  }, [availableUsers, search, selectedDepts]);

  const groupedUsers = useMemo(() => {
    const groups = {};
    filteredUsers.forEach((u) => {
      const dept = u.department || "Other";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(u);
    });
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredUsers]);

  const btnStyle = {
    height: isMobile ? 40 : 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: isMobile ? 13 : 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <div
      style={{
        padding: isMobile ? 14 : 16,
        background: t.bgSubtle,
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: isMobile ? 13 : 12.5,
            fontWeight: 700,
            color: t.textPrimary,
          }}
        >
          <UserPlus size={14} color={t.primary} />
          Add Users
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: t.textFaint,
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {isLoading && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            background: t.bgCard,
            borderRadius: 8,
            border: `1px solid ${t.border}`,
          }}
        >
          <Loader2
            size={22}
            style={{
              animation: "spin 1s linear infinite",
              color: t.primary,
              marginBottom: 8,
            }}
          />
          <div style={{ fontSize: 12, color: t.textMuted }}>
            Loading users...
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div
          style={{
            padding: 16,
            background: t.dangerBgSubtle,
            border: `1px solid ${t.dangerBorder}`,
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle
              size={16}
              color={t.danger}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: t.danger }}>
                Failed to load users
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.dangerTextDeep,
                  marginTop: 3,
                  marginBottom: 8,
                }}
              >
                {error?.userMessage || error?.message}
              </div>
              <button
                onClick={onRetry}
                style={{
                  ...btnStyle,
                  height: 28,
                  fontSize: 11,
                  background: t.danger,
                  color: t.textInverse,
                  borderColor: t.danger,
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Search + Filter */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
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
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                style={{
                  width: "100%",
                  height: isMobile ? 42 : 34,
                  border: `1px solid ${t.borderStrong}`,
                  borderRadius: 7,
                  padding: "0 10px 0 32px",
                  fontFamily: "Sora,sans-serif",
                  fontSize: isMobile ? 14 : 12,
                  outline: "none",
                  boxSizing: "border-box",
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: t.textFaint,
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {departments.length > 0 && !isMobile && (
              <FilterDropdown
                label="Department"
                icon={Building2}
                options={departments}
                selected={selectedDepts}
                onChange={setSelectedDepts}
              />
            )}
          </div>

          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              marginBottom: 8,
            }}
          >
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
            available
            {(search || selectedDepts.length > 0) &&
              ` (filtered from ${availableUsers.length})`}
          </div>

          <div
            style={{
              maxHeight: isMobile ? 400 : 260,
              overflowY: "auto",
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
            }}
          >
            {filteredUsers.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: t.textFaint,
                  fontSize: 12,
                }}
              >
                <UserX
                  size={28}
                  strokeWidth={1.5}
                  style={{ marginBottom: 8, opacity: 0.5 }}
                />
                <div>
                  {search || selectedDepts.length > 0
                    ? "No users match your filters"
                    : "All available users have been added"}
                </div>
              </div>
            ) : (
              Object.entries(groupedUsers).map(([dept, users]) => (
                <div key={dept}>
                  <div
                    style={{
                      padding: "6px 12px",
                      background: t.bgSubtle,
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${t.borderSubtle}`,
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <Building2
                      size={10}
                      style={{ display: "inline", marginRight: 4 }}
                    />
                    {dept} · {users.length}
                  </div>
                  {users.map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => onAdd(user)}
                      style={{
                        padding: isMobile ? "12px" : "10px 12px",
                        borderBottom: `1px solid ${t.borderSubtle}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "background .1s",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? 36 : 32,
                          height: isMobile ? 36 : 32,
                          borderRadius: "50%",
                          background: t.primaryBg,
                          color: t.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: isMobile ? 14 : 12,
                          flexShrink: 0,
                        }}
                      >
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: isMobile ? 13 : 12,
                            fontWeight: 600,
                            color: t.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.userName}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: t.textFaint,
                            fontFamily: "'JetBrains Mono', monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.userId}
                        </div>
                        {user.designation && (
                          <div
                            style={{
                              fontSize: 10,
                              color: t.textMuted,
                              marginTop: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Briefcase size={9} />
                            {user.designation}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          color: t.primary,
                          fontSize: 11,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "5px 10px",
                          background: t.primaryBgSubtle,
                          borderRadius: 6,
                          border: `1px solid ${t.primaryBorder}`,
                        }}
                      >
                        <Plus size={11} /> Add
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Mobile Category Card (expandable) ─── */
function MobileCategoryCard({
  category,
  selectedUsers,
  sharingMatrix,
  isSaving,
  onToggleCell,
  onToggleRowAll,
}) {
  const { t } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const sharedCount = sharingMatrix[category.id]?.size || 0;
  const isShared = sharedCount > 0;
  const allSelected = sharedCount === selectedUsers.length;

  return (
    <div
      style={{
        background: t.bgCard,
        border: `1px solid ${isShared ? t.successBorder : t.border}`,
        borderLeft: `4px solid ${isShared ? t.success : t.borderStrong}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: t.shadowSm,
      }}
    >
      {/* Header (always visible) */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {expanded ? (
            <ChevronDown size={16} color={t.textMuted} />
          ) : (
            <ChevronRight size={16} color={t.textMuted} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: t.textPrimary,
              marginBottom: 4,
            }}
          >
            {category.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: isShared ? t.success : t.textFaint,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isShared ? (
              <>
                <UserCheck size={11} />
                {sharedCount} of {selectedUsers.length} user
                {selectedUsers.length !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                <UserX size={11} />
                Not shared
              </>
            )}
          </div>
        </div>
        {isShared && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              background: t.successBg,
              color: t.success,
              border: `1px solid ${t.successBorder}`,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {sharedCount}
          </span>
        )}
      </div>

      {/* Expanded user list */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${t.borderSubtle}`,
            padding: "10px 14px",
            background: t.bgSubtle,
          }}
        >
          {/* Toggle All button */}
          <button
            onClick={() => onToggleRowAll(category.id)}
            disabled={isSaving}
            style={{
              width: "100%",
              height: 38,
              padding: "0 12px",
              marginBottom: 10,
              borderRadius: 7,
              border: `1px solid ${allSelected ? t.dangerBorder : t.primaryBorder}`,
              background: allSelected ? t.dangerBgSubtle : t.primaryBgSubtle,
              color: allSelected ? t.danger : t.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: isSaving ? "not-allowed" : "pointer",
              fontFamily: "Sora, sans-serif",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            {allSelected ? (
              <>
                <X size={13} /> Remove All Users
              </>
            ) : (
              <>
                <Check size={13} /> Share with All Users
              </>
            )}
          </button>

          {/* Individual user toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {selectedUsers.map((user) => {
              const checked = sharingMatrix[category.id]?.has(
                user.userId.toLowerCase(),
              );
              return (
                <div
                  key={user.userId}
                  onClick={() =>
                    !isSaving && onToggleCell(category.id, user.userId)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: checked ? t.primaryBgSubtle : t.bgCard,
                    border: `1.5px solid ${checked ? t.primaryBorder : t.border}`,
                    borderRadius: 8,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.6 : 1,
                    transition: "all .12s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: checked
                        ? `linear-gradient(135deg, ${t.primary}, ${t.primaryHover})`
                        : t.bgMuted,
                      color: checked ? t.textInverse : t.textMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: checked ? 700 : 600,
                        color: t.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.userName}
                    </div>
                    {user.department && (
                      <div
                        style={{
                          fontSize: 10,
                          color: t.textFaint,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 1,
                        }}
                      >
                        {user.department}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `2px solid ${checked ? t.primary : t.borderStrong}`,
                      background: checked ? t.primary : t.bgCard,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: t.textInverse,
                      flexShrink: 0,
                    }}
                  >
                    {checked && <Check size={13} strokeWidth={3.5} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Mobile Users Chips Bar ─── */
function MobileUsersChips({ selectedUsers, onRemove, isSaving }) {
  const { t } = useTheme();

  if (selectedUsers.length === 0) return null;

  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${t.border}`,
        background: t.bgSubtle,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: t.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Users size={11} />
        Users in Matrix ({selectedUsers.length})
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {selectedUsers.map((user) => (
          <div
            key={user.userId}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px 5px 5px",
              background: t.primaryBgSubtle,
              border: `1px solid ${t.primaryBorder}`,
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${t.primary}, ${t.primaryHover})`,
                color: t.textInverse,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.userName.charAt(0).toUpperCase()}
            </span>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: t.primary,
                whiteSpace: "nowrap",
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.userName}
            </span>
            <button
              onClick={() => !isSaving && onRemove(user.userId)}
              disabled={isSaving}
              style={{
                background: "none",
                border: "none",
                cursor: isSaving ? "not-allowed" : "pointer",
                color: t.primary,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Manage Sharing Modal
   ═══════════════════════════════════════════════════════ */
export default function ManageSharingModal({
  categories,
  currentUserId,
  isSaving = false,
  onClose,
  onSave,
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();

  const btnStyle = {
    height: isMobile ? 44 : 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: isMobile ? 13 : 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    transition: "all .12s",
  };

  const [showAddUser, setShowAddUser] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [sharingFilter, setSharingFilter] = useState("all");

  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await getUsersCached({ active: true });
      if (!mountedRef.current) return;
      setAllUsers(data.users || []);
    } catch (err) {
      if (!mountedRef.current) return;
      setUsersError(err);
    } finally {
      if (mountedRef.current) setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const initialMatrixUsers = useMemo(() => {
    if (allUsers.length === 0) return [];
    const set = new Set();
    categories.forEach((cat) => {
      (cat.sharedWith || []).forEach((s) => set.add(s.userId.toLowerCase()));
    });
    return Array.from(set)
      .map((uid) => allUsers.find((u) => u.userId.toLowerCase() === uid))
      .filter(Boolean);
  }, [categories, allUsers]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && initialMatrixUsers.length > 0) {
      setSelectedUsers(initialMatrixUsers);
      setInitialized(true);
    } else if (!initialized && allUsers.length > 0) {
      setInitialized(true);
    }
  }, [initialMatrixUsers, allUsers, initialized]);

  const [sharingMatrix, setSharingMatrix] = useState(() => {
    const matrix = {};
    categories.forEach((cat) => {
      matrix[cat.id] = new Set(
        (cat.sharedWith || []).map((s) => s.userId.toLowerCase()),
      );
    });
    return matrix;
  });

  const [hasChanges, setHasChanges] = useState(false);

  const toggleCell = (categoryId, userId) => {
    if (isSaving) return;
    setSharingMatrix((prev) => {
      const next = { ...prev };
      const set = new Set(next[categoryId]);
      const uid = userId.toLowerCase();
      if (set.has(uid)) set.delete(uid);
      else set.add(uid);
      next[categoryId] = set;
      return next;
    });
    setHasChanges(true);
  };

  const toggleRowAll = (categoryId) => {
    if (isSaving) return;
    setSharingMatrix((prev) => {
      const next = { ...prev };
      const currentSet = next[categoryId];
      const allSelected = selectedUsers.every((u) =>
        currentSet.has(u.userId.toLowerCase()),
      );
      if (allSelected) {
        next[categoryId] = new Set();
      } else {
        next[categoryId] = new Set(
          selectedUsers.map((u) => u.userId.toLowerCase()),
        );
      }
      return next;
    });
    setHasChanges(true);
  };

  const toggleColumnAll = (userId) => {
    if (isSaving) return;
    const uid = userId.toLowerCase();
    setSharingMatrix((prev) => {
      const next = { ...prev };
      const allSelected = filteredCategories.every((cat) =>
        next[cat.id]?.has(uid),
      );
      filteredCategories.forEach((cat) => {
        const set = new Set(next[cat.id]);
        if (allSelected) set.delete(uid);
        else set.add(uid);
        next[cat.id] = set;
      });
      return next;
    });
    setHasChanges(true);
  };

  const addUserToMatrix = (user) => {
    setSelectedUsers((prev) => {
      if (
        prev.some((u) => u.userId.toLowerCase() === user.userId.toLowerCase())
      )
        return prev;
      return [...prev, user];
    });
    setShowAddUser(false);
  };

  const removeUserFromMatrix = (userId) => {
    if (isSaving) return;
    const uid = userId.toLowerCase();
    setSelectedUsers((prev) =>
      prev.filter((u) => u.userId.toLowerCase() !== uid),
    );
    setSharingMatrix((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((catId) => {
        const set = new Set(next[catId]);
        set.delete(uid);
        next[catId] = set;
      });
      return next;
    });
    setHasChanges(true);
  };

  const handleClearAll = () => {
    if (isSaving) return;
    if (!window.confirm("Remove all sharing across all categories?")) return;
    const cleared = {};
    categories.forEach((cat) => {
      cleared[cat.id] = new Set();
    });
    setSharingMatrix(cleared);
    setHasChanges(true);
  };

  const handleShareAllWithAll = () => {
    if (isSaving) return;
    if (
      !window.confirm(
        `Grant all ${selectedUsers.length} users access to all ${categories.length} categories?`,
      )
    )
      return;
    const shared = {};
    categories.forEach((cat) => {
      shared[cat.id] = new Set(
        selectedUsers.map((u) => u.userId.toLowerCase()),
      );
    });
    setSharingMatrix(shared);
    setHasChanges(true);
  };

  const handleSave = () => {
    const result = {};
    categories.forEach((cat) => {
      result[cat.id] = Array.from(sharingMatrix[cat.id] || []);
    });
    onSave(result);
  };

  const availableUsersToAdd = useMemo(() => {
    const excludeSet = new Set([
      currentUserId.toLowerCase(),
      ...selectedUsers.map((u) => u.userId.toLowerCase()),
    ]);
    return allUsers.filter(
      (u) => u.active && !excludeSet.has(u.userId.toLowerCase()),
    );
  }, [allUsers, currentUserId, selectedUsers]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    return categories.filter((cat) => {
      if (q && !cat.name.toLowerCase().includes(q)) return false;
      const isShared = sharingMatrix[cat.id]?.size > 0;
      if (sharingFilter === "shared" && !isShared) return false;
      if (sharingFilter === "unshared" && isShared) return false;
      return true;
    });
  }, [categories, categorySearch, sharingFilter, sharingMatrix]);

  const stats = useMemo(() => {
    let checkedCells = 0;
    let sharedCategories = 0;
    categories.forEach((cat) => {
      const size = sharingMatrix[cat.id]?.size || 0;
      checkedCells += size;
      if (size > 0) sharedCategories++;
    });
    return {
      checkedCells,
      sharedCategories,
      unsharedCategories: categories.length - sharedCategories,
    };
  }, [categories, sharingMatrix]);

  // ─── Toolbar section (shared for both mobile + desktop) ───
  const toolbarContent = (
    <div
      style={{
        padding: isMobile ? "10px 14px" : "12px 20px",
        background: t.bgCard,
        borderBottom: `1px solid ${t.border}`,
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          flex: isMobile ? "1 1 100%" : "initial",
          width: isMobile ? "100%" : 260,
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
          type="text"
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          placeholder="Search categories..."
          style={{
            width: "100%",
            height: isMobile ? 42 : 32,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 7,
            padding: "0 30px 0 32px",
            fontFamily: "Sora,sans-serif",
            fontSize: isMobile ? 14 : 12,
            outline: "none",
            boxSizing: "border-box",
            background: t.bgInput,
            color: t.textPrimary,
          }}
        />
        {categorySearch && (
          <button
            onClick={() => setCategorySearch("")}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sharing Filter Pills */}
      <div
        style={{
          display: "flex",
          background: t.bgMuted,
          borderRadius: 7,
          padding: 3,
          gap: 2,
          flex: isMobile ? 1 : "initial",
          minWidth: isMobile ? "100%" : "auto",
        }}
      >
        {[
          { key: "all", label: "All", icon: Grid3x3 },
          { key: "shared", label: "Shared", icon: UserCheck },
          { key: "unshared", label: "Not Shared", icon: UserX },
        ].map((f) => {
          const active = sharingFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setSharingFilter(f.key)}
              style={{
                flex: isMobile ? 1 : "initial",
                padding: isMobile ? "8px 10px" : "5px 12px",
                borderRadius: 5,
                border: "none",
                background: active ? t.bgCard : "transparent",
                color: active ? t.textPrimary : t.textMuted,
                fontSize: isMobile ? 12 : 11,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                fontFamily: "Sora,sans-serif",
                boxShadow: active ? t.shadowSm : "none",
                transition: "all .12s",
              }}
            >
              <f.icon size={12} />
              {f.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginLeft: isMobile ? 0 : "auto",
          width: isMobile ? "100%" : "auto",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          disabled={isSaving}
          style={{
            ...btnStyle,
            flex: isMobile ? 1 : "initial",
            background: showAddUser ? t.primary : t.primaryBgSubtle,
            color: showAddUser ? t.textInverse : t.primary,
            borderColor: t.primary,
            fontWeight: 600,
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          <UserPlus size={13} />
          Add Users
        </button>

        {selectedUsers.length > 0 && categories.length > 0 && !isSaving && (
          <>
            {!isMobile && (
              <button
                onClick={handleShareAllWithAll}
                title="Grant all users access to all categories"
                style={{
                  ...btnStyle,
                  background: t.successBgSubtle,
                  color: t.success,
                  borderColor: t.successBorder,
                }}
              >
                <Sparkles size={13} />
                Share All
              </button>
            )}
            <button
              onClick={handleClearAll}
              title="Remove all sharing"
              style={{
                ...btnStyle,
                flex: isMobile ? 1 : "initial",
                background: t.dangerBgSubtle,
                color: t.danger,
                borderColor: t.dangerBorder,
              }}
            >
              <Trash2 size={13} />
              Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ─── Empty / loading / error states ───
  const renderBodyContent = () => {
    if (isLoadingUsers && !initialized) {
      return (
        <div style={{ padding: 60, textAlign: "center", color: t.textMuted }}>
          <Loader2
            size={32}
            style={{
              animation: "spin 1s linear infinite",
              color: t.violet,
              marginBottom: 12,
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            Loading sharing data...
          </div>
        </div>
      );
    }

    if (usersError && selectedUsers.length === 0) {
      return (
        <div style={{ padding: 30 }}>
          <div
            style={{
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
              borderRadius: 10,
              padding: 20,
              display: "flex",
              gap: 12,
            }}
          >
            <AlertTriangle size={24} color={t.danger} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: t.danger,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Cannot load user data
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: t.dangerTextDeep,
                  marginBottom: 10,
                }}
              >
                {usersError?.userMessage || usersError?.message}
              </div>
              <button
                onClick={loadUsers}
                style={{
                  ...btnStyle,
                  background: t.danger,
                  color: t.textInverse,
                  borderColor: t.danger,
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedUsers.length === 0) {
      return (
        <div style={{ padding: 60, textAlign: "center", color: t.textMuted }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: t.violetBg,
              color: t.violet,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <UserPlus size={30} />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: t.textPrimary,
              marginBottom: 4,
            }}
          >
            No Users Added Yet
          </div>
          <div style={{ fontSize: 12, maxWidth: 400, margin: "0 auto 16px" }}>
            Add users to start sharing categories with them.
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            style={{
              ...btnStyle,
              background: t.primary,
              color: t.textInverse,
              borderColor: t.primary,
              height: isMobile ? 44 : 36,
            }}
          >
            <UserPlus size={14} /> Add Your First User
          </button>
        </div>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>
          <Filter
            size={32}
            strokeWidth={1.5}
            style={{ marginBottom: 12, opacity: 0.5 }}
          />
          <div
            style={{ fontWeight: 600, color: t.textPrimary, marginBottom: 4 }}
          >
            No categories match your filters
          </div>
          <button
            onClick={() => {
              setCategorySearch("");
              setSharingFilter("all");
            }}
            style={{ ...btnStyle, marginTop: 8 }}
          >
            Clear Filters
          </button>
        </div>
      );
    }

    // ─── MOBILE: Category cards view ───
    if (isMobile) {
      return (
        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {filteredCategories.map((cat) => (
            <MobileCategoryCard
              key={cat.id}
              category={cat}
              selectedUsers={selectedUsers}
              sharingMatrix={sharingMatrix}
              isSaving={isSaving}
              onToggleCell={toggleCell}
              onToggleRowAll={toggleRowAll}
            />
          ))}
        </div>
      );
    }

    // ─── DESKTOP: Matrix table view ───
    return (
      <div style={{ padding: 16 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: 12,
            background: t.bgCard,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: t.shadowSm,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: "12px 14px",
                  background: t.navBg,
                  color: t.navText,
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  minWidth: 240,
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ClipboardList size={13} />
                  Category
                </div>
              </th>
              {selectedUsers.map((user) => {
                const columnCheckedCount = filteredCategories.filter((cat) =>
                  sharingMatrix[cat.id]?.has(user.userId.toLowerCase()),
                ).length;
                const allChecked =
                  columnCheckedCount === filteredCategories.length;

                return (
                  <th
                    key={user.userId}
                    style={{
                      padding: "10px 8px",
                      background: t.navBg,
                      color: t.navText,
                      fontSize: 10,
                      fontWeight: 600,
                      minWidth: 130,
                      textAlign: "center",
                      borderLeft: "1px solid rgba(255,255,255,0.1)",
                      verticalAlign: "top",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${t.primary}, ${t.primaryHover})`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        }}
                      >
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <div
                        title={user.userName}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          maxWidth: 110,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.userName}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          opacity: 0.7,
                          maxWidth: 110,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 400,
                        }}
                      >
                        {user.department}
                      </div>
                      <div
                        style={{
                          padding: "1px 7px",
                          background:
                            columnCheckedCount === 0
                              ? "rgba(255,255,255,0.1)"
                              : allChecked
                                ? "rgba(134,239,172,0.25)"
                                : "rgba(147,197,253,0.25)",
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                          border: `1px solid ${
                            columnCheckedCount === 0
                              ? "rgba(255,255,255,0.2)"
                              : allChecked
                                ? "rgba(134,239,172,0.5)"
                                : "rgba(147,197,253,0.5)"
                          }`,
                        }}
                      >
                        {columnCheckedCount}/{filteredCategories.length}
                      </div>
                      <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
                        <button
                          onClick={() => toggleColumnAll(user.userId)}
                          disabled={isSaving}
                          title={allChecked ? "Deselect all" : "Select all"}
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            background: allChecked
                              ? "rgba(220,38,38,0.25)"
                              : "rgba(255,255,255,0.15)",
                            border: `1px solid ${
                              allChecked
                                ? "rgba(252,165,165,0.5)"
                                : "rgba(255,255,255,0.3)"
                            }`,
                            borderRadius: 4,
                            color: t.navText,
                            cursor: isSaving ? "not-allowed" : "pointer",
                            fontFamily: "Sora,sans-serif",
                            fontWeight: 600,
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          {allChecked ? "None" : "All"}
                        </button>
                        <button
                          onClick={() => removeUserFromMatrix(user.userId)}
                          disabled={isSaving}
                          title="Remove from matrix"
                          style={{
                            width: 20,
                            height: 20,
                            padding: 0,
                            background: "rgba(220,38,38,0.25)",
                            border: "1px solid rgba(252,165,165,0.5)",
                            borderRadius: 4,
                            color: t.navText,
                            cursor: isSaving ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat, idx) => {
              const rowSharedCount = sharingMatrix[cat.id]?.size || 0;
              const isShared = rowSharedCount > 0;
              return (
                <tr
                  key={cat.id}
                  style={{ background: idx % 2 === 0 ? t.bgCard : t.bgSubtle }}
                >
                  <td
                    style={{
                      padding: "12px 14px",
                      fontWeight: 600,
                      color: t.textPrimary,
                      borderBottom: `1px solid ${t.borderSubtle}`,
                      borderRight: `2px solid ${t.border}`,
                      position: "sticky",
                      left: 0,
                      background: idx % 2 === 0 ? t.bgCard : t.bgSubtle,
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 24,
                          background: isShared ? t.success : t.borderStrong,
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: t.textPrimary }}>
                          {cat.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: isShared ? t.success : t.textFaint,
                            marginTop: 2,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          {isShared ? (
                            <>
                              <UserCheck size={9} />
                              Shared with {rowSharedCount} user
                              {rowSharedCount !== 1 ? "s" : ""}
                            </>
                          ) : (
                            <>
                              <UserX size={9} />
                              Not shared
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleRowAll(cat.id)}
                        disabled={isSaving}
                        style={{
                          fontSize: 9,
                          padding: "3px 8px",
                          background:
                            rowSharedCount === selectedUsers.length
                              ? t.dangerBgSubtle
                              : t.bgMuted,
                          border: `1px solid ${
                            rowSharedCount === selectedUsers.length
                              ? t.dangerBorder
                              : t.borderStrong
                          }`,
                          borderRadius: 4,
                          color:
                            rowSharedCount === selectedUsers.length
                              ? t.danger
                              : t.textSecondary,
                          cursor: isSaving ? "not-allowed" : "pointer",
                          fontFamily: "Sora,sans-serif",
                          fontWeight: 600,
                          flexShrink: 0,
                          opacity: isSaving ? 0.5 : 1,
                        }}
                      >
                        {rowSharedCount === selectedUsers.length
                          ? "None"
                          : "All"}
                      </button>
                    </div>
                  </td>
                  {selectedUsers.map((user) => {
                    const checked = sharingMatrix[cat.id]?.has(
                      user.userId.toLowerCase(),
                    );
                    return (
                      <td
                        key={user.userId}
                        onClick={() =>
                          !isSaving && toggleCell(cat.id, user.userId)
                        }
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: `1px solid ${t.borderSubtle}`,
                          borderLeft: `1px solid ${t.borderSubtle}`,
                          cursor: isSaving ? "not-allowed" : "pointer",
                          background: checked
                            ? t.primaryBgSubtle
                            : "transparent",
                          opacity: isSaving ? 0.6 : 1,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: `2px solid ${checked ? t.primary : t.borderStrong}`,
                            background: checked ? t.primary : t.bgCard,
                            alignItems: "center",
                            justifyContent: "center",
                            color: t.textInverse,
                            transition: "all .12s",
                            boxShadow: checked ? t.shadowSm : "none",
                          }}
                        >
                          {checked && <Check size={14} strokeWidth={3.5} />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: t.infoBg,
            border: `1px solid ${t.infoBorder}`,
            borderRadius: 8,
            fontSize: 11,
            color: t.info,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Info size={12} />
          <span>
            Click any cell to toggle sharing. Use <strong>All/None</strong>{" "}
            buttons to bulk-toggle rows or columns.
          </span>
        </div>
      </div>
    );
  };

  // ─── Footer buttons (shared) ───
  const footerButtons = (
    <>
      <button
        onClick={onClose}
        disabled={isSaving}
        style={{
          ...btnStyle,
          flex: isMobile ? 1 : "initial",
          opacity: isSaving ? 0.6 : 1,
          cursor: isSaving ? "not-allowed" : "pointer",
        }}
      >
        <X size={13} /> Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        style={{
          ...btnStyle,
          flex: isMobile ? 1.3 : "initial",
          background: hasChanges && !isSaving ? t.primary : t.bgMuted,
          color: hasChanges && !isSaving ? t.textInverse : t.textFaint,
          borderColor: hasChanges && !isSaving ? t.primary : t.border,
          cursor: hasChanges && !isSaving ? "pointer" : "not-allowed",
          fontWeight: 600,
        }}
      >
        {isSaving ? (
          <>
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Saving...
          </>
        ) : (
          <>
            <Save size={13} /> Save {isMobile ? "" : "All Changes"}
          </>
        )}
      </button>
    </>
  );

  // ══════════════════════════════════════════════════════
  //   MOBILE — Bottom Sheet
  // ══════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <BottomSheet
        open={true}
        onClose={onClose}
        title="Manage Sharing"
        height="full"
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Subtitle bar */}
          <div
            style={{
              padding: "10px 14px",
              background: `linear-gradient(135deg, ${t.violetBg} 0%, ${t.bgSubtle} 100%)`,
              borderBottom: `1px solid ${t.border}`,
              fontSize: 11.5,
              color: t.violet,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <Grid3x3 size={13} />
            <span style={{ fontWeight: 700 }}>
              {categories.length} categories · {selectedUsers.length} users
            </span>
            {hasChanges && !isSaving && (
              <span
                style={{
                  marginLeft: "auto",
                  padding: "2px 8px",
                  background: t.warningBg,
                  color: t.warning,
                  border: `1px solid ${t.warningBorder}`,
                  borderRadius: 999,
                  fontSize: 9.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Unsaved
              </span>
            )}
          </div>

          {/* Stats mini bar */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "8px 14px",
              background: t.bgSubtle,
              borderBottom: `1px solid ${t.border}`,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {[
              {
                label: "Shared",
                value: `${stats.sharedCategories}/${categories.length}`,
                color: t.success,
                bg: t.successBg,
              },
              {
                label: "Grants",
                value: stats.checkedCells,
                color: t.info,
                bg: t.infoBg,
              },
            ].map((s) => (
              <span
                key={s.label}
                style={{
                  padding: "4px 10px",
                  background: s.bg,
                  color: s.color,
                  border: `1px solid ${t.border}`,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}: <strong>{s.value}</strong>
              </span>
            ))}
          </div>

          {/* Users chips bar */}
          <MobileUsersChips
            selectedUsers={selectedUsers}
            onRemove={removeUserFromMatrix}
            isSaving={isSaving}
          />

          {/* Toolbar */}
          {toolbarContent}

          {/* Add User Panel */}
          {showAddUser && (
            <AddUserPanel
              availableUsers={availableUsersToAdd}
              onAdd={addUserToMatrix}
              onClose={() => setShowAddUser(false)}
              isLoading={isLoadingUsers}
              error={usersError}
              onRetry={loadUsers}
              isMobile={isMobile}
            />
          )}

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", background: t.bgApp }}>
            {renderBodyContent()}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${t.border}`,
              display: "flex",
              gap: 8,
              background: t.bgSubtle,
            }}
          >
            {footerButtons}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ══════════════════════════════════════════════════════
  //   DESKTOP — Original modal (unchanged structure)
  // ══════════════════════════════════════════════════════
  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "Sora,sans-serif",
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 1100,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
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
            background: `linear-gradient(135deg, ${t.violetBg} 0%, ${t.bgSubtle} 100%)`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: t.violet,
              color: t.textInverse,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: t.shadowSm,
            }}
          >
            <Grid3x3 size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: t.textPrimary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Manage Category Sharing
              {hasChanges && !isSaving && (
                <span
                  style={{
                    padding: "2px 8px",
                    background: t.warningBg,
                    color: t.warning,
                    border: `1px solid ${t.warningBorder}`,
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Unsaved
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 3 }}>
              Bulk manage access across all categories and users
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: t.bgCard,
              border: `1px solid ${t.violetBorder}`,
              cursor: isSaving ? "not-allowed" : "pointer",
              color: t.violet,
              padding: 6,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Stats Bar */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 20px",
            background: t.bgSubtle,
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
          }}
        >
          {[
            {
              label: "Categories",
              value: categories.length,
              icon: Grid3x3,
              color: t.violet,
              bg: t.violetBg,
            },
            {
              label: "Users",
              value: selectedUsers.length,
              icon: Users,
              color: t.primary,
              bg: t.primaryBg,
            },
            {
              label: "Shared",
              value: `${stats.sharedCategories}/${categories.length}`,
              icon: UserCheck,
              color: t.success,
              bg: t.successBg,
            },
            {
              label: "Access Grants",
              value: stats.checkedCells,
              icon: Check,
              color: t.info,
              bg: t.infoBg,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: s.bg,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.icon size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: t.textPrimary,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        {toolbarContent}

        {/* Add User Panel */}
        {showAddUser && (
          <AddUserPanel
            availableUsers={availableUsersToAdd}
            onAdd={addUserToMatrix}
            onClose={() => setShowAddUser(false)}
            isLoading={isLoadingUsers}
            error={usersError}
            onRetry={loadUsers}
            isMobile={false}
          />
        )}

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", background: t.bgSubtle }}>
          {renderBodyContent()}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: t.textMuted,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{
                    animation: "spin 1s linear infinite",
                    color: t.primary,
                  }}
                />
                <span style={{ color: t.primary, fontWeight: 600 }}>
                  Saving changes...
                </span>
              </>
            ) : hasChanges ? (
              <>
                <AlertTriangle size={13} color={t.warning} />
                <span style={{ color: t.warning, fontWeight: 600 }}>
                  You have unsaved changes
                </span>
              </>
            ) : (
              <>
                <Check size={13} color={t.success} />
                <span>All changes saved</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>{footerButtons}</div>
        </div>
      </div>
    </div>
  );
}
