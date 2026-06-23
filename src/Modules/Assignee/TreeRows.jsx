import React, { useState } from "react";

import {
  TableRow,
  TableCell,
  Box,
  Chip,
  IconButton,
  Typography,
  Table,
  TableHead,
  TableBody,
  Tooltip,
  TextField,
  TextareaAutosize,
} from "@mui/material";
import ModeCommentOutlinedIcon from "@mui/icons-material/ModeCommentOutlined";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FastForwardIcon from "@mui/icons-material/FastForward";
import StopIcon from "@mui/icons-material/Stop";
import AddIcon from "@mui/icons-material/Add";
import SubdirectoryArrowLeftIcon from "@mui/icons-material/SubdirectoryArrowLeft";
import SendIcon from "@mui/icons-material/Send";
import dayjs from "dayjs";
import CommentsActionDialog from "./CommentsActionDialog";
import "./ProjectActivityInfo.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Badge from '@mui/material/Badge';
import DeleteIcon from "@mui/icons-material/Delete";
import StatusChip from "./StatusChip";
import { showToast } from "./toastService";

export default function TreeRows({
  node,
  level = 0,
  expanded,
  setExpanded,
  addChildNode,
  currentUserId,
  submitAddedNode,
  handleFieldChange,
  addDuration,
  openCommentsDialog,
  setOpenCommentsDialog,
  moduleId,
  projectId,
  updateStatusOfActivity,
  onOpenCommentBox,
  deleteNode
}) {
  console.log("Current user id:", currentUserId);
  const {
    id,
    name,
    type,
    resource,
    activityStatus,
    children,
    plannedStart,
    plannedStop,
    durationHrs,
    actualStart,
    actualStop,
    actualElapsed,
    pauseStart,
    pauseDuration,
    sortOrder,
    latestRejectReason
    
    
    
  } = node;

  const hasChildren = children?.length > 0;

  const isExpanded = expanded?.[id] ?? false;

  const toggleExpand = (nodeId) => {
    setExpanded((prev) => ({
      ...prev,
      [nodeId]: !(prev[nodeId] ?? false),
    }));
  };


  const findInitials = (userId) => {
    const initials = userId
      .split("@")[0]
      .split(".")
      .map((obj) => obj[0])
      .join("")
      .toUpperCase();
    return initials;
  };
  const renderActions = () => {
    const statusActions = {
      Pending: (
        <Tooltip title="Start">
          <IconButton
            size="small"
            onClick={() => updateStatusOfActivity(id, "Running")}
          >
            <PlayArrowIcon className="start-icon" />
          </IconButton>
        </Tooltip>
      ),

      Running: (
        <>
          <Tooltip title="Pause">
            <IconButton
              size="small"
              onClick={() => updateStatusOfActivity(id, "Paused")}
            >
              <PauseIcon className="pause-icon" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Complete">
            <IconButton
              size="small"
              onClick={() =>{ 
                if(!allChildrenCompleted(node))
                  {
                    showToast("error", "Error", 'Please complete all subactivities')
                     return;
                  }
                updateStatusOfActivity(id, "Completed")}}
              // disabled={!allChildrenCompleted(node)}
            >
              <StopIcon className="stop-icon" />
            </IconButton>
          </Tooltip>
        </>
      ),

       Rejected: (
        <>
            <IconButton
            size="small"
            onClick={() => updateStatusOfActivity(id, "Running")}
          >
            <PlayArrowIcon className="start-icon" />
          </IconButton>
          <Tooltip title="Complete">
            <IconButton
              size="small"
              onClick={() => updateStatusOfActivity(id, "Completed")}
              disabled={!allChildrenCompleted(node)}
            >
              <StopIcon className="stop-icon" />
            </IconButton>
          </Tooltip>
        </>
      ),

      Paused: (
        <Tooltip title="Resume">
          <IconButton
            size="small"
            onClick={() => updateStatusOfActivity(id, "Running")}
          >
            <FastForwardIcon className="resume-icon" />
          </IconButton>
        </Tooltip>
      ),

      "Not Ready": (
  <>
    <Tooltip title="Submit Activity">
      <IconButton
        size="small"
        sx={{ p: 0.3 }}
        onClick={() =>{
           showToast("success", "Success",'SubActivity added' );
          submitAddedNode(projectId, moduleId, node)}}
      >
        <SendIcon sx={{ fontSize: 16 }} className="send-icon" />
      </IconButton>
    </Tooltip>

    <Tooltip title="Delete Activity">
      <IconButton
        size="small"
        color="error"
        sx={{ p: 0.3 }}
        onClick={() => deleteNode(projectId, moduleId, node)}
      >
        <DeleteIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  </>
)
    };
    console.log("Status::", activityStatus);
    return (
      <>
        {currentUserId?.toLowerCase() === resource?.toLowerCase() &&
          statusActions[activityStatus]}

        {currentUserId?.toLowerCase() === resource?.toLowerCase() &&
          activityStatus !== "Not Ready" && (
            <>
             <Badge badgeContent={node?.commentCount} color="primary">
              <IconButton
                size="small"
                onClick={() => {
                  console.log('Clicked Node : ',node)
                  onOpenCommentBox(projectId, id,moduleId,node?.name??'');
                }}
              >
                <ModeCommentOutlinedIcon fontSize="small" />
              </IconButton>
              </Badge>
              {sortOrder === 0  && (
                <IconButton size="small" onClick={() => {addChildNode(node)}}
                disabled={node.activityStatus === 'Completed'}
                >
                  <SubdirectoryArrowLeftIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
      </>
    );
  };

  

  const allChildrenCompleted = (activity)=>{
    return activity.children.every(
  child => child.activityStatus === "Completed"
);
  }

  return (
    <>
      {type === "MODULE" && (
        <>
          <TableRow className="module-row">
            <TableCell colSpan={14}>
              <Box className="module-header">
                <Box className="module-left">
                  <button
                    className="expand-btn"
                    onClick={() => toggleExpand(id)}
                  >
                    {isExpanded ? "−" : "+"}
                  </button>

                  <span className="module-tag">{name}</span>
                </Box>

                {/* <Box className="module-right">
                  <button
                    className="add-row-chip"
                    onClick={() => addChildNode(node)}
                  >
                    <AddIcon fontSize="small" />
                    <span>Add row to module</span>
                  </button>
                </Box>*/}
              </Box>
            </TableCell>
          </TableRow>

          {isExpanded &&
            children?.map((child) => (
              <TreeRows
                key={child.id}
                node={child}
                level={1}
                expanded={expanded}
                setExpanded={setExpanded}
                addChildNode={addChildNode}
                handleFieldChange={handleFieldChange}
                addDuration={addDuration}
                moduleId={moduleId}
                projectId={projectId}
                submitAddedNode={submitAddedNode}
                currentUserId={currentUserId}
                updateStatusOfActivity={updateStatusOfActivity}
                onOpenCommentBox={onOpenCommentBox}
                deleteNode={deleteNode}
              />
            ))}
        </>
      )}
      {type !== "MODULE" && (
        <>
          <TableRow
            className={
              currentUserId?.toLowerCase() === resource?.toLowerCase()
                ? "my-activity-row"
                : "other-activity-row"
            }
          >
            <TableCell />

            <TableCell>
              <Box
                className="tree-item"
                sx={{
                  pl: `${level * 3.5}px`,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {hasChildren && (
                  <button
                    className="expand-btn small"
                    onClick={() => toggleExpand(id)}
                  >
                    {isExpanded ? "−" : "+"}
                  </button>
                )}

                {type === "SUBTASK" && <span className="subtree-line">└</span>}

                <span className="task-pill">{type}</span>
              </Box>
            </TableCell>

            <TableCell>
              {activityStatus === "Not Ready" && (
                <TextareaAutosize
                  placeholder="Enter Activity name..."
                  // defaultValue={name}
                  value={name}
                  onChange={(e) =>
                    handleFieldChange(id, {
                      name: e.target.value,
                    })
                  }
                  className="task-name-input"
                />
              )}
              {activityStatus !== "Not Ready" && (
                <Typography variant="body2">{name}</Typography>
              )}
            </TableCell>

            <TableCell>
              <Tooltip title={resource}>
                <Box className="resource-cell">
                  <div className="avatar">{findInitials(resource)}</div>
                </Box>
              </Tooltip>
            </TableCell>

            <TableCell>
              { plannedStart && dayjs(plannedStart).isValid() ? (
                dayjs(plannedStart).format("DD-MM-YYYY HH:mm")
              ) : (
                "-"
              )}
            </TableCell>

            <TableCell align="center">{durationHrs ?? "-"}</TableCell>

            <TableCell>
              { plannedStop && dayjs(plannedStop).isValid() ? (
                dayjs(plannedStop).format("DD-MM-YYYY HH:mm")
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <Tooltip title={activityStatus?.toLowerCase() ==='completed'? latestRejectReason ?? activityStatus : activityStatus}>
  <span>
              {/* <Chip
                size="small"
                label={activityStatus || "-"}
                color={
                  activityStatus === "Running"
                    ? "success"
                    : activityStatus === "Paused"
                      ? "warning"
                      : "default"
                }
              /> */}
              <StatusChip status={activityStatus?.toLowerCase()} />
              </span>
              </Tooltip>
            </TableCell>

            <TableCell>
              {actualStart && dayjs(actualStart).isValid()
                ? dayjs(actualStart).format("YYYY-MM-DD HH:mm")
                : "-"}
            </TableCell>

            <TableCell>
              {actualStop && dayjs(actualStop).isValid()
                ? dayjs(actualStop).format("YYYY-MM-DD HH:mm")
                : "-"}
            </TableCell>

            {/* <TableCell>{pauseStart && dayjs(pauseStart).isValid()
                ? dayjs(pauseStart).format("YYYY-MM-DD HH:mm")
                : "-"}</TableCell>

            <TableCell>{pauseDuration || "-"}</TableCell> */}

            <TableCell align="center">
              <Box className="action-container">{renderActions()}</Box>
            </TableCell>
          </TableRow>
          {hasChildren &&
            isExpanded &&
            children?.map((child) => (
              <TreeRows
                key={child.id}
                node={child}
                level={level + 1}
                expanded={expanded}
                setExpanded={setExpanded}
                addChildNode={addChildNode}
                submitAddedNode={submitAddedNode}
                handleFieldChange={handleFieldChange}
                addDuration={addDuration}
                moduleId={moduleId}
                projectId={projectId}
                currentUserId={currentUserId}
                updateStatusOfActivity={updateStatusOfActivity}
                onOpenCommentBox={onOpenCommentBox}
                  deleteNode={deleteNode}
              />
            ))}
        </>
      )}
    </>
  );
}
