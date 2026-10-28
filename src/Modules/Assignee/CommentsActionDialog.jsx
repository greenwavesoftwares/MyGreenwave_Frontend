import React, { useState, useRef } from "react";

import {
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SpeakerNotesOffOutlinedIcon from "@mui/icons-material/SpeakerNotesOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import AddIcon from "@mui/icons-material/Add";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import "./CommentsActionDialog.css";
import { addComment, generateId } from "./AssigneeHelper";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { getUserData } from "../Login/Encrypt";
import ConfirmDialog from "./ConfirmDialog";
import DocumentViewer from "./DocumentViewer";
import { showToast } from "./toastService";
import {
  downloadAttachment,
  getAttachmentFileName,
  viewAttachmentFromMinio,
} from "./AttachmentHelper";
import StatusChip from "./StatusChip";
import { buildCommentMail } from "./commentMailTemplate";
import SendMailSection, { MailPreviewDialog } from "./SendMailSection";
import { sendCommentMail } from "./CommentMailApi";

export default function CommentsActionDialog({
  open,
  onClose,
  existingComments,
  setExistingComments,
  newComment,
  setNewComment,
  allowActions,
  activityName,
  activityStatus,
  // Optional: same (userId) => {color, bgColor, border} lookup the
  // Activities table uses for its resource avatars, so a person has the
  // same colour in both places. Falls back to a stable colour per user.
  fetchColor,
  // Optional: shown in the mail header/subject.
  projectName,
  // Optional: e-mail addresses pre-filled in "To" (e.g. assigners / owners).
  defaultRecipients = [],
}) {
  // Opens maximized; the header icon toggles to the regular windowed size.
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeReply, setActiveReply] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyAttachment, setReplyAttachment] = useState({});
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({});
  // ── loading states for buttons that hit the API ──
  const [addingComment, setAddingComment] = useState(false);
  const [replyLoadingIndex, setReplyLoadingIndex] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Which attachment (by storage key) is currently being viewed/downloaded,
  // so only that specific row's button shows a loader.
  const [viewingAttachmentKey, setViewingAttachmentKey] = useState(null);
  const [downloadingAttachmentKey, setDownloadingAttachmentKey] =
    useState(null);
  // Mobile-only: which panel is visible — "existing" comments or the "new" entry form.
  // Has no effect on desktop, where both panels are always shown stacked.
  const [mobileView, setMobileView] = useState("existing");
  // Drives the shared DocumentViewer dialog (view-in-place) for both
  // comment and reply attachments — passed into viewAttachment() from
  // AttachmentHelper.js at each call site below.
  const documentViewerRef = useRef(null);

  // ── send-mail state ──
  const [sendMail, setSendMail] = useState(false);
  const [mailTo, setMailTo] = useState(defaultRecipients);
  const [mailCc, setMailCc] = useState([]);
  const [mailNote, setMailNote] = useState("");
  const [showMailPreview, setShowMailPreview] = useState(false);

  const buildMailForComment = (comment) => {
    const user = getUserData()?.userDetails;
    return buildCommentMail({
      projectName,
      activityName,
      activityStatus,
      comment,
      senderName: user?.userName || user?.name,
      senderEmail: user?.userId,
      personalNote: mailNote,
    });
  };

  const resetMailState = () => {
    setSendMail(false);
    setMailTo(defaultRecipients);
    setMailCc([]);
    setMailNote("");
    setShowMailPreview(false);
  };

  const handleReplyAttachment = (commentIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReplyAttachment((prev) => ({
        ...prev,
        [commentIndex]: {
          attachmentBase64: reader.result.split(",")[1],
          attachmentName: file.name,
        },
      }));
    };
    reader.readAsDataURL(file);
    showToast("success", "Success", "File attached successfully");
    event.target.value = "";
  };

  const removeReplyAttachment = (commentIndex) => {
    setReplyAttachment((prev) => {
      const updated = { ...prev };
      delete updated[commentIndex];
      return updated;
    });
    showToast("success", "Success", "File removed successfully");
  };

  const handleChange = (field, value) => {
    setNewComment((prev) => ({ ...prev, [field]: value }));
  };

  const handleCommentAttachment = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewComment((prev) => ({
        ...prev,
        attachmentBase64: reader.result.split(",")[1],
        attachmentName: file.name,
      }));
    };
    reader.readAsDataURL(file);
    showToast("success", "Success", "File attached successfully");
    event.target.value = "";
  };

  const removeCommentAttachment = () => {
    setNewComment((prev) => ({
      ...prev,
      attachmentBase64: null,
      attachmentName: null,
    }));
    showToast("success", "Success", "File removed successfully");
  };

  const addComments = async () => {
    if (!newComment) return;
    // Say exactly which required field is missing instead of a generic message.
    const missing = [];
    if (!newComment.commentDescription?.trim()) missing.push("Description");
    if (!newComment.resolutionDate) missing.push("Resolution Date");
    if (!newComment.responsibility?.length) missing.push("Owner");
    if (sendMail && !mailTo.length) missing.push("Mail recipient (To)");
    if (missing.length) {
      showToast("error", "Data Missing", `Please fill in: ${missing.join(", ")}`);
      return;
    }
    const payload = {
      ...newComment,
      createdBy: getUserData()?.userDetails?.userId,
      createdAt: new Date().toISOString(),
      replies: [],
      commentId: generateId(),
      responsibility: Array.isArray(newComment?.responsibility)
        ? newComment.responsibility.join(",")
        : "",
      activityStatus: activityStatus,
    };
    setAddingComment(true);
    try {
      const response = await activityTrackerApi.addComment(
        newComment.projectId,
        payload,
      );

      // Previously a falsy response did nothing at all (no toast), which looked
      // like the button was dead. Now it is reported.
      if (!response) {
        showToast("error", "Error", "The entry was not saved. Please try again.");
        return;
      }

      const updatedComments =
        await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
          newComment.projectId,
          newComment.activityId,
        );
      setExistingComments(updatedComments);
      setNewComment(
        addComment(payload.projectId, payload.activityId, payload.moduleId),
      );

      // The entry is already saved at this point, so a mail failure must
      // never undo it — it is reported separately.
      if (sendMail) {
        try {
          const { subject, html, text } = buildMailForComment(newComment);
          await sendCommentMail(payload.projectId, payload.commentId, {
            to: mailTo,
            cc: mailCc,
            subject,
            html,
            text,
            attachmentName: newComment.attachmentName || null,
            attachmentBase64: newComment.attachmentBase64 || null,
          });
          showToast("success", "Success", "Comment added and mail sent");
        } catch (mailErr) {
          showToast(
            "error",
            "Mail not sent",
            `Comment was saved, but the mail failed: ${mailErr?.message || "unknown error"}`,
          );
        }
        resetMailState();
      } else {
        showToast("success", "Success", "Comment added successfully");
      }
    } catch (e) {
      showToast(
        "error",
        "Error",
        e?.response?.data?.message || e?.message || "Error in adding comment",
      );
    } finally {
      setAddingComment(false);
    }
  };

  const addReply = async (commentIndex) => {
    const comment = existingComments[commentIndex];
    const text = replyText[commentIndex];
    if (!text?.trim()) {
      showToast("error", "Data Missing", "Write a reply before sending");
      return;
    }
    const replyId = generateId();
    const payload = {
      commentId: comment.commentId,
      replyId,
      createdBy: getUserData()?.userDetails?.userId,
      createdAt: new Date().toISOString(),
      replyText: text,
      attachment: null,
      attachmentBase64: replyAttachment[commentIndex]?.attachmentBase64 || null,
      attachmentName: replyAttachment[commentIndex]?.attachmentName || null,
    };
    setReplyLoadingIndex(commentIndex);
    try {
      const replyAdded = await activityTrackerApi.addReply(
        comment.commentId,
        payload,
      );

      const existingCommentsResp =
        await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
          comment.projectId,
          comment.activityId,
        );
      setExistingComments(existingCommentsResp);
      setReplyText((prev) => ({ ...prev, [commentIndex]: "" }));
      setReplyAttachment((prev) => {
        const updated = { ...prev };
        delete updated[commentIndex];
        return updated;
      });
      setActiveReply(null);
      showToast("success", "Success", "Reply added successfully");
    } catch (e) {
      showToast("error", "Error", "Failed to add reply");
    } finally {
      setReplyLoadingIndex(null);
    }
  };

  const handleDelete = async (type, index, id) => {
    if (type === "comment") await deleteComment(index);
    else await deleteReply(index, id);
  };

  const deleteComment = async (index) => {
    try {
      const commentDeleted = await activityTrackerApi.deleteComment(
        existingComments[index].commentId,
      );

      setExistingComments((prev) => prev.filter((_, i) => i !== index));
      showToast("success", "Success", "Comment deleted successfully");
    } catch (e) {
      showToast("error", "Error", "Failed to delete reply");
    }
  };

  const deleteReply = async (commentIndex, replyId) => {
    try {
      const replyDeleted = await activityTrackerApi.deleteReply(replyId);
      setExistingComments((prev) =>
        prev.map((item, index) =>
          index === commentIndex
            ? {
                ...item,
                replies: item.replies.filter((r) => r.replyId !== replyId),
              }
            : item,
        ),
      );
      showToast("success", "Success", "Reply deleted successfully");
    } catch (e) {
      showToast("error", "Error", "Failed to delete reply");
    }
  };

  const openDeleteConfirmation = (type, index, id) => {
    setDeleteInfo({ type, index, id });
    setOpenConfirm(true);
  };

  // Wrap the generic AttachmentHelper functions so this dialog can track,
  // per attachment key, whether a view/download call is currently in
  // flight and disable/spin just that button.
  const handleViewAttachment = async (attachmentKey, folder) => {
    setViewingAttachmentKey(attachmentKey);
    try {
      await viewAttachmentFromMinio(attachmentKey, folder, documentViewerRef);
    } finally {
      setViewingAttachmentKey(null);
    }
  };

  const handleDownloadAttachment = async (attachmentKey, folder) => {
    setDownloadingAttachmentKey(attachmentKey);
    try {
      await downloadAttachment(attachmentKey, folder);
    } finally {
      setDownloadingAttachmentKey(null);
    }
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await handleDelete(deleteInfo.type, deleteInfo.index, deleteInfo.id);
    } finally {
      setDeleteLoading(false);
      setOpenConfirm(false);
    }
  };

  // Same logic as findInitials in TreeRows.jsx: "sreepriya.roy@x.com" -> "SR"
  const getUserInitials = (userId) => {
    if (!userId) return "?";
    const out = String(userId)
      .split("@")[0]
      .split(".")
      .map((p) => p[0])
      .join("")
      .toUpperCase();
    return out || "?";
  };

  // Same palette as the Activities avatars (see ProjectActivityInfo.jsx).
  const AVATAR_PALETTE = [
    { color: "#2563EB", bgColor: "#DBEAFE", border: "#93C5FD" },
    { color: "#059669", bgColor: "#D1FAE5", border: "#6EE7B7" },
    { color: "#7C3AED", bgColor: "#F3E8FF", border: "#C4B5FD" },
    { color: "#EC4899", bgColor: "#FCE7F3", border: "#F9A8D4" },
    { color: "#F97316", bgColor: "#FFEDD5", border: "#FDBA74" },
    { color: "#D97706", bgColor: "#FEF3C7", border: "#FCD34D" },
    { color: "#0891B2", bgColor: "#CFFAFE", border: "#67E8F9" },
    { color: "#65A30D", bgColor: "#ECFCCB", border: "#BEF264" },
    { color: "#4F46E5", bgColor: "#E0E7FF", border: "#A5B4FC" },
    { color: "#DC2626", bgColor: "#FEE2E2", border: "#FCA5A5" },
  ];

  const getAvatarColor = (userId) => {
    const fromActivities = fetchColor?.(userId);
    if (fromActivities) return fromActivities;
    const key = String(userId || "").toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // "Added By" / reply-header names are frequently full email
  // addresses. Left to overflow-wrap: break-word alone, the browser
  // is free to break anywhere — including mid-word inside "johnson"
  // or "example" — once the string doesn't fit. <wbr/> gives the
  // browser explicit, meaningful break opportunities right after "@"
  // and each "." (the natural segment boundaries in an email), which
  // normal line-breaking always prefers over an arbitrary forced
  // break. overflow-wrap: break-word stays on as a last-resort safety
  // net only, for the rare segment (e.g. a long local-part with no
  // dot) that's still too long even between those points.
  const renderBreakableEmail = (text) => {
    if (!text) return text;
    return String(text)
      .split(/([@.])/)
      .map((part, i) =>
        part === "@" || part === "." ? (
          <React.Fragment key={i}>
            {part}
            <wbr />
          </React.Fragment>
        ) : (
          part
        ),
      );
  };

  // Attachment filenames are often long and have no spaces (e.g.
  // "per_Day_1_ppt.pptx"), so left to overflow-wrap: break-word alone
  // the browser breaks wherever it runs out of room — including mid
  // word, like "per_ Day_ 1_p ptx". <wbr/> gives it explicit break
  // opportunities right after the natural separators in a filename
  // (".", "_", "-"), which normal line-breaking always prefers over
  // an arbitrary forced break. overflow-wrap: break-word stays on in
  // the CSS only as a last-resort safety net for a segment that's
  // still too long even between those points.
  const renderBreakableFilename = (text) => {
    if (!text) return text;
    return String(text)
      .split(/([._-])/)
      .map((part, i) =>
        part === "." || part === "_" || part === "-" ? (
          <React.Fragment key={i}>
            {part}
            <wbr />
          </React.Fragment>
        ) : (
          part
        ),
      );
  };

  // Reply text: where a line has to break, prefer the natural points — spaces and
  // right after any special character (. , @ _ - / : ; ? & = etc.) — via <wbr/>.
  // If a stretch has none of those (one long run of letters/digits), the CSS
  // (overflow-wrap: anywhere) breaks it between letters as the last resort.
  const renderBreakableText = (text) => {
    if (!text) return text;
    return String(text)
      .split(/([^\p{L}\p{N}\s])/u)
      .map((part, i) =>
        i % 2 === 1 ? (
          <React.Fragment key={i}>
            {part}
            <wbr />
          </React.Fragment>
        ) : (
          part
        ),
      );
  };

  const TruncatedText = ({ text }) => (
    <Tooltip
      title={text || ""}
      placement="top"
      arrow
      disableHoverListener={!text || text.length < 60}
    >
      <div className="table-text-clamp">
        {text || <span className="cell-empty">—</span>}
      </div>
    </Tooltip>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // maxWidth={false} stops MUI from adding its default
      // MuiDialog-paperWidthSm class (max-width: 600px) to the Paper,
      // which would otherwise silently override the width rules in
      // CommentsActionDialog.css regardless of viewport size.
      maxWidth={false}
      fullScreen={isMaximized}
      // Mounts the portal inside .pai-page — same as PauseReasonDialog —
      // so the shared --pj-* vars (and their dark-mode overrides) are
      // actually in scope. Falls back to the default body portal if
      // .pai-page isn't found.
      container={() => document.querySelector(".pai-page") || document.body}
      PaperProps={{
        className: `comments-dialog ${isMaximized ? "is-maximized" : "is-restored"}`,
      }}
    >
      <DialogContent className="comments-content">
        {/* ── HEADER ── */}
        <div className="comments-header">
          <div className="comments-header-left">
            <div className="comments-icon">
              <ChatBubbleOutlineIcon />
            </div>
            <div>
              <Typography className="comments-title">
                Comments &amp; Action Points
                {!!existingComments?.length && (
                  <span className="comments-count-badge">
                    {existingComments.length}
                  </span>
                )}
              </Typography>
              <Typography className="comments-subtitle">
                {activityName}
              </Typography>
            </div>
          </div>

          <div className="comments-header-actions">
          <Tooltip title={isMaximized ? "Minimize" : "Maximize"}>
            <IconButton
              onClick={() => setIsMaximized((v) => !v)}
              aria-label={isMaximized ? "Minimize dialog" : "Maximize dialog"}
              size="small"
              className="btn-toggle-size"
            >
              {isMaximized ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} aria-label="Close dialog" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
          </div>
        </div>

        {/* ── MOBILE VIEW SWITCHER (hidden on desktop) ── */}
        <div className="mobile-view-tabs">
          <button
            type="button"
            className={`mobile-view-tab ${mobileView === "existing" ? "active" : ""}`}
            onClick={() => setMobileView("existing")}
          >
            Existing
            {!!existingComments?.length && (
              <span className="mobile-view-tab-count">
                {existingComments.length}
              </span>
            )}
          </button>
          {allowActions && (
            <button
              type="button"
              className={`mobile-view-tab ${mobileView === "new" ? "active" : ""}`}
              onClick={() => setMobileView("new")}
            >
              Add New
            </button>
          )}
        </div>

        {/* ── COMMENTS LIST ──
            .entries-container scrolls both vertically and horizontally.
            The table is NOT wrapped in a separate overflow-x container —
            see the comment above .entries-container in
            CommentsActionDialog.css for why that would break the sticky
            header's scroll-ancestor binding. */}
        <div
          className={`entries-container ${
            mobileView === "existing" ? "mobile-visible" : "mobile-hidden"
          }`}
        >
          {!existingComments?.length ? (
            <div className="empty-state">
              <div className="empty-state-icon-wrap">
                <SpeakerNotesOffOutlinedIcon className="empty-state-icon" />
              </div>
              <Typography className="empty-state-title">
                No comments yet
              </Typography>
              <Typography className="empty-state-text">
                Add the first description or action point below to start the
                conversation.
              </Typography>
            </div>
          ) : (
            <Table size="small" className="comments-table">
              <TableHead>
                <TableRow>
                  <TableCell aria-hidden="true">#</TableCell>
                  <TableCell>
                    <span className="col-label">Description</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Action Point</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Resolution Date</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Owner</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Others</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Attachment</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Added By</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Entry Time Status</span>
                  </TableCell>
                  <TableCell>
                    <span className="col-label">Actions</span>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {existingComments.map((entry, index) => (
                  <React.Fragment key={index}>
                    {/* COMMENT ROW */}
                    <TableRow
                      className={index % 2 === 1 ? "row-alt" : undefined}
                    >
                      <TableCell data-label="#" className="cell-index">
                        {index + 1}
                      </TableCell>
                      <TableCell data-label="Description">
                        <TruncatedText text={entry.commentDescription} />
                      </TableCell>
                      <TableCell data-label="Action Point">
                        <TruncatedText text={entry.actionPoint} />
                      </TableCell>
                      <TableCell data-label="Resolution Date">
                        {entry.resolutionDate}
                      </TableCell>
                      <TableCell data-label="Owner">
                        {/* responsibility is stored as a comma-separated
                            string (e.g. "GW,Customer") — one badge per owner */}
                        <div className="owner-chips">
                          {(Array.isArray(entry.responsibility)
                            ? entry.responsibility
                            : String(entry.responsibility || "").split(",")
                          )
                            .map((owner) => owner.trim())
                            .filter(Boolean)
                            .map((owner) => (
                              <Chip
                                key={owner}
                                size="small"
                                color="primary"
                                label={owner}
                              />
                            ))}
                        </div>
                      </TableCell>
                      <TableCell data-label="Others">
                        <TruncatedText text={entry.others} />
                      </TableCell>

                      {/* ATTACHMENT */}
                      <TableCell data-label="Attachment">
                        {entry.attachment ? (
                          <div className="attachment-pill">
                            <InsertDriveFileOutlinedIcon fontSize="small" />
                            <span
                              className="attachment-name"
                              title={getAttachmentFileName(entry.attachment)}
                              style={{
                                cursor:
                                  viewingAttachmentKey === entry.attachment
                                    ? "wait"
                                    : "pointer",
                                pointerEvents:
                                  viewingAttachmentKey === entry.attachment
                                    ? "none"
                                    : "auto",
                                opacity:
                                  viewingAttachmentKey === entry.attachment
                                    ? 0.6
                                    : 1,
                              }}
                              onClick={() =>
                                handleViewAttachment(
                                  entry.attachment,
                                  "comments",
                                )
                              }
                            >
                              {viewingAttachmentKey === entry.attachment && (
                                <CircularProgress size={12} sx={{ mr: 0.5 }} />
                              )}
                              {renderBreakableFilename(
                                getAttachmentFileName(entry.attachment),
                              )}
                            </span>

                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                aria-label="Download attachment"
                                disabled={
                                  downloadingAttachmentKey === entry.attachment
                                }
                                onClick={() =>
                                  handleDownloadAttachment(
                                    entry.attachment,
                                    "comments",
                                  )
                                }
                              >
                                {downloadingAttachmentKey ===
                                entry.attachment ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <DownloadOutlinedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="cell-empty">—</span>
                        )}
                      </TableCell>

                      {/* ADDED BY — initials chip (same look as the Activities
                          resource avatar); email + timestamp on hover. */}
                      <TableCell data-label="Added By">
                        <div className="added-chip-cell">
                          <Tooltip
                            arrow
                            placement="top"
                            enterTouchDelay={0}
                            title={
                              <div className="added-tooltip">
                                <strong>{entry.createdBy || "Unknown"}</strong>
                                <span>
                                  {entry.createdAt
                                    ? new Date(entry.createdAt).toLocaleString()
                                    : "—"}
                                </span>
                              </div>
                            }
                          >
                            <div
                              className="added-by-avatar"
                              tabIndex={0}
                              role="img"
                              aria-label={`Added by ${entry.createdBy || "unknown"}`}
                              style={{
                                "--avatar-bg": getAvatarColor(entry.createdBy).bgColor,
                                "--avatar-border": getAvatarColor(entry.createdBy).border,
                                "--avatar-text": getAvatarColor(entry.createdBy).color,
                              }}
                            >
                              {getUserInitials(entry.createdBy)}
                            </div>
                          </Tooltip>
                        </div>
                      </TableCell>
                      {/* ENTRY TIME STATUS */}
                      <TableCell data-label="Entry Time Status">
                        <div className="added-cell">
                          {entry?.activityStatus?.length > 0 ? (
                            <StatusChip status={entry.activityStatus} isPulseEnabled={false}/>
                          ) : (
                            <span className="cell-empty">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell data-label="Actions" className="cell-actions">
                        <div className="action-buttons">
                          {allowActions && (
                            <Tooltip title="Reply">
                              <Button
                                size="small"
                                variant="outlined"
                                className="btn-reply"
                                startIcon={<ReplyOutlinedIcon />}
                                aria-label="Reply"
                                onClick={() =>
                                  setActiveReply(
                                    activeReply === index ? null : index,
                                  )
                                }
                              >
                                <span className="btn-reply-label">Reply</span>
                                {!!entry.replies?.length && (
                                  <span className="reply-count">
                                    {entry.replies.length}
                                  </span>
                                )}
                              </Button>
                            </Tooltip>
                          )}
                          {allowActions && (
                            <IconButton
                              size="small"
                              disabled={
                                entry.createdBy !==
                                getUserData()?.userDetails?.userId
                              }
                              aria-label="Delete comment"
                              onClick={() =>
                                openDeleteConfirmation("comment", index)
                              }
                            >
                              <DeleteOutlineIcon
                                fontSize="small"
                                color="error"
                              />
                            </IconButton>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* REPLIES LIST */}
                    {entry.replies?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="reply-history-cell">
                          {entry.replies.map((reply) => (
                            <div key={reply.replyId} className="reply-item">
                              <div className="reply-header">
                                <span
                                  className="avatar-badge avatar-badge-sm"
                                  aria-hidden="true"
                                >
                                  {getInitials(reply.createdBy)}
                                </span>
                                <strong>
                                  {renderBreakableEmail(reply.createdBy)}
                                </strong>
                                <span>
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                                {allowActions && (
                                  <IconButton
                                    size="small"
                                    disabled={
                                      reply.createdBy !==
                                      getUserData()?.userDetails?.userId
                                    }
                                    aria-label="Delete reply"
                                    onClick={() =>
                                      openDeleteConfirmation(
                                        "reply",
                                        index,
                                        reply.replyId,
                                      )
                                    }
                                  >
                                    <DeleteOutlineIcon
                                      fontSize="small"
                                      color="error"
                                    />
                                  </IconButton>
                                )}
                              </div>
                              <div className="reply-text">{renderBreakableText(reply.replyText)}</div>

                              {reply.attachment && (
                                <div
                                  className="attachment-pill"
                                  style={{ marginTop: 8 }}
                                >
                                  <InsertDriveFileOutlinedIcon fontSize="small" />
                                  <span
                                    className="attachment-name"
                                    title={getAttachmentFileName(
                                      reply.attachment,
                                    )}
                                    style={{
                                      cursor:
                                        viewingAttachmentKey ===
                                        reply.attachment
                                          ? "wait"
                                          : "pointer",
                                      pointerEvents:
                                        viewingAttachmentKey ===
                                        reply.attachment
                                          ? "none"
                                          : "auto",
                                      opacity:
                                        viewingAttachmentKey ===
                                        reply.attachment
                                          ? 0.6
                                          : 1,
                                    }}
                                    onClick={() =>
                                      handleViewAttachment(
                                        reply.attachment,
                                        "replies",
                                      )
                                    }
                                  >
                                    {viewingAttachmentKey ===
                                      reply.attachment && (
                                      <CircularProgress
                                        size={12}
                                        sx={{ mr: 0.5 }}
                                      />
                                    )}
                                    {renderBreakableFilename(
                                      getAttachmentFileName(reply.attachment),
                                    )}
                                  </span>
                                  <Tooltip title="Download">
                                    <IconButton
                                      size="small"
                                      aria-label="Download attachment"
                                      disabled={
                                        downloadingAttachmentKey ===
                                        reply.attachment
                                      }
                                      onClick={() =>
                                        handleDownloadAttachment(
                                          reply.attachment,
                                          "replies",
                                        )
                                      }
                                    >
                                      {downloadingAttachmentKey ===
                                      reply.attachment ? (
                                        <CircularProgress size={14} />
                                      ) : (
                                        <DownloadOutlinedIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                          ))}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* REPLY INPUT */}
                    {activeReply === index && (
                      <TableRow>
                        <TableCell colSpan={10} className="reply-box-cell">
                          <div className="reply-box">
                            <div className="reply-avatar">
                              {getUserData()?.userDetails?.userId ? (
                                <span aria-hidden="true">
                                  {getInitials(
                                    getUserData()?.userDetails?.userId,
                                  )}
                                </span>
                              ) : (
                                <PersonOutlineIcon />
                              )}
                            </div>
                            <div className="reply-content">
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Write a reply…"
                                value={replyText[index] || ""}
                                onChange={(e) =>
                                  setReplyText((prev) => ({
                                    ...prev,
                                    [index]: e.target.value,
                                  }))
                                }
                              />
                              <div className="reply-footer">
                                <div className="reply-footer-actions">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    className="btn-cancel"
                                    onClick={() => setActiveReply(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={
                                      replyLoadingIndex === index ? (
                                        <CircularProgress
                                          size={14}
                                          color="inherit"
                                        />
                                      ) : (
                                        <SendOutlinedIcon />
                                      )
                                    }
                                    disabled={replyLoadingIndex === index}
                                    onClick={() => addReply(index)}
                                  >
                                    Send Reply
                                  </Button>

                                  <input
                                    id={`reply-file-${index}`}
                                    hidden
                                    type="file"
                                    onChange={(e) =>
                                      handleReplyAttachment(index, e)
                                    }
                                  />
                                  <label htmlFor={`reply-file-${index}`}>
                                    <Button
                                      component="span"
                                      size="small"
                                      variant="outlined"
                                      startIcon={<AttachFileIcon />}
                                    >
                                      Attach
                                    </Button>
                                  </label>

                                  {replyAttachment[index]?.attachmentName && (
                                    <div className="attachment-pill">
                                      <InsertDriveFileOutlinedIcon fontSize="small" />
                                      <span className="attachment-name">
                                        {renderBreakableFilename(
                                          replyAttachment[index].attachmentName,
                                        )}
                                      </span>
                                      <IconButton
                                        size="small"
                                        aria-label="Remove attachment"
                                        onClick={() =>
                                          removeReplyAttachment(index)
                                        }
                                      >
                                        <CancelOutlinedIcon fontSize="small" />
                                      </IconButton>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* ── ADD NEW ENTRY ── */}
        {allowActions && (
          <div
            className={`entry-section ${
              mobileView === "new" ? "mobile-visible" : "mobile-hidden"
            }`}
          >
            <div className="entry-title">
              <AddIcon fontSize="small" />
              Add new entry
            </div>

            <div className="entry-card">
              <div className="entry-grid">
                <div>
                  <label>Description *</label>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={newComment?.commentDescription}
                    onChange={(e) =>
                      handleChange("commentDescription", e.target.value)
                    }
                    placeholder="What happened or was discussed…"
                  />
                </div>

                <div>
                  <label>Action Point</label>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={newComment?.actionPoint}
                    onChange={(e) =>
                      handleChange("actionPoint", e.target.value)
                    }
                    placeholder="Next step — who does what…"
                  />
                </div>

                <div>
                  <label>Resolution Date *</label>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={newComment?.resolutionDate}
                    onChange={(e) =>
                      handleChange("resolutionDate", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label>Owner *</label>
                  <div className="chip-group">
                    {["GW", "Customer"].map((opt) => (
                      <Chip
                        key={opt}
                        clickable
                        label={opt}
                        color={
                          newComment?.responsibility?.includes(opt)
                            ? "primary"
                            : "default"
                        }
                        variant={
                          newComment?.responsibility?.includes(opt)
                            ? "filled"
                            : "outlined"
                        }
                        onClick={() =>
                          handleChange(
                            "responsibility",
                            newComment?.responsibility?.includes(opt)
                              ? newComment.responsibility.filter(
                                  (item) => item !== opt,
                                )
                              : [...(newComment?.responsibility || []), opt],
                          )
                        }
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label>Others</label>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={newComment?.others}
                    onChange={(e) => handleChange("others", e.target.value)}
                    placeholder="Any other notes…"
                  />
                </div>
              </div>

              {/* ── SEND MAIL ── */}
              <SendMailSection
                enabled={sendMail}
                onToggle={setSendMail}
                to={mailTo}
                onToChange={setMailTo}
                cc={mailCc}
                onCcChange={setMailCc}
                note={mailNote}
                onNoteChange={setMailNote}
                attachmentName={newComment?.attachmentName}
                onPreview={() => setShowMailPreview(true)}
              />
            </div>

            {/* FOOTER */}
            <div className="dialog-footer">
              {newComment?.attachmentBase64 ? (
                <div className="attachment-staged">
                  <InsertDriveFileOutlinedIcon fontSize="small" />
                  <span
                    className="attachment-name"
                    title={newComment?.attachmentName}
                  >
                    {renderBreakableFilename(newComment?.attachmentName)}
                  </span>
                  <IconButton
                    size="small"
                    onClick={removeCommentAttachment}
                    aria-label="Remove attachment"
                  >
                    <CancelOutlinedIcon fontSize="small" />
                  </IconButton>
                </div>
              ) : (
                <>
                  <input
                    id="comment-file"
                    hidden
                    type="file"
                    onChange={handleCommentAttachment}
                  />
                  <label htmlFor="comment-file">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                    >
                      Attach File
                    </Button>
                  </label>
                </>
              )}

              <div className="footer-actions">
                <Button
                  variant="outlined"
                  className="btn-cancel"
                  onClick={onClose}
                >
                  × Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    addingComment ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : sendMail ? (
                      <SendOutlinedIcon />
                    ) : (
                      <AddIcon />
                    )
                  }
                  disabled={addingComment}
                  onClick={addComments}
                >
                  {sendMail ? "Add Entry & Send Mail" : "Add Entry"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <MailPreviewDialog
          open={showMailPreview}
          onClose={() => setShowMailPreview(false)}
          mail={showMailPreview ? buildMailForComment(newComment || {}) : null}
          to={mailTo}
          cc={mailCc}
        />

        <ConfirmDialog
          open={openConfirm}
          onConfirm={confirmDelete}
          onCancel={() => setOpenConfirm(false)}
          loading={deleteLoading}
        />

        {/* Shared preview dialog for comment/reply attachments — opened
            imperatively via documentViewerRef from viewAttachment above. */}
        <DocumentViewer ref={documentViewerRef} hideTrigger />
      </DialogContent>
    </Dialog>
  );
}