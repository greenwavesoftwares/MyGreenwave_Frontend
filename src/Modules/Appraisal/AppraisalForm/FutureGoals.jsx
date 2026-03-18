import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { Chip, Button as MuiButton, Typography } from "@mui/material";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputTextarea } from "primereact/inputtextarea";
const FutureGoals = ({
  appraiserPreviousSaveFormDat,
  FutureGoalsData,
  trainingData,
  isReviewer,
  isApprover,
  trackFutureGoals,
  appraiserUserName,
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //Training Data
  const [appraisalTraining, setAppraisalTraining] = useState([]);
  //Store Temp Data
  const [originalRowData, setOriginalRowData] = useState(null);
  //Edit All The Row Enable
  const [isEditAllForm, setIsEditAllForm] = useState(false);

  //Set Dropdown Data
  const goalTypeData = ["Personal", "Professional"];

  //selectedRowData send to parent component
  useEffect(() => {
    FutureGoalsData(selectedRowData);
  }, [selectedRowData]);

  //Set Training Data
  useEffect(() => {
    setAppraisalTraining(trainingData);
  }, [trainingData]);

  //set Api Data : Future Goals already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length >= 0) {
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
    FutureGoalsData(selectedRowData);
    trackFutureGoals(true);
  };
  //NOTE All edit section enable
  const handelEnableAllEditSection = () => {
    setIsEditAllForm(true);
  };

  //NOTE Save and close all edit section
  const handelSaveAllFormData = () => {
    setIsEditAllForm(false);
  };

  console.log("isEditAllForm", isEditAllForm);
  console.log("trainingData_InnerSection", trainingData);
  console.log("FutureGoals_Save_Date", selectedRowData);
  console.log("table_all_date", selectedRowData);

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
          style={{ width: "16rem" }}
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              <InputTextarea
                value={rowData.future_personal_KRA_goals}
                className="inputFieldStyle"
                disabled={appraiserUserName}
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "future_personal_KRA_goals",
                    rowIndex,
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
            editingRowIndex === rowIndex || isEditAllForm ? (
              <Dropdown
                options={goalTypeData}
                className="dropDownStyle"
                disabled={appraiserUserName}
                value={rowData.goalType}
                onChange={(e) =>
                  handleInputChange(e.value, "goalType", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              <Chip
                color={
                  rowData.goalType?.toLowerCase() === "professional"
                    ? "secondary"
                    : "primary"
                }
                style={{ textTransform: "capitalize" }}
                size="small"
                label={rowData.goalType ?? ""}
              />
            )
          }
        ></Column>
        <Column
          header="Training"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              rowData.goalType === "Professional" ? (
                <MultiSelect
                  options={appraisalTraining}
                  className="multiselectDropdownStyle"
                  value={rowData.appraisalTraining}
                  disabled={appraiserUserName}
                  onChange={(e) =>
                    handleInputChange(e.value, "appraisalTraining", rowIndex)
                  }
                  placeholder="Select Training"
                  display="chip"
                />
              ) : (
                <InputTextarea
                  className="inputFieldStyle inputSectionWidth"
                  value={rowData.appraisalTraining}
                  disabled={appraiserUserName}
                  onChange={(e) =>
                    handleInputChange(
                      [e.target.value],
                      "appraisalTraining",
                      rowIndex,
                    )
                  }
                />
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
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
            editingRowIndex === rowIndex || isEditAllForm ? (
              <InputTextarea
                value={rowData.reviewers_comment}
                disabled={isReviewer}
                className="inputFieldStyle inputSectionWidth"
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "reviewers_comment",
                    rowIndex,
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
            editingRowIndex === rowIndex || isEditAllForm ? (
              <InputTextarea
                value={rowData.appraisers_comments}
                disabled={isApprover}
                className="inputFieldStyle inputSectionWidth"
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "appraisers_comments",
                    rowIndex,
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
              <div style={{ display: "flex",justifyContent:"center" }}>
                <Button
                  icon="pi pi-check"
                  size="small"
                  text
                  type="button"
                  onClick={(e) => {
                    //e.preventDefault();
                    handleSaveRow();
                  }}
                  // onClick={handleSaveRow}
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
                disabled={appraiserUserName}
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
          gap:6
        }}
      >
        <MuiButton
          size="small"
          variant="contained"
          type="button"
          color="success"
          sx={{ boxShadow: "none" }}
          disabled={appraiserUserName}
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

        {/* in table data present  */}
        {selectedRowData.length > 1 && (
          <>
            {!isEditAllForm && (
              <MuiButton
                size="small"
                variant="contained"
                type="button"
                color="primary"
                sx={{ boxShadow: "none" }}
                onClick={handelEnableAllEditSection}>
                Edit All
              </MuiButton>
            )}

            {isEditAllForm && (
              <MuiButton 
                size="small"
                variant="contained"
                type="button"
                color="primary"
                sx={{ boxShadow: "none" }}
                onClick={handelSaveAllFormData}>
                Save Changes
              </MuiButton>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default FutureGoals;
