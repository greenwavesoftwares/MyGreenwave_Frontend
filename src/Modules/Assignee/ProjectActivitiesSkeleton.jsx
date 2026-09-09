import React, { useEffect, useState } from "react";
import "./ProjectActivityInfo.css";
import "./ProjectActivitiesSkeleton.css";
import { Table, TableBody, TableHead, TableRow, TableCell } from "@mui/material";

/* ==========================================================
   Mirrors the real <ProjectActivityInfo /> layout exactly
   (.pai-page > .pai-info-card + .pai-activity-card > .pai-table)
   so the skeleton lines up with the content that replaces it,
   and inherits the same --pj-* light/dark theme tokens instead
   of Tailwind's dark: variant (which this project doesn't build).

   Below MOBILE_BREAKPOINT the real page swaps the table for a
   stacked card list (see useIsMobileLayout in ProjectActivityInfo.jsx)
   — this must stay in sync with that same constant so the skeleton
   never shows the desktop table shape on a screen that's about to
   render mobile cards, or vice versa.
   ========================================================== */
const MOBILE_BREAKPOINT = "(max-width: 860px)";

function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia(MOBILE_BREAKPOINT).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return isMobile;
}

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

/* ── mobile-only pieces ──
   Reuse the real .pai-mobile-* classes (imported above via
   ProjectActivityInfo.css) so the skeleton's spacing, chip shape,
   card shape, and field grid line up with the content that replaces
   it — only the fields are swapped for pulse blocks. */

function MobileFilterChipSkeleton({ w = "4.5rem" }) {
  return (
    <div className="pai-mobile-filter-chip">
      <Bar w={w} h="0.7rem" soft />
    </div>
  );
}

function MobileModuleSkeleton() {
  return (
    <div className="pai-mobile-module">
      <ModuleHeaderRow />
    </div>
  );
}

const MOBILE_FIELD_LABELS = [
  "Duration",
  "Planned Start",
  "Planned Stop",
  "Actual Start",
  "Actual Stop",
];

function MobileCardSkeleton({ highlight = false }) {
  return (
    <div
      className={
        "pai-mobile-card" + (highlight ? " pai-mobile-card--mine" : " pai-mobile-card--other")
      }
    >
      <div className="pai-mobile-card__top">
        <div className="pai-mobile-card__type">
          <Pill w="3.5rem" h="1.1rem" />
        </div>
        <Pill w="4.5rem" h="1.2rem" />
      </div>

      <Bar w="9rem" h="0.9rem" />

      <div className="pai-mobile-card__fields">
        <div className="pai-mobile-field pai-mobile-field--resource">
          <Bar w="4rem" h="0.6rem" soft />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Circle size="1.5rem" />
            <Bar w="6rem" />
          </div>
        </div>
        {MOBILE_FIELD_LABELS.map((label) => (
          <div className="pai-mobile-field" key={label}>
            <Bar w="3.5rem" h="0.6rem" soft />
            <Bar w="4.5rem" h="0.8rem" />
          </div>
        ))}
      </div>

      <div className="pai-mobile-card__actions">
        <Pill w="5rem" h="1.75rem" />
      </div>
    </div>
  );
}

export default function ProjectActivitiesSkeleton() {
  const isMobile = useIsMobileLayout();

  return (
    <div className="pai-page">
      {/* Topbar — reuses the real "Back to Projects" button shape/size
          (.back-to-draft) so it never has to be measured separately. */}
      <div className="pai-topbar">
        <div className="back-to-draft">
          <div
            className="pai-skel pai-skel-soft"
            style={{ width: "12px", height: "12px", borderRadius: "3px" }}
          />
          <Bar w="6.5rem" h="0.7rem" />
        </div>
      </div>

      {/* Project info card — real .pai-info-card/.pai-info-field markup,
          so the field list stacks vertically with divider lines below
          the MOBILE_BREAKPOINT exactly like the loaded page does,
          instead of the skeleton staying in its own separate desktop-
          only shape. .pai-skel-info-card is kept alongside it purely to
          force width:100% (see ProjectActivitiesSkeleton.css) since
          there's no real content here to size the card against. */}
      <div className="pai-info-card pai-skel-info-card">
        <div
          className="pai-project-avatar pai-skel pai-skel-soft"
          style={{ color: "transparent" }}
        />
        <div className="pai-info-fields">
          {[
            { label: "3.5rem", value: "7rem" },
            { label: "3rem", value: "5.5rem" },
            { label: "6rem", value: "4rem" },
            { label: "3.5rem", value: "pill" },
            { label: "5rem", value: "8rem" },
          ].map((col, i) => (
            <div key={i} className="pai-info-field">
              <Bar w={col.label} h="0.6rem" soft />
              {col.value === "pill" ? (
                <Pill w="6rem" h="1.4rem" />
              ) : (
                <Bar w={col.value} h="0.85rem" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activities panel — real .pai-activity-card/.pai-activity-header
          markup, so the search bar drops below the title row on mobile
          (same media query as the live header) instead of the skeleton
          staying in a fixed side-by-side row at every width.
          .pai-skel-card stays alongside it to force width:100% and to
          keep the desktop table's own width:auto from leaving a blank
          strip (see ProjectActivitiesSkeleton.css). */}
      <div className="pai-activity-card pai-skel-card">
        <div className="pai-activity-header">
          <div className="pai-header-left">
            <div className="pai-section-icon">
              <div
                className="pai-skel pai-skel-soft"
                style={{ width: "13px", height: "13px", borderRadius: "3px" }}
              />
            </div>
            <Bar w="6rem" h="1.1rem" />
            <div className="pai-counter">
              <Bar w="0.8rem" h="0.7rem" soft />
            </div>
          </div>
          <div className="pai-header-right">
            <div className="pai-search-wrap">
              <div
                className="pai-search pai-skel pai-skel-soft"
                style={{ height: "34px", borderRadius: "8px" }}
              />
            </div>
            <div
              className="pai-refresh-btn pai-skel pai-skel-soft"
              style={{ borderRadius: "8px" }}
            />
          </div>
        </div>

        {isMobile ? (
          <>
            {/* Mobile filter bar placeholder */}
            <div className="pai-mobile-filterbar">
              <MobileFilterChipSkeleton w="4rem" />
              <MobileFilterChipSkeleton w="3rem" />
              <MobileFilterChipSkeleton w="4.5rem" />
              <MobileFilterChipSkeleton w="3.5rem" />
              <MobileFilterChipSkeleton w="6rem" />
              <MobileFilterChipSkeleton w="6rem" />
            </div>

            {/* Card list placeholder */}
            <div className="pai-mobile-list">
              <MobileModuleSkeleton />
              <MobileCardSkeleton highlight />
              <MobileCardSkeleton />
              <MobileCardSkeleton />
              <MobileCardSkeleton />
              <MobileCardSkeleton />
            </div>
          </>
        ) : (
          /* Table (desktop) */
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
        )}
      </div>
    </div>
  );
}
