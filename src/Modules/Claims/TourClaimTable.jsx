import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import * as XLSX from "xlsx";
import {
  formateDate,
  savetodraft,
  updateDraftdata,
  downloadTourClaimExpanseDocument,
} from "./claimServices";

const cellStyle = { padding: "8px 12px" };

const initialFormState = {
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
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const toast = useRef(null);

  const calculateTotal = (entry) => {
    const keys = Object.keys(initialFormState).filter(
      (k) => k !== "Date" && k !== "Remarks"
    );
    return keys.reduce((sum, key) => sum + (parseFloat(entry[key]) || 0), 0);
  };

  const hasDuplicateDatesOrZeroTotal = (data) => {
    const seen = new Set();
    for (let row of data) {
      const date = row["Date"];
     // const total = parseFloat(row["Total"]) || 0;
      if (!date) 
        return { hasIssue: true, reason: "Date cann't be null" };
      if (seen.has(date))
        return { hasIssue: true, reason: "Duplicate date found" };
      seen.add(date);
      // if (total === 0)
      //   return { hasIssue: true, reason: "Total amount is zero" };
    }
    return { hasIssue: false };
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

  const handleDelete = (index) => {
    const updated = tourClaimTableData.filter((_, i) => i !== index);
    settourClaimTableData(updated);
    setEditingIndex(null);
  };

  const handleAddRow = () => {
    settourClaimTableData([
      ...tourClaimTableData,
      { ...initialFormState, Total: 0 },
    ]);
    setEditingIndex(tourClaimTableData.length);
  };

  const onFileSelect = (event) => {
    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const bstr = e.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const headerRowIndex = 15;
      const headers = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        header: 1,
      })[0];

      settourclaimFormLabeData({
        destination: worksheet["C12"]?.v || "",
        purposeOfTrip: worksheet["C13"]?.v || "",
        projectName: worksheet["J9"]?.v || "",
        onAccount: worksheet["J10"]?.v || "",
        fromDate: formateDate(worksheet["J11"]?.v),
        toDate: formateDate(worksheet["J12"]?.v),
      });

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: 15,
        header: headers,
        defval: "",
      });

      const validatedData = [];
      const existingDates = new Set(tourClaimTableData.map((r) => r["Date"]));
      let skippedRows = 0;

      jsonData.forEach((row) => {
        const formattedRow = { ...initialFormState };
        let isValid = true;

        for (const key of Object.keys(initialFormState)) {
          const value = row[key];
          if (key === "Date") {
            const parsedDate = formateDate(value);
            if (!parsedDate || existingDates.has(parsedDate)) {
              isValid = false;
              break;
            }
            formattedRow[key] = parsedDate;
            existingDates.add(parsedDate);
          } else {
            const num = parseFloat(value);
            formattedRow[key] = !isNaN(num) ? num : 0;
          }
        }

        if (isValid) {
          formattedRow["Total"] = calculateTotal(formattedRow);
          validatedData.push(formattedRow);
        } else {
          skippedRows++;
        }
      });

      settourClaimTableData((prev) => [...prev, ...validatedData]);

      toast.current?.show({
        severity: "info",
        summary: "Import Result",
        detail: `${validatedData.length} row(s) imported.`,
      });
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveToDraft = async () => {
    try {
      const response = await savetodraft(tourclaimformData, tourClaimTableData);
      //   if (response?.success) {
      if(!response.status)
      {
         toast.current.show({
            severity: "error",
            summary: "error",
            detail: response.message,
          });
      }else{
         toast.current.show({
            severity: "success",
            summary: "success",
            detail: response.message,
          });
      setDraftData(response.data);
      seteditableMode(false);
      settoggleNewClaim(false);
     
    }
     
     
    } catch (error) {
      toast.current.show({ severity: "error", summary: "error", detail: error?.message });
      console.log(error);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await updateDraftdata(
        tourclaimformData,
        tourClaimTableData,
        tourclaimformData.claim_id
      );
      if(!response.status)
      {
         toast.current.show({
            severity: "error",
            summary: "error",
            detail: response.message,
          });
      }else
      {
        toast.current.show({
            severity: "success",
            summary: "Success",
            detail: response.message,
          });
      setDraftData(response.data);
      seteditableMode(false);
       
      }
    } catch (error) {
      toast.current.show({ severity: "error", summary: "", detail: error });
      console.log(error);
    }
  };
  const renderCell = (rowData, field, rowIndex) => {
    if (editingIndex === rowIndex) {
      if (field === "Date") {
        return (
          <Calendar
            value={rowData["Date"] ? new Date(rowData["Date"]) : null}
            onChange={(e) => handleDateChange(e, rowIndex)}
            dateFormat="dd-mm-yy"
            showIcon
            className="p-inputtext-sm w-full"
              minDate={
    tourclaimformData.claimFromDate
      ? new Date(tourclaimformData.claimFromDate)
      : null
  }
  maxDate={
    tourclaimformData.claimToDate
      ? new Date(tourclaimformData.claimToDate)
      : null
  }
          />
        );
      } else if (field == "Remarks") {
        return (
          <InputText
            name={field}
            value={rowData[field] || ""}
            onChange={(e) => handleChange(e, rowIndex)}
            className="p-inputtext-sm w-full"
          />
        );
      } else if (field == "Total") {
        return (
          <InputText
            name={field}
            value={rowData[field] || ""}
            onChange={(e) => handleChange(e, rowIndex)}
            className="p-inputtext-sm w-full"
            disabled
          />
        );
      }

      return (
        <InputText
          name={field}
          value={rowData[field] || ""}
          onChange={(e) => handleChange(e, rowIndex)}
          onKeyPress={(e) => {
            const key = e.key;
            const currentValue = rowData[field] || "";

            // Allow digits and a single dot
            if (!/[\d.]/.test(key)) {
              e.preventDefault();
            }

            // Prevent more than one dot
            if (key === "." && currentValue.includes(".")) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const paste = e.clipboardData.getData("text");
            // Allow only valid float numbers
            if (!/^\d*\.?\d*$/.test(paste)) {
              e.preventDefault();
            }
          }}
          className="p-inputtext-sm w-full"
        />
      );
    }
    return <span>{rowData[field]}</span>;
  };

  const actionBodyTemplate = (row, { rowIndex }) => (
    <div className="flex gap-2">
      {editingIndex === rowIndex ? (
        <Button
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
        <Button
          icon="pi pi-pencil"
          className="p-button-sm p-button-text p-button-info"
          onClick={() => openEditMode(rowIndex)}
        />
      )}
      <Button
        icon="pi pi-trash"
        className="p-button-sm p-button-text p-button-danger"
        onClick={() => handleDelete(rowIndex)}
      />
    </div>
  );

  const fields = Object.keys(initialFormState);
  const handleDownloadFile = async () => {
    try {
      let d = await downloadTourClaimExpanseDocument(
       
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="flex justify-end mb-2 gap-2">
        <FileUpload
          mode="basic"
          name="file"
          accept=".xls,.xlsx"
          customUpload
          uploadHandler={onFileSelect}
          maxFileSize={1000000}
          chooseLabel="Upload"
        />
        <Button
          // label="Add Row"
          icon="pi pi-plus"
          className="p-button-sm "
          onClick={handleAddRow}
          tooltip="Add Row"
        />
        <Button
          icon="pi pi-file-export"
          className="p-button-sm"
          onClick={() => {
            handleDownloadFile();
          }}
          tooltip="Export Excel"
        />
      </div>

      <DataTable
        value={tourClaimTableData}
          showGridlines
        scrollable
        scrollHeight="250px"
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        {fields.map((field) => (
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
        ))}
        <Column
          header="Action"
          body={actionBodyTemplate}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTable>

      <div className="flex justify-center mt-4">
        {editableMode ? (
          <div className="flex gap-2">
            <Button
              label="Update"
              icon="pi pi-save"
              className="p-button-sm"
              onClick={() => {
                const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
                if (result.hasIssue) {
                  toast.current?.show({
                    severity: "warn",
                    summary: "Validation Warning",
                    detail: result.reason,
                  });
                } else {
                  handleUpdate();
                  toast.current.show({
                    severity: "success",
                    summary: "Updated",
                    detail: "Tour claim updated!",
                  });
                }
              }}
            />
            <Button
              label="Home"
              icon="pi pi-home"
              onClick={() => {
                seteditableMode(false);
              }}
              className="p-button-sm"
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              label="Save to Draft"
              icon="pi pi-save"
              className="p-button-sm"
              onClick={() => {
                const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
                if (result.hasIssue) {
                  toast.current?.show({
                    severity: "warn",
                    summary: "Validation Warning",
                    detail: result.reason,
                  });
                  return;
                }
                handleSaveToDraft();
              }}
            />

            <Button
              label="Home"
              icon="pi pi-home"
              onClick={() => {
                seteditableMode(false);
                settoggleNewClaim(false);
              }}
              className="p-button-sm"
              disabled={toggleNewClaim===true}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default TourClaimTable;
