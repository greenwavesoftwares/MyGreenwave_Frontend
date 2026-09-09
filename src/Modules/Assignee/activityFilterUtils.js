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

/** Field-key -> node date property for every column's date-range quick
 * filter (DateRangeFilterButton in ColumnFilter.jsx: All/Last Month/Today/
 * Current Month/Upcoming Month). Adding a new date column's quick filter
 * is just one more entry here. */
const DATE_RANGE_BASE_FIELDS = {
  plannedStart: "plannedStart",
  plannedStop: "plannedStop",
  actualStart: "actualStart",
  actualStop: "actualStop",
};

/** How each bucket suffix decides whether a raw date value belongs to it. */
const DATE_RANGE_BUCKET_CHECKS = {
  Today: (raw) => dayjs(raw).isSame(dayjs(), "day"),
  CurrentMonth: (raw) => dayjs(raw).isSame(dayjs(), "month"),
  LastMonth: (raw) => dayjs(raw).isSame(dayjs().subtract(1, "month"), "month"),
  UpcomingMonth: (raw) => dayjs(raw).isSame(dayjs().add(1, "month"), "month"),
};

/** Builds the full set of date-range filter field keys, e.g.
 * "plannedStartToday", "plannedStartLastMonth", "actualStopCurrentMonth",
 * ... one per (base date field) x (bucket) combination, each mapped back
 * to the base field + bucket check needed to evaluate it. */
const DATE_RANGE_FIELD_MAP = Object.keys(DATE_RANGE_BASE_FIELDS).reduce(
  (map, base) => {
    Object.keys(DATE_RANGE_BUCKET_CHECKS).forEach((bucket) => {
      map[`${base}${bucket}`] = { base: DATE_RANGE_BASE_FIELDS[base], bucket };
    });
    return map;
  },
  {},
);

/** Type strings used for a sub-activity row, depending on whether it came
 * back from the API ("SUBTASK") or was just created client-side and hasn't
 * been saved yet (see addChildNode in ProjectActivityInfo.jsx, "SUBACTIVITY").
 * The "task" column filter is conceptually a top-level-task filter, so a
 * sub-activity row is never judged against it on its own — it's kept or
 * dropped based on whether the task it lives under matches (see the
 * taskFilterMatchedByParent cascade in filterTree). */
const SUBTASK_TYPES = new Set(["SUBTASK", "SUBACTIVITY"]);

/** Read the display value for a given column ("field") off of a node. */
export const nodeFieldValue = (field, node) => {
  if (field.startsWith("custom:")) {
    const colId = field.slice(7);
    return String(node.customValues?.[colId] ?? "-");
  }
  if (DATE_RANGE_FIELD_MAP[field]) {
    const { base, bucket } = DATE_RANGE_FIELD_MAP[field];
    const raw = node[base];
    return raw && DATE_RANGE_BUCKET_CHECKS[bucket](raw) ? "true" : "false";
  }
  //find the field value based on field name
  switch (field) {
    case "task":
      // Sub-activity rows aren't "tasks" themselves — leave this blank so
      // they never surface as an option in the Task filter dropdown
      // (uniqueSorted drops empty values) and never satisfy a task-name
      // filter match off their own name.
      return SUBTASK_TYPES.has(node.type) ? "" : node.name || "";
    case "resource":
      return node.resourceName || node.resource || "";
    case "status":
      const time=node.activityStatus==='Running'?node.plannedStop:node.plannedStart
      return updateStatus(node.activityStatus, time) || "";
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
  console.log("Status:",status)
  const statusInLC=status.toLowerCase()
   console.log("status:", status);
    console.log("time:", time);
  switch (statusInLC) {
    case "pending":
      if (dayjs() < dayjs(time)) return "Yet to Start";
      else if(dayjs()>dayjs(time)) return 'Start Due'
      else
      return "Pending";
    case "completed":
      return "Completed";
    case "finished":
      return "Finished";
    case "running":
      if(dayjs()>dayjs(time))
        return "Running Late"
      else
        return "Running";
    case "paused":
      return "Paused"
    case "rejected":
      return "Rejected"
  }
};
/** Free-text search match, same fields as the original search box. */
export const nodeMatchesSearch = (node, term) => {
  const t = term.toLowerCase();
   const time=node.activityStatus==='Running'?node.plannedStop:node.plannedStart
  const updatedStatus=updateStatus(node.activityStatus, time)
  return (
    node.name?.toLowerCase()?.includes(t) ||
    node.resourceName?.toLowerCase()?.includes(t) ||
    node.resource?.toLowerCase()?.includes(t) ||
    node.activityStatus?.toLowerCase().includes(t) ||
    updateStatus(node.activityStatus,time)?.includes(t) ||
    node.type?.toLowerCase().includes(t)
  );
};

/** Does this node's own fields satisfy every active column filter?
 * (The "module" field is intentionally skipped here — module-name
 * filtering is handled a level up in filterTree, since it decides
 * whether to include the whole module rather than a single row.) */
export const matchesColumnFilters = (node, filters) => {
  for (const [field, selectedSet] of Object.entries(filters || {})) {
    if (!selectedSet || selectedSet.size === 0) continue;
    if (field === "module") continue;
    // The Task filter is a top-level-task filter — a sub-activity row has
    // no task name of its own to compare against the selected set, so it's
    // skipped here (like "module" above) rather than judged on this field.
    // Whether a given sub-activity should be kept is instead decided by
    // filterTree, which only recurses into a task's children once that
    // task itself has passed the task filter — so a sub-activity still
    // only survives under a genuinely matching parent task, it's just not
    // required to match the task field on its own.
    if (field === "task" && SUBTASK_TYPES.has(node.type)) continue;
    // A module header row has no task/resource/status/date value of its own,
    // so it can never genuinely satisfy a task-level filter. Previously this
    // was a `continue`, which skipped the check entirely and let module rows
    // trivially pass every filter — keeping modules in the result even when
    // none of their children matched. Returning false here instead means a
    // module now survives only via a real matching descendant in filterTree
    // (filteredChildren.length > 0), so modules unrelated to the filtered
    // tasks are correctly dropped.
    if (node.type === "MODULE") return false;
    const value = nodeFieldValue(field, node);//find the value of the field based on field name
    if (!selectedSet.has(value)) return false;//checks whether the field value is present in the selected set,if not present then return false
  }
  return true;
};

/** Walk the module/activity tree, applying the search term and every
 * active column filter (checkbox selections keyed by field name).
 *
 * `taskFilterMatchedByParent` threads down whether the task-level ancestor
 * a given node lives under has already passed the task filter. It's only
 * meaningful for sub-activity rows (which have no task name of their own
 * to check — see the "task" case in matchesColumnFilters), and defaults to
 * true so it's a no-op wherever no task filter is active, or for nodes
 * that aren't nested under a task at all (modules, and task rows
 * themselves, which are judged on their own name below instead). */
export const filterTree = (nodes, term, filters, taskFilterMatchedByParent = true) => {
  const moduleFilter = filters?.module;
  const taskFilter = filters?.task;
  return (nodes || []).reduce((acc, node) => {
    if (
      node.type === "MODULE" &&
      moduleFilter &&
      moduleFilter.size > 0 &&
      !moduleFilter.has(node.name)
    ) {
      return acc; // this whole module is filtered out
    }

    const isSubtask = SUBTASK_TYPES.has(node.type);
    const isTaskRow = node.type !== "MODULE" && !isSubtask;

    // A task row's own name decides whether it satisfies the task filter.
    // A module is judged on module-name filtering above, not this. A
    // sub-activity has no task name of its own, so it simply inherits
    // whatever its immediate parent task row worked out.
    const taskFilterOk =
      !taskFilter || taskFilter.size === 0
        ? true
        : isTaskRow
          ? taskFilter.has(nodeFieldValue("task", node))
          : taskFilterMatchedByParent;

    if (isTaskRow && taskFilter?.size > 0 && !taskFilterOk) {
      // This task doesn't match the task filter — drop it along with all
      // of its sub-activities. A sub-activity that happens to satisfy
      // every *other* active filter shouldn't resurrect a task the task
      // filter itself excluded.
      return acc;
    }

    const filteredChildren = node.children?.length
      ? filterTree(node.children, term, filters, taskFilterOk)
      : [];
    const selfSearchOk = !term || nodeMatchesSearch(node, term);
    const selfFilterOk = matchesColumnFilters(node, filters);
    const keepSelf = selfSearchOk && selfFilterOk;

    if (keepSelf || filteredChildren.length > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
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
    //pass each node along with module name and its parent task's name in result array
    const walk = (node, taskName) => {
      result.push({ ...node, _moduleName: moduleName, _taskName: taskName });//pushing the node in result
      //pass child node along walk and pushing them in result; a sub-activity
      //has no task name of its own, so it keeps inheriting the task name
      //passed down to it rather than overwriting it with its own
      if (node.children?.length) {
        const childTaskName = SUBTASK_TYPES.has(node.type) ? taskName : node.name;
        node.children.forEach((child) => walk(child, childTaskName));
      }
    };
    //this is the start of walk for the children of module node — each one
    //is itself a task row, so it's tagged with its own name as the task name
    (moduleNode.children || []).forEach((taskNode) => walk(taskNode, taskNode.name));
  });
  return result;
};

/** De-dupe + sort (numeric-aware) a list of display values for a filter dropdown. */
export const uniqueSorted = (arr) =>
  Array.from(
    new Set(
      (arr || []).filter((v) => v !== undefined && v !== null && v !== ""),
    ),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));//here the undefined in localeCompare is given because there are no locales to sort with,i.e. no language to sort with, like english, swedish, etc 
  //compares a with b checks if the characters are numeric, if it's numeric then numeric sorting occurs
  //suppose Appple1,Apple2 and Apple10 are compared, if it's normal sort then the result will be
  //Apple1,Apple10,Apple2 as it compares character by character, since numeric is true, Apple1,Apple2,Apple10 is the output

/** Does this leaf node satisfy every active column filter EXCEPT the one
 * named `exceptField`? Used to build cascading dropdown options: a given
 * column's own selection shouldn't narrow its own option list (otherwise
 * you'd never be able to add/change a selection), but every *other* active
 * filter — including "module" — should. */
const nodeMatchesFiltersExcept = (node, filters, exceptField) => {
  //if the except field, the field that can be excluded from the filteration is not module, then filter based on module 
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
  //same idea for the task filter: a task row is judged on its own name,
  //but a sub-activity has no task name of its own, so it's judged on the
  //name of the task it lives under (_taskName, set by collectLeafNodesByModule)
  if (exceptField !== "task") {
    const taskFilter = filters?.task;
    if (taskFilter && taskFilter.size > 0) {
      const taskValue = SUBTASK_TYPES.has(node.type)
        ? node._taskName
        : nodeFieldValue("task", node);
      if (!taskFilter.has(taskValue)) return false;
    }
  }
  //iterates through the entries of the objects, suppose this array has two objects [{name:"Apple",id:"001"},{name:"Banana",id:"002"}]
  //the iteration will be done in this format {field:"name",selectedSet:["Apple","Banana"]}, {field:"id",selectedSet:["001","002"]}
  for (const [field, selectedSet] of Object.entries(filters || {})) {
    if (field === "module" || field === "task" || field === exceptField) continue;//module and task are handled above; skip the field being computed too
    if (!selectedSet || selectedSet.size === 0) continue;//if size of the set is 0 or the set is null, then continues to next iteration
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

  /**
   * Sort the filter values by traversing to leaf nodes
   */
  const optionsFor = (field) =>
    uniqueSorted(
      leafNodes
        .filter((n) => nodeMatchesFiltersExcept(n, columnFilters, field))
        //filters the node based on all the column filters except the field to be ignored, i.e the current field, suppose resource is the current field
        //then this function filters nodes based on modules and then tasks, and only includes all resources after all other filters are done
        .map((n) => nodeFieldValue(field, n)),
    );

  const options = {
    module: uniqueSorted(moduleNodes.map((n) => n.name)),//sort the filter values based on field and the sorting will be done lexicographically as well as numerically
    task: optionsFor("task"),//sort the filter value by traversing to the leaf nodes
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