import { Button } from "primereact/button";
import { Chip, Button as MuiButton } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MultiSelect } from "primereact/multiselect";

const PerformanceScorecardDateTable = ({
  PerformanceScorecardData,
  appraiserPreviousSaveFormData,
  isReviewer,
  isApprover,
  trainingData,
  trackPerformance,
  appraiserUserName
}) => {
  console.log("ReviewerAndApprover_Status", isReviewer, isApprover);
  //Set Level Full Fulfillment Data Dropdown
  //const [fulFillment, setFulFillment] = useState(null);
  //each dialog row data
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //Set Training Data
  const [appraisalTraining, setAppraisalTraining] = useState([]);
  //Set only training data
  // const [trainingDataOnly, setTrainingDataOnly] = useState([]);
   //Store Temp Data
    const [originalRowData, setOriginalRowData] = useState(null);

  //Edit All The Row Enable
  const [isEditAllForm, setIsEditAllForm] = useState(false); 

  //set Training Data
  useEffect(() => {
    setAppraisalTraining(trainingData);
  }, [trainingData]);

  //React Hooks Form
  // const { register, handleSubmit, reset, setValue } = useForm();
  // const handlePerformerScorecardSubmit = (data, event) => {
  //   event.preventDefault();
  //   //console.log("data :>> ", data);

  //   if (rowIndex !== null) {
  //     const updated = [...selectedRowData];
  //     // console.log("updated",updated[rowIndex]);
  //     updated[rowIndex] = data;
  //     setSelectedRowData(updated);
  //     setRowIndex(null);
  //     reset();
  //   } else {
  //     setSelectedRowData([...selectedRowData, data]);
  //   }
  //   ///PerformanceScorecardData(...selectedRowData);
  //   //For reset downdown
  //   setFulFillment(null);
  //   //reset hole form
  //   reset();
  //   setVisible(false);
  // };

  //
  useEffect(() => {
    PerformanceScorecardData(selectedRowData);
  }, [selectedRowData]);

  //Set Api Data : Performance Scorecard already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormData?.length >= 0) {
      setSelectedRowData(appraiserPreviousSaveFormData);
    }
  }, [appraiserPreviousSaveFormData]);

  console.log("selectedRowData", ...selectedRowData);
  console.log("appraiserPreviousSaveFormData", appraiserPreviousSaveFormData);

  const LevelFullfillmentData = [1, 2, 3, 4, 5];

  //Delete Row Data
  const handleDeleteRow = (e) => {
    //console.log("deleteRowData",e);
    const updateTableData = selectedRowData.filter((ele) => ele !== e);
    //console.log("updateTableData",updateTableData);
    setSelectedRowData(updateTableData);
  };

  //Edit Section
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
    trackPerformance(true);
  };

  //Check Previous Year Data
  const checkedPreviousYearData = (ele) => {
    if (ele?.previous === true) {
      return true;
    }
    return false;
  };

   //NOTE All edit section enable
  const handelEnableAllEditSection = () => {
    setIsEditAllForm(true);
  };

  //NOTE Save and close all edit section
  const handelSaveAllFormData = () => {
    setIsEditAllForm(false);
  };

  return (
    <>
      {/* Popup */}

      <DataTable
        size="small"
        value={selectedRowData}
        stripedRows
        header="Performance Scorecard"
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
        rowClassName={(rowData) => {
          if (Array.isArray(rowData) && rowData.some((ele) => ele.previous)) {
            return "bgcyan-100";
          }
        }}
      >
        <Column
          field="my_last_year_KRA"
          header="Last Year's KRA"
          style={{ width: "16rem" }}
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              <InputTextarea
                value={rowData.my_last_year_KRA}
                className="inputFieldStyle inputSectionWidth"
                disabled={checkedPreviousYearData(rowData) || appraiserUserName}
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "my_last_year_KRA",
                    rowIndex,
                  )
                }
              />
            ) : (
              rowData.my_last_year_KRA
            )
          }
        ></Column>
        <Column
          field="level_of_fullfillment"
          header="Level of Fulfillment"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              <Dropdown
                options={LevelFullfillmentData}
                className="dropDownStyle"
                value={rowData.level_of_fullfillment}
                disabled={appraiserUserName}
                onChange={(e) =>
                  handleInputChange(e.value, "level_of_fullfillment", rowIndex)
                }
                placeholder="Select Level"
              />
            ) : (
              (rowData.level_of_fullfillment ?? "")
            )
          }
        />
        <Column
          header="Training"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              <MultiSelect
                options={appraisalTraining}
                className="multiselectDropdownStyle"
                value={rowData.appraisalTraining}
                disabled={checkedPreviousYearData(rowData) || appraiserUserName}
                onChange={(e) =>
                  handleInputChange(e.value, "appraisalTraining", rowIndex)
                }
                placeholder="Select Training"
                display="chip"
              />
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
                    color="primary"
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
          field="remarks"
          style={{ width: "16rem" }}
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              <InputTextarea
                value={rowData.remarks}
                className="inputFieldStyle inputSectionWidth"
                disabled={appraiserUserName}
                onChange={(e) =>
                  handleInputChange(e.target.value, "remarks", rowIndex)
                }
              />
            ) : (
              rowData.remarks
            )
          }
          header="Remarks"
        ></Column>
        <Column
          field="reviewers_comment"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex|| isEditAllForm ? (
              <InputTextarea
                className="inputFieldStyle inputSectionWidth"
                value={rowData.reviewers_comment}
                disabled={isReviewer}
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
          header="Reviewer's Comment"
        ></Column>
        <Column
          field="appraisers_comments"
          header="Appraiser's Comments"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex || isEditAllForm ? (
              <InputTextarea
                value={rowData.appraisers_comments}
                className="inputFieldStyle inputSectionWidth"
                disabled={isApprover}
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
                type="button"
                disabled={checkedPreviousYearData(rowData) || appraiserUserName}
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
          gap:6
        }}
      >
        <MuiButton
          size="small"
          variant="contained"
          color="success"
          sx={{ boxShadow: "none" }}
          disabled={appraiserUserName}
          onClick={() => {
            const blankRow = {
              my_last_year_KRA: "",
              level_of_fullfillment: null,
              appraisalTraining: [],
              remarks: "",
              reviewers_comment: "",
              appraisers_comments: "",
            };
            setSelectedRowData([...selectedRowData, blankRow]);
            trackPerformance(true);
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
                onClick={handelEnableAllEditSection}
              >
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
                onClick={handelSaveAllFormData}
              >
                Save Changes
              </MuiButton>
            )}
          </>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0.35rem 0.2rem 0.35rem 0",
        }}
      ></div>
    </>
  );
};

export default PerformanceScorecardDateTable;
