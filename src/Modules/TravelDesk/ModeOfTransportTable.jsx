import { useState, useRef } from "react";

import { Dropdown } from "primereact/dropdown";
//import { CustomDropDown } from "../../components/DropdownCheckbox/Dropdown";

import { showWarningMessage } from "../../components/Toast/ShowMessage";
import CustomToast from "../../components/Toast/Toast";
import CustomButton from "../../components/Button/Button";
import CustomInputText from "../../components/InputText/InputText";
import { CustomeCalender } from "../../components/Calender/CustomeCalender";
import TrainIcon from "@mui/icons-material/Train";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import {
  CustomeEditableDataTable,
  CustomEditableColumn,
} from "../../components/DataTable/DataTableComponent";
import { formateDate } from "../Claims/claimServices";

const ModeOfTransportTable = ({
  transportModes,
  setTransportModes,
  formFields,
  formErrors,
}) => {
  const toastRef = useRef(null);
  const dt = useRef(null);

  //const [transportModes, setTransportModes] = useState([]);
  const [editingRows, setEditingRows] = useState({});
  const modeOptions = [
    { label: "Train", value: "Train" },
    { label: "Flight", value: "Flight" },
    { label: "Rental Car", value: "Rental Car" },
    { label: "Others", value: "Others" },
  ];

  const addRow = () => {
    // Check if upper form has errors
    const requiredFields = [
      "purpose",
      "projectName",
      "city",
      "localityArea",
      "typeOfTravel",
      "fromDate",
      "tentativeToDate",
    ];
    const upperFormIncomplete = requiredFields.some(
      (field) => formErrors[field]
    );

    if (upperFormIncomplete) {
      showWarningMessage(
        toastRef,
        "Please complete requisition form before adding accommodation."
      );
      return;
    }

    if (
      !formFields.fromDate ||
      !formFields.tentativeToDate ||
      !formFields.purpose ||
      !formFields.projectName ||
      !formFields.city ||
      !formFields.localityArea ||
      !formFields.typeOfTravel
    ) {
      showWarningMessage(
        toastRef,
        "Please complete requisition form before adding accommodation."
      );
      return;
    }
    const isIncomplete = transportModes.some(
      (row) => !row.mode || !row.fromDate
    );

    if (isIncomplete) {
      showWarningMessage(toastRef, "Please complete all required fields.");
      return;
    }

    const newRow = {
      id: Date.now(),
      mode: "",
      fromDate: null,
      comment: "",
    };

    setTransportModes([...transportModes, newRow]);
    setEditingRows((prev) => ({ ...prev, [newRow.id]: true }));
  };

  const onRowEditComplete = (e) => {
    const { newData, index } = e;
    if (!newData.mode || !newData.fromDate) {
      showWarningMessage(toastRef, "Mode and From Date are required.");
      return;
    }
    const updated = [...transportModes];
    updated[index] = newData;
    setTransportModes(updated);
  };

  const deleteRow = (rowData) => {
    setTransportModes(transportModes.filter((item) => item.id !== rowData.id));
  };

  const exportCSV = () => dt.current.exportCSV();

  const modeEditor = (options) => (
    <Dropdown
      value={options.value}
      options={modeOptions}
      onChange={(e) => options.editorCallback(e.value)}
      placeholder="Select Mode"
      className="w-full dropDownStyle"
      panelClassName="text-xs "
    />
  );

  const dateEditor = (options) => (
    <CustomeCalender
      value={(options.value ? new Date(options.value) : '')}
      onChange={(e) => options.editorCallback(formateDate(e.value))}
      className="text-xs  w-full calendarStyle"
      dateFormat="yy-mm-dd"
      minDate={new Date(formFields.fromDate)}
      maxDate={new Date(formFields.tentativeToDate)}
    />
  );

  const textEditor = (options) => (
    <CustomInputText
      value={options.value}
      onChange={(e) => options.editorCallback(e.target.value)}
      className="text-xs  w-full inputFieldStyle"
    />
  );

  const actionTemplate = (rowData) => (
    <CustomButton
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger p-button-sm selectButtonStyle"
      onClick={() => deleteRow(rowData)}
      style={{ fontSize: '0.7rem', padding: '0.3rem',width:"2rem",height:"2rem" }}
    />
  );

  const header = (
    <div className="flex justify-between items-center w-full">
      {/* Left: Title */}
      <div className="flex items-center">
        <div
          className="p-2 rounded-lg blue-icon"
          style={{ background: "none" }}
        >
          <TrainIcon />
        </div>
        <h5 className="text-gray-500 font-semibold">Transportation Request</h5>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center gap-x-2">
        <CustomButton
          label="Add"
          icon="pi pi-plus"
          onClick={addRow}
          size={"small"}
          className="p-button-sm"
          rounded={true}
          style={{ padding: "0.3rem 0.85rem" }}
        />
        <CustomButton
          type="button"
          icon="pi pi-file"
          rounded
          onClick={exportCSV}
          severity={"success"}
          tooltip="Export CSV"
          className="p-button-sm"
          style={{ padding: "0.25rem 0.7rem", width: "2rem", height: "2rem" }}
        />
      </div>
    </div>
  );

  return (
    <div className="mb-3">
      <CustomToast ref={toastRef} />
      <CustomeEditableDataTable
        ref={dt}
        value={transportModes}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        editingRows={editingRows}
        onRowEditChange={(e) => setEditingRows(e.data)}
        header={header}
        textSize="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.9rem" }}
        emptyMessage="No transport data added."
        showGridlines
        className={
          "dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder"
        }
      >
        <CustomEditableColumn
          field="mode"
          header="Transport Mode"
          editor={modeEditor}
        />
        <CustomEditableColumn
          field="fromDate"
          header="Travel Date"
          editor={dateEditor}
         // body={(row) => (row.fromDate ? formateDate(row.fromDate) : "")}
        />
        <CustomEditableColumn
          field="comment"
          header="Comment"
          editor={textEditor}
        />
        <CustomEditableColumn rowEditor={true} headerStyle={{ width: "10%" }} />
        <CustomEditableColumn body={actionTemplate} header="Actions" />
      </CustomeEditableDataTable>
    </div>
  );
};

export default ModeOfTransportTable;
