import React, { useEffect, useMemo, useState } from "react";
import "./ProjectActivityInfo.css";
import TreeRows from "./TreeRows";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import dayjs from "dayjs";
import CommentsActionBox from "./CommentsActionDialog";
import CommentsActionDialog from "./CommentsActionDialog";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { addComment } from "./AssigneeHelper";
import { getUserData } from "../Login/Encrypt";
import StatusChip from "./StatusChip";
import { showToast } from "./toastService";
import { ArrowLeft } from "lucide-react";
const activity = {
  projectId: "PRJ-1001",
  projectName: "Solar Farm Expansion",
  poNumber: "PO-2025-001",
  siteCustomer: "Green Energy Corp",
  projectStatus: "Active",
  createdBy: "john.smith",
  createdAt: "2025-01-15T10:30:00.000Z",
  activities: [
    {
      id: "module-1",
      type: "MODULE",
      name: "LOGSHEET",
      children: [
        {
          id: "task-1",
          type: "TASK",
          name: "Scope Identification",
          moduleName: "LOGSHEET",
          resource: "eman.kalyan.mahato@greenwave.co.in",
          resourceName: "Eman Mahata",
          plannedStart: "2026-05-04T10:00:00.000Z",
          plannedStop: "2026-05-04T12:00:00.000Z",
          durationHrs: 2,
          actualStart: "2026-05-04T10:05:00.000Z",
          actualStop: "2026-05-04T11:55:00.000Z",
          actualElapsed: "1h 50m",
          pauseStart: "2026-05-04T10:45:00.000Z",
          pausedurationHrs: "10m",
          activityStatus: "Not Started",
          priority: "Medium",
          progress: 0,
        },
        {
          id: "task-2",
          type: "TASK",
          name: "Data Source Identification and Modification Chargesheet",
          moduleName: "LOGSHEET",
          resource: "eman.kalyan.mahato@greenwave.co.in",
          resourceName: "Eman Mahata",
          plannedStart: "2026-05-04T10:00:00.000Z",
          plannedStop: "2026-05-04T12:00:00.000Z",
          durationHrs: 2,
          actualStart: "2026-05-04T10:05:00.000Z",
          actualStop: "2026-05-04T11:55:00.000Z",
          actualElapsed: "1h 50m",
          pauseStart: "2026-05-04T10:45:00.000Z",
          pauseDuration: "10m",
          activityStatus: "Paused",
          priority: "High",
          progress: 0,
        },
      ],
    },
    {
      id: "module-2",
      type: "MODULE",
      name: "LOGSHEET 2",
      children: [
        {
          id: "task-3",
          type: "TASK",
          name: "Scope Identification",
          moduleName: "LOGSHEET 2",
          resource: "rakesh.gupta@greenwave.co.in",
          resourceName: "Rakesh Gupta",
          plannedStart: "2026-05-04T10:00:00.000Z",
          plannedStop: "2026-05-04T12:00:00.000Z",
          durationHrs: 2,
          actualStart: "2026-05-04T10:05:00.000Z",
          actualStop: "2026-05-04T11:55:00.000Z",
          actualElapsed: "1h 50m",
          pauseStart: "2026-05-04T10:45:00.000Z",
          pauseDuration: "10m",
          activityStatus: "Not Started",
          children: [
            {
              id: "subtask-1",
              type: "SUBTASK",
              name: "Scope Identification Subtree",
              moduleName: "LOGSHEET 2",
              resource: "indranil.sen@greenwave.co.in",
              resourceName: "Indranil Sen",
              plannedStart: "2026-05-04T14:30:00.000Z",
              plannedStop: "2026-05-04T15:30:00.000Z",
              durationHrs: 1,
              activityStatus: "Running",
              children: [
                {
                  id: "subtask-1-1",
                  type: "SUBTASK",
                  name: "Review Scope Document",
                  moduleName: "LOGSHEET 2",
                  resource: "santanu.bhattacharya@greenwave.co.in",
                  resourceName: "Santanu Bhattacharya",
                  plannedStart: "2026-05-04T15:30:00.000Z",
                  plannedStop: "2026-05-04T16:30:00.000Z",
                  durationHrs: 1,
                  activityStatus: "Running",
                  children: [
                    {
                      id: "subtask-1-1-1",
                      type: "SUBTASK",
                      name: "Final Scope Approval",
                      moduleName: "LOGSHEET 2",
                      resourceName: "Anirban Bose",
                      plannedStart: "2026-05-04T16:30:00.000Z",
                      plannedStop: "2026-05-04T17:00:00.000Z",
                      durationHrs: 4,
                      activityStatus: "Not Started",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/* ── helpers ── */
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}


/* ── main component ── */
export default function ProjectActivityInfo({ selectedProject, setSelectedProject }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [activityInfo, setActivityInfo] = useState(null);
  const [openCommentsDialog,setOpenCommentsDialog]=useState(null)
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState(null);
  const [newComment,setNewComment]=useState(null)
  const [allowNewcomment,setAllowNewComment]=useState(true)
  const [commentActivityName,setCommentActivityName]=useState(null)
  
  const currentUserId   = getUserData()?.userDetails?.userId;
  const currentUserName = getUserData()?.userDetails?.userName;


  /* ── tree helpers ── */
  const addDuration = (startTime, durationHrs) =>
    dayjs(startTime).add(durationHrs, "hour").toISOString();

  const calculatePlannedStart = (parent) => {
    const children = parent.children || [];
    if (!children.length) return parent.plannedStart;
    const total = children.reduce((s, c) => s + (Number(c.durationHrs) || 0), 0);
    return addDuration(parent.plannedStart, total);
  };

  const addChildNode = (parent) => {
    setActivityInfo((prev) => ({
      ...prev,
      modules: addRecursively(prev.modules),
    }));
    setExpanded({ ...expanded, [parent.id]: true });
    console.log('Current Expanded Row:', { ...expanded, [parent.id]: true });

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
          const allocated = existing.reduce((s, c) => s + (Number(c.durationHrs) || 0), 0);
          const plannedStart=parent.plannedStart//calculatePlannedStart(parent)
          const plannedStop=parent.plannedStop//addDuration(plannedStart,durationHrs)
          // const durationHrs = dayjs(plannedStop).diff(dayjs(plannedStart), "hour")
                                      
          
          const newNode = {
            id:generateRowId(),
            type: parent.type === "MODULE" ? "ACTIVITY" : "SUBACTIVITY",
            parentId: parent.id,
            name: "",
            moduleName: parent.moduleName,
            resource: currentUserId,
            resourceName: currentUserName,
            plannedStart: plannedStart,
            plannedStop: plannedStart,
            durationHrs: 0,
            actualStart: "", actualStop: "", actualElapsed: "",
            pauseStart: "", pauseDuration: "",
            activityStatus: "Not Ready", priority: "Medium", progress: 0,
            children: [],
          };
          return { ...node, children: [...existing, newNode] };
        }
        if (node.children?.length)
          return { ...node, children: addRecursively(node.children) };
        return node;
      });
    }

      showToast("success", "Success",'Submit the subactivity for confirmation' );

    // setExpanded((prev) => ({ ...prev, [parent.id]: true }));
  }

  const deleteNode = (projectId, moduleId, nodeToDelete) => {
  setActivityInfo((prev) => ({
    ...prev,
    modules: deleteRecursively(prev.modules, nodeToDelete.id),
  }));

   showToast("error", "Activity",'SubActivity deleted' );
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
    const selfCount = node.type !== "MODULE" && node.resource===currentUserId? 1 : 0;
    const childCount = node.children?.length > 0 ? countActivities(node.children) : 0;
    return count + selfCount + childCount;
  }, 0);
};
const onOpenCommentBox = async(projectId,activityId,moduleId,status,activityName) => {
  const existingCommentsResp=await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(projectId,activityId)
  console.log("Existing comments and replies::",existingCommentsResp)
  const newCommentBody=addComment(projectId,activityId,moduleId)
  if(status.toLowerCase()!=='finished')
    setAllowNewComment(true)
  else
    setAllowNewComment(false)
  setCommentActivityName(activityName)
  setExistingComments(existingCommentsResp);
  setNewComment(newCommentBody)
  setOpenCommentDialog(true);
  };
  const onCloseCommentbox = () => {
    fetchActivities();
    setOpenCommentDialog(false);
    setExistingComments(null);
    setNewComment(null)
    setAllowNewComment(null)
  };
  
const totalActivities = useMemo(
  () => activityInfo?.modules ? countActivities(activityInfo.modules) : 0,
  [activityInfo]
);
  const handleFieldChange = (id, updates) => {
    console.log("Handle field change: ",updates)
    console.log("Activity info::",activityInfo)
    setActivityInfo((prev) => ({
      ...prev,
      modules: updateNode(prev.modules, id, updates),
    }));
  };

  const updateNode = (nodes, id, updates) =>{
    console.log("Nodes:::",nodes)
    return nodes.map((node) => {
      if (node.id === id) return { ...node, ...updates };
      if (node.children?.length)
        return { ...node, children: updateNode(node.children, id, updates) };
      return node;
    });
  }

  const submitAddedNode = async(projectId,moduleId,activityData) => {
    console.log("Activity data:::",activityData)
    console.log("Activity name:",activityData.name,"Duration:",activityData.durationHrs)
    console.log("Module id:",moduleId)
    if(!(activityData?.name?.length>0)  ){
      console.log("Enter actiivty name and duration")
      showToast("error", "Error", "Activity Name is required");
      return
    }
    const payload=mapToActivityPayload(activityData,projectId,moduleId)
    const response=await activityTrackerApi.createActivity(projectId,payload)
    await fetchActivities()
    showToast("success", "Success", "SubActivity added");
 
  };
  const mapToActivityPayload = (node, projectId, moduleId) => ({
  activityId: node.id,
  projectId: projectId,
  moduleId: moduleId,
  activityName: node.name?.trim(),
  parentActivityId: node.parentId,
  resourceName: node.resourceName,
  resourceId: node.resource,           // email used as resourceId
  plannedStart: node.plannedStart,
  durationHrs: node.durationHrs,
  plannedStop: node.plannedStop,
  activityStatus: "Pending",
  actualStart: node.actualStart || null,
  actualStop: node.actualStop || null,
  actualElapsedHrs: node.actualElapsed ? parseFloat(node.actualElapsed) : null,
  sortOrder: 1,                         // no equivalent in source, default 0
  createdAt: new Date().toISOString(),
  createdBy: currentUserId,            // assuming creator = assigned resource
  creatorType: "Assignee",              // "SUBTASK" → creatorType
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
  const updateStatusOfActivity=async (activityId,status)=>{
    const statusPayload={status,actualTime:new Date()}
    const response=await activityTrackerApi.updateActivityStatus(activityId,statusPayload)
     showToast("success", "Status Updated",`Activity ${statusPayload.status}` );
    fetchActivities()
  }
  const totalTasks = useMemo(
    () => countTasks(activityInfo?.activities),
    [activityInfo]
  );

  const fetchActivities=async()=>{
    const activityDetails=await activityTrackerApi.getAllActivities(selectedProject.projectId)
    console.log("Fetched activities:",activityDetails)
    if(!activityDetails) return;
    setActivityInfo(activityDetails)
    console.log('Activity Details : ',activityDetails)
    const expandedModules = activityDetails.modules.reduce((acc, module) => {
  acc[module.id] = true;
  return acc;
}, {});

console.log('Expanded Modules : ',expandedModules)
setExpanded({...expanded,...expandedModules});
  }
  useEffect(()=>{
    fetchActivities()
  },[])

  /* ── render ── */
  return (
    <div className="pai-page container mx-auto">

      {/* ── Breadcrumb / back bar ── */}
      <div className="pai-topbar">
         <button
            onClick={() => {console.log("On back home click");setSelectedProject && setSelectedProject(null)}}
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
              <span className="pai-field-value">{activityInfo.projectName}</span>
            </div>
            <div className="pai-info-field">
              <span className="pai-field-label">PO No</span>
              <span className="pai-field-value">{activityInfo.poNumber || "—"}</span>
            </div>
            <div className="pai-info-field">
              <span className="pai-field-label">Site / Customer</span>
              <span className="pai-field-value">{activityInfo.siteCustomer || "—"}</span>
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
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#3b5bdb" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
            </div>
            <h2 className="pai-section-title">Activities</h2>
            <span className="pai-counter">{totalActivities}</span>
          </div>

          <div className="pai-header-right">
            <div className="pai-search-wrap">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="pai-search"
                placeholder="Search Activity or module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                <TableCell className="pai-th">Duration(Hours)</TableCell>
                <TableCell className="pai-th">Planned Stop</TableCell>
                <TableCell className="pai-th">Status</TableCell>
                <TableCell className="pai-th">Actual Start</TableCell>
                <TableCell className="pai-th">Actual Stop</TableCell>
                <TableCell className="pai-th">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityInfo?.modules.map((module) => (
                <TreeRows
                  key={module.id}
                  node={module}
                  expanded={expanded}
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
        allowNewComment={allowNewcomment} activityName={commentActivityName}   />
       
    </div>
  );
}
