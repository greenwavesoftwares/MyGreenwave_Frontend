import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import React, { useEffect, useState } from "react";
import { Chip, Button as MuiButton } from "@mui/material";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { formatDate } from "../formatDate";

const FutureComptency = ({
  appraiserPreviousSaveFormDat,
  FutureComptencyData,
  trainingData,
  isReviewer,
  isApprover,
  trackFutureComptency,
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //Set Training Data
  const [training, setTraining] = useState([]);
   //Store Temp Data
    const [originalRowData, setOriginalRowData] = useState(null);
  

  //Set Dropdown Data
  const relevanceData = ["High", "Medium", "Low"];

  //selectedRowData send to parent component
  useEffect(() => {
    FutureComptencyData(selectedRowData);
  }, [selectedRowData]);

  //set Training Data
  useEffect(() => {
    setTraining(trainingData);
  }, [trainingData]);

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
    setOriginalRowData({ ...rowData });
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
    trackFutureComptency(true);
  };

  //const getDate=new Date();
  console.log("currentDate",formatDate(new Date().toISOString()));

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        header="Future Competency"
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        {/* <Column
          field="goals"
          header="Competency Goals"
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
        ></Column> */}
        <Column
          header="Competency Goals"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={training}
                className="dropDownStyle"
                value={rowData.goals}
                onChange={(e) => handleInputChange(e.value, "goals", rowIndex)}
                placeholder="Select Training"
              />
            ) : (
             rowData?.goals
            )
          }
        />
        <Column
          field="relevance"
          header="Relevance(H/M/L)"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={relevanceData}
                className="dropDownStyle"
                value={rowData.relevance}
                onChange={(e) =>
                  handleInputChange(e.value, "relevance", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              <Chip
                size="small"
                label={rowData.relevance ?? "NA"}
                //variant="outlined"
                color={
                  rowData.relevance === "H" || rowData.relevance === "High"
                    ? "error"
                    : rowData.relevance === "M" ||
                        rowData.relevance === "Medium"
                      ? "warning"
                      : "primary"
                }
              />
            )
          }
        ></Column>
        <Column
          field="target_date"
          header="Target Date"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Calendar
                dateFormat="yy-mm-dd"
                className="calendarStyle"
                style={{ width: "10rem" }}
                value={
                  rowData.target_date ? new Date(rowData.target_date) : null
                }
                onChange={(e) =>
                  handleInputChange(
                    formatDate(e.value),
                    "target_date",
                    rowIndex
                  )
                }
                placeholder="Select Date"
                showIcon
              />
            ) : (
              (formatDate(rowData.target_date) ?? "")
            )
          }
        />

        <Column
          field="reviewers_comment"
          header="Reviewer's Comment"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.reviewers_comment}
                className="inputFieldStyle inputSectionWidth"
                disabled={isReviewer}
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
                className="inputFieldStyle inputSectionWidth"
                disabled={isApprover}
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
              <div style={{ display: "flex" }}>
                <Button
                  icon="pi pi-check"
                  size="small"
                  text
                  onClick={handleSaveRow}
                />
                <Button
                  icon="pi pi-times"
                  size="small"
                  text
                  style={{ color: "red" }}
                  type="button"
                   onClick={() => {
                    if (originalRowData && editingRowIndex !== null) {
                      const updatedData = [...selectedRowData];
                      updatedData[editingRowIndex] = originalRowData; // restore original
                      setSelectedRowData(updatedData);
                    }
                    setEditingRowIndex(null);
                    setOriginalRowData(null);
                  }}
                />
              </div>
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
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteRow(rowData);
                  trackFutureComptency(true);
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
              target_date: formatDate(new Date().toISOString()),
              //training: "",
              reviewers_comment: "",
              appraisers_comments: "",
            };
            setSelectedRowData([...selectedRowData, blankRow]);
            trackFutureComptency(true);
          }}
        >
          Add New Row
        </MuiButton>
      </div>
    </>
  );
};

export default FutureComptency;
