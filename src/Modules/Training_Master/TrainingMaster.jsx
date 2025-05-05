import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip, Typography } from "@mui/material";
import { Button as MuiButton } from "@mui/material";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import LinearProgress from "@mui/material/LinearProgress";

import "../Appraisal/Appraisal.scss";

import {
  getTrainingDetails,
  postTrainingDetailsData,
  deleteTrainingDetailsData,
  putTrainingDetailsData, // NEW: PUT API
} from "./TrainingMasterAPI";
import { getUserData } from "../Login/Encrypt";
import { Toast } from "primereact/toast";
import { showErrorMessage, showSuccessMessage, showWarningMessage } from "../../components/Toast/ShowMessage";

const TrainingScheduleMaster = () => {
  //For Toast
      const toastRef = useRef(null);
  const [trainingList, setTrainingList] = useState([]);
  const [loader, setLoader] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  const departmentData = ["Software", "Automation"];

  useEffect(() => {
    const getTrainingData = async () => {
      try {
        const { token } = getUserData();
        const response = await getTrainingDetails(token);
        setTrainingList(response?.data || []);
        setLoader(false);
      } catch (error) {
        console.error(error);
        setLoader(false);
      }
    };

    getTrainingData();
  }, []);

  const handleEditRow = (rowData, rowIndex) => {
    setEditingRowIndex(rowIndex);
  };

  const handleInputChange = (value, field, index) => {
    const updatedRows = [...trainingList];
    updatedRows[index][field] = value;
    setTrainingList(updatedRows);
  };

  const handleSaveRow = async (rowData, rowIndex) => {
    const { token } = getUserData();

    if (!rowData.trainingName || !rowData.department || !rowData.category) {
      alert("Please fill all fields before saving.");
      return;
    }

    try {
      let response;
      if (rowData.trainingId) {
        // PUT: update
        response = await putTrainingDetailsData(rowData, token,rowData.trainingId);
      } else {
        // POST: create
        response = await postTrainingDetailsData(rowData, token);
      }

      if (response?.status === 200) {
        showSuccessMessage(toastRef,"","Training Add Successfully")
        const updatedList = [...trainingList];
        updatedList[rowIndex] = response.data;
        setTrainingList(updatedList);
        setEditingRowIndex(null);
      }
      else{
        
        showWarningMessage(toastRef,"","Training Already Present")
        setEditingRowIndex(null)
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleDeleteRow = async (rowData) => {
    const { token } = getUserData();

    try {
      showErrorMessage(toastRef,`${rowData.trainingName}`,"Now Delete")
      await deleteTrainingDetailsData(rowData, token);
      const updatedList = trainingList.filter((e) => e !== rowData);
      
      setTrainingList(updatedList);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="card mt-4 bg-white shadow rounded">
          <DataTable
            size="small"
            emptyMessage={
              loader ? <LinearProgress color="inherit" /> : "No Data Found"
            }
            header={<Typography className="text-sm">Training Details</Typography>}
            value={trainingList}
            showGridlines
            className="dataTableHeader dataTableBody dataTableBodyPadding"
          >
            <Column
              header="Training Name"
              body={(rowData, { rowIndex }) =>
                editingRowIndex === rowIndex ? (
                  <InputText
                    value={rowData.trainingName}
                    required
                    onChange={(e) =>
                      handleInputChange(e.target.value, "trainingName", rowIndex)
                    }
                  />
                ) : (
                  rowData.trainingName
                )
              }
            />
            <Column
              header="Department"
              body={(rowData, { rowIndex }) =>
                editingRowIndex === rowIndex ? (
                  <Dropdown
                    options={departmentData}
                    required
                    value={rowData.department}
                    onChange={(e) =>
                      handleInputChange(e.value, "department", rowIndex)
                    }
                    placeholder="Select Department"
                  />
                ) : (
                  <Chip
                    size="small"
                    label={rowData.department}
                    color={
                      rowData?.department.toLowerCase() === "software"
                        ? "success"
                        : "secondary"
                    }
                  />
                )
              }
            />
            <Column
              header="Category"
              body={(rowData, { rowIndex }) =>
                editingRowIndex === rowIndex ? (
                  <InputText
                    value={rowData.category}
                    required
                    onChange={(e) =>
                      handleInputChange(e.target.value, "category", rowIndex)
                    }
                  />
                ) : (
                  rowData.category
                )
              }
            />
            <Column
              header="Edit"
              body={(rowData, { rowIndex }) =>
                editingRowIndex === rowIndex ? (
                  <Button
                    icon="pi pi-check"
                    size="small"
                    text
                    onClick={() => handleSaveRow(rowData, rowIndex)}
                  />
                ) : (
                  <Button
                    icon="pi pi-pencil"
                    size="small"
                    type="button"
                    text
                    onClick={() => handleEditRow(rowData, rowIndex)}
                  />
                )
              }
            />
            <Column
              header="Delete"
              body={(rowData) => (
                <Button
                  severity="danger"
                  size="small"
                  icon="pi pi-trash"
                  rounded
                  text
                  onClick={() => handleDeleteRow(rowData)}
                />
              )}
            />
          </DataTable>
        </div>

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
                trainingName: "",
                department: "",
                category: "",
              };
              setTrainingList([...trainingList, blankRow]);
              setEditingRowIndex(trainingList.length);
            }}
          >
            Add New Row
          </MuiButton>
        </div>
      </div>
       <Toast ref={toastRef} />
    </div>
    
  );
};

export default TrainingScheduleMaster;
