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

/* ─── Multi-Select Filter Dropdown ─── */
function FilterDropdown({ label, options, selected, onChange, icon: Icon }) {
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

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          ...btnStyle,
          height: 32,
          background: isActive ? "#EFF6FF" : "#fff",
          borderColor: isActive ? "#93C5FD" : "#CBD5E1",
          color: isActive ? "#1D4ED8" : "#475569",
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {Icon && <Icon size={12} />}
        {label}
        {isActive && (
          <span
            style={{
              padding: "1px 6px",
              background: "#1D4ED8",
              color: "#fff",
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
            background: "#fff",
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            zIndex: 100,
            overflow: "hidden",
            fontFamily: "Sora,sans-serif",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
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
          <div style={{ maxHeight: 240, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  color: "#94A3B8",
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
                      background: checked ? "#F0F9FF" : "transparent",
                      borderLeft: checked
                        ? "3px solid #1D4ED8"
                        : "3px solid transparent",
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
                      }}
                    >
                      {checked && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#0F172A",
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

/* ─── Add User Search Panel ─── */
function AddUserPanel({
  availableUsers,
  onAdd,
  onClose,
  isLoading,
  error,
  onRetry,
}) {
  const [search, setSearch] = useState("");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const searchRef = useRef();

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

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

  return (
    <div
      style={{
        padding: 16,
        background: "#F8FAFC",
        borderBottom: "1px solid #E2E8F0",
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
            fontSize: 12.5,
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          <UserPlus size={14} color="#1D4ED8" />
          Add Users to Matrix
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#94A3B8",
            padding: 4,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #E2E8F0",
          }}
        >
          <Loader2
            size={22}
            style={{
              animation: "spin 1s linear infinite",
              color: "#1D4ED8",
              marginBottom: 8,
            }}
          />
          <div style={{ fontSize: 11.5, color: "#64748B" }}>
            Loading users...
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div
          style={{
            padding: 16,
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle
              size={16}
              color="#DC2626"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#DC2626" }}>
                Failed to load users
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#7F1D1D",
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
                  height: 26,
                  fontSize: 11,
                  background: "#DC2626",
                  color: "#fff",
                  borderColor: "#DC2626",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!isLoading && !error && (
        <>
          {/* Search + Filter */}
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
                placeholder="Search by name, email, department, designation..."
                style={{
                  width: "100%",
                  height: 34,
                  border: "1px solid #CBD5E1",
                  borderRadius: 7,
                  padding: "0 10px 0 32px",
                  fontFamily: "Sora,sans-serif",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#fff",
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
                    color: "#94A3B8",
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {departments.length > 0 && (
              <FilterDropdown
                label="Department"
                icon={Building2}
                options={departments}
                selected={selectedDepts}
                onChange={setSelectedDepts}
              />
            )}
          </div>

          {/* Results count */}
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
              available
              {(search || selectedDepts.length > 0) &&
                ` (filtered from ${availableUsers.length})`}
            </span>
          </div>

          {/* User List */}
          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
            }}
          >
            {filteredUsers.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#94A3B8",
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
                      background: "#FAFBFC",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid #F1F5F9",
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
                        padding: "10px 12px",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "background .1s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F0F9FF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
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
                            fontSize: 12,
                            fontWeight: 600,
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
                            color: "#94A3B8",
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
                            fontSize: 10,
                            color: "#64748B",
                            marginTop: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Briefcase size={9} />
                          {user.designation}
                        </div>
                      </div>
                      <div
                        style={{
                          color: "#1D4ED8",
                          fontSize: 11,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "4px 8px",
                          background: "#EFF6FF",
                          borderRadius: 5,
                          border: "1px solid #BFDBFE",
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
  const [showAddUser, setShowAddUser] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [sharingFilter, setSharingFilter] = useState("all"); // "all" | "shared" | "unshared"

  // Users API state
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

  /* ─── Load users ─── */
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

  /* ─── Initial users in matrix (from categories) ─── */
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

  // Initialize selectedUsers once users are loaded
  useEffect(() => {
    if (!initialized && initialMatrixUsers.length > 0) {
      setSelectedUsers(initialMatrixUsers);
      setInitialized(true);
    } else if (!initialized && allUsers.length > 0) {
      setInitialized(true);
    }
  }, [initialMatrixUsers, allUsers, initialized]);

  /* ─── Sharing matrix ─── */
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

  /* ─── Cell toggle ─── */
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

  /* ─── Row toggle (select all users for a category) ─── */
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

  /* ─── Column toggle (share user across all rows) ─── */
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

  /* ─── Add user to matrix ─── */
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

  /* ─── Remove user from matrix ─── */
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

  /* ─── Bulk actions ─── */
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

  /* ─── Save ─── */
  const handleSave = () => {
    const result = {};
    categories.forEach((cat) => {
      result[cat.id] = Array.from(sharingMatrix[cat.id] || []);
    });
    onSave(result);
  };

  /* ─── Available users (not yet in matrix) ─── */
  const availableUsersToAdd = useMemo(() => {
    const excludeSet = new Set([
      currentUserId.toLowerCase(),
      ...selectedUsers.map((u) => u.userId.toLowerCase()),
    ]);
    return allUsers.filter(
      (u) => u.active && !excludeSet.has(u.userId.toLowerCase()),
    );
  }, [allUsers, currentUserId, selectedUsers]);

  /* ─── Filter categories ─── */
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

  /* ─── Stats ─── */
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

  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
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
          maxWidth: 1100,
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
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: "#7C3AED",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            }}
          >
            <Grid3x3 size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
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
              Manage Category Sharing
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
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3 }}>
              Bulk manage access across all categories and users
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "rgba(255,255,255,0.6)",
              border: "1px solid #DDD6FE",
              cursor: isSaving ? "not-allowed" : "pointer",
              color: "#7C3AED",
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

        {/* ── Stats Bar ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 20px",
            background: "#FAFBFC",
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          {[
            {
              label: "Categories",
              value: categories.length,
              icon: Grid3x3,
              color: "#7C3AED",
              bg: "#EDE9FE",
            },
            {
              label: "Users",
              value: selectedUsers.length,
              icon: Users,
              color: "#1D4ED8",
              bg: "#DBEAFE",
            },
            {
              label: "Shared",
              value: `${stats.sharedCategories}/${categories.length}`,
              icon: UserCheck,
              color: "#15803D",
              bg: "#DCFCE7",
            },
            {
              label: "Access Grants",
              value: stats.checkedCells,
              icon: Check,
              color: "#0369A1",
              bg: "#F0F9FF",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "#fff",
                border: "1px solid #E2E8F0",
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
                    color: "#0F172A",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div
          style={{
            padding: "12px 20px",
            background: "#fff",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {/* Category Search */}
          <div style={{ position: "relative", width: 260 }}>
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
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories..."
              style={{
                width: "100%",
                height: 32,
                border: "1px solid #CBD5E1",
                borderRadius: 7,
                padding: "0 30px 0 32px",
                fontFamily: "Sora,sans-serif",
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
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
                  color: "#94A3B8",
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sharing Filter Pills */}
          <div
            style={{
              display: "flex",
              background: "#F1F5F9",
              borderRadius: 7,
              padding: 3,
              gap: 2,
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
                    padding: "5px 12px",
                    borderRadius: 5,
                    border: "none",
                    background: active ? "#fff" : "transparent",
                    color: active ? "#0F172A" : "#64748B",
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "Sora,sans-serif",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all .12s",
                  }}
                >
                  <f.icon size={11} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Right side actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              disabled={isSaving}
              style={{
                ...btnStyle,
                height: 32,
                background: showAddUser ? "#1D4ED8" : "#EFF6FF",
                color: showAddUser ? "#fff" : "#1D4ED8",
                borderColor: "#1D4ED8",
                fontWeight: 600,
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              <UserPlus size={13} />
              Add Users
            </button>

            {selectedUsers.length > 0 && categories.length > 0 && !isSaving && (
              <>
                <button
                  onClick={handleShareAllWithAll}
                  title="Grant all users access to all categories"
                  style={{
                    ...btnStyle,
                    height: 32,
                    background: "#F0FDF4",
                    color: "#15803D",
                    borderColor: "#86EFAC",
                  }}
                >
                  <Sparkles size={13} />
                  Share All
                </button>
                <button
                  onClick={handleClearAll}
                  title="Remove all sharing"
                  style={{
                    ...btnStyle,
                    height: 32,
                    background: "#FEF2F2",
                    color: "#DC2626",
                    borderColor: "#FCA5A5",
                  }}
                >
                  <Trash2 size={13} />
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Add User Panel ── */}
        {showAddUser && (
          <AddUserPanel
            availableUsers={availableUsersToAdd}
            onAdd={addUserToMatrix}
            onClose={() => setShowAddUser(false)}
            isLoading={isLoadingUsers}
            error={usersError}
            onRetry={loadUsers}
          />
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, overflow: "auto", background: "#F8FAFC" }}>
          {isLoadingUsers && !initialized ? (
            /* Loading users initially */
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "#64748B",
              }}
            >
              <Loader2
                size={32}
                style={{
                  animation: "spin 1s linear infinite",
                  color: "#7C3AED",
                  marginBottom: 12,
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Loading sharing data...
              </div>
            </div>
          ) : usersError && selectedUsers.length === 0 ? (
            /* Users load failed */
            <div style={{ padding: 30 }}>
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 10,
                  padding: 20,
                  display: "flex",
                  gap: 12,
                }}
              >
                <AlertTriangle size={24} color="#DC2626" />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#DC2626",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    Cannot load user data
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#7F1D1D",
                      marginBottom: 10,
                    }}
                  >
                    {usersError?.userMessage || usersError?.message}
                  </div>
                  <button
                    onClick={loadUsers}
                    style={{
                      ...btnStyle,
                      background: "#DC2626",
                      color: "#fff",
                      borderColor: "#DC2626",
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : selectedUsers.length === 0 ? (
            /* No users in matrix */
            <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#EDE9FE",
                  color: "#7C3AED",
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
                  color: "#0F172A",
                  marginBottom: 4,
                }}
              >
                No Users Added Yet
              </div>
              <div
                style={{ fontSize: 12, maxWidth: 400, margin: "0 auto 16px" }}
              >
                Add users to start sharing categories with them. You can add
                multiple users at once.
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                style={{
                  ...btnStyle,
                  background: "#1D4ED8",
                  color: "#fff",
                  borderColor: "#1D4ED8",
                  height: 36,
                }}
              >
                <UserPlus size={14} /> Add Your First User
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            /* No matching categories */
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
              <Filter
                size={32}
                strokeWidth={1.5}
                style={{ marginBottom: 12, opacity: 0.5 }}
              />
              <div
                style={{ fontWeight: 600, color: "#0F172A", marginBottom: 4 }}
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
          ) : (
            /* Matrix Table */
            <div style={{ padding: 16 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 12,
                  background: "#fff",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "12px 14px",
                        background: "#1E293B",
                        color: "#fff",
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <ClipboardList size={13} />
                        Category
                      </div>
                    </th>
                    {selectedUsers.map((user) => {
                      const columnCheckedCount = filteredCategories.filter(
                        (cat) =>
                          sharingMatrix[cat.id]?.has(user.userId.toLowerCase()),
                      ).length;
                      const allChecked =
                        columnCheckedCount === filteredCategories.length;

                      return (
                        <th
                          key={user.userId}
                          style={{
                            padding: "10px 8px",
                            background: "#1E293B",
                            color: "#fff",
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
                                background:
                                  "linear-gradient(135deg, #3B82F6, #1D4ED8)",
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

                            <div
                              style={{ display: "flex", gap: 3, marginTop: 2 }}
                            >
                              <button
                                onClick={() => toggleColumnAll(user.userId)}
                                disabled={isSaving}
                                title={
                                  allChecked ? "Deselect all" : "Select all"
                                }
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
                                  color: "#fff",
                                  cursor: isSaving ? "not-allowed" : "pointer",
                                  fontFamily: "Sora,sans-serif",
                                  fontWeight: 600,
                                  opacity: isSaving ? 0.5 : 1,
                                }}
                              >
                                {allChecked ? "None" : "All"}
                              </button>
                              <button
                                onClick={() =>
                                  removeUserFromMatrix(user.userId)
                                }
                                disabled={isSaving}
                                title="Remove from matrix"
                                style={{
                                  width: 20,
                                  height: 20,
                                  padding: 0,
                                  background: "rgba(220,38,38,0.25)",
                                  border: "1px solid rgba(252,165,165,0.5)",
                                  borderRadius: 4,
                                  color: "#fff",
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
                        style={{
                          background: idx % 2 === 0 ? "#fff" : "#FAFBFC",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 14px",
                            fontWeight: 600,
                            color: "#0F172A",
                            borderBottom: "1px solid #F1F5F9",
                            borderRight: "2px solid #E2E8F0",
                            position: "sticky",
                            left: 0,
                            background: idx % 2 === 0 ? "#fff" : "#FAFBFC",
                            zIndex: 1,
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
                                width: 4,
                                height: 24,
                                background: isShared ? "#15803D" : "#CBD5E1",
                                borderRadius: 2,
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, color: "#0F172A" }}>
                                {cat.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: isShared ? "#15803D" : "#94A3B8",
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
                              title={
                                rowSharedCount === selectedUsers.length
                                  ? "Deselect all"
                                  : "Share with all"
                              }
                              style={{
                                fontSize: 9,
                                padding: "3px 8px",
                                background:
                                  rowSharedCount === selectedUsers.length
                                    ? "#FEF2F2"
                                    : "#F1F5F9",
                                border: `1px solid ${
                                  rowSharedCount === selectedUsers.length
                                    ? "#FCA5A5"
                                    : "#CBD5E1"
                                }`,
                                borderRadius: 4,
                                color:
                                  rowSharedCount === selectedUsers.length
                                    ? "#DC2626"
                                    : "#475569",
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
                                borderBottom: "1px solid #F1F5F9",
                                borderLeft: "1px solid #F1F5F9",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                transition: "background .1s",
                                background: checked ? "#F0F9FF" : "transparent",
                                opacity: isSaving ? 0.6 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!checked && !isSaving)
                                  e.currentTarget.style.background = "#F8FAFC";
                              }}
                              onMouseLeave={(e) => {
                                if (!checked)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  border: `2px solid ${
                                    checked ? "#1D4ED8" : "#CBD5E1"
                                  }`,
                                  background: checked ? "#1D4ED8" : "#fff",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  transition: "all .12s",
                                  boxShadow: checked
                                    ? "0 2px 4px rgba(29,78,216,0.25)"
                                    : "none",
                                }}
                              >
                                {checked && (
                                  <Check size={14} strokeWidth={3.5} />
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Legend */}
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background: "#EFF6FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#0369A1",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Info size={12} />
                <span>
                  Click any cell to toggle sharing. Use{" "}
                  <strong>All/None</strong> buttons to bulk-toggle rows or
                  columns.
                </span>
              </div>
            </div>
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
              fontSize: 11.5,
              color: "#64748B",
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
                    color: "#1D4ED8",
                  }}
                />
                <span style={{ color: "#1D4ED8", fontWeight: 600 }}>
                  Saving changes...
                </span>
              </>
            ) : hasChanges ? (
              <>
                <AlertTriangle size={13} color="#B45309" />
                <span style={{ color: "#B45309", fontWeight: 600 }}>
                  You have unsaved changes
                </span>
              </>
            ) : (
              <>
                <Check size={13} color="#15803D" />
                <span>All changes saved</span>
              </>
            )}
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
                    ? "0 2px 8px rgba(29,78,216,0.3)"
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
                  <Save size={13} /> Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
