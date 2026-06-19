import React, { useState } from "react";

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
} from "@mui/material";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SpeakerNotesOffOutlinedIcon from "@mui/icons-material/SpeakerNotesOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import "./CommentsActionDialog.css";
import { addComment } from "./AssigneeHelper";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { getUserData } from "../Login/Encrypt";

export default function CommentsActionDialog({
  open,
  onClose,
  existingComments,
  setExistingComments,
  newComment,
  setNewComment
}) {
  const [activeReply, setActiveReply] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyAttachment, setReplyAttachment] = useState({});

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
  event.target.value = "";
};

const removeReplyAttachment = (commentIndex) => {
  setReplyAttachment((prev) => {
    const updated = { ...prev };
    delete updated[commentIndex];
    return updated;
  });
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

  // Allow selecting the same file again later
  event.target.value = "";
};

// const removeCommentAttachment = () => {
//   setNewComment((prev) => ({
//     ...prev,
//     attachmentBase64: null,
//     attachmentName: null,
//   }));
// };

  // ── NEW: remove the staged attachment ──────────────────────────────
  const removeCommentAttachment = () => {
    setNewComment((prev) => ({
      ...prev,
      attachmentBase64: null,
      attachmentName: null,
    }));
  };
console.log('Comment : ',newComment)


  const addComments = async() => {
    if (!newComment.commentDescription.trim()) return;
    const payload = {
      ...newComment,
      createdBy: getUserData()?.userDetails?.userId,
      createdAt: new Date().toISOString(),
      replies: [],
      commentId:crypto.randomUUID(), // temporary ID for frontend purposes
      responsibility: Array.isArray(newComment?.responsibility)
  ? newComment.responsibility.join(",")
  : ""
    };
    console.log("new comment:",newComment)
    console.log('Updated Payload : ',payload)
    const response=await activityTrackerApi.addComment(newComment.projectId,payload)
    if(response)
    {
    // setExistingComments((prev) => [...prev, payload]);
    
    const updatedComments= await activityTrackerApi.getCommentsByActivity(newComment.projectId,newComment.activityId)
    setExistingComments(updatedComments)
    const newCommentPayload=addComment(payload.projectId,payload.activityId,payload.moduleId)
    console.log("New Comment:",newCommentPayload)
    setNewComment(newCommentPayload);
    }
  };

 const addReply = async (commentIndex) => {
  const comment = existingComments[commentIndex];
  const text = replyText[commentIndex];

  if (!text?.trim()) return;

  const replyId = crypto.randomUUID();

  const payload = {
    commentId: comment.commentId,
    replyId,
    createdBy: getUserData()?.userDetails?.userId,
    createdAt: new Date().toISOString(),
    replyText: text,
    attachment: null,
    attachmentBase64:
      replyAttachment[commentIndex]?.attachmentBase64 || null,
    attachmentName:
      replyAttachment[commentIndex]?.attachmentName || null,
  };

  console.log("Reply Payload:", payload);

 const replyAdded= await activityTrackerApi.addReply(comment.commentId,payload);

 if(!replyAdded) {
  console.error("Failed to add reply");
  return;
 }

  // await activityTrackerApi.addReply(payload);

  setExistingComments((prev) =>
    prev.map((item, index) =>
      index === commentIndex
        ? {
            ...item,
            replies: [
              ...(item.replies || []),
              {
                // replyId,
                // replyText: text,
                // createdBy: payload.createdBy,
                // createdAt: payload.createdAt,
                // attachmentName: payload.attachmentName,
                ...payload,
                attachment: payload.commentId+'_'+payload.attachmentName,
              },
            ],
          }
        : item
    )
  );

  setReplyText((prev) => ({ ...prev, [commentIndex]: "" }));

  setReplyAttachment((prev) => {
    const updated = { ...prev };
    delete updated[commentIndex];
    return updated;
  });

  setActiveReply(null);
};

  const deleteComment =async (index) => {
   const commentDeleted= await activityTrackerApi.deleteComment(existingComments[index].commentId);
   if(!commentDeleted) {
    console.error("Failed to delete comment");
    return;
   }
    setExistingComments((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteReply = async (commentIndex, replyId) => {
    const replyDeleted= await activityTrackerApi.deleteReply(replyId);
    if(!replyDeleted) {
      console.error("Failed to delete reply");
      return;
     }
    setExistingComments((prev) =>
      prev.map((item, index) =>
        index === commentIndex
          ? {
              ...item,
              replies: item.replies.filter((r) => r.replyId !== replyId),
            }
          : item
      )
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ className: "comments-dialog" }}
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
                Comments & Action Points
              </Typography>
              <Typography className="comments-subtitle">
                {newComment?.projectId}
              </Typography>
            </div>
          </div>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        {/* ── ENTRIES ── */}
        <div className="entries-container">
          {!existingComments?.length ? (
            <div className="empty-state">
              <SpeakerNotesOffOutlinedIcon className="empty-state-icon" />
              <Typography className="empty-state-text">
                No entries yet — add the first description / action point below.
              </Typography>
            </div>
          ) : (
            <Table size="small" className="comments-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>DESCRIPTION</TableCell>
                  <TableCell>ACTION POINT</TableCell>
                  <TableCell>RESOLUTION DATE</TableCell>
                  <TableCell>RESPONSIBILITY</TableCell>
                  <TableCell>OTHERS</TableCell>
                  <TableCell>ATTACHMENT</TableCell>
                  <TableCell>ADDED</TableCell>
                  <TableCell>ACTIONS</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {existingComments.map((entry, index) => (
                  <React.Fragment key={index}>

                    {/* COMMENT ROW */}
                    <TableRow>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{entry.commentDescription}</TableCell>
                      <TableCell>{entry.actionPoint}</TableCell>
                      <TableCell>{entry.resolutionDate}</TableCell>
                      <TableCell>
                        <Chip size="small" label={entry.responsibility} />
                      </TableCell>
                      <TableCell>{entry.others}</TableCell>

                      {/* ── ATTACHMENT CELL ── */}
                      <TableCell>
                       {entry.attachment ? (
<div
  className="attachment-pill"
  // onClick={async () => {
  //   try {
  //     const separatorIndex = entry.attachment.indexOf("_");

  //     const fileId = entry.attachment.substring(0, separatorIndex);
  //     const fileName = entry.attachment.substring(separatorIndex + 1);

  //     const response = await activityTrackerApi.getMinIoFile(fileId);
  //     console.log('Response : ',response)

  //     const blob = new Blob([response.data]);
  //     const url = window.URL.createObjectURL(blob);

  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = fileName;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);

  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Failed to download file", error);
  //   }
  // }}
>
    <InsertDriveFileOutlinedIcon fontSize="small" />
    <span onClick={async () => {
    try {
      const separatorIndex = entry.attachment.indexOf("_");

      const fileId = entry.attachment.substring(0, separatorIndex);
      const fileName = entry.attachment.substring(separatorIndex + 1);
      const minioBucket='comments'
      const response = await activityTrackerApi.getMinIoFile( entry.attachment,minioBucket);
      console.log('Response : ',response)

      // const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(response);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file", error);
    }
  }}
  className="attachment-name"
  title={entry.attachment.substring(entry.attachment.indexOf("_") + 1)}
>
  {entry.attachment.substring(entry.attachment.indexOf("_") + 1)}
</span>
  </div>
) : (
  "-"
)}
                      </TableCell>

                      <TableCell>
                        <div className="added-cell">
                          <strong>{entry.createdBy}</strong>
                          <span>
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReplyOutlinedIcon />}
                            onClick={() =>
                              setActiveReply(
                                activeReply === index ? null : index
                              )
                            }
                          >
                            Reply
                            {!!entry.replies?.length && (
                              <span className="reply-count">
                                {entry.replies.length}
                              </span>
                            )}
                          </Button>
                          <IconButton
                            size="small"
                            disabled={entry.createdBy !== getUserData()?.userDetails?.userId}
                            onClick={() => deleteComment(index)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* REPLIES LIST */}
                    {entry.replies?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="reply-history-cell">
                          {entry.replies.map((reply) => (
                            <div key={reply.replyId} className="reply-item">
                              <div className="reply-header">
                                <strong>{reply.createdBy}</strong>
                                <span>
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                                <IconButton
                                  size="small"
                                  disabled={reply.createdBy !== getUserData()?.userDetails?.userId}
                                  onClick={() =>
                                    deleteReply(index, reply.replyId)
                                  }
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </div>
                              <div className="reply-text">
                                {reply.replyText}
                              </div>
                             {reply.attachment && (
  <div className="attachment-pill">
    <InsertDriveFileOutlinedIcon fontSize="small" />

    <span
      className="attachment-name"
      title={reply.attachment.substring(reply.attachment.indexOf("_") + 1)}
      onClick={async () => {
        try {
          const separatorIndex = reply.attachment.indexOf("_");

          const minioKey = reply.attachment.substring(0, separatorIndex);
          const fileName = reply.attachment.substring(separatorIndex + 1);

          const response = await activityTrackerApi.getMinIoFile(
            minioKey,
            "replies"
          );

          // const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(response);

          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();

          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Failed to download attachment:", error);
        }
      }}
    >
      {reply.attachment.substring(reply.attachment.indexOf("_") + 1)}
    </span>
  </div>
)} 
                            </div>
                          ))}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* REPLY INPUT BOX */}
                    {activeReply === index && (
                      <TableRow>
                        <TableCell colSpan={9} className="reply-box-cell">
                          <div className="reply-box">
                            <div className="reply-avatar">
                              <PersonOutlineIcon />
                            </div>
                            <div className="reply-content">
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Write a reply..."
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
                                    onClick={() => setActiveReply(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<SendOutlinedIcon />}
                                    onClick={() => addReply(index)}
                                  >
                                    Reply
                                  </Button>
                                  <input
  id={`reply-file-${index}`}
  hidden
  type="file"
  onChange={(e) => handleReplyAttachment(index, e)}
/>

<label htmlFor={`reply-file-${index}`}>
  <Button
    component="span"
    size="small"
    startIcon={<AttachFileIcon />}
  >
    Attach File
  </Button>
</label>

{replyAttachment[index]?.attachmentName && (
  <div className="attachment-pill">
    <InsertDriveFileOutlinedIcon fontSize="small" />
    <span>{replyAttachment[index].attachmentName}</span>
    <IconButton
      size="small"
      onClick={() => removeReplyAttachment(index)}
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

        {/* ── ADD COMMENT ── */}
        <div className="entry-section">
          <div className="entry-title">
            <AddIcon fontSize="small" />
            Add new entry
          </div>

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
                placeholder="What happened / what was discussed..."
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
                onChange={(e) => handleChange("actionPoint", e.target.value)}
                placeholder="Next step / who does what..."
              />
            </div>

            <div>
              <label>Resolution Date</label>
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
              <label>Responsibility</label>
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
                (item) => item !== opt
              )
            : [...(newComment?.responsibility || []), opt]
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
                placeholder="Any other notes..."
              />
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="dialog-footer">

            {/* ── ATTACHMENT: show pill if file selected, button otherwise ── */}
           {newComment?.attachmentBase64 ? (
  <div className="attachment-staged">
    <InsertDriveFileOutlinedIcon fontSize="small" />

    <span
      className="attachment-name"
      title={newComment?.attachmentName}
    >
      {newComment?.attachmentName}
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
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addComments}
              >
                Add Entry
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
