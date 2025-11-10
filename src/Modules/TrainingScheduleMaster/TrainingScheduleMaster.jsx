//import { LinearProgress } from "@mui/material";
import {
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Switch,
  Tooltip,
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
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
import { useRef } from "react";
import { Toast } from "primereact/toast";
//Mui Icon
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import CheckIcon from "@mui/icons-material/Check";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
//Icon Import
import DeleteIcon from "@mui/icons-material/Delete";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BackupIcon from "@mui/icons-material/Backup";
import AddIcon from "@mui/icons-material/Add";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HourglassBottomOutlinedIcon from '@mui/icons-material/HourglassBottomOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
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

  //Global Filter for table
  const [globalFilter, setGlobalFilter] = useState("");

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
    if (
      !newScheduleFormData.assignedUserId ||
      !newScheduleFormData.fromDate ||
      !newScheduleFormData.toDate ||
      !newScheduleFormData.trainingName
    ) {
      return showWarningMessage(toastRef, "Incomplete Form", "Please complete all required fields before submit");
    }
    if(newScheduleFormData.trainingName.length===0){
      return showWarningMessage(toastRef, "Incomplete Form", "Please select a training before submit");
    }
    if(newScheduleFormData.fromDate=== "1970-01-01" || newScheduleFormData.toDate==="1970-01-01"){
      return showWarningMessage(toastRef, "Invalid Date", "Please select valid dates before submit");
    }
    if (newScheduleFormData.fromDate > newScheduleFormData.toDate) {
     return showWarningMessage(toastRef, "Invalid Date Range", "The 'From Date' cannot be later than the 'To Date'.");
    }

    console.log("newScheduleFormData", newScheduleFormData);
    const { token } = getUserData();
    const response = await postAddScheduleData(token, newScheduleFormData);
    console.log("Handel_Submit_Training_api_response", response);
    //Form Data Save
    if (response.status === 201) {
      showSuccessMessage(toastRef, `${newScheduleFormData.assignedUserId}`, `${newScheduleFormData.trainingName} training has been added successfully`);
      ////Dialog Visibility OFf
      setVisible(false);
      //setAllTrainingData([...allTrainingData, newScheduleFormData]);
      setTrainingDropdown(true);
      setSelectedUser(null);
      await listOfUser();
    } else {
      console.log("Call Else Section");
      alert("Error in Saving Data");
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
    if (
      formatDate(fromDateUpdate || getRowData.fromDate) >
      formatDate(toDateUpdate || getRowData.toDate)
    ) {
      alert("From Date cannot be greater than To Date.");
      return;
    }

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

  //Filter Completed Training
  const completedTraining = allTrainingData.filter((ele) => {
    return ele.status.toLowerCase() === "completed";
  });

  //Filter Pending Training
  const pendingTraining = allTrainingData.filter((ele) => {
    return ele.status.toLowerCase() === "not completed";
  });

  //Certificate Available
  const certificateAvailable = allTrainingData.filter((ele) => {
    return ele.isCertificateAvailable === true;
  })

  

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className=" mt-4">
            <div className="cardStyle mb-1 py-2.5 px-4 bg-white shadow rounded">
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg blue-icon">
                      <AutoStoriesIcon />
                    </div>
                    <div>
                      <h1 className="text-1xl font-bold text-gray-900">
                        Training Schedule Master
                      </h1>
                      <p
                        className=" titleTextStyle"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Manage and track employee training schedules
                      </p>
                    </div>
                  </div>
                  <div>
                    <Button
                      sx={{ boxShadow: "none" }}
                      variant="contained"
                      size="small"
                      
                      style={{
                        padding: "0.35rem 0.7rem",
                        backgroundColor: "#3b82f6",
                        borderRadius: "2rem",
                      }}
                      startIcon={
                        <AddIcon style={{ marginRight: "0px !important" }} />
                      }
                      onClick={() => setVisible(true)}
                    >
                      {" "}
                      Add New
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className=" mt-1 py-2.5 ">
              <div className="my-grid-new">
                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex align-items-center">
                        <SchoolOutlinedIcon className=" mr-2 blue-icon-noBG" />
                        <p className="text-sm font-medium text-gray-600">
                          Total Trainings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {allTrainingData?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <div className="flex align-items-center">
                          <CheckCircleOutlineOutlinedIcon className=" mr-2 green-icon-noBG" />
                          <p className="text-sm font-medium text-gray-600">
                            Completed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {completedTraining?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </div>

                
                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex align-items-center">
                          <HourglassBottomOutlinedIcon className=" mr-2 yellow-icon-noBG" />
                          <p className="text-sm font-medium text-gray-600">
                            Pending
                          </p>
                        </div>
                      </div>
                    <div className="flex items-center">
                     
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {pendingTraining?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center">
                      <div className="flex align-items-center">
                        <VerifiedOutlinedIcon className=" mr-2 green-icon-noBG" />
                        <p className="text-sm font-medium text-gray-600">
                          With Certificates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                     
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {certificateAvailable?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
 <div className="mt-1 mb-4 cardStyle">
            <DataTable
              paginator
              rows={10}
              //rowsPerPageOptions={[10, 15, 20, 25]}
              size="small"
              emptyMessage={
                loader ? <LinearProgress color="inherit" /> : "No Data Found"
              }
              globalFilter={globalFilter}
              header={
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography className="text-sm font-bold">
                      Training Schedules
                    </Typography>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <InputText
                        type="search"
                        className=" inputFieldStyle"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Keyword Search"
                      />
                    </div>
                  </div>
                </>
              }
              value={allTrainingData}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
            >
              <Column sortable header="User Id" field="assignedUserId"></Column>

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
                      className="calendarStyle"
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
                      className="calendarStyle"
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
                header="Training Status"
                
                body={(rowData) => {
                  return (
                    <Chip
                      size="small"
                      //variant="outlined"
                      icon={rowData.isCertificateAvailable ? 
                      
                      <Tooltip title="Certificate Available for Download">
                      <CloudDownloadIcon  sx={{fontSize:"0.5rem"}}/>
                      </Tooltip>
                      : ""}
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
                          // color="default"
                          onClick={
                            // e.preventDefault();
                            handelSaveForm
                          }
                        >
                          <CheckIcon className="menu-icon" />
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
                          <ModeEditIcon className="menu-icon" />
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
                          startIcon={<BackupIcon />}
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
              className="w-full dropdownStyle dropDownStyle"
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
              className="w-full dropDownStyle"
            />
            <Calendar
              id="formDate_Btn"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.value);
              }}
              showIcon
              className="w-full p-inputtext-sm calendarStyle"
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
              className="w-full p-inputtext-sm calendarStyle"
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
              <div style={{ display: "flex", alignItems: "center" }}>
                <Chip
                  size="medium"
                  color="info"
                  variant="outlined"
                  label={fileUploadName}
                />
                <IconButton
                  variant="contained"
                  color="error"
                  onClick={handleRemoveAndReupload}
                >
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
        className="dialogHeader dialogContent dialogFooter acceptButton "
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
