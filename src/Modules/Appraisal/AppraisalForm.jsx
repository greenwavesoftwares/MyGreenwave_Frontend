import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Button as MuiButton } from "@mui/material";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Import Accordion
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// Style Import
import "./Appraisal.scss";
//Import PUT API
import { appraisalPutApi } from "./AppraisalAPI";

//Import React Hooks Forms
import { useForm } from "react-hook-form";
import { use } from "react";
//Import Form Table
import PerformanceScorecardDateTable from "./AppraisalForm/PerformanceScorecard";
import { showSuccessMessage } from "../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";
import CompetencyScorecard from "./AppraisalForm/CompetencyScorecard";
import FutureGoals from "./AppraisalForm/FutureGoals";
import FutureComptency from "./AppraisalForm/FutureComptency";
import MyKRA from "./AppraisalForm/My_KRA";
import MyInsights from "./AppraisalForm/My_Insights";
import { Checkbox } from "primereact/checkbox";
import { getUserData } from "../Login/Encrypt";
import LastYearGoal from "./AppraisalForm/LastYearGoal";

function AppraisalDialog({ appraiserForm ,trainingData}) {
  //For Toast
  const toastRef = useRef(null);
  const [expanded, setExpanded] = useState([]);
  //const [expandAll, setExpandAll] = useState(false);
  // State for form data
  const [expandButtonText, setExpandButtonText] = useState('expand all');

  // For performanceScorecardData
  const [performanceScorecardData, setPerformanceScorecardData] = useState([]);
  const PerformanceScorecardData = (ele) => {
    setPerformanceScorecardData(ele);
  };

  //For Competency Scorecard Data
  const [CompetencyScorecardData, setCompetencyScorecardData] = useState([]);
  const CompetencyScorecardData_Update = (ele) => {
    setCompetencyScorecardData(ele);
  };

  //For Future Goals Data
  const [FutureGoalsData, setFutureGoalsData] = useState([]);
  const FutureGoalsData_Update = (ele) => {
    setFutureGoalsData(ele);
  };

  //For Future Comptency Data
  const [FutureComptencyData, setFutureComptencyData] = useState([]);
  const FutureComptencyData_Update = (ele) => {
    setFutureComptencyData(ele);
  };

  //For My KRA Data
  const [myKRA_Data, setMyKRA_Data] = useState([]);
  const myKRA_Data_Update = (ele) => {
    setMyKRA_Data(ele);
  };

  //For My Insights Data
  const [myInsights, setMyInsights] = useState([]);
  const myInsights_Upadte = (ele) => {
    setMyInsights(ele);
  };

  //For Confirmation Reviewer and Approver
  const [reviewer, setReviewer] = useState(
    appraiserForm?.personaldetails.reviewed
  );
  const [approver, setApprover] = useState(
    appraiserForm?.personaldetails.approved
  );
  console.log("approver", approver);
  console.log("reviewer_data", approver);

  //Use React Hooks Form
  const { register, handleSubmit, reset, setValue } = useForm();

  //Make All Update Data
  const personaldetailsSubmit = async (data) => {
    console.log("object", data);
    const generatepersonaldetails = {
      form_id: appraiserForm?.form_id,
      personaldetails: data,
      Performance_ScorecardData: performanceScorecardData,
      Competency_ScorecardData: CompetencyScorecardData,
      Future_Goals: FutureGoalsData,
      Future_Comptency: FutureComptencyData,
      My_KRA: myKRA_Data,
      My_Insights: myInsights,
      Confirmation: [{ reviewer: reviewer }, { approver: approver }],
    };
    console.log("Appraisal Form Data:", generatepersonaldetails);

    try {
      const response = await appraisalPutApi(generatepersonaldetails);
      console.log("Appraisal Form Data:", response);
      if (response.status === 200) {
        showSuccessMessage(toastRef, "Success", "Form Submitted Successfully");
      } else {
        showSuccessMessage(toastRef, "Error", "Form Submission Failed");
      }
      //From Reset
      // reset();
    } catch (error) {
      console.error("personaldetails_api_Error:", error);
    }
  };

  //Set Api Value : Personal Information already save
  setValue("emp_Name", appraiserForm?.personaldetails.empName);
  setValue("emp_id", appraiserForm?.personaldetails.empCode);
  setValue("position", appraiserForm?.personaldetails.position);
  setValue("education", appraiserForm?.personaldetails.education);
  setValue("yoe_gw", appraiserForm?.personaldetails.yoe_gw);
  setValue("yoe_ngw", appraiserForm?.personaldetails.yoe_ngw);
  setValue("total_experience", appraiserForm?.personaldetails.yoe_total);
  setValue(
    "why_do_i_come_to_office",
    appraiserForm?.personaldetails.why_do_i_come_to_office
  );
  setValue(
    "current_base_salary",
    appraiserForm?.personaldetails.current_base_salary
  );
  setValue(
    "current_assued_bonus",
    appraiserForm?.personaldetails.current_assued_bonus
  );
  setValue(
    "current_performance_bonus",
    appraiserForm?.personaldetails.current_performance_bonus
  );
  setValue("current_total_ctc", appraiserForm?.personaldetails.current_total_ctc);
  setValue(
    "proposed_base_salary",
    appraiserForm?.personaldetails.proposed_base_salary
  );
  setValue(
    "proposed_assued_bonus",
    appraiserForm?.personaldetails.proposed_assued_bonus
  );
  setValue(
    "proposed_performance_bonus",
    appraiserForm?.personaldetails.proposed_performance_bonus
  );
  setValue(
    "proposed_total_ctc",
    appraiserForm?.personaldetails.proposed_total_ctc
  );

  console.log("appraiserFormFromInnerSection", appraiserForm);


  //For Expand and Collapse
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded((prevExpanded) => {
      if (isExpanded) {
        // Add the panel ID to the array if it's not already there
        return [...prevExpanded, panel];
      } else {
        // Remove the panel ID from the array if it exists
        return prevExpanded.filter((p) => p !== panel);
      }
    });
  };

//For Expand and Collapse All Button
  const handleButtonClick = () => {
    setExpandButtonText((prevText) =>
      prevText === 'expand all' ? 'collapse all' : 'expand all'
    );
    setExpanded((prevExpanded) => {
      if (prevExpanded.length === 0) {
        // Expand all panels (assuming you know the IDs)
        return ['panel1', 'panel2', 'panel3', 'panel4', 'panel5', 'panel6']; // Add all your panel IDs
      } else {
        // Collapse all panels
        return [];
      }
    });
  };


  //Reviewer
  const isReviewer = () => {
    const reviewer = appraiserForm?.reviewer;
    const userName = getUserData()?.userDetails.userId;
    console.log("form_reviewer", reviewer, userName);

    if (reviewer === userName) {
      return false;
    } else {
      return true;
    }
  };

//Is Approver
  const isApprover = () => {
    const approver = appraiserForm?.approver;
    const userName = getUserData()?.userDetails.userId;
    if (approver === userName) {
      return false;
    } else {
      return true;
    }
  };

  return (
    <>
      <div className="card mt-1 py-2 px-3 bg-white shadow rounded">
        <div
          className="flex justify-between items-center pb-1 mb-1.5 "
          style={{}}
        >
          <h1 className="text-center text-sm">Appraisal Form</h1>
          <MuiButton
            variant="contained"
            size="small"
            sx={{ boxShadow: "none" }}
            onClick={handleButtonClick}
          >
            {expandButtonText}
          </MuiButton>
        </div>

        <div>
          <form onSubmit={handleSubmit(personaldetailsSubmit)}>
            <div>
              {/* Accordion for Personal Details */}
              <Accordion 
              expanded={expanded.includes('panel1')} onChange={handleAccordionChange('panel1')}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography component="span">Personal Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InputText
                        {...register("emp_Name")}
                        id="empName"
                        className="p-inputtext-sm"
                        placeholder="Employee Name"
                      />

                      <InputText
                        id="emp_id"
                        type="number"
                        className="p-inputtext-sm"
                        {...register("emp_id")}
                        placeholder="Employee ID"
                      />

                      <InputText
                        id="position"
                        {...register("position")}
                        className="p-inputtext-sm"
                        placeholder="Position"
                      />

                      <InputText
                        id="education"
                        {...register("education")}
                        className="p-inputtext-sm"
                        placeholder="Education"
                      />

                      <InputText
                        id="yoe_gw"
                        type="number"
                        {...register("yoe_gw")}
                        className="p-inputtext-sm"
                        placeholder="Year of Experience(gw)"
                      />

                      <InputText
                        id="yoe_ngw"
                        type="number"
                        {...register("yoe_ngw")}
                        className="p-inputtext-sm"
                        placeholder="Year of Experience(non-gw)"
                      />

                      <InputText
                        id="total_experience"
                        className="p-inputtext-sm"
                        {...register("total_experience")}
                        placeholder="Total Experience"
                      />

                      <InputText
                        id="why_do_i_come_to_office"
                        {...register("why_do_i_come_to_office")}
                        className="p-inputtext-sm"
                        placeholder="Why do I come to office?"
                      />

                      <InputText
                        id="current_base_salary"
                        type="number"
                        {...register("current_base_salary")}
                        className="p-inputtext-sm"
                        placeholder="Current Base Salary"
                      />

                      <InputText
                        id="current_assued_bonus"
                        type="number"
                        {...register("current_assued_bonus")}
                        className="p-inputtext-sm"
                        placeholder="Current Assured Bonus"
                      />

                      <InputText
                        id="current_performance_bonus"
                        type="number"
                        {...register("current_performance_bonus")}
                        className="p-inputtext-sm"
                        placeholder="Current Performance Bonus"
                      />

                      <InputText
                        id="current_total_ctc"
                        type="number"
                        {...register("current_total_ctc")}
                        className="p-inputtext-sm"
                        placeholder="Current Total CTC"
                      />

                      <InputText
                        id="proposed_base_salary"
                        type="number"
                        {...register("proposed_base_salary")}
                        className="p-inputtext-sm"
                        placeholder="Proposed Base Salary"
                      />

                      <InputText
                        id="proposed_assued_bonus"
                        type="number"
                        {...register("proposed_assued_bonus")}
                        className="p-inputtext-sm"
                        placeholder="Proposed Assured Bonus"
                      />

                      <InputText
                        id="proposed_performance_bonus"
                        type="number"
                        {...register("proposed_performance_bonus")}
                        className="p-inputtext-sm"
                        placeholder="Proposed Performance Bonus"
                      />

                      <InputText
                        id="proposed_total_ctc"
                        type="number"
                        {...register("proposed_total_ctc")}
                        className="p-inputtext-sm"
                        placeholder="Proposed Total CTC"
                      />
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            </div>

            {/* Accordion for My Goals */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded.includes('panel2')} onChange={handleAccordionChange('panel2')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">My Goals</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <LastYearGoal appraiserPreviousSaveFormData={appraiserForm?.lastyeargoals}/>
                <FutureGoals
                  appraiserPreviousSaveFormDat={appraiserForm?.futuregoals}
                  FutureGoalsData={FutureGoalsData_Update}
                  trainingData={trainingData}
                />
                
              </AccordionDetails>
            </Accordion>

            {/* Accordion for My KRA */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded.includes('panel3')} onChange={handleAccordionChange('panel3')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">My KRA</Typography>
              </AccordionSummary>
              <AccordionDetails>
              <PerformanceScorecardDateTable
                  PerformanceScorecardData={PerformanceScorecardData}
                  appraiserPreviousSaveFormData={
                    appraiserForm?.performancescorecard
                  }
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                />
                 <MyKRA
                  appraiserPreviousSaveFormDat={appraiserForm?.mykra}
                  myKRA_Data={myKRA_Data_Update}
                  trainingData={trainingData}
                />
                
              </AccordionDetails>
            </Accordion>

            {/* Accordion for Training */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded.includes('panel4')} onChange={handleAccordionChange('panel4')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">My Training</Typography>
              </AccordionSummary>
              <AccordionDetails>
              <CompetencyScorecard
                  appraiserPreviousSaveFormDat={
                    appraiserForm?.competencyscorecard
                  }
                  CompetencyScorecardData={CompetencyScorecardData_Update}
                />
                <FutureComptency
                  appraiserPreviousSaveFormDat={appraiserForm?.futurecomptenct}
                  FutureComptencyData={FutureComptencyData_Update}
                  trainingData={trainingData}
                />
                
              </AccordionDetails>
            </Accordion>
            

            

            {/* My Insights*/}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded.includes('panel5')} onChange={handleAccordionChange('panel5')}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">My Insights</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MyInsights
                  appraiserPreviousSaveFormDat={appraiserForm?.myinsights}
                  myInsights_Data={myInsights_Upadte}
                />
              </AccordionDetails>
            </Accordion>

            {/* My Confirmation*/}
            <Accordion
            className="accordionNoSpace"
            expanded={expanded.includes('panel6')} onChange={handleAccordionChange('panel6')}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">Confirmation</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className="flex justify-center items-center mb-1 column-gap-4">
                  <h1 className="text-sm">Reviewer</h1>
                  <Checkbox
                    checked={reviewer === 1}
                    onChange={(e) => {
                      console.log("approver_checkbox", e);
                      setReviewer(e.checked ? 1 : 0);
                    }}
                  />
                  <h1 className="text-sm">Approver</h1>

                  <Checkbox
                    checked={approver === 1}
                    onChange={(e) => {
                      console.log("approver_checkbox", e);
                      setApprover(e.checked ? 1 : 0);
                    }}
                  />
                </div>
              </AccordionDetails>
            </Accordion>
            <MuiButton
              variant="contained"
              size="small"
              type="submit"
              className="mt-2"
            >
              Submit Form
            </MuiButton>
          </form>

          <Toast ref={toastRef} />
        </div>
      </div>
    </>
  );
}

export default AppraisalDialog;
