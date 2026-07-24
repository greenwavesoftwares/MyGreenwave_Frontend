import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Save,
  Send,
  RefreshCw,
  Rocket,
  Lock,
  FileText,
  Download,
  Upload,
  Plus,
  Settings,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  UserCheck,
  UserX,
  MessageSquare,
  FolderOpen,
  Edit,
  Trash2,
  Handshake,
  Star,
  ClipboardList,
  XCircle,
  Users,
} from "lucide-react";

import { useTheme } from "../useTheme";

// ── Helpers ──
import {
  MAX_CUSTOM_COL_CHARS,
  DEFAULT_CUSTOM_COL_WIDTH,
  MIN_CUSTOM_COL_WIDTH,
  MAX_CUSTOM_COL_WIDTH,
  MODULE_COLORS,
  WORK_START_HR,
} from "../helpers/constants";
import {
  makeLabelStyle,
  makeInputStyle,
  makeBtnStyle,
} from "../helpers/styles";
import { generateRowId } from "../helpers/ids";
import { isoDateTime, fmtDisplay } from "../helpers/dateUtils";
import {
  ensureModuleId,
  syncModuleIds,
  getModuleColor,
} from "../helpers/modules";
import {
  getResources,
  getResourceByUserId,
  getGroupName,
  getActiveGroups,
} from "../helpers/resources";
import {
  flattenOrdered,
  recomputeChains,
  recomputeAutoChains,
} from "../helpers/chains";
import { runValidations } from "../helpers/validation";
import {
  generateCustomColumnId,
  sortCustomColumns,
} from "../helpers/customColumns";
import {
  analyzeExcelColumns,
  buildNormalizedRec,
  pickFromNormalized,
  buildExportFilename,
} from "../helpers/excel";
import { computeProjectAccess, canDeleteProject } from "../coAssignerHelpers";

// ── Shared components ──
import SearchableDropdown from "../shared/SearchableDropdown";
import ColumnFilterDropdown from "../shared/ColumnFilterDropdown";

// ── Modals ──
import CommentsModal from "../modals/CommentsModal";
import ValidationModal from "../modals/ValidationModal";
import RejectReasonModal from "../modals/RejectReasonModal";
import ProjectCloseModal from "../modals/ProjectCloseModal";
import AddColumnModal from "../modals/AddColumnModal";
import ConfirmDeleteColumnModal from "../modals/ConfirmDeleteColumnModal";
import ExtraColumnsPreviewModal from "../modals/ExtraColumnsPreviewModal";
import SuccessorViewerModal from "../modals/SuccessorViewerModal";

// ── External modules (assumed to already exist) ──
import activityTrackerApi from "../../Services/activityTrackerApi";
import { addComment } from "../../Modules/Assignee/AssigneeHelper";
import CommentsActionDialog from "../../Modules/Assignee/CommentsActionDialog";
import FeedbackModal from "../FeedbackModal";
import GanttView from "../GanttView";
import ProjectUpdatesView from "../ProjectUpdatesView";
import CoAssignerModal from "../CoAssignerModal";
import * as sharingApi from "../sharingApi";

// ── Row component ──
import ActivityRow from "./ActivityRow";
// ── Dependency helpers ──
import {
  cleanupOrphanedDependencies,
  getSuccessors,
} from "../helpers/dependencies";

// ── Dependency modal ──
import DependencyPickerModal from "../modals/DependencyPickerModal";
/* ═══════════════════════════════════════════════════════
   ProjectEditor
   ═══════════════════════════════════════════════════════ */
export default function ProjectEditor({
  draft,
  groupLabels,
  groupResources,
  fetchResourcesForGroups,
  onSaveDraft,
  onPublish,
  onBack,
  showToast,
  currentUserId,
}) {
  const { t } = useTheme();
  const labelStyle = makeLabelStyle(t);
  const inputStyle = makeInputStyle(t);
  const btnStyle = makeBtnStyle(t);

  // ─── Access control ───
  const projectAccess = useMemo(
    () => computeProjectAccess(draft, currentUserId),
    [draft, currentUserId],
  );
  const {
    role: currentUserProjectRole,
    isOwner: isProjectOwner,
    isCoAssigner,
    isUpdatesShared,
    canAccessActivities,
    canAccessGantt,
    canAccessUpdates,
    canManageCoAssigners,
    canManageProject,
  } = projectAccess;

  const isNewProject = !draft?.createdBy;
  const effectiveCanAccessActivities = canAccessActivities || isNewProject;
  const effectiveCanAccessGantt = canAccessGantt || isNewProject;
  const effectiveCanAccessUpdates = canAccessUpdates || isNewProject;
  const effectiveHasAccess = canManageProject || isNewProject;
  const activitiesGanttEnabled = effectiveHasAccess;
  const projectOwnerId = draft?.createdBy || "";
  const hasEditAccess = effectiveHasAccess;
  // ─── Dependency modals ───
  const [depPickerRow, setDepPickerRow] = useState(null);
  const [successorViewRow, setSuccessorViewRow] = useState(null);
  const [isSavingDeps, setIsSavingDeps] = useState(false);
  // ─── Project metadata ───
  const [project, setProject] = useState(draft.project || "");
  const [po, setPo] = useState(draft.po || "");
  const [site, setSite] = useState(draft.site || "");
  const [groups, setGroups] = useState(draft.groups || []);
  const [rows, setRows] = useState(draft.rows || []);
  const [moduleRegistry, setModuleRegistry] = useState(
    draft.moduleRegistry || {},
  );

  // ─── Custom Columns ───
  const [customColumns, setCustomColumns] = useState(draft.customColumns || []);
  const [colWidths, setColWidths] = useState({});
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [renameColumnId, setRenameColumnId] = useState(null);
  const [deleteColumnId, setDeleteColumnId] = useState(null);
  const [resizingColId, setResizingColId] = useState(null);
  const [extraColumnsPreview, setExtraColumnsPreview] = useState(null);

  // ─── Auto Calculate ───
  const [autoCalculate, setAutoCalculate] = useState(false);

  // ─── UI state ───
  const [view, setView] = useState("activities");
  const [motionSubmitted, setMotionSubmitted] = useState(
    draft.status === "published",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [overlapRowIds, setOverlapRowIds] = useState(new Set());
  const [columnFilters, setColumnFilters] = useState({
    module: [],
    task: "",
    resource: [],
    status: [],
  });
  const [uploadStatus, setUploadStatus] = useState({
    type: "info",
    msg: "Download the Excel template, fill it with your activities, then upload back here.",
  });

  // ─── Feedback / reject ───
  const [feedbackRow, setFeedbackRow] = useState(null);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [rejectRow, setRejectRow] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // ─── Comments ───
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState([]);
  const [newComment, setNewComment] = useState(null);

  // ─── Validation ───
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // ─── Save / publish ───
  const [isSaving, setIsSaving] = useState(false);

  // ─── Close project ───
  const [closeProjectOpen, setCloseProjectOpen] = useState(false);
  const [isClosingProject, setIsClosingProject] = useState(false);

  // ─── Co-assigner modal ───
  const [coAssignerModalOpen, setCoAssignerModalOpen] = useState(false);
  const [allUsersForCoAssigner, setAllUsersForCoAssigner] = useState([]);
  const [loadingUsersForCoAssigner, setLoadingUsersForCoAssigner] =
    useState(false);
  const [usersErrorForCoAssigner, setUsersErrorForCoAssigner] = useState(null);

  // ─── Refs ───
  const fileInputRef = useRef();

  // ─── Draft time display ───
  const [draftTime] = useState(
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

  const isEditable = draft.status === "draft" || !draft.status;

  // ═══════════════════════════════════════════════════════
  // Computed values
  // ═══════════════════════════════════════════════════════
  const isResourcesReady = useMemo(() => {
    if (groups.length === 0) return true;
    return groups.every((g) => g in groupResources);
  }, [groups, groupResources]);

  const resources = useMemo(
    () => getResources(groups, groupResources),
    [groups, groupResources],
  );

  const sortedCustomColumns = useMemo(
    () => sortCustomColumns(customColumns),
    [customColumns],
  );

  const columnFilledCounts = useMemo(() => {
    const counts = {};
    customColumns.forEach((col) => {
      counts[col.id] = rows.filter((r) => {
        const val = r.customValues?.[col.id];
        return val && String(val).trim().length > 0;
      }).length;
    });
    return counts;
  }, [customColumns, rows]);

  const getColWidth = useCallback(
    (colId, defaultWidth = DEFAULT_CUSTOM_COL_WIDTH) => {
      return colWidths[colId] || defaultWidth;
    },
    [colWidths],
  );

  const filterOptions = useMemo(() => {
    const modules = [
      ...new Set(rows.filter((r) => r.module).map((r) => r.module)),
    ].sort();
    const resList = [
      ...new Set(rows.filter((r) => r.resource).map((r) => r.resource)),
    ].sort();
    const statuses = [
      ...new Set(rows.map((r) => r.status || "Pending")),
    ].sort();
    const resourceOpts = resList.map((userId) => {
      const row = rows.find((r) => r.resource === userId);
      return { value: userId, label: row?.resourceName || userId };
    });
    return { modules, resourceOpts, statuses };
  }, [rows]);

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

  // ═══════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (groups.length > 0) fetchResourcesForGroups(groups);
  }, [groups, fetchResourcesForGroups]);

  useEffect(() => {
    if (draft.customColumns) setCustomColumns(draft.customColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);

  useEffect(() => {
    if (overlapRowIds.size > 0) setOverlapRowIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => {
    if (
      !activitiesGanttEnabled &&
      (view === "activities" || view === "gantt")
    ) {
      setView("updates");
    }
  }, [activitiesGanttEnabled, view]);

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
  // ── Auto-cleanup orphaned dependency IDs when rows change ──
  useEffect(() => {
    setRows((prev) => {
      const { rows: cleaned, changed } = cleanupOrphanedDependencies(prev);
      if (changed) {
        // Only log; toast would be noisy
        console.log("🧹 Cleaned up orphaned dependency references");
        return cleaned;
      }
      return prev;
    });
    // Deliberately not depending on rows to avoid infinite loop —
    // triggered by row count changes below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);
  // ═══════════════════════════════════════════════════════
  // Unified recompute (auto vs manual)
  // ═══════════════════════════════════════════════════════
  const recomputeRows = useCallback(
    (rowsToProcess) => {
      if (autoCalculate) {
        const { rows: computed, warnings } = recomputeAutoChains(
          rowsToProcess,
          groupResources,
        );
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
      }
      return recomputeChains(rowsToProcess, groupResources);
    },
    [autoCalculate, groupResources, groups, showToast],
  );

  useEffect(() => {
    setRows((prev) => recomputeRows(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalculate]);

  // ═══════════════════════════════════════════════════════
  // Comment handler
  // ═══════════════════════════════════════════════════════
  const onOpenCommentBox = useCallback(
    async (projectId, activityId, moduleId) => {
      try {
        const existingCommentsResp =
          await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
            projectId,
            activityId,
          );
        const newCommentBody = addComment(projectId, activityId, moduleId);
        setExistingComments(existingCommentsResp || []);
        setNewComment(newCommentBody);
        setOpenCommentDialog(true);
      } catch (err) {
        showToast("error", "Failed to load comments", err.message);
      }
    },
    [showToast],
  );

  // ═══════════════════════════════════════════════════════
  // Feedback handler
  // ═══════════════════════════════════════════════════════
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
          `"${feedbackRow.task || "Task"}" — Avg: ${avg}/10`,
        );
        setFeedbackRow(null);
      } catch (err) {
        showToast("error", "Feedback failed", err.message);
      } finally {
        setIsFeedbackSubmitting(false);
      }
    },
    [feedbackRow, draft.id, showToast],
  );

  // ═══════════════════════════════════════════════════════
  // Reject handler
  // ═══════════════════════════════════════════════════════
  const handleRedoReject = useCallback(
    async (reason) => {
      if (!rejectRow) return;
      setIsRejecting(true);
      try {
        await activityTrackerApi.rejectActivity(rejectRow.id, reason);
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
        showToast("error", "Reject failed", err.message);
      } finally {
        setIsRejecting(false);
      }
    },
    [rejectRow, showToast],
  );

  // ═══════════════════════════════════════════════════════
  // Co-assigner handlers
  // ═══════════════════════════════════════════════════════
  const handleAddCoAssigner = useCallback(
    async (user) => {
      try {
        const coAssignerPayload = {
          userId: user.userId,
          userName: user.userName,
          addedAt: new Date().toISOString(),
          addedBy: currentUserId,
        };
        const response = await sharingApi.addCoAssigner(
          draft.id,
          coAssignerPayload,
        );
        const savedCoAssigner =
          typeof response === "object" &&
          response !== null &&
          !("success" in response)
            ? response.coAssigner || response.data || response
            : coAssignerPayload;
        const updatedDraft = {
          ...draft,
          coAssigners: [...(draft.coAssigners || []), savedCoAssigner],
        };
        await onSaveDraft(updatedDraft, { skipApiCall: true });
        showToast(
          "success",
          "Co-assigner added",
          `${user.userName} now has ownership rights.`,
        );
      } catch (err) {
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

  const handleRemoveCoAssigner = useCallback(
    async (userId) => {
      try {
        const removedUser = (draft.coAssigners || []).find(
          (ca) => ca.userId.toLowerCase() === userId.toLowerCase(),
        );
        await sharingApi.removeCoAssigner(draft.id, userId);
        const updatedCoAssigners = (draft.coAssigners || []).filter(
          (ca) => ca.userId.toLowerCase() !== userId.toLowerCase(),
        );
        await onSaveDraft(
          { ...draft, coAssigners: updatedCoAssigners },
          { skipApiCall: true },
        );
        showToast(
          "success",
          "Co-assigner removed",
          `${removedUser?.userName || userId} no longer has access.`,
        );
      } catch (err) {
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

  // ═══════════════════════════════════════════════════════
  // Build payload
  // ═══════════════════════════════════════════════════════
  const buildProjectData = useCallback(() => {
    const formattedRows = rows.map((r) => ({
      ...r,
      customValues: r.customValues || {},
      dependsOn: r.dependsOn || [], // ← safety fallback
    }));
    return {
      ...draft,
      project,
      po,
      site,
      groups,
      rows: formattedRows,
      moduleRegistry,
      customColumns,
      status: draft.status === "published" ? "published" : "draft",
    };
  }, [draft, project, po, site, groups, rows, moduleRegistry, customColumns]);

  // ═══════════════════════════════════════════════════════
  // Publish / close / save
  // ═══════════════════════════════════════════════════════
  const handleConfirmMotion = useCallback(async () => {
    setIsSaving(true);
    try {
      await onPublish(buildProjectData());
      setMotionSubmitted(true);
      setValidationOpen(false);
    } catch (err) {
      // toast shown by parent
    } finally {
      setIsSaving(false);
    }
  }, [buildProjectData, onPublish]);

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
        showToast("error", "Close failed", err.message);
      } finally {
        setIsClosingProject(false);
      }
    },
    [buildProjectData, onPublish, showToast],
  );

  const handleSaveDraftClick = useCallback(async () => {
    if (isSaving || motionSubmitted || draft.status === "closed") return;
    setIsSaving(true);
    try {
      await onSaveDraft(buildProjectData());
    } catch (err) {
      // toast shown by parent
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, motionSubmitted, draft.status, onSaveDraft, buildProjectData]);

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

  // ═══════════════════════════════════════════════════════
  // Group update — clears invalid resources
  // ═══════════════════════════════════════════════════════
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
        updated = recomputeRows(updated);
        return updated;
      });
      setGroups(newGroups);
    },
    [groupResources, recomputeRows],
  );

  // ═══════════════════════════════════════════════════════
  // Row CRUD
  // ═══════════════════════════════════════════════════════
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
        customValues: {},
        dependsOn: [], // ← NEW
      };
      customColumns.forEach((col) => {
        newRow.customValues[col.id] = "";
      });
      setModuleRegistry(newRegistry);
      setRows((prev) => recomputeRows([...prev, newRow]));
    },
    [moduleRegistry, customColumns, recomputeRows],
  );

  const addSubActivity = useCallback(
    (parentRow) => {
      const newRow = {
        id: generateRowId(),
        parentId: parentRow.id,
        module: parentRow.module,
        moduleId: parentRow.moduleId,
        task: "",
        resource: parentRow.resource || "",
        plannedStart: "",
        durationHrs: "",
        plannedStop: "",
        status: "Pending",
        comments: [],
        customValues: {},
        dependsOn: [], // ← NEW
      };
      customColumns.forEach((col) => {
        newRow.customValues[col.id] = "";
      });
      setRows((prev) => recomputeRows([...prev, newRow]));
    },
    [customColumns, recomputeRows],
  );

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
        customValues: {},
      };
      customColumns.forEach((col) => {
        newRow.customValues[col.id] = "";
      });
      setModuleRegistry(newRegistry);
      setRows((prev) => {
        const refIndex = prev.findIndex((r) => r.id === referenceRow.id);
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
        return recomputeRows(updated);
      });
    },
    [moduleRegistry, customColumns, recomputeRows],
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
        return recompute && isResourcesReady
          ? recomputeRows(replaced)
          : replaced;
      });
    },
    [moduleRegistry, recomputeRows, isResourcesReady],
  );

  const deleteRow = useCallback(
    (row) => {
      setRows((prev) => {
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
        const synced = syncModuleIds(filtered, moduleRegistry);
        setModuleRegistry(synced.registry);
        return recomputeRows(synced.rows);
      });
    },
    [moduleRegistry, recomputeRows],
  );

  // ═══════════════════════════════════════════════════════
  // Custom Column handlers
  // ═══════════════════════════════════════════════════════
  const handleAddColumn = useCallback(
    (name) => {
      const newColumn = {
        id: generateCustomColumnId(),
        name: name.trim(),
        type: "text",
        width: DEFAULT_CUSTOM_COL_WIDTH,
        order: customColumns.length,
        createdAt: new Date().toISOString(),
        createdBy: currentUserId,
      };
      setCustomColumns((prev) => [...prev, newColumn]);
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          customValues: { ...(r.customValues || {}), [newColumn.id]: "" },
        })),
      );
      setAddColumnOpen(false);
      showToast("success", "Column added", `"${name}" added to the table.`);
    },
    [customColumns, currentUserId, showToast],
  );

  const handleRenameColumn = useCallback(
    (columnId, newName) => {
      setCustomColumns((prev) =>
        prev.map((c) =>
          c.id === columnId ? { ...c, name: newName.trim() } : c,
        ),
      );
      setRenameColumnId(null);
      showToast("success", "Column renamed", `Renamed to "${newName}".`);
    },
    [showToast],
  );

  const handleDeleteColumn = useCallback(
    (columnId) => {
      const col = customColumns.find((c) => c.id === columnId);
      if (!col) return;
      setCustomColumns((prev) => prev.filter((c) => c.id !== columnId));
      setRows((prev) =>
        prev.map((r) => {
          if (!r.customValues) return r;
          const { [columnId]: _removed, ...rest } = r.customValues;
          return { ...r, customValues: rest };
        }),
      );
      setColWidths((prev) => {
        const { [columnId]: _, ...rest } = prev;
        return rest;
      });
      setDeleteColumnId(null);
      showToast("success", "Column deleted", `"${col.name}" removed.`);
    },
    [customColumns, showToast],
  );

  const handleUpdateCustomValue = useCallback((rowId, columnId, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          customValues: { ...(r.customValues || {}), [columnId]: value },
        };
      }),
    );
  }, []);

  const handleColResizeStart = useCallback((colId, startX, currentWidth) => {
    setResizingColId(colId);
    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(
        Math.max(currentWidth + delta, MIN_CUSTOM_COL_WIDTH),
        MAX_CUSTOM_COL_WIDTH,
      );
      setColWidths((prev) => ({ ...prev, [colId]: newWidth }));
    };
    const handleMouseUp = () => {
      setResizingColId(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // ═══════════════════════════════════════════════════════
  // Excel handling
  // ═══════════════════════════════════════════════════════
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

      const json = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      if (!json.length) throw new Error("The Excel sheet is empty.");

      const { extras } = analyzeExcelColumns(json, customColumns);

      if (extras.length > 0) {
        setExtraColumnsPreview({ extras, rawJson: json, filename: f.name });
        e.target.value = "";
        return;
      }

      processExcelData(json, f.name, []);
    } catch (err) {
      setUploadStatus({
        type: "err",
        msg: `❌ Could not read the file: ${err.message}. Please check the column headers.`,
      });
      showToast("error", "Upload failed", err.message);
    }
    e.target.value = "";
  };

  const processExcelData = useCallback(
    (json, filename, selectedExtras = []) => {
      try {
        // Create new columns from extras
        const newColumns = [];
        const mergeMap = {};

        selectedExtras.forEach((extra) => {
          if (extra.willMerge && extra.existingColumnId) {
            mergeMap[extra.name] = extra.existingColumnId;
          } else {
            const newCol = {
              id: generateCustomColumnId(),
              name: extra.name,
              type: "text",
              width: DEFAULT_CUSTOM_COL_WIDTH,
              order: customColumns.length + newColumns.length,
              createdAt: new Date().toISOString(),
              createdBy: currentUserId,
            };
            newColumns.push(newCol);
            mergeMap[extra.name] = newCol.id;
          }
        });

        const allColumnsForImport = [...customColumns, ...newColumns];
        const localResources = getResources(groups, groupResources);

        let parsed = json.map((rec) => {
          const normalizedRec = buildNormalizedRec(rec);
          const pick = (keys) => pickFromNormalized(normalizedRec, keys);

          const moduleName = pick([
            "Module Name",
            "Module",
            "module",
            "MODULE",
          ]);
          const task = pick(["Task", "Task Name", "Activity", "task", "TASK"]);
          const resourceInput = String(
            pick([
              "Resource Code",
              "Resource",
              "User ID",
              "UserId",
              "Email",
              "resource",
            ]),
          ).trim();

          const plannedStartRaw = pick([
            "Planned Start (YYYY-MM-DD HH:mm)",
            "Planned Start",
            "Start",
            "planned start",
          ]);
          const durationRaw = pick([
            "Duration (hrs)",
            "Planned Duration (hrs)",
            "Duration",
            "Hours",
          ]);

          // Parse date
          let plannedStart = "";
          if (plannedStartRaw !== "" && plannedStartRaw != null) {
            let s;
            if (plannedStartRaw instanceof Date)
              s = isoDateTime(plannedStartRaw);
            else s = String(plannedStartRaw).trim();
            const hasTime = /\d{1,2}:\d{2}/.test(s);
            let m = s.match(
              /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})/,
            );
            if (m) {
              const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], 0, 0);
              plannedStart = isoDateTime(d);
            } else if (
              (m = s.match(
                /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s]+(\d{1,2}):(\d{2})/,
              ))
            ) {
              plannedStart = isoDateTime(
                new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0),
              );
            } else if ((m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/))) {
              plannedStart = isoDateTime(
                new Date(+m[3], +m[2] - 1, +m[1], WORK_START_HR, 0, 0, 0),
              );
            } else if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/))) {
              plannedStart = isoDateTime(
                new Date(+m[1], +m[2] - 1, +m[3], WORK_START_HR, 0, 0, 0),
              );
            } else {
              const d = new Date(s);
              if (!isNaN(d)) {
                if (!hasTime) d.setHours(WORK_START_HR, 0, 0, 0);
                plannedStart = isoDateTime(d);
              }
            }
          }

          // Resolve resource
          let validResource = "";
          if (resourceInput) {
            const byUserId = localResources.find(
              (r) => r.userId.toLowerCase() === resourceInput.toLowerCase(),
            );
            if (byUserId) validResource = byUserId.userId;
            else {
              const codeUpper = resourceInput.toUpperCase();
              const matches = localResources.filter(
                (r) => r.code === codeUpper,
              );
              if (matches.length === 1) validResource = matches[0].userId;
            }
          }

          const dur =
            durationRaw === "" || durationRaw == null
              ? ""
              : Number(durationRaw) || "";

          // Custom values
          const customValues = {};
          allColumnsForImport.forEach((col) => {
            const val = pick([col.name]);
            const strVal = String(val || "").trim();
            customValues[col.id] = strVal.slice(0, MAX_CUSTOM_COL_CHARS);
          });

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
            customValues,
            dependsOn: [],
          };
        });

        parsed = parsed.filter((r) => {
          const hasBase = r.module || r.task || r.resource || r.durationHrs;
          const hasCustom = Object.values(r.customValues || {}).some(
            (v) => v && String(v).trim().length > 0,
          );
          return hasBase || hasCustom;
        });

        if (!parsed.length)
          throw new Error("No valid rows found in the Excel file.");

        const synced = syncModuleIds(parsed, moduleRegistry);
        setModuleRegistry(synced.registry);

        if (newColumns.length > 0) {
          setCustomColumns((prev) => [...prev, ...newColumns]);
        }

        setRows(recomputeRows(synced.rows));
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

        const importedColsMsg =
          selectedExtras.length > 0
            ? ` + ${newColumns.length} new column${newColumns.length !== 1 ? "s" : ""}`
            : "";

        setUploadStatus({
          type: "ok",
          msg: ` Loaded <b>${filename}</b> — ${parsed.length} activities imported${importedColsMsg}${
            unmapped > 0
              ? `. <span style="color:${t.warning}">${unmapped} resource(s) didn't match and were cleared.</span>`
              : "."
          }`,
        });

        showToast(
          "success",
          "File imported",
          `${parsed.length} activities loaded${importedColsMsg}`,
        );
      } catch (err) {
        setUploadStatus({
          type: "err",
          msg: `❌ Processing failed: ${err.message}`,
        });
        showToast("error", "Import failed", err.message);
      }
    },
    [
      customColumns,
      currentUserId,
      groups,
      groupResources,
      moduleRegistry,
      recomputeRows,
      showToast,
      t.warning,
    ],
  );

  const handleDownloadTemplate = () => {
    const baseCols = [
      "Module Name",
      "Task",
      "Resource Code (or User ID / Email)",
      "Planned Start (YYYY-MM-DD HH:mm)",
      "Duration (hrs)",
    ];
    const customCols = sortedCustomColumns.map((col) => col.name);
    const allCols = [...baseCols, ...customCols];
    const blank = [
      allCols,
      ...Array.from({ length: 5 }, () => Array(allCols.length).fill("")),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(blank);
    const colWidthsExcel = [
      { wch: 22 },
      { wch: 36 },
      { wch: 20 },
      { wch: 28 },
      { wch: 14 },
    ];
    sortedCustomColumns.forEach(() => colWidthsExcel.push({ wch: 22 }));
    ws["!cols"] = colWidthsExcel;

    XLSX.utils.book_append_sheet(wb, ws, "Activities");
    const suffix =
      sortedCustomColumns.length > 0
        ? `_with_${sortedCustomColumns.length}_custom_cols`
        : "";
    XLSX.writeFile(wb, `Activity_Tracker_Template${suffix}.xlsx`);

    showToast(
      "success",
      "Template downloaded",
      sortedCustomColumns.length > 0
        ? `Template includes ${sortedCustomColumns.length} custom column${sortedCustomColumns.length !== 1 ? "s" : ""}.`
        : "Fill and re-upload to import activities.",
    );
  };

  const handleExport = () => {
    const ordered = flattenOrdered(rows);
    const out = ordered.map((r) => {
      const resObj = r.resource
        ? getResourceByUserId(r.resource, groups, groupResources)
        : null;
      const baseRow = {
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
      };
      sortedCustomColumns.forEach((col) => {
        baseRow[col.name] = r.customValues?.[col.id] || "";
      });
      baseRow["Comments"] = (r.comments || [])
        .map((c) => `[${c.author}] ${c.description}`)
        .join(" | ");
      return baseRow;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(out);
    const colWidthsExcel = [
      { wch: 15 },
      { wch: 22 },
      { wch: 36 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 14 },
    ];
    sortedCustomColumns.forEach(() => colWidthsExcel.push({ wch: 22 }));
    colWidthsExcel.push({ wch: 50 });
    ws["!cols"] = colWidthsExcel;

    XLSX.utils.book_append_sheet(wb, ws, "Activities");
    const filename = buildExportFilename(project);
    XLSX.writeFile(wb, filename);
    showToast("success", "Exported", `Downloaded as ${filename}`);
  };

  // ═══════════════════════════════════════════════════════
  // Filtered rows + sections
  // ═══════════════════════════════════════════════════════
  const orderedRows = useMemo(() => flattenOrdered(rows), [rows]);

  const filteredRows = useMemo(() => {
    let result = orderedRows;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matched = new Set();
      result.forEach((r) => {
        const inHardcoded =
          (r.module || "").toLowerCase().includes(q) ||
          (r.task || "").toLowerCase().includes(q);
        let inCustom = false;
        if (r.customValues) {
          for (const val of Object.values(r.customValues)) {
            if (
              String(val || "")
                .toLowerCase()
                .includes(q)
            ) {
              inCustom = true;
              break;
            }
          }
        }
        if (inHardcoded || inCustom) {
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

    const hasColumnFilter =
      columnFilters.module.length > 0 ||
      columnFilters.task.trim() !== "" ||
      columnFilters.resource.length > 0 ||
      columnFilters.status.length > 0;

    if (hasColumnFilter) {
      const matched = new Set();
      result.forEach((r) => {
        let pass = true;
        if (
          columnFilters.module.length > 0 &&
          !columnFilters.module.includes(r.module || "")
        )
          pass = false;
        if (columnFilters.task.trim()) {
          const q = columnFilters.task.toLowerCase();
          if (!(r.task || "").toLowerCase().includes(q)) pass = false;
        }
        if (
          columnFilters.resource.length > 0 &&
          !columnFilters.resource.includes(r.resource || "")
        )
          pass = false;
        if (columnFilters.status.length > 0) {
          const rowStatus = r.status || "Pending";
          if (!columnFilters.status.includes(rowStatus)) pass = false;
        }
        if (pass) {
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

    return result;
  }, [orderedRows, searchTerm, columnFilters, rows]);

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
  // ═══════════════════════════════════════════════════════
  // Dependency handlers
  // ═══════════════════════════════════════════════════════

  const handleSaveDependencies = useCallback(
    async (newDependsOnIds) => {
      if (!depPickerRow) return;
      setIsSavingDeps(true);
      try {
        setRows((prev) =>
          prev.map((r) =>
            r.id === depPickerRow.id ? { ...r, dependsOn: newDependsOnIds } : r,
          ),
        );
        const count = newDependsOnIds.length;
        showToast(
          "success",
          "Dependencies updated",
          count === 0
            ? "All dependencies removed."
            : `${count} dependenc${count === 1 ? "y" : "ies"} saved.`,
        );
        setDepPickerRow(null);
      } catch (err) {
        showToast("error", "Failed to save dependencies", err.message);
      } finally {
        setIsSavingDeps(false);
      }
    },
    [depPickerRow, showToast],
  );

  const handleOpenDependencies = useCallback((row) => {
    setDepPickerRow(row);
  }, []);

  const handleViewSuccessors = useCallback((row) => {
    setSuccessorViewRow(row);
  }, []);
  const isFirstInChain = useCallback(
    (row) => {
      if (!row.resource) return true;
      const moduleKey = row.moduleId || row.module || "__no_module__";
      const chain = flattenOrdered(rows).filter((r) => {
        const rModuleKey = r.moduleId || r.module || "__no_module__";
        return r.resource === row.resource && rModuleKey === moduleKey;
      });
      return chain[0]?.id === row.id;
    },
    [rows],
  );

  const hasChildrenFn = useCallback(
    (rowId) => rows.some((c) => c.parentId === rowId),
    [rows],
  );

  // Stats
  const total = rows.length;
  const assigned = rows.filter((r) => r.resource).length;
  const unassigned = total - assigned;
  const totalComments = rows.reduce((s, r) => s + (r.comments || []).length, 0);
  const allTasksDone = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((r) => {
        const s = String(r.status || "")
          .toLowerCase()
          .trim();
        return s === "completed" || s === "finished";
      }),
    [rows],
  );

  const showTable = rows.length > 0 || groups.length > 0;
  const showEmpty = !showTable;

  // *** END OF PART A — PART B FOLLOWS IN NEXT MESSAGE ***
  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        minHeight: "100vh",
        background: t.bgApp,
        color: t.textPrimary,
      }}
    >
      <div
        style={{
          padding: "16px 20px 32px",
          maxWidth: 1600,
          margin: "0 auto",
        }}
      >
        {/* ── Back button banner ── */}
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button onClick={onBack} style={btnStyle}>
            <ArrowLeft size={14} /> Back to Drafts
          </button>

          <div style={{ fontSize: 12, color: t.textMuted, marginLeft: 4 }}>
            Editing:{" "}
            <strong style={{ color: t.textPrimary }}>
              {project || "Untitled Project"}
            </strong>
          </div>

          {/* Status badge */}
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

          {isCoAssigner && (
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
              title={`Owned by ${projectOwnerId}`}
            >
              <Handshake size={11} />
              Co-Assigner
            </span>
          )}

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

        {/* ── Sub-Tab Bar ── */}
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
        </div>

        {/* ══ ACTIVITIES VIEW ══ */}
        {view === "activities" && (
          <>
            {/* Close Project button */}
            {motionSubmitted &&
              draft.status !== "closed" &&
              allTasksDone &&
              canDeleteProject(currentUserProjectRole) && (
                <button
                  onClick={() => setCloseProjectOpen(true)}
                  style={{
                    ...btnStyle,
                    marginLeft: "auto",
                    background: t.dangerBgSubtle,
                    color: t.danger,
                    borderColor: t.dangerBorder,
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
                  background: t.violetBg,
                  color: t.violet,
                  borderColor: t.violetBorder,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Star size={14} fill={t.violet} />
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
                <div>
                  <label style={labelStyle}>
                    Project Name <span style={{ color: t.danger }}>*</span>
                  </label>
                  <input
                    value={project}
                    onChange={(e) => isEditable && setProject(e.target.value)}
                    placeholder="e.g. ThingWorx — Adity FRP"
                    disabled={!isEditable}
                    style={{
                      ...inputStyle,
                      opacity: !isEditable ? 0.65 : 1,
                      cursor: !isEditable ? "not-allowed" : "text",
                      background: !isEditable ? t.bgInputDisabled : t.bgInput,
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    PO No <span style={{ color: t.danger }}>*</span>
                  </label>
                  <input
                    value={po}
                    onChange={(e) => isEditable && setPo(e.target.value)}
                    placeholder="e.g. PO-20240092"
                    disabled={!isEditable}
                    style={{
                      ...inputStyle,
                      opacity: !isEditable ? 0.65 : 1,
                      cursor: !isEditable ? "not-allowed" : "text",
                      background: !isEditable ? t.bgInputDisabled : t.bgInput,
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Site / Customer <span style={{ color: t.danger }}>*</span>
                  </label>
                  <input
                    value={site}
                    onChange={(e) => isEditable && setSite(e.target.value)}
                    placeholder="e.g. Hindalco — Unit 2"
                    disabled={!isEditable}
                    style={{
                      ...inputStyle,
                      opacity: !isEditable ? 0.65 : 1,
                      cursor: !isEditable ? "not-allowed" : "text",
                      background: !isEditable ? t.bgInputDisabled : t.bgInput,
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Group(s) <span style={{ color: t.danger }}>*</span>
                  </label>
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

                <div>
                  <label style={labelStyle}>Template</label>
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

                <div>
                  <label style={labelStyle}>Activity Sheet</label>
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

            {/* Empty state */}
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
                      gap: 8,
                      marginLeft: "auto",
                    }}
                  >
                    <div style={{ position: "relative", width: 200 }}>
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
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      tableLayout: "fixed",
                      minWidth: 1400,
                    }}
                  >
                    <thead>
                      <tr style={{ background: t.bgSubtle }}>
                        {(() => {
                          const baseColumns = [
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
                              width: 215,
                              align: "left",
                              filterKey: null,
                              isPlannedStart: true,
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
                              width: 150,
                              align: "center",
                              filterKey: "status",
                            },
                          ];
                          const customColumnDefs = sortedCustomColumns.map(
                            (col) => ({
                              label: col.name.toUpperCase(),
                              width: getColWidth(col.id),
                              align: "left",
                              filterKey: null,
                              isCustom: true,
                              columnDef: col,
                            }),
                          );
                          const actionsColumn = {
                            label: "ACTIONS",
                            width: 130,
                            align: "center",
                            filterKey: null,
                          };
                          const allColumns = [
                            ...baseColumns,
                            ...customColumnDefs,
                            actionsColumn,
                          ];

                          return allColumns.map((col) => (
                            <th
                              key={
                                col.isCustom
                                  ? `custom-${col.columnDef.id}`
                                  : col.label
                              }
                              style={{
                                width: col.width,
                                minWidth: col.width,
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
                                  position: "relative",
                                }}
                              >
                                <span
                                  title={
                                    col.isCustom
                                      ? col.columnDef.name
                                      : col.label
                                  }
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {col.label}
                                </span>

                                {/* Custom column actions */}
                                {col.isCustom &&
                                  hasEditAccess &&
                                  draft.status !== "closed" && (
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        gap: 3,
                                        marginLeft: 4,
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          setRenameColumnId(col.columnDef.id)
                                        }
                                        title="Rename column"
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 4,
                                          border: `1px solid ${t.border}`,
                                          background: t.bgCard,
                                          color: t.textMuted,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: 0,
                                        }}
                                      >
                                        <Edit size={10} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setDeleteColumnId(col.columnDef.id)
                                        }
                                        title="Delete column"
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 4,
                                          border: `1px solid ${t.dangerBorder}`,
                                          background: t.dangerBgSubtle,
                                          color: t.danger,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: 0,
                                        }}
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  )}

                                {/* Auto Calculate Toggle */}
                                {col.isPlannedStart && (
                                  <div
                                    onClick={() => setAutoCalculate((p) => !p)}
                                    title={
                                      autoCalculate
                                        ? "Auto-calculating start times"
                                        : "Enable auto-calculation"
                                    }
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      // gap: 5,
                                      // marginLeft: 6,
                                      // padding: "2px 6px",
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
                                          boxShadow:
                                            "0 1px 2px rgba(0,0,0,0.2)",
                                        }}
                                      />
                                    </span>
                                  </div>
                                )}

                                {/* Filters */}
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

                                {/* + Add Column button (after last column before Actions) */}
                                {(() => {
                                  const isLastBeforeActions =
                                    (customColumnDefs.length === 0 &&
                                      col.label === "STATUS") ||
                                    (customColumnDefs.length > 0 &&
                                      col.isCustom &&
                                      col.columnDef.id ===
                                        sortedCustomColumns[
                                          sortedCustomColumns.length - 1
                                        ].id);
                                  if (!isLastBeforeActions) return null;
                                  if (
                                    !hasEditAccess ||
                                    draft.status === "closed"
                                  )
                                    return null;
                                  return (
                                    <button
                                      onClick={() => setAddColumnOpen(true)}
                                      title="Add custom column"
                                      style={{
                                        marginLeft: 6,
                                        width: 22,
                                        height: 22,
                                        borderRadius: 5,
                                        border: `1px dashed ${t.violet}`,
                                        background: t.violetBg,
                                        color: t.violet,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                        fontWeight: 700,
                                      }}
                                    >
                                      <Plus size={12} />
                                    </button>
                                  );
                                })()}

                                {/* Resize handle */}
                                {col.isCustom && (
                                  <div
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleColResizeStart(
                                        col.columnDef.id,
                                        e.clientX,
                                        col.width,
                                      );
                                    }}
                                    style={{
                                      position: "absolute",
                                      right: -5,
                                      top: -11,
                                      bottom: -11,
                                      width: 8,
                                      cursor: "col-resize",
                                      background:
                                        resizingColId === col.columnDef.id
                                          ? t.primary
                                          : "transparent",
                                      zIndex: 20,
                                    }}
                                  />
                                )}
                              </div>
                            </th>
                          ));
                        })()}
                      </tr>
                    </thead>

                    <tbody>
                      {!filteredRows.length ? (
                        <tr>
                          <td
                            colSpan={9 + sortedCustomColumns.length}
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
                          let displayIdx = 0;

                          return (
                            <React.Fragment key={mod || "unnamed"}>
                              {modRows.map((r) => {
                                if (r.sortOrder === 0 || r._depth === 0)
                                  displayIdx++;
                                return (
                                  <ActivityRow
                                    draft={draft}
                                    key={r.id}
                                    row={r}
                                    idx={displayIdx}
                                    isFirstInChain={isFirstInChain(r)}
                                    resources={resources}
                                    groupResources={groupResources}
                                    hasChildren={hasChildrenFn(r.id)}
                                    parentRow={
                                      r.parentId
                                        ? rows.find((p) => p.id === r.parentId)
                                        : null
                                    }
                                    moduleColor={getModuleColor(
                                      r.module,
                                      moduleColorMap,
                                    )}
                                    isOverlapping={overlapRowIds.has(r.id)}
                                    autoCalculate={autoCalculate}
                                    customColumns={sortedCustomColumns}
                                    colWidths={colWidths}
                                    allRows={rows} // ← NEW
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
                                    onFeedback={setFeedbackRow}
                                    onUpdateCustomValue={
                                      handleUpdateCustomValue
                                    }
                                    onOpenDependencies={handleOpenDependencies} // ← NEW
                                    onViewSuccessors={handleViewSuccessors} // ← NEW
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

            {/* ── Save / Publish Footer ── */}
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

              <button
                onClick={handleSaveDraftClick}
                disabled={
                  isSaving || motionSubmitted || draft.status === "closed"
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
                      ? t.bgMuted
                      : t.bgCard,
                  color:
                    motionSubmitted || draft.status === "closed"
                      ? t.textFaint
                      : t.textSecondary,
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
                    <Save size={14} /> Save Draft
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

            {/* Footer stats */}
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
              ].map((s, i) => (
                <span
                  key={i}
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
                  color: t.textFaint,
                }}
              >
                <span>
                  Project:{" "}
                  <strong style={{ color: t.textSecondary }}>
                    {project || "—"}
                  </strong>
                </span>
                <span style={{ color: t.border }}>|</span>
                <span>
                  PO:{" "}
                  <strong style={{ color: t.textSecondary }}>
                    {po || "—"}
                  </strong>
                </span>
              </div>
            </div>
          </>
        )}

        {/* ══ GANTT VIEW ══ */}
        {view === "gantt" && (
          <>
            {rows.length > 0 ? (
              <GanttView
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

        {/* ══ UPDATES VIEW ══ */}
        {view === "updates" && (
          <ProjectUpdatesView
            projectId={draft.id}
            currentUserId={currentUserId}
            projectOwnerId={projectOwnerId}
            showToast={showToast}
            readOnly={draft.status === "closed"}
            projectName={project}
          />
        )}
      </div>

      {/* ══ MODALS ══ */}
      {openCommentDialog && newComment && (
        <CommentsActionDialog
          open={openCommentDialog}
          onClose={() => setOpenCommentDialog(false)}
          existingComments={existingComments}
          setExistingComments={setExistingComments}
          newComment={newComment}
          setNewComment={setNewComment}
          allowActions={draft.status !== "closed"}
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
          warnings={validationWarnings}
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
          onAddCoAssigner={handleAddCoAssigner}
          onRemoveCoAssigner={handleRemoveCoAssigner}
        />
      )}

      {addColumnOpen && (
        <AddColumnModal
          mode="add"
          existingColumns={customColumns}
          onClose={() => setAddColumnOpen(false)}
          onConfirm={handleAddColumn}
        />
      )}

      {renameColumnId && (
        <AddColumnModal
          mode="rename"
          initialName={
            customColumns.find((c) => c.id === renameColumnId)?.name || ""
          }
          existingColumns={customColumns}
          excludeId={renameColumnId}
          onClose={() => setRenameColumnId(null)}
          onConfirm={(newName) => handleRenameColumn(renameColumnId, newName)}
        />
      )}

      {deleteColumnId && (
        <ConfirmDeleteColumnModal
          column={customColumns.find((c) => c.id === deleteColumnId)}
          rowCount={rows.length}
          filledCount={columnFilledCounts[deleteColumnId] || 0}
          onClose={() => setDeleteColumnId(null)}
          onConfirm={() => handleDeleteColumn(deleteColumnId)}
        />
      )}

      {extraColumnsPreview && (
        <ExtraColumnsPreviewModal
          extras={extraColumnsPreview.extras}
          onClose={() => {
            processExcelData(
              extraColumnsPreview.rawJson,
              extraColumnsPreview.filename,
              [],
            );
            setExtraColumnsPreview(null);
          }}
          onConfirm={(selectedExtras) => {
            processExcelData(
              extraColumnsPreview.rawJson,
              extraColumnsPreview.filename,
              selectedExtras,
            );
            setExtraColumnsPreview(null);
          }}
        />
      )}

      {/* Dependency picker */}
      {depPickerRow && (
        <DependencyPickerModal
          row={depPickerRow}
          rows={rows}
          onClose={() => !isSavingDeps && setDepPickerRow(null)}
          onSave={handleSaveDependencies}
          isSaving={isSavingDeps}
        />
      )}

      {/* Successor viewer (read-only DependencyPickerModal in reverse) */}
      {successorViewRow && (
        <SuccessorViewerModal
          row={successorViewRow}
          rows={rows}
          onClose={() => setSuccessorViewRow(null)}
          onOpenDependencies={(r) => {
            setSuccessorViewRow(null);
            setDepPickerRow(r);
          }}
        />
      )}
    </div>
  );
}
