import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { Chip, Button as MuiButton } from "@mui/material";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { formatDate } from "../formatDate";
import { Calendar } from "primereact/calendar";

const CompetencyScorecard = ({
  appraiserPreviousSaveFormDat,
  CompetencyScorecardData,
  isReviewer,
  isApprover,
  trainingData,
  trackCompetencyScorecard
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //Set Training Data
  const [training, setTraining] = useState([]);

  //selectedRowData send to parent component
  useEffect(() => {
    CompetencyScorecardData(selectedRowData);
  }, [selectedRowData]);

  //set Training Data
  useEffect(() => {
    setTraining(trainingData);
  }, [trainingData]);

  //Set Api Data : Competency Scorecard already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_CompetencyScoreCardData", selectedRowData);

  //Set Level Full Fulfillment Data Dropdown
  const LevelFullfillmentData = [1, 2, 3, 4, 5];
  const relevanceData = ["High", "Medium", "Low"];

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
    trackCompetencyScorecard(true)
  };
  //Check Previous Year Data
  const checkedPreviousYearData = (ele) => {
    if (ele?.previous === true) {
      return true;
    }
    return false;
  };

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        header="Competency Scorecard"
        showGridlines
        value={selectedRowData}
        className="dataTableHeader dataTableBody dataTableBodyPadding"
        rowClassName={(rowData) => {
          if (rowData.some((ele) => ele.previous === true)) {
            return "bgcyan-100";
          }
        }}
      >
        <Column
          field="personal_goals"
          header="Last Year's Training Goals"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={training}
                className="dropDownStyle"
                disabled={checkedPreviousYearData(rowData)}
                value={rowData.personal_goals}
                onChange={(e) =>
                  handleInputChange(e.value, "personal_goals", rowIndex)
                }
                placeholder="Select Training"
              />
            ) : (
              rowData.personal_goals
            )
          }
        ></Column>
        <Column
          field="relevance"
          header="Relevance"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={relevanceData}
                className="dropDownStyle"
                disabled={checkedPreviousYearData(rowData)}
                value={rowData.relevance}
                onChange={(e) =>
                  handleInputChange(e.value, "relevance", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              <Chip
                size="small"
                label={rowData.relevance ?? ""}
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
          field="level_of_fullfillment"
          header="Level of Fulfillment"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={LevelFullfillmentData}
                className="dropDownStyle"
                value={rowData.level_of_fullfillment}
                onChange={(e) =>
                  handleInputChange(e.value, "level_of_fullfillment", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              (rowData.level_of_fullfillment ?? "")
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
                disabled={checkedPreviousYearData(rowData)}
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
                  onClick={(e) => {
                    //e.preventDefault();
                    setEditingRowIndex(null);
                  }}
                  // onClick={handleSaveRow}
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
                disabled={checkedPreviousYearData(rowData)}
                icon="pi pi-trash"
                rounded
                text
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteRow(rowData);
                  trackCompetencyScorecard(true)
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
              personal_goals: "",
              relevance: null,
              level_of_fullfillment: "",
              target_date: "",
              reviewers_comment: "",
              appraisers_comments: "",
            };
            setSelectedRowData([...selectedRowData, blankRow]);
            trackCompetencyScorecard(true)
          }}
        >
          Add New Row
        </MuiButton>
      </div>
    </>
  );
};

export default CompetencyScorecard;
