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
import {
  showErrorMessage,
  showSuccessMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
import { getAllUsersAPI } from "../AdminPage/AdminAPI";

const TrainingScheduleMaster = () => {
  //For Toast
  const toastRef = useRef(null);
  const [trainingList, setTrainingList] = useState([]);
  const [loader, setLoader] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [listOfAllDepartment, setListOfAllDepartment] = useState([]);
  //Filter For Data Table
  const [globalFilter, setGlobalFilter] = useState("");

  //NOTE Get all training api call
  async function getTrainingData() {
    try {
      const { token } = getUserData();
      const response = await getTrainingDetails(token);
      setTrainingList(response?.data || []);
      //List of all department
      const { departmentData } = await getAllUsersAPI();
      setListOfAllDepartment(departmentData.map((ele) => ele?.deptName));
      //Set
    } catch (error) {
      showErrorMessage(
        toastRef,
        "Error",
        error.message || "Failed to fetch training api",
      );
      console.error(error);
    } finally {
      setLoader(false);
    }
  }
  useEffect(() => {
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

  //Update And Insert API in same function
  const handleSaveRow = async (rowData, rowIndex) => {
    const { token } = getUserData();

    // Validation: Ensure all fields are filled before saving
    if (!rowData.trainingName || !rowData.department || !rowData.category) {
      return showWarningMessage(
        toastRef,
        "Warning",
        "Please fill all fields before saving.",
      );
    }

    console.log("Form_TrainingId",rowData.trainingId);
    try {
      if (rowData.trainingId) {
        // PUT: update section call
        const updateResponse = await putTrainingDetailsData(
          rowData,
          token,
          rowData.trainingId,
        );
        if (updateResponse.status === 200) {
          //get Training api call again
          getTrainingData();
          setEditingRowIndex(null);
          showWarningMessage(
            toastRef,
            rowData.trainingName,
            "Training Updated Successfully"
          );
        }
      } 
      else {
        // POST: create
        const createResponse = await postTrainingDetailsData(rowData, token);
        if (createResponse.status === 200) {
          getTrainingData();
          setEditingRowIndex(null);
          showSuccessMessage(
            toastRef,
            rowData.trainingName,
            "Training Added Successfully"
          );
        }
      }
    } catch (error) {
      showErrorMessage(
        toastRef,
        "Error",
        error?.response?.data ||
          "Api error occurred while saving training details",
      );
      console.error("Save failed:", error);
    }
  };

  // if (response?.status === 200) {
  //   showSuccessMessage(
  //     toastRef,
  //     rowData.trainingName,
  //     "Training has been added successfully",
  //   );
  //   const updatedList = [...trainingList];
  //   updatedList[rowIndex] = response.data;
  //   setTrainingList(updatedList);
  //   setEditingRowIndex(null);
  // } else if (response?.status === 400) {
  //   showWarningMessage(
  //     toastRef,
  //     "Duplicate Entry",
  //     `${response || "This training already exists"}`,
  //   );
  //   setEditingRowIndex(null);
  // } else {
  //   showWarningMessage(
  //     toastRef,
  //     "Duplicate Entry",
  //     "This training already exists",
  //   );
  //   setEditingRowIndex(null);

  const handleDeleteRow = async (rowData) => {
    const { token } = getUserData();
    setEditingRowIndex(null);
    try {
      showErrorMessage(toastRef, `${rowData.trainingName}`, "Now Delete");
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
        <InputText
          type="search"
          className="p-inputtext-sm inputFieldStyle"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Keyword Search"
          style={{ padding: "0.45625rem 0.45625rem" }}
        />
      </span>
    </Box>
  );

  const departmentColors = {
    accounts: "primary",
    automation: "secondary",
    software: "success",
  };
  //console.log("globalFilter", listOfAllDepartment);
  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="cardStyle mt-4 bg-white shadow rounded">
          <DataTable
            size="small"
            emptyMessage={
              loader ? <LinearProgress color="inherit" /> : "No Data Found"
            }
            // paginator={trainingList.length >= 10}
            // rows={10}
            // rowsPerPageOptions={[10, 20, 50]}
            //header={<Typography className="text-sm">Training Details</Typography>}
            header={tableHeader}
            globalFilterFields={["trainingName", "department"]}
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
                      handleInputChange(
                        e.target.value,
                        "trainingName",
                        rowIndex,
                      )
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
                    options={listOfAllDepartment}
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
                    label={rowData?.department}
                    color={
                      departmentColors[rowData?.department?.toLowerCase()] ||
                      "default"
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
                    style={{ width: "2rem", height: "2rem" }}
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
                  style={{ width: "2rem", height: "2rem" }}
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
