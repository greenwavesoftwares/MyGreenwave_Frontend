import { Chip, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import React, { useState } from "react";
import ApprisaDialog from "./AppraisalForm";
import "./Appraisal.scss";

function Appraisal() {
  //Dialog Visible State
  const [dialogVisible, setDialogVisible] = useState(false);
//Show Form Dialog Visible State
  const [showFormDialog, setShowFormDialog] = useState(false);

  //Set Appraiser Details
  const [empName, setEmpName] = useState(null);
  const [date, setDate] = useState(null);
  const [reviewerName, setReviewerName] = useState(null);
  const [appraiserName, setAppraiserName] = useState(null);

  //Form Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const appraiserFromData = [
      {
        emp_name: empName.name,
        LastUpdated: date,
        reviewerName: reviewerName.name,
        appraiserName: appraiserName.name,
      },
    ];
    console.log("Form submitted", appraiserFromData);

    //setDialogVisible(true);
  };

  //temp data
  const empList = [{ name: "test1" }, { name: "test2" }, { name: "test3" }];
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
                <Button variant="contained" size="small" onClick={() => setShowFormDialog(true)}>
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
                    options={empList}
                    optionLabel="name"
                    placeholder="Employee Name"
                    className="w-full"
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
                    className="w-full"
                    placeholder="Appraisal Date"
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
                    options={empList}
                    optionLabel="name"
                    placeholder="Reviewer"
                    className="w-full"
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
                    options={empList}
                    optionLabel="name"
                    placeholder="Appraiser (Hr Dept)"
                    className="w-full"
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
        <ApprisaDialog visible={showFormDialog} onClose={()=>setShowFormDialog(false)} />

      </div>
    </>
  );
}

export default Appraisal;
