import React, { useEffect, useRef, useState } from "react";
import "../Appraisal.scss";
import { DataTable } from "primereact/datatable";
import { Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import { Column } from "primereact/column";
import { getUserData } from "../../Login/Encrypt";
import {
  appraisalApproverApi,
  appraisalFormAPI,
} from "./AppraisalsApproverAPI";
import { formatDate } from "../formatDate";
import AppraisalDialog from "../AppraisalForm";
//Toast
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import Toast from "../../../components/Toast/Toast";
//Icons
import VerifiedIcon from "@mui/icons-material/Verified";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { InputText } from "primereact/inputtext";

const AppraisalsApprover = () => {
  //For Toast
  const toastRef = useRef(null);
  const [approverList, setApproverList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appraisalFormLoading, setAppraisalFormLoading] = useState(null);
  //State for Appraisal Form Data
  const [appraisalFormData, setAppraisalFormData] = useState({});
  //Set Appraisal Form Data Visible
  const [appraisalFormVisible, setAppraisalFormVisible] = useState(false);
  const [clickFormId, setClickFormId] = useState("");
  //Filter For Data Table
  const [globalFilter, setGlobalFilter] = useState("");
   //Check Form Update Status
  const [formSubmitStatus, setFormSubmitStatus] = useState(false);

  //Call Approver API Data
  useEffect(() => {
    const fetchApproverData = async () => {
      try {
        const localStorageAuth = getUserData();
        const authToken = localStorageAuth?.token;
        const employeeName = localStorageAuth?.userDetails.userId;
        setLoading(true);
        const response = await appraisalApproverApi(authToken, employeeName);
        setLoading(false);
        console.log("appraisal_approver_api", response);
        //Set Approver List
        setApproverList(response?.data.appraisalsList);
      } catch (error) {
         setLoading(false);
        console.error("Error fetching approver data:", error);
      }
    };
    fetchApproverData();
  }, [formSubmitStatus]);

  //Handle Show Form
  const handleShowForm = async (
    formId,
    previousYearFormId,
    empId,
    appraisalDate
  ) => {
    console.log("click_formId", formId);
    try {
      setAppraisalFormLoading(formId);
      const localStorageAuth = getUserData();
      const authToken = localStorageAuth?.token;
      const response = await appraisalFormAPI(
        authToken,
        formId,
        previousYearFormId,
        empId,
        appraisalDate
      );
      if (response?.status === 200) {
        setAppraisalFormData(response?.data);
        showSuccessMessage(toastRef, "Success", "Form Submitted Successfully");
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
      <h4 className="mx-0 my-1">Appraisal Approver</h4>
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
              //Close Appraisal Form
              appraisalFormVisible={setAppraisalFormVisible}
              formSubmitStatus={setFormSubmitStatus}
            />
          )}
          <div className="cardStyle mt-2  bg-white shadow rounded">
            <DataTable
              size="small"
              stripedRows
              globalFilter={globalFilter}
              rowClassName={(rowData) => {
                if (rowData.some((ele) => ele.formId === clickFormId)) {
                  return "bgcyan-100";
                }
              }}
              header={tableHeader}
              value={approverList}
              paginator
              rows={12}
              showGridlines
              emptyMessage={
                loading ? (
                  <>
                    <LinearProgress color="inherit" />
                  </>
                ) : (
                  "No Data Found"
                )
              }
              className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
            >
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
                      loading={appraisalFormLoading === rowData.formId}
                      loadingPosition="start"
                      onClick={() =>
                        handleShowForm(
                          rowData.formId,
                          rowData.previousYearFormId,
                          rowData.empId,
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
      </div>
      <Toast ref={toastRef} />
    </>
  );
};

export default AppraisalsApprover;
