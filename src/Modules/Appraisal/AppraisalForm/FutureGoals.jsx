import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { Chip, Button as MuiButton, Typography } from "@mui/material";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
const FutureGoals = ({
  appraiserPreviousSaveFormDat,
  FutureGoalsData,
  trainingData,
  isReviewer,
  isApprover,
  trackFutureGoals
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //Training Data
  const [appraisalTraining, setAppraisalTraining] = useState([]);

  //Set Dropdown Data
  const goalTypeData = ["Personal", "Professional"];

  //selectedRowData send to parent component
  useEffect(() => {
    FutureGoalsData(selectedRowData);
  }, [selectedRowData]);

  //Set Training Data
  useEffect(() => {
    setAppraisalTraining(trainingData);
  },[trainingData])

  //set Api Data : Future Goals already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_FutureGoalsCardData", selectedRowData);

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
    FutureGoalsData(selectedRowData);
    trackFutureGoals(true);
  };
  console.log("trainingData_InnerSection", trainingData);
  console.log("FutureGoals_Save_Date",FutureGoalsData)

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        header="Future Goals"
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          field="future_personal_KRA_goals"
          header="My Aspirations (2 Professional and 2 Personal Goals)"
            style={{width:"16rem"}}
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.future_personal_KRA_goals}
                className="inputFieldStyle"
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "future_personal_KRA_goals",
                    rowIndex
                  )
                }
              />
            ) : (
              rowData.future_personal_KRA_goals
            )
          }
        ></Column>
        <Column
          field="goalType"
          header="Personal/Professional"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <Dropdown
                options={goalTypeData}
                className="dropDownStyle"
                value={rowData.goalType}
                onChange={(e) =>
                  handleInputChange(e.value, "goalType", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
             <Chip color="primary" style={{textTransform:'capitalize'}} size="small" label={rowData.goalType ?? ""}/> 
            )
          }
        ></Column>
        <Column
          header="Training"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <MultiSelect
                options={appraisalTraining}
                className="multiselectDropdownStyle"
                value={rowData.appraisalTraining}
                onChange={(e) =>
                  handleInputChange(e.value, "appraisalTraining", rowIndex)
                }
                placeholder="Select Training"
                display="chip"
              />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap",justifyContent:'center' }}>
                {rowData.appraisalTraining?.map((item, index) => (
                  <Chip
                    size="small"
                    color="success"
                    key={index}
                    label={item}
                    style={{ marginRight: "0.2rem", marginBottom: "0.2rem" }}
                  />
                ))}
              </div>
            )
          }
        />

        <Column
          field="reviewers_comment"
          className="inputSectionWidth"
          header="Reviewer's Comment"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.reviewers_comment}
                disabled={isReviewer}
                className="inputFieldStyle inputSectionWidth"
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
          className="inputSectionWidth"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.appraisers_comments}
                disabled={isApprover}
                className="inputFieldStyle inputSectionWidth"
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
              <div style={{display:"flex"}}>
              <Button
                icon="pi pi-check"
                size="small"
                text
                type="button"
                onClick={(e) =>{
                  //e.preventDefault();
                  handleSaveRow()

                }}
               // onClick={handleSaveRow}
               
              />
              <Button
                icon="pi pi-times"
                size="small"
                text
                style={{color:"red"}}
                type="button"
                onClick={(e) =>{
                  //e.preventDefault();
                  setEditingRowIndex(null)

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
                icon="pi pi-trash"
                rounded
                text
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteRow(rowData);
                  trackFutureGoals(true);
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
          type="button"
          color="success"
          sx={{ boxShadow: "none" }}
          onClick={(e) => {
            e.preventDefault();
            const blankRow = {
              future_personal_KRA_goals: "",
              goalType: null,
              appraisalTraining: [],
              reviewers_comment: "",
              appraisers_comments: "",
            };
           setSelectedRowData([...selectedRowData, blankRow]);
           trackFutureGoals(true);
          }}
        >
          Add New Row
        </MuiButton>
      </div>
    </>
  );
};

export default FutureGoals;
