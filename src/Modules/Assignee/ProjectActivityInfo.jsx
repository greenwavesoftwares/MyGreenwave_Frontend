import React, { useEffect, useMemo, useState } from "react";
import "./assignee-theme.css"; // REFACTOR: tokens moved out of ProjectActivityInfo.css
import "./ProjectActivityInfo.css";
import TreeRows from "./TreeRows";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import CommentsActionDialog from "./CommentsActionDialog";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { addComment } from "./AssigneeHelper";
import { getUserData } from "../Login/Encrypt";
import StatusChip from "./StatusChip";
import CpmDialog from "./CpmDialog";
import { showToast } from "./toastService";
import { ArrowLeft, BookOpen } from "lucide-react";
import FeedbackModal from "../../Test Ground/FeedbackModal";
import ProjectActivitiesSkeleton from "./ProjectActivitiesSkeleton";
import PauseReasonDialog from "./PauseReasonDialog";
import ProjectDocumentation from "./ProjectDocumentation";
import ColumnFilterButton, {
  DateRangeFilterButton,
  MobileFiltersSheet,
  DATE_RANGE_BUCKETS,
} from "./ColumnFilter";
import {
  filterTree,
  computeFilterOptions,
  flattenNodes,
} from "./activityFilterUtils";

dayjs.extend(isBetween); // ← add this

/* ── responsive layout helper ──
   Below this width the activities table stops being usable — 9+ columns
   of planned/actual timestamps just don't fit a phone screen, no matter
   how much horizontal scrolling you allow. Rather than shrink the table
   further, below the breakpoint we swap it for a stacked card list (see
   TreeRows' `isMobile` prop) and move the per-column filters into a
   single scrollable filter bar above the list. */
const MOBILE_BREAKPOINT = "(max-width: 860px)";

function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia(MOBILE_BREAKPOINT).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return isMobile;
}

/* ── helpers ── */
function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/* ── main component ── */
export default function ProjectActivityInfo({
  selectedProject,
  setSelectedProject,
}) {
  const isMobile = useIsMobileLayout();
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState({}); // { fieldKey: Set(values) }
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [activityInfo, setActivityInfo] = useState(null);
  const [openCommentsDialog, setOpenCommentsDialog] = useState(null);
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState(null);
  const [newComment, setNewComment] = useState(null);
  const [allowActions, setAllowActions] = useState(true);
  const [commentActivityName, setCommentActivityName] = useState(null);
  const [commentActivityStatus, setCommentActivityStatus] = useState(null);
  const [openFeedback, setFeedback] = useState(false);
  const [openFeedbackRow, setOpenFeedbackRow] = useState(null);
  const [openCpm, setOpenCpm] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const currentUserId = getUserData()?.userDetails?.userId;
  const currentUserName = getUserData()?.userDetails?.userName;
  const [resourceColor, setResourceColor] = useState({});
  const [loading, setLoading] = useState(true);
  const [pauseDelayTarget, setPauseDelayTarget] = useState(null); // { activityId, activity }
  const [pauseDelayLoading, setPauseDelayLoading] = useState(false);
  // Tracks in-flight API calls that are triggered from row-level buttons
  // (start/complete/restart/resume, submit sub-activity, open comments),
  // keyed per-activity so only the button that started the call shows a
  // loader/disabled state — not every row on the page.
  const [loadingKeys, setLoadingKeys] = useState(() => new Set());

  const startLoading = (key) =>
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

  const stopLoading = (key) =>
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  const WORK_START = 10;
  const WORK_END = 18;
  const WEEK_END = [0, 6];

  /* ── tree helpers ── */
  const addDuration = (startTime, durationHrs) =>
    dayjs(startTime).add(durationHrs, "hour").toISOString();

  const calculatePlannedStart = (parent) => {
    const children = parent.children || [];
    if (!children.length) return parent.plannedStart;
    const total = children.reduce(
      (s, c) => s + (Number(c.durationHrs) || 0),
      0,
    );
    return addDuration(parent.plannedStart, total);
  };

  const addChildNode = (parent) => {
    setActivityInfo((prev) => ({
      ...prev,
      modules: addRecursively(prev.modules),
    }));
    // Functional update so we never overwrite a newer `expanded` with the
    // copy captured when this handler was created.
    setExpanded((prev) => ({ ...prev, [parent.id]: true }));

    function generateRowId() {
      // Use native crypto.randomUUID (all modern browsers + Node 19+)
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for older environments
      return `row_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    function addRecursively(nodes) {
      return nodes.map((node) => {
        if (node.id === parent.id) {
          const existing = node.children || [];
          const allocated = existing.reduce(
            (s, c) => s + (Number(c.durationHrs) || 0),
            0,
          );
          const plannedStart = parent.plannedStart; //calculatePlannedStart(parent)
          const plannedStop = parent.plannedStop; //addDuration(plannedStart,durationHrs)
          // const durationHrs = dayjs(plannedStop).diff(dayjs(plannedStart), "hour")

          const newNode = {
            id: generateRowId(),
            type: parent.type === "MODULE" ? "ACTIVITY" : "SUBACTIVITY",
            parentId: parent.id,
            name: "",
            moduleName: parent.moduleName,
            resource: currentUserId,
            resourceName: currentUserName,
            plannedStart: plannedStart,
            plannedStop: plannedStart,
            durationHrs: 0,
            actualStart: "",
            actualStop: "",
            actualElapsed: "",
            pauseStart: "",
            pauseDuration: "",
            activityStatus: "Not Ready",
            priority: "Medium",
            progress: 0,
            children: [],
            // Draft row that only exists in the browser until it is
            // submitted. filterTree always keeps these visible, otherwise an
            // active search/column filter (a draft has no status, no name
            // yet) silently hides the row that was just added.
            _unsaved: true,
          };
          return { ...node, children: [...existing, newNode] };
        }
        if (node.children?.length)
          return { ...node, children: addRecursively(node.children) };
        return node;
      });
    }

    showToast(
      "info",
      "Draft sub-activity added",
      "Enter a name and click the Submit (send) icon on the new row to save it.",
    );

    // setExpanded((prev) => ({ ...prev, [parent.id]: true }));
  };

  const deleteNode = (projectId, moduleId, nodeToDelete) => {
    setActivityInfo((prev) => ({
      ...prev,
      modules: deleteRecursively(prev.modules, nodeToDelete.id),
    }));

    showToast("error", "Activity", "SubActivity deleted");
  };

  function deleteRecursively(nodes, nodeId) {
    return nodes
      .filter((node) => node.id !== nodeId) // remove matching node
      .map((node) => ({
        ...node,
        children: node.children?.length
          ? deleteRecursively(node.children, nodeId)
          : [],
      }));
  }
  const countActivities = (nodes) => {
    return nodes.reduce((count, node) => {
      const selfCount =
        node.type !== "MODULE" && node.resource === currentUserId ? 1 : 0;
      const childCount =
        node.children?.length > 0 ? countActivities(node.children) : 0;
      return count + selfCount + childCount;
    }, 0);
  };
  const onOpenCommentBox = async (
    projectId,
    activityId,
    moduleId,
    status,
    activityName,
    activityStatus,
  ) => {
    const loadingKey = `comment-${activityId}`;
    startLoading(loadingKey);
    try {
      const existingCommentsResp =
        await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
          projectId,
          activityId,
        );

      console.log("Existing comments and replies::", existingCommentsResp);
      const newCommentBody = addComment(projectId, activityId, moduleId);
      if (status.toLowerCase() !== "finished") setAllowActions(true);
      else setAllowActions(false);
      setCommentActivityName(activityName);
      setCommentActivityStatus(activityStatus);
      setExistingComments(existingCommentsResp);
      setNewComment(newCommentBody);
      setOpenCommentDialog(true);
    } catch (e) {
      showToast("error", "Error", "Error in fetching comment");
    } finally {
      stopLoading(loadingKey);
    }
  };
  const onCloseCommentbox = () => {
    fetchActivities();
    setOpenCommentDialog(false);
    setExistingComments(null);
    setNewComment(null);
    setAllowActions(null);
  };
  const onOpenFeedbackForm = (node) => {
    console.log("Node:", node);
    setOpenFeedbackRow(node);
    setFeedback(true);
  };
  const onCloseFeedbackForm = () => {
    setOpenFeedbackRow(null);
    setFeedback(false);
  };
  const totalActivities = useMemo(
    () => (activityInfo?.modules ? countActivities(activityInfo.modules) : 0),
    [activityInfo],
  );
  const handleFieldChange = (id, updates) => {
    console.log("Handle field change: ", updates);
    console.log("Activity info::", activityInfo);
    setActivityInfo((prev) => ({
      ...prev,
      modules: updateNode(prev.modules, id, updates),
    }));
  };

  const updateNode = (nodes, id, updates) => {
    console.log("Nodes:::", nodes);
    return nodes.map((node) => {
      if (node.id === id) return { ...node, ...updates };
      if (node.children?.length)
        return { ...node, children: updateNode(node.children, id, updates) };
      return node;
    });
  };

  /* Some API wrappers (e.g. plain fetch) RESOLVE on HTTP 4xx/5xx instead of
     throwing, which used to produce a "SubActivity added" toast for a row
     that was never saved. Treat those responses as failures. */
  const isFailedResponse = (res) =>
    !!res &&
    (res.ok === false ||
      res.success === false ||
      (typeof res.status === "number" &&
        res.status >= 400 &&
        "statusText" in res));

  const findNodeById = (nodes, id) =>
    flattenNodes(nodes).find((n) => n.id === id) || null;

  const submitAddedNode = async (projectId, moduleId, activityData) => {
    const name = activityData?.name?.trim();
    if (!name) {
      showToast("error", "Error", "Activity Name is required");
      return;
    }
    const loadingKey = `submit-${activityData.id}`;
    if (loadingKeys.has(loadingKey)) return; // already submitting (double click)

    const payload = mapToActivityPayload(activityData, projectId, moduleId);

    // How many already-saved siblings the parent has now (the unsaved
    // temporary row is excluded), so we can tell afterwards whether the
    // server really added one.
    const parentBefore = findNodeById(
      activityInfo?.modules,
      activityData.parentId,
    );
    const savedBefore = (parentBefore?.children || []).filter(
      (c) => c.id !== activityData.id,
    ).length;

    startLoading(loadingKey);
    try {
      const response = await activityTrackerApi.createActivity(
        projectId,
        payload,
      );
      console.log("createActivity response::", response);
      if (isFailedResponse(response)) {
        throw new Error(
          response?.message || `Server responded with ${response?.status}`,
        );
      }

      // Replace the temporary local row with what the server really has.
      const fresh = await fetchActivities();

      // Confirm the server actually persisted it before claiming success.
      const freshParent = findNodeById(fresh?.modules, activityData.parentId);
      const freshChildren = freshParent?.children || [];
      const saved =
        freshChildren.find((c) => c.id === activityData.id) ||
        (freshChildren.length > savedBefore
          ? freshChildren.find(
              (c) => c.name?.trim() === name && c.id !== activityData.id,
            )
          : null);

      if (!saved) {
        console.error("SubActivity not found in refetched tree", {
          payload,
          freshParent,
        });
        showToast(
          "error",
          "Error",
          "SubActivity was not saved by the server. Please try again.",
        );
        return;
      }

      // Make sure the parent is open so the new row is actually visible.
      setExpanded((prev) => ({ ...prev, [activityData.parentId]: true }));

      // Saved, but an active search/filter may hide it — say so instead of
      // leaving the user thinking nothing happened.
      const visible = filterTree(fresh.modules, search, columnFilters);
      if (!findNodeById(visible, saved.id)) {
        showToast(
          "info",
          "SubActivity added",
          "It is hidden by the current search/filters. Clear them to see it.",
        );
      } else {
        showToast("success", "Success", "SubActivity added");
      }
    } catch (e) {
      console.log("Error:", e);
      showToast("error", "Error", "Error in adding SubActivity");
    } finally {
      stopLoading(loadingKey);
    }
  };

  const mapToActivityPayload = (node, projectId, moduleId) => ({
    activityId: node.id,
    projectId: projectId,
    moduleId: moduleId,
    activityName: node.name?.trim(),
    parentActivityId: node.parentId,
    resourceName: node.resourceName,
    resourceId: node.resource, // email used as resourceId
    plannedStart: node.plannedStart,
    durationHrs: node.durationHrs,
    plannedStop: node.plannedStop,
    activityStatus: "Pending",
    actualStart: node.actualStart || null,
    actualStop: node.actualStop || null,
    actualElapsedHrs: node.actualElapsed
      ? parseFloat(node.actualElapsed)
      : null,
    sortOrder: 1, // no equivalent in source, default 0
    createdAt: new Date().toISOString(),
    createdBy: currentUserId, // assuming creator = assigned resource
    creatorType: "Assignee", // "SUBTASK" → creatorType,
    // ,dependsOn:""
  });
  const countTasks = (nodes) => {
    let count = 0;
    const traverse = (items) =>
      items?.forEach((item) => {
        if (item.type !== "MODULE") count++;
        if (item.children?.length) traverse(item.children);
      });
    traverse(nodes);
    return count;
  };
  const calculateWorkingHours = (start, end, leaves) => {
    const startDate = dayjs(start);
    const endDate = dayjs(end);

    const startHour = startDate.hour() + startDate.minute() / 60;
    const endHour = endDate.hour() + endDate.minute() / 60;

    // Same day
    if (startDate.isSame(endDate, "day")) {
      if (WEEK_END.includes(startDate.day())) return 0;

      return Math.max(
        0,
        Math.min(endHour, WORK_END) - Math.max(startHour, WORK_START),
      );
    }

    let workingDaysBetween = 0;
    let current = startDate.add(1, "day");

    while (current.isBefore(endDate, "day")) {
      if (!WEEK_END.includes(current.day())) {
        workingDaysBetween++;
      }
      current = current.add(1, "day");
    }

    const leaveDays = leaves.reduce((count, leave) => {
      return dayjs(leave).isBetween(startDate, endDate, "day", "()")
        ? count + 1
        : count;
    }, 0);

    const firstDayHours = WEEK_END.includes(startDate.day())
      ? 0
      : Math.max(0, WORK_END - Math.max(startHour, WORK_START));

    const lastDayHours = WEEK_END.includes(endDate.day())
      ? 0
      : Math.max(0, Math.min(endHour, WORK_END) - WORK_START);

    return (
      firstDayHours +
      lastDayHours +
      (workingDaysBetween - leaveDays) * (WORK_END - WORK_START)
    );
  };
  const calculateDuration = async (activity, actualTime) => {
    console.log("Inside calculate duration");
    const leavesOfEmployee =
      await activityTrackerApi.getLeavesWithHolidaysByUserId(currentUserId);

    const leaves = leavesOfEmployee?.[0]?.leaves ?? [];

    let totalWorkingHours = calculateWorkingHours(
      activity.actualStart,
      actualTime,
      leaves,
    );

    console.log("After calculating hours");
    const activityPauses = await activityTrackerApi.getActivityPauses(
      activity.id,
    );

    const totalPauseHours =
      activityPauses?.reduce((total, pause) => {
        return (
          total +
          calculateWorkingHours(
            pause.pauseStart,
            pause.resumeAt ?? actualTime,
            leaves,
          )
        );
      }, 0) ?? 0;
    console.log("After calculating pause hours");
    const activityRejections = await activityTrackerApi.getActivityRejections(
      activity.id,
    );
    const totalRejectionHours =
      activityRejections?.reduce((total, rejection) => {
        return (
          total +
          calculateWorkingHours(
            rejection.actualCompletionTime,
            actualTime,
            leaves,
          )
        );
      }, 0) ?? 0;

    console.log("Rejection Details::", totalRejectionHours);
    totalWorkingHours =
      totalWorkingHours - (totalPauseHours + totalRejectionHours);
    console.log("Working Hours:", totalWorkingHours);
    console.log("Pause Hours:", totalRejectionHours);

    return Math.max(0, totalWorkingHours);
  };
  const updateStatusOfActivity = async (
    activityId,
    status,
    activity,
    reason,
  ) => {
    const loadingKey = `status-${activityId}`;
    startLoading(loadingKey);
    try {
      console.log("Inside updateStatus");
      const actualTime = new Date();
      let duration = 0;
      if (status.toLowerCase() === "completed") {
        duration = await calculateDuration(activity, actualTime);
        console.log("Completed duration:", duration);
        console.log("After duration calculation");
      }
      const statusPayload = { status, actualTime, duration, reason };

      const response = await activityTrackerApi.updateActivityStatus(
        activityId,
        statusPayload,
      );
      showToast(
        "success",
        "Status Updated",
        `Activity ${statusPayload.status}`,
      );
      await fetchActivities();
    } catch (e) {
      showToast("error", "Error", "Error in status update");
    } finally {
      stopLoading(loadingKey);
    }
  };

  // Opens the pause-reason dialog instead of pausing immediately.
  const handlePauseDelayRequest = (activityId, activity, pauseDelayType) => {
    console.log("type::", pauseDelayType);
    setPauseDelayTarget({ activityId, activity, pauseDelayType });
  };

  const handlePauseDelayConfirm = async (reason) => {
    let status = null;
    if (pauseDelayTarget.pauseDelayType === "StartDelay") status = "Running";
    else if (pauseDelayTarget.pauseDelayType === "StopDelay")
      status = "Completed";
    else if (pauseDelayTarget.pauseDelayType === "Paused") status = "Paused";
    else if (pauseDelayTarget.pauseDelayType === "Redo") status = "Running";
    if (pauseDelayTarget) {
      setPauseDelayLoading(true);
      try {
        await updateStatusOfActivity(
          pauseDelayTarget.activityId,
          status,
          pauseDelayTarget.activity,
          reason,
        );
      } finally {
        setPauseDelayLoading(false);
      }
    }
    setPauseDelayTarget(null);
  };
  const totalTasks = useMemo(
    () => countTasks(activityInfo?.activities),
    [activityInfo],
  );

  /* ── search + column filters ──
     The matching/tree-walking logic lives in activityFilterUtils.js;
     here we just wire it up to this component's state. */
  const activityLookupMap = useMemo(() => {
    const map = {};
    const walk = (nodes) => {
      nodes?.forEach((n) => {
        map[n.id] = {
          name: n.name,
          activityStatus: n.activityStatus,
          resource: n.resource,
          plannedStart: n.plannedStart,
          plannedStop: n.plannedStop,
          actualStart: n.actualStart,
          actualStop: n.actualStop,
        };
        if (n.children?.length) walk(n.children);
      });
    };
    walk(activityInfo?.modules);
    return map;
  }, [activityInfo]);

  const filteredModules = useMemo(() => {
    if (!activityInfo?.modules) return [];
    return filterTree(activityInfo.modules, search, columnFilters);
  }, [activityInfo, search, columnFilters]);

  /* The Resource column filter matches on `resourceName` (the display
     value shown in the table/options list), not on the resource id. The
     logged-in user's own display name (currentUserName, from getUserData)
     isn't guaranteed to be byte-identical to what the backend put in
     resourceName for that user's rows — so instead of comparing names, we
     look up a row that's actually assigned to this user by id
     (node.resource === currentUserId, the same check used elsewhere, e.g.
     the "assigned to me" sort) and reuse that row's resourceName. That
     guarantees "Only me" always matches something in the filter's own
     option list.
     If the current user has no row at all in this tree, this resolves to
     undefined so the "Only me" option is hidden entirely (see currentUser
     prop on ColumnFilterButton) rather than showing an option that would
     always filter to an empty table. */
  const currentUserResourceName = useMemo(() => {
    if (!activityInfo?.modules) return undefined;
    const ownRow = flattenNodes(activityInfo.modules).find(
      (n) => n.type !== "MODULE" && n.resource === currentUserId,
    );
    return ownRow ? ownRow.resourceName || ownRow.resource : undefined;
  }, [activityInfo, currentUserId]);

  const setFilterForField = (field, valueSet) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!valueSet || valueSet.size === 0) delete next[field];
      else next[field] = valueSet;
      return next;
    });
  };

  /* Date-range quick filter (All/Last Month/Today/Current Month/Upcoming
     Month) for Planned Start/Stop and Actual Start/Stop. Only one bucket
     can be active per column, stored as columnFilters["<baseField><Bucket>"]
     = Set(["true"]) — see DATE_RANGE_FIELD_MAP in activityFilterUtils.js.
     These two helpers translate that storage into/out of the single
     "which bucket is selected" value the dropdown itself works with. */
  const getDateRangeValue = (baseField) =>
    DATE_RANGE_BUCKETS.find(({ key }) =>
      columnFilters[`${baseField}${key}`]?.has("true"),
    )?.key || null;

  const setDateRangeFilter = (baseField, bucketKey) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      DATE_RANGE_BUCKETS.forEach(
        ({ key }) => delete next[`${baseField}${key}`],
      );
      if (bucketKey) next[`${baseField}${bucketKey}`] = new Set(["true"]);
      return next;
    });
  };

  const activeFilterCount = Object.values(columnFilters).filter(
    (s) => s && s.size > 0,
  ).length;

  // Message shown in place of the table/card list when there's nothing to
  // display, worded differently depending on *why* it's empty: a search
  // term with no matches, one or more column filters with no matches,
  // both together, or — when neither is active — the activity list for
  // this project simply has no rows yet.
  const emptyStateMessage =
    search && activeFilterCount > 0
      ? `No activities match \u201c${search}\u201d and the selected filters`
      : search
        ? `No activities match \u201c${search}\u201d`
        : activeFilterCount > 0
          ? "No activities match the selected filters"
          : "No activities to display";

  const clearAllFilters = () => setColumnFilters({});

  /* options for every column's checkbox dropdown, built from the full
     unfiltered tree so choices don't disappear as other filters are applied */
  const filterOptions = useMemo(
    () =>
      computeFilterOptions(
        activityInfo?.modules,
        activityInfo?.customColumns,
        columnFilters,
      ),
    [activityInfo, columnFilters],
  );

  /* Sections for the consolidated mobile filters sheet (see
     MobileFiltersSheet in ColumnFilter.jsx) — same fields/handlers the
     old horizontally-scrolling chip row used, just described
     declaratively instead of as individual JSX buttons. Declared after
     filterOptions since it reads from it. */
  const mobileFilterSections = [
    {
      key: "module",
      label: "Module",
      color: "#7C3AED",
      type: "checklist",
      options: filterOptions.module,
      selected: columnFilters.module || new Set(),
      onChange: (set) => setFilterForField("module", set),
    },
    {
      key: "task",
      label: "Task",
      color: "#3b5bdb",
      type: "checklist",
      options: filterOptions.task,
      selected: columnFilters.task || new Set(),
      onChange: (set) => setFilterForField("task", set),
    },
    {
      key: "resource",
      label: "Resource",
      color: "#15803D",
      type: "checklist",
      options: filterOptions.resource,
      selected: columnFilters.resource || new Set(),
      onChange: (set) => setFilterForField("resource", set),
      currentUser: currentUserResourceName,
    },
    {
      key: "status",
      label: "Status",
      color: "#B45309",
      type: "checklist",
      options: filterOptions.status,
      selected: columnFilters.status || new Set(),
      onChange: (set) => setFilterForField("status", set),
    },
    {
      key: "plannedStart",
      label: "Planned Start",
      type: "daterange",
      value: getDateRangeValue("plannedStart"),
      onChange: (bucket) => setDateRangeFilter("plannedStart", bucket),
    },
    {
      key: "plannedStop",
      label: "Planned Stop",
      type: "daterange",
      value: getDateRangeValue("plannedStop"),
      onChange: (bucket) => setDateRangeFilter("plannedStop", bucket),
    },
    {
      key: "actualStart",
      label: "Actual Start",
      type: "daterange",
      value: getDateRangeValue("actualStart"),
      onChange: (bucket) => setDateRangeFilter("actualStart", bucket),
    },
    {
      key: "actualStop",
      label: "Actual Stop",
      type: "daterange",
      value: getDateRangeValue("actualStop"),
      onChange: (bucket) => setDateRangeFilter("actualStop", bucket),
    },
  ];

  /* When an upstream filter (e.g. module) changes, a downstream filter
     (e.g. task/resource/status) may have selections that are no longer
     valid options — prune those so the checked values on screen always
     match what's actually selectable in that column's dropdown. */
  useEffect(() => {
    setColumnFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((field) => {
        if (field === "module") return; // top of the chain, never pruned
        const validOptions = filterOptions[field];
        if (!validOptions) return;
        const validSet = new Set(validOptions);
        const pruned = new Set([...next[field]].filter((v) => validSet.has(v)));
        if (pruned.size !== next[field].size) {
          changed = true;
          if (pruned.size === 0) delete next[field];
          else next[field] = pruned;
        }
      });
      return changed ? next : prev;
    });
  }, [filterOptions]);

  /* auto-expand all nodes when searching */
  const expandedWithFilters = useMemo(() => {
    const hasColumnFilters = Object.values(columnFilters).some(
      (set) => set && set.size > 0,
    );

    if (!search && !hasColumnFilters) {
      return expanded;
    }

    const allExpanded = { ...expanded };

    const markExpanded = (nodes) => {
      nodes?.forEach((node) => {
        // Only default a node to expanded if the user hasn't already set an
        // explicit state for it (via the expand/collapse toggle). Without
        // this check, every render re-forces every filtered node back open,
        // so collapsing a row while a search/filter is active had no
        // visible effect — it just got expanded again immediately.
        if (allExpanded[node.id] === undefined) {
          allExpanded[node.id] = true;
        }
        if (node.children?.length) {
          markExpanded(node.children);
        }
      });
    };

    markExpanded(filteredModules);

    return allExpanded;
  }, [search, columnFilters, filteredModules, expanded]);
  const segregateBadgePerformers = (activityDetails) => {
    let resources = [];
    activityDetails.modules.map((module) => {
      addResources(module.children, resources);
    });
    const performerColor = {};

    resources.forEach((resource) => {
      performerColor[resource] = getRandomColor();
    });

    setResourceColor(performerColor);
  };
  const addResources = (activities, resources) => {
    activities.map((activity) => {
      if (!resources?.includes(activity.resource))
        resources.push(activity.resource);
      if (activity.children.length > 0) {
        addResources(activity.children, resources);
      }
    });
  };
  const getRandomColor = () => {
    const badgeColors = [
      {
        color: "#2563EB",
        bgColor: "#DBEAFE",
        border: "#93C5FD",
        rowBg: "#F8FBFF",
      }, // Blue

      {
        color: "#059669",
        bgColor: "#D1FAE5",
        border: "#6EE7B7",
        rowBg: "#F5FCF9",
      }, // Emerald

      {
        color: "#7C3AED",
        bgColor: "#F3E8FF",
        border: "#C4B5FD",
        rowBg: "#FAF7FF",
      }, // Purple

      {
        color: "#EC4899",
        bgColor: "#FCE7F3",
        border: "#F9A8D4",
        rowBg: "#FFF8FC",
      }, // Pink

      {
        color: "#F97316",
        bgColor: "#FFEDD5",
        border: "#FDBA74",
        rowBg: "#FFF9F5",
      }, // Orange

      {
        color: "#D97706",
        bgColor: "#FEF3C7",
        border: "#FCD34D",
        rowBg: "#FFFDF6",
      }, // Amber

      {
        color: "#0891B2",
        bgColor: "#CFFAFE",
        border: "#67E8F9",
        rowBg: "#F4FCFE",
      }, // Cyan

      {
        color: "#65A30D",
        bgColor: "#ECFCCB",
        border: "#BEF264",
        rowBg: "#FBFDF6",
      }, // Lime

      {
        color: "#4F46E5",
        bgColor: "#E0E7FF",
        border: "#A5B4FC",
        rowBg: "#F7F8FF",
      }, // Indigo

      {
        color: "#DC2626",
        bgColor: "#FEE2E2",
        border: "#FCA5A5",
        rowBg: "#FFF7F7",
      }, // Red
    ];

    return badgeColors[Math.floor(Math.random() * badgeColors.length)];
  };
  const fetchColor = (res) => {
    return resourceColor[res];
  };
  const fetchActivities = async () => {
    console.log("fetch activities called");
    const activityDetails = await activityTrackerApi.getAllActivities(
      selectedProject.projectId,
    );
    console.log("Fetched activities:", activityDetails);
    if (!activityDetails) return null;
    activityDetails.customColumns = [
      ...(activityDetails.customColumns ?? []),
    ].sort((a, b) => a.order - b.order);
    setActivityInfo(activityDetails);
    const expandedModules = (activityDetails.modules ?? []).reduce(
      (acc, module) => {
        acc[module.id] = true;
        return acc;
      },
      {},
    );
    segregateBadgePerformers(activityDetails);
    // Functional update: the old `{ ...expanded, ... }` used the `expanded`
    // captured when this function was created, so anything expanded while
    // the request was in flight (e.g. the parent of a just-added
    // sub-activity) was overwritten with a stale value.
    setExpanded((prev) => ({ ...prev, ...expandedModules }));
    return activityDetails;
  };
  /**
   * Function to add loaded on page load or refresh
   */
  const fetchActivitiesOnLoad = async () => {
    setLoading(true);
    await fetchActivities();
    setLoading(false);
  };
  useEffect(() => {
    fetchActivitiesOnLoad();
  }, []);
  const projectStatusAssignee = (status) => {
    if (status === "finished") return "published";
    return status;
  };
  if (loading) {
    return <ProjectActivitiesSkeleton />;
  }
  /* ── render ── */
  return (
    <div className="pai-page">
      {/* ── Info card + activities card share one width (see .pai-content-shrink) —
          the topbar now lives inside the same wrapper so the "Back to
          Projects" button's left edge always lines up with the cards
          below it, instead of sitting flush against the page edge while
          the cards are centered narrower than the page. */}
      <div className="pai-content-shrink">
        {/* ── Breadcrumb / back bar ── */}
        <div className="pai-topbar">
          <button
            onClick={() => {
              console.log("On back home click");
              setSelectedProject && setSelectedProject(null);
            }}
            className="back-to-draft"
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
        </div>

        {/* ── Project info card ── */}
        {activityInfo && (
          <div className="pai-info-card">
            <div className="pai-project-avatar">
              {getInitials(activityInfo.projectName)}
            </div>

            <div className="pai-info-fields">
              <div className="pai-info-field">
                <span className="pai-field-label">Project</span>
                <span className="pai-field-value">
                  {activityInfo.projectName}
                </span>
              </div>
              <div className="pai-info-field">
                <span className="pai-field-label">PO No</span>
                <span className="pai-field-value">
                  {activityInfo.poNumber || "—"}
                </span>
              </div>
              <div className="pai-info-field">
                <span className="pai-field-label">Site / Customer</span>
                <span className="pai-field-value">
                  {activityInfo.siteCustomer || "—"}
                </span>
              </div>
              <div className="pai-info-field">
                <span className="pai-field-label">Status</span>
                <StatusChip
                  status={projectStatusAssignee(activityInfo.projectStatus)}
                />
              </div>
              <div className="pai-info-field">
                <span className="pai-field-label">Created By</span>
                <span className="pai-field-value">
                  {activityInfo.createdBy}
                </span>
              </div>
            </div>

            <div className="pai-info-field pdoc-open-wrap">
              <button
                type="button"
                className="pdoc-open-btn"
                onClick={() => setShowDocs(true)}
                aria-haspopup="dialog"
              >
                <BookOpen size={14} />
                Knowledge Base
              </button>
            </div>
          </div>
        )}

        {/* ── Activities card ── */}
        <div className="pai-activity-card">
          <div className="pai-activity-header">
            <div className="pai-header-left">
              <div className="pai-section-icon">
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#3b5bdb"
                  strokeWidth="2"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12h6M9 16h4" />
                </svg>
              </div>
              <h2 className="pai-section-title">Activities</h2>
              <span className="pai-counter">{totalActivities}</span>
            </div>

            <div className="pai-header-right">
              <div className="pai-search-wrap">
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  className="pai-search"
                  placeholder="Search Activity or module..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="pai-refresh-btn"
                onClick={fetchActivitiesOnLoad}
                title="Refresh"
                disabled={loading}
              >
                {loading ? (
                  <span className="icon-btn-spinner" />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0020.49 15" />
                  </svg>
                )}
              </button>
              {/* <button
                className="pai-refresh-btn"
                onClick={() => setOpenCpm(true)}
                title="Critical path (CPM)"
                aria-label="Open critical path view"
                disabled={!activityInfo?.modules?.length}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="5" cy="6" r="2.2" />
                  <circle cx="12" cy="18" r="2.2" />
                  <circle cx="19" cy="6" r="2.2" />
                  <path d="M6.8 7.6l3.9 8.6M13.3 16.2l3.9-8.6" />
                </svg>
              </button> */}
              {/* <button className="pai-add-btn">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Activity
            </button> */}
            </div>
          </div>

          {/* ── Mobile filters trigger ──
            On the card layout there's no table header to hang the
            per-column filter icons off of. Previously all 8 columns'
            filter chips sat in one horizontally-scrollable row, which
            meant scrolling sideways just to find the right one. Now a
            single button opens MobileFiltersSheet — one bottom sheet
            listing every column as a collapsed section; tapping a
            section expands its own checkbox/radio list in place. */}
          {isMobile && (
            <div className="pai-mobile-filterbar">
              <button
                type="button"
                className={`pai-mobile-filters-trigger${
                  activeFilterCount > 0
                    ? " pai-mobile-filters-trigger--active"
                    : ""
                }`}
                onClick={() => setMobileFiltersOpen(true)}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="pai-mobile-filters-trigger__badge">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  className="pai-mobile-filter-clearall"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          <MobileFiltersSheet
            open={isMobile && mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            sections={mobileFilterSections}
            activeCount={activeFilterCount}
            onClearAll={clearAllFilters}
          />

          {/* ── Card list (mobile) ──
            Same data, same TreeRows component, same handlers as the
            desktop table below — only the layout differs. Nothing about
            how an activity behaves changes between the two. */}
          {isMobile && (
            <div className="pai-mobile-list">
              {filteredModules.length === 0 && (
                <div className="pai-mobile-empty">{emptyStateMessage}</div>
              )}
              {filteredModules.map((module) => (
                <TreeRows
                  key={module.id}
                  node={module}
                  expanded={expandedWithFilters}
                  setExpanded={setExpanded}
                  addChildNode={addChildNode}
                  submitAddedNode={submitAddedNode}
                  handleFieldChange={handleFieldChange}
                  addDuration={addDuration}
                  moduleId={module.id}
                  projectId={activityInfo.projectId}
                  currentUserId={currentUserId}
                  updateStatusOfActivity={updateStatusOfActivity}
                  onPauseDelayRequest={handlePauseDelayRequest}
                  onOpenCommentBox={onOpenCommentBox}
                  deleteNode={deleteNode}
                  onOpenFeedbackForm={onOpenFeedbackForm}
                  fetchColor={fetchColor}
                  customColumns={activityInfo?.customColumns}
                  activityLookupMap={activityLookupMap}
                  loadingKeys={loadingKeys}
                  isMobile
                />
              ))}
            </div>
          )}

          {/* ── Table (desktop) ── */}
          {!isMobile && (
            <div className="pai-table-wrapper">
              <Table className="pai-table">
                <TableHead>
                  <TableRow className="pai-thead-row">
                    <TableCell className="pai-th pai-th-toggle" />
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Module</span>
                        <ColumnFilterButton
                          label="Module"
                          options={filterOptions.module}
                          selected={columnFilters.module || new Set()}
                          onChange={(set) => setFilterForField("module", set)}
                          color="#7C3AED"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Task</span>
                        <ColumnFilterButton
                          label="Task"
                          options={filterOptions.task}
                          selected={columnFilters.task || new Set()}
                          onChange={(set) => setFilterForField("task", set)}
                          color="#3b5bdb"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Resource</span>
                        <ColumnFilterButton
                          label="Resource"
                          options={filterOptions.resource}
                          selected={columnFilters.resource || new Set()}
                          onChange={(set) => setFilterForField("resource", set)}
                          color="#15803D"
                          currentUser={currentUserResourceName}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Planned Start</span>
                        <DateRangeFilterButton
                          label="Planned Start"
                          value={getDateRangeValue("plannedStart")}
                          onChange={(bucket) =>
                            setDateRangeFilter("plannedStart", bucket)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <div>
                          <div>Duration(Hrs)</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Planned Stop</span>
                        <DateRangeFilterButton
                          label="Planned Stop"
                          value={getDateRangeValue("plannedStop")}
                          onChange={(bucket) =>
                            setDateRangeFilter("plannedStop", bucket)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Status</span>
                        <ColumnFilterButton
                          label="Status"
                          options={filterOptions.status}
                          selected={columnFilters.status || new Set()}
                          onChange={(set) => setFilterForField("status", set)}
                          color="#B45309"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Actual Start</span>
                        <DateRangeFilterButton
                          label="Actual Start"
                          value={getDateRangeValue("actualStart")}
                          onChange={(bucket) =>
                            setDateRangeFilter("actualStart", bucket)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pai-th">
                      <div className="pai-th-content">
                        <span>Actual Stop</span>
                        <DateRangeFilterButton
                          label="Actual Stop"
                          value={getDateRangeValue("actualStop")}
                          onChange={(bucket) =>
                            setDateRangeFilter("actualStop", bucket)
                          }
                        />
                      </div>
                    </TableCell>
                    {activityInfo?.customColumns?.map((col) => {
                      const field = `custom:${col.id}`;
                      return (
                        <TableCell className="pai-th" key={col.id}>
                          <div className="pai-th-content">
                            <span>{col.name}</span>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="pai-th">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredModules.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        align="center"
                        style={{
                          padding: "32px 0",
                          color: "#94a3b8",
                          fontSize: "13px",
                        }}
                      >
                        {emptyStateMessage}
                        {/* MODIFIED: "Clear filters" shortcut in the empty state,
                            shown only when a column filter is active (this is
                            what was hiding all 10 rows in the screenshot).
                            Reuses the existing clearAllFilters + .pai-clear-filters-btn. */}
                        {activeFilterCount > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <button
                              type="button"
                              className="pai-clear-filters-btn"
                              onClick={clearAllFilters}
                            >
                              Clear filters
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredModules.map((module) => (
                    <TreeRows
                      key={module.id}
                      node={module}
                      expanded={expandedWithFilters}
                      setExpanded={setExpanded}
                      addChildNode={addChildNode}
                      submitAddedNode={submitAddedNode}
                      handleFieldChange={handleFieldChange}
                      addDuration={addDuration}
                      moduleId={module.id}
                      projectId={activityInfo.projectId}
                      currentUserId={currentUserId}
                      updateStatusOfActivity={updateStatusOfActivity}
                      onPauseDelayRequest={handlePauseDelayRequest}
                      onOpenCommentBox={onOpenCommentBox}
                      deleteNode={deleteNode}
                      onOpenFeedbackForm={onOpenFeedbackForm}
                      fetchColor={fetchColor}
                      customColumns={activityInfo?.customColumns}
                      activityLookupMap={activityLookupMap}
                      loadingKeys={loadingKeys}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {activityInfo?.projectId && (
        <ProjectDocumentation
          open={showDocs}
          projectId={activityInfo.projectId}
          onClose={() => setShowDocs(false)}
        />
      )}
      <PauseReasonDialog
        open={!!pauseDelayTarget}
        activityName={pauseDelayTarget?.activity?.name}
        pauseDelayType={pauseDelayTarget?.pauseDelayType}
        onConfirm={handlePauseDelayConfirm}
        onCancel={() => setPauseDelayTarget(null)}
        loading={pauseDelayLoading}
      />
      <CpmDialog
        open={openCpm}
        onClose={() => setOpenCpm(false)}
        projectId={activityInfo?.projectId}
        // fetchColor={fetchColor}
      />
      {openCommentDialog && (
        <CommentsActionDialog
          existingComments={existingComments}
          setExistingComments={setExistingComments}
          newComment={newComment}
          setNewComment={setNewComment}
          open={openCommentDialog}
          onClose={onCloseCommentbox}
          allowActions={allowActions}
          activityName={commentActivityName}
          activityStatus={commentActivityStatus}
          fetchColor={fetchColor}
          projectName={activityInfo?.projectName}
        />
      )}
      {openFeedback && (
        <FeedbackModal
          row={openFeedbackRow}
          onClose={onCloseFeedbackForm}
          onConfirm={() => {}}
        />
      )}
    </div>
  );
}
