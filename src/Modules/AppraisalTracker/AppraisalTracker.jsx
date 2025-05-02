import {
  Backdrop,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
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
} from "./AppraisalTrackerAPI";

//Inner Component
import { formatDate } from "../Appraisal/formatDate";
import AppraisalDialog from "../Appraisal/AppraisalForm";
import { getUserData } from "../Login/Encrypt";

const AppraisalTracker = () => {
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

  //Call All Appraisal List API
  useEffect(() => {
    const getAllAppraisal = async () => {
      try {
        const localStorageAuth = getUserData();
        const authToken = localStorageAuth?.token;
        //setLoader(true);
        const response = await getAllAppraisalData(authToken);
        console.log("allAppraisalListData", response);
        //Training Data
        const trainingData = await trainingApi(authToken);
        console.log("trainingData_Api", trainingData);
        setTrainingData(trainingData?.data);

        //Set DataTable Data
        if (response.status === 200) {
          setLoader(false);
          setAllAppraisalList(response?.data.appraisalsList);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getAllAppraisal();
  }, []);

  //Handel Click employee from data
  const handleShowForm = async (formId, previousYearFormId, empId) => {
    console.log("formId", formId);
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    setShowFormLoader(true);
    const getAppraisalFormData = await appraisalFormAPI(
      authToken,
      formId,
      previousYearFormId,
      empId
    );
    //console.log("getAppraisalFormData",getAppraisalFormData);
    if (getAppraisalFormData?.status == 200) {
      //For Appraisal Form
      setShowFormLoader(false);
      setAppraiserForm(getAppraisalFormData?.data);
      setAppraisalFormVisible(true);
    } else {
      setAppraisalFormVisible(false);
    }
  };

  //Handel Click Excel Download
  const handelExcelDownload=async(formId,previousYearFormId,empId)=>{
    const localStorageAuth = getUserData();
    const authToken = localStorageAuth?.token;
    const excelDownload=await appraisalFormExcelDownload (authToken,formId,previousYearFormId,empId)
    console.log("excelDownload",excelDownload);

  }
  return (
    <>
      <div className="container mx-auto px-4">
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
              header={
                <Typography className="text-sm">All Appraisals</Typography>
              }
              value={allAppraisalList}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding"
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
                          rowData.empId
                        )
                      }
                      aria-label="VisibilityIcon"
                      color="info"
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
                    <Button
                      sx={{ boxShadow: "none" }}
                      size="small"
                      color="success"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() =>
                        handelExcelDownload(
                          rowData.formId,
                          rowData.previousYearFormId,
                          rowData.empId
                        )
                      }
                      //onClick={handelExcelDownload}
                    >
                      Download
                    </Button>
                  );
                }}
                header="Excel Download"
              ></Column>
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
};
export default AppraisalTracker;
