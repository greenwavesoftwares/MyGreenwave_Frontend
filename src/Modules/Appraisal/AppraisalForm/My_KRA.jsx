import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { Chip, Button as MuiButton } from "@mui/material";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";

const MyKRA = ({
  appraiserPreviousSaveFormDat,
  myKRA_Data,
  trainingData,
  isReviewer,
  isApprover,
  trackMyKRA
}) => {
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //Set Training Data
  const [appraisalTraining, setAppraisalTraining] = useState([]);
  //Set only training data
  const [trainingDataOnly, setTrainingDataOnly] = useState([]);
  //Store Temp Data
    const [originalRowData, setOriginalRowData] = useState(null);

  //selectedRowData send to parent component
  useEffect(() => {
    myKRA_Data(selectedRowData);
  }, [selectedRowData]);

  //set Training Data
  useEffect(() => {
    setAppraisalTraining(trainingData);
  }, [trainingData]);

  //set Api Data : My KRA already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_MyKRACardData", selectedRowData);

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
    trackMyKRA(true);
  };

  //training data set
  console.log("trainingDataOnly", trainingDataOnly);

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        header="My KRA"
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          field="my_next12month_KRA"
          header="Next Year KRA"
          body={(rowData, { rowIndex }) =>
            editingRowIndex === rowIndex ? (
              <InputText
                value={rowData.my_next12month_KRA}
                className="inputFieldStyle inputSectionWidth"
                onChange={(e) =>
                  handleInputChange(
                    e.target.value,
                    "my_next12month_KRA",
                    rowIndex
                  )
                }
              />
            ) : (
              rowData.my_next12month_KRA
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
                 type="button"
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
                  trackMyKRA(true);
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
              my_next12month_KRA: "",
              appraisalTraining: [],
              reviewers_comment: "",
              appraisers_comments: "",
            };
            setSelectedRowData([...selectedRowData, blankRow]);
            trackMyKRA(true);
          }}
        >
          Add New Row
        </MuiButton>
      </div>
    </>
  );
};

export default MyKRA;
