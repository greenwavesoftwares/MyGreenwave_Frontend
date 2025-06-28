import  { useState, useRef } from "react";
//import { DataTable } from "primereact/datatable";
//import { Column } from "primereact/column";
// { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";

//import { Calendar } from "primereact/calendar";
import {CustomeCalender} from "../../components/Calender/CustomeCalender"
//import { InputText } from "primereact/inputtext";
//import { Toast } from "primereact/toast";
import CustomToast from "../../components/Toast/Toast";
import CustomButton from "../../components/Button/Button";
import CustomInputText from "../../components/InputText/InputText";
import { showWarningMessage } from "../../components/Toast/ShowMessage";
import {CustomeEditableDataTable,CustomEditableColumn} from "../../components/DataTable/DataTableComponent"

import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const AccommodationTable = ({ //disableAddRow, 
  accommodations, setAccommodations, formFields,formErrors}) => {
  const dt = useRef(null);
  const toast = useRef(null);

  const [editingRows, setEditingRows] = useState({});

  const typeOptions = [
    { label: "Hotel", value: "Hotel" },
    { label: "Customer Guest House", value: "Customer Guest House" },
    { label: "Service Appartment", value: "Service Appartment" },
    { label: "Long-Term Rent", value: "Long-Term Rent" },
    { label: "Own Arrangement", value: "Own Arrangement" },
    { label: "Others", value: "Others" },
  ];

  const addRow = () => {
    // Check if upper form has errors
  const requiredFields = ["purpose", "projectName", "city", "localityArea", "typeOfTravel", "fromDate", "tentativeToDate"];
  const upperFormIncomplete = requiredFields.some((field) => formErrors[field]);

  if (upperFormIncomplete) {
    showWarningMessage(toast, "Error","Please complete requisition form before adding accommodation.");
    return;
  }


  if(!formFields.fromDate || !formFields.tentativeToDate || !formFields.purpose  || !formFields.projectName
   || !formFields.city || !formFields.localityArea || !formFields.typeOfTravel)
  {
    showWarningMessage(toast, "Error","Please complete requisition form before adding accommodation.");
    return;
  }
    const incomplete = accommodations.some(
      (row) => !row.type || !row.numberOfRooms || !row.checkIn || !row.checkOut
    );
    if (incomplete ) {
      showWarningMessage(toast, "Please complete required fields before adding.");
      return;
    }

    const newRow = {
      id: Date.now(),
      type: "",
      numberOfRooms: "",
      checkIn: null,
      checkOut: null,
      numberOfNights: "",
      comment: "",
    };
    setAccommodations([...accommodations, newRow]);
    setEditingRows((prev) => ({ ...prev, [newRow.id]: true }));
  };

  const deleteRow = (rowData) => {
    setAccommodations(accommodations.filter((r) => r.id !== rowData.id));
  };

 const onRowEditComplete = (e) => {
  const { newData, index } = e;

  // Validation: required fields
  if (!newData.type || !newData.numberOfRooms || !newData.checkIn || !newData.checkOut) {
    showWarningMessage(toast, "All fields except Comment are required.");

    // 👇 Keep the row editable
    setEditingRows((prev) => ({ ...prev, [newData.id]: true }));
    return;
  }

  const checkInDate = new Date(newData.checkIn);
  const checkOutDate = new Date(newData.checkOut);

  // Validation: Check-out before Check-in
  if (checkOutDate < checkInDate) {
    showWarningMessage(toast, "Check-out date cannot be before check-in date.");
    setEditingRows((prev) => ({ ...prev, [newData.id]: true }));
    return;
  }

  // Validation: Overlapping dates
  const isOverlap = accommodations.some((row, i) => {
    if (i === index || !row.checkIn || !row.checkOut) return false;

    const rowCheckIn = new Date(row.checkIn);
    const rowCheckOut = new Date(row.checkOut);

    return (
      checkInDate < rowCheckOut &&
      checkOutDate >rowCheckIn
    );
  });

  if (isOverlap) {
    showWarningMessage(toast, "This date range overlaps with another accommodation.");
    setEditingRows((prev) => ({ ...prev, [newData.id]: true }));
    return;
  }

  // ✅ Passed validation
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  newData.numberOfNights = nights;

  const updated = [...accommodations];
  updated[index] = newData;

  setAccommodations(updated);

  // ✅ Exit edit mode
  const updatedEditingRows = { ...editingRows };
  delete updatedEditingRows[newData.id];
  setEditingRows(updatedEditingRows);
};



  const exportCSV = () => dt.current.exportCSV();
const typeEditor = (options) => (
  <Dropdown
    value={options.value}
    options={typeOptions}
    onChange={(e) => options.editorCallback(e.value)}
    placeholder="Select Type"
    className="text-xs p-1 w-full"
    panelClassName="text-xs"
  />
);

const isDateOverlapping = (currentRowId, date, field) => {
  const targetDate = new Date(date).setHours(0, 0, 0, 0);

  return accommodations.some((row) => {
    if (!row.checkIn || !row.checkOut || row.id === currentRowId) return false;

    const rowStart = new Date(row.checkIn).setHours(0, 0, 0, 0);
    const rowEnd = new Date(row.checkOut).setHours(0, 0, 0, 0);

    // Block if this date overlaps any existing date range
    if (field === "checkIn") {
      return targetDate >= rowStart && targetDate <= rowEnd;
    }
    if (field === "checkOut") {
      return targetDate >= rowStart && targetDate <= rowEnd;
    }
    return false;
  });
};


const calendarEditor = (options, field) => {
  const rowId = options.rowData?.id;

  return (
    <CustomeCalender
      value={options.value}
      onChange={(e) => options.editorCallback(e.value)}
      showIcon
      dateFormat="dd-mm-yy"
      className="text-xs p-1 w-full"
      panelClassName="text-xs"
      inputClassName="text-xs"
      minDate={new Date(formFields.fromDate)}
      //disabledDate={(date) => isDateOverlapping(rowId, date, field)}
    />
  );
};


const inputNumberEditor = (options) => (
  <CustomInputText
    type="number"
    value={options.value}
    onChange={(e) => options.editorCallback(e.target.value)}
    placeholder="Enter number"
    className="text-xs  w-full"
    style={{ fontSize: '0.9rem' }}
  />
);

const textEditor = (options) => (
  <CustomInputText
    value={options.value}
    onChange={(e) => options.editorCallback(e.target.value)}
    placeholder="Enter comment"
    className="text-xs  w-full"
    style={{ fontSize: '0.9rem' }}
  />
);


  const actionTemplate = (rowData) => (
    <CustomButton
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger"
      onClick={() => deleteRow(rowData)}
    />
  );

 const header = (
  <div className="flex justify-between items-center w-full">
    {/* Left Side: Heading */}
    <div className="flex items-center">
      <h5 className="text-gray-500 text-lg font-semibold">
        Reservation of Accommodation
      </h5>
    </div>

    {/* Right Side: Buttons */}
    <div className="flex items-center gap-x-4">
      <CustomButton
        label="Add"
        icon="pi pi-plus"
        onClick={addRow}
        className="p-button-sm"
       // disabled={disableAddRow}
      />
      <CustomButton
        type="button"
        icon="pi pi-file"
        rounded
        onClick={exportCSV}
        tooltip="Export CSV"
        className="p-button-sm"
      />
    </div>
  </div>
);

  return (
    <div className="p-4">
      <CustomToast ref={toast} />
      <CustomeEditableDataTable
        ref={dt}
        value={accommodations}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        editingRows={editingRows}
        onRowEditChange={(e) => setEditingRows(e.data)}
        header={header}
       // tableStyle={{ minWidth: "80rem" }}
         textSize="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.9rem" }}
        emptyMessage="No accommodation data added."
        showGridlines
      >
        <CustomEditableColumn field="type" header="Type" editor={typeEditor} />
        <CustomEditableColumn
          field="numberOfRooms"
          header="No. of Rooms"
          editor={inputNumberEditor}
        />
      <CustomEditableColumn
        field="checkIn"
        header="Check-In Date"
        editor={(options) => calendarEditor(options, "checkIn")}
        body={(row) => row.checkIn ? new Date(row.checkIn).toLocaleDateString() : ""}
      />
        <CustomEditableColumn
          field="checkOut"
          header="Check-Out Date"
          editor={(options) => calendarEditor(options, "checkOut")}
          body={(row) => row.checkOut ? new Date(row.checkOut).toLocaleDateString() : ""}
        />
        <CustomEditableColumn
          field="numberOfNights"
          header="No. of Nights"
          body={(row) => row.numberOfNights}
        />
        <CustomEditableColumn
          field="comment"
          header="Comment"
          editor={textEditor}
        />
        <CustomEditableColumn
          rowEditor={true}
          headerStyle={{ width: "10%" }}
          bodyStyle={{ textAlign: "center" }}
        />
        <CustomEditableColumn
          header="Actions"
          body={actionTemplate}
          headerStyle={{ width: "10%" }}
        />
      </CustomeEditableDataTable>
    </div>
  );
};

export default AccommodationTable;
