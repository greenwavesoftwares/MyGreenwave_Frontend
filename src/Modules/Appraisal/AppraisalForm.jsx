import React, { useRef, useState } from "react";
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

function AppraisalDialog({ appraiserForm }) {
  //For Toast
  const toastRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  // State for form data
  const [expandeButtonText, setExpandeButtonText] = useState("expand all");

  // For performanceScorecardData
  const [performanceScorecardData, setPerformanceScorecardData] = useState([]);
  const PerformanceScorecardData = (ele) => {
    setPerformanceScorecardData(ele);
  };

  //For Competency Scorecard Data
  const [CompetencyScorecardData, setCompetencyScorecardData] =useState([]);
  const CompetencyScorecardData_Update = (ele) => {
    setCompetencyScorecardData(ele);
  };

  //For Future Goals Data
  const [FutureGoalsData, setFutureGoalsData] = useState([]);
  const FutureGoalsData_Update=(ele)=>{
    setFutureGoalsData(ele);
  }

  //For Future Comptency Data
  const [FutureComptencyData, setFutureComptencyData] = useState([]);
  const FutureComptencyData_Update=(ele)=>{
    setFutureComptencyData(ele);
  }

  //For My KRA Data
  const [myKRA_Data, setMyKRA_Data] = useState([]);
  const myKRA_Data_Update=(ele)=>{
    setMyKRA_Data(ele);
  }

  //For My Insights Data
  const [myInsights, setMyInsights] = useState([]);
  const myInsights_Upadte=(ele)=>{
    setMyInsights(ele);
  }


  //Use React Hooks Form
  const { register, handleSubmit, reset, setValue } = useForm();

  //Make All Update Data 
  const personalDataSubmit = async (data) => {
    console.log("object", data);
    const generatePersonalData = {
      form_id: appraiserForm?.form_id,
      PersonalData: data,
      Performance_ScorecardData: performanceScorecardData,
      Competency_ScorecardData: CompetencyScorecardData,
      Future_Goals: FutureGoalsData,
      Future_Comptency: FutureComptencyData,
      My_KRA: myKRA_Data,
      My_Insights: myInsights,
    };
    console.log("Appraisal Form Data:", generatePersonalData);


    try {
      const response = await appraisalPutApi(generatePersonalData);
      console.log("Appraisal Form Data:", response);
      if (response.status === 200) {
        showSuccessMessage(
          toastRef,
          "Success",
          "Form Submitted Successfully_ Personal"
        );
      } else {
        showSuccessMessage(toastRef, "Error", "Form Submission Failed");
      }
      //From Reset
      // reset();
    } catch (error) {
      console.error("PersonalData_api_Error:", error);
    }
  };

  //Set Api Value : Personal Information already save
  setValue("emp_Name", appraiserForm?.PersonalData.emp_Name);
  setValue("emp_id", appraiserForm?.PersonalData.emp_id);
  setValue("position", appraiserForm?.PersonalData.position);
  setValue("education", appraiserForm?.PersonalData.education);
  setValue("yoe_gw", appraiserForm?.PersonalData.yoe_gw);
  setValue("yoe_ngw", appraiserForm?.PersonalData.yoe_ngw);
  setValue("total_experience", appraiserForm?.PersonalData.total_experience);
  setValue(
    "why_do_i_come_to_office",
    appraiserForm?.PersonalData.why_do_i_come_to_office
  );
  setValue(
    "current_base_salary",
    appraiserForm?.PersonalData.current_base_salary
  );
  setValue(
    "current_assued_bonus",
    appraiserForm?.PersonalData.current_assued_bonus
  );
  setValue(
    "current_performance_bonus",
    appraiserForm?.PersonalData.current_performance_bonus
  );
  setValue("current_total_ctc", appraiserForm?.PersonalData.current_total_ctc);
  setValue(
    "proposed_base_salary",
    appraiserForm?.PersonalData.proposed_base_salary
  );
  setValue(
    "proposed_assued_bonus",
    appraiserForm?.PersonalData.proposed_assued_bonus
  );
  setValue(
    "proposed_performance_bonus",
    appraiserForm?.PersonalData.proposed_performance_bonus
  );
  setValue(
    "proposed_total_ctc",
    appraiserForm?.PersonalData.proposed_total_ctc
  );

  console.log("appraiserFormFromInnerSection", appraiserForm);

  //For Expand and Collapse
  const handleClick = () => {
    setExpanded((pre) => !pre);
    setExpandeButtonText((pre) =>
      pre === "expand all" ? "collapse all" : "expand all"
    );
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
            onClick={() => handleClick}
          >
            {expandeButtonText}
          </MuiButton>
        </div>

        <div>
          <form onSubmit={handleSubmit(personalDataSubmit)}>
            <div>
              {/* Accordion for Personal Details */}
              <Accordion expanded={expanded} onChange={handleClick}>
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

            {/* Accordion for Performance Scorecard */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded}
              onChange={handleClick}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">Performance Scorecard</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PerformanceScorecardDateTable
                  PerformanceScorecardData={PerformanceScorecardData}
                  appraiserPreviousSaveFormData={
                    appraiserForm?.Performance_ScorecardData
                  }
                />
              </AccordionDetails>
            </Accordion>

            {/* Accordion for Competency Scorecard */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded}
              onChange={handleClick}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">Competency Scorecard</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CompetencyScorecard
                  appraiserPreviousSaveFormDat={
                    appraiserForm?.Competency_Scorecard
                  }
                  CompetencyScorecardData={CompetencyScorecardData_Update}
                />
              </AccordionDetails>
            </Accordion>

            {/* Accordion for Future Goals */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded}
              onChange={handleClick}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">Future Goals</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FutureGoals
                  appraiserPreviousSaveFormDat={appraiserForm?.Future_Goals}
                  FutureGoalsData={FutureGoalsData_Update}
                />
              </AccordionDetails>
            </Accordion>
            {/* Accordion for Future Goals */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded}
              onChange={handleClick}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">Future Comptency</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FutureComptency
                  appraiserPreviousSaveFormDat={appraiserForm?.Future_Comptency}
                  FutureComptencyData={FutureComptencyData_Update}
                />
              </AccordionDetails>
            </Accordion>

            {/* Accordion for My KRA */}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded}
              onChange={handleClick}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">My KRA</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MyKRA appraiserPreviousSaveFormDat={appraiserForm?.My_KRA}
                myKRA_Data={myKRA_Data_Update} />
              </AccordionDetails>
            </Accordion>

            {/* My Insights*/}
            <Accordion
              className="accordionNoSpace"
              expanded={expanded}
              onChange={handleClick}
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
                  appraiserPreviousSaveFormDat={appraiserForm?.My_Insights}
                  myInsights_Data={myInsights_Upadte}
                />
              </AccordionDetails>
            </Accordion>

            {/* My Confirmation*/}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span">Confirmation</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <h1>not ready</h1>
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
