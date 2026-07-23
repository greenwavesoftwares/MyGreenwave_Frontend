import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import { PauseCircle, StopCircleIcon } from "lucide-react";
import "./PauseReasonDialog.css";

/* type → key used to build className suffixes ("Paused" -> "paused") */
const TYPE_KEY = {
  Paused: "paused",
  StartDelay: "startdelay",
  StopDelay: "stopdelay",
};

const PauseReasonDialog = ({
  open,
  activityName,
  onConfirm,
  onCancel,
  pauseDelayType,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  const key = TYPE_KEY[pauseDelayType]; // "paused" | "startdelay" | "stopdelay" | undefined

  const resetAndClose = () => {
    setReason("");
    setError(false);
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(reason.trim());
    resetAndClose();
  };

  const handleCancel = () => {
    resetAndClose();
    onCancel();
  };

  /* Color comes entirely from className (currentColor), so it works
     identically for MUI icons (fill: currentColor) and the lucide
     StartDelay icon (stroke: currentColor) without special-casing.

     `onColoredSurface` picks which class to use:
     - true  -> tint the icon to the status color (header chip, which
                sits on a neutral/light chip background)
     - false -> force white, since this icon sits ON TOP of a button
                whose background IS that same status color — tinting
                it the same color would make it invisible. */
  const pauseDelayIcon = (size = 24, onColoredSurface = true) => {
    if (!key) return null;
    const className = onColoredSurface
      ? `prd-icon prd-icon--${key}`
      : "prd-icon prd-icon--on-button";
    // Belt-and-suspenders: className + explicit inline color, so the
    // button icon is guaranteed white regardless of stylesheet order.
    const style = onColoredSurface
      ? undefined
      : { color: "var(--pj-on-color, #FFFFFF)" };

    if (pauseDelayType === "StartDelay") {
      return (
        <PauseCircle size={size} className={className} style={style} />
      );
    }
    if (pauseDelayType === "StopDelay") {
      // lucide icon — uses `size`/`style`, not MUI's `sx`.
      return (
        <StopCircleIcon
          size={size}
          className={`${className} prd-icon-stop`}
          style={style}
        />
      );
    }
    // Paused — the only genuinely MUI icon of the three.
    return (
      <PauseCircleRoundedIcon
        className={className}
        sx={{ fontSize: size, ...(style ? { color: style.color } : {}) }}
      />
    );
  };

  // The icon shown in the "NEW" status badge — matched to what that
  // badge's text actually says. StartDelay's badge reads "Running", so
  // it should get a running/play glyph, not the pause one used for the
  // other two.

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      // Mounts the portal inside .pai-page so the --pj-* CSS variables
      // (and dark-mode overrides) defined there are actually in scope.
      // Falls back to the default body portal if .pai-page isn't found.
      container={() =>
        document.querySelector(".pai-page") || document.body
      }
      PaperProps={{
        className: "prd-paper",
        sx: { width: 480, maxWidth: "94vw" },
      }}
    >
      {/* ── HEADER ── */}
      <Box className={`prd-header prd-header--${key}`}>
        <Box className={`prd-icon-chip prd-icon-chip--${key}`}>
          {pauseDelayIcon(24)}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            lineHeight={1.2}
            className="prd-title"
          >
            {pauseDelayType === "Paused" && <>Pause Activity</>}
            {pauseDelayType === "StartDelay" && <>Start Activity</>}
            {pauseDelayType === "StopDelay" && <>Stop Activity</>}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            className="prd-subtitle"
            sx={{ display: "block" }}
          >
            {activityName || "Untitled activity"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleCancel}
          className="prd-close-btn"
          sx={{ mt: -3 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent className="prd-content">
        {/* ── STATUS TRANSITION CARD ── */}
        <Box className="prd-status-card">
          <Typography
            variant="body2"
            fontWeight={700}
            className="prd-status-card-title"
          >
            Status Change
          </Typography>

          <Box className="prd-status-row">
            <Box className="prd-status-box prd-status-box--current">
              <Box className="prd-status-tag">
                
                <Typography
                  variant="caption"
                  fontWeight={700}
                  className="prd-status-tag-label--current"
                >
                  CURRENT
                </Typography>
              </Box>
              <Typography
                variant="body2"
                fontWeight={700}
                className="prd-status-value--current"
              >
                {pauseDelayType === "Paused" && <>Running</>}
                {pauseDelayType === "StartDelay" && <>Pending</>}
                {pauseDelayType === "StopDelay" && <>Running</>}
              </Typography>
            </Box>

            <Box className={`prd-status-box prd-status-box--new-${key}`}>
              <Box className="prd-status-tag">
                
                <Typography
                  variant="caption"
                  fontWeight={700}
                  className={`prd-status-tag-label--new-${key}`}
                >
                  NEW
                </Typography>
              </Box>
              <Typography
                variant="body2"
                fontWeight={700}
                className={`prd-status-value--new-${key}`}
              >
                {pauseDelayType === "Paused" && <>Paused</>}
                {pauseDelayType === "StartDelay" && <>Running</>}
                {pauseDelayType === "StopDelay" && <>Completed</>}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── REASON ── */}
        <Typography
          variant="body2"
          fontWeight={700}
          className="prd-reason-label"
          sx={{ mb: 0.25 }}
        >
          {pauseDelayType === "Paused" && <>Reason for pausing *</>}
          {pauseDelayType !== "Paused" && <>Reason of Delay *</>}
        </Typography>
        <Typography variant="caption" className="prd-reason-hint">
          Write the reason {pauseDelayType === "Paused" && <> for pausing *</>}
          {pauseDelayType !== "Paused" && <> of delay *</>}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          autoFocus
          className="prd-textfield"
          placeholder="Type the reason for pausing…"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(false);
          }}
        />

        {error && (
          <Typography
            variant="caption"
            className="prd-error-text"
            sx={{ mt: 1, display: "block" }}
          >
            Please enter a reason to continue.
          </Typography>
        )}
      </DialogContent>

      {/* ── FOOTER ── */}
      <Box className="prd-footer">
        <Button
          variant="outlined"
          onClick={handleCancel}
          className="prd-cancel-btn"
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={pauseDelayIcon(18, false)}
          onClick={handleConfirm}
          className={`prd-confirm-btn prd-confirm-btn--${key}`}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {pauseDelayType === "Paused" && <>Pause Activity</>}
          {pauseDelayType === "StartDelay" && <>Start Activity</>}
          {pauseDelayType === "StopDelay" && <>Stop Activity</>}
        </Button>
      </Box>
    </Dialog>
  );
};

export default PauseReasonDialog;
