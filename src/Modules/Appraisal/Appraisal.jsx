import { Chip, Typography } from "@mui/material";
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
import { appraisalAPI, appraiserFormApi } from "./AppraisalAPI";
//Format Date
import { formatDate } from "./formatDate";

function Appraisal() {
  //For Toast
  const toastRef = useRef(null);
  //Dialog Visible State
  const [dialogVisible, setDialogVisible] = useState(false);
  //Show Form Dialog Visible State
  const [showFormDialog, setShowFormDialog] = useState(false);
  //Set Appraiser Details
  const [empName, setEmpName] = useState(null);
  const [date, setDate] = useState(null);
  const [reviewerName, setReviewerName] = useState(null);
  const [appraiserName, setAppraiserName] = useState(null);
  //API Data Set
  const [appraisalData, setAppraisalData] = useState();

  //token
  const getAuthToken = getUserData().token;

  //Form Submit Handler
  const handleSubmit = async (e) => {
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


    //reset from
    // e.target.reset();
    // // Reset state variables
    // setEmpName(null);
    // setDate(null);
    // setReviewerName(null);
    // setAppraiserName(null);


    //Save Appraiser Form Data (API)
    const response = await appraiserFormApi(appraiserFromData,getAuthToken);
    //If Date Successfully Saved
    if (response?.status == 200) {
      //Toast For Success Submitted
      showSuccessMessage(toastRef, "Success", "Form Submitted Successfully");
      //Dialog Close
      setDialogVisible(false);
    }
    else{
      showErrorMessage(toastRef, "Error", "Internal Server Error");
    }
    console.log("Response from API", response);
  };

  //temp data
  //const empList = [{ userName: "test1" }, { userName: "test2" }, { userName: "test3" }];
  //Call Api
  useEffect(() => {
      const getAppraisalData = async () => {
      try {
      const localStorageAuth = getUserData();
      const authToken = localStorageAuth.token;
      const employeeName = localStorageAuth.userDetails.sub;
      const response = await appraisalAPI(authToken, employeeName);
      setAppraisalData(response);
      console.log("set_Appraisal_data", response);  
      } catch (error) {
        console.error("Error fetching appraisal data:", error);
      }        
    };
    getAuthToken
    getAppraisalData();
  }, []);

  

  return (
    <>
      {/* Appraisal Header */}
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="card mt-4 py-2 px-3 bg-white shadow rounded">
            <div className="flex justify-between items-center">
              {/* Appraisal Dates */}
              <div className="flex items-center gap-4">
                <p className="font-medium">Last Appraisal</p>
                <Chip label="NA" color="primary" size="small" />
                <p className="font-medium">Next Appraisal</p>
                <Chip label="NA" color="primary" size="small" />
              </div>

              {/* Appraisal Form Buttons */}
              <div className="flex items-center gap-4">
                <p className="font-medium">Appraisal Form</p>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setShowFormDialog(true)}
                >
                  Show Form
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setDialogVisible(true)}
                >
                  New Form
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Appraisal Details */}
        <div className="container mx-auto mt-2">
          <TabView>
            <TabPanel header="Review Appraisals">
              <p className="m-0">Review Appraisals</p>
            </TabPanel>
            <TabPanel header="Approve Appraisals">
              <p className="m-0">Approve Appraisals</p>
            </TabPanel>
            <TabPanel header="My Previous Forms">
              <p>My Previous Forms</p>
            </TabPanel>
          </TabView>
        </div>

        {/* Appraisal Form */}
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
        <AppraisalDialog
          visible={showFormDialog}
          onClose={() => setShowFormDialog(false)}
        />
      </div>
      <Toast ref={toastRef} />
    </>
  );
}

export default Appraisal;
