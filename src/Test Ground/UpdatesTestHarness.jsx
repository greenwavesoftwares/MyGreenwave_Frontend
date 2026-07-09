import React, { useState, useCallback, useRef } from "react";
import { User, ChevronDown, Info, RefreshCw, X } from "lucide-react";
import ProjectUpdatesView from "./ProjectUpdatesView";
import {
  USER_DATA,
  HARDCODED_TEST_UPDATES,
  findUserById,
} from "./updatesHelpers";

// Hardcoded project owner
const PROJECT_OWNER_ID = "john.doe@greenwave.co.in";
const PROJECT_NAME = "ThingWorx — Adity FRP";

/* ─── Simple Toast Implementation ─── */
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
            border: `1px solid ${
              t.kind === "success"
                ? "#86EFAC"
                : t.kind === "error"
                  ? "#FCA5A5"
                  : "#93C5FD"
            }`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            fontFamily: "Sora,sans-serif",
            fontSize: 12,
          }}
        >
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
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── User Switcher Widget ─── */
function UserSwitcher({ currentUserId, onSwitch }) {
  const [open, setOpen] = useState(false);
  const currentUser = findUserById(currentUserId);
  const isOwner = currentUserId === PROJECT_OWNER_ID;

  return (
    <div style={{ position: "relative", fontFamily: "Sora,sans-serif" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px",
          background: "#0F172A",
          color: "#fff",
          border: "1px solid #334155",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: isOwner ? "#DC2626" : "#1D4ED8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {currentUser?.userName.charAt(0).toUpperCase() || "?"}
        </div>
        <div style={{ textAlign: "left" }}>
          <div>{currentUser?.userName || "Unknown"}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 400 }}>
            {isOwner ? "👑 Owner" : "👤 Team Member"}
          </div>
        </div>
        <ChevronDown
          size={14}
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
            top: "110%",
            right: 0,
            width: 320,
            background: "#fff",
            border: "1px solid #CBD5E1",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            zIndex: 100,
            overflow: "hidden",
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              fontSize: 11,
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Switch User (Testing)
          </div>
          {USER_DATA.map((u) => {
            const isSelected = u.userId === currentUserId;
            const isOwnerUser = u.userId === PROJECT_OWNER_ID;
            return (
              <div
                key={u.userId}
                onClick={() => {
                  onSwitch(u.userId);
                  setOpen(false);
                }}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #F1F5F9",
                  background: isSelected ? "#F0F9FF" : "transparent",
                  borderLeft: isSelected
                    ? "3px solid #1D4ED8"
                    : "3px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isOwnerUser ? "#DC2626" : "#DBEAFE",
                    color: isOwnerUser ? "#fff" : "#1D4ED8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {u.userName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0F172A",
                    }}
                  >
                    {u.userName}
                    {isOwnerUser && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: "1px 6px",
                          background: "#FEE2E2",
                          color: "#DC2626",
                          borderRadius: 3,
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        OWNER
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>
                    {u.department} • {u.designation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Test Harness ─── */
export default function UpdatesTestHarness() {
  const [currentUserId, setCurrentUserId] = useState(
    "abhirup.paul@greenwave.co.in", // Start as Abhirup to see collaborator view
  );
  const [updates, setUpdates] = useState(HARDCODED_TEST_UPDATES);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((kind, title, msg, dur = 3800) => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, kind, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), dur);
  }, []);

  const handleReset = () => {
    setUpdates(HARDCODED_TEST_UPDATES);
    showToast("info", "Data reset", "Test data restored to initial state.");
  };

  const isOwner = currentUserId === PROJECT_OWNER_ID;
  const currentUser = findUserById(currentUserId);

  // Calculate access summary for current user
  const editableCategories = updates.categories.filter((cat) => {
    if (isOwner) return true;
    return cat.sharedWith?.some(
      (u) => u.userId.toLowerCase() === currentUserId.toLowerCase(),
    );
  }).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1F5F9",
        fontFamily: "Sora,sans-serif",
      }}
    >
      {/* ── Testing Header ── */}
      <div
        style={{
          background: "#0F172A",
          color: "#fff",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: "#1D4ED8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🧪
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              Updates Sharing Test Harness
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              Project: {PROJECT_NAME}
            </div>
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={handleReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: "#334155",
              color: "#fff",
              border: "1px solid #475569",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            <RefreshCw size={12} /> Reset Data
          </button>

          <UserSwitcher
            currentUserId={currentUserId}
            onSwitch={setCurrentUserId}
          />
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div
        style={{
          background: isOwner ? "#DBEAFE" : "#F0FDF4",
          borderBottom: `1px solid ${isOwner ? "#93C5FD" : "#86EFAC"}`,
          padding: "10px 24px",
          fontSize: 12,
          color: isOwner ? "#1E40AF" : "#166534",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Info size={14} />
        <div>
          Viewing as <strong>{currentUser?.userName}</strong> —{" "}
          {isOwner ? (
            <>
              You are the <strong>project owner</strong>. You have full access
              to all {updates.categories.length} categories and can manage
              sharing.
            </>
          ) : editableCategories > 0 ? (
            <>
              You are a <strong>collaborator</strong>. You have edit access to{" "}
              <strong>{editableCategories}</strong> of{" "}
              <strong>{updates.categories.length}</strong> categories.
            </>
          ) : (
            <>
              You are a <strong>viewer</strong>. You have read-only access to
              this project.
            </>
          )}
        </div>
      </div>

      {/* ── Test Scenarios Guide ── */}
      <div
        style={{
          background: "#FFFBEB",
          borderBottom: "1px solid #FCD34D",
          padding: "10px 24px",
          fontSize: 11,
          color: "#78350F",
        }}
      >
        <strong>🎯 Test Scenarios:</strong> Try switching to different users
        using the dropdown above:{" "}
        <span
          style={{
            padding: "1px 6px",
            background: "#FEF3C7",
            borderRadius: 3,
            margin: "0 2px",
          }}
        >
          John Doe (Owner)
        </span>{" "}
        →{" "}
        <span
          style={{
            padding: "1px 6px",
            background: "#FEF3C7",
            borderRadius: 3,
            margin: "0 2px",
          }}
        >
          Abhirup Paul (Collab: rows 3, 4)
        </span>{" "}
        →{" "}
        <span
          style={{
            padding: "1px 6px",
            background: "#FEF3C7",
            borderRadius: 3,
            margin: "0 2px",
          }}
        >
          Abhishek Bhowmick (Collab: rows 3, 4, 6)
        </span>{" "}
        →{" "}
        <span
          style={{
            padding: "1px 6px",
            background: "#FEF3C7",
            borderRadius: 3,
            margin: "0 2px",
          }}
        >
          Others (Viewer only)
        </span>
      </div>

      {/* ── Updates View ── */}
      <div
        style={{ padding: "16px 24px 32px", maxWidth: 1600, margin: "0 auto" }}
      >
        <ProjectUpdatesView
          updates={updates}
          onChange={setUpdates}
          readOnly={false}
          projectName={PROJECT_NAME}
          projectOwnerId={PROJECT_OWNER_ID}
          currentUserId={currentUserId}
          showToast={showToast}
        />
      </div>

      {/* ── Data Inspector (Bottom) ── */}
      <details
        style={{
          margin: "20px 24px",
          padding: 12,
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          fontSize: 11,
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 600,
            color: "#475569",
            padding: 4,
          }}
        >
          🔍 View Current State (Debug)
        </summary>
        <pre
          style={{
            marginTop: 10,
            padding: 12,
            background: "#0F172A",
            color: "#86EFAC",
            borderRadius: 6,
            overflow: "auto",
            maxHeight: 400,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {JSON.stringify(updates, null, 2)}
        </pre>
      </details>

      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  );
}
