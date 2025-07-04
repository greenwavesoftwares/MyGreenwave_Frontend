import { Chip, LinearProgress, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import React, { useEffect, useRef, useState } from "react";
//Toast
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import Toast from "../../components/Toast/Toast";
//Import AppraisalDialog
import AppraisalDialog from "./AppraisalForm";
//SCSS Import
import "./Appraisal.scss";
//Auth Token
import { getUserData } from "../Login/Encrypt";
//Call Api
import {
  appraisalAPI,
  appraiserFormApi,
  currentAppraisalFormAPI,
  appraisalListApi,
  trainingApi,
  getPreviousAndNextAppraisalDate,
} from "./AppraisalAPI";
//Format Date
import { formatDate } from "./formatDate";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useNavigate } from "react-router-dom";
//Icons
import VerifiedIcon from "@mui/icons-material/Verified";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import InsertInvitationIcon from "@mui/icons-material/InsertInvitation";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

function Appraisal() {
  //For Navigation
  const navigate = useNavigate();
  //For Toast
  const toastRef = useRef(null);
  //Dialog Visible State
  const [dialogVisible, setDialogVisible] = useState(false);
  //Set Appraisal Form Data Visible
  const [appraisalFormVisible, setAppraisalFormVisible] = useState(false);
  //Loading For Data Table
  const [loading, setLoading] = useState(true);
  //Loading For Appraisal Form
  const [appraisalFormLoading, setAppraisalFormLoading] = useState(null);
  //Set Training Data
  const [trainingData, setTrainingData] = useState(null);

  //Set Appraiser Details
  const [empName, setEmpName] = useState(null);
  const [date, setDate] = useState(null);
  const [reviewerName, setReviewerName] = useState(null);
  const [appraiserName, setAppraiserName] = useState(null);
  //API Data Set
  const [appraisalData, setAppraisalData] = useState();
  const [appraiserForm, setAppraiserForm] = useState();
  const [appraisalList, setAppraisalList] = useState();

  //Handel Submit Dialog Close
  const [submitFormDataDialogClose, setSubmitFormDataDialogClose] =
    useState(false);

  //Set Appraisal Form ID
  const [appraisalFormId, setAppraisalFormId] = useState(null);
  //Set Form id for Show Icon
  const [currentFormId, setCurrentFormId] = useState(null);

  //token
  const getAuthToken = getUserData()?.token;
  let currentUserName = getUserData()?.userDetails.sub;

  //set appraisal form id
  const [appraisalFormID, setApraisalFormID] = useState("NA");

  //Set Previous And Next Appraisal Date
  const [previousAndNextAppraisalDate, setPreviousAndNextAppraisalDate] =
    useState({});

  //temp data
  //const empList = [{ userName: "test1" }, { userName: "test2" }, { userName: "test3" }];
  //Call Api
  useEffect(() => {
    const getAppraisalData = async () => {
      try {
        const localStorageAuth = getUserData();
        console.log("localStorageAuth", localStorageAuth);
        const authToken = localStorageAuth?.token;
        const employeeName = localStorageAuth?.userDetails.userId;
        const response = await appraisalAPI(authToken, employeeName);
        console.log("employeeName", employeeName, authToken);

        setAppraisalData(response);
        console.log("set_Appraisal_data", response);

        //List Of Appraisal Data
        const appraisalList_response = await appraisalListApi(
          authToken,
          employeeName
        );
        console.log("appraisalList", appraisalList);
        setAppraisalList(appraisalList_response?.appraisalsList);
        //For Loading
        setLoading(false);

        //Training Data
        const trainingData = await trainingApi(authToken);
        console.log("trainingData_Api", trainingData);
        setTrainingData(trainingData?.data);

        //Previous And Next Appraisal Date
        const dateOfJoin = formatDate(localStorageAuth?.userDetails.doj);
        const responsePreviousAndNextAppraisalDates =
          await getPreviousAndNextAppraisalDate(authToken, dateOfJoin);
        setPreviousAndNextAppraisalDate(
          responsePreviousAndNextAppraisalDates?.data
        );
      } catch (error) {
        console.error("Error fetching appraisal data:", error);
        if (error.message === "unauthorized") {
          navigate("/login"); //  Redirect to login on 401
        } else {
          console.error("Unexpected error:", error);
        }
      }
    };
    getAuthToken;
    currentUserName;
    getAppraisalData();
  }, []);
  console.log("reviewerName", reviewerName);

  //Tab Visible For Only Reviewer
  const listOfReviewer = appraisalData?.reviewerlist;
  console.log("listOfReviewer", listOfReviewer);

  //Check if Reviewer Name And Current USer Name Are Same
  const isReviewer = listOfReviewer?.some((ele) => {
    return ele.userID.toLowerCase() === currentUserName?.toLowerCase();
  });
  console.log("isReviewer_Check", isReviewer);

  //Tab Visible For Only Approve Appraisals
  const listOfApprove = appraisalData?.appraiserlist;
  //console.log("listOfApprove", listOfApprove);
  const isApprove = listOfApprove?.some((ele) => {
    return ele.userID.toLowerCase() === currentUserName?.toLowerCase();
  });
  console.log("isApprove", isApprove);

  //Show Appraisal Form
  const handleShowForm = async (formId, previousYearFormId, appraisalDate) => {
    console.log("Form ID", formId);
    setApraisalFormID(formId);
    setAppraisalFormLoading(formId);
    const localStorageAuth = getUserData();
    //cnosole.log("localStorageAuth", localStorageAuth);
    const authToken = localStorageAuth?.token;
    //const employeeName = localStorageAuth?.userDetails.userId;
    const appraisalFormData = await currentAppraisalFormAPI(
      formId,
      previousYearFormId,
      authToken,
      appraisalDate
    );
    console.log("appraisalFormData", appraisalFormData);
    setAppraisalFormLoading(null);

    //For Appraisal Form
    setAppraiserForm(appraisalFormData?.data);
    if (appraisalFormData?.status == 200) {
      //For Appraisal Form
      setAppraisalFormVisible(true);
      setCurrentFormId(formId);
      showSuccessMessage(toastRef, "Success", "Form Fetched Successfully");
    } else {
      showErrorMessage(
        toastRef,
        "Error",
        "Internal Server Error, Please Try Again Later"
      );
    }
  };

  return (
    <>
      {/* Appraisal Header */}
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="cardStyle mt-4 py-2.5 px-4 bg-white shadow rounded">
            <div className="flex justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg blue-icon">
                      <EmojiEventsIcon />
                    </div>
                    <div>
                      <h1 className="text-1xl font-bold text-gray-900">
                        Appraisal
                      </h1>
                      <p
                        className=" titleTextStyle"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Track and manage performance evaluations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="p-1  rounded-lg  green-icon">
                      <InsertInvitationIcon />
                    </div>
                    <div>
                      <p className="text-xs font-medium  uppercase  titleTextStyle">
                        Last Appraisal
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {previousAndNextAppraisalDate.appraisalTable
                          ?.lastAppraisalDate ?? "NA"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-lg purple-icon">
                      <TrendingUpIcon />
                    </div>
                    <div>
                      <p className="text-xs font-medium  uppercase  titleTextStyle">
                        Next Appraisal
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {previousAndNextAppraisalDate.appraisalTable
                          ?.nextAppraisalDate ?? "NA"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appraisal Form Buttons */}
              {/* <div className="flex items-center gap-4">
                <Button
                  variant="contained"
                  size="small"
                  sx={{ boxShadow: "none" }}
                  onClick={() => setDialogVisible(true)}
                >
                  New Form
                </Button>
                <p>{appraisalFormID}</p>
              </div> */}
            </div>
          </div>
        </div>

        {/* Appraisal Details */}
        {appraisalFormVisible && (
          <div className="container mx-auto mt-2">
            <AppraisalDialog
              appraiserForm={appraiserForm}
              trainingData={trainingData}
              appraisalFormVisible={setAppraisalFormVisible}
              currentFormId={setCurrentFormId}
            />
          </div>
        )}

        {/* Previous Appraisal Data */}
        <div className="cardStyle mt-2 mb-5 py-0 px-0 bg-white shadow rounded">
          <DataTable
            size="small"
            stripedRows
            header={
              <Typography className="text-sm">Appraisal Information</Typography>
            }
            value={appraisalList}
            showGridlines
            className="dataTableHeader dataTableBody dataTableBodyPadding"
            emptyMessage={
              loading ? (
                <>
                  <LinearProgress color="inherit" />
                </>
              ) : (
                "No Data Found"
              )
            }
          >
            <Column
              field="empName"
              header="Emp Name"
              body={(rowData) => {
                return (
                  <div
                    className="flex items-center gap-2"
                    style={{ justifyContent: "center" }}
                  >
                    {rowData.formId === currentFormId ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      ""
                    )}
                    <Typography variant="body2" style={{ fontSize: "0.8rem" }}>
                      {rowData.empName}
                    </Typography>
                  </div>
                );
              }}
            ></Column>
            <Column
              body={(rowData) => {
                return (
                  <>
                    <Typography variant="body2" style={{ fontSize: "0.8rem" }}>
                      {formatDate(rowData.appraisalDate)}
                    </Typography>
                  </>
                );
              }}
              header="Appraisal Date"
            ></Column>
            <Column field="reviewer" header="Reviewer Name"></Column>
            <Column field="approver" header="Approver Name"></Column>
            <Column
              body={(rowData) => {
                return (
                  <Chip
                    label={
                      rowData.approved
                        ? "Approved"
                        : rowData.reviewed
                          ? "Reviewed"
                          : rowData.active
                            ? "Active"
                            : "Inactive"
                    }
                    color={
                      rowData.approved
                        ? "primary"
                        : rowData.reviewed
                          ? "warning"
                          : rowData.active
                            ? "success"
                            : "error"
                    }
                    icon={
                      rowData.approved ? (
                        <VerifiedIcon />
                      ) : rowData.reviewed ? (
                        <VisibilityIcon />
                      ) : rowData.active ? (
                        <CheckCircleIcon />
                      ) : (
                        <CancelIcon />
                      )
                    }
                    size="small"
                  />
                );
              }}
              header="Status"
            ></Column>
            <Column
              body={(rowData) => {
                return (
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ boxShadow: "none" }}
                    disabled={rowData.formId === currentFormId}
                    startIcon={
                      rowData.formId === currentFormId ? (
                        <CheckCircleIcon />
                      ) : (
                        <VisibilityIcon />
                      )
                    }
                    loading={appraisalFormLoading === rowData.formId}
                    loadingPosition="end"
                    onClick={() =>
                      handleShowForm(
                        rowData.formId,
                        rowData.previousYearFormId,
                        rowData.appraisalDate
                      )
                    }
                  >
                    View
                  </Button>
                );
              }}
              header="Show Form"
            ></Column>
          </DataTable>
        </div>
      </div>
      <Toast ref={toastRef} />
    </>
  );
}

export default Appraisal;
