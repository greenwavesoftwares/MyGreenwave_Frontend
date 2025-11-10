import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Box, Chip, Typography } from "@mui/material";
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
   //Filter For Data Table
    const [globalFilter, setGlobalFilter] = useState("");

  const departmentData = ["Software", "Automation", "HR","Accounts", "Sales", "Marketing","Factory","We Care"];

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

  //Data Table Header
  const tableHeader = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "0rem 0.5rem",
      }}
    >
      <h4 className="mx-0 my-1">Training Details</h4>
      <span className="p-input-icon-left">
        {/* <InputText
          type="search"
          className="p-inputtext-sm inputFieldStyle"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Keyword Search"
          style={{ padding: "0.45625rem 0.45625rem" }}
        /> */}
      </span>
    </Box>
  );

  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="cardStyle mt-4 bg-white shadow rounded">
          <DataTable
            size="small"
            emptyMessage={
              loader ? <LinearProgress color="inherit" /> : "No Data Found"
            }
            //header={<Typography className="text-sm">Training Details</Typography>}
            header={tableHeader}
            globalFilter={globalFilter}
            value={trainingList}
            showGridlines
            stripedRows
            className="dataTableHeader dataTableBody dataTableBodyPadding"
          >
            <Column
              header="Training Name"
              body={(rowData, { rowIndex }) =>
                editingRowIndex === rowIndex ? (
                  <InputText
                    value={rowData.trainingName}
                    className="p-inputtext-sm inputFieldStyle"
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
                    className="dropDownStyle"
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
                    className="p-inputtext-sm inputFieldStyle"
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
                    style={{width:"2rem", height: "2rem"}}
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
                  style={{width:"2rem", height: "2rem"}}
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
