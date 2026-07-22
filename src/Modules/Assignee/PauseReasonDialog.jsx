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

const PauseReasonDialog = ({ open, activityName, onConfirm, onCancel, pauseDelayType }) => {
  console.log("Type of pause delay::",pauseDelayType)
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

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

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      PaperProps={{
        sx: {
          borderRadius: 4,
          width: 480,
          maxWidth: "94vw",
          overflow: "hidden",
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 2.25,
          background: "linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)",
          borderBottom: "1px solid #F1E4D2",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            bgcolor: "#FFEAD1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PauseCircleRoundedIcon sx={{ color: "#EA8A00", fontSize: 24 }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {pauseDelayType==='Paused' && <>Pause Activity</>}{pauseDelayType==='StartDelay' && <>Start Activity</>}{pauseDelayType==='StopDelay' && <>Stop Activity</>}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block" }}
          >
            {activityName || "Untitled activity"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleCancel} sx={{ mt: -3 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {/* ── STATUS TRANSITION CARD ── */}
        <Box
          sx={{
            border: "1px solid #EEF0F3",
            borderRadius: 3,
            p: 2,
            mb: 2.5,
          }}
        >
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
            Status Change
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box
              sx={{
                flex: 1,
                bgcolor: "#EFF6FF",
                border: "1px solid #DBEAFE",
                borderRadius: 2,
                py: 1.25,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  mb: 0.25,
                }}
              >
                <PlayCircleOutlineRoundedIcon sx={{ fontSize: 14, color: "#2563EB" }} />
                <Typography variant="caption" fontWeight={700} color="#2563EB">
                  CURRENT
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} color="#1E3A8A">
                {pauseDelayType==='Paused' && <>Running</>}{pauseDelayType==='StartDelay' && <>Pending</>}{pauseDelayType==='StopDelay' && <>Running</>}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                bgcolor: "#FFF7ED",
                border: "1px solid #FDE7C7",
                borderRadius: 2,
                py: 1.25,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  mb: 0.25,
                }}
              >
                <PauseCircleOutlineRoundedIcon sx={{ fontSize: 14, color: "#EA8A00" }} />
                <Typography variant="caption" fontWeight={700} color="#EA8A00">
                  NEW
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} color="#7C4700">
                {pauseDelayType==='Paused' && <>Paused</>}{pauseDelayType==='StartDelay' && <>Running</>}{pauseDelayType==='StopDelay' && <>Completed</>}
              
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── REASON ── */}
        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>
          {pauseDelayType==='Paused' && <>Reason for pausing *</>}{pauseDelayType!=='Paused' && <>Reason of Delay *</>}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
          Write the reason {pauseDelayType==='Paused' && <> for pausing *</>}{pauseDelayType!=='Paused' && <> of delay *</>}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          autoFocus
          placeholder="Type the reason for pausing…"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(false);
          }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            Please enter a reason to continue.
          </Typography>
        )}
      </DialogContent>

      {/* ── FOOTER ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.25,
          px: 3,
          py: 2,
          borderTop: "1px solid #F1F1F1",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#E2E2E2",
            color: "text.primary",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<PauseCircleRoundedIcon />}
          onClick={handleConfirm}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "#EA8A00",
            boxShadow: "none",
            "&:hover": { bgcolor: "#C97600", boxShadow: "none" },
          }}
        >
          Pause Activity
        </Button>
      </Box>
    </Dialog>
  );
};

export default PauseReasonDialog;
