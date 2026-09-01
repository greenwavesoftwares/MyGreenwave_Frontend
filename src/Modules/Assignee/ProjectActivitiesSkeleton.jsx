import React from "react";
import "./ProjectActivityInfo.css";
import "./ProjectActivitiesSkeleton.css";
import { Table, TableBody, TableHead, TableRow, TableCell } from "@mui/material";

/* ==========================================================
   Mirrors the real <ProjectActivityInfo /> layout exactly
   (.pai-page > .pai-info-card + .pai-activity-card > .pai-table)
   so the skeleton lines up with the content that replaces it,
   and inherits the same --pj-* light/dark theme tokens instead
   of Tailwind's dark: variant (which this project doesn't build).
   ========================================================== */

function Bar({ w = "6rem", h = "0.875rem", soft = false, className = "" }) {
  return (
    <div
      className={`pai-skel ${soft ? "pai-skel-soft" : ""} ${className}`}
      style={{ width: w, height: h }}
    />
  );
}

function Pill({ w = "5rem", h = "1.5rem" }) {
  return <div className="pai-skel pai-skel-pill" style={{ width: w, height: h }} />;
}

function Circle({ size = "1.75rem" }) {
  return <div className="pai-skel pai-skel-circle" style={{ width: size, height: size }} />;
}

function HeaderCell({ w, toggle = false }) {
  return (
    <TableCell className={`pai-th ${toggle ? "pai-th-toggle" : ""}`}>
      {!toggle && <Bar w={w} h="0.7rem" soft />}
    </TableCell>
  );
}

function ModuleHeaderRow() {
  return (
    <div className="pai-skel-module-row">
      <Circle size="1.25rem" />
      <Pill w="9rem" h="1.1rem" />
    </div>
  );
}

function ActivityRow({ highlight = false }) {
  return (
    <TableRow className={highlight ? "pai-skel-row-highlight" : ""}>
      <TableCell className="pai-th-toggle">
        <Circle size="1.25rem" />
      </TableCell>
      <TableCell>
        <Pill w="5rem" />
      </TableCell>
      <TableCell>
        <div className="pai-skel-cell-stack">
          <Bar w="7rem" />
          <Bar w="4rem" h="0.7rem" />
        </div>
      </TableCell>
      <TableCell>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Circle size="1.75rem" />
          <Bar w="4.5rem" />
        </div>
      </TableCell>
      <TableCell>
        <div className="pai-skel-cell-stack">
          <Bar w="5rem" />
          <Bar w="3rem" h="0.7rem" />
        </div>
      </TableCell>
      <TableCell>
        <Bar w="2.5rem" />
      </TableCell>
      <TableCell>
        <div className="pai-skel-cell-stack">
          <Bar w="5rem" />
          <Bar w="3rem" h="0.7rem" />
        </div>
      </TableCell>
      <TableCell>
        <Pill w="6rem" />
      </TableCell>
      <TableCell>
        <div className="pai-skel-cell-stack">
          <Bar w="5rem" />
          <Bar w="3rem" h="0.7rem" />
        </div>
      </TableCell>
      <TableCell>
        <div className="pai-skel-cell-stack">
          <Bar w="5rem" />
          <Bar w="3rem" h="0.7rem" />
        </div>
      </TableCell>
      <TableCell>
        <Circle size="1.75rem" />
      </TableCell>
    </TableRow>
  );
}

export default function ProjectActivitiesSkeleton() {
  return (
    <div className="pai-page">
      {/* Topbar placeholder */}
      <div className="pai-topbar">
        <Bar w="8rem" h="1.75rem" />
      </div>

      {/* Project info card */}
      <div className="pai-skel-info-card">
        <div className="pai-skel pai-skel-circle" style={{ width: "48px", height: "48px", flexShrink: 0 }} />
        {[
          { label: "3.5rem", value: "6rem" },
          { label: "3rem", value: "5rem" },
          { label: "6rem", value: "9rem" },
          { label: "3.5rem", value: "4rem" },
          { label: "5rem", value: "6rem" },
        ].map((col, i) => (
          <div key={i} className="pai-skel-info-field">
            <Bar w={col.label} h="0.65rem" soft />
            <Bar w={col.value} h="1rem" />
          </div>
        ))}
      </div>

      {/* Activities panel */}
      <div className="pai-skel-card">
        {/* Panel header */}
        <div className="pai-skel-header">
          <div className="pai-skel-header-left">
            <div className="pai-skel pai-skel-soft" style={{ width: "28px", height: "28px", borderRadius: "8px" }} />
            <Bar w="6rem" h="1.1rem" />
            <Pill w="2rem" h="1.2rem" />
          </div>
          <div className="pai-skel-header-right">
            <Bar w="14rem" h="2.25rem" className="pai-skel-pill" />
            <div className="pai-skel pai-skel-soft" style={{ width: "34px", height: "34px", borderRadius: "8px" }} />
          </div>
        </div>

        {/* Table */}
        <div className="pai-table-wrapper">
          <Table className="pai-table">
            <TableHead>
              <TableRow className="pai-thead-row">
                <HeaderCell toggle />
                <HeaderCell w="4rem" />
                <HeaderCell w="3rem" />
                <HeaderCell w="4.5rem" />
                <HeaderCell w="5rem" />
                <HeaderCell w="4rem" />
                <HeaderCell w="5rem" />
                <HeaderCell w="3.5rem" />
                <HeaderCell w="4.5rem" />
                <HeaderCell w="4.5rem" />
                <HeaderCell w="3rem" />
              </TableRow>
            </TableHead>
            <TableBody>
              <tr>
                <td colSpan={11} style={{ padding: 0 }}>
                  <ModuleHeaderRow />
                </td>
              </tr>
              <ActivityRow highlight />
              <ActivityRow />
              <ActivityRow />
              <ActivityRow />
              <ActivityRow />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
