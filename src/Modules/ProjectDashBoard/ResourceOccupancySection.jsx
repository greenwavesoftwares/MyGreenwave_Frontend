import React from "react";
import AccordionSection from "./AccordionSection";
import ResourceOccupancyTimeline from "./ResourceOccupancyTimeline";

/**
 * Resource Occupancy Section with timeline view
 */
function ResourceOccupancySection({
  t,
  monthBlocks,
  safeOccMonthBlockIndex,
  occMonthSlideDir,
  currentOccMonthBlock,
  goToOccMonthBlock,
  timelineResources,
  occupancyByResourceDate,
  taskOccupancyByResourceDate,
  resourceColorMap,
  RESOURCE_DAILY_CAPACITY_HRS,
  expandedResources,
  toggleExpandedResource,
  showHover,
  hideHover,
  filteredRows,
  isDark,
  selectedYear,
  filteredUnallocatedResources,
 currentMonthResourceMetrics

}) {

  console.log('Unallocated Users: ',filteredUnallocatedResources,'currentMonthResourceMetrics ',currentMonthResourceMetrics)
  // Hardcoded month names - always available
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  
  return (
    <AccordionSection
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>Resource Occupancy &mdash; Free vs Occupied</span>
          {monthBlocks.length > 1 && currentOccMonthBlock && (
            <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button 
                type="button" 
                onClick={() => goToOccMonthBlock(safeOccMonthBlockIndex - 1)} 
                disabled={safeOccMonthBlockIndex === 0}
                style={{
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${t.navBorder}`,
                  borderRadius: 6,
                  background: t.navBg,
                  color: t.navText,
                  fontSize: 13,
                  lineHeight: 1,
                  padding: 0,
                  opacity: safeOccMonthBlockIndex === 0 ? 0.4 : 1,
                  cursor: safeOccMonthBlockIndex === 0 ? "default" : "pointer"
                }}
              >
                &laquo;
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.navLabel, minWidth: 110, textAlign: "center" }}>
                {`${MONTH_NAMES[currentOccMonthBlock.monthIdx]} ${selectedYear}`}
              </span>
              <button 
                type="button" 
                onClick={() => goToOccMonthBlock(safeOccMonthBlockIndex + 1)} 
                disabled={safeOccMonthBlockIndex >= monthBlocks.length - 1}
                style={{
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${t.navBorder}`,
                  borderRadius: 6,
                  background: t.navBg,
                  color: t.navText,
                  fontSize: 13,
                  lineHeight: 1,
                  padding: 0,
                  opacity: safeOccMonthBlockIndex >= monthBlocks.length - 1 ? 0.4 : 1,
                  cursor: safeOccMonthBlockIndex >= monthBlocks.length - 1 ? "default" : "pointer"
                }}
              >
                &raquo;
              </button>
            </span>
          )}
        </span>
      }
      t={t}
      defaultOpen
    >
      <div style={{ overflow: "hidden" }}>
        <div
          key={currentOccMonthBlock ? currentOccMonthBlock.key : "occ-empty"}
          style={{ animation: `${occMonthSlideDir === 1 ? "wtSlideInRight" : "wtSlideInLeft"} 0.28s ease` }}
        >
         <ResourceOccupancyTimeline
  weeks={currentOccMonthBlock?.weeks || []}
  resources={timelineResources}
  unallocatedUsers={filteredUnallocatedResources}
  occupancyByResourceDate={occupancyByResourceDate}
  taskOccupancyByResourceDate={taskOccupancyByResourceDate}
  resourceColorMap={resourceColorMap}
  capacityHrs={RESOURCE_DAILY_CAPACITY_HRS}
  expandedResources={expandedResources}
  onToggleExpand={toggleExpandedResource}
  showHover={showHover}
  hideHover={hideHover}
  filteredRows={filteredRows}
  currentMonthResourceMetrics={currentMonthResourceMetrics}
  t={t}
  isDark={isDark}
  resourceMetrics={currentMonthResourceMetrics}
/>
        </div>
      </div>
    </AccordionSection>
  );
}

export default ResourceOccupancySection;
