import React from "react";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";

//Icon Import
import DeleteIcon from "@mui/icons-material/Delete";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BackupIcon from "@mui/icons-material/Backup";
import AddIcon from "@mui/icons-material/Add";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import AssignerModule from "./AssignerModule";

const ActivityAssigner = () => {
  return (
    <>
      <div className="mx-auto px-4">
        {/* <div className="mx-auto px-4 max-w-[1270px]"> */}
        <AssignerModule />
      </div>
    </>
  );
};
export default ActivityAssigner;
