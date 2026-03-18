import { Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { appraisalReviewerApi, appraisalFormAPI } from "./AppraisalsReviewAPI";
import { getUserData } from "../../Login/Encrypt";
//Toast
import {
  showErrorMessage,
  showSuccessMessage,
  showInfoMessage,
} from "../../../components/Toast/ShowMessage";
import Toast from "../../../components/Toast/Toast";

import "../Appraisal.scss";
import AppraisalDialog from "../AppraisalForm";
import { formatDate } from "../formatDate";
//Icons
import VerifiedIcon from "@mui/icons-material/Verified";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { InputText } from "primereact/inputtext";
import { trainingApi } from "../AppraisalAPI";

const AppraisalsReview = () => {
  //For Toast
  const toastRef = useRef(null);
  //State for Reviewer List
  const [reviewerList, setReviewerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appraisalFormLoading, setAppraisalFormLoading] = useState(null);
  //Filter For Data Table
  const [globalFilter, setGlobalFilter] = useState("");

  //State for Appraisal Form Data
  const [appraisalFormData, setAppraisalFormData] = useState({});
  //Set Appraisal Form Data Visible
  const [appraisalFormVisible, setAppraisalFormVisible] = useState(false);
  // State to trigger data fetching
  const [clickFormId, setClickFormId] = useState("");
  //Check Form Update Status
    const [formSubmitStatus, setFormSubmitStatus] = useState(false);

  //NOTE Set Training Data
  const [trainingData, setTrainingData] = useState(null);

  //Call Reviewer API
  useEffect(() => {
    const fetchReviewerData = async () => {
      try {
        const localStorageAuth = getUserData();
        const authToken = localStorageAuth?.token;
        const employeeName = localStorageAuth?.userDetails.userId;
        setLoading(true);
        const response = await appraisalReviewerApi(authToken, employeeName);
        console.log("appraisal_reviewer_api", response);
        //Training list api call
        const trainingResponse = await trainingApi(authToken);
        console.log("trainingResponse",trainingResponse);

        setLoading(false);
        //Set Reviewer List
        setReviewerList(response?.data.appraisalsList);
        //Set Training List
        setTrainingData(trainingResponse?.data)
      } catch (error) {
        console.error("Error fetching reviewer data:", error);
      }
    };
    fetchReviewerData();
  }, [formSubmitStatus]);

  //Handle Show Form
  const handleShowForm = async (
    formId,
    previousYearFormId,
    empId,
    appraisalDate
  ) => {
    //console.log("Click_formId", formId);
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    setAppraisalFormVisible(false);
    setAppraisalFormLoading(formId);
    try {
      const response = await appraisalFormAPI(
        authToken,
        formId,
        previousYearFormId,
        empId,
        appraisalDate
      );
      if (response?.status === 200) {
        setAppraisalFormData(response?.data);
        showInfoMessage(toastRef, `${empId}`, "Form Fetched Successfully");
        setAppraisalFormVisible(true);
        setClickFormId(formId);
      } else {
        showErrorMessage(toastRef, "Error", "Form Not Found");
      }

      setAppraisalFormLoading(null);
      console.log("appraisalForm_api_response", response);
    } catch (error) {
      console.log(error);
    }
  };
  //console.log("appraisalFormData", appraisalFormData);
  //console.log("clickFormId", clickFormId);

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
      <h4 className="mx-0 my-1">Appraisal Reviewer</h4>
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

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto mt-4">
          {appraisalFormVisible && (
            <AppraisalDialog
              appraiserForm={appraisalFormData}
              trainingData={trainingData}
              //Close Appraisal Form
              appraisalFormVisible={setAppraisalFormVisible}
              formSubmitStatus={setFormSubmitStatus}
            />
          )}
          <div className="cardStyle mt-2 bg-white shadow rounded">
            <DataTable
              size="small"
              paginator
              globalFilter={globalFilter}
              rows={12}
              rowClassName={(rowData) => {
                if (rowData.some((ele) => ele.formId === clickFormId)) {
                  return "bgcyan-100";
                }
              }}
              owsPerPageOptions={[10, 15, 20, 25]}
              stripedRows
              header={tableHeader}
              value={reviewerList}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
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
              {/* <Column field="empName" header="Employee Name"></Column> */}
              <Column
                field="empName"
                header="Employee Name"
                body={(rowData) => {
                  return (
                    <div
                      className="flex items-center gap-2"
                      style={{ justifyContent: "center" }}
                    >
                      {rowData.formId === clickFormId ? (
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: "1rem", color: "#4bad50" }}
                        />
                      ) : (
                        ""
                      )}
                      <Typography
                        variant="body2"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {rowData.empName}
                      </Typography>
                    </div>
                  );
                }}
              ></Column>
              <Column
                header="Appraisal Date"
                body={(rowData) => formatDate(rowData.appraisalDate)}
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
                          ? "info"
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
                      startIcon={<VisibilityIcon />}
                      //sx={{borderRadius: "1rem",boxShadow: "none"}}
                      loading={appraisalFormLoading === rowData.formId}
                      loadingPosition="start"
                      onClick={(e) => {
                        e.preventDefault();
                        handleShowForm(
                          rowData.formId,
                          rowData.previousYearFormId,
                          rowData.empId,
                          rowData.appraisalDate
                        );
                      }}
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
      </div>
      <Toast ref={toastRef} />
    </>
  );
};
export default AppraisalsReview;
