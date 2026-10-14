import React from "react";
import MultiSelectPicker from "./MultiSelectPicker";
import FilterField from "./FilterField";

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

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
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={track}
        strokeWidth={strokeWidth}
      />
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
 * Single-month previous/next navigator.
 * selectedMonths remains an array for backward compatibility:
 * - []              = all months
 * - ["January"]     = one selected month
 */
function MonthNavigator({
  t,
  selectedMonths,
  setSelectedMonths,
  disabled,
  dropdownStyle,
}) {
  const selectedMonth =
    selectedMonths.length === 1 && MONTH_NAMES.includes(selectedMonths[0])
      ? selectedMonths[0]
      : null;

  const selectedIndex = selectedMonth
    ? MONTH_NAMES.indexOf(selectedMonth)
    : -1;

  const navigateMonth = (direction) => {
    // From "all months", go to January on Next and December on Previous.
    const nextIndex =
      selectedIndex === -1
        ? direction > 0
          ? 0
          : MONTH_NAMES.length - 1
        : (selectedIndex + direction + MONTH_NAMES.length) %
          MONTH_NAMES.length;

    setSelectedMonths([MONTH_NAMES[nextIndex]]);
  };

  const iconButtonStyle = {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${t.filterBarBorder}`,
    borderRadius: 6,
    background: t.filterBarBg,
    color: t.textPrimary,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    fontSize: 18,
    lineHeight: 1,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <button
        type="button"
        onClick={() => navigateMonth(-1)}
        disabled={disabled}
        aria-label="Previous month"
        title="Previous month"
        style={iconButtonStyle}
      >
        ‹
      </button>

      <div
        aria-live="polite"
        style={{
          ...dropdownStyle,
          minWidth: 110,
          textAlign: "center",
          cursor: "default",
          userSelect: "none",
        }}
      >
        {selectedMonth || "All months"}
      </div>

      <button
        type="button"
        onClick={() => navigateMonth(1)}
        disabled={disabled}
        aria-label="Next month"
        title="Next month"
        style={iconButtonStyle}
      >
        ›
      </button>

      {/* {selectedMonth && (
        <button
          type="button"
          onClick={() => setSelectedMonths([])}
          disabled={disabled}
          title="Show all months"
          style={{
            border: "none",
            background: "transparent",
            color: t.btnPrimary,
            cursor: disabled ? "default" : "pointer",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 2px",
            opacity: disabled ? 0.55 : 1,
          }}
        >
          Show all
        </button>
      )} */}
    </div>
  );
}

/**
 * Filter bar component with Year, Month navigation, Project,
 * and Resource filters.
 */
function FilterBar({
  t,
  apiLoading,
  selectedYear,
  setSelectedYear,
  currentYear,
  selectedMonths,
  setSelectedMonths,
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
  dropdownStyle,
}) {
  const toggleProject = (name) =>
    setSelectedProjects((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name]
    );

  const toggleResource = (name) =>
    setSelectedResources((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name]
    );

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
          {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(
            (year) => (
              <option key={year} value={year}>
                {year}
              </option>
            )
          )}
        </select>
      </FilterField>

      <FilterField label="Month" t={t}>
        <MonthNavigator
          t={t}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          disabled={apiLoading}
          dropdownStyle={dropdownStyle}
        />
      </FilterField>

      <FilterField label="Project" t={t}>
        <MultiSelectPicker
          t={t}
          pickerRef={projectPickerRef}
          open={projectPickerOpen}
          setOpen={setProjectPickerOpen}
          disabled={apiLoading || !projectPickerOptions?.length}
          summary={projectSummary}
          allLabel="All projects"
          allSelected={selectedProjects?.length === 0}
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
          disabled={apiLoading || !resourcePickerOptions?.length}
          summary={resourceSummary}
          allLabel="All resources"
          allSelected={selectedResources?.length === 0}
          onSelectAll={() => setSelectedResources([])}
          options={resourcePickerOptions}
          selected={selectedResources}
          onToggle={toggleResource}
          dropdownStyle={dropdownStyle}
        />
      </FilterField>

      <div style={{ flex: 1 }} />

      <button
        onClick={()=>{
          loadData(selectedYear,selectedMonths)}}
        disabled={apiLoading}
        aria-busy={apiLoading}
        className="wt-refresh-btn"
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