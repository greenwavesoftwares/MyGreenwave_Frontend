import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { Button as MuiButton } from "@mui/material";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const MyInsights = ({ appraiserPreviousSaveFormDat, myInsights_Data }) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  //selectedRowData send to parent component
  useEffect(() => {
    myInsights_Data(selectedRowData);
  }, [selectedRowData]);

  //set Api Data : My Insight already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_MyInsightsCardData", selectedRowData);

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
          field="my_ideas"
          header="My Ideas"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.my_ideas}
                onChange={(e) =>
                  handleInputChange(e.target.value, "my_ideas", rowIndex)
                }
              />
            ) : (
              rowData.my_ideas
            )
          }
        ></Column>
        <Column
          field="my_contribution_plans"
          header="My Contribution Plans"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.my_contribution_plans}
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "my_contribution_plans",
                    rowIndex
                  )
                }
              />
            ) : (
              rowData.my_contribution_plans
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
              my_ideas: "",
              my_contribution_plans: "",
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

export default MyInsights;
