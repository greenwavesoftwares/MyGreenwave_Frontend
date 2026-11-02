import React from "react";
import { Dialog } from "primereact/dialog";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import StatusChip from "./StatusChip";
import { getPortalContainer } from "./portalContainer";
import "./assignee-theme.css";
import "./DependenciesDialog.css";

const formatDateTime = (value) =>
  value && dayjs(value).isValid() ? dayjs(value).format("DD-MM-YYYY HH:mm") : "—";

/** Labeled, bordered date/time field. `variant`: scheduled | actual | pending. */
const TimeBox = ({ icon: Icon, label, value, variant }) => (
  <Box className={`dependency-time-box dependency-time-box--${variant}`}>
    <Box className="dependency-time-box-label">
      <Icon sx={{ fontSize: 12 }} />
      {label}
    </Box>
    <Typography className="dependency-time-box-value">
      {formatDateTime(value)}
    </Typography>
  </Box>
);

const DependencyItem = ({ depId, dep }) => {
  const actualVariant =
    dep?.actualStart || dep?.actualStop ? "actual" : "pending";

  return (
    <Box className="dependency-item">
      <Box className="dependency-item-head">
        <Typography className="dependency-item-name">
          {dep?.name ?? "Unknown activity"}
        </Typography>
        {dep?.activityStatus && (
          <StatusChip status={dep.activityStatus.toLowerCase()} />
        )}
      </Box>

      {dep?.resource && (
        <Box className="dependency-item-resource">
          <PersonOutlineOutlinedIcon sx={{ fontSize: 13 }} />
          <Typography component="span">{dep.resource}</Typography>
        </Box>
      )}

      <Box className="dependency-time-grid">
        <TimeBox icon={CalendarMonthOutlinedIcon} label="SCHEDULED START" value={dep?.plannedStart} variant="scheduled" />
        <TimeBox icon={CalendarMonthOutlinedIcon} label="SCHEDULED STOP" value={dep?.plannedStop} variant="scheduled" />
      </Box>

      <Box className="dependency-time-grid">
        <TimeBox icon={AccessTimeOutlinedIcon} label="ACTUAL START" value={dep?.actualStart} variant={actualVariant} />
        <TimeBox icon={AccessTimeOutlinedIcon} label="ACTUAL STOP" value={dep?.actualStop} variant={actualVariant} />
      </Box>

      {/* Only shown when the id couldn't be resolved to an activity */}
      {!dep && <Typography className="dependency-item-id">{depId}</Typography>}
    </Box>
  );
};

/**
 * DependenciesDialog — lists the activities another activity depends on.
 * Self-contained: owns its markup, styles (DependenciesDialog.css) and
 * tokens. Rendered centered (no anchor) via PrimeReact's default overlay.
 */
const DependenciesDialog = ({
  visible,
  onHide,
  activityName,
  dependsOn = [],
  activityLookupMap,
}) => (
  <Dialog
    className="pj-scope dependency-dialog"
    visible={visible}
    onHide={onHide}
    header={
      <Box className="dependency-dialog-header">
        <Box className="dependency-dialog-icon">
          <AccountTreeOutlinedIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box>
          <Typography className="dependency-dialog-title">
            {activityName || "Activity"}
          </Typography>
          <Typography className="dependency-dialog-subtitle">
            Dependencies · {dependsOn.length}{" "}
            {dependsOn.length === 1 ? "linked task" : "linked tasks"}
          </Typography>
        </Box>
      </Box>
    }
    appendTo={getPortalContainer}
    baseZIndex={1400}
    modal
    dismissableMask
    draggable={false}
    style={{ width: "420px" }}
    breakpoints={{ "640px": "94vw" }}
  >
    {dependsOn.length > 0 ? (
      <Box className="dependency-list">
        {dependsOn.map((depId) => (
          <DependencyItem key={depId} depId={depId} dep={activityLookupMap?.[depId]} />
        ))}
      </Box>
    ) : (
      <Typography className="dependency-empty">No dependencies</Typography>
    )}
  </Dialog>
);

export default DependenciesDialog;
