import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Search,
  Users,
  Check,
  UserPlus,
  Trash2,
  Building2,
  Briefcase,
  AlertTriangle,
  Loader2,
  UserX,
  Share2,
  Info,
} from "lucide-react";
import * as sharingApi from "./sharingApi";
import { getUsersCached } from "./sharingApi";
import { timeAgo } from "./updatesHelpers";

/* ─── Shared Styles ─── */
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
  transition: "all .12s",
};

const inputStyle = {
  width: "100%",
  height: 36,
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

/* ─── User Avatar ─── */
function UserAvatar({ user, size = 36, selected = false, owner = false }) {
  const bgColor = owner
    ? "linear-gradient(135deg, #DC2626, #B91C1C)"
    : selected
      ? "linear-gradient(135deg, #1D4ED8, #1E40AF)"
      : "linear-gradient(135deg, #DBEAFE, #BFDBFE)";
  const textColor = owner || selected ? "#fff" : "#1D4ED8";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bgColor,
        color: textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
        boxShadow: selected || owner ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
      }}
    >
      {(user?.userName || "?").charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Currently Shared User Row ─── */
function SharedUserRow({ user, onRemove, isRemoving }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: "linear-gradient(90deg, #F0FDF4 0%, #FFFFFF 100%)",
        border: "1px solid #86EFAC",
        borderRadius: 8,
        transition: "all .15s",
        opacity: isRemoving ? 0.5 : 1,
      }}
    >
      <UserAvatar user={user} size={38} selected={true} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            color: "#0F172A",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {user.userName}
          <span
            style={{
              padding: "1px 6px",
              background: "#DCFCE7",
              color: "#15803D",
              border: "1px solid #86EFAC",
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            ✓ Access
          </span>
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "#64748B",
            fontFamily: "'JetBrains Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {user.userId}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 4,
            fontSize: 10,
            color: "#94A3B8",
          }}
        >
          {user.department && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Building2 size={10} />
              {user.department}
            </span>
          )}
          {user.designation && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Briefcase size={10} />
              {user.designation}
            </span>
          )}
          {user.sharedAt && (
            <span
              style={{
                fontStyle: "italic",
                color: "#15803D",
                marginLeft: "auto",
              }}
            >
              Shared {timeAgo(user.sharedAt)}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => !isRemoving && onRemove(user.userId)}
        disabled={isRemoving}
        title="Remove access"
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          border: "1px solid #FCA5A5",
          background: "#FEF2F2",
          color: "#DC2626",
          cursor: isRemoving ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
          opacity: isRemoving ? 0.5 : 1,
        }}
      >
        {isRemoving ? (
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <X size={14} />
        )}
      </button>
    </div>
  );
}

/* ─── Available User Card ─── */
function AvailableUserCard({ user, isSelected, onToggle }) {
  return (
    <div
      onClick={() => onToggle(user)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 11px",
        borderRadius: 8,
        border: `1.5px solid ${isSelected ? "#93C5FD" : "#E2E8F0"}`,
        background: isSelected ? "#F0F9FF" : "#fff",
        cursor: "pointer",
        transition: "all .12s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "#F8FAFC";
          e.currentTarget.style.borderColor = "#CBD5E1";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "#E2E8F0";
        }
      }}
    >
      <UserAvatar user={user} size={34} selected={isSelected} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: isSelected ? 700 : 600,
            fontSize: 12,
            color: "#0F172A",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.userName}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#64748B",
            fontFamily: "'JetBrains Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
        >
          {user.userId}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 3,
            fontSize: 9.5,
            color: "#94A3B8",
          }}
        >
          {user.department && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Building2 size={9} />
              {user.department}
            </span>
          )}
          {user.designation && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Briefcase size={9} />
              {user.designation}
            </span>
          )}
        </div>
      </div>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${isSelected ? "#1D4ED8" : "#CBD5E1"}`,
          background: isSelected ? "#1D4ED8" : "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#fff",
          transition: "all .12s",
          boxShadow: isSelected ? "0 2px 4px rgba(29,78,216,0.25)" : "none",
        }}
      >
        {isSelected && <Check size={12} strokeWidth={3.5} />}
      </span>
    </div>
  );
}

/* ─── Loading State ─── */
function LoadingUsers() {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "#64748B",
      }}
    >
      <Loader2
        size={28}
        style={{
          animation: "spin 1s linear infinite",
          color: "#1D4ED8",
          marginBottom: 10,
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 500 }}>Loading users...</div>
    </div>
  );
}

/* ─── Error State ─── */
function ErrorUsers({ error, onRetry }) {
  return (
    <div
      style={{
        padding: 20,
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: 10,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#FEE2E2",
          color: "#DC2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#DC2626", fontSize: 12.5 }}>
          Failed to load users
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#7F1D1D",
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          {error?.userMessage || error?.message || "Unknown error"}
        </div>
        <button
          onClick={onRetry}
          style={{
            ...btnStyle,
            background: "#DC2626",
            color: "#fff",
            borderColor: "#DC2626",
            height: 28,
            fontSize: 11,
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Share Modal
   ═══════════════════════════════════════════════════════ */
export default function ShareModal({
  category,
  currentUserId,
  isSaving = false,
  onClose,
  onSave,
}) {
  // Selected user IDs
  const [selectedUserIds, setSelectedUserIds] = useState(
    () =>
      new Set((category?.sharedWith || []).map((u) => u.userId.toLowerCase())),
  );
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const searchRef = useRef();
  const mountedRef = useRef(true);

  // Users API state
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  /* ─── Load users from API ─── */
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

  /* ─── Currently shared users (with metadata) ─── */
  const alreadySharedUsers = useMemo(() => {
    return (category?.sharedWith || []).map((s) => {
      const user = allUsers.find(
        (u) => u.userId.toLowerCase() === s.userId.toLowerCase(),
      );
      return {
        userId: s.userId,
        userName: s.userName || user?.userName || s.userId,
        department: user?.department || "",
        designation: user?.designation || "",
        sharedAt: s.sharedAt,
        active: user?.active !== false,
      };
    });
  }, [category?.sharedWith, allUsers]);

  /* ─── Available departments for filter ─── */
  const departments = useMemo(() => {
    const set = new Set(allUsers.map((u) => u.department).filter(Boolean));
    return Array.from(set).sort();
  }, [allUsers]);

  /* ─── Available users (excluding self and filtered) ─── */
  const availableUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allUsers.filter((u) => {
      if (!u.active) return false;
      if (u.userId.toLowerCase() === currentUserId.toLowerCase()) return false;
      if (selectedDept && u.department !== selectedDept) return false;
      if (!q) return true;
      return (
        u.userName.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q) ||
        (u.designation || "").toLowerCase().includes(q)
      );
    });
  }, [allUsers, search, selectedDept, currentUserId]);

  /* ─── Group available users by department ─── */
  const groupedUsers = useMemo(() => {
    const groups = {};
    availableUsers.forEach((u) => {
      const dept = u.department || "Other";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(u);
    });
    // Sort departments alphabetically
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [availableUsers]);

  /* ─── Actions ─── */
  const toggleUser = (user) => {
    if (isSaving) return;
    const uid = user.userId.toLowerCase();
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const removeUser = (userId) => {
    if (isSaving) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.delete(userId.toLowerCase());
      return next;
    });
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const existingMap = new Map(
      (category?.sharedWith || []).map((s) => [s.userId.toLowerCase(), s]),
    );

    const newSharedWith = Array.from(selectedUserIds)
      .map((uid) => {
        const user = allUsers.find((u) => u.userId.toLowerCase() === uid);
        if (!user) return null;
        const existing = existingMap.get(uid);
        return {
          userId: user.userId,
          userName: user.userName,
          sharedAt: existing?.sharedAt || now,
          sharedBy: existing?.sharedBy || currentUserId,
        };
      })
      .filter(Boolean);

    onSave(newSharedWith);
  };

  const selectedCount = selectedUserIds.size;
  const originalCount = (category?.sharedWith || []).length;

  /* ─── Check if changes exist ─── */
  const hasChanges = useMemo(() => {
    if (selectedCount !== originalCount) return true;
    const originalIds = new Set(
      (category?.sharedWith || []).map((s) => s.userId.toLowerCase()),
    );
    for (const id of selectedUserIds) {
      if (!originalIds.has(id)) return true;
    }
    return false;
  }, [selectedUserIds, category?.sharedWith, selectedCount, originalCount]);

  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
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
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 600,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "linear-gradient(135deg, #F0F9FF 0%, #DBEAFE 100%)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: "#1D4ED8",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(29,78,216,0.3)",
            }}
          >
            <Share2 size={20} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Share Category
              {hasChanges && !isSaving && (
                <span
                  style={{
                    padding: "2px 8px",
                    background: "#FEF3C7",
                    color: "#B45309",
                    border: "1px solid #FCD34D",
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
            <div
              style={{
                fontSize: 12,
                color: "#475569",
                marginTop: 3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <strong>{category?.name}</strong> • {selectedCount} user
              {selectedCount !== 1 ? "s" : ""} selected
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid #BFDBFE",
              cursor: isSaving ? "not-allowed" : "pointer",
              color: "#1D4ED8",
              padding: 7,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Loading state */}
          {isLoadingUsers && <LoadingUsers />}

          {/* Error state */}
          {usersError && !isLoadingUsers && (
            <ErrorUsers error={usersError} onRetry={loadUsers} />
          )}

          {/* Main content */}
          {!isLoadingUsers && !usersError && (
            <>
              {/* Currently Shared Section */}
              {alreadySharedUsers.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    <Users size={14} color="#15803D" />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#0F172A",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Currently Shared
                    </span>
                    <span
                      style={{
                        padding: "1px 8px",
                        background: "#DCFCE7",
                        color: "#15803D",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {alreadySharedUsers.length}
                    </span>
                  </div>
                  {false && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {alreadySharedUsers.map((user) => (
                        <SharedUserRow
                          key={user.userId}
                          user={user}
                          onRemove={removeUser}
                          isRemoving={
                            !selectedUserIds.has(user.userId.toLowerCase())
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add People Section */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <UserPlus size={14} color="#1D4ED8" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0F172A",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Add People
                  </span>
                </div>

                {/* Search + Department Filter */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ position: "relative", flex: 1 }}>
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
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, email, designation..."
                      style={{ ...inputStyle, paddingLeft: 32 }}
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
                          color: "#94A3B8",
                          padding: 2,
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {departments.length > 0 && (
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 150,
                        cursor: "pointer",
                        background: selectedDept ? "#EFF6FF" : "#fff",
                        color: selectedDept ? "#1D4ED8" : "#0F172A",
                        borderColor: selectedDept ? "#93C5FD" : "#CBD5E1",
                        fontWeight: selectedDept ? 600 : 400,
                      }}
                    >
                      <option value="">All departments</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Results count */}
                {availableUsers.length > 0 && (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#64748B",
                      marginBottom: 8,
                    }}
                  >
                    {availableUsers.length} user
                    {availableUsers.length !== 1 ? "s" : ""} available
                    {(search || selectedDept) &&
                      ` (filtered from ${allUsers.length - 1})`}
                  </div>
                )}

                {/* User list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 340,
                    overflowY: "auto",
                    padding: "2px",
                  }}
                >
                  {availableUsers.length === 0 ? (
                    <div
                      style={{
                        padding: 30,
                        textAlign: "center",
                        color: "#94A3B8",
                        fontSize: 12,
                        background: "#FAFBFC",
                        borderRadius: 8,
                        border: "1px dashed #E2E8F0",
                      }}
                    >
                      <UserX
                        size={26}
                        strokeWidth={1.5}
                        style={{ marginBottom: 8, opacity: 0.5 }}
                      />
                      <div>
                        {search || selectedDept
                          ? "No users match your filters"
                          : "No users available"}
                      </div>
                    </div>
                  ) : (
                    Object.entries(groupedUsers).map(([dept, users]) => (
                      <div key={dept}>
                        <div
                          style={{
                            padding: "4px 10px",
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: "#64748B",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginBottom: 4,
                            marginTop: 6,
                          }}
                        >
                          <Building2 size={10} />
                          {dept}
                          <span
                            style={{
                              color: "#94A3B8",
                              fontWeight: 500,
                            }}
                          >
                            · {users.length}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                          }}
                        >
                          {users.map((user) => (
                            <AvailableUserCard
                              key={user.userId}
                              user={user}
                              isSelected={selectedUserIds.has(
                                user.userId.toLowerCase(),
                              )}
                              onToggle={toggleUser}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            background: "#FAFBFC",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Info size={12} />
            {selectedCount === 0
              ? "Only you will have access"
              : `${selectedCount} user${selectedCount !== 1 ? "s" : ""} will have edit access`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                ...btnStyle,
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
                background: hasChanges && !isSaving ? "#1D4ED8" : "#F1F5F9",
                color: hasChanges && !isSaving ? "#fff" : "#94A3B8",
                borderColor: hasChanges && !isSaving ? "#1D4ED8" : "#E2E8F0",
                cursor: hasChanges && !isSaving ? "pointer" : "not-allowed",
                boxShadow:
                  hasChanges && !isSaving
                    ? "0 2px 6px rgba(29,78,216,0.25)"
                    : "none",
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
                  <Check size={13} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
