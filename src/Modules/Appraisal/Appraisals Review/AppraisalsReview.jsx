import { Button, LinearProgress, Typography } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { appraisalReviewerApi, appraisalFormAPI } from "./AppraisalsReviewAPI";
import { getUserData } from "../../Login/Encrypt";
//Toast
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import Toast from "../../../components/Toast/Toast";

import "../Appraisal.scss";
import AppraisalDialog from "../AppraisalForm";
import { formatDate } from "../formatDate";

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
  const handleShowForm = async (formId) => {
    console.log("Click_formId", formId);
    setAppraisalFormVisible(false);
    setAppraisalFormLoading(formId);
    try {
      const response = await appraisalFormAPI(formId);
      if (response?.status === 200) {
        setAppraisalFormData(response?.data);
        showSuccessMessage(toastRef, "Success", "Form Submitted Successfully");
        setAppraisalFormVisible(true);
      } else {
        showErrorMessage(toastRef, "Error", "Form Not Found");
      }

      setAppraisalFormLoading(null);
      console.log("appraisalForm_api_response", response);
    } catch (error) {
      console.log(error);
    }
  };
  console.log("appraisalFormData", appraisalFormData);

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="card mt-4  bg-white shadow rounded">
            <DataTable
              size="small"
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
              <Column  header="Appraisal Date" body={(rowData)=>
                formatDate(rowData.appraisalDate)
              }></Column>
              <Column field="reviewer" header="Reviewer Name"></Column>
              <Column field="approver" header="Approver Name"></Column>
              <Column
                body={(rowData) => {
                  return (
                    <Button
                      size="small"
                      variant="contained"
                      loading={appraisalFormLoading === rowData.formId}
                      loadingPosition="start"
                      onClick={() => handleShowForm(rowData.formId)}
                    >
                      Show Form
                    </Button>
                  );
                }}
                header="Show Form"
              ></Column>
            </DataTable>
          </div>
          {appraisalFormVisible && (
            <AppraisalDialog appraiserForm={appraisalFormData} />
          )}
        </div>
      </div>
      <Toast ref={toastRef} />
    </>
  );
};
export default AppraisalsReview;
