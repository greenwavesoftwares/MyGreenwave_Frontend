import React, { useState } from "react";

import {
  TableRow,
  TableCell,
  Box,
  Chip,
  Typography,
  Table,
  TableHead,
  TableBody,
  Tooltip,
  TextField,
  TextareaAutosize,
} from "@mui/material";
import { Dialog } from "primereact/dialog";
import ModeCommentOutlinedIcon from "@mui/icons-material/ModeCommentOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
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
import { updateStatus } from "./activityFilterUtils";

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
  customColumns,
  activityLookupMap,
  loadingKeys,
}) {
  const isKeyLoading = (key) => loadingKeys?.has(key) ?? false;
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
    customValues,
    dependsOn,
  } = node;

  const hasChildren = children?.length > 0;
  const isExpanded = expanded?.[id] ?? false;
  const updatedStatus = updateStatus(node.activityStatus, node.activityStatus==='Running'?node.plannedStop:node.plannedStart);
  const [dependencyDialogVisible, setDependencyDialogVisible] = useState(false);
  const handleOpenDependencies = () => {
    setDependencyDialogVisible(true);
  };
  const handleCloseDependencies = () => {
    setDependencyDialogVisible(false);
  };
  const formatDateTime = (value) =>
    value && dayjs(value).isValid() ? dayjs(value).format("DD-MM-YYYY HH:mm") : "—";
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
    const isStatusLoading = isKeyLoading(`status-${id}`);
    const isSubmitLoading = isKeyLoading(`submit-${id}`);
    const isCommentLoading = isKeyLoading(`comment-${id}`);

    const statusActions = {
      Pending: [
        <Tooltip key="start" title="Start">
          <button
            className="icon-button icon-btn--start"
            disabled={isStatusLoading}
            onClick={() => {
              const minutesLeft = dayjs().diff(dayjs(plannedStart), "minute");
              console.log("Minutes left::", minutesLeft);
              console.log("Activities Lookup map:", activityLookupMap);

              if (node?.dependsOn?.length > 0) {
                const areDependentsCompleted =
                  node?.dependsOn?.every((depId) => {
                    const status =
                      activityLookupMap?.[depId]?.activityStatus?.toLowerCase();
                    return status === "completed" || status === "finished";
                  }) ?? true;
                if (areDependentsCompleted !== true) {
                  showToast(
                    "error",
                    "Error",
                    "Dependent activities must be completed first. Click View Dependencies to see the activities and who is responsible.",
                  );
                  return;
                }
              }
              if (minutesLeft >= 60) {
                // 15 minutes or less remaining

                onPauseDelayRequest(id, node, "StartDelay");
              } else {
                updateStatusOfActivity(id, "Running", node);
              }
            }}
          >
            {isStatusLoading ? (
              <span className="icon-btn-spinner" />
            ) : (
              <PlayArrowIcon sx={{ fontSize: 14 }} className="start-icon" />
            )}
          </button>
        </Tooltip>,
      ],

      Running: [
        <Tooltip key="pause" title="Pause">
          <button
            className="icon-button icon-btn--pause"
            disabled={isStatusLoading}
            onClick={() => onPauseDelayRequest(id, node, "Paused")}
          >
            {isStatusLoading ? (
              <span className="icon-btn-spinner" />
            ) : (
              <PauseIcon sx={{ fontSize: 14 }} className="pause-icon" />
            )}
          </button>
        </Tooltip>,

          <Tooltip key="complete" title="Complete">
            <button
              className="icon-button icon-btn--stop"
              disabled={isStatusLoading}
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
                console.log("Minutes left:::", minutesLeft);
                if (minutesLeft >= 60) {
                  // 15 minutes or less remaining

                  onPauseDelayRequest(id, node, "StopDelay");
                } else {
                  updateStatusOfActivity(id, "Completed", node);
                }
              }}
            >
              {isStatusLoading ? (
                <span className="icon-btn-spinner" />
              ) : (
                <StopIcon sx={{ fontSize: 14 }} className="stop-icon" />
              )}
            </button>
          </Tooltip>
        ,
      ].filter(Boolean),

      Rejected: [
        <Tooltip key="restart" title="Restart">
          <button
            className="icon-button icon-btn--start"
            disabled={isStatusLoading}
            onClick={() => updateStatusOfActivity(id, "Running", node)}
          >
            {isStatusLoading ? (
              <span className="icon-btn-spinner" />
            ) : (
              <PlayArrowIcon sx={{ fontSize: 14 }} className="start-icon" />
            )}
          </button>
        </Tooltip>,
      ].filter(Boolean),

      Paused: [
        <Tooltip key="resume" title="Resume">
          <button
            className="icon-button icon-btn--resume"
            disabled={isStatusLoading}
            onClick={() => updateStatusOfActivity(id, "Running", node)}
          >
            {isStatusLoading ? (
              <span className="icon-btn-spinner" />
            ) : (
              <FastForwardIcon sx={{ fontSize: 14 }} className="resume-icon" />
            )}
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
      Completed: [
        <Tooltip key="submit" title="Redo Activity">
          <button
            className="icon-button icon-btn--feedback"
            disabled={isStatusLoading}
            onClick={() => onPauseDelayRequest(id, node, "Redo")}
          >
            {isStatusLoading ? (
              <span className="icon-btn-spinner" />
            ) : (
              <RotateCcw size={15} strokeWidth={2} />
            )}
          </button>
        </Tooltip>,
      ],
      "Not Ready": [
        <Tooltip key="submit" title="Submit Activity">
          <button
            className="icon-button icon-btn--submit"
            disabled={isSubmitLoading}
            onClick={() => submitAddedNode(projectId, moduleId, node)}
          >
            {isSubmitLoading ? (
              <span className="icon-btn-spinner" />
            ) : (
              <SendIcon sx={{ fontSize: 14 }} className="send-icon" />
            )}
          </button>
        </Tooltip>,

        <Tooltip key="delete" title="Delete Activity">
          <button
            className="icon-button icon-btn--delete"
            disabled={isSubmitLoading}
            onClick={() => deleteNode(projectId, moduleId, node)}
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>,
      ],
    };

    const actionItems = [];

    if (dependsOn?.length > 0 && isAssignedUser) {
      actionItems.push(
        <Tooltip key="dependencies" title="View Dependencies">
          <button
            className="icon-button icon-btn--dependencies"
            onClick={handleOpenDependencies}
          >
            <AccountTreeOutlinedIcon sx={{ fontSize: 14 }} />
          </button>
        </Tooltip>,
      );
    }

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
                disabled={isCommentLoading}
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
                {isCommentLoading ? (
                  <span className="icon-btn-spinner" />
                ) : (
                  <ModeCommentOutlinedIcon sx={{ fontSize: 14 }} />
                )}
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

    return (
      <>
        <div className="action-container">{actionItems}</div>

        <Dialog
          className="dependency-dialog"
          visible={dependencyDialogVisible}
          onHide={handleCloseDependencies}
          header={
            <Box className="dependency-dialog-header">
              <Box className="dependency-dialog-icon">
                <AccountTreeOutlinedIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography className="dependency-dialog-title">
                  {name || "Activity"}
                </Typography>
                <Typography className="dependency-dialog-subtitle">
                  Dependencies · {dependsOn?.length ?? 0}{" "}
                  {dependsOn?.length === 1 ? "linked task" : "linked tasks"}
                </Typography>
              </Box>
            </Box>
          }
          // Mounts the portal inside .pai-page — same trick
          // CommentsActionDialog/PauseReasonDialog/DocumentViewer's
          // PrimeReact Dialog use — so the shared --pj-* vars (and
          // their dark-mode overrides) are in scope. Falls back to the
          // default body portal if .pai-page isn't found.
          appendTo={() => document.querySelector(".pai-page") || document.body}
          baseZIndex={1400}
          // No anchor/position props — PrimeReact renders this in its
          // own default centered-overlay position rather than pinned
          // next to the trigger button.
          modal
          dismissableMask
          draggable={false}
          style={{ width: "420px" }}
          breakpoints={{ "640px": "94vw" }}
        >
          {dependsOn?.length > 0 ? (
            <Box className="dependency-list">
              {dependsOn.map((depId) => {
                const dep = activityLookupMap?.[depId];
                const hasActual = Boolean(
                  dep?.actualStart || dep?.actualStop,
                );

                return (
                  <Box key={depId} className="dependency-item">
                    <Box className="dependency-item-head">
                      <Typography className="dependency-item-name">
                        {dep?.name ?? "Unknown activity"}
                      </Typography>
                      {dep?.activityStatus && (
                        <StatusChip
                          status={dep.activityStatus.toLowerCase()}
                        />
                      )}
                    </Box>

                    {dep?.resource && (
                      <Box className="dependency-item-resource">
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 13 }} />
                        <Typography component="span">
                          {dep.resource}
                        </Typography>
                      </Box>
                    )}

                    <Box className="dependency-time-grid">
                      <Box className="dependency-time-box dependency-time-box--scheduled">
                        <Box className="dependency-time-box-label">
                          <CalendarMonthOutlinedIcon sx={{ fontSize: 12 }} />
                          SCHEDULED START
                        </Box>
                        <Typography className="dependency-time-box-value">
                          {formatDateTime(dep?.plannedStart)}
                        </Typography>
                      </Box>
                      <Box className="dependency-time-box dependency-time-box--scheduled">
                        <Box className="dependency-time-box-label">
                          <CalendarMonthOutlinedIcon sx={{ fontSize: 12 }} />
                          SCHEDULED STOP
                        </Box>
                        <Typography className="dependency-time-box-value">
                          {formatDateTime(dep?.plannedStop)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box className="dependency-time-grid">
                      <Box
                        className={`dependency-time-box ${
                          hasActual
                            ? "dependency-time-box--actual"
                            : "dependency-time-box--pending"
                        }`}
                      >
                        <Box className="dependency-time-box-label">
                          <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
                          ACTUAL START
                        </Box>
                        <Typography className="dependency-time-box-value">
                          {formatDateTime(dep?.actualStart)}
                        </Typography>
                      </Box>
                      <Box
                        className={`dependency-time-box ${
                          hasActual
                            ? "dependency-time-box--actual"
                            : "dependency-time-box--pending"
                        }`}
                      >
                        <Box className="dependency-time-box-label">
                          <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
                          ACTUAL STOP
                        </Box>
                        <Typography className="dependency-time-box-value">
                          {formatDateTime(dep?.actualStop)}
                        </Typography>
                      </Box>
                    </Box>

                    {!dep && (
                      <Typography className="dependency-item-id">
                        {depId}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography className="dependency-empty">
              No dependencies
            </Typography>
          )}
        </Dialog>
      </>
    );
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
                customColumns={customColumns}
                activityLookupMap={activityLookupMap}
                loadingKeys={loadingKeys}
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
              {formatDateTime(plannedStart)}
            </TableCell>

            <TableCell>
              <div className="duration-cell">{durationHrs ?? "—"}</div>
            </TableCell>
            <TableCell>
              {formatDateTime(plannedStop)}
            </TableCell>
            <TableCell>
              <Tooltip
                title={
                  activityStatus?.toLowerCase() === "rejected" &&
                  (latestRejectReason ?? activityStatus)
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
                  <StatusChip status={updatedStatus?.toLowerCase()} />
                </span>
              </Tooltip>
            </TableCell>

            <TableCell>
              {formatDateTime(actualStart)}
            </TableCell>

            <TableCell>
              {formatDateTime(actualStop)}
            </TableCell>

            {/* <TableCell>{pauseStart && dayjs(pauseStart).isValid()
                ? dayjs(pauseStart).format("YYYY-MM-DD HH:mm")
                : "-"}</TableCell>

            <TableCell>{pauseDuration || "-"}</TableCell> */}
            {customColumns?.map((col) => (
              <TableCell key={col.id}>
                {customValues?.[col.id] ?? "-"}
              </TableCell>
            ))}
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
                customColumns={customColumns}
                activityLookupMap={activityLookupMap}
                loadingKeys={loadingKeys}
                onOpenFeedbackForm={onOpenFeedbackForm}
              />
            ))}
        </>
      )}
    </>
  );
}
