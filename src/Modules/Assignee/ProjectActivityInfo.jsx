import React, { useEffect, useMemo, useState } from "react";
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
import CommentsActionBox from "./CommentsActionDialog";
import CommentsActionDialog from "./CommentsActionDialog";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { addComment } from "./AssigneeHelper";
import { getUserData } from "../Login/Encrypt";
import StatusChip from "./StatusChip";
import { showToast } from "./toastService";
import { ArrowLeft } from "lucide-react";
import FeedbackModal from "../../Test Ground/FeedbackModal";
import { faTruckMedical } from "@fortawesome/free-solid-svg-icons";
import ProjectActivitiesSkeleton from "./ProjectActivitiesSkeleton";

dayjs.extend(isBetween); // ← add this
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
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [activityInfo, setActivityInfo] = useState(null);
  const [openCommentsDialog, setOpenCommentsDialog] = useState(null);
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState(null);
  const [newComment, setNewComment] = useState(null);
  const [allowActions, setAllowActions] = useState(true);
  const [commentActivityName, setCommentActivityName] = useState(null);
  const [openFeedback, setFeedback] = useState(false);
  const [openFeedbackRow, setOpenFeedbackRow] = useState(null);
  const currentUserId = getUserData()?.userDetails?.userId;
  const currentUserName = getUserData()?.userDetails?.userName;
  const [resourceColor, setResourceColor] = useState({});
  const [loading, setLoading] = useState(true);
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
    setExpanded({ ...expanded, [parent.id]: true });
    console.log("Current Expanded Row:", { ...expanded, [parent.id]: true });

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
          };
          return { ...node, children: [...existing, newNode] };
        }
        if (node.children?.length)
          return { ...node, children: addRecursively(node.children) };
        return node;
      });
    }

    showToast("success", "Success", "Submit the subactivity for confirmation");

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
  ) => {
    try{
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
    setExistingComments(existingCommentsResp);
    setNewComment(newCommentBody);
    setOpenCommentDialog(true);
    }
    catch(e){
      showToast("error","Error","Error in fetching comment")
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

  const submitAddedNode = async (projectId, moduleId, activityData) => {
    console.log("Activity data:::", activityData);
    console.log(
      "Activity name:",
      activityData.name,
      "Duration:",
      activityData.durationHrs,
    );
    console.log("Module id:", moduleId);
    if (!(activityData?.name?.length > 0)) {
      console.log("Enter actiivty name and duration");
      showToast("error", "Error", "Activity Name is required");
      return;
    }
    const payload = mapToActivityPayload(activityData, projectId, moduleId);
    try {
      const response = await activityTrackerApi.createActivity(
        projectId,
        payload,
      );

      showToast("success", "Success", "SubActivity added");
      await fetchActivities();

      console.log("Response::", response);
    } catch (e) {
      console.log("Error:", e);
      showToast("error", "Error", "Error in adding SubActivity");
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
    creatorType: "Assignee", // "SUBTASK" → creatorType
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
    const leavesOfEmployee =
      await activityTrackerApi.getLeavesWithHolidaysByUserId(currentUserId);

    const leaves = leavesOfEmployee?.[0]?.leaves ?? [];

    let totalWorkingHours = calculateWorkingHours(
      activity.actualStart,
      actualTime,
      leaves,
    );

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
    const totalRejections = await activityTrackerApi.getActivityRejections(
      activity.id,
    );
    console.log("Rejection Details::", totalRejections);
    totalWorkingHours = totalWorkingHours - totalPauseHours;
    console.log("Working Hours:", totalWorkingHours);
    console.log("Pause Hours:", totalPauseHours);

    return Math.max(0, totalWorkingHours);
  };
  const updateStatusOfActivity = async (activityId, status, activity) => {
    try{
    const actualTime = new Date();
    let duration = 0;
    if (status.toLowerCase() === "completed") {
      duration = await calculateDuration(activity, actualTime);
      return;
    }
    const statusPayload = { status, actualTime, duration };

    const response = await activityTrackerApi.updateActivityStatus(
      activityId,
      statusPayload,
    );
    showToast("success", "Status Updated", `Activity ${statusPayload.status}`);
    fetchActivities();
  }catch(e){
    showToast("error","Error","Error in status update")
    
  }
  };
  const totalTasks = useMemo(
    () => countTasks(activityInfo?.activities),
    [activityInfo],
  );

  /* ── search filter helpers ── */
  const nodeMatchesSearch = (node, term) => {
    const t = term.toLowerCase();
    return (
      node.name?.toLowerCase().includes(t) ||
      node.resourceName?.toLowerCase().includes(t) ||
      node.resource?.toLowerCase().includes(t) ||
      node.activityStatus?.toLowerCase().includes(t) ||
      node.type?.toLowerCase().includes(t)
    );
  };

  const filterTree = (nodes, term) => {
    if (!term) return nodes;
    return nodes.reduce((acc, node) => {
      const filteredChildren = node.children?.length
        ? filterTree(node.children, term)
        : [];
      const selfMatches = nodeMatchesSearch(node, term);
      if (selfMatches || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const filteredModules = useMemo(() => {
    if (!activityInfo?.modules) return [];
    return filterTree(activityInfo.modules, search);
  }, [activityInfo, search]);

  /* auto-expand all nodes when searching */
  const expandedWithSearch = useMemo(() => {
    if (!search) return expanded;
    const allExpanded = { ...expanded };
    const markExpanded = (nodes) => {
      nodes?.forEach((node) => {
        allExpanded[node.id] = true;
        if (node.children?.length) markExpanded(node.children);
      });
    };
    markExpanded(filteredModules);
    return allExpanded;
  }, [search, filteredModules, expanded]);
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
    if (!activityDetails) return;
    setActivityInfo(activityDetails);
    const expandedModules = activityDetails.modules.reduce((acc, module) => {
      acc[module.id] = true;
      return acc;
    }, {});
    segregateBadgePerformers(activityDetails);
    setExpanded({ ...expanded, ...expandedModules });
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
  if (loading) {
    return <ProjectActivitiesSkeleton />;
  }
  /* ── render ── */
  return (
    <div className="pai-page container mx-auto">
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
              <StatusChip status={activityInfo.projectStatus} />
            </div>
            <div className="pai-info-field">
              <span className="pai-field-label">Created By</span>
              <span className="pai-field-value">{activityInfo.createdBy}</span>
            </div>
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
            >
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
            </button>
            {/* <button className="pai-add-btn">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Activity
            </button> */}
          </div>
        </div>

        <div className="pai-table-wrapper">
          <Table className="pai-table">
            <TableHead>
              <TableRow className="pai-thead-row">
                <TableCell className="pai-th pai-th-toggle" />
                <TableCell className="pai-th">Module</TableCell>
                <TableCell className="pai-th">Task</TableCell>
                <TableCell className="pai-th">Resource</TableCell>
                <TableCell className="pai-th">Planned Start</TableCell>
                <TableCell className="pai-th">
                  <div>
                    <div>Duration</div>
                    <div>(Hours)</div>
                  </div>
                </TableCell>
                <TableCell className="pai-th">Planned Stop</TableCell>
                <TableCell className="pai-th">Status</TableCell>
                <TableCell className="pai-th">Actual Start</TableCell>
                <TableCell className="pai-th">Actual Stop</TableCell>
                <TableCell className="pai-th">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredModules.length === 0 && search && (
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
                    No activities match &ldquo;{search}&rdquo;
                  </TableCell>
                </TableRow>
              )}
              {filteredModules.map((module) => (
                <TreeRows
                  key={module.id}
                  node={module}
                  expanded={expandedWithSearch}
                  setExpanded={setExpanded}
                  addChildNode={addChildNode}
                  submitAddedNode={submitAddedNode}
                  handleFieldChange={handleFieldChange}
                  addDuration={addDuration}
                  moduleId={module.id}
                  projectId={activityInfo.projectId}
                  currentUserId={currentUserId}
                  updateStatusOfActivity={updateStatusOfActivity}
                  onOpenCommentBox={onOpenCommentBox}
                  deleteNode={deleteNode}
                  onOpenFeedbackForm={onOpenFeedbackForm}
                  fetchColor={fetchColor}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <CommentsActionDialog
        existingComments={existingComments}
        setExistingComments={setExistingComments}
        newComment={newComment}
        setNewComment={setNewComment}
        open={openCommentDialog}
        onClose={onCloseCommentbox}
        allowActions={allowActions}
        activityName={commentActivityName}
      />
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
