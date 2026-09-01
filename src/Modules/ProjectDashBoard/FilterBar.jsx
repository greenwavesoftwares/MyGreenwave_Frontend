import React from "react";
import MultiSelectPicker from "./MultiSelectPicker";
import FilterField from "./FilterField";

// Hardcoded all 12 months
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/**
 * Circular loader shown while data is refreshing.
 * Pure SVG (SMIL animation) — no CSS keyframes or stylesheet required,
 * so it works anywhere the component renders.
 */
function CircularProgress({
  size = 14,
  color = "#ffffff",
  track = "rgba(255,255,255,0.35)",
  strokeWidth = 5,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-hidden="true"
      style={{ display: "block", flex: "0 0 auto" }}
    >
      {/* static track ring */}
      <circle cx="25" cy="25" r="20" fill="none" stroke={track} strokeWidth={strokeWidth} />
      {/* rotating arc */}
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="31.4 94.3"
      >
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

/**
 * Filter bar component with Year, Month, Project, and Resource filters
 */
function FilterBar({
  t,
  apiLoading,
  selectedYear,
  setSelectedYear,
  availableYears,
  currentYear,
  selectedMonths,
  setSelectedMonths,
  monthPickerOpen,
  setMonthPickerOpen,
  monthPickerRef,
  monthSummary,
  selectedProjects,
  setSelectedProjects,
  projectPickerOptions,
  projectPickerOpen,
  setProjectPickerOpen,
  projectPickerRef,
  projectSummary,
  selectedResources,
  setSelectedResources,
  resourcePickerOptions,
  resourcePickerOpen,
  setResourcePickerOpen,
  resourcePickerRef,
  resourceSummary,
  loadData,
  dropdownStyle
}) {
  
  // Always use all 12 months as options (hardcoded)
  const monthPickerOptions = MONTH_NAMES;
  
  const toggleMonth = (n) => setSelectedMonths((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);
  const toggleProject = (n) => setSelectedProjects((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);
  const toggleResource = (n) => setSelectedResources((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  return (
    <div
      className="wt-filter-bar"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        background: t.filterBarBg,
        border: `1px solid ${t.filterBarBorder}`,
        borderRadius: 12,
        padding: "10px 14px",
      }}
    >
      <FilterField label="Year" t={t}>
  <select 
    value={selectedYear} 
    onChange={(e) => setSelectedYear(Number(e.target.value))} 
    disabled={apiLoading} 
    style={dropdownStyle}
  >
    {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
      <option key={y} value={y}>{y}</option>
    ))}
  </select>
</FilterField>

      <FilterField label="Month" t={t}>
        <MultiSelectPicker
          t={t}
          pickerRef={monthPickerRef}
          open={monthPickerOpen}
          setOpen={setMonthPickerOpen}
          disabled={apiLoading}
          summary={monthSummary}
          allLabel="All months"
          allSelected={selectedMonths.length === 0}
          onSelectAll={() => setSelectedMonths([])}
          options={MONTH_NAMES}
          selected={selectedMonths}
          onToggle={toggleMonth}
          dropdownStyle={dropdownStyle}
        />
      </FilterField>

      <FilterField label="Project" t={t}>
        <MultiSelectPicker
          t={t}
          pickerRef={projectPickerRef}
          open={projectPickerOpen}
          setOpen={setProjectPickerOpen}
          disabled={apiLoading || !projectPickerOptions.length}
          summary={projectSummary}
          allLabel="All projects"
          allSelected={selectedProjects.length === 0}
          onSelectAll={() => setSelectedProjects([])}
          options={projectPickerOptions}
          selected={selectedProjects}
          onToggle={toggleProject}
          dropdownStyle={dropdownStyle}
        />
      </FilterField>

      <FilterField label="Resource" t={t}>
        <MultiSelectPicker
          t={t}
          pickerRef={resourcePickerRef}
          open={resourcePickerOpen}
          setOpen={setResourcePickerOpen}
          disabled={apiLoading || !resourcePickerOptions.length}
          summary={resourceSummary}
          allLabel="All resources"
          allSelected={selectedResources.length === 0}
          onSelectAll={() => setSelectedResources([])}
          options={resourcePickerOptions}
          selected={selectedResources}
          onToggle={toggleResource}
          dropdownStyle={dropdownStyle}
        />
      </FilterField>

      <div style={{ flex: 1 }} />
      
      <button
        onClick={() => loadData()}
        disabled={apiLoading}
        aria-busy={apiLoading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          minWidth: 128,
          boxSizing: "border-box",
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          background: t.btnPrimary,
          border: "none",
          borderRadius: 8,
          padding: "7px 14px",
          cursor: apiLoading ? "default" : "pointer",
          opacity: apiLoading ? 0.9 : 1,
        }}
        className="wt-refresh-btn"
      >
        {apiLoading ? (
          <>
            <CircularProgress />
            <span>Refreshing…</span>
          </>
        ) : (
          <span>Refresh data</span>
        )}
      </button>
    </div>
  );
}

export default FilterBar;
