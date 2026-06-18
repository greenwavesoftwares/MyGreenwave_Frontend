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
        attachmentMent: reader.result.split(",")[1],
        attachmentName: file.name, // ← store the name
      }));
    };
    reader.readAsDataURL(file);
    // reset input so the same file can be reselected after cancel
    event.target.value = "";
  };

  // ── NEW: remove the staged attachment ──────────────────────────────
  const removeCommentAttachment = () => {
    setNewComment((prev) => ({
      ...prev,
      attachmentMent: null,
      attachmentName: null,
    }));
  };

  const addComments = async() => {
    if (!newComment.commentDescription.trim()) return;
    const payload = {
      ...newComment,
      createdBy: getUserData()?.userDetails?.userId,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    console.log("new comment:",newComment)
    // const reponse=await activityTrackerApi.addComment(newComment.projectId,payload)
    setExistingComments((prev) => [...prev, payload]);
    const newCommentPayload=addComment(newComment.projectId,newComment.activityId,newComment.moduleID)
    console.log("New Comment:",newComment)
    setNewComment(newCommentPayload);
  };

  const addReply = (commentIndex) => {
    const text = replyText[commentIndex];
    if (!text?.trim()) return;
    setExistingComments((prev) =>
      prev.map((item, index) =>
        index === commentIndex
          ? {
              ...item,
              replies: [
                ...(item.replies || []),
                {
                  replyId: Date.now(),
                  replyDescription: text,
                  createdBy: "You",
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : item
      )
    );
    setReplyText((prev) => ({ ...prev, [commentIndex]: "" }));
    setActiveReply(null);
  };

  const deleteComment = (index) => {
    setExistingComments((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteReply = (commentIndex, replyId) => {
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
                        {entry.attachmentMent ? (
                          <div className="attachment-pill">
                            <InsertDriveFileOutlinedIcon fontSize="small" />
                            <span
                              className="attachment-name"
                              title={entry.attachmentName}
                            >
                              {entry.attachmentName}
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
                                  onClick={() =>
                                    deleteReply(index, reply.replyId)
                                  }
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </div>
                              <div className="reply-text">
                                {reply.replyDescription}
                              </div>
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
                      newComment?.responsibility === opt ? "primary" : "default"
                    }
                    onClick={() => handleChange("responsibility", opt)}
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
            {newComment?.attachmentMent ? (
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
                    Attach Files
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
