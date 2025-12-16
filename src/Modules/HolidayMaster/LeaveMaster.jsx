import React, { useState, useEffect, useRef } from "react";
import { InputNumber } from "primereact/inputnumber"; // ✅ Import this to fix the error
import "../Appraisal/Appraisal.scss";
 
import { Button } from "primereact/button";

import {
  CustomColumn,
  DataTableComponent,
} from "../../components/DataTable/DataTableComponent";
import {
  insertLeaveMaster,
  getLeaveMaster,
} from "../../Modules/HolidayMaster/HolidayAPI";
import CustomToast from "../../components/Toast/Toast";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
const LeaveMaster = () => {
  const cellStyle = {
    padding: "4px 6px", // smaller padding
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  };
  const toast = useRef(null);

  const [editingRowId, setEditingRowId] = useState(null);
  const [tableData, setTableData] = useState([]);

  // ✅ Handles value change for editable cells
  const handleInputChange = (id, field, value) => {
    const updatedData = tableData.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  // Renders an InputNumber cell when editing
  const renderCell = (rowData, field) => {
    return (
      <InputNumber
        inputId={`${field}-${rowData.id}`}
        value={rowData[field]}
        onValueChange={(e) => handleInputChange(rowData.id, field, e.value)}
        useGrouping={false}
        min={0}
        className="w-full p-inputtext-sm inputFieldStyle NumberFieldStyle"
        style={{
          width: "70px", 
          padding: "2px 4px", 
          fontSize: "12px",
          boxSizing: "border-box",
        }}
        inputStyle={{
          width: "100%", // ensures child input matches width
          fontSize: "12px",
          padding: "2px 4px",
        }}
      />
    );
  };

  // Add new editable row
  const handleAddRowClick = () => {
    const newId = tableData.length + 1;
    const newRow = {
      id: newId,
      year: new Date().getFullYear(),
      casualLeave: 0,
      privilegeLeave: 0,
      medicalLeave: 0,
      workFromHome: 0,
      paternityLeave: 0,
      maternityLeave: 0
      // prvPLYearLimit:0,
      // prevPLLimit:0
    };
    setTableData([...tableData, newRow]);
    setEditingRowId(newId);
  };

  //  Save button click (optional behavior)
  const handleSaveRow = async (rowData) => {
    try {
      let responseInsert = await insertLeaveMaster(rowData);
      if (responseInsert.status) {
        showSuccessMessage(toast, "Success", responseInsert?.message);
        // let masterData= await getLeaveMaster()
        // setTableData(masterData.data)
        fetchData();
        setEditingRowId(null);
      } else {
        showErrorMessage(toast, "Error", responseInsert?.message);
      }
    } catch (error) {
      showErrorMessage(toast, "error", error?.message);
    }
    // console.log("Saved row:", tableData.find((row) => row.id === id));
  };

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    let response = await getLeaveMaster();
    console.log(response);
    setTableData(response.data);
  };

  return (
    <div>
      {/* Add Row Button */}
      <CustomToast ref={toast} />
      <div className="flex justify-end mb-3">
       
        <Button
          icon="pi pi-plus"
          severity="success"
          onClick={handleAddRowClick}
          label="Add Row"
          style={{
            padding: "4px 8px",     
            fontSize: "12px",      
            height: "28px",        
          }}
          disabled={editingRowId!==null}
        />
      </div>

      {/* Data Table */}
      <div className="mt-2">
        <DataTableComponent
          data={tableData}
          rows={10}
          tableStyle={{
            minWidth: "100%",
            fontSize: "0.8rem",
            tableLayout: "fixed",
            overflowX: "hidden",
          }}
          style={{ width: "100%" }}
        >
          <CustomColumn
            field="year"
            header="Year"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "year")
                : rowData.year
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
          <CustomColumn
            field="casualLeave"
            header="Casual Leave"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "casualLeave")
                : rowData.casualLeave
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
          <CustomColumn
            field="paidLeave"
            header="Paid Leave"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "paidLeave")
                : rowData.paidLeave
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
          <CustomColumn
            field="medicalLeave"
            header="Medical Leave"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "medicalLeave")
                : rowData.medicalLeave
            }
          />
          <CustomColumn
            field="workFromHome"
            header="Work From Home"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "workFromHome")
                : rowData.workFromHome
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
          <CustomColumn
            field="paternityLeave"
            header="Paternity Leave"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "paternityLeave")
                : rowData.paternityLeave
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
          <CustomColumn
            field="maternityLeave"
            header="Maternity Leave"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "maternityLeave")
                : rowData.maternityLeave
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
          {/* <CustomColumn
            field="prevPLLimit"
            header="Prev PL Limit"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "prevPLLimit")
                : rowData.paternityLeave
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
           <CustomColumn
            field="prvPLYearLimit"
            header="Prev PL Year Limit"
            body={(rowData) =>
              rowData.id === editingRowId
                ? renderCell(rowData, "prvPLYearLimit")
                : rowData.paternityLeave
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          /> */}
          <CustomColumn
            header="Action"
            body={(rowData) =>
              rowData.id === editingRowId ? (
                <div className="flex gap-x-1">
                  <Button
                    icon="pi pi-check" rounded text aria-label="Filter" 
                    onClick={() => handleSaveRow(rowData)}
                  />
                  <Button
                    icon="pi pi-times" rounded text severity="danger" aria-label="Cancel"
                    onClick={() => {
                      setTableData((prev) =>
                        prev.filter((row) => row.id !== editingRowId)
                      );
                      setEditingRowId(null);
                    }}
                  />
                </div>
              ) : (
                <span>Saved</span>
              )
            }
            headerStyle={{ ...cellStyle }}
            bodyStyle={{ ...cellStyle }}
          />
        </DataTableComponent>
      </div>
    </div>
  );
};

export default LeaveMaster;
