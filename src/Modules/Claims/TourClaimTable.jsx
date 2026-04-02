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

      const headerRowIndex = 15;
      //const headerRowIndex = 0;
      const headers = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        header: 1,
      })[0];

      // settourclaimFormLabeData({
      //   destination: worksheet["C12"]?.v || "",
      //   purposeOfTrip: worksheet["C13"]?.v || "",
      //   projectName: worksheet["J9"]?.v || "",
      //   onAccount: worksheet["J10"]?.v || "",
      //   fromDate: formateDate(worksheet["J11"]?.v),
      //   toDate: formateDate(worksheet["J12"]?.v),
      // });

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: 15,
        // range: 0,
        header: headers,
        defval: "",
      });
      console.log(" Raw Excel JSON:", jsonData);

      const validatedData = [];
      const existingDates = new Set(tourClaimTableData.map((r) => r["Date"]));
      let skippedRows = 0;

      jsonData.forEach((row) => {
        const formattedRow = { ...initialFormState };
        let isValid = true;
        console.log("➡ Raw Row:", row);

        // for (const key of Object.keys(initialFormState)) {
        //   const value = row[key];
        //   if (key === "Date") {
        //     const parsedDate = formateDate(value);
        //     if (!parsedDate || existingDates.has(parsedDate)) {
        //       isValid = false;
        //       break;
        //     }
        //     formattedRow[key] = parsedDate;
        //     existingDates.add(parsedDate);
        //   } else {
        //     const num = parseFloat(value);
        //     formattedRow[key] = !isNaN(num) ? num : 0;
        //   }
        // }
        for (const key of Object.keys(initialFormState)) {
          let excelKey = key;

          // Fix mismatch header coming from Excel
          if (key === "Airfare, Bus, Train, Taxi Rental") {
            excelKey = "Airfare, Bus, Train,Taxi Rental";
          }

          const value = row[excelKey];

          if (key === "Date") {
            const parsedDate = formateDate(value);
            const dateObj = new Date(parsedDate);
            dateObj.setHours(0, 0, 0, 0);
            const minDate = new Date(tourclaimformData.claimFromDate);
            minDate.setHours(0, 0, 0, 0);
            const maxDate = new Date(tourclaimformData.claimToDate);
            maxDate.setHours(0, 0, 0, 0);
            // const parsedDate = formateDate(value);
            // const dateObj = new Date(parsedDate);
            // const minDate = new Date(tourclaimformData.claimFromDate);
            // const maxDate = new Date(tourclaimformData.claimToDate);

            // console.log(
            //   "dateObj --",
            //   value,
            //   "minDate --",
            //   minDate,
            //   "maxDate--",
            //   maxDate,
            // );

            // Reject if date is missing, invalid, duplicate, or out of range
            if (
              !parsedDate ||
              existingDates.has(parsedDate) ||
              isNaN(dateObj) ||
              dateObj < minDate ||
              dateObj > maxDate
            ) {
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

      //  console.log("validatedData", validatedData);

      settourClaimTableData((prev) => [...prev, ...validatedData]);
      setFileUploaded(true);

      showSuccessMessage(
        toastRef,
        "success",
        `${validatedData.length} row(s) imported.`,
      );
    };

    reader.readAsBinaryString(file);
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
  const dateEditor = (options) => {
    console.log("options", options);
    return (
      <CustomeCalender
        value={options.value}
        onChange={(e) => options.editorCallback(e.value)}
        //className="p-inputtext-sm w-full calendarStyle"
        // style={{ minWidth: "105px" }}
        minDate={new Date(tourclaimformData.claimFromDate)}
        maxDate={new Date(tourclaimformData.claimToDate)}
        // className="text-xs p-1 w-full"

        // minDate={new Date(formFields.fromDate)}
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
              setFileUploaded(true);
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
        {/* <CustomButton
          icon="pi pi-file-export"
          className="p-button-sm"
          onClick={() => {
            handleDownloadFile();
          }}
          tooltip="Export Excel"
          rounded={"true"}
          severity={"success"}
          style={{width:"1rem",height:"2.1rem"}}
        /> */}
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
          tooltip="Add Row"
          rounded={"true"}
          size="small"
          style={{ width: "1rem", height: "2.1rem" }}
        />
      </div>
    </>
  );
};

export default TourClaimTable;
