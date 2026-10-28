import React, { useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Switch,
  TextField,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";

import "./SendMailSection.css";
import { EMAIL_REGEX } from "./commentMailTemplate";

/* ------------------------------------------------------------------ */
/* Chip input: type an e-mail, press Enter / comma / space / Tab / blur */
/* ------------------------------------------------------------------ */
function EmailChipsInput({ id, label, values, onChange, placeholder, required }) {
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);

  const commit = (raw) => {
    const parts = raw
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!parts.length) return;

    const bad = parts.filter((x) => !EMAIL_REGEX.test(x));
    const merged = [...values];
    parts
      .filter((x) => EMAIL_REGEX.test(x))
      .forEach((g) => {
        if (!merged.some((m) => m.toLowerCase() === g.toLowerCase())) {
          merged.push(g);
        }
      });
    onChange(merged);
    setText(bad.join(" "));
    setInvalid(bad.length > 0);
  };

  return (
    <div className="send-mail__field">
      <label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <div
        className={`send-mail__chips${invalid ? " is-invalid" : ""}`}
        onClick={() => document.getElementById(id)?.focus()}
      >
        {values.map((v) => (
          <Chip
            key={v}
            size="small"
            label={v}
            onDelete={() => onChange(values.filter((x) => x !== v))}
          />
        ))}
        <input
          id={id}
          className="send-mail__chips-input"
          value={text}
          placeholder={values.length ? "" : placeholder}
          onChange={(e) => {
            setText(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (
              ["Enter", ",", " ", ";", "Tab"].includes(e.key) &&
              text.trim()
            ) {
              e.preventDefault();
              commit(text);
            } else if (e.key === "Backspace" && !text && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => text.trim() && commit(text)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (/[,;\s]/.test(pasted.trim())) {
              e.preventDefault();
              commit(pasted);
            }
          }}
        />
      </div>
      {invalid && (
        <span className="send-mail__error">Enter a valid e-mail address</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The section shown inside the "Add new entry" card                    */
/* ------------------------------------------------------------------ */
export default function SendMailSection({
  enabled,
  onToggle,
  to,
  onToChange,
  cc,
  onCcChange,
  note,
  onNoteChange,
  attachmentName,
  onPreview,
}) {
  return (
    <div className={`send-mail${enabled ? " is-on" : ""}`}>
      <div className="send-mail__head">
        <div className="send-mail__icon">
          <MailOutlineIcon fontSize="small" />
        </div>
        <div className="send-mail__titles">
          <div className="send-mail__title">Email this entry</div>
          <div className="send-mail__sub">
            Send a formatted notification when the entry is added
          </div>
        </div>
        <Switch
          size="small"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          inputProps={{ "aria-label": "Email this entry" }}
        />
      </div>

      {enabled && (
        <div className="send-mail__body">
          <div className="send-mail__grid">
            <EmailChipsInput
              id="send-mail-to"
              label="To"
              required
              values={to}
              onChange={onToChange}
              placeholder="name@company.com"
            />
            <EmailChipsInput
              id="send-mail-cc"
              label="Cc"
              values={cc}
              onChange={onCcChange}
              placeholder="Optional"
            />
            <div className="send-mail__field send-mail__field--full">
              <label htmlFor="send-mail-note">Message (optional)</label>
              <TextField
                id="send-mail-note"
                fullWidth
                multiline
                rows={2}
                size="small"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Short note shown above the details…"
              />
            </div>
          </div>

          <div className="send-mail__foot">
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityOutlinedIcon fontSize="small" />}
              onClick={onPreview}
            >
              Preview mail
            </Button>
            {attachmentName ? (
              <span className="send-mail__hint">
                <AttachFileIcon sx={{ fontSize: 14 }} />
                {attachmentName} will be attached
              </span>
            ) : (
              <span className="send-mail__hint">No attachment</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview: its own dialog so it is never clipped by the entry form     */
/* (rendered in a portal, so it carries its own styles/fallbacks).      */
/* ------------------------------------------------------------------ */
export function MailPreviewDialog({ open, onClose, mail, to = [], cc = [] }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ className: "mail-preview-paper" }}
    >
      <div className="mail-preview-head">
        <div className="mail-preview-head-title">
          <MailOutlineIcon fontSize="small" />
          Mail preview
        </div>
        <IconButton size="small" onClick={onClose} aria-label="Close preview">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="mail-preview-meta">
        <div>
          <span>To</span>
          {to.length ? to.join(", ") : "—"}
        </div>
        {cc.length > 0 && (
          <div>
            <span>Cc</span>
            {cc.join(", ")}
          </div>
        )}
        <div>
          <span>Subject</span>
          <strong>{mail?.subject}</strong>
        </div>
      </div>

      <DialogContent className="mail-preview-content">
        {/* The mail body is always light, like a real inbox. */}
        <iframe
          title="Mail preview"
          className="mail-preview-frame"
          sandbox=""
          srcDoc={mail?.html || ""}
        />
      </DialogContent>
    </Dialog>
  );
}
