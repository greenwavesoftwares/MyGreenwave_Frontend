import { Button, Chip, LinearProgress, Typography } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { appraisalReviewerApi, appraisalFormAPI } from "./AppraisalsReviewAPI";
import { getUserData } from "../../Login/Encrypt";
//Toast
import {
  showErrorMessage,
  showSuccessMessage,
  showInfoMessage
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

const AppraisalsReview = () => {
  //For Toast
  const toastRef = useRef(null);
  //State for Reviewer List
  const [reviewerList, setReviewerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appraisalFormLoading, setAppraisalFormLoading] = useState(null);

  //State for Appraisal Form Data
  const [appraisalFormData, setAppraisalFormData] = useState({});
  //Set Appraisal Form Data Visible
  const [appraisalFormVisible, setAppraisalFormVisible] = useState(false);
// State to trigger data fetching
  const [clickFormId, setClickFormId] = useState("");


  //Call Reviewer API
  useEffect(() => {
    const fetchReviewerData = async () => {
      try {
        const localStorageAuth = getUserData();
        //console.log("localStorageAuth", localStorageAuth);
        const authToken = localStorageAuth?.token;
        const employeeName = localStorageAuth?.userDetails.userId;
        // console.log("local_data", authToken, employeeName);
        setLoading(true);
        const response = await appraisalReviewerApi(authToken, employeeName);
        console.log("appraisal_reviewer_api", response);
        setLoading(false);
        //Set Reviewer List
        setReviewerList(response?.data.appraisalsList);
      } catch (error) {
        console.error("Error fetching reviewer data:", error);
      }
    };
    fetchReviewerData();
  }, []);


  

  //Handle Show Form
  const handleShowForm = async (formId, previousYearFormId, empId,appraisalDate) => {
    console.log("Click_formId", formId);
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

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto mt-4">
          {appraisalFormVisible && (
            <AppraisalDialog appraiserForm={appraisalFormData} />
          )}
          <div className="card mt-2 bg-white shadow rounded">
            <DataTable
              size="small"
              paginator
              rows={10}
              rowClassName={(rowData) => {
                if (rowData.some((ele) => ele.formId === clickFormId)) {
                  return "bg-cyan-100";
                }
              }}
              owsPerPageOptions={[10, 15, 20, 25]}
              stripedRows
              header={
                <Typography className="text-sm">Appraisal Reviewer</Typography>
              }
              value={reviewerList}
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
              <Column field="empName" header="Employee Name"></Column>
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
                      //sx={{borderRadius: "1rem",boxShadow: "none"}}
                      loading={appraisalFormLoading === rowData.formId}
                      loadingPosition="start"
                      onClick={(e) =>{
                        e.preventDefault()
                        handleShowForm(
                          rowData.formId,
                          rowData.previousYearFormId,
                          rowData.empId,
                          rowData.appraisalDate
                        )

                      }
                      }
                    >
                      Show Form
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
