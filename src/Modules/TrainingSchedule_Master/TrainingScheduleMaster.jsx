import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
//SCSS Import
import "../Appraisal/Appraisal.scss";
import { Column } from "primereact/column";
import { Chip, Fab, Typography } from "@mui/material";
import { getUserData } from "../Login/Encrypt";
import { Button as MuiButton } from "@mui/material";
import { getTrainingDetails,postTrainingDetailsData,deleteTrainingDetailsData } from "./TrainingScheduleMasterAPI";
//Icon
import AddIcon from "@mui/icons-material/Add";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

const TrainingScheduleMaster = () => {
  //Set Training List Data
  const [trainingList, setTrainingList] = useState([]);
  //Set loader for data table
  const [loader, setLoader] = useState();
  //Dialog Visible State
  const [dialogVisible, setDialogVisible] = useState(false);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  //Update rowIndex
  const handleEditRow = (rowData, rowIndex) => {
    setEditingRowIndex(rowIndex);
  };
  //Update
  const handleInputChange = (value, field, index) => {
    const updatedRows = [...trainingList];
    //.log("updatedRows",updatedRows);
    updatedRows[index][field] = value;
    setTrainingList(updatedRows);
  };

  //Set Dropdown Data
  const departmentData = ["Software", "Automation"];

  //Call All Appraisal List API
  useEffect(() => {
    const getTrainingData = async () => {
      try {
        const localStorageAuth = getUserData();
        const authToken = localStorageAuth?.token;
        const trainingData = await getTrainingDetails(authToken);
        console.log("trainingData_Api", trainingData);
        setTrainingList(trainingData?.data);
        if (allAppraisalListData.status === 200) {
          setLoader(false);
          setAllAppraisalList(allAppraisalListData.data);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getTrainingData();
  }, []);


  //Handel Save Data
  const handleSaveRow=async()=>{
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    const findWithoutTrainingID=trainingList.find((e)=> !e.hasOwnProperty("trainingId"))
    
    const trainingDataSave = await postTrainingDetailsData(findWithoutTrainingID,authToken); 
    console.log('trainingDataSave',trainingDataSave);
    if(trainingDataSave.status===200){
      setEditingRowIndex(null)
    }
  }

  //Handel Delete Data
  const handleDeleteRow=async(rowData)=>{
    console.log("deleteBtn_Click",rowData);
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    
    
    const trainingDataSave = await deleteTrainingDetailsData(rowData,authToken); 
    const findWithoutTrainingID=trainingList.filter((e)=> e !== rowData)
    setTrainingList(findWithoutTrainingID)
    console.log('trainingDataSave',trainingDataSave);
  }
  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="card mt-4  bg-white shadow rounded">
          <DataTable
            size="small"
            emptyMessage={
              loader ? (
                <>
                  <LinearProgress color="inherit" />
                </>
              ) : (
                "No Data Found"
              )
            }
            header={
              <Typography className="text-sm">Training Details</Typography>
            }
            value={trainingList}
            showGridlines
            className="dataTableHeader dataTableBody dataTableBodyPadding"
          >
            <Column
              body={(rowData, { rowIndex }) => {
                return editingRowIndex === rowIndex ? (
                  <InputText
                    value={rowData.trainingName}
                    onChange={(e) =>
                      handleInputChange(
                        e.target.value,
                        "trainingName",
                        rowIndex
                      )
                    }
                  />
                ) : (
                  rowData.trainingName
                );
              }}
              header="Training Name"
            ></Column>
            <Column
              body={(rowData, { rowIndex }) => {
                return editingRowIndex === rowIndex ? (
                  <Dropdown
                    options={departmentData}
                    value={rowData.department}
                    onChange={(e) =>
                      handleInputChange(e.value, "department", rowIndex)
                    }
                    placeholder="Select Level"
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
                );
              }}
              header="Department"
            ></Column>
            <Column
              body={(rowData, { rowIndex }) => {
                return editingRowIndex === rowIndex ? (
                  <InputText
                    value={rowData.category}
                    onChange={(e) =>
                      handleInputChange(e.target.value, "category", rowIndex)
                    }
                  />
                ) : (
                  rowData.category
                );
              }}
              header="Category"
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
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteRow(rowData);
                            }}
                          />
                        );
                      }}
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
            }}
          >
            Add New Row
          </MuiButton>
        </div>
      </div>
    </div>
  );
};

export default TrainingScheduleMaster;
