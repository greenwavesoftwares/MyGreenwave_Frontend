import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Search,
  Users,
  Check,
  UserPlus,
  Building2,
  Briefcase,
  AlertTriangle,
  Loader2,
  UserX,
  Crown,
  Handshake,
  Info,
} from "lucide-react";
import { timeAgoShort } from "./coAssignerHelpers";

const btnStyle = {
  height: 34,
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

/* ═══════════════════════════════════════════════════════
   User Avatar
   ═══════════════════════════════════════════════════════ */
function Avatar({ name, size = 36, variant = "default" }) {
  const gradients = {
    owner: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    "co-assigner": "linear-gradient(135deg, #15803D, #166534)",
    default: "linear-gradient(135deg, #64748B, #475569)",
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: gradients[variant] || gradients.default,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Person Row (Owner + Co-Assigners)
   ═══════════════════════════════════════════════════════ */
function PersonRow({
  user,
  variant, // "owner" | "co-assigner"
  isCurrentUser,
  canRemove,
  isRemoving,
  onRemove,
  addedAt,
}) {
  const isOwner = variant === "owner";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: isOwner ? "#FAFAF9" : "#F0FDF4",
        border: `1px solid ${isOwner ? "#E7E5E4" : "#86EFAC"}`,
        borderRadius: 8,
        transition: "all .12s",
        opacity: isRemoving ? 0.5 : 1,
      }}
    >
      <Avatar name={user.userName} size={38} variant={variant} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#0F172A",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.userName}
          </span>
          {isCurrentUser && (
            <span
              style={{
                fontSize: 10,
                color: isOwner ? "#7C3AED" : "#15803D",
                fontWeight: 600,
                fontStyle: "italic",
              }}
            >
              (You)
            </span>
          )}
          <span
            style={{
              padding: "2px 7px",
              background: isOwner ? "#EDE9FE" : "#DCFCE7",
              color: isOwner ? "#7C3AED" : "#15803D",
              border: `1px solid ${isOwner ? "#C4B5FD" : "#86EFAC"}`,
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {isOwner ? <Crown size={9} /> : <Handshake size={9} />}
            {isOwner ? "Owner" : "Co-Assigner"}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            fontFamily: "'JetBrains Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.userId}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 4,
            fontSize: 10,
            color: "#94A3B8",
            flexWrap: "wrap",
          }}
        >
          {user.department && (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              <Building2 size={10} />
              {user.department}
            </span>
          )}
          {user.designation && (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              <Briefcase size={10} />
              {user.designation}
            </span>
          )}
          {addedAt && (
            <span
              style={{
                color: "#15803D",
                fontStyle: "italic",
                marginLeft: "auto",
              }}
            >
              Added {timeAgoShort(addedAt)}
            </span>
          )}
        </div>
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(user.userId)}
          disabled={isRemoving}
          title={isRemoving ? "Removing..." : "Remove co-assigner"}
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            border: "1px solid #FCA5A5",
            background: "#FEF2F2",
            color: "#DC2626",
            cursor: isRemoving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0,
            transition: "all .12s",
            opacity: isRemoving ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRemoving) {
              e.currentTarget.style.background = "#FEE2E2";
              e.currentTarget.style.borderColor = "#EF4444";
            }
          }}
          onMouseLeave={(e) => {
            if (!isRemoving) {
              e.currentTarget.style.background = "#FEF2F2";
              e.currentTarget.style.borderColor = "#FCA5A5";
            }
          }}
        >
          {isRemoving ? (
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <X size={14} />
          )}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Available User Item (for the add list)
   ═══════════════════════════════════════════════════════ */
function AvailableUserItem({ user, isAdding, onAdd }) {
  return (
    <div
      onClick={() => !isAdding && onAdd(user)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 7,
        border: "1px solid #E2E8F0",
        background: isAdding ? "#F0FDF4" : "#fff",
        cursor: isAdding ? "wait" : "pointer",
        transition: "all .12s",
        opacity: isAdding ? 0.75 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isAdding) {
          e.currentTarget.style.background = "#F0FDF4";
          e.currentTarget.style.borderColor = "#86EFAC";
        }
      }}
      onMouseLeave={(e) => {
        if (!isAdding) {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "#E2E8F0";
        }
      }}
    >
      <Avatar name={user.userName} size={32} variant="default" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
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
            gap: 6,
            marginTop: 3,
            fontSize: 9.5,
            color: "#94A3B8",
          }}
        >
          {user.department && (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              <Building2 size={9} />
              {user.department}
            </span>
          )}
          {user.designation && (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              <Briefcase size={9} />
              {user.designation}
            </span>
          )}
        </div>
      </div>
      <button
        disabled={isAdding}
        style={{
          padding: "5px 10px",
          background: isAdding ? "#86EFAC" : "#15803D",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          fontSize: 10.5,
          fontWeight: 600,
          cursor: isAdding ? "wait" : "pointer",
          fontFamily: "Sora,sans-serif",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
          minWidth: 60,
          justifyContent: "center",
        }}
      >
        {isAdding ? (
          <>
            <Loader2
              size={11}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Adding
          </>
        ) : (
          <>
            <UserPlus size={11} />
            Add
          </>
        )}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════════════════ */
function LoadingUsers() {
  return (
    <div
      style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}
    >
      <Loader2
        size={26}
        style={{
          animation: "spin 1s linear infinite",
          color: "#15803D",
          marginBottom: 10,
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 500 }}>Loading users...</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════════════ */
function ErrorState({ error, onRetry }) {
  return (
    <div
      style={{
        padding: 16,
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: 8,
        display: "flex",
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
      <div style={{ flex: 1 }}>
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
          {error?.userMessage || error?.message || "Unknown error occurred"}
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
   MAIN CO-ASSIGNER MODAL
   ═══════════════════════════════════════════════════════ */
export default function CoAssignerModal({
  project,
  currentUserId,
  currentUserRole,
  allUsers = [],
  isLoadingUsers = false,
  usersError = null,
  onRetryLoadUsers,
  onClose,
  onAddCoAssigner, // Async function: (user) => Promise
  onRemoveCoAssigner, // Async function: (userId) => Promise
}) {
  const isReadOnly = currentUserRole !== "owner";

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const searchRef = useRef();

  // Track in-flight operations per user
  const [addingUserIds, setAddingUserIds] = useState(new Set());
  const [removingUserIds, setRemovingUserIds] = useState(new Set());

  useEffect(() => {
    if (!isReadOnly) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isReadOnly]);

  // Current co-assigners (from project prop — live data)
  const currentCoAssigners = project?.coAssigners || [];

  /* ─── Owner info ─── */
  const owner = useMemo(() => {
    const found = allUsers.find(
      (u) => u.userId?.toLowerCase() === project.createdBy?.toLowerCase(),
    );
    return (
      found || {
        userId: project.createdBy || "unknown",
        userName: project.createdBy || "Unknown",
        department: "",
        designation: "",
      }
    );
  }, [allUsers, project.createdBy]);

  /* ─── Enriched co-assigners (with department/designation) ─── */
  const enrichedCoAssigners = useMemo(() => {
    return currentCoAssigners.map((ca) => {
      const userInfo = allUsers.find(
        (u) => u.userId?.toLowerCase() === ca.userId?.toLowerCase(),
      );
      return {
        userId: ca.userId,
        userName: ca.userName || userInfo?.userName || ca.userId,
        department: userInfo?.department || "",
        designation: userInfo?.designation || "",
        addedAt: ca.addedAt,
        addedBy: ca.addedBy,
      };
    });
  }, [currentCoAssigners, allUsers]);

  /* ─── Departments for filter dropdown ─── */
  const departments = useMemo(() => {
    const set = new Set(allUsers.map((u) => u.department).filter(Boolean));
    return Array.from(set).sort();
  }, [allUsers]);

  /* ─── Set of selected user IDs for quick lookup ─── */
  const selectedUserIds = useMemo(() => {
    return new Set(currentCoAssigners.map((ca) => ca.userId.toLowerCase()));
  }, [currentCoAssigners]);

  /* ─── Available users to add ─── */
  const availableUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allUsers.filter((u) => {
      if (!u.active) return false;
      if (u.userId?.toLowerCase() === project.createdBy?.toLowerCase())
        return false;
      if (selectedUserIds.has(u.userId?.toLowerCase())) return false;
      if (selectedDept && u.department !== selectedDept) return false;
      if (!q) return true;
      return (
        u.userName?.toLowerCase().includes(q) ||
        u.userId?.toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q) ||
        (u.designation || "").toLowerCase().includes(q)
      );
    });
  }, [allUsers, project.createdBy, selectedUserIds, search, selectedDept]);

  /* ─── Group available users by department ─── */
  const groupedAvailable = useMemo(() => {
    const groups = {};
    availableUsers.forEach((u) => {
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
  }, [availableUsers]);

  /* ─── Actions ─── */
  const handleAddUser = async (user) => {
    if (isReadOnly) return;
    const uid = user.userId.toLowerCase();

    // Mark as being added
    setAddingUserIds((prev) => new Set([...prev, uid]));

    try {
      await onAddCoAssigner(user);
      // Parent will update project.coAssigners, which will re-render the modal
    } catch (err) {
      console.error("Failed to add co-assigner:", err);
      // Error toast handled by parent
    } finally {
      setAddingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }
  };

  const handleRemoveUser = async (userId) => {
    if (isReadOnly) return;
    const uid = userId.toLowerCase();

    setRemovingUserIds((prev) => new Set([...prev, uid]));

    try {
      await onRemoveCoAssigner(userId);
    } catch (err) {
      console.error("Failed to remove co-assigner:", err);
    } finally {
      setRemovingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }
  };

  const totalPeople = 1 + currentCoAssigners.length;
  const isAnyOperationInProgress =
    addingUserIds.size > 0 || removingUserIds.size > 0;

  return (
    <div
      onClick={(e) =>
        !isAnyOperationInProgress && e.target === e.currentTarget && onClose()
      }
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
          maxWidth: 640,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* ══════ HEADER ══════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "#15803D",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(21,128,61,0.3)",
              flexShrink: 0,
            }}
          >
            <Handshake size={20} strokeWidth={2} />
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
              {isReadOnly ? "Co-Assigners" : "Manage Co-Assigners"}
              {isReadOnly && (
                <span
                  style={{
                    padding: "2px 8px",
                    background: "#F1F5F9",
                    color: "#64748B",
                    border: "1px solid #CBD5E1",
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  View Only
                </span>
              )}
              {isAnyOperationInProgress && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    background: "#DBEAFE",
                    color: "#1D4ED8",
                    border: "1px solid #93C5FD",
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Loader2
                    size={10}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving
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
              <strong>{project?.project || "Untitled"}</strong> • {totalPeople}{" "}
              people
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid #86EFAC",
              cursor: "pointer",
              color: "#15803D",
              padding: 7,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ══════ INFO BANNER ══════ */}
        <div
          style={{
            padding: "10px 20px",
            background: isReadOnly ? "#F1F5F9" : "#F0FDF4",
            borderBottom: "1px solid #E2E8F0",
            fontSize: 11.5,
            color: isReadOnly ? "#475569" : "#166534",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          {isReadOnly ? (
            <span>
              You can view all co-assigners, but only the project owner can add
              or remove them.
            </span>
          ) : (
            <span>
              Changes are saved <strong>automatically</strong> when you add or
              remove co-assigners.
            </span>
          )}
        </div>

        {/* ══════ BODY ══════ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* ─── PROJECT TEAM LIST ─── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <Users size={13} color="#0F172A" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0F172A",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Project Team ({totalPeople})
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Owner */}
              <PersonRow
                user={owner}
                variant="owner"
                isCurrentUser={
                  owner.userId?.toLowerCase() === currentUserId?.toLowerCase()
                }
                canRemove={false}
              />

              {/* Co-Assigners */}
              {enrichedCoAssigners.length > 0 ? (
                enrichedCoAssigners.map((ca) => (
                  <PersonRow
                    key={ca.userId}
                    user={ca}
                    variant="co-assigner"
                    isCurrentUser={
                      ca.userId.toLowerCase() === currentUserId?.toLowerCase()
                    }
                    canRemove={!isReadOnly}
                    isRemoving={removingUserIds.has(ca.userId.toLowerCase())}
                    onRemove={handleRemoveUser}
                    addedAt={ca.addedAt}
                  />
                ))
              ) : (
                <div
                  style={{
                    padding: "20px 16px",
                    background: "#FAFBFC",
                    border: "1px dashed #CBD5E1",
                    borderRadius: 8,
                    textAlign: "center",
                    color: "#94A3B8",
                    fontSize: 11.5,
                  }}
                >
                  <Handshake
                    size={22}
                    strokeWidth={1.5}
                    style={{ marginBottom: 6, opacity: 0.6 }}
                  />
                  <div style={{ fontWeight: 600, color: "#64748B" }}>
                    No co-assigners yet
                  </div>
                  <div style={{ fontSize: 10.5, marginTop: 2 }}>
                    {isReadOnly
                      ? "The owner hasn't added anyone."
                      : "Add team members below to share ownership."}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── ADD PEOPLE SECTION (owner only) ─── */}
          {!isReadOnly && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <UserPlus size={13} color="#1D4ED8" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0F172A",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Add More People
                </span>
              </div>

              {isLoadingUsers && <LoadingUsers />}

              {usersError && !isLoadingUsers && (
                <ErrorState error={usersError} onRetry={onRetryLoadUsers} />
              )}

              {!isLoadingUsers && !usersError && (
                <>
                  {/* Search + Department Filter */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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
                    </div>
                  )}

                  {/* User list */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      maxHeight: 320,
                      overflowY: "auto",
                    }}
                  >
                    {availableUsers.length === 0 ? (
                      <div
                        style={{
                          padding: 24,
                          textAlign: "center",
                          color: "#94A3B8",
                          fontSize: 11.5,
                          background: "#FAFBFC",
                          borderRadius: 8,
                          border: "1px dashed #E2E8F0",
                        }}
                      >
                        <UserX
                          size={24}
                          strokeWidth={1.5}
                          style={{ marginBottom: 8, opacity: 0.5 }}
                        />
                        <div style={{ fontWeight: 600, color: "#64748B" }}>
                          {search || selectedDept
                            ? "No users match your filters"
                            : "No more users to add"}
                        </div>
                        {(search || selectedDept) && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setSelectedDept("");
                            }}
                            style={{
                              marginTop: 8,
                              padding: "5px 10px",
                              background: "#fff",
                              border: "1px solid #CBD5E1",
                              borderRadius: 5,
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: "#475569",
                              cursor: "pointer",
                              fontFamily: "Sora,sans-serif",
                            }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    ) : (
                      Object.entries(groupedAvailable).map(([dept, users]) => (
                        <div key={dept}>
                          <div
                            style={{
                              padding: "4px 8px",
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: "#64748B",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginBottom: 3,
                              marginTop: 5,
                            }}
                          >
                            <Building2 size={10} />
                            {dept}
                            <span style={{ color: "#94A3B8", fontWeight: 500 }}>
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
                              <AvailableUserItem
                                key={user.userId}
                                user={user}
                                isAdding={addingUserIds.has(
                                  user.userId.toLowerCase(),
                                )}
                                onAdd={handleAddUser}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ══════ FOOTER (Simplified — just Close button) ══════ */}
        <div
          style={{
            padding: "12px 20px",
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
            {isAnyOperationInProgress ? (
              <>
                <Loader2
                  size={12}
                  style={{
                    animation: "spin 1s linear infinite",
                    color: "#1D4ED8",
                  }}
                />
                <span style={{ color: "#1D4ED8", fontWeight: 600 }}>
                  Saving changes...
                </span>
              </>
            ) : (
              <>
                <Check size={12} color="#15803D" />
                <span>
                  {currentCoAssigners.length === 0
                    ? "Only you have ownership"
                    : `${totalPeople} people have ownership rights`}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              ...btnStyle,
              background: "#15803D",
              color: "#fff",
              borderColor: "#15803D",
              fontWeight: 600,
            }}
          >
            <Check size={13} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}
