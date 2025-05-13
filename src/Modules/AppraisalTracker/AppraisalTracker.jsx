import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { Checkbox } from "primereact/checkbox";
//Icon
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
//SCSS Import
import "../Appraisal/Appraisal.scss";
//Import Appraisal Tracker API
import {
  getAllAppraisalData,
  appraisalFormAPI,
  appraisalFormExcelDownload,
  trainingApi,
  appraisalAPI,
  appraiserFormApi,
  appraisalForceApproved
} from "./AppraisalTrackerAPI";

//Inner Component
import { formatDate } from "../Appraisal/formatDate";
import AppraisalDialog from "../Appraisal/AppraisalForm";
import { getUserData } from "../Login/Encrypt";
import { Toast } from "primereact/toast";
import {
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";

const AppraisalTracker = () => {
  //For Toast
  const toastRef = useRef(null);
  //Set all appraisal list data
  const [allAppraisalList, setAllAppraisalList] = useState([]);
  //Set Appraisal Form Data Visible
  const [appraisalFormVisible, setAppraisalFormVisible] = useState(false);
  //Set loader for data table
  const [loader, setLoader] = useState();
  //Loader of Show form button
  const [showFormLoader, setShowFormLoader] = useState(false);
  //Set Appraisal Data
  const [appraiserForm, setAppraiserForm] = useState();
  //Set Training Data
  const [trainingData, setTrainingData] = useState(null);
  //Dialog Visible State
  const [dialogVisible, setDialogVisible] = useState(false);
  //Set Appraiser New Form Details
  const [empName, setEmpName] = useState(null);
  const [date, setDate] = useState(null);
  const [reviewerName, setReviewerName] = useState(null);
  const [appraiserName, setAppraiserName] = useState(null);
  //API Data Set
  const [appraisalData, setAppraisalData] = useState();
  //Filter For Data Table
  const [globalFilter, setGlobalFilter] = useState("");
  //Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState(false);
  //Set Force Approve Select Row
  const [forceApproveSelectRow, setForceApproveSelectRow] = useState(null);

  //Call All Appraisal List API
  useEffect(() => {
    getAllAppraisal();
  }, []);

  //Call Appraisal Form API
  const getAllAppraisal = async () => {
    try {
      const localStorageAuth = getUserData();
      const authToken = localStorageAuth?.token;
      setLoader(true);
      const response = await getAllAppraisalData(authToken);
      console.log("allAppraisalListData", response);
      //Training Data
      const trainingData = await trainingApi(authToken);
      console.log("trainingData_Api", trainingData);
      setTrainingData(trainingData?.data);

      //Call Appraisal List API (New From)
      const employeeName = localStorageAuth?.userDetails.userId;
      const responseData = await appraisalAPI(authToken, employeeName);
      console.log("employeeName", employeeName, authToken);
      setAppraisalData(responseData);

      //Set DataTable Data
      if (response.status === 200) {
        setLoader(false);
        setAllAppraisalList(response?.data.appraisalsList);
      }
      else{
        setLoader(false);
        showErrorMessage(toastRef,"Error","Internal Server Error");
      }
      
    } catch (error) {
      console.log(error);
    }
  };

  //Handel Click employee from data
  const handleShowForm = async (
    formId,
    previousYearFormId,
    empId,
    appraisalDate
  ) => {
    console.log("formId", formId);
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    setShowFormLoader(true);
    const getAppraisalFormData = await appraisalFormAPI(
      authToken,
      formId,
      previousYearFormId,
      empId,
      appraisalDate
    );
    //console.log("getAppraisalFormData",getAppraisalFormData);
    if (getAppraisalFormData?.status == 200) {
      //For Appraisal Form
      setShowFormLoader(false);
      showInfoMessage(toastRef, `${empId}`, "Form Fetched Successfully");
      setAppraiserForm(getAppraisalFormData?.data);
      setAppraisalFormVisible(true);
    } else {
      showErrorMessage(toastRef, "Error", "Form Not Found");
      setAppraisalFormVisible(false);
    }
  };

  //Handel Click Excel Download
  const handelExcelDownload = async (formId, previousYearFormId, empId) => {
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    const excelDownload = await appraisalFormExcelDownload(
      authToken,
      formId,
      previousYearFormId,
      empId
    );
    console.log("excelDownload", excelDownload);
  };

  //Form Submit Handle For New Appraisal Form
  const handleSubmit = async (e) => {
    const getAuthToken = getUserData()?.token;
    e.preventDefault();
    const appraiserFromData = {
      empName: empName?.userName,
      empId: empName?.userID,
      appraisalsDate: formatDate(date),
      reviewerName: reviewerName?.userName,
      reviewerId: reviewerName?.userID,
      appraiserName: appraiserName?.userName,
      appraiserId: appraiserName?.userID,
    };
    console.log("New Appraiser Form submitted", appraiserFromData);

    //Save Appraiser Form Data (API)
    const response = await appraiserFormApi(appraiserFromData, getAuthToken);
    //If Date Successfully Saved
    if (response?.status == 201) {
      //Toast For Success Submitted
      showSuccessMessage(toastRef, "Success", "Form Submitted Successfully");
      //Dialog Close
      setDialogVisible(false);
      // Reset state variables
      setEmpName(null);
      setDate(null);
      setReviewerName(null);
      setAppraiserName(null);

      await getAllAppraisal();
    } else {
      showErrorMessage(toastRef, "Error", "Internal Server Error");
    }
    // console.log("Response from API", response);
  };

  //Force Approve Appraisal Form
  const handelForceApprove = (rowData) => {
    const { token } = getUserData()?.token;
    const forceApprovePayload = {
      ...forceApproveSelectRow,
      approved: true,
    };
    console.log("forceApprovePayload", forceApprovePayload);
    const response = appraisalForceApproved(token,forceApprovePayload);
    if (response.status == 200) {
      showSuccessMessage(toastRef, "Success", "Appraisal Form Approved Successfully");
      getAllAppraisal();
    }
    else{
      showErrorMessage(toastRef, "Error", "Internal Server Error");
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
      <h4 className="mx-0 my-1">All Appraisals</h4>
      <span className="p-input-icon-left">
        <InputText
          type="search"
          className="p-inputtext-sm"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Keyword Search"
          style={{ padding: "0.45625rem 0.45625rem" }}
        />
      </span>
    </Box>
  );
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="card mt-4 py-2 px-3 bg-white shadow rounded">
            <div className="flex justify-between items-center">
              <p>Appraisal Tracker</p>

              {/* Appraisal Form Buttons */}
              <div className="flex items-center gap-4">
                <Button
                  variant="contained"
                  size="small"
                  sx={{ boxShadow: "none" }}
                  onClick={() => setDialogVisible(true)}
                >
                  New Form
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          {appraisalFormVisible && (
            <div className="container mx-auto mt-4">
              <AppraisalDialog
                appraiserForm={appraiserForm}
                trainingData={trainingData}
              />
            </div>
          )}
          {showFormLoader && (
            <Backdrop
              sx={{
                color: "#fff",
                zIndex: (theme) => theme.zIndex.drawer + 1,
              }}
              open
            >
              <CircularProgress color="inherit" />
            </Backdrop>
          )}

          <div className="card mt-2  bg-white shadow rounded">
            <DataTable
              size="small"
              paginator
              rows={10}
              emptyMessage={
                loader ? (
                  <>
                    <LinearProgress color="inherit" />
                  </>
                ) : (
                  "No Data Found"
                )
              }
              rowsPerPageOptions={[10, 15, 20, 25]}
              stripedRows
              globalFilter={globalFilter}
              // header={
              //   <Typography className="text-sm">All Appraisals</Typography>
              // }
              header={tableHeader}
              value={allAppraisalList}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
            >
              <Column
                style={{ width: "70px" }}
                body={(rowData) => {
                  return (
                    <IconButton
                      onClick={() =>
                        handleShowForm(
                          rowData.formId,
                          rowData.previousYearFormId,
                          rowData.empId,
                          rowData.appraisalDate
                        )
                      }
                      aria-label="VisibilityIcon"
                      color="info"
                      sx={{ padding: "4px" }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  );
                }}
                //header="Form"
              ></Column>
              <Column field="empName" header="Employee Name"></Column>
              <Column field="empId" header="Employee Id"></Column>

              <Column
                header="Appraisal Date"
                body={(rowData) => {
                  return formatDate(rowData.appraisalDate);
                }}
              ></Column>
              <Column
                header="Reviewed"
                body={(rowData) => {
                  return <Checkbox disabled checked={rowData.reviewed} />;
                }}
              ></Column>
              <Column
                header="Approved"
                body={(rowData) => {
                  return <Checkbox disabled checked={rowData.approved} />;
                }}
              ></Column>

              <Column
                body={(rowData) => {
                  return (
                    <IconButton
                      sx={{ boxShadow: "none" }}
                      size="small"
                      //color="success"
                      variant="contained"
                      onClick={() =>
                        handelExcelDownload(
                          rowData.formId,
                          rowData.previousYearFormId,
                          rowData.empId
                        )
                      }
                    >
                      <DownloadIcon />
                    </IconButton>
                  );
                }}
                header="Download"
              ></Column>

              <Column
                header="Force Approve"
                body={(rowData) => {
                  return (
                    <Button
                      disabled={rowData.approved}
                      sx={{ boxShadow: "none" }}
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setForceApproveSelectRow(rowData);
                        setConfirmDialog(true);
                      }}
                    >
                      Submit
                    </Button>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        </div>
      </div>
      {/* Appraisal New Form */}
      <Dialog
        className="dialogHeader dialogContent"
        header="Add Appraiser Details"
        visible={dialogVisible}
        style={{ width: "30vw" }}
        onHide={() => {
          if (!dialogVisible) return;
          setDialogVisible(false);
        }}
      >
        <div>
          <div className="bg-white rounded">
            <form onSubmit={handleSubmit}>
              <div className="flex-auto">
                <label htmlFor="buttondisplay" className="font-bold text-sm ">
                  Employee Name
                </label>
                <Dropdown
                  value={empName}
                  id="buttondisplay"
                  filter
                  required
                  onChange={(e) => setEmpName(e.value)}
                  options={appraisalData?.employeeidlist}
                  optionLabel="userName"
                  placeholder="Employee Name"
                  className="w-full p-inputtext-sm"
                />
              </div>

              <div className="flex-auto">
                <label htmlFor="buttondisplay" className="font-bold text-sm ">
                  Appraisals Date
                </label>
                <Calendar
                  id="buttondisplay"
                  value={date}
                  onChange={(e) => setDate(e.value)}
                  showIcon
                  className="w-full p-inputtext-sm"
                  placeholder="Appraisal Date"
                  dateFormat="yy-mm-dd"
                />
              </div>
              <div className="flex-auto">
                <label htmlFor="buttondisplay" className="font-bold text-sm ">
                  Reviewer Name
                </label>
                <Dropdown
                  value={reviewerName}
                  required
                  filter
                  id="buttondisplay"
                  onChange={(e) => setReviewerName(e.value)}
                  options={appraisalData?.reviewerlist}
                  optionLabel="userName"
                  placeholder="Reviewer"
                  className="w-full p-inputtext-sm"
                  size="small"
                />
              </div>
              <div className="flex-auto">
                <label htmlFor="buttondisplay" className="font-bold text-sm ">
                  Appraiser (Hr Dept)
                </label>
                <Dropdown
                  value={appraiserName}
                  required
                  filter
                  id="buttondisplay"
                  onChange={(e) => setAppraiserName(e.value)}
                  options={appraisalData?.appraiserlist}
                  optionLabel="userName"
                  placeholder="Appraiser (Hr Dept)"
                  className="w-full p-inputtext-sm"
                />
              </div>

              <Button
                variant="contained"
                size="small"
                type="submit"
                className="mt-2"
              >
                Submit
              </Button>
            </form>
          </div>
        </div>
      </Dialog>

      {/* Force Approved Confirm Dialog */}
      <ConfirmDialog
        className="dialogHeader dialogContent acceptButton rejectButton"
        group="declarative"
        visible={confirmDialog}
        onHide={() => setConfirmDialog(false)}
        message="Are you sure you want to proceed?"
        header="Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={handelForceApprove}
      />
      <Toast ref={toastRef} />
    </>
  );
};
export default AppraisalTracker;
