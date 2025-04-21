import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import React, { useEffect, useState } from "react";
import { Button as MuiButton } from "@mui/material";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { formatDate } from "../formatDate";

const FutureComptency = ({
  appraiserPreviousSaveFormDat,
  FutureComptencyData,
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  //Set Dropdown Data
  const relevanceData = ["High", "Medium", "Low"];

  //selectedRowData send to parent component
  useEffect(() => {
    FutureComptencyData(selectedRowData);
  }, [selectedRowData]);

  //set Api Data : Future Comptency already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_FutureComptencyCardData", selectedRowData);

  //Delete Row
  const handleDeleteRow = (ele) => {
    const updateData = selectedRowData.filter((item) => item !== ele);
    setSelectedRowData(updateData);
  };

  //Edit Row
  const handleEditRow = (rowData, rowIndex) => {
    console.log("editRowData", rowData, rowIndex);
    setEditingRowIndex(rowIndex);
  };
  //Update
  const handleInputChange = (value, field, index) => {
    const updatedRows = [...selectedRowData];
    updatedRows[index][field] = value;
    setSelectedRowData(updatedRows);
  };
  //Save Row
  const handleSaveRow = () => {
    setEditingRowIndex(null);
  };

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          field="goals"
          header="My Competency Goals (To be aligend to professional and Personal Goals)"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.goals}
                onChange={(e) =>
                  handleInputChange(e.target.value, "goals", rowIndex)
                }
              />
            ) : (
              rowData.goals
            )
          }
        ></Column>
        <Column
          field="relevance"
          header="Relevance(H/M/L)"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={relevanceData}
                value={rowData.relevance}
                onChange={(e) =>
                  handleInputChange(e.value, "relevance", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              rowData.relevance ?? ""
            )
          }
        ></Column>
        <Column
          field="target_date"
          header="Target Date (yyyy-mm-dd)"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Calendar
                dateFormat="yy-mm-dd"
                value={
                  rowData.target_date ? new Date(rowData.target_date) : null
                }
                onChange={(e) =>
                  handleInputChange(formatDate(e.value), "target_date", rowIndex)
                }
                placeholder="Select Date"
                showIcon
              />
            ) : (formatDate(rowData.target_date) ?? "") 
          }
        />

        <Column
          field="reviewers_comment"
          header="Reviewer's Comment"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.reviewers_comment}
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "reviewers_comment",
                    rowIndex
                  )
                }
              />
            ) : (
              rowData.reviewers_comment
            )
          }
        ></Column>
        <Column
          field="appraisers_comments"
          header="Appraiser's Comments"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.appraisers_comments}
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "appraisers_comments",
                    rowIndex
                  )
                }
              />
            ) : (
              rowData.appraisers_comments
            )
          }
        ></Column>
        <Column
          header="Edit"
          body={(rowData, { rowIndex }) => {
            return editingRowIndex === rowIndex ? (
              <Button
                icon="pi pi-check"
                size="small"
                text
                onClick={handleSaveRow}
              />
            ) : (
              <Button
                icon="pi pi-pencil"
                size="small"
                type="button"
                text
                onClick={(e) => {
                  e.preventDefault();
                  handleEditRow(rowData, rowIndex);
                }}
              />
            );
          }}
        />
        <Column
          header="Delete"
          body={(rowData) => {
            return (
              <Button
                severity="danger"
                size="small"
                icon="pi pi-trash"
                rounded
                text
                onClick={() => {
                  handleDeleteRow(rowData);
                }}
              />
            );
          }}
        />
      </DataTable>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0.5rem 0.2rem 0.35rem 0",
        }}
      >
        <MuiButton
          size="small"
          variant="contained"
          color="success"
          sx={{ boxShadow: "none" }}
          onClick={() => {
            const blankRow = {
              goals: "",
              relevance: null,
              target_date: null,
              reviewers_comment: "",
              appraisers_comments: "",
            };
            setSelectedRowData([...selectedRowData, blankRow]);
          }}
        >
          Add New Row
        </MuiButton>
      </div>
    </>
  );
};

export default FutureComptency;
