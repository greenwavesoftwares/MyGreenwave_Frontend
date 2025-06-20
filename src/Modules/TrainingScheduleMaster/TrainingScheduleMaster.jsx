//import { LinearProgress } from "@mui/material";
import {
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Switch,
  Typography,
} from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import React, { useEffect, useState } from "react";
import {
  getAllUserList,
  getUseridWiseTrainingList,
  postAddScheduleData,
  getTrainingAllList,
  postUpdateConfirm,
  fileUpload,
} from "./TrainingScheduleMasterAPI";
import { getUserData } from "../Login/Encrypt";
import { Calendar } from "primereact/calendar";
import { useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
//SCSS Import
import "../Appraisal/Appraisal.scss";
//Date Formate
import { formatDate } from "../Appraisal/formatDate";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import { useRef } from "react";
import { Toast } from "primereact/toast";
//Mui Icon
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import CheckIcon from "@mui/icons-material/Check";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import DeleteIcon from "@mui/icons-material/Delete";

const TrainingScheduleMaster = () => {
  //For Toast
  const toastRef = useRef(null);
  //Dialog Visible
  const [visible, setVisible] = useState(false);
  const [fileUploadDialog, setFileUploadDialog] = useState(false);
  //Set User List From Api
  const [allUser, setAllUser] = useState([]);
  //Set All User For Dropdown
  const [selectedUser, setSelectedUser] = useState(null);
  //Set User wise Training data
  const [trainingList, setTrainingList] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  //Training Dropdown Disable
  const [trainingDropdown, setTrainingDropdown] = useState(true);
  //Form Date
  const [fromDate, setFromDate] = useState(null);
  //To Date
  const [toDate, setToDate] = useState(null);
  //Set All Training Data
  const [allTrainingData, setAllTrainingData] = useState([]);
  //Data Table Loader
  const [loader, setLoader] = useState(false);
  //Confirm Dialog
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  //Set Select Row Data
  const [confirmDialogRowData, setConfirmDialogRowData] = useState(null);
  //For Edit Section
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  //For Edit Button Row Data State
  const [getRowData, setGetRowData] = useState(null);

  //Form Date and To Date update state
  const [fromDateUpdate, setFromDateUpdate] = useState(null);
  const [toDateUpdate, setToDateUpdate] = useState(null);

  //File Upload
  const [file, setFile] = useState(null);
  const [fileUploadRow, setFileUploadRow] = useState(null);
  const [fileUploadName, setFileUploadName] = useState(null);
  const fileUploadRef = useRef(null);

  //Call User List
  useEffect(() => {
    listOfUser();
  }, []);

  const listOfUser = async () => {
    try {
      const { token } = getUserData();
      //Get All User List
      const response = await getAllUserList(token);
      console.log("response", response);
      setAllUser(response?.data.userList);

      //Get All Training User Data
      setLoader(true);
      const allTrainingData = await getTrainingAllList(token);
      setLoader(false);
      setAllTrainingData(allTrainingData?.data.trainingEventTableList);
      console.log("allTrainingData", allTrainingData);
    } catch (error) {
      console.log(error);
    }
  };

  //On Change Training Api Call
  const changeUserID = async (e) => {
    console.log("changeUserID", e.userID);
    const { token } = getUserData();

    //setSelectedUser(e.userID);

    const userWiseTraining = await getUseridWiseTrainingList(e.userID, token);
    if (userWiseTraining.status === 200) {
      setTrainingDropdown(false);
    }
    console.log("userWiseTraining", userWiseTraining);
    setTrainingList(userWiseTraining.data);
  };

  //Add Schedule Submit Button
  const handleSubmit = async (e) => {
    console.log("handleSubmit", e);
    e.preventDefault();
    const newScheduleFormData = {
      eventId: "",
      assignedUserId: selectedUser?.userID,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
      trainingName: trainingData,
      status: "Not Completed",
      isCompleted: false,
      isCertificateAvailable: false,
    };
    if(!newScheduleFormData.assignedUserId || !newScheduleFormData.fromDate || !newScheduleFormData.toDate || !newScheduleFormData.trainingName) {
      alert("Please fill all fields before saving.");
      return;
    }
    if (newScheduleFormData.fromDate > newScheduleFormData.toDate) {
      alert("From Date cannot be greater than To Date.");
      return;
    }

    console.log("newScheduleFormData", newScheduleFormData);
    const { token } = getUserData();
    const response = await postAddScheduleData(token, newScheduleFormData);
    console.log("saveData", response);
    //Form Data Save
    if (response.status === 201) {
      showSuccessMessage(toastRef, "", "Training Add Successfully");
      ////Dialog Visibility OFf
      setVisible(false);
      //setAllTrainingData([...allTrainingData, newScheduleFormData]);
      setTrainingDropdown(true);
      setSelectedUser(null);
      await listOfUser();
    } else {
      showErrorMessage(toastRef, "", "Internal Error");
    }
  };

  //Confirm Dialog
  const handelConfirmDialog = (e) => {
    //console.log("rowClickData",e);
    setConfirmDialogVisible(true);
    setConfirmDialogRowData(e); // store for later
  };

  //Update Data
  const handelUpdateSwitch = async () => {
    try {
      const updateData = {
        ...confirmDialogRowData,
        status: "Completed",
        isCompleted: true,
      };
      console.log("updateData", updateData);
      //Update Api
      const { token } = getUserData();
      const response = await postUpdateConfirm(token, updateData);
      if (response.status === 201) {
        showSuccessMessage(toastRef, "", "Training Successfully Completed");
        //Update in Table
        const updatedList = allTrainingData.map((item) =>
          item.eventId === updateData.eventId ? updateData : item
        );
        setAllTrainingData(updatedList);
      }
      console.log("postUpdateConfirmData", response);
    } catch (error) {
      console.log(error);
    }
  };

  //Edit Row
  const handleEditRow = (rowData, rowIndex) => {
    //console.log("editRowData", rowData, rowIndex);
    setEditingRowIndex(rowIndex);
    setGetRowData(rowData);
  };

  //Save Form and To Date
  const handelSaveForm = async () => {
    const upDateData = {
      ...getRowData,
      fromDate: formatDate(fromDateUpdate || getRowData.fromDate),
      toDate: formatDate(toDateUpdate || getRowData.toDate),
    };
    console.log("UpdateSaveDate", upDateData);
    const { token } = getUserData();
    const response = await postUpdateConfirm(token, upDateData);
    if (response.status === 201) {
      showSuccessMessage(toastRef, "", "Training Date Change");
      //Update in Table
      const updatedList = allTrainingData.map((item) => {
        if (item.eventId === upDateData.eventId) {
          return upDateData;
        }
        return item;
      });
      console.log("updatedList", updatedList);
      setAllTrainingData(updatedList);
    }
    setEditingRowIndex(null);
  };

  //Upload File
  const onUploadFile = async (event) => {
    console.log(event);
    const file = event.files[0];
    setFile(file);
    console.log("file?.name", event.files[0]?.name);
    //Set Upload File Name
    setFileUploadName(event.files[0]?.name);
  };

  //Submit File Upload
  const submitFileUpload = async () => {
    // setFile(null)

    const makeFileUploadData = {
      file: file,
      eventId: fileUploadRow.eventId,
      userId: fileUploadRow.assignedUserId,
    };

    const { token } = getUserData();
    console.log("fileUploadRow", makeFileUploadData);
    //const {eventId,assignedUserId}=fileUploadRow;
    const response = await fileUpload(
      token,
      file,
      fileUploadRow.eventId,
      fileUploadRow.assignedUserId
    );
    console.log("fileUpload_api", response);
    if (response.status === 201) {
      showSuccessMessage(toastRef, "", "File Uploaded Successfully");
      setFile(null);
      setFileUploadName(null);
      setFileUploadDialog(false);
    } else {
      showErrorMessage(toastRef, "", "Error in File Upload");
    }
  };

  //REmove Button
  const handleRemoveAndReupload = () => {
    setFile(null);
    setFileUploadName(null);

    // Clear file input and trigger click to reopen dialog
    if (fileUploadRef.current) {
      fileUploadRef.current.clear(); // Reset the UI
      const fileInput = fileUploadRef.current.fileInput?.current;
      if (fileInput) {
        fileInput.click(); // Reopen file dialog
      }
    }
  };

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="card mt-4 bg-white shadow rounded">
            <DataTable
              paginator
              rows={15}
              rowsPerPageOptions={[10, 15, 20, 25]}
              size="small"
              emptyMessage={
                loader ? <LinearProgress color="inherit" /> : "No Data Found"
              }
              header={
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography className="text-sm">
                      Training Schedules
                    </Typography>
                    <Button
                      sx={{ boxShadow: "none" }}
                      variant="contained"
                      size="small"
                      onClick={() => setVisible(true)}
                    >
                      {" "}
                      Add New
                    </Button>
                  </div>
                </>
              }
              value={allTrainingData}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding"
            >
              <Column header="User Id" field="assignedUserId"></Column>

              <Column
                header="Form Date"
                // style={{ width: "20rem" }}
                body={(rowData, { rowIndex }) => {
                  return editingRowIndex === rowIndex ? (
                    <Calendar
                      id="formDateBtn"
                      required
                      //showIcon
                      // value={
                      //   rowData.fromDate
                      // }
                      value={fromDateUpdate || new Date(rowData.fromDate)}
                      onChange={(e) => setFromDateUpdate(e.value)}
                      dateFormat="yy-mm-dd"
                    />
                  ) : (
                    <Typography sx={{ fontSize: "0.8rem" }}>
                      {formatDate(rowData.fromDate)}
                    </Typography>
                  );
                }}
              ></Column>
              <Column
                header="To Date"
                body={(rowData, { rowIndex }) => {
                  return editingRowIndex === rowIndex ? (
                    <Calendar
                      id="toDateBtn"
                      required
                      // showIcon
                      // value={
                      //   rowData.toDate
                      // }
                      value={toDateUpdate || new Date(rowData.toDate)}
                      onChange={(e) => setToDateUpdate(e.value)}
                      dateFormat="yy-mm-dd"
                    />
                  ) : (
                    <Typography sx={{ fontSize: "0.8rem" }}>
                      {formatDate(rowData.toDate)}
                    </Typography>
                  );
                }}
              ></Column>
              <Column
                header="Training Name"
                style={{ width: "18rem" }}
                field="trainingName"
              />
              <Column
                header="Status"
                body={(rowData) => {
                  return (
                    <Chip
                      size="small"
                      color={
                        rowData.status.toLowerCase() === "completed"
                          ? "success"
                          : "warning"
                      }
                      label={rowData.status}
                    />
                  );
                }}
              ></Column>
              <Column
                header="Re-Schedule"
                body={(rowData, { rowIndex }) => {
                  return (
                    <>
                      {rowData.status.toLowerCase() === "completed" ? (
                        ""
                      ) : editingRowIndex === rowIndex ? (
                        <IconButton
                          size="small"
                          aria-label="ModeEditIcon"
                          color="default"
                          onClick={
                            // e.preventDefault();
                            handelSaveForm
                          }
                        >
                          <CheckIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          aria-label="ModeEditIcon"
                          color="default"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditRow(rowData, rowIndex);
                          }}
                        >
                          <ModeEditIcon />
                        </IconButton>
                      )}
                    </>
                  );
                }}
              ></Column>
              <Column
                header="Completed"
                body={(rowData) => {
                  return (
                    <Switch
                      disabled={
                        rowData.status.toLowerCase() === "completed"
                          ? true
                          : false
                      }
                      checked={
                        rowData.status.toLowerCase() === "completed"
                          ? true
                          : false
                      }
                      onClick={() => handelConfirmDialog(rowData)}
                    />
                  );
                }}
              ></Column>

              <Column
                header="Certificate"
                body={(rowData) => {
                  return (
                    <>
                      {rowData.status.toLowerCase() === "completed" ? (
                        <Button
                          sx={{ boxShadow: "none" }}
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setFileUploadDialog(true);
                            setFileUploadRow(rowData);
                          }}
                        >
                          Upload Certificate
                        </Button>
                      ) : (
                        ""
                      )}
                    </>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        </div>
      </div>

      {/* Add New Schedule Dialog */}
      <Dialog
        header="Add Schedule"
        className="dialogHeader dialogContent"
        visible={visible}
        style={{ width: "22rem" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              rowGap: "0.45rem",
              justifyItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <Dropdown
              value={selectedUser}
              onChange={(e) => {
                changeUserID(e.value);
                setSelectedUser(e.value);
              }}
              filter
              //required
              options={allUser}
              optionLabel="userName"
              placeholder="Select a User"
              className="w-full"
            />
            <Dropdown
              value={trainingData}
              onChange={(e) => {
                //   changeUserID(e.value);
                setTrainingData(e.value);
              }}
              disabled={trainingDropdown}
              options={trainingList}
              placeholder="Select a Training"
              className="w-full"
            />
            <Calendar
              id="formDate_Btn"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.value);
              }}
              showIcon
              className="w-full p-inputtext-sm"
              placeholder="Form Date"
              dateFormat="yy-mm-dd"
            />
            <Calendar
              id="toDate_Btn"
              value={toDate}
              onChange={(e) => {
                setToDate(e.value);
              }}
              showIcon
              className="w-full p-inputtext-sm"
              placeholder="To Date"
              dateFormat="yy-mm-dd"
            />

            <Button
              variant="contained"
              size="small"
              type="submit"
              className="mt-2"
            >
              Submit
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add File Upload Dialog */}

      <Dialog
        header="Upload Certificate"
        className="dialogHeader dialogContent"
        visible={fileUploadDialog}
        style={{ width: "32rem" }}
        onHide={() => {
          if (!fileUploadDialog) return;
          setFileUploadDialog(false);
        }}
      >
        <div
          style={{ display: "grid", rowGap: "0.7rem", justifyItems: "center" }}
        >
          {fileUploadName === null ? (
            ""
          ) : (
            <>
            <div style={{display:"flex",alignItems:"center"}}>
              <Chip
                size="medium"
                color="info"
                variant="outlined"
                label={fileUploadName}
              />
              <IconButton variant="contained" color="error" onClick={handleRemoveAndReupload}>
                <DeleteIcon />
              </IconButton>
              </div>
            </>
          )}

          <FileUpload
            ref={fileUploadRef}
            className="primeReactButtonPadding"
            //name="demo[]"
            mode="basic"
            //url="/api/upload"
            // multiple
            auto
            accept="*"
            customUpload
            //maxFileSize={1000000}
            // onUploadHa={onUploadFile}
            //  onUpload={onUploadFile}
            uploadHandler={onUploadFile}
            // emptyTemplate={
            //   <p className="m-0">Drag and drop files to here to upload.</p>
            // }
          />

          <Button variant="contained" size="small" onClick={submitFileUpload}>
            Submit
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        group="declarative"
        className="dialogHeader dialogContent dialogFooter acceptButton"
        acceptClassName="acceptButton"
        rejectClassName="rejectButton"
        visible={confirmDialogVisible}
        onHide={() => setConfirmDialogVisible(false)}
        style={{ width: "20rem" }}
        message="Please ensure that user has completed this training.You can't change after this.Are you sure?"
        header="Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={handelUpdateSwitch}
        // reject={reject}
      />
      <Toast ref={toastRef} />
    </>
  );
};
export default TrainingScheduleMaster;
