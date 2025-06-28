import { useState, useRef } from "react";


import { Dropdown } from "primereact/dropdown";
//import { CustomDropDown } from "../../components/DropdownCheckbox/Dropdown";

import { showWarningMessage } from "../../components/Toast/ShowMessage";
import CustomToast from "../../components/Toast/Toast";
import CustomButton from "../../components/Button/Button";
import CustomInputText from "../../components/InputText/InputText";
import {CustomeCalender} from "../../components/Calender/CustomeCalender"

import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import {CustomeEditableDataTable,CustomEditableColumn} from "../../components/DataTable/DataTableComponent"

const ModeOfTransportTable = ({transportModes, setTransportModes,formFields,formErrors}) => {
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
      const requiredFields = ["purpose", "projectName", "city", "localityArea", "typeOfTravel", "fromDate", "tentativeToDate"];
      const upperFormIncomplete = requiredFields.some((field) => formErrors[field]);
    
      if (upperFormIncomplete) {
        showWarningMessage(toastRef,"Please complete requisition form before adding accommodation.");
        return;
      }
    
    
      if(!formFields.fromDate || !formFields.tentativeToDate || !formFields.purpose  || !formFields.projectName
       || !formFields.city || !formFields.localityArea || !formFields.typeOfTravel)
      {
        showWarningMessage(toastRef,"Please complete requisition form before adding accommodation.");
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
      showWarningMessage(toastRef,"Mode and From Date are required.");
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
    className="text-xs p-1 w-full"
    panelClassName="text-xs"
  />
);

const dateEditor = (options) => (
  <CustomeCalender
    value={options.value}
    onChange={(e) => options.editorCallback(e.value)}
   
    className="text-xs p-1 w-full"
   
    minDate={new Date(formFields.fromDate)}
  />
);

const textEditor = (options) => (
  <CustomInputText
    value={options.value}
    onChange={(e) => options.editorCallback(e.target.value)}
    className="text-xs  w-full"
  />
);

const actionTemplate = (rowData) => (
  <CustomButton
    icon="pi pi-trash"
    className="p-button-rounded p-button-danger p-button-sm"
    onClick={() => deleteRow(rowData)}
    //style={{ fontSize: '0.7rem', padding: '0.3rem' }}
  />
);

  const header = (
  <div className="flex justify-between items-center w-full">
    {/* Left: Title */}
    <div>
      <h5 className="text-gray-500 text-lg font-semibold">
        Mode of Transport
      </h5>
    </div>

    {/* Right: Buttons */}
    <div className="flex items-center gap-x-4">
      <CustomButton
        label="Add"
        icon="pi pi-plus"
        onClick={addRow}
        className="p-button-sm"
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
      >
        <CustomEditableColumn field="mode" header="Mode" editor={modeEditor} />
        <CustomEditableColumn
          field="fromDate"
          header="From Date"
          editor={dateEditor}
          body={(row) =>
            row.fromDate ? new Date(row.fromDate).toLocaleDateString() : ""
          }
        />
        <CustomEditableColumn field="comment" header="Comment" editor={textEditor} />
        <CustomEditableColumn rowEditor={true} headerStyle={{ width: "10%" }} />
        <CustomEditableColumn body={actionTemplate} header="Actions" />
      </CustomeEditableDataTable>
    </div>
  );
};

export default ModeOfTransportTable;
