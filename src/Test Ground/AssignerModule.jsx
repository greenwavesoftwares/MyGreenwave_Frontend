import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Loader2,
  RefreshCw,
  AlertOctagon,
  FolderOpen,
  Settings,
  Calendar,
} from "lucide-react";

import { useTheme } from "./useTheme";
import { getUserData } from "../Modules/Login/Encrypt";
import activityTrackerApi from "../Services/activityTrackerApi";
import { addComment } from "../Modules/Assignee/AssigneeHelper";
import CommentsActionDialog from "../Modules/Assignee/CommentsActionDialog";
import FeedbackModal from "./FeedbackModal";
import GanttView from "./GanttView";

import { generateProjectId } from "./helpers/ids";
import { makeBtnStyle } from "./helpers/styles";

import Toast from "./shared/Toast";
import DraftProjectsList from "./DraftProjectsList";
import ProjectEditor from "./ProjectEditor";
import { useResponsive } from "./useResponsive";
import BottomTabBar from "./shared/BottomTabBar";
/* ═══════════════════════════════════════════════════════
   Root AssignerModule
   Handles: navigation, data fetching, drafts state
   ═══════════════════════════════════════════════════════ */
export default function AssignerModule() {
  const { t } = useTheme();
  const currentUserId = getUserData()?.userDetails?.userId || null;
  // Inside the component
  const { isMobile, isTablet, isDesktop, width, orientation } = useResponsive();
  // Temporary debug indicator (remove after testing)
  console.log("📱 Responsive:", {
    isMobile,
    isTablet,
    isDesktop,
    width,
    orientation,
  });
  // ── Data ──
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [pendingDraft, setPendingDraft] = useState(null);

  const [groupLabels, setGroupLabels] = useState([]);
  const [groupResources, setGroupResources] = useState({});
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // ── Navigation ──
  const [tab, setTab] = useState("drafts");
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // ── Toasts ──
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // ── Gantt-level modals ──
  const [ganttCommentOpen, setGanttCommentOpen] = useState(false);
  const [ganttExistingComments, setGanttExistingComments] = useState([]);
  const [ganttNewComment, setGanttNewComment] = useState(null);
  const [ganttFeedbackRow, setGanttFeedbackRow] = useState(null);

  // ── Date range state ──
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

  // ═══════════════════════════════════════════════════════
  // Toast helper
  // ═══════════════════════════════════════════════════════
  const showToast = useCallback((kind, title, msg, dur = 3800) => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, kind, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((tt) => tt.id !== id)), dur);
  }, []);

  // ═══════════════════════════════════════════════════════
  // Data fetching
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // Current draft
  // ═══════════════════════════════════════════════════════
  const currentDraft = useMemo(() => {
    const saved = drafts?.find((d) => d.id === currentProjectId);
    if (saved) return saved;
    if (pendingDraft && pendingDraft.id === currentProjectId)
      return pendingDraft;
    return null;
  }, [drafts, currentProjectId, pendingDraft]);

  // ═══════════════════════════════════════════════════════
  // CRUD handlers
  // ═══════════════════════════════════════════════════════
  const handleNewProject = useCallback(() => {
    const newProject = {
      id: generateProjectId(),
      project: "",
      po: "",
      site: "",
      groups: [],
      rows: [],
      customColumns: [],
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

  // ═══════════════════════════════════════════════════════
  // Gantt handlers
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // Loading / error screens for GROUPS
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  const draftsUnpublishedCount = drafts.filter(
    (d) => d.status !== "published" && d.status !== "closed",
  ).length;

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
      {/* ── Top Nav (Desktop/Tablet) ── */}
      {!isMobile && (
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
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
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
                {/* {draftsUnpublishedCount > 0 && (
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
                    {draftsUnpublishedCount}
                  </span>
                )} */}
                {drafts?.length > 0 && (
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
                    {drafts?.length}
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
      )}

      {/* Content */}
      {/* ── Content ── */}
      <div
        style={{
          // Add bottom padding on mobile to account for tab bar
          paddingBottom: isMobile
            ? "calc(60px + env(safe-area-inset-bottom, 0))"
            : 0,
          minHeight: isMobile
            ? "calc(100dvh - 48px - 60px - env(safe-area-inset-bottom, 0))"
            : "auto",
        }}
      >
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
            onRefresh={() =>
              fetchProjects(dateRange.fromDate, dateRange.toDate)
            }
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        ) : tab === "gantt" ? (
          <div
            style={{
              padding: isMobile ? "12px 12px 32px" : "16px 20px 32px",
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
      </div>

      {/* Gantt-level modals */}
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
      {/* ── Mobile Bottom Tab Bar ── */}
      {isMobile && (
        <BottomTabBar
          activeKey={tab}
          onTabChange={(key) => {
            if (key === "editor" && !currentDraft) {
              showToast(
                "info",
                "No project open",
                "Open a draft or create a new one.",
              );
              return;
            }
            if (key === "drafts") {
              handleBackToList();
            } else {
              setTab(key);
            }
          }}
          tabs={[
            {
              key: "drafts",
              label: "Projects",
              icon: <FolderOpen />,
              badge: draftsUnpublishedCount,
            },
            {
              key: "editor",
              label: "Editor",
              icon: <Settings />,
              disabled: !currentDraft,
              disabledReason: "Open a project first",
            },
            {
              key: "gantt",
              label: "Gantt",
              icon: <Calendar />,
            },
          ]}
        />
      )}
      {/* Global Toast */}
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((tt) => tt.id !== id))}
      />
    </div>
  );
}
