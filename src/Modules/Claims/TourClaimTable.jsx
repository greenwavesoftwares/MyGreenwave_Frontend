import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import CustomButton from "../../components/Button/Button";
import { CustomeCalender } from "../../components/Calender/CustomeCalender";

import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import * as XLSX from "xlsx";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";

import {
  formateDate,
  savetodraft,
  updateDraftdata,
  downloadTourClaimExpanseDocument,
} from "./claimServices";

const cellStyle = { padding: "8px 12px" };

const initialFormState = {
  // id: Date.now(),
  Date: "",
  Lodging: "",
  Breakfast: "",
  Lunch: "",
  Snacks: "",
  Dinner: "",
  "Tea & Water": "",
  "Airfare, Bus, Train, Taxi Rental": "",
  "Auto, Cab": "",
  "Parking, Toll, Fuel": "",
  Incidentals: "",
  "Other Business Expenses": "",
  Total: "",
  Remarks: "",
};

// ---------------------------------------------------------------------------
// Excel template download
// Builds a sheet holding only the expense table: the column headings, one
// blank row per date in the claim period, and a Total row. No amounts are
// filled in. onFileSelect() finds the heading row by itself, so the filled-in
// template can be uploaded back with "Upload Excel".
// ---------------------------------------------------------------------------
const EXPORT_MAX_DAYS = 366;
const HEADER_ROW = 1; // Excel row of the column headings

// The Airfare heading has no space after the comma: that is the spelling
// onFileSelect() looks for.
const TEMPLATE_HEADERS = [
  "Date",
  "Lodging",
  "Breakfast",
  "Lunch",
  "Snacks",
  "Dinner",
  "Tea & Water",
  "Airfare, Bus, Train,Taxi Rental",
  "Auto, Cab",
  "Parking, Toll, Fuel",
  "Incidentals",
  "Other Business Expenses",
  "Total",
  "Remarks",
];
const TEMPLATE_COL_WIDTHS = [
  15, 12, 12, 11, 11, 11, 13, 18, 12, 15, 13, 17, 13, 32,
];

const buildTourClaimTemplate = (ExcelJS, start, end, fromText, toText) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Travel Expense Claim", {
    views: [{ state: "frozen", ySplit: HEADER_ROW }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });
  ws.columns = TEMPLATE_COL_WIDTHS.map((width) => ({ width }));

  const LAST_COL = TEMPLATE_HEADERS.length; // 14 -> column N
  const thin = { style: "thin", color: { argb: "FF000000" } };
  const box = { top: thin, left: thin, bottom: thin, right: thin };
  const MONEY = "#,##0.00";

  const styleCell = (cell, { bold, size, align, fill, border, wrap } = {}) => {
    cell.font = { name: "Arial", size: size || 10, bold: !!bold };
    cell.alignment = {
      vertical: "middle",
      horizontal: align || "left",
      wrapText: !!wrap,
    };
    if (fill) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fill },
      };
    }
    if (border !== false) cell.border = box;
  };

  // ---- Expense table ----
  const headerRow = ws.getRow(HEADER_ROW);
  headerRow.height = 34;
  TEMPLATE_HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    styleCell(cell, { bold: true, align: "center", wrap: true });
  });

  const firstRow = HEADER_ROW + 1;
  let r = firstRow;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // UTC midnight so Excel stores the exact calendar day
    const dateValue = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
    );
    const row = ws.getRow(r);
    row.height = 20;
    for (let c = 1; c <= LAST_COL; c++) {
      const cell = row.getCell(c);
      if (c === 1) {
        cell.value = dateValue;
        cell.numFmt = "yyyy-mm-dd";
        styleCell(cell, { align: "center" });
      } else if (c === LAST_COL - 1) {
        // Total = sum of the amount columns; blank until something is entered
        cell.value = {
          formula: `IF(COUNT(B${r}:L${r})=0,"",SUM(B${r}:L${r}))`,
          result: "",
        };
        cell.numFmt = MONEY;
        styleCell(cell, { align: "center" });
      } else if (c === LAST_COL) {
        styleCell(cell, { align: "left", wrap: true });
      } else {
        cell.numFmt = MONEY;
        styleCell(cell, { align: "center" });
      }
    }
    r++;
  }
  const lastRow = r - 1;

  // Totals row
  const totalRow = lastRow + 1;
  ws.getRow(totalRow).height = 24;
  for (let c = 1; c <= LAST_COL; c++) {
    const cell = ws.getCell(totalRow, c);
    if (c === 1) {
      cell.value = "Total";
      styleCell(cell, { align: "center" });
    } else if (c < LAST_COL) {
      const col = ws.getColumn(c).letter;
      cell.value = {
        formula: `SUM(${col}${firstRow}:${col}${lastRow})`,
        result: 0,
      };
      cell.numFmt = MONEY;
      styleCell(cell, { align: "center" });
    } else {
      styleCell(cell);
    }
  }

  return wb;
};

const TourClaimTable = ({
  editableMode,
  seteditableMode,
  toggleNewClaim,
  settoggleNewClaim,
  settourClaimTableData,
  tourClaimTableData,
  settourclaimFormLabeData,
  tourclaimformData,
  settourclaimformData,
  setDraftData,
  draftData,
  setFormErrors,
  formErrors,
  setselectedtravelMode,
}) => {
  // const [editingIndex, setEditingIndex] = useState(null);
  const [editingRows, setEditingRows] = useState({});
  const toastRef = useRef(null);
  const [fileUploaded, setFileUploaded] = useState(false);

  // const calculateTotal = (entry) => {
  //   const keys = Object.keys(initialFormState).filter(
  //     (k) => k !== "Date" && k !== "Remarks"
  //   );
  //   return keys.reduce((sum, key) => sum + (parseFloat(entry[key]) || 0), 0);
  // };

  const calculateTotal = (entry) => {
    const keys = Object.keys(initialFormState).filter(
      (k) => k !== "Date" && k !== "Remarks" && k !== "Total",
    );

    let sum = 0;

    sum = keys.reduce((acc, key) => {
      return acc + (parseFloat(entry[key]) || 0);
    }, 0);

    return sum;
  };

  const hasDuplicateDatesOrZeroTotal = (data) => {
    const seen = new Set();
    for (let row of data) {
      const date = row["Date"];
      // const total = parseFloat(row["Total"]) || 0;
      if (!date) return { hasIssue: true, reason: "Date cann't be null" };
      if (seen.has(date))
        return { hasIssue: true, reason: "Duplicate date found" };
      seen.add(date);
      // if (total === 0)
      //   return { hasIssue: true, reason: "Total amount cann't be zero" };
    }
    return { hasIssue: false };
  };
  const validateForm = () => {
    const requiredFields = [
      "travelType",
      "destination",
      "purpose",
      "projectName",
      "onAccount",
      // "travelfromDate",
      "claimFromDate",
      "claimToDate",
      //"advanceRequested",
    ];

    const errors = {};

    requiredFields.forEach((field) => {
      if (
        !tourclaimformData[field] ||
        tourclaimformData[field].toString().trim() === ""
      ) {
        errors[field] = true;
      }
    });

    setFormErrors(errors); // highlight those with errors

    return Object.keys(errors).length === 0; // valid if no errors
  };

  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const updatedData = [...tourClaimTableData];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [name]: value,
    };
    // updatedData[rowIndex]["Total"] = calculateTotal(updatedData[rowIndex]);
    settourClaimTableData(updatedData);
  };

  const handleDateChange = (e, rowIndex) => {
    const updatedData = [...tourClaimTableData];
    updatedData[rowIndex]["Date"] = formateDate(e.value); //e.value?.toISOString().split("T")[0] || "";
    settourClaimTableData(updatedData);
  };

  const openEditMode = (index) => {
    const updatedData = [...tourClaimTableData];
    updatedData[index]["Total"] = 0; // Reset only the Total
    settourClaimTableData(updatedData);
    setEditingIndex(index);
  };

  const deleteRow = (rowData) => {
    settourClaimTableData(
      tourClaimTableData.filter((item) => item.Date !== rowData.Date),
    );
  };
  // const deleteRow = (index) => {

  //   const updated = tourClaimTableData.filter((_, i) => i !== index);
  //   settourClaimTableData(updated);
  //   setEditingIndex(null);
  // };

  // True when the table already has a row for every date from Claim From
  // Date to Claim To Date (inclusive). Used to disable "Add Row".
  const allRangeDatesPresent = (() => {
    const { claimFromDate, claimToDate } = tourclaimformData || {};
    if (!claimFromDate || !claimToDate) return false;

    const start = new Date(claimFromDate);
    const end = new Date(claimToDate);
    if (isNaN(start) || isNaN(end)) return false;
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (start > end) return false;

    const present = new Set(
      (tourClaimTableData || [])
        .filter((r) => r.Date)
        .map((r) => formateDate(r.Date)),
    );

    // Same day cap as the row sync in TourClaim.jsx
    let checked = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (++checked > 366) return false;
      if (!present.has(formateDate(d))) return false;
    }
    return true;
  })();

  const handleAddRow = () => {
    // Check if upper form has errors
    // const requiredFields = ["purpose", "projectName", "city", "localityArea", "typeOfTravel", "fromDate", "tentativeToDate"];
    // const upperFormIncomplete = requiredFields.some((field) => formErrors[field]);

    // if (upperFormIncomplete) {
    //   showWarningMessage(toastRef,"Please complete requisition form before adding accommodation.");
    //   return;
    // }

    if (
      !tourclaimformData.destination ||
      !tourclaimformData.purpose ||
      !tourclaimformData.projectName ||
      !tourclaimformData.projectName ||
      !tourclaimformData.claimFromDate ||
      !tourclaimformData.claimToDate
    ) {
      showWarningMessage(
        toastRef,
        "Please complete claim details form before adding expense.",
      );
      return;
    }
    if (allRangeDatesPresent) {
      showWarningMessage(
        toastRef,
        "All dates in the claim period already have a row.",
      );
      return;
    }

    const isIncomplete = tourClaimTableData.some((row) => !row.Date);

    if (isIncomplete) {
      showWarningMessage(toastRef, "Please complete all required fields.");
      return;
    }

    settourClaimTableData([
      ...tourClaimTableData,
      { ...initialFormState, Total: 0 },
    ]);

    setEditingRows((prev) => ({ ...prev, [initialFormState.Date]: true }));
    // setEditingIndex(tourClaimTableData.length);
  };

  const onFileSelect = (event) => {
    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const bstr = e.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Find the heading row (the row whose first cell is "Date"). Works for
      // the downloaded template (row 1) and for the older layout (row 16).
      const allRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: true,
      });
      let headerRowIndex = allRows.findIndex(
        (r) => String(r?.[0] ?? "").trim().toLowerCase() === "date",
      );
      if (headerRowIndex < 0) headerRowIndex = 15; // previous default
      const headers = allRows[headerRowIndex];

      // settourclaimFormLabeData({
      //   destination: worksheet["C12"]?.v || "",
      //   purposeOfTrip: worksheet["C13"]?.v || "",
      //   projectName: worksheet["J9"]?.v || "",
      //   onAccount: worksheet["J10"]?.v || "",
      //   fromDate: formateDate(worksheet["J11"]?.v),
      //   toDate: formateDate(worksheet["J12"]?.v),
      // });

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        header: headers,
        defval: "",
      });
      console.log(" Raw Excel JSON:", jsonData);

      // Index the rows already in the table by date (YYYY-MM-DD)
      const updatedRows = [...tourClaimTableData];
      const rowIndexByDate = new Map();
      updatedRows.forEach((r, i) => {
        const key = formateDate(r["Date"]);
        if (key) rowIndexByDate.set(key, i);
      });

      let filledCount = 0;
      let skippedRows = 0;
      const extraDates = [];

      jsonData.forEach((row) => {
        // Rows without a readable date (blank / footer / totals rows) are skipped
        const parsedDate = formateDate(row["Date"]);
        if (!parsedDate) {
          skippedRows++;
          return;
        }

        const importedRow = { ...initialFormState, Date: parsedDate };

        for (const key of Object.keys(initialFormState)) {
          if (key === "Date") continue;

          let excelKey = key;
          // Fix mismatch header coming from Excel
          if (key === "Airfare, Bus, Train, Taxi Rental") {
            excelKey = "Airfare, Bus, Train,Taxi Rental";
          }

          if (key === "Remarks") {
            importedRow[key] = row[excelKey] ?? "";
          } else {
            const num = parseFloat(row[excelKey]);
            importedRow[key] = !isNaN(num) ? num : 0;
          }
        }
        importedRow["Total"] = calculateTotal(importedRow);

        if (rowIndexByDate.has(parsedDate)) {
          // Date already present in the table -> fill that row
          const idx = rowIndexByDate.get(parsedDate);
          updatedRows[idx] = { ...updatedRows[idx], ...importedRow };
          filledCount++;
        } else {
          // Date outside the claim period -> not added, reported below
          extraDates.push(parsedDate);
        }
      });

      // Excel has dates outside the claim period -> block the whole import
      if (extraDates.length > 0) {
        const sorted = [...extraDates].sort();
        showWarningMessage(
          toastRef,
          `Import blocked: Excel has ${extraDates.length} date(s) outside the claim period ` +
            `(${sorted[0]} to ${sorted[sorted.length - 1]}). ` +
            `Please match Claim From Date and Claim To Date with the date range in the Excel and upload again.`,
        );
        setFileUploaded(false);
        return;
      }

      if (filledCount === 0) {
        showWarningMessage(
          toastRef,
          "No rows with a valid date were found in the Excel file.",
        );
        setFileUploaded(false);
        return;
      }

      settourClaimTableData(updatedRows);
      setFileUploaded(true);

      showSuccessMessage(
        toastRef,
        "success",
        `${filledCount} row(s) filled` +
          (skippedRows ? `, ${skippedRows} row(s) skipped (no valid date).` : "."),
      );
    };

    reader.readAsBinaryString(file);
  };

  // Download the blank claim template: one row per date from Claim From Date
  // to Claim To Date (inclusive). No amounts are filled in.
  const handleExportExcel = async () => {
    const { claimFromDate, claimToDate } = tourclaimformData || {};

    if (!claimFromDate || !claimToDate) {
      showWarningMessage(
        toastRef,
        "Select both Claim From and Claim To dates before downloading the template.",
      );
      return;
    }

    const start = new Date(claimFromDate);
    const end = new Date(claimToDate);
    if (isNaN(start) || isNaN(end)) {
      showWarningMessage(toastRef, "Invalid claim date. Please pick again.");
      return;
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      showWarningMessage(
        toastRef,
        "Claim From date cannot be after Claim To date.",
      );
      return;
    }

    const days = Math.round((end - start) / 86400000) + 1;
    if (days > EXPORT_MAX_DAYS) {
      showWarningMessage(
        toastRef,
        `The claim period is ${days} days. The template supports at most ${EXPORT_MAX_DAYS} days.`,
      );
      return;
    }

    try {
      // Loaded on demand so exceljs is not part of the main bundle
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;

      const fromText = formateDate(start);
      const toText = formateDate(end);
      const workbook = buildTourClaimTemplate(
        ExcelJS,
        start,
        end,
        fromText,
        toText,
      );

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TourClaim_Template_${fromText}_to_${toText}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccessMessage(
        toastRef,
        "success",
        `Template downloaded with ${days} date(s) (${fromText} to ${toText}).`,
      );
    } catch (error) {
      console.error("Error creating Excel template:", error);
      showErrorMessage(
        toastRef,
        "error",
        "Could not create the Excel template.",
      );
    }
  };

  const handleSaveToDraft = async () => {
    try {
      console.log("formErrors", formErrors);
      console.log("draftdata", draftData);
      if (!validateForm()) {
        //const firstKey = Object.keys(formErrors)[0];
        if (toastRef?.current) {
          showErrorMessage(
            toastRef,
            "Error",
            `Please fill in all required fields.`,
          );
        }

        return;
      }
      const response = await savetodraft(tourclaimformData, tourClaimTableData);
      //   if (response?.success) {
      if (!response.status) {
        showErrorMessage(toastRef, "error", response.message);
      } else {
        showSuccessMessage(toastRef, "success", response.message);

        setDraftData(response.data);
        seteditableMode(false);
        settoggleNewClaim(false);
        settourClaimTableData([]);
        setselectedtravelMode(null);
      }
    } catch (error) {
      showErrorMessage(toastRef, "error", error?.message);

      console.log(error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!validateForm()) {
        //const firstKey = Object.keys(formErrors)[0];
        if (toastRef?.current) {
          showErrorMessage(
            toastRef,
            "Error",
            `Please fill in all required fields.`,
          );
        }

        return;
      }
      const response = await updateDraftdata(
        tourclaimformData,
        tourClaimTableData,
        tourclaimformData.claim_id,
      );
      console.log("response", response);
      if (!response.status) {
        showErrorMessage(toastRef, "error", response.message);
      } else {
        showSuccessMessage(toastRef, "success", response.message);
        setDraftData(response.data);
        seteditableMode(false);
        settourClaimTableData([]);
        setselectedtravelMode(null);
      }
    } catch (error) {
      showErrorMessage(toastRef, "error", error?.message);

      console.log(error);
    }
  };
  // const renderCell = (rowData, field, rowIndex) => {
  //   if (editingIndex === rowIndex) {
  //     if (field === "Date") {
  //       return (
  //         <Calendar
  //           value={rowData["Date"] ? new Date(rowData["Date"]) : null}
  //           onChange={(e) => handleDateChange(e, rowIndex)}
  //           dateFormat="dd-mm-yy"
  //           showIcon
  //           className="p-inputtext-sm w-full"
  //           minDate={
  //             tourclaimformData.claimFromDate
  //               ? new Date(tourclaimformData.claimFromDate)
  //               : null
  //           }
  //           maxDate={
  //             tourclaimformData.claimToDate
  //               ? new Date(tourclaimformData.claimToDate)
  //               : null
  //           }
  //         />
  //       );
  //     } else if (field == "Remarks") {
  //       return (
  //         <InputText
  //           name={field}
  //           value={rowData[field] || ""}
  //           onChange={(e) => handleChange(e, rowIndex)}
  //           className="p-inputtext-sm w-full"
  //         />
  //       );
  //     } else if (field == "Total") {
  //       return (
  //         <InputText
  //           name={field}
  //           value={rowData[field] || ""}
  //           onChange={(e) => handleChange(e, rowIndex)}
  //           className="p-inputtext-sm w-full"
  //           disabled
  //         />
  //       );
  //     }

  //     return (
  //       <InputText
  //         name={field}
  //         value={rowData[field] || ""}
  //         onChange={(e) => handleChange(e, rowIndex)}
  //         onKeyPress={(e) => {
  //           const key = e.key;
  //           const currentValue = rowData[field] || "";

  //           // Allow digits and a single dot
  //           if (!/[\d.]/.test(key)) {
  //             e.preventDefault();
  //           }

  //           // Prevent more than one dot
  //           if (key === "." && currentValue.includes(".")) {
  //             e.preventDefault();
  //           }
  //         }}
  //         onPaste={(e) => {
  //           const paste = e.clipboardData.getData("text");
  //           // Allow only valid float numbers
  //           if (!/^\d*\.?\d*$/.test(paste)) {
  //             e.preventDefault();
  //           }
  //         }}
  //         className="p-inputtext-sm w-full"
  //       />
  //     );
  //   }
  //   return <span>{rowData[field]}</span>;
  // };

  const actionBodyTemplate = (row, { rowIndex }) => (
    <div className="flex gap-2">
      {/* {editingIndex === rowIndex ? (
        <CustomButton
          icon="pi pi-check"
          className="p-button-sm p-button-success"
          onClick={() => {
            // const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
            // if (result.hasIssue) {
            //   toast.current?.show({
            //     severity: "warn",
            //     summary: "Validation Warning",
            //     detail: result.reason,
            //   });
            //   return;
            // }

            const updated = [...tourClaimTableData];
            updated[editingIndex]["Total"] = calculateTotal(
              updated[editingIndex]
            );
            settourClaimTableData(updated);
            setEditingIndex(null);
          }}
        />
      ) : (
        <CustomButton
          icon="pi pi-pencil"
          className="p-button-sm p-button-text p-button-info"
          onClick={() => openEditMode(rowIndex)}
        />
      )} */}
      <CustomButton
        icon="pi pi-trash"
        className="p-button-sm p-button-text p-button-danger"
        // onClick={() => handleDelete(rowIndex)}
        onClick={() => deleteRow(row)}
      />
    </div>
  );

  const fields = Object.keys(initialFormState);
  // const handleDownloadFile = async () => {
  //   try {
  //     let d = await downloadTourClaimExpanseDocument();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const allowEdit = (rowData) => {
    return rowData.name !== "Blue Band";
  };

  const onRowEditComplete = (e) => {
    let _tourClaimTableData = [...tourClaimTableData];
    let { newData, index } = e;

    // A row that already had a date keeps it, whatever the editor sent back
    const savedDate = _tourClaimTableData[index]?.Date;
    if (savedDate) newData = { ...newData, Date: savedDate };

     const formattedDate = formateDate(newData.Date);

  if (!formattedDate) {
    showWarningMessage(toastRef, "warn", "Date cannot be empty");
    return;
  }

     //  Duplicate date check (ignore current row)
  const duplicate = _tourClaimTableData.some(
    (row, i) => i !== index && row.Date === formattedDate
  );

  if (duplicate) {
    showWarningMessage(toastRef, "warn", "Duplicate date not allowed");
    return;
  }

    newData.Total = calculateTotal(newData);
    newData.Date = formateDate(newData.Date);
    //calculateTotal(newData)
    if (!newData.Date) {
      showWarningMessage(toastRef, "warn", "Date Cannot be Empty");
      return;
    }

    _tourClaimTableData[index] = newData;

    settourClaimTableData(_tourClaimTableData);
  };

  const textEditor = (options) => {
    console.log("texteditoroptions", options);
    const handleChange = (e) => {
      const value = e.target.value;

      // Allow only non-negative numbers with optional decimals
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        options.editorCallback(value);
      }
    };
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={handleChange}
        // onChange={(e) => options.editorCallback(e.target.value)}
        className="p-inputtext-sm w-full inputFieldStyle"
        //className="text-xs  w-full"
      />
    );
  };

  const textEditor2 = (options) => {
    console.log("texteditoroptions", options);
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
        className="p-inputtext-sm w-full inputFieldStyle"
        //className="text-xs  w-full"
      />
    );
  };
  // "2025-11-04" -> local Date (new Date("2025-11-04") would be read as UTC
  // and could land on the previous day in some timezones)
  const toLocalDate = (value) => {
    if (typeof value === "string") {
      const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    }
    return new Date(value);
  };

  const dateEditor = (options) => {
    // A row that already has a date shows it in a disabled calendar, so it
    // looks like the editor but can't be changed. Only rows with a blank
    // date (added with the "+" button) get a working calendar. We check the
    // saved row in the table, not the row being edited, so a blank row
    // doesn't lock itself the moment a date is picked.
    const savedRow = tourClaimTableData[options.rowIndex];

    // Existing date -> read-only. Never calls editorCallback, so the value
    // can't change.
    if (savedRow?.Date) {
      return (
        <InputText
          value={formateDate(savedRow.Date)}
          disabled
          readOnly
          className="p-inputtext-sm w-full inputFieldStyle"
        />
      );
    }

    // Blank date (row added with "+") -> pick one inside the claim period
    options.value = options.value ? toLocalDate(options.value) : null;
    return (
      <CustomeCalender
        value={options.value}
        onChange={(e) => options.editorCallback(e.value)}
        minDate={new Date(tourclaimformData.claimFromDate)}
        maxDate={new Date(tourclaimformData.claimToDate)}
      />
    );
  };

  const calculateColumnTotals = () => {
    const totals = {};

    Object.keys(initialFormState).forEach((key) => {
      if (key !== "Date" && key !== "Remarks") {
        totals[key] = tourClaimTableData.reduce((sum, row) => {
          return sum + (parseFloat(row[key]) || 0);
        }, 0);
      }
    });

    return totals;
  };

  const columnTotals = calculateColumnTotals();
  return (
    <>
      <Toast ref={toastRef} />
      <div className="flex justify-end mb-2 gap-3 align-items-center  mr-2">
        {/* {fileUploaded?( */}
        {/* <FileUpload
          mode="basic"
          name="file"
          accept=".xls,.xlsx"
          customUpload
          uploadHandler={onFileSelect}
          maxFileSize={1000000}
          chooseLabel="Upload"
        /> */}
        {/* ): <CustomButton
              icon="pi pi-times"
              className="p-button-sm p-button-text p-button-danger"
              onClick={() => {
                setFileUploaded(false);
              }}
              tooltip="ReUpload"
            />} */}
        {!fileUploaded ? (
          <FileUpload
            mode="basic"
            name="file"
            accept=".xls,.xlsx"
            customUpload
            auto
            uploadHandler={(e) => {
              onFileSelect(e);
              // Reset the uploader so the same file can be chosen again
              // (e.g. after the claim dates are corrected)
              e.options?.clear?.();
            }}
            maxFileSize={50000000}
            chooseLabel="Upload Excel"
            className="selectButtonStyle"
          />
        ) : (
          <div className="flex align-items-center gap-2 mt-2">
            <span className="text-green-600 font-medium">
              File uploaded successfully
            </span>
            <Button
              icon="pi pi-refresh"
              className="p-button-sm p-button-text p-button-warning"
              onClick={() => {
                setFileUploaded(false);
              }}
              tooltip="Re-upload"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        )}

        {/* <CustomButton
          // label="Add Row"
          icon="pi pi-plus"
          className="p-button-sm "
          onClick={handleAddRow}
          tooltip="Add Row"
          rounded={"true"}
           size="small"
          style={{width:"1rem",height:"2.1rem"}}
          
        /> */}
        <Button
          label="Download Template"
          icon="pi pi-file-export"
          className="p-button-sm p-button-success"
          onClick={handleExportExcel}
          tooltip="Download a blank Excel template with one row for each date in the claim period"
          tooltipOptions={{ position: "top" }}
          type="button"
        />
      </div>

      <div>
        <DataTable
          value={tourClaimTableData}
          showGridlines
          // scrollable
          // scrollHeight="250px"
          editingRows={editingRows}
          editMode="row"
          dataKey="Date"
          onRowEditChange={(e) => setEditingRows(e.data)}
          className=" dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder dataTableFooter"
          tableStyle={{ fontSize: "0.7rem" }}
          onRowEditComplete={onRowEditComplete}
          footerColumnGroup={null}
          header="Date-wise Details"
          size="small"
          stripedRows
        >
          {/* {fields.map((field) => (
          <Column
            key={field}
            header={field}
            body={(rowData, options) =>
              renderCell(rowData, field, options.rowIndex)
            }
            headerStyle={{
              ...cellStyle,
              width: field === "Date" ? "100px" : undefined, // wider width for Date
            }}
            bodyStyle={{
              ...cellStyle,
              width: field === "Date" ? "100px" : undefined,
            }}
          />
        ))} */}
          {/* <Column field="Date" header="Date" editor={(options) => textEditor(options)} style={{ width: '10%' }}/> */}
          <Column
            field="Date"
            header="Date"
            editor={dateEditor}
            body={(row) => (row.Date ? formateDate(row.Date) : "")}
            footer="Total"
            style={{ width: "115px" }}
          />
          {/* <Column
          field="Date"
          header="Date"
          editor={dateEditor}
          // editor={(options) => (
          //   <Calendar
          //     value={
          //       options.value ? new Date(options.value) : null
          //     }
          //     onChange={(e) => handleDateChange(e, options.rowIndex)}
          //    // onChange={(e) => options.editorCallback(e.target.value)}s
          //     dateFormat="dd-mm-yy"
          //     className="p-inputtext-sm w-full"
          //     style={{ minWidth: "105px" }}
          //       minDate={
          //     tourclaimformData.claimFromDate
          //       ? new Date(tourclaimformData.claimFromDate)
          //       : null
          //   }
          //   maxDate={
          //     tourclaimformData.claimToDate
          //       ? new Date(tourclaimformData.claimToDate)
          //       : null
          //   }
          //   />
          // )}
        /> */}
          <Column
            field="Lodging"
            header="Lodging"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Lodging"]?.toFixed(2)}
          />
          <Column
            field="Breakfast"
            header="Breakfast"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Breakfast"]?.toFixed(2)}
          />
          <Column
            field="Lunch"
            header="Lunch"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Lunch"]?.toFixed(2)}
          />
          <Column
            field="Snacks"
            header="Snacks"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Snacks"]?.toFixed(2)}
          />
          <Column
            field="Dinner"
            header="Dinner"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Dinner"]?.toFixed(2)}
          />
          <Column
            field="Tea & Water"
            header="Tea & Water"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Tea & Water"]?.toFixed(2)}
          />
          <Column
            field="Airfare, Bus, Train, Taxi Rental"
            header="Airfare, Bus, Train, Taxi Rental"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Airfare, Bus, Train, Taxi Rental"]?.toFixed(
              2,
            )}
          />
          <Column
            field="Auto, Cab"
            header="Auto, Cab"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Auto, Cab"]?.toFixed(2)}
          />
          <Column
            field="Parking, Toll, Fuel"
            header="Parking, Toll, Fuel"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Parking, Toll, Fuel"]?.toFixed(2)}
          />
          <Column
            field="Incidentals"
            header="Incidentals"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Incidentals"]?.toFixed(2)}
          />
          <Column
            field="Other Business Expenses"
            header="Other Business Expenses"
            editor={(options) => textEditor(options)}
            footer={columnTotals["Other Business Expenses"]?.toFixed(2)}
          />
          <Column
            field="Total"
            header="Total"
            // editor={(options) => textEditor(options)}
            footer={columnTotals["Total"]?.toFixed(2)}
            // disabled={true}
          />
          <Column
            field="Remarks"
            header="Remarks"
            editor={(options) => textEditor2(options)}
          />
          <Column
            rowEditor={allowEdit}
            header="Edit"
            style={{ width: "105px", textAlign: "center" }}
          />
          <Column
            header="Action"
            body={actionBodyTemplate}
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
        </DataTable>
      </div>

      <div className="flex justify-between items-center mt-3 mb-3">
        <div></div>
        {editableMode ? (
          <div className="flex gap-2">
            <CustomButton
              label="Update"
              icon="pi pi-save"
              className="p-button-sm"
              onClick={() => {
                const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
                console.log("result", result);
                if (result.hasIssue) {
                  showWarningMessage(toastRef, "warn", result.reason);
                  // toast.current?.show({
                  //   severity: "warn",
                  //   summary: "Validation Warning",
                  //   detail: result.reason,
                  // });
                  return;
                }
                handleUpdate();
                //showSuccessMessage(toastRef, "success", "Tour claim updated!");
              }}
            />
            <CustomButton
              label="Home"
              icon="pi pi-home"
              onClick={() => {
                seteditableMode(false);
              }}
              className="p-button-sm"
              s
            />
          </div>
        ) : (
          <div className="flex gap-3">
            <CustomButton
              label="Save to Draft"
              icon="pi pi-save"
              className="p-button-sm"
              severity={"success"}
              style={{ padding: "0.5rem 0.7rem" }}
              onClick={() => {
                const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
                if (result.hasIssue) {
                  showWarningMessage(toastRef, "warn", result.reason);
                  // toast.current?.show({
                  //   severity: "warn",
                  //   summary: "Validation Warning",
                  //   detail: result.reason,
                  // });
                  return;
                }
                handleSaveToDraft();
              }}
            />

            <CustomButton
              label="Home"
              icon="pi pi-home"
              onClick={() => {
                seteditableMode(false);
                settoggleNewClaim(false);
                settourClaimTableData([]);
                setselectedtravelMode(null);
              }}
              className="p-button-sm selectButtonStyle"
              size={"small"}
              style={{ padding: "0.5rem 0.7rem" }}
              disabled={draftData?.length === 0}

              // disabled={toggleNewClaim===true}
            />
          </div>
        )}
        <CustomButton
          // label="Add Row"
          icon="pi pi-plus"
          className="p-button-sm mr-4"
          severity="success"
          onClick={handleAddRow}
          disabled={allRangeDatesPresent}
          tooltip={
            allRangeDatesPresent
              ? "All dates in the claim period already have a row"
              : "Add Row"
          }
          rounded={"true"}
          size="small"
          style={{ width: "1rem", height: "2.1rem" }}
        />
      </div>
    </>
  );
};

export default TourClaimTable;