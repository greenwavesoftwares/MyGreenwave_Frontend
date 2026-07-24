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
import Badge from "@mui/material/Badge";
import DeleteIcon from "@mui/icons-material/Delete";
import StatusChip from "./StatusChip";
import { RotateCcw, Star, Trash2 } from "lucide-react";
import { showToast } from "./toastService";
import ActivityTimer from "./ActivityTimer";

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
  onPauseDelayRequest,
  onOpenCommentBox,
  onOpenFeedbackForm,
  deleteNode,
  fetchColor,
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
    latestRejectReason,
  } = node;
  console.log("Node Details:", node);
  console.log("Planned Start:", plannedStart);
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
    const isAssignedUser =
      currentUserId?.toLowerCase() === resource?.toLowerCase();

    const statusActions = {
      Pending: [
        <Tooltip key="start" title="Start">
          <button
            className="icon-button icon-btn--start"
            onClick={() => {
              const minutesLeft = dayjs().diff(dayjs(plannedStart), "minute");
              console.log("Minutes left::",minutesLeft)
                if (minutesLeft >= 15) {
                  // 15 minutes or less remaining

                  onPauseDelayRequest(id, node, "StartDelay");
                }
                else{
                  
                updateStatusOfActivity(id, "Running",node);
                }
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 14 }} className="start-icon" />
          </button>
        </Tooltip>,
      ],

      Running: [
        <Tooltip key="pause" title="Pause">
          <button
            className="icon-button icon-btn--pause"
            onClick={() => onPauseDelayRequest(id, node, "Paused")}
          >
            <PauseIcon sx={{ fontSize: 14 }} className="pause-icon" />
          </button>
        </Tooltip>,

        allChildrenCompleted(node) && (
          <Tooltip key="complete" title="Complete">
            <button
              className="icon-button icon-btn--stop"
              onClick={() => {
                if (!allChildrenCompleted(node)) {
                  showToast(
                    "error",
                    "Error",
                    "Please complete all subactivities",
                  );
                  return;
                }
                const minutesLeft = dayjs().diff(dayjs(plannedStop), "minute");
                console.log("Minutes left:::",minutesLeft)
                if (minutesLeft >= 15) {
                  // 15 minutes or less remaining

                  onPauseDelayRequest(id, node, "StopDelay");
                }
                else{
                  
                updateStatusOfActivity(id, "Completed",node);
                }
              }}
            >
              <StopIcon sx={{ fontSize: 14 }} className="stop-icon" />
            </button>
          </Tooltip>
        ),
      ].filter(Boolean),

      Rejected: [
        <Tooltip key="restart" title="Restart">
          <button
            className="icon-button icon-btn--start"
            onClick={() => updateStatusOfActivity(id, "Running", node)}
          >
            <PlayArrowIcon sx={{ fontSize: 14 }} className="start-icon" />
          </button>
        </Tooltip>,
      ].filter(Boolean),

      Paused: [
        <Tooltip key="resume" title="Resume">
          <button
            className="icon-button icon-btn--resume"
            onClick={() => updateStatusOfActivity(id, "Running", node)}
          >
            <FastForwardIcon sx={{ fontSize: 14 }} className="resume-icon" />
          </button>
        </Tooltip>,
      ],
      Finished: [
        <Tooltip key="submit" title="View Feedback">
          <button
            className="icon-button icon-btn--feedback"
            onClick={() => onOpenFeedbackForm(node)}
          >
            <Star
              className="send-icon"
              size={15}
              strokeWidth={2}
              fill={"#7C3AED"}
            />
          </button>
        </Tooltip>,
      ],
      "Completed":[ <Tooltip key="submit" title="Redo Activity">
          <button
            className="icon-button icon-btn--feedback"
            onClick={() => onPauseDelayRequest(id, node, "Redo")}
          >
            <RotateCcw size={15} strokeWidth={2} />
            
          </button>
        </Tooltip>],
      "Not Ready": [
        <Tooltip key="submit" title="Submit Activity">
          <button
            className="icon-button icon-btn--submit"
            onClick={() => submitAddedNode(projectId, moduleId, node)}
          >
            <SendIcon sx={{ fontSize: 14 }} className="send-icon" />
          </button>
        </Tooltip>,

        <Tooltip key="delete" title="Delete Activity">
          <button
            className="icon-button icon-btn--delete"
            onClick={() => deleteNode(projectId, moduleId, node)}
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>,
      ],
    };

    const actionItems = [];

    if (isAssignedUser) {
      actionItems.push(...(statusActions[activityStatus] || []));

      if (activityStatus !== "Not Ready") {
        actionItems.push(
          <Badge
            key="comment"
            badgeContent={node?.commentCount}
            color="primary"
          >
            <Tooltip title="Comments">
              <button
                className="icon-button icon-btn--comment"
                onClick={() =>
                  onOpenCommentBox(
                    projectId,
                    id,
                    moduleId,
                    activityStatus,
                    name,
                  )
                }
              >
                <ModeCommentOutlinedIcon sx={{ fontSize: 14 }} />
              </button>
            </Tooltip>
          </Badge>,
        );

        if (sortOrder === 0 && activityStatus === "Running") {
          actionItems.push(
            <Tooltip key="subtask" title="Add sub-activity">
              <button
                className="icon-button icon-btn--subtask"
                onClick={() => addChildNode(node)}
              >
                <SubdirectoryArrowLeftIcon sx={{ fontSize: 14 }} />
              </button>
            </Tooltip>,
          );
        }
      }
    }

    return <div className="action-container">{actionItems}</div>;
  };

  const allChildrenCompleted = (activity) => {
    return activity.children.every(
      (child) => child.activityStatus === "Completed",
    );
  };

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
                    <AddIcon sx={{ fontSize: 14 }} />
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
                onPauseDelayRequest={onPauseDelayRequest}
                onOpenCommentBox={onOpenCommentBox}
                deleteNode={deleteNode}
                onOpenFeedbackForm={onOpenFeedbackForm}
                fetchColor={fetchColor}
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
            style={{ "--bg": fetchColor(resource).rowBg }}
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
                  <div
                    className={
                      currentUserId?.toLowerCase() === resource?.toLowerCase()
                        ? "avatar-resource"
                        : "avatar-resource avatar-resource-disabled"
                    }
                    style={{
                      "--avatar-bg": fetchColor(resource).bgColor,
                      "--avatar-border": fetchColor(resource).border,
                      "--avatar-text": fetchColor(resource).color,
                    }}
                  >
                    {findInitials(resource)}
                  </div>
                </Box>
              </Tooltip>
            </TableCell>

            <TableCell>
              {plannedStart && dayjs(plannedStart).isValid()
                ? dayjs(plannedStart).format("DD-MM-YYYY HH:mm")
                : "-"}
            </TableCell>

            <TableCell>
              <div className="duration-cell">{durationHrs ?? "—"}</div>
            </TableCell>
            <TableCell>
              {plannedStop && dayjs(plannedStop).isValid()
                ? dayjs(plannedStop).format("DD-MM-YYYY HH:mm")
                : "-"}
            </TableCell>
            <TableCell>
              <Tooltip
                title={
                  activityStatus?.toLowerCase() === "rejected"
                    ? (latestRejectReason ?? activityStatus)
                    : activityStatus
                }
              >
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
                onPauseDelayRequest={onPauseDelayRequest}
                onOpenCommentBox={onOpenCommentBox}
                deleteNode={deleteNode}
                fetchColor={fetchColor}
              />
            ))}
        </>
      )}
    </>
  );
}
