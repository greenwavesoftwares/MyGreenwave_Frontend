import dayjs from "dayjs";

/* ── activityFilterUtils ──────────────────────────────────────────────
 * All the data-side logic for the Activities table's search box and
 * per-column checkbox filters lives here, kept separate from
 * ProjectActivityInfo.jsx so the component file only has to worry about
 * rendering + wiring things together.
 * ---------------------------------------------------------------------
 * The activity data is a tree: modules -> activities -> subactivities.
 * `filterTree` walks that tree and keeps a node if it (a) matches the
 * free-text search term and all active column filters itself, or
 * (b) has at least one descendant that does — mirroring how the search
 * box already worked before column filters were added.
 * ----------------------------------------------------------------- */

/** Format a date-ish value the same way a given table column displays it,
 * so the filter checkbox values always match what's on screen. */
export const formatDT = (val, fmt) =>
  val && dayjs(val).isValid() ? dayjs(val).format(fmt) : "-";

/** Read the display value for a given column ("field") off of a node. */
export const nodeFieldValue = (field, node) => {
  if (field.startsWith("custom:")) {
    const colId = field.slice(7);
    return String(node.customValues?.[colId] ?? "-");
  }
  switch (field) {
    case "task":
      return node.name || "";
    case "resource":
      return node.resourceName || node.resource || "";
    case "status":
      return updateStatus(node.activityStatus,node.plannedStart) || "";
    case "plannedStart":
      return formatDT(node.plannedStart, "DD-MM-YYYY HH:mm");
    case "plannedStop":
      return formatDT(node.plannedStop, "DD-MM-YYYY HH:mm");
    case "actualStart":
      return formatDT(node.actualStart, "YYYY-MM-DD HH:mm");
    case "actualStop":
      return formatDT(node.actualStop, "YYYY-MM-DD HH:mm");
    case "duration":
      return String(node.durationHrs ?? "—");
    default:
      return "";
  }
};
export const updateStatus = (status, time) => {
  if(!status)
    return
  const statusInLC=status.toLowerCase()
   console.log("status:", status);
    console.log("time:", time);
  switch (statusInLC) {
    case "pending":
      if (dayjs() > dayjs(time)) return "Due to Start";
      else return "Pending";
    case "completed":
      return "Completed";
    case "finished":
      return "Finished";
    case "running":
      return "Running";
    case "paused":
      return "Paused"
  }
};
/** Free-text search match, same fields as the original search box. */
export const nodeMatchesSearch = (node, term) => {
  const t = term.toLowerCase();
  const updatedStatus=updateStatus(node.activityStatus,node.plannedStart)
  return (
    node.name?.toLowerCase().includes(t) ||
    node.resourceName?.toLowerCase().includes(t) ||
    node.resource?.toLowerCase().includes(t) ||
    node.activityStatus?.toLowerCase().includes(t) ||
    updateStatus(node.activityStatus,node.plannedStart).includes(t) ||
    node.type?.toLowerCase().includes(t)
  );
};

/** Does this node's own fields satisfy every active column filter?
 * (The "module" field is intentionally skipped here — module-name
 * filtering is handled a level up in filterTree, since it decides
 * whether to include the whole module rather than a single row.) */
export const matchesColumnFilters = (node, filters) => {
  for (const [field, selectedSet] of Object.entries(filters || {})) {
    console.log("Selected set::", selectedSet);
    console.log("Field::", field);
    if (!selectedSet || selectedSet.size === 0) continue;
    if (field === "module") continue;
    if (node.type === "MODULE") continue; // these fields don't apply to module header rows
    const value = nodeFieldValue(field, node);
    if (!selectedSet.has(value)) return false;
  }
  return true;
};

/** Walk the module/activity tree, applying the search term and every
 * active column filter (checkbox selections keyed by field name). */
export const filterTree = (nodes, term, filters) => {
  const moduleFilter = filters?.module;
  return (nodes || []).reduce((acc, node) => {
    if (
      node.type === "MODULE" &&
      moduleFilter &&
      moduleFilter.size > 0 &&
      !moduleFilter.has(node.name)
    ) {
      return acc; // this whole module is filtered out
    }

    const filteredChildren = node.children?.length
      ? filterTree(node.children, term, filters)
      : [];
    const selfSearchOk = !term || nodeMatchesSearch(node, term);
    const selfFilterOk = matchesColumnFilters(node, filters);
    const keepSelf = selfSearchOk && selfFilterOk;

    if (keepSelf || filteredChildren.length > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
    console.log("Filtered tree::", acc);
    return acc;
  }, []);
};

/** Flatten the tree into a single array (modules + activities + subactivities). */
export const flattenNodes = (nodes) =>
  (nodes || []).reduce((acc, n) => {
    acc.push(n);
    if (n.children?.length) acc.push(...flattenNodes(n.children));
    return acc;
  }, []);

/** Collect every non-module (activity/subactivity) node, tagged with the
 * name of the top-level module it actually lives under. We derive this from
 * the tree structure itself — walking down from each module — rather than
 * trusting a `moduleName` field on the node, because that field is only
 * reliably set on rows created in-session (see addChildNode); rows that
 * come back from the API may not carry it at all. Tagging by position in
 * the tree works regardless of what the raw data does or doesn't include. */
const collectLeafNodesByModule = (modules) => {
  const result = [];
  (modules || []).forEach((moduleNode) => {
    const moduleName = moduleNode.name;
    const walk = (node) => {
      result.push({ ...node, _moduleName: moduleName });
      if (node.children?.length) node.children.forEach(walk);
    };
    (moduleNode.children || []).forEach(walk);
  });
  return result;
};

/** De-dupe + sort (numeric-aware) a list of display values for a filter dropdown. */
export const uniqueSorted = (arr) =>
  Array.from(
    new Set(
      (arr || []).filter((v) => v !== undefined && v !== null && v !== ""),
    ),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

/** Does this leaf node satisfy every active column filter EXCEPT the one
 * named `exceptField`? Used to build cascading dropdown options: a given
 * column's own selection shouldn't narrow its own option list (otherwise
 * you'd never be able to add/change a selection), but every *other* active
 * filter — including "module" — should. */
const nodeMatchesFiltersExcept = (node, filters, exceptField) => {
  if (exceptField !== "module") {
    const moduleFilter = filters?.module;
    if (
      moduleFilter &&
      moduleFilter.size > 0 &&
      !moduleFilter.has(node._moduleName)
    ) {
      return false;
    }
  }
  for (const [field, selectedSet] of Object.entries(filters || {})) {
    if (field === "module" || field === exceptField) continue;
    if (!selectedSet || selectedSet.size === 0) continue;
    const value = nodeFieldValue(field, node);
    if (!selectedSet.has(value)) return false;
  }
  return true;
};

/** Build the { field: [options...] } map used to populate every column's
 * checkbox dropdown.
 *
 * Cascading behaviour:
 *  - "module" options always list every module (top of the chain).
 *  - "task" options are scoped to whichever module(s) are selected; if no
 *    module is selected, every task is shown.
 *  - "resource"/"status" (and every other leaf column) are scoped by
 *    whichever module/task/etc. filters are currently active; if none of
 *    those are selected, every value is shown.
 *
 * In general, each column's options reflect the intersection of every
 * *other* active filter, so picking a module narrows tasks/resources/status,
 * picking a task further narrows resources/status, and so on — while a
 * column's own current selection never hides its own options. */
export const computeFilterOptions = (modules, customColumns, columnFilters) => {
  const moduleNodes = modules || [];
  const leafNodes = collectLeafNodesByModule(modules);

  const optionsFor = (field) =>
    uniqueSorted(
      leafNodes
        .filter((n) => nodeMatchesFiltersExcept(n, columnFilters, field))
        .map((n) => nodeFieldValue(field, n)),
    );

  const options = {
    module: uniqueSorted(moduleNodes.map((n) => n.name)),
    task: optionsFor("task"),
    resource: optionsFor("resource"),
    status: optionsFor("status"),
    plannedStart: optionsFor("plannedStart"),
    plannedStop: optionsFor("plannedStop"),
    actualStart: optionsFor("actualStart"),
    actualStop: optionsFor("actualStop"),
    duration: optionsFor("duration"),
  };

  customColumns?.forEach((col) => {
    const field = `custom:${col.id}`;
    options[field] = optionsFor(field);
  });

  return options;
};
