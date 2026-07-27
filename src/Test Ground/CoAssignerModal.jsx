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
import { useTheme } from "./useTheme";
import { useResponsive } from "./useResponsive";
import BottomSheet from "./shared/BottomSheet";
/* ═══════════════════════════════════════════════════════
   User Avatar
   ═══════════════════════════════════════════════════════ */
function Avatar({ name, size = 36, variant = "default" }) {
  const { t } = useTheme();

  const gradients = {
    owner: `linear-gradient(135deg, ${t.violet}, ${t.violetBorder})`,
    "co-assigner": `linear-gradient(135deg, ${t.success}, ${t.successBorder})`,
    default: `linear-gradient(135deg, ${t.textMuted}, ${t.textSecondary})`,
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: gradients[variant] || gradients.default,
        color: t.textInverse,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
        boxShadow: t.shadowSm,
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Person Row
   ═══════════════════════════════════════════════════════ */
function PersonRow({
  user,
  variant,
  isCurrentUser,
  canRemove,
  isRemoving,
  onRemove,
  addedAt,
}) {
  const { t } = useTheme();
  const isOwner = variant === "owner";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: isOwner ? t.bgSubtle : t.successBgSubtle,
        border: `1px solid ${isOwner ? t.border : t.successBorder}`,
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
              color: t.textPrimary,
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
                color: isOwner ? t.violet : t.success,
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
              background: isOwner ? t.violetBg : t.successBg,
              color: isOwner ? t.violet : t.success,
              border: `1px solid ${isOwner ? t.violetBorder : t.successBorder}`,
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
            color: t.textMuted,
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
            color: t.textFaint,
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
                color: t.success,
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
            border: `1px solid ${t.dangerBorder}`,
            background: t.dangerBgSubtle,
            color: t.danger,
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
              e.currentTarget.style.background = t.dangerBg;
              e.currentTarget.style.borderColor = t.danger;
            }
          }}
          onMouseLeave={(e) => {
            if (!isRemoving) {
              e.currentTarget.style.background = t.dangerBgSubtle;
              e.currentTarget.style.borderColor = t.dangerBorder;
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
   Available User Item
   ═══════════════════════════════════════════════════════ */
function AvailableUserItem({ user, isAdding, onAdd }) {
  const { t } = useTheme();

  return (
    <div
      onClick={() => !isAdding && onAdd(user)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 7,
        border: `1px solid ${t.border}`,
        background: isAdding ? t.successBgSubtle : t.bgCard,
        cursor: isAdding ? "wait" : "pointer",
        transition: "all .12s",
        opacity: isAdding ? 0.75 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isAdding) {
          e.currentTarget.style.background = t.successBgSubtle;
          e.currentTarget.style.borderColor = t.successBorder;
        }
      }}
      onMouseLeave={(e) => {
        if (!isAdding) {
          e.currentTarget.style.background = t.bgCard;
          e.currentTarget.style.borderColor = t.border;
        }
      }}
    >
      <Avatar name={user.userName} size={32} variant="default" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
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
            fontSize: 10,
            color: t.textMuted,
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
            color: t.textFaint,
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
          background: isAdding ? t.successBorder : t.success,
          color: t.textInverse,
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
  const { t } = useTheme();

  return (
    <div
      style={{ padding: "40px 20px", textAlign: "center", color: t.textMuted }}
    >
      <Loader2
        size={26}
        style={{
          animation: "spin 1s linear infinite",
          color: t.success,
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
  const { t } = useTheme();

  return (
    <div
      style={{
        padding: 16,
        background: t.dangerBgSubtle,
        border: `1px solid ${t.dangerBorder}`,
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
          background: t.dangerBg,
          color: t.danger,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={16} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: t.danger, fontSize: 12.5 }}>
          Failed to load users
        </div>
        <div
          style={{
            fontSize: 11,
            color: t.dangerTextDeep,
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          {error?.userMessage || error?.message || "Unknown error occurred"}
        </div>
        <button
          onClick={onRetry}
          style={{
            height: 28,
            padding: "0 14px",
            borderRadius: 7,
            background: t.danger,
            color: t.textInverse,
            border: `1px solid ${t.danger}`,
            fontFamily: "Sora,sans-serif",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
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
  onAddCoAssigner,
  onRemoveCoAssigner,
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();
  const isReadOnly = currentUserRole !== "owner";

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const searchRef = useRef();

  const [addingUserIds, setAddingUserIds] = useState(new Set());
  const [removingUserIds, setRemovingUserIds] = useState(new Set());

  useEffect(() => {
    if (!isReadOnly) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isReadOnly]);

  const currentCoAssigners = project?.coAssigners || [];

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

  const departments = useMemo(() => {
    const set = new Set(allUsers.map((u) => u.department).filter(Boolean));
    return Array.from(set).sort();
  }, [allUsers]);

  const selectedUserIds = useMemo(() => {
    return new Set(currentCoAssigners.map((ca) => ca.userId.toLowerCase()));
  }, [currentCoAssigners]);

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

  const handleAddUser = async (user) => {
    if (isReadOnly) return;
    const uid = user.userId.toLowerCase();
    setAddingUserIds((prev) => new Set([...prev, uid]));
    try {
      await onAddCoAssigner(user);
    } catch (err) {
      console.error("Failed to add co-assigner:", err);
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

  const btnStyle = {
    height: 34,
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

  const inputStyle = {
    width: "100%",
    height: 36,
    border: `1px solid ${t.borderStrong}`,
    borderRadius: 6,
    background: t.bgInput,
    color: t.textPrimary,
    padding: "0 10px",
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    boxSizing: "border-box",
    outline: "none",
  };
  if (isMobile) {
    return (
      <BottomSheet
        open={true}
        onClose={onClose}
        title={isReadOnly ? "Co-Assigners" : "Manage Co-Assigners"}
        height="full"
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Info banner */}
          <div
            style={{
              padding: "10px 16px",
              background: isReadOnly ? t.bgMuted : t.successBgSubtle,
              borderBottom: `1px solid ${t.border}`,
              fontSize: 12,
              color: isReadOnly ? t.textSecondary : t.success,
              display: "flex",
              gap: 8,
              lineHeight: 1.5,
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {isReadOnly ? (
              <span>
                Only the project owner can add or remove co-assigners.
              </span>
            ) : (
              <span>
                Changes are saved <strong>automatically</strong>.
              </span>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {/* Project Team */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Users size={14} color={t.textPrimary} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: t.textPrimary,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Project Team ({totalPeople})
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <PersonRow
                  user={owner}
                  variant="owner"
                  isCurrentUser={
                    owner.userId?.toLowerCase() === currentUserId?.toLowerCase()
                  }
                  canRemove={false}
                />
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
                      padding: 20,
                      textAlign: "center",
                      background: t.bgSubtle,
                      borderRadius: 10,
                      color: t.textFaint,
                      fontSize: 12,
                    }}
                  >
                    <Handshake
                      size={22}
                      strokeWidth={1.5}
                      style={{ marginBottom: 6, opacity: 0.6 }}
                    />
                    <div>
                      {isReadOnly
                        ? "No co-assigners yet."
                        : "Add team members below."}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add People */}
            {!isReadOnly && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <UserPlus size={14} color={t.primary} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.textPrimary,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
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
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <div style={{ position: "relative", flex: 1 }}>
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
                          ref={searchRef}
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search users…"
                          style={{
                            ...inputStyle,
                            height: 42,
                            paddingLeft: 34,
                            fontSize: 14,
                          }}
                        />
                      </div>
                      {departments.length > 0 && (
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          style={{
                            ...inputStyle,
                            height: 42,
                            width: 130,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          <option value="">All depts</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {availableUsers.length === 0 ? (
                        <div
                          style={{
                            padding: 24,
                            textAlign: "center",
                            color: t.textFaint,
                            fontSize: 12,
                            background: t.bgSubtle,
                            borderRadius: 10,
                          }}
                        >
                          <UserX
                            size={24}
                            strokeWidth={1.5}
                            style={{ marginBottom: 8, opacity: 0.5 }}
                          />
                          <div>
                            {search || selectedDept
                              ? "No matches"
                              : "No users to add"}
                          </div>
                        </div>
                      ) : (
                        Object.entries(groupedAvailable).map(
                          ([dept, users]) => (
                            <div key={dept}>
                              <div
                                style={{
                                  padding: "6px 8px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: t.textMuted,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Building2 size={10} />
                                {dept}
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
                          ),
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${t.border}`,
              background: t.bgSubtle,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "100%",
                height: 46,
                border: "none",
                background: t.success,
                color: t.textInverse,
                borderRadius: 10,
                fontFamily: "Sora, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }
  return (
    <div
      onClick={(e) =>
        !isAnyOperationInProgress && e.target === e.currentTarget && onClose()
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
        fontFamily: "Sora,sans-serif",
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          color: t.textPrimary,
        }}
      >
        {/* ══════ HEADER ══════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: `linear-gradient(135deg, ${t.successBgSubtle} 0%, ${t.successBg} 100%)`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: t.success,
              color: t.textInverse,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: t.shadowSm,
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
                color: t.textPrimary,
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
                    background: t.bgMuted,
                    color: t.textMuted,
                    border: `1px solid ${t.borderStrong}`,
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
                    background: t.primaryBg,
                    color: t.primary,
                    border: `1px solid ${t.primaryBorder}`,
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
                color: t.textSecondary,
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
              background: t.bgCard,
              border: `1px solid ${t.successBorder}`,
              cursor: "pointer",
              color: t.success,
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
            background: isReadOnly ? t.bgMuted : t.successBgSubtle,
            borderBottom: `1px solid ${t.border}`,
            fontSize: 11.5,
            color: isReadOnly ? t.textSecondary : t.success,
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
              <Users size={13} color={t.textPrimary} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Project Team ({totalPeople})
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <PersonRow
                user={owner}
                variant="owner"
                isCurrentUser={
                  owner.userId?.toLowerCase() === currentUserId?.toLowerCase()
                }
                canRemove={false}
              />

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
                    background: t.bgSubtle,
                    border: `1px dashed ${t.borderStrong}`,
                    borderRadius: 8,
                    textAlign: "center",
                    color: t.textFaint,
                    fontSize: 11.5,
                  }}
                >
                  <Handshake
                    size={22}
                    strokeWidth={1.5}
                    style={{ marginBottom: 6, opacity: 0.6 }}
                  />
                  <div style={{ fontWeight: 600, color: t.textMuted }}>
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

          {/* ─── ADD PEOPLE SECTION ─── */}
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
                <UserPlus size={13} color={t.primary} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.textPrimary,
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
                          color: t.textFaint,
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
                            color: t.textFaint,
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
                          background: selectedDept
                            ? t.primaryBgSubtle
                            : t.bgInput,
                          color: selectedDept ? t.primary : t.textPrimary,
                          borderColor: selectedDept
                            ? t.primaryBorder
                            : t.borderStrong,
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

                  {availableUsers.length > 0 && (
                    <div
                      style={{
                        fontSize: 10.5,
                        color: t.textMuted,
                        marginBottom: 8,
                      }}
                    >
                      {availableUsers.length} user
                      {availableUsers.length !== 1 ? "s" : ""} available
                    </div>
                  )}

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
                          color: t.textFaint,
                          fontSize: 11.5,
                          background: t.bgSubtle,
                          borderRadius: 8,
                          border: `1px dashed ${t.border}`,
                        }}
                      >
                        <UserX
                          size={24}
                          strokeWidth={1.5}
                          style={{ marginBottom: 8, opacity: 0.5 }}
                        />
                        <div style={{ fontWeight: 600, color: t.textMuted }}>
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
                              background: t.bgCard,
                              border: `1px solid ${t.borderStrong}`,
                              borderRadius: 5,
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: t.textSecondary,
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
                              color: t.textMuted,
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
                            <span
                              style={{ color: t.textFaint, fontWeight: 500 }}
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

        {/* ══════ FOOTER ══════ */}
        <div
          style={{
            padding: "12px 20px",
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
              fontSize: 11,
              color: t.textMuted,
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
                    color: t.primary,
                  }}
                />
                <span style={{ color: t.primary, fontWeight: 600 }}>
                  Saving changes...
                </span>
              </>
            ) : (
              <>
                <Check size={12} color={t.success} />
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
              background: t.success,
              color: t.textInverse,
              borderColor: t.success,
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
