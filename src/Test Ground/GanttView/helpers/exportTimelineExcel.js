import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { getDisplayStatus } from "../../helpers/statusDisplay";
import { fmtDateShort, formatDurationHrs } from "./filterOptions";

// Convert hex to Excel ARGB format
function toArgb(hex) {
  const clean = hex.replace("#", "");
  return `FF${clean.toUpperCase()}`;
}

// Map UI statuses to Excel Fill Colors (Hex)
const STATUS_COLORS = {
  "yet to start": "F97316", // Orange
  "start due": "EF4444",    // Red
  running: "3B82F6",        // Blue
  "running late": "EF4444", // Red
  completed: "22C55E",      // Green
  finished: "8B5CF6",       // Violet
  paused: "F97316",         // Orange
  pending: "CBD5E1",        // Gray
  rejected: "EF4444",       // Red
  closed: "64748B",         // Slate
};

function getStatusArgb(status) {
  const key = String(status || "").toLowerCase().trim();
  return toArgb(STATUS_COLORS[key] || "CBD5E1");
}

export async function exportTimelineExcel(project) {
  const rows = project.rows || [];
  const customCols = project.customColumns || [];

  // 1. Find min and max dates across the project
  let minStart = Infinity;
  let maxStop = -Infinity;

  rows.forEach((r) => {
    const start = r.plannedStart ? new Date(r.plannedStart).getTime() : null;
    const stop = r.plannedStop ? new Date(r.plannedStop).getTime() : null;
    if (start && start < minStart) minStart = start;
    if (stop && stop > maxStop) maxStop = stop;
  });

  const hasDates = minStart !== Infinity && maxStop !== -Infinity;

  if (hasDates) {
    // Add 1 day buffer before and after
    minStart -= 24 * 60 * 60 * 1000;
    maxStop += 24 * 60 * 60 * 1000;
  } else {
    minStart = Date.now();
    maxStop = Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  // 2. Generate Time Columns
  const dayCols = [];
  let curDay = new Date(minStart);
  curDay.setHours(0, 0, 0, 0);
  while (curDay.getTime() <= maxStop) {
    dayCols.push(new Date(curDay));
    curDay.setDate(curDay.getDate() + 1);
  }

  const hourCols = [];
  let curHour = new Date(minStart);
  curHour.setMinutes(0, 0, 0);
  // Cap at 2000 hours for performance
  let hourCount = 0;
  while (curHour.getTime() <= maxStop && hourCount < 2000) {
    hourCols.push(new Date(curHour));
    curHour.setHours(curHour.getHours() + 1);
    hourCount++;
  }

  // 3. Define Standard Columns
  const standardHeaders = [
    { header: "Module", key: "module", width: 20 },
    { header: "Task", key: "task", width: 35 },
    { header: "Resource", key: "resource", width: 22 },
    { header: "Status", key: "status", width: 15 },
    { header: "Planned Start", key: "plannedStart", width: 20 },
    { header: "Planned Stop", key: "plannedStop", width: 20 },
    { header: "Planned Dur(hrs)", key: "plannedDur", width: 16 },
    { header: "Actual Start", key: "actualStart", width: 20 },
    { header: "Actual Stop", key: "actualStop", width: 20 },
    { header: "Actual Dur(hrs)", key: "actualDur", width: 16 },
  ];

  customCols.forEach((c) => {
    standardHeaders.push({ header: c.name, key: `custom_${c.id}`, width: 22 });
  });

  const fixedColCount = standardHeaders.length;
  const workbook = new ExcelJS.Workbook();

  // Helper to build a sheet
  const buildSheet = (sheetName, timeCols, isHour) => {
    const sheet = workbook.addWorksheet(sheetName, {
      // ── FIXED: Freeze only first 2 columns (Module & Task) so horizontal scroll works ──
      views: [{ state: "frozen", xSplit: 2, ySplit: 1 }],
    });

    // Setup headers
    const allHeaders = [...standardHeaders];
    timeCols.forEach((dt) => {
      allHeaders.push({
        header: dt.toLocaleDateString("en-GB", isHour ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", year: "2-digit" }),
        key: `time_${dt.getTime()}`,
        width: isHour ? 15 : 12,
      });
    });
    sheet.columns = allHeaders;

    // Style Header Row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    // Fill Data Rows
    rows.forEach((row) => {
      const rowData = {
        module: row.module || "",
        task: row.task || "",
        resource: row.resourceName || row.resource || "",
        status: getDisplayStatus(row),
        plannedStart: fmtDateShort(row.plannedStart) || "—",
        plannedStop: fmtDateShort(row.plannedStop) || "—",
        plannedDur: formatDurationHrs(row.durationHrs) || "—",
        actualStart: fmtDateShort(row.actualStart) || "—",
        actualStop: fmtDateShort(row.actualStop) || "—",
        actualDur: formatDurationHrs(row.actualDurationHrs) || "—",
      };

      customCols.forEach((c) => {
        rowData[`custom_${c.id}`] = row.customValues?.[c.id] || "—";
      });

      const excelRow = sheet.addRow(rowData);

      // Color Timeline Grid
      const pStart = row.plannedStart ? new Date(row.plannedStart).getTime() : null;
      const pStop = row.plannedStop ? new Date(row.plannedStop).getTime() : null;

      if (pStart && pStop) {
        const fillArgb = getStatusArgb(getDisplayStatus(row));

        timeCols.forEach((dt, idx) => {
          const colIndex = fixedColCount + idx + 1; // +1 because Excel columns are 1-indexed
          const timeStart = dt.getTime();
          let timeEnd;

          if (isHour) {
            timeEnd = timeStart + 60 * 60 * 1000 - 1;
          } else {
            const end = new Date(dt);
            end.setHours(23, 59, 59, 999);
            timeEnd = end.getTime();
          }

          // Check overlap
          if (pStart <= timeEnd && pStop >= timeStart) {
            excelRow.getCell(colIndex).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: fillArgb },
            };
          }
        });
      }
    });
  };

  buildSheet("Day-wise Timeline", dayCols, false);
  buildSheet("Hour-wise Timeline", hourCols, true);

  const cleanName = (project.project || "Project").replace(/[^a-z0-9]/gi, "_");
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Timeline_${cleanName}.xlsx`);
}