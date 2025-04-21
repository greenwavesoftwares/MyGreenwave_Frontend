import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { Button as MuiButton } from "@mui/material";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

const CompetencyScorecard = ({
  appraiserPreviousSaveFormDat,
  CompetencyScorecardData,
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  //selectedRowData send to parent component
  useEffect(() => {
    CompetencyScorecardData(selectedRowData);
  }, [selectedRowData]);

  //Set Api Data : Competency Scorecard already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_CompetencyScoreCardData", selectedRowData);

  //Set Level Full Fulfillment Data Dropdown
  const LevelFullfillmentData = [1, 2, 3, 4, 5];
  const relevanceData = ["H", "M", "L"];

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
        showGridlines
        value={selectedRowData}
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          field="personal_goals"
          header="Through the Rear View Mirror - My Last Year's Traning Goals"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.personal_goals}
                onChange={(e) =>
                  handleInputChange(e.target.value, "personal_goals", rowIndex)
                }
              />
            ) : (
              rowData.personal_goals
            )
          }
        ></Column>
        <Column
          field="level_of_fullfillment"
          header="Level of fullfillment (1/5)"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={LevelFullfillmentData}
                value={rowData.level_of_fullfillment}
                onChange={(e) =>
                  handleInputChange(e.value, "level_of_fullfillment", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              rowData.level_of_fullfillment ?? ""
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
              personal_goals: "",
              relevance: null,
              level_of_fullfillment: "",
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

export default CompetencyScorecard;
