import React, { useState, useMemo, useEffect, useRef } from "react";
import activityTrackerApi from "../../Services/activityTrackerApi";
import Tooltip from "@mui/material/Tooltip";
import GanttView from "../../Test Ground/GanttView";

const EARLY_LATE_THRESHOLD_HRS = 0.25; // 15 minutes, expressed in hours

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Each resource gets one hue, spaced with the golden angle so that colors
// stay well-separated no matter how many resources are in the dataset.
// Planned and Actual bars for the SAME resource share this hue — planned is
// rendered as a hatched/lighter version, actual as the solid, full-strength
// version — so a person can visually match a resource across both stacks.
const GOLDEN_ANGLE = 137.508;

function hueForIndex(i) {
  return Math.round((i * GOLDEN_ANGLE) % 360);
}

function resourceBaseColor(index) {
  const hue = hueForIndex(index);
  return { hue, actual: `hsl(${hue}, 62%, 48%)`, planned: `hsl(${hue}, 62%, 48%)` };
}

// Color for an activity slice within a single project's pie chart. Uses the
// same golden-angle spacing as resource colors so slices stay visually
// distinct no matter how many activities a project has.
function activityColor(i) {
  const hue = hueForIndex(i);
  return `hsl(${hue}, 60%, 52%)`;
}

// Muted/lightened version of the same hue, used for the PENDING portion of
// an activity's slice — same hue as its completed (activityColor) portion
// so the two read as "same task, different state" rather than unrelated
// colors, while still being clearly lighter/less saturated at a glance.
function activityColorPending(i) {
  const hue = hueForIndex(i);
  return `hsl(${hue}, 35%, 88%)`;
}

function parseDate(str) {
  if (!str) return null;
  return new Date(str);
}

function fmtTime(date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// human-friendly duration for tooltips — "1d 2h 15m" / "3h" / "45m" instead
// of a raw decimal like "4.1h"
function fmtDuration(h) {
  if (h == null) return "—";
  let totalMinutes = Math.round(h * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  totalMinutes -= days * 24 * 60;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hrs) parts.push(`${hrs}h`);
  if (mins || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(" ");
}

// Compact duration label used INSIDE bar segments, where space is tight.
// Prefers a short decimal-hour form ("1.5h") and only falls back to
// minutes for sub-hour durations ("45m"), since "1h 30m" doesn't fit in a
// narrow segment.
function fmtDurationCompact(h) {
  if (h == null) return "";
  if (h < 1) {
    const mins = Math.round(h * 60);
    return `${mins}m`;
  }
  const rounded = Math.round(h * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}h`;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// planned effort, in hours (falls back to computing it from the timestamps
// if durationHrs wasn't supplied)
function plannedDurationHrs(row) {
  if (typeof row.durationHrs === "number") return row.durationHrs;
  return (parseDate(row.plannedStop) - parseDate(row.plannedStart)) / 3600000;
}

// net hours actually consumed so far. For a finished task this is the real
// elapsed time; for a task still Running/Paused it's the elapsed time up to
// now (estimated) since there's no actualStop yet.
function actualDurationHrs(row) {
  if (!row.actualStart) return null;
  const start = parseDate(row.actualStart);
  const end = row.actualStop
    ? parseDate(row.actualStop)
    : row.status === "Running" || row.status === "Paused"
    ? new Date(start.getTime() + 60 * 60000) // no stop yet — estimate 1hr elapsed
    : null;
  if (!end) return null;
  return (end - start) / 3600000;
}

// compares net hours actually used against the hours that were planned
function finishedEarlyLateInfo(row) {
  if (!row.actualStop) return null;
  const planned = plannedDurationHrs(row);
  const actual = actualDurationHrs(row);
  if (actual == null) return null;
  const diffHrs = actual - planned;
  if (diffHrs < -EARLY_LATE_THRESHOLD_HRS) {
    return { type: "early", diff: Math.abs(diffHrs) };
  }
  if (diffHrs > EARLY_LATE_THRESHOLD_HRS) {
    return { type: "late", diff: diffHrs };
  }
  return { type: "ontime", diff: diffHrs };
}

// Builds the week grid (7-day-window chunking) for an arbitrary
// [year, monthIndex] pair. Shared across every selected month.
function weeksForMonth(year, monthIdx) {
  const monthStart = new Date(year, monthIdx, 1);
  const monthEnd = new Date(year, monthIdx + 1, 0); // last calendar day of the month
  monthStart.setHours(0, 0, 0, 0);
  monthEnd.setHours(0, 0, 0, 0);

  const weeksArr = [];
  let current = new Date(monthStart);

  while (current <= monthEnd) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      if (d <= monthEnd) {
        days.push(d);
      }
    }
    if (days.length) weeksArr.push(days);
    current.setDate(current.getDate() + 7);
  }

  return weeksArr;
}

// Groups a project's rows by task/activity name and sums planned/actual
// hours per activity. `finished` is true if ANY row for that activity has
// an actualStop; `started` is true if ANY row has an actualStart.
function aggregateActivities(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const key = r.task || "Untitled";
    if (!map.has(key)) {
      map.set(key, { activity: key, plannedHrs: 0, actualHrs: 0, finished: false, started: false });
    }
    const e = map.get(key);
    e.plannedHrs += plannedDurationHrs(r) || 0;
    const a = actualDurationHrs(r);
    if (a != null) e.actualHrs += a;
    if (r.actualStop) e.finished = true;
    if (r.actualStart) e.started = true;
  });
  return Array.from(map.values());
}

// Progress % for a single activity:
//  - 100% once it has finished (actualStop present on any of its rows)
//  - actual/planned hours (capped just under 100%) while it's in progress
//  - 0% if it hasn't started yet
function activityProgressPct(entry) {
  if (entry.finished) return 100;
  if (!entry.started || !entry.plannedHrs) return 0;
  return clamp(Math.round((entry.actualHrs / entry.plannedHrs) * 100), 0, 99);
}

export default function ActivityTrackerCharts() {
  const [hovered, setHovered] = useState(null);
  const hoverHideTimeout = useRef(null);
  // Ref to the tooltip DOM node itself. Used by the outside-click effect
  // below to tell "the user clicked the tooltip" apart from "the user
  // clicked anywhere else" — replaces the old full-screen transparent
  // overlay (see notes further down for why that overlay was the source
  // of the hover/click bugs).
  const tooltipRef = useRef(null);

  // Sticky hover: showHover cancels any pending hide and shows immediately.
  // hideHover doesn't clear right away — it waits a beat so the cursor has
  // time to travel from the bar segment onto the tooltip itself (or onto an
  // adjacent segment) without the tooltip flickering closed in between.
  function showHover(data) {
    if (hoverHideTimeout.current) {
      clearTimeout(hoverHideTimeout.current);
      hoverHideTimeout.current = null;
    }
    setHovered(data);
  }

  function hideHover() {
    if (hoverHideTimeout.current) clearTimeout(hoverHideTimeout.current);
    hoverHideTimeout.current = setTimeout(() => {
      setHovered(null);
      hoverHideTimeout.current = null;
    }, 200);
  }

  // Close the tooltip on outside click/tap.
  //
  // FIX: this used to be handled by a fixed, full-viewport transparent
  // <div> stacked at zIndex 49, rendered as a sibling of the tooltip
  // whenever `hovered` was set. That overlay sat ON TOP of the bar
  // segments themselves (they have no explicit z-index, so they lose to
  // anything with one), which caused two visible bugs:
  //   1. Hovering a segment showed the tooltip, but the very act of the
  //      overlay mounting on top of the cursor's position made the browser
  //      treat the segment as no longer being hovered, firing its
  //      onMouseLeave -> hideHover -> tooltip vanished ~200ms after
  //      appearing ("details getting away").
  //   2. After the first click opened a tooltip, the overlay covered every
  //      other segment too, so the NEXT click on a different segment hit
  //      the overlay (closing the tooltip) instead of reaching the segment
  //      underneath (which would have opened a new tooltip for it).
  //
  // Removing the overlay and instead listening on `document` for clicks
  // outside the tooltip's own bounds fixes both: it never sits on top of
  // anything, so hover/click on the chart itself always reaches the real
  // segment elements.
  useEffect(() => {
    if (!hovered) return;
    function handleDocClick(e) {
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) return;
      setHovered(null);
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [hovered]);

  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // multi-select months (by name, e.g. "January"): empty array === "all
  // months of the selected year"
  const [selectedMonths, setSelectedMonths] = useState([MONTH_NAMES[currentMonthIdx]]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef(null);

  // multi-select projects: empty array === "all projects"
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const projectPickerRef = useRef(null);

  // multi-select resources: empty array === "all resources"
  const [selectedResources, setSelectedResources] = useState([]);
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const resourcePickerRef = useRef(null);

  // Which of the selected months is currently showing in the Weekly
  // Schedule card, and which direction the last navigation went (used to
  // pick the slide-in animation). Navigating months swaps the week grid in
  // place instead of stacking every month underneath one another, so the
  // page height stays constant regardless of how many months are selected.
  const [monthBlockIndex, setMonthBlockIndex] = useState(0);
  const [monthSlideDir, setMonthSlideDir] = useState(1);

  // Tracks viewport width so the project-breakdown carousel can decide how
  // many pie-chart cards fit in a single row (mirrors the breakpoints used
  // by the CSS below: 480 / 900 / 1200).
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Which page of projects is currently showing in the "Breakdown — By
  // Project" card, and which direction the last navigation went (used to
  // pick the slide-in animation) — same paging mechanism as the Weekly
  // Schedule's month navigation, just for rows of pie charts instead of
  // rows of weeks. This keeps the card's height constant (one row tall)
  // instead of growing with the number of projects.
  const [projectPageIndex, setProjectPageIndex] = useState(0);
  const [projectSlideDir, setProjectSlideDir] = useState(1);

  // Fetches the activity tree for a given year + comma-separated month
  // selection. Defaults to whatever's currently selected so the "Refresh
  // data" button can keep calling loadData() with no arguments.
  function loadData(year = selectedYear, months = selectedMonths) {
    setApiLoading(true);
    setApiError(null);
    fetchProjects(year, months);
  }

  const fetchProjects = async (year, months) => {
    console.log('Year & Month ',year,months)
    try {
      const response = await activityTrackerApi.getActivityTreesByMonthAndDate(
       months.length === 0 ? MONTH_NAMES.join(','): months.join(","), // e.g. "January,March" — empty string means "all months"
        year,
      );
      setApiResponse(response ?? { data: [] });
    } catch (err) {
      setApiError(String(err?.message ?? err));
    } finally {
      setApiLoading(false);
    }
  };

  // Refetch from the API whenever the Year or Month filter changes. This
  // also covers the very first load, since selectedYear/selectedMonths
  // already hold their initial values on mount — no separate mount-only
  // effect is needed.
  //
  // selectedMonths.join(",") is used (rather than selectedMonths itself) as
  // the dependency so the effect only re-fires when the actual month
  // selection changes, not on every render where the array gets a new
  // reference.
  useEffect(() => {
    loadData(selectedYear, selectedMonths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonths.join(",")]);

  // close the month/project/resource pickers when clicking outside of them
  useEffect(() => {
    function handleClickOutside(e) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) {
        setMonthPickerOpen(false);
      }
      if (projectPickerRef.current && !projectPickerRef.current.contains(e.target)) {
        setProjectPickerOpen(false);
      }
      if (resourcePickerRef.current && !resourcePickerRef.current.contains(e.target)) {
        setResourcePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Be tolerant of the response envelope shape: prefer `.data`, but fall
  // back to a bare array in case the API ever returns one directly.
  const projectsData = useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    return [];
  }, [apiResponse]);

  const flatRows = useMemo(() => {
    const arr = [];
    projectsData.forEach((p) => {
      (p.rows || []).forEach((r) => {
        arr.push({ ...r, project: p.project, po: p.po, site: p.site });
      });
    });
    return arr;
  }, [projectsData]);

  // Year options are loaded straight from the payload — no synthetic
  // "current year + 5" range is injected, so the dropdown only ever offers
  // years that actually have scheduled activity.
  const availableYears = useMemo(() => {
    const set = new Set();
    flatRows.forEach((r) => {
      const d = parseDate(r.plannedStart);
      if (d) set.add(d.getFullYear());
    });
    const years = Array.from(set).sort((a, b) => a - b);
    return years.length ? years : [currentYear];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatRows]);

  // Full (unfiltered) project/resource name lists, straight from the
  // payload. These stay stable regardless of the active filters — used for
  // consistent color assignment, and to prune a selection that no longer
  // exists in the data AT ALL once fresh data arrives.
  const allProjectNames = useMemo(() => {
    const set = new Set(projectsData.map((p) => p.project));
    return Array.from(set).sort();
  }, [projectsData]);

  const allResourceNames = useMemo(() => {
    const set = new Set(flatRows.map((r) => r.resourceName));
    return Array.from(set).sort();
  }, [flatRows]);

  // Stable color per resource — index comes from the FULL sorted resource
  // list (not the filtered one) so a resource's color never shifts as
  // filters change.
  const resourceColorMap = useMemo(() => {
    const map = {};
    allResourceNames.forEach((name, i) => {
      map[name] = resourceBaseColor(i);
    });
    return map;
  }, [allResourceNames]);

  // --- Cascading dropdown options -------------------------------------
  // Month/Project/Resource are interdependent: each one's option list is
  // computed by filtering the payload against the YEAR plus the OTHER two
  // active filters (never against its own selection). So picking a
  // Project narrows which Months/Resources are offered, picking a Month
  // narrows Projects/Resources, and so on.
  function rowMatchesFilters(row, { months, projects, resources }, skip) {
    const d = parseDate(row.plannedStart);
    if (!d || d.getFullYear() !== selectedYear) return false;
    if (skip !== "month" && months.length && !months.includes(MONTH_NAMES[d.getMonth()])) {
      return false;
    }
    if (skip !== "project" && projects.length && !projects.includes(row.project)) {
      return false;
    }
    if (skip !== "resource" && resources.length && !resources.includes(row.resourceName)) {
      return false;
    }
    return true;
  }

  // Month options intentionally ignore the Project filter — they're only
  // narrowed by Year (and Resource), so picking a project never hides a
  // month that still has activity from other projects.
  const monthPickerOptions = useMemo(() => {
    const set = new Set();
    flatRows.forEach((r) => {
      if (rowMatchesFilters(r, { months: [], projects: [], resources: selectedResources }, "month")) {
        const d = parseDate(r.plannedStart);
        set.add(MONTH_NAMES[d.getMonth()]);
      }
    });
    return MONTH_NAMES.filter((m) => set.has(m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatRows, selectedYear, selectedResources]);

  const projectPickerOptions = useMemo(() => {
    const set = new Set();
    flatRows.forEach((r) => {
      if (rowMatchesFilters(r, { months: selectedMonths, projects: [], resources: selectedResources }, "project")) {
        set.add(r.project);
      }
    });
    return allProjectNames.filter((p) => set.has(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatRows, selectedYear, selectedMonths, selectedResources, allProjectNames]);

  const resourcePickerOptions = useMemo(() => {
    const set = new Set();
    flatRows.forEach((r) => {
      if (rowMatchesFilters(r, { months: selectedMonths, projects: selectedProjects, resources: [] }, "resource")) {
        set.add(r.resourceName);
      }
    });
    return allResourceNames.filter((r) => set.has(r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatRows, selectedYear, selectedMonths, selectedProjects, allResourceNames]);

  // NOTE: there used to be an "auto-default to whichever period the data
  // actually starts in" effect here. It worked by inspecting the payload
  // AFTER it came back and, if the current month had no data, jumping
  // Year/Month to wherever the data did exist — which caused a SECOND API
  // call (for the corrected period) right after the first one, since the
  // fetch effect is keyed on [selectedYear, selectedMonths]. That auto-jump
  // only made sense when the API always returned the full dataset and
  // filtering happened client-side. Now that the API is filtered
  // server-side per request, the payload for "July" will only ever contain
  // July's data (or be empty) — there's no other period visible in it to
  // "discover" and jump to. So this effect was removed: Year/Month now stay
  // exactly as the user (or the initial default) set them, and a genuinely
  // empty result just renders the "No scheduled activity" state instead of
  // silently re-fetching a different period.

  // Prune selections that fall outside the current cascading options — as
  // filters narrow each other down, a previously-picked value can become
  // unavailable and should drop out rather than silently filtering
  // everything down to nothing.
  //
  // GUARD: apiResponse is null until the very first fetch resolves. Before
  // that, flatRows is [] and every *PickerOptions list is also [] — not
  // because the selected month/project/resource is actually unavailable,
  // but because no data has loaded yet at all. Without this guard, that
  // transient empty-options state gets treated as "nothing the user picked
  // is valid," and the default month selection gets pruned down to []
  // (rendered as "All months") before the API call even returns. So these
  // effects are no-ops until apiResponse has arrived at least once.
  //
  // IMPORTANT: Array.prototype.filter() always returns a brand-new array,
  // even when nothing was actually removed. Since Month/Project/Resource
  // options cascade off of each other's *selections*, blindly calling
  // setState with that new-but-equivalent array on every run created a
  // feedback loop: selectedResources -> monthPickerOptions recomputes ->
  // this effect fires -> setSelectedMonths gets a new reference ->
  // projectPickerOptions recomputes -> its effect fires -> setSelectedProjects
  // gets a new reference -> resourcePickerOptions recomputes -> its effect
  // fires -> setSelectedResources gets a new reference -> back to the start,
  // forever ("Maximum update depth exceeded"). Returning the *same* `prev`
  // reference when nothing was actually pruned breaks that cycle.
  useEffect(() => {
    if (!apiResponse) return;
    setSelectedMonths((prev) => {
      const next = prev.filter((m) => monthPickerOptions.includes(m));
      return next.length === prev.length ? prev : next;
    });
  }, [apiResponse, monthPickerOptions]);

  useEffect(() => {
    if (!apiResponse) return;
    setSelectedProjects((prev) => {
      const next = prev.filter((p) => projectPickerOptions.includes(p));
      return next.length === prev.length ? prev : next;
    });
  }, [apiResponse, projectPickerOptions]);

  useEffect(() => {
    if (!apiResponse) return;
    setSelectedResources((prev) => {
      const next = prev.filter((r) => resourcePickerOptions.includes(r));
      return next.length === prev.length ? prev : next;
    });
  }, [apiResponse, resourcePickerOptions]);

  // Month indices (0-11) implied by the current selection.
  //
  // FIX: previously, when nothing was picked, this fell back to ALL 12
  // MONTH_NAMES — so monthBlocks (below) rendered a WeekCard for every
  // calendar month of the year, including ones with zero scheduled
  // activity, even though monthPickerOptions (the Month dropdown) already
  // correctly limited itself to months that actually have data. Now the
  // "nothing selected" fallback uses monthPickerOptions instead, so
  // monthBlocks and monthPickerOptions always agree: only months with
  // data ever get a week grid.
  //
  // monthPickerOptions doesn't depend on selectedMonthIndices (it's
  // filtered by Year + Resource only, computed straight from flatRows), so
  // this doesn't introduce a circular dependency.
  const selectedMonthIndices = useMemo(() => {
    if (selectedMonths.length === 0) {
      return monthPickerOptions
        .map((name) => MONTH_NAMES.indexOf(name))
        .sort((a, b) => a - b);
    }
    return selectedMonths.map((name) => MONTH_NAMES.indexOf(name)).sort((a, b) => a - b);
  }, [selectedMonths, monthPickerOptions]);

  const rangeLabel = useMemo(() => {
    if (selectedMonths.length === 0) return `All months, ${selectedYear}`;
    if (selectedMonths.length === 1) return `${selectedMonths[0]} ${selectedYear}`;
    return `${selectedMonths.length} months selected, ${selectedYear}`;
  }, [selectedMonths, selectedYear]);

  const filteredRows = useMemo(() => {
    const monthSet = new Set(selectedMonthIndices);
    return flatRows.filter((r) => {
      const d = parseDate(r.plannedStart);
      const monthMatch = d && d.getFullYear() === selectedYear && monthSet.has(d.getMonth());
      const projectMatch =
        selectedProjects.length === 0 || selectedProjects.includes(r.project);
      const resourceMatch =
        selectedResources.length === 0 || selectedResources.includes(r.resourceName);
      return monthMatch && projectMatch && resourceMatch;
    });
  }, [flatRows, selectedYear, selectedMonthIndices, selectedProjects, selectedResources]);

  // Same shape as the API's project list ({ project, po, site, rows }),
  // but rebuilt from filteredRows so the Gantt view (and the per-project
  // pie charts) reflect whatever Year/Month/Project/Resource filters are
  // currently active instead of always showing the full, unfiltered
  // dataset.
  const filteredProjectsData = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      if (!map.has(r.project)) {
        map.set(r.project, { project: r.project, po: r.po, site: r.site, rows: [] });
      }
      map.get(r.project).rows.push(r);
    });
    return Array.from(map.values());
  }, [filteredRows]);

  // One block per selected month (a header + its own week grid). A single
  // month renders without a header, matching the original look; picking
  // several months lets the Weekly Schedule card page through each month's
  // weeks via the arrows in its header, sliding between them in place
  // instead of growing the page.
  const monthBlocks = useMemo(() => {
    return selectedMonthIndices.map((m) => ({
      key: `${selectedYear}-${m}`,
      label: selectedMonthIndices.length > 1 ? `${MONTH_NAMES[m]} ${selectedYear}` : null,
      weeks: weeksForMonth(selectedYear, m),
    }));
  }, [selectedYear, selectedMonthIndices]);

  // Reset to the first month whenever the underlying selection changes
  // (new year, or months added/removed) so the arrows never point at a
  // stale slot.
  useEffect(() => {
    setMonthBlockIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonthIndices.join(",")]);

  const safeMonthBlockIndex = Math.min(monthBlockIndex, Math.max(monthBlocks.length - 1, 0));
  const currentMonthBlock = monthBlocks[safeMonthBlockIndex];

  function goToMonthBlock(newIndex) {
    if (newIndex < 0 || newIndex >= monthBlocks.length) return;
    setMonthSlideDir(newIndex > safeMonthBlockIndex ? 1 : -1);
    setMonthBlockIndex(newIndex);
  }

  // Group rows by calendar day, then by resource within that day. Each
  // day now produces two STACKS: a Planned stack and an Actual stack, each
  // made of one segment per resource (summed across that resource's tasks
  // for the day). Resources are kept in a stable alphabetical order so the
  // stacking order lines up between the Planned stack and the Actual stack.
  const aggByDate = useMemo(() => {
    const byDate = {};
    filteredRows.forEach((r) => {
      const key = parseDate(r.plannedStart).toDateString();
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(r);
    });

    const result = {};
    Object.entries(byDate).forEach(([dateKey, rows]) => {
      const byResource = {};
      rows.forEach((row) => {
        const name = row.resourceName;
        if (!byResource[name]) {
          byResource[name] = {
            resourceName: name,
            plannedHrs: 0,
            actualHrs: 0,
            tasks: [],
            hasRunning: false,
          };
        }
        const p = plannedDurationHrs(row) || 0;
        const a = actualDurationHrs(row);
        byResource[name].plannedHrs += p;
        byResource[name].actualHrs += a || 0;
        byResource[name].tasks.push({ row, plannedHrs: p, actualHrs: a });
        if (row.status === "Running") byResource[name].hasRunning = true;
      });

      const resources = Object.values(byResource).sort((x, y) =>
        x.resourceName.localeCompare(y.resourceName)
      );
      const plannedTotal = resources.reduce((s, r) => s + r.plannedHrs, 0);
      const actualTotal = resources.reduce((s, r) => s + r.actualHrs, 0);
      result[dateKey] = { resources, plannedTotal, actualTotal };
    });
    return result;
  }, [filteredRows]);

  // y axis is "net hours" — scaled to the tallest stacked total (planned or
  // actual) across the visible days, since stacking can now exceed any
  // single task's duration.
  const maxDurationHrs = useMemo(() => {
    let mx = 0;
    Object.values(aggByDate).forEach((day) => {
      if (day.plannedTotal > mx) mx = day.plannedTotal;
      if (day.actualTotal > mx) mx = day.actualTotal;
    });
    if (mx <= 0) mx = 8;
    return Math.ceil((mx + 1) / 2) * 2; // round up to a nice even number with a little headroom
  }, [aggByDate]);

  function pctFromHrs(hrs) {
    if (hrs == null) return null;
    const fraction = clamp(hrs / maxDurationHrs, 0, 1);
    return (1 - fraction) * 100; // 0h renders at the bottom, maxDurationHrs at the top
  }

  const durationLabels = useMemo(() => {
    const step = maxDurationHrs / 5;
    const labels = [];
    for (let h = 0; h <= maxDurationHrs + 0.001; h += step) {
      labels.push({ h, label: `${Math.round(h * 10) / 10}h` });
    }
    return labels;
  }, [maxDurationHrs]);

  function toggleMonth(name) {
    setSelectedMonths((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function toggleProject(name) {
    setSelectedProjects((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function toggleResource(name) {
    setSelectedResources((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  const monthSummary =
    selectedMonths.length === 0
      ? "All months"
      : selectedMonths.length === 1
      ? selectedMonths[0]
      : `${selectedMonths.length} months selected`;

  const projectSummary =
    selectedProjects.length === 0
      ? "All projects"
      : selectedProjects.length === 1
      ? selectedProjects[0]
      : `${selectedProjects.length} projects selected`;

  const resourceSummary =
    selectedResources.length === 0
      ? "All resources"
      : selectedResources.length === 1
      ? selectedResources[0]
      : `${selectedResources.length} resources selected`;

  const weeklyScheduleTitle = (
    <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span>Weekly Schedule — Planned vs Actual</span>
      {monthBlocks.length > 1 && (
        <span
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <button
            type="button"
            onClick={() => goToMonthBlock(safeMonthBlockIndex - 1)}
            disabled={safeMonthBlockIndex === 0}
            aria-label="Previous month"
            style={{
              ...navArrowStyle,
              opacity: safeMonthBlockIndex === 0 ? 0.4 : 1,
              cursor: safeMonthBlockIndex === 0 ? "default" : "pointer",
            }}
          >
            ‹
          </button>
          <span
            className="wt-month-nav-label"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              minWidth: 110,
              textAlign: "center",
            }}
          >
            {MONTH_NAMES[selectedMonthIndices[safeMonthBlockIndex]]} {selectedYear}
          </span>
          <button
            type="button"
            onClick={() => goToMonthBlock(safeMonthBlockIndex + 1)}
            disabled={safeMonthBlockIndex === monthBlocks.length - 1}
            aria-label="Next month"
            style={{
              ...navArrowStyle,
              opacity: safeMonthBlockIndex === monthBlocks.length - 1 ? 0.4 : 1,
              cursor: safeMonthBlockIndex === monthBlocks.length - 1 ? "default" : "pointer",
            }}
          >
            ›
          </button>
        </span>
      )}
    </span>
  );

  // Key used to re-trigger the slide-in animation on the project breakdown
  // card whenever the active filter combination changes — same mechanism
  // as the Weekly Schedule's per-month remount, just driven by the whole
  // filter set instead of a page index.
  const projectBreakdownKey = `${selectedYear}|${selectedMonths.join(",")}|${selectedProjects.join(",")}|${selectedResources.join(",")}`;

  // How many pie-chart cards fit in a single row at the current viewport
  // width. Mirrors the breakpoints used elsewhere in this component (900 /
  // 480) plus one extra step for very wide screens, so a "page" always
  // corresponds to exactly one visual row of cards — the card grows/shrinks
  // by count, never by wrapping into a second row.
  const projectsPerPage = useMemo(() => {
    if (viewportWidth <= 480) return 1;
    if (viewportWidth <= 900) return 2;
    if (viewportWidth <= 1300) return 3;
    return 4;
  }, [viewportWidth]);

  // Chunk the filtered project list into fixed-size pages, one page per
  // row. Paging through them (via the arrows in the card header) slides
  // the next row in from the side instead of appending more rows
  // underneath — so the card's height never grows with the project count.
  const projectPages = useMemo(() => {
    if (filteredProjectsData.length === 0) return [[]];
    const pages = [];
    for (let i = 0; i < filteredProjectsData.length; i += projectsPerPage) {
      pages.push(filteredProjectsData.slice(i, i + projectsPerPage));
    }
    return pages;
  }, [filteredProjectsData, projectsPerPage]);

  // Reset to the first page whenever the underlying selection (or the
  // number of cards that fit per row) changes, so the arrows never point
  // at a stale slot.
  useEffect(() => {
    setProjectPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectBreakdownKey, projectsPerPage]);

  const safeProjectPageIndex = Math.min(projectPageIndex, Math.max(projectPages.length - 1, 0));
  const currentProjectPage = projectPages[safeProjectPageIndex] || [];

  function goToProjectPage(newIndex) {
    if (newIndex < 0 || newIndex >= projectPages.length) return;
    setProjectSlideDir(newIndex > safeProjectPageIndex ? 1 : -1);
    setProjectPageIndex(newIndex);
  }

  const projectBreakdownTitle = (
    <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span>Breakdown — By Project</span>
      {projectPages.length > 1 && (
        <span
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <button
            type="button"
            onClick={() => goToProjectPage(safeProjectPageIndex - 1)}
            disabled={safeProjectPageIndex === 0}
            aria-label="Previous projects"
            style={{
              ...navArrowStyle,
              opacity: safeProjectPageIndex === 0 ? 0.4 : 1,
              cursor: safeProjectPageIndex === 0 ? "default" : "pointer",
            }}
          >
            ‹
          </button>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              minWidth: 50,
              textAlign: "center",
            }}
          >
            {safeProjectPageIndex + 1} / {projectPages.length}
          </span>
          <button
            type="button"
            onClick={() => goToProjectPage(safeProjectPageIndex + 1)}
            disabled={safeProjectPageIndex === projectPages.length - 1}
            aria-label="Next projects"
            style={{
              ...navArrowStyle,
              opacity: safeProjectPageIndex === projectPages.length - 1 ? 0.4 : 1,
              cursor: safeProjectPageIndex === projectPages.length - 1 ? "default" : "pointer",
            }}
          >
            ›
          </button>
        </span>
      )}
    </span>
  );

  return (
            <div className="container mx-auto px-4">
          {/* <div className="w-full md:w-10/12 lg:w-10/12 mx-auto"> */}
    <div
      className="wt-root"
      style={{ width: "100%", background: "#f8fafc", padding: 24, borderRadius: 16, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        /* Sizes that scale down on smaller screens are exposed as CSS
           custom properties on .wt-root, and read via var(...) from the
           inline styles below — that way each breakpoint only has to be
           declared once here instead of repeated next to every element
           that uses it. */
        .wt-root {
          --wt-chart-height: 170px;
          --wt-bar-max-width: 20px;
          --wt-dropdown-min-width: 150px;
          --wt-week-flex: 1 1 0;
          --wt-week-min-width: 0px;
          --wt-project-card-min: 280px;
        }

        @keyframes wtSlideInRight {
          from { transform: translateX(28px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes wtSlideInLeft {
          from { transform: translateX(-28px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Weekly Schedule's week columns scroll horizontally instead of
           squeezing down to nothing once they no longer fit side by side. */
        .wt-weeks-row {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .wt-week-col {
          scroll-snap-align: start;
        }

        @media (max-width: 900px) {
          .wt-root {
            padding: 14px !important;
            border-radius: 12px !important;
            --wt-chart-height: 150px;
            --wt-bar-max-width: 16px;
            --wt-dropdown-min-width: 130px;
            /* Below this width each week becomes a swipeable, snapping
               page (~88% of the viewport) instead of an ever-thinner
               column squeezed in alongside its siblings. */
            --wt-week-flex: 0 0 88%;
            --wt-week-min-width: 260px;
            --wt-project-card-min: 240px;
          }
          .wt-filter-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .wt-filter-field {
            width: 100%;
          }
          .wt-refresh-btn {
            width: 100%;
          }
          .wt-weeks-row {
            scroll-snap-type: x proximity;
            padding-bottom: 6px;
          }
          .wt-picker-panel {
            min-width: 0 !important;
            width: 100%;
            max-width: 92vw;
          }
        }

        @media (max-width: 600px) {
          .wt-legend {
            gap: 8px !important;
          }
          .wt-legend span {
            font-size: 10px !important;
          }
        }

        @media (max-width: 480px) {
          .wt-root {
            padding: 10px !important;
            --wt-chart-height: 135px;
            --wt-bar-max-width: 13px;
            --wt-dropdown-min-width: 110px;
            --wt-week-flex: 0 0 92%;
            --wt-week-min-width: 230px;
          }
          .wt-month-nav-label {
            min-width: 70px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 10px" }}>
          {apiLoading && !apiResponse ? "Loading…" : rangeLabel}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, flexWrap: "wrap" }} className="wt-legend">
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569", fontWeight: 600 }}>
            <PatternSwatch color="#64748b" /> P - Planned (left bar)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569", fontWeight: 600 }}>
            <PatternSwatch color="#64748b" /> A - Actual (right bar)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
            <span style={{ color: "#059669" }}>▲</span> Under planned Hours
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
            <span style={{ color: "#dc2626" }}>▼</span> Over planned Hours
          </span>
        </div>

        {/* filter bar */}
        <div
          className="wt-filter-bar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <FilterField label="Year">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={apiLoading}
              style={dropdownStyle}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Month">
            <MultiSelectPicker
              pickerRef={monthPickerRef}
              open={monthPickerOpen}
              setOpen={setMonthPickerOpen}
              disabled={apiLoading}
              summary={monthSummary}
              allLabel="All months"
              allSelected={selectedMonths.length === 0}
              onSelectAll={() => setSelectedMonths([])}
              options={monthPickerOptions}
              selected={selectedMonths}
              onToggle={toggleMonth}
            />
          </FilterField>

          <FilterField label="Project">
            <MultiSelectPicker
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
            />
          </FilterField>

          <FilterField label="Resource">
            <MultiSelectPicker
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
            />
          </FilterField>

          <div style={{ flex: 1 }} />

          <button onClick={() => loadData()} disabled={apiLoading} style={buttonStyle} className="wt-refresh-btn">
            {apiLoading ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      </div>

      {apiLoading && !apiResponse ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Fetching schedule from API…
        </div>
      ) : apiError ? (
        <div style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 13 }}>
          Failed to load schedule: {apiError}
        </div>
      ) : filteredRows.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          No scheduled activity for this selection.
        </div>
      ) : (
        <>
          <AccordionSection title={weeklyScheduleTitle} defaultOpen>
            <div style={{ overflow: "hidden" }}>
              <div
                key={currentMonthBlock.key}
                className="wt-weeks-row"
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "stretch",
                  animation: `${monthSlideDir === 1 ? "wtSlideInRight" : "wtSlideInLeft"} 0.28s ease`,
                }}
              >
                {currentMonthBlock.weeks.map((days, wi) => (
                  <div
                    key={`${currentMonthBlock.key}-${wi}`}
                    className="wt-week-col"
                    style={{
                      // On desktop these vars default to "1 1 0" / "0px" —
                      // weeks share the row evenly, same as before. Below
                      // 900px they switch to a near-full-width, scroll-
                      // snapping page instead (see .wt-root breakpoints).
                      flex: "var(--wt-week-flex, 1 1 0)",
                      minWidth: "var(--wt-week-min-width, 0px)",
                      padding: "0 10px",
                      borderRight: wi < currentMonthBlock.weeks.length - 1 ? "1px solid #eef2f7" : "none",
                    }}
                  >
                    <WeekCard
                      weekIndex={wi}
                      days={days}
                      aggByDate={aggByDate}
                      durationLabels={durationLabels}
                      pctFromHrs={pctFromHrs}
                      resourceColorMap={resourceColorMap}
                      showHover={showHover}
                      hideHover={hideHover}
                    />
                  </div>
                ))}
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="Resource Gantt" defaultOpen>
            <GanttView projects={filteredProjectsData} />
          </AccordionSection>

          {/* <AccordionSection title={projectBreakdownTitle} defaultOpen>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 14px" }}>
                {filteredRows.length} task{filteredRows.length === 1 ? "" : "s"} across {rangeLabel}
              </p>
              <div
                key={`${projectBreakdownKey}-${safeProjectPageIndex}`}
                className="wt-project-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${projectsPerPage}, minmax(0, 1fr))`,
                  gap: 16,
                  animation: `${projectSlideDir === 1 ? "wtSlideInRight" : "wtSlideInLeft"} 0.28s ease`,
                }}
              >
                {currentProjectPage.map((p) => (
                  <ProjectActivityPieChart key={p.project} project={p.project} rows={p.rows} />
                ))}
              </div>
            </div>
          </AccordionSection> */}
        </>
      )}

      {hovered && (
        <div
          ref={tooltipRef}
          onMouseEnter={showHover.bind(null, hovered)}
          onMouseLeave={hideHover}
          style={{
            position: "fixed",
            left: hovered.x,
            top: hovered.y,
            transform: hovered.side === "left" ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)",
            zIndex: 50,
            background: "#0f172a",
            color: "#f1f5f9",
            fontSize: 12,
            borderRadius: 10,
            padding: 12,
            // min(...) keeps the tooltip from overflowing narrow phone
            // viewports instead of always reserving a fixed 280/320px.
            maxWidth: "min(280px, 90vw)",
            maxHeight: "min(320px, 70vh)",
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
          }}
        >
          <TooltipContent entry={hovered.entry} kind={hovered.kind} />
        </div>
      )}
    </div>
    {/* </div> */}
    </div>
  );
}

// Shared visual style for every dropdown control in the filter bar — the
// native Year <select> AND the custom Month/Project/Resource picker
// buttons all use this same object so the whole row reads as one
// consistent control style (same height, padding, border, radius, font,
// and minimum width).
const dropdownStyle = {
  fontSize: 12,
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "6px 10px",
  background: "#f8fafc",
  outline: "none",
  // CSS custom property so mobile/tablet breakpoints (declared once, on
  // .wt-root) can shrink every dropdown's min-width together instead of
  // needing per-element media query overrides.
  minWidth: "var(--wt-dropdown-min-width, 150px)",
  height: 30,
  boxSizing: "border-box",
};

const buttonStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
  background: "#2563eb",
  border: "none",
  borderRadius: 8,
  padding: "7px 14px",
  cursor: "pointer",
};

// Small round prev/next buttons used to page between the selected months in
// the Weekly Schedule card header (and between project pages in the
// Breakdown — By Project card header).
const navArrowStyle = {
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#fff",
  color: "#334155",
  fontSize: 13,
  lineHeight: 1,
  padding: 0,
};

function FilterField({ label, children }) {
  return (
    <label
      className="wt-filter-field"
      style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: "#64748b", fontWeight: 600 }}
    >
      {label}
      {children}
    </label>
  );
}

// Collapsible card wrapper used for each of the three views (weekly
// schedule, Gantt, project breakdown) so a person can collapse the ones
// they aren't looking at right now. Uncontrolled per-section open/close
// state — each section remembers its own toggle independently of the
// others. The header is a div acting as a button (not a real <button>)
// because the Weekly Schedule section needs to nest its own prev/next
// <button>s inside the title, and real buttons can't be nested inside one
// another.
function AccordionSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        marginTop: 16,
        overflow: "hidden",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{title}</span>
        <span
          style={{
            fontSize: 11,
            color: "#94a3b8",
            display: "inline-block",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </div>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

// Small icon used in the top legend. Planned and Actual are both solid —
// the same color is reused for a resource in both stacks — so the only
// thing distinguishing them here is the label ("Plan" / "Act") under each
// day's pair of bars in the chart itself.
function PatternSwatch({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 12,
        borderRadius: 3,
        background: color,
        border: `1px solid ${color}`,
      }}
    />
  );
}

// Shared multi-select dropdown used for the Month, Project, and Resource
// filters — a checkbox list with an "All ___" option pinned to the top.
function MultiSelectPicker({
  pickerRef,
  open,
  setOpen,
  disabled,
  summary,
  allLabel,
  allSelected,
  onSelectAll,
  options,
  selected,
  onToggle,
}) {
  return (
    <div ref={pickerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        style={{
          ...dropdownStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {summary}
        </span>
        <span style={{ fontSize: 9, color: "#94a3b8" }}>▼</span>
      </button>

      {open && (
        <div
          className="wt-picker-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 40,
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
            minWidth: 220,
            maxHeight: 260,
            overflowY: "auto",
            padding: 6,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#334155",
              fontWeight: 600,
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 2,
            }}
          >
            <input type="checkbox" checked={allSelected} onChange={onSelectAll} />
            {allLabel}
          </label>

          {options.map((name) => (
            <label
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#334155",
                padding: "6px 8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => onToggle(name)}
              />
              {name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function TooltipContent({ entry, kind }) {
  if (!entry) return null;
  const hrs = kind === "planned" ? entry.plannedHrs : entry.actualHrs;
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{entry.resourceName}</div>
      <div style={{ color: "#94a3b8" }}>
        {kind === "planned" ? "Planned" : "Actual"} · {fmtDuration(hrs)}
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #334155" }}>
        {entry.tasks.map(({ row, plannedHrs, actualHrs }) => {
          const planned = parseDate(row.plannedStart);
          const plannedStop = parseDate(row.plannedStop);
          const actual = row.actualStart ? parseDate(row.actualStart) : null;
          const actualStop = row.actualStop ? parseDate(row.actualStop) : null;
          const info = finishedEarlyLateInfo(row);
          return (
            <div key={row.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: "#f1f5f9" }}>{row.task}</div>
              <div style={{ color: "#94a3b8" }}>
                {row.module} · {row.project}
              </div>
              <div>
                Planned: {fmtTime(planned)} – {fmtTime(plannedStop)} ({fmtDuration(plannedHrs)})
              </div>
              <div>
                Actual: {actual ? `${fmtTime(actual)} – ${actualStop ? fmtTime(actualStop) : "…"}` : "—"} ({fmtDuration(actualHrs)})
              </div>
              <div>Status: {row.status}</div>
              {info && info.type !== "ontime" && (
                <div style={{ color: info.type === "early" ? "#34d399" : "#f87171" }}>
                  {info.type === "early"
                    ? `Finished ${fmtDuration(info.diff)} early`
                    : `Finished ${fmtDuration(info.diff)} late`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Turns a day's list of {resourceName, hrs} entries into cumulatively
// stacked segments (top%/height% on the shared hours axis).
function buildStack(resources, field, pctFromHrs) {
  let cumulative = 0;
  return resources
    .filter((r) => r[field] > 0)
    .map((r) => {
      const bottomPct = pctFromHrs(cumulative);
      cumulative += r[field];
      const topPct = pctFromHrs(cumulative);
      return { ...r, topPct, heightPct: Math.max(bottomPct - topPct, 0.6) };
    });
}

// Donut chart built from a single CSS conic-gradient, so it needs no
// external charting library and scales cleanly with its container.
//
// One of these is rendered PER PROJECT. Each slice is an ACTIVITY (task)
// within that project — sized by its share of the project's planned hours
// — and the legend next to it shows that activity's own progress %. The
// center of the donut shows the project's overall progress, which is the
// planned-hours-weighted average of its activities' progress percentages.
//
// "Progress" for a single activity (see activityProgressPct):
//   - 100% once any of its rows has an actualStop (finished)
//   - actual/planned hours (capped under 100%) once it has started
//   - 0% if it hasn't started yet
function ProjectActivityPieChart({ project, rows }) {
  const activities = useMemo(() => {
    const agg = aggregateActivities(rows);
    const totalPlanned = agg.reduce((s, a) => s + a.plannedHrs, 0) || 1;
    let cumulative = 0;
    return agg
      .sort((a, b) => b.plannedHrs - a.plannedHrs)
      .map((a, i) => {
        const weightPct = (a.plannedHrs / totalPlanned) * 100;

        // Hours actually done vs still remaining, WITHIN this activity's
        // own planned budget — this is what splits its donut slice (and
        // its legend row) into a "completed" portion and a "pending"
        // portion. A finished activity (any row has actualStop) always
        // reads as fully completed, even if it wrapped up early/late and
        // its real actualHrs differs from what was planned — same rule
        // activityProgressPct already uses for the 100% case.
        const completedHrs = a.finished ? a.plannedHrs : clamp(a.actualHrs, 0, a.plannedHrs);
        const pendingHrs = Math.max(a.plannedHrs - completedHrs, 0);

        const completedWeightPct = (completedHrs / totalPlanned) * 100;

        const start = cumulative;
        const completedEnd = start + completedWeightPct;
        const end = start + weightPct;
        cumulative = end;

        return {
          ...a,
          weightPct,
          completedHrs,
          pendingHrs,
          start,
          completedEnd,
          end,
          progressPct: activityProgressPct(a),
          color: activityColor(i),
          pendingColor: activityColorPending(i),
        };
      });
  }, [rows]);

  const overallProgress = useMemo(() => {
    const totalPlanned = activities.reduce((s, a) => s + a.plannedHrs, 0);
    if (!totalPlanned) return 0;
    const weighted = activities.reduce((s, a) => s + a.progressPct * a.plannedHrs, 0);
    return Math.round(weighted / totalPlanned);
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: "#334155", marginBottom: 6 }}>{project}</div>
        No activity to summarize for this selection.
      </div>
    );
  }

  // Each activity contributes TWO gradient stops instead of one: a solid
  // segment sized by hours actually completed, then a lighter/muted
  // segment (same hue) sized by the hours still pending — so the donut
  // shows both "how big is this task" (slice width, from planned hours)
  // and "how much of it is done" (solid vs muted split) at once.
  const gradientStops = activities
    .flatMap((a) => [
      `${a.color} ${a.start}% ${a.completedEnd}%`,
      `${a.pendingColor} ${a.completedEnd}% ${a.end}%`,
    ])
    .join(", ");

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#334155",
          marginBottom: 10,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={project}
      >
        {project}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
        <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: `conic-gradient(${gradientStops})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 22,
              borderRadius: "50%",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 0 0 1px #f1f5f9",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{overallProgress}%</div>
            <div style={{ fontSize: 9, color: "#94a3b8" }}>progress</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
            minWidth: 160,
            // Fixed to roughly the donut's height with its own scrollbar,
            // so a project with many activities lengthens the legend's
            // internal scroll instead of growing this card (and therefore
            // the whole page) taller.
            maxHeight: 130,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {activities.map((a) => (
            <div key={a.activity} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={a.activity}
                >
                  {a.activity}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 10.5,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  paddingLeft: 17, // aligns under the activity name, past the swatch
                }}
              >
                <span style={{ color: "#059669" }}>Completed {fmtDurationCompact(a.completedHrs)}</span>
                <span style={{ color: a.pendingHrs > 0 ? "#d97706" : "#94a3b8" }}>
                  Pending {fmtDurationCompact(a.pendingHrs)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekCard({
  weekIndex,
  days,
  aggByDate,
  durationLabels,
  pctFromHrs,
  resourceColorMap,
  showHover,
  hideHover,
}) {
  const startLabel = fmtDate(days[0]);
  const endLabel = fmtDate(days[days.length - 1]);

  const rowCount = durationLabels.length;
  // Reads the --wt-chart-height custom property set on .wt-root, which
  // shrinks at the 900px/480px breakpoints — so the chart gets shorter on
  // phones/tablets instead of forcing a 170px-tall row regardless of
  // screen size.
  const chartHeight = "var(--wt-chart-height, 170px)";

  const columnTemplate = days.map(() => "minmax(0, 1fr)").join(" ");

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#334155",
            margin: 0,
          }}
        >
          Week {weekIndex + 1}
        </h3>

        <span
          style={{
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          {startLabel} – {endLabel}
        </span>
      </div>

      <div>
        <div>
          <div
            style={{
              display: "flex",
              height: chartHeight,
              marginTop: 4,
            }}
          >
            {/* Y Axis */}
            <div
              style={{
                width: 28,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {durationLabels.map((t, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: `${(1 - i / (rowCount - 1)) * 100}%`,
                    transform: "translateY(-50%)",
                    fontSize: 9,
                    color: "#94a3b8",
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: columnTemplate,
                gap: 2,
                position: "relative",
                borderLeft: "1px solid #f1f5f9",
              }}
            >
              {durationLabels.map((t, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: `${(1 - i / (rowCount - 1)) * 100}%`,
                    borderTop: "1px solid #f1f5f9",
                  }}
                />
              ))}

              {days.map((date, di) => {
                const key = date.toDateString();
                const agg = aggByDate[key] || { resources: [], plannedTotal: 0, actualTotal: 0 };

                const plannedStack = buildStack(agg.resources, "plannedHrs", pctFromHrs);
                const actualStack = buildStack(agg.resources, "actualHrs", pctFromHrs);

                return (
                  <div
                    key={di}
                    style={{
                      position: "relative",
                      borderRight: di < days.length - 1 ? "1.5px dashed #cbd5e1" : "none",
                      background: di % 2 === 0 ? "transparent" : "rgba(148,163,184,0.045)",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 3,
                        padding: "0 2px",
                      }}
                    >
                      {/* Planned stack */}
                      <StackedBar
                        entries={plannedStack}
                        field="plannedHrs"
                        kind="planned"
                        resourceColorMap={resourceColorMap}
                        showHover={showHover}
                        hideHover={hideHover}
                      />

                      {/* Actual stack */}
                      <StackedBar
                        entries={actualStack}
                        field="actualHrs"
                        kind="actual"
                        resourceColorMap={resourceColorMap}
                        showHover={showHover}
                        hideHover={hideHover}
                        showEarlyLate
                        compareTotal={agg.plannedTotal}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", marginTop: 4 }}>
            <div style={{ width: 28, flexShrink: 0 }} />

            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: columnTemplate,
                gap: 2,
              }}
            >
              {days.map((date, di) => (
                <div
                  key={di}
                  style={{
                    textAlign: "center",
                    fontSize: 9,
                    color: "#94a3b8",
                    lineHeight: 1.25,
                    borderRight: di < days.length - 1 ? "1.5px dashed #cbd5e1" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 1 }}>
                    <span>P</span>
                    <span>A</span>
                  </div>

                  <div style={{ fontWeight: 600, color: "#64748b" }}>{date.getDate()}</div>
                  <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// One vertical stacked bar (either the "Planned" or "Actual" column for a
// single day), made of one segment per resource.
function StackedBar({ entries, field, kind, resourceColorMap, showHover, hideHover, showEarlyLate, compareTotal }) {
  const total = entries.reduce((s, e) => s + e[field], 0);

  let earlyLateGlow = null;
  if (showEarlyLate && total > 0 && compareTotal > 0) {
    const diff = total - compareTotal;
    if (Math.abs(diff) > EARLY_LATE_THRESHOLD_HRS) {
      earlyLateGlow = diff < 0 ? "early" : "late";
    }
  }

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        // Shrinks at smaller breakpoints (see --wt-bar-max-width on
        // .wt-root) so P/A bar pairs don't get crushed together on phones.
        maxWidth: "var(--wt-bar-max-width, 20px)",
        height: "100%",
        border: earlyLateGlow
          ? `1.5px solid ${earlyLateGlow === "early" ? "#059669" : "#dc2626"}`
          : "1px solid #e2e8f0",
        borderRadius: 6,
        background: "#fafafa",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        {entries.map((entry) => {
          const c = resourceColorMap[entry.resourceName] || resourceBaseColor(0);
          const background = kind === "planned" ? c.planned : c.actual;
          // The pulse is reserved for work that is ACTUALLY in progress right
          // now — a resource's Actual segment only pulses while one of its
          // tasks has status "Running". It's a slow pulse (2.8s) so it reads
          // as "still going" rather than an alert.
          const isLivePulse = kind === "actual" && entry.hasRunning;

          // Shared by onMouseEnter (desktop hover) and onClick (touch —
          // phones/tablets have no hover, so tapping a segment is the only
          // way to see its tooltip there).
          const activateSegment = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const spaceOnRight = window.innerWidth - rect.right;
            const side = spaceOnRight < 300 ? "left" : "right";
            showHover({
              x: side === "left" ? rect.left : rect.right,
              y: rect.top + rect.height / 2,
              side,
              entry,
              kind,
            });
          };

          return (
            <div
              key={entry.resourceName}
              onMouseEnter={activateSegment}
              onMouseLeave={hideHover}
              onClick={(e) => {
                e.stopPropagation();
                activateSegment(e);
              }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${entry.topPct}%`,
                height: `${entry.heightPct}%`,
                background,
                borderTop: "1px solid rgba(255,255,255,0.6)",
                cursor: "pointer",
                animation: isLivePulse ? "beepPulseRunning 2.8s ease-in-out infinite" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {/* Duration label — only rendered once the segment has grown
                  tall enough (roughly 3.5% of the bar's height, ~6px at the
                  170px chart height used here) to hold a short label
                  without visually overflowing into its neighbors. Always
                  rendered rotated 90° (vertical) so it reads along the bar
                  instead of across its ~20px width. */}
              {entry.heightPct >= 3.5 && (
                <span
                  style={{
                    // clamp(min, viewport-scaled, max) keeps the label
                    // legible on wide screens without letting it grow past
                    // what a ~20px-wide segment can actually hold on
                    // narrow/mobile viewports.
                    fontSize: "clamp(6px, 1.6vw, 8px)",
                    lineHeight: 1,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.95)",
                    textShadow: "0 1px 1px rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {fmtDurationCompact(entry[field])}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showEarlyLate && total > 0 && compareTotal > 0 && (() => {
        const diff = total - compareTotal;
        if (Math.abs(diff) <= EARLY_LATE_THRESHOLD_HRS) return null;
        const isEarly = diff < 0;
        return (
          <Tooltip
            title={isEarly ? "Under planned hours" : "Over planned hours"}
            arrow
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: "translate(-50%, -140%)",
                fontSize: 12,
                fontWeight: 700,
                color: isEarly ? "#059669" : "#dc2626",
                cursor: "pointer",
              }}
            >
              {isEarly ? "▲" : "▼"}
            </div>
          </Tooltip>
        );
      })()}
    </div>
  );
}
