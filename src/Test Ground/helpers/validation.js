/* ═══════════════════════════════════════════════════════
   Project validation before publish
   ═══════════════════════════════════════════════════════ */
import { parseISODateTime, fmtDisplay } from "./dateUtils";
import { getResourceByUserId } from "./resources";
import { isPending } from "./chains";
import {
  findAllCycles,
  findOrphanedDependencies,
  findAllSchedulingConflicts,
  formatCyclePath,
} from "./dependencies";
export function runValidations(
  rows,
  project,
  po,
  site,
  groups,
  groupResources,
  projectStatus = "draft",
) {
  const results = [];
  const warnings = [];

  // 1. Project metadata
  const metaMissing = [];
  if (!project.trim()) metaMissing.push("Project Name");
  if (!po.trim()) metaMissing.push("PO No");
  if (!site.trim()) metaMissing.push("Site / Customer");
  if (!groups.length) metaMissing.push("Group");
  results.push({
    ok: metaMissing.length === 0,
    title:
      metaMissing.length === 0
        ? "Project metadata complete"
        : "Project metadata incomplete",
    detail:
      metaMissing.length === 0
        ? "Project, PO, Site and Group are all set."
        : `Missing: ${metaMissing.join(", ")}`,
  });

  // 2. Activities loaded
  results.push({
    ok: rows.length > 0,
    title: rows.length > 0 ? `${rows.length} activities loaded` : "No activities",
    detail: rows.length > 0 ? "" : "Upload an Excel sheet or add rows manually.",
  });

  // 3. Scheduling info
  const incomplete = rows.filter((r) => {
    const hasDuration =
      r.durationHrs !== "" &&
      r.durationHrs !== null &&
      r.durationHrs !== undefined &&
      !isNaN(Number(r.durationHrs));
    return !r.resource || !hasDuration || !r.plannedStart;
  });
  results.push({
    ok: incomplete.length === 0,
    title:
      incomplete.length === 0
        ? "All rows fully scheduled"
        : `${incomplete.length} row${incomplete.length !== 1 ? "s" : ""} missing scheduling info`,
    detail:
      incomplete.length === 0
        ? "Resource, start datetime and duration set on every row."
        : "Each row needs a resource, planned start, and duration.",
  });

  // 4. Resource overlaps
  const pendingOverlaps = [];
  const mixedOverlaps = [];
  const byRes = {};

  rows.forEach((r) => {
    if (r.resource && r.plannedStart && r.plannedStop) {
      (byRes[r.resource] = byRes[r.resource] || []).push(r);
    }
  });

  const isParentSubPair = (a, b) => a.parentId === b.id || b.parentId === a.id;

  Object.entries(byRes).forEach(([userId, arr]) => {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (isParentSubPair(a, b)) continue;

        if (a.plannedStart < b.plannedStop && b.plannedStart < a.plannedStop) {
          const aPending = isPending(a);
          const bPending = isPending(b);
          if (!aPending && !bPending) continue;

          const resObj = getResourceByUserId(userId, groups, groupResources);
          const overlapInfo = {
            resource: resObj?.name || userId,
            task1: a.task || `Row #${a.id}`,
            task2: b.task || `Row #${b.id}`,
            status1: a.status || "pending",
            status2: b.status || "pending",
            rowId1: a.id,
            rowId2: b.id,
          };

          if (aPending && bPending) pendingOverlaps.push(overlapInfo);
          else mixedOverlaps.push(overlapInfo);
        }
      }
    }
  });

  if (pendingOverlaps.length > 0) {
    warnings.push({
      title: `${pendingOverlaps.length} pending task overlap${pendingOverlaps.length !== 1 ? "s" : ""} detected`,
      detail:
        pendingOverlaps
          .slice(0, 5)
          .map((o) => `• ${o.resource}: "${o.task1}" ⇄ "${o.task2}"`)
          .join("\n") +
        (pendingOverlaps.length > 5
          ? `\n…and ${pendingOverlaps.length - 5} more`
          : "") +
        "\n\nOverlapping tasks may cause scheduling conflicts.",
    });
  }

  if (mixedOverlaps.length > 0) {
    warnings.push({
      title: `${mixedOverlaps.length} pending task${mixedOverlaps.length !== 1 ? "s" : ""} overlap${mixedOverlaps.length !== 1 ? "" : "s"} with active work`,
      detail:
        mixedOverlaps
          .slice(0, 5)
          .map(
            (o) =>
              `• ${o.resource}: "${o.task1}" (${o.status1}) ⇄ "${o.task2}" (${o.status2})`,
          )
          .join("\n") +
        (mixedOverlaps.length > 5
          ? `\n…and ${mixedOverlaps.length - 5} more`
          : ""),
    });
  }

  if (pendingOverlaps.length === 0) {
    results.push({
      ok: true,
      title: "No pending task overlaps",
      detail: "Pending tasks for each resource are sequenced cleanly.",
    });
  }

  // 5. Weekend stop check
  let badTime = false;
  rows.forEach((r) => {
    if (r.plannedStop) {
      const d = parseISODateTime(r.plannedStop);
      if (d && (d.getDay() === 0 || d.getDay() === 6)) badTime = true;
    }
  });
  results.push({
    ok: !badTime,
    title: !badTime
      ? "All stops within working calendar"
      : "Stop falls on weekend",
    detail: !badTime
      ? "Stops skip weekends and leaves."
      : "A computed stop date is on a non-working day.",
  });

  // 6. Sub-task overflow
  const overflowSubs = [];
  const tolerance = 60 * 1000;

  rows.forEach((r) => {
    if (!r.parentId) return;
    if (!r.plannedStart || !r.plannedStop) return;

    const parent = rows.find((p) => p.id === r.parentId);
    if (!parent || !parent.plannedStart || !parent.plannedStop) return;

    const subStart = parseISODateTime(r.plannedStart);
    const subStop = parseISODateTime(r.plannedStop);
    const parStart = parseISODateTime(parent.plannedStart);
    const parStop = parseISODateTime(parent.plannedStop);

    if (
      subStart.getTime() < parStart.getTime() - tolerance ||
      subStop.getTime() > parStop.getTime() + tolerance
    ) {
      overflowSubs.push({
        sub: r.task || `Row #${r.id}`,
        parent: parent.task || `Row #${parent.id}`,
      });
    }
  });

  results.push({
    ok: overflowSubs.length === 0,
    title:
      overflowSubs.length === 0
        ? "Sub-tasks fit within parent windows"
        : `${overflowSubs.length} sub-task${overflowSubs.length !== 1 ? "s exceed" : " exceeds"} parent window`,
    detail:
      overflowSubs.length === 0
        ? "All sub-tasks are bounded by their parent task times."
        : `Reduce these sub-task durations:\n${overflowSubs
            .slice(0, 5)
            .map((o) => `• "${o.sub}" — exceeds parent "${o.parent}"`)
            .join("\n")}${overflowSubs.length > 5 ? `\n…and ${overflowSubs.length - 5} more` : ""}`,
  });

  // 7. Past date check (draft only)
  const isDraftProject = !projectStatus || projectStatus === "draft";
  if (isDraftProject) {
    const now = new Date();
    const pendingPastRows = [];

    rows.forEach((r, idx) => {
      if (!r.plannedStart) return;
      const startDt = parseISODateTime(r.plannedStart);
      if (!startDt || startDt >= now) return;
      const status = String(r.status || "pending").toLowerCase().trim();
      if (status !== "pending") return;
      pendingPastRows.push({
        idx: idx + 1,
        task: r.task || r.module || `Row #${idx + 1}`,
        start: fmtDisplay(startDt),
        status: r.status || "pending",
      });
    });

    results.push({
      ok: pendingPastRows.length === 0,
      title:
        pendingPastRows.length === 0
          ? "All pending tasks have future start times"
          : `${pendingPastRows.length} pending task${pendingPastRows.length !== 1 ? "s have" : " has"} a past start time`,
      detail:
        pendingPastRows.length === 0
          ? "Pending tasks are scheduled in the future."
          : `These pending tasks must be rescheduled:\n${pendingPastRows
              .slice(0, 5)
              .map((r) => `• "${r.task}" — ${r.start}`)
              .join("\n")}${pendingPastRows.length > 5 ? `\n…and ${pendingPastRows.length - 5} more` : ""}`,
    });
  }

  // ── 8. Circular dependencies (BLOCKING) ──
  const cycles = findAllCycles(rows);
  results.push({
    ok: cycles.length === 0,
    title:
      cycles.length === 0
        ? "No circular dependencies"
        : `${cycles.length} circular dependenc${cycles.length !== 1 ? "ies" : "y"} detected`,
    detail:
      cycles.length === 0
        ? "Dependency chain is acyclic — safe to publish."
        : `Fix these dependency loops:\n${cycles
            .slice(0, 5)
            .map((cycle, i) => `${i + 1}. ${formatCyclePath(cycle, rows)}`)
            .join("\n")}${cycles.length > 5 ? `\n…and ${cycles.length - 5} more` : ""}`,
  });

  // ── 9. Orphaned dependencies (BLOCKING) ──
  const orphans = findOrphanedDependencies(rows);
  results.push({
    ok: orphans.length === 0,
    title:
      orphans.length === 0
        ? "All dependency references are valid"
        : `${orphans.length} task${orphans.length !== 1 ? "s have" : " has"} broken dependency references`,
    detail:
      orphans.length === 0
        ? "Every dependency points to an existing task."
        : `These tasks reference deleted rows and need cleanup:\n${orphans
            .slice(0, 5)
            .map(
              (o) =>
                `• "${o.row.task || o.row.module || `Row #${o.row.id}`}" — ${o.missingIds.length} missing reference${o.missingIds.length !== 1 ? "s" : ""}`,
            )
            .join(
              "\n",
            )}${orphans.length > 5 ? `\n…and ${orphans.length - 5} more` : ""}\n\nOpen the dependency editor to remove broken links.`,
  });

  // ── 10. Scheduling conflicts in dependencies (WARNING) ──
  const depConflicts = findAllSchedulingConflicts(rows);
  if (depConflicts.length > 0) {
    warnings.push({
      title: `${depConflicts.length} dependency scheduling conflict${depConflicts.length !== 1 ? "s" : ""}`,
      detail:
        depConflicts
          .slice(0, 5)
          .map((c) => {
            const rowName = c.row.task || c.row.module || `Row #${c.row.id}`;
            const depName = c.dep.task || c.dep.module || `Row #${c.dep.id}`;
            const rowStartStr = c.rowStart ? fmtDisplay(c.rowStart) : "no start";
            const depStopStr = c.depStop ? fmtDisplay(c.depStop) : "no stop";
            return `• "${rowName}" starts ${rowStartStr}\n   depends on "${depName}" ending ${depStopStr}`;
          })
          .join("\n") +
        (depConflicts.length > 5
          ? `\n…and ${depConflicts.length - 5} more`
          : "") +
        "\n\nEither adjust dates or accept the risk — dependencies may cause delays.",
    });
  }

  // Collect overlapping row IDs
  const overlapIds = new Set();
  pendingOverlaps.forEach((o) => {
    overlapIds.add(o.rowId1);
    overlapIds.add(o.rowId2);
  });
  mixedOverlaps.forEach((o) => {
    overlapIds.add(o.rowId1);
    overlapIds.add(o.rowId2);
  });

  return { results, warnings, overlapIds };
}