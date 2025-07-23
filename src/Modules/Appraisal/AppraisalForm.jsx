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
import CircleIcon from '@mui/icons-material/Circle';
// Style Import
import "./Appraisal.scss";
//Import PUT API
import { appraisalPutApi } from "./AppraisalAPI";

//Import React Hooks Forms
import { useForm } from "react-hook-form";
import { use } from "react";
//Import Form Table
import PerformanceScorecardDateTable from "./AppraisalForm/PerformanceScorecard";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";
import CompetencyScorecard from "./AppraisalForm/CompetencyScorecard";
import FutureGoals from "./AppraisalForm/FutureGoals";
import FutureComptency from "./AppraisalForm/FutureComptency";
import MyKRA from "./AppraisalForm/My_KRA";
import MyInsights from "./AppraisalForm/My_Insights";
import { Checkbox } from "primereact/checkbox";
import { getUserData } from "../Login/Encrypt";
import LastYearGoal from "./AppraisalForm/LastYearGoal";
//For Icon
import PersonIcon from "@mui/icons-material/Person";
import DoneIcon from "@mui/icons-material/Done";
import InsightsIcon from "@mui/icons-material/Insights";
import SchoolIcon from "@mui/icons-material/School";
import BarChartIcon from "@mui/icons-material/BarChart";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import { useLocation, useNavigate } from "react-router-dom";
import CalculatePercentage from "./CalculatePercentage";


function AppraisalDialog({ appraiserForm, trainingData,appraisalFormVisible,currentFormId }) {
  //For Toast
  const toastRef = useRef(null);
  //Change Value Track
  const [trackFutureGoals,setTrackFutureGoals]=useState(false)
  const [trackPerformance,setTrackPerformance]=useState(false)
  const [trackMyKRA,setTrackMyKRA]=useState(false)
  const [trackCompetencyScorecard,setTrackCompetencyScorecard]=useState(false)
  const [trackFutureComptency,setTrackFutureComptency]=useState(false)
  const [trackMyInsights,setTrackMyInsights]=useState(false)

  //Submit From Loader
  const [loader, setLoader] = useState(false);
  

  console.log("select_appraiserForm", appraiserForm.myinsights);

  //For Personal Details Compare Check
  const [comparePersonalData,setComparePersonalData]=useState(false)
  //Compare Form Data 
  const [updateFormDataTrack,setUpdateFormDataTrack]=useState(null);
  const [expanded, setExpanded] = useState([]);
  //const [expandAll, setExpandAll] = useState(false);
  // State for form data
  const [expandButtonText, setExpandButtonText] = useState("expand all");

  

  // For performanceScorecardData
  const [performanceScorecardData, setPerformanceScorecardData] = useState([]);
  const PerformanceScorecardData = (ele) => {
    console.log("SavePerformanceScorecardData", ele);
    const updatedData = ele.map((item) => {
      return {
        // Add any additional properties you want to include in the updated data
        record_id: item.record_id ?? "",
        form_id: item.form_id ?? appraiserForm?.personaldetails.formId,
        previous: item.previous ?? false,
        ...item,
      };
    });
    //setPerformanceScorecardData(updatedData);
   
    //Nullify the data if it is empty
    setPerformanceScorecardData(
      updatedData.filter((ele) => {
        return ele?.appraisalTraining.length != 0  || ele?.level_of_fullfillment !==null || ele?.my_last_year_KRA !=="";
      })
    );
  };

  //For Competency Scorecard Data
  const [CompetencyScorecardData, setCompetencyScorecardData] = useState([]);
  const CompetencyScorecardData_Update = (ele) => {
    const updatedData = ele.map((item) => {
      return {
        // Add any additional properties you want to include in the updated data
        record_id: item.record_id ?? "",
        form_id: item.form_id ?? appraiserForm?.personaldetails.formId,
        previous: item.previous ?? false,
        ...item,
      };
    });
    setCompetencyScorecardData(updatedData);
    console.log("setCompetencyScorecardData",updatedData);
  };

  //For Future Goals Data
  const [FutureGoalsData, setFutureGoalsData] = useState([]);
  const FutureGoalsData_Update = (ele) => {
    const updatedData = ele.map((item) => {
      return {
        // Add any additional properties you want to include in the updated data
        record_id: item.record_id ?? "",
        form_id: item.form_id ?? appraiserForm?.personaldetails.formId,
        ...item,
      };
    });
    //setFutureGoalsData(updatedData);

    //Nullify the data if it is empty
    setFutureGoalsData(
      updatedData.filter((ele) => {
        return ele?.appraisalTraining.length != 0  || ele?.goalType !==null || ele?.future_personal_KRA_goals!=="";
      })
    );
  };

  //For Future Comptency Data
  const [FutureComptencyData, setFutureComptencyData] = useState([]);
  const FutureComptencyData_Update = (ele) => {
    const updatedData = ele.map((item) => {
      return {
        // Add any additional properties you want to include in the updated data
        record_id: item.record_id ?? "",
        form_id: item.form_id ?? appraiserForm?.personaldetails.formId,
        level_of_fullfillment: item.level_of_fullfillment ?? "",
        goalType: item.goalType ?? "",
        ...item,
      };
    });
    setFutureComptencyData(updatedData);
  };

  //For My KRA Data
  const [myKRA_Data, setMyKRA_Data] = useState([]);
  const myKRA_Data_Update = (ele) => {
    const updatedData = ele.map((item) => {
      return {
        // Add any additional properties you want to include in the updated data
        record_id: item.record_id ?? "",
        form_id: item.form_id ?? appraiserForm?.personaldetails.formId,
        ...item,
      };
    });
    //setMyKRA_Data(updatedData);
     //Nullify the data if it is empty
    setMyKRA_Data(
      updatedData.filter((ele) => {
        return  ele?.appraisalTraining.length != 0  || ele?.my_next12month_KRA !=="";
      })
    );
  };

  //For My Insights Data
  const [myInsights, setMyInsights] = useState([]);
  console.log("myInsights_CurrentData", myInsights);
  const myInsights_Upadte = (ele) => {
    const updatedData = ele.map((item) => {
      return {
        // Add any additional properties you want to include in the updated data
        record_id: item.record_id ?? "",
        form_id: item.form_id ?? appraiserForm?.personaldetails.formId,
        ...item,
      };
    });
    //Nullify the data if it is empty
    setMyInsights(
      updatedData.filter((ele) => {
        return ele?.my_ideas !== "" || ele?.my_contribution_plans !== "";
      })
    );
    //setMyInsights(updatedData)
  };

  //For Confirmation Reviewer and Approver
  //const [reviewer, setReviewer] = useState(false);
  // useEffect(() => {
  //   setReviewer(appraiserForm?.personaldetails.reviewed);
  // }, [appraiserForm,setValue]);

  // const [approver, setApprover] = useState();
  // useEffect(() => {
  //   setApprover(appraiserForm?.personaldetails.approved);
  // }, [appraiserForm]); ///[appraiserForm] last change

  //console.log("reviewer_Click", reviewer);
  // console.log(
  //   "reviewer_data",
  //   appraiserForm?.personaldetails.reviewed,
  //   reviewer
  // );

  //Use React Hooks Form
  const { register, handleSubmit, reset, setValue, getValues, watch } =
    useForm();

  //Make All Update Data
  const personaldetailsSubmit = async (data) => {
    setLoader(true)
    console.log("object", data);
    const generatepersonaldetails = {
      personaldetails: data,
      performancescorecard: performanceScorecardData,
      competencyscorecard: CompetencyScorecardData,
      futuregoals: FutureGoalsData,
      futurecomptency: FutureComptencyData,
      mykra: myKRA_Data,
      myinsights: myInsights,
      lastyeargoals: appraiserForm?.lastyeargoals,
      confirmation: { reviewed: data.reviewed, approved: data.approved },
      appraisalDate: appraiserForm?.appraisalDate,
    };
    console.log("AppraisalForm_Save_Data:", generatepersonaldetails);
    //
    

    try {
      const localStorageAuth = getUserData();

      const authToken = localStorageAuth?.token;
      const response = await appraisalPutApi(
        generatepersonaldetails,
        authToken
      );
      console.log("Appraisal Form Data:", response);
      if (response.status === 201) {
        showSuccessMessage(toastRef, "Success", "Form Submitted Successfully");
        setLoader(false);
        appraisalFormVisible(false)
        currentFormId(null)
        //alert("Form Submitted Successfully")
      } else {
        showErrorMessage(toastRef, "Error", "Form Submission Failed");
      }
      //From Reset
      // reset();
    } catch (error) {
      console.error("personaldetails_api_Error:", error);
    }
  };

  //React Hook Form On Change Watch Value
  const [
    current_base_salary,
    proposed_base_salary,
    current_assued_bonus,
    proposed_assued_bonus,
    current_performance_bonus,
    proposed_performance_bonus,
    current_total_ctc,
    proposed_total_ctc
    
  ] = watch([
    "current_base_salary",
    "proposed_base_salary",
    "current_assued_bonus",
    "proposed_assued_bonus",
    "current_performance_bonus",
    "proposed_performance_bonus",
    "current_total_ctc",
    "proposed_total_ctc"
    
  ]);

  //Base Salary
  const currentBaseSalary_WatchValue = current_base_salary;
  const proposedBaseSalary_WatchValue = proposed_base_salary;
  //Proposed Salary
  const proposedAssuedBonus_WatchValue = proposed_assued_bonus;
  const currentAssuedBonus_WatchValue = current_assued_bonus;
  //Performance Salary
  const currentPerformanceBonus_WatchValue = current_performance_bonus;
  const proposedPerformanceBonus_WatchValue = proposed_performance_bonus;
  //Total CTC
  const currentTotalCTC_WatchValue = current_total_ctc;
  const proposedTotalCTC_WatchValue = proposed_total_ctc;

  // console.log(
  //   "current_base_salary",
  //   currentBaseSalary_WatchValue,
  //   proposedBaseSalary_WatchValue
  // );

  //Set Api Value : Personal Information already
  useEffect(() => {
    if (appraiserForm) {
      setValue("formId", appraiserForm?.personaldetails.formId);
      setValue("empId", appraiserForm?.personaldetails.empId);
      setValue("empName", appraiserForm?.personaldetails.empName);
      setValue("empCode", appraiserForm?.personaldetails.empCode);
      setValue("position", appraiserForm?.personaldetails.position);
      setValue("education", appraiserForm?.personaldetails.education);
      setValue("yoe_gw", appraiserForm?.personaldetails.yoe_gw);
      setValue("yoe_ngw", appraiserForm?.personaldetails.yoe_ngw);
      setValue(
        "yoe_total",
        appraiserForm?.personaldetails.yoe_gw +
          appraiserForm?.personaldetails.yoe_ngw
      );
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
      setValue(
        "current_total_ctc",
        appraiserForm?.personaldetails.current_total_ctc
      );
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
      //Apt Call Value set
      setValue("my_signature", appraiserForm?.personaldetails.my_signature);
      setValue(
        "appraiser_signature",
        appraiserForm?.personaldetails.appraiser_signature
      );
      setValue(
        "reviewer_signature",
        appraiserForm?.personaldetails.reviewer_signature
      );
      setValue("lastUpdateBy", appraiserForm?.personaldetails.lastUpdateBy);
      setValue("updateDate", appraiserForm?.personaldetails.updateDate);
      setValue("reviewer", appraiserForm?.personaldetails.reviewer);
      setValue("approver", appraiserForm?.personaldetails.approver);
      setValue("reviewed", appraiserForm?.personaldetails.reviewed);
      setValue("approved", appraiserForm?.personaldetails.approved);
      setValue("doj", appraiserForm?.personaldetails.doj);
    }
  }, [appraiserForm, setValue]);

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
      prevText === "expand all" ? "collapse all" : "expand all"
    );
    setExpanded((prevExpanded) => {
      if (prevExpanded.length === 0) {
        // Expand all panels (assuming you know the IDs)
        return ["panel1", "panel2", "panel3", "panel4", "panel5", "panel6"]; // Add all your panel IDs
      } else {
        // Collapse all panels
        return [];
      }
    });
  };

  //Is Reviewer
  const isReviewer = () => {
    const reviewer = (appraiserForm?.personaldetails.reviewer).toLowerCase();
    const userName = getUserData()?.userDetails.userId.toLowerCase();
    //console.log("form_reviewer", reviewer, userName);
    if (reviewer === userName) {
      return false;
    } else {
      return true;
    }
  };

  //Is Approver
  const isApprover = () => {
    const approver = (appraiserForm?.personaldetails.approver).toLowerCase();
    const userName = getUserData()?.userDetails.userId.toLowerCase();
    //console.log("form_approver", approver, userName);
    if (approver === userName) {
      return false;
    } else {
      return true;
    }
  };

  //IS Form Disable or Enable Function
  const navigate = useNavigate();
  const isFormDisabled = () => {
    //For User
    if (
      (appraiserForm?.personaldetails.reviewed ||
        appraiserForm?.personaldetails.approved) &&
      appraiserForm?.personaldetails.empId.toLowerCase() ===
        getUserData()?.userDetails.userId.toLowerCase()
    ) {
      return true;
    }
    //For Reviewer Section
    else if (
      (appraiserForm?.personaldetails.reviewed ||
        appraiserForm?.personaldetails.approved) &&
      appraiserForm?.personaldetails.reviewer.toLowerCase() ===
        getUserData()?.userDetails.userId.toLowerCase()
    ) {
      return true;
    } else if (
      appraiserForm?.personaldetails.approved &&
      appraiserForm?.personaldetails.approver.toLowerCase() ===
        getUserData()?.userDetails.userId.toLowerCase()
    ) {
      return true;
    } else {
      return false;
    }
  };

  //Find appraisal-tracker end point
  const location = useLocation();
  // Check if current path is `/appraisal-tracker`
  const isTrackerPage = location.pathname === "/AppraisalTracker";




  //Compare Previous and Current Change 
  const savePrevious_PersonalDetails = 
  [
    appraiserForm?.personaldetails.position,
    appraiserForm?.personaldetails.education,
    appraiserForm?.personaldetails.yoe_gw,
    appraiserForm?.personaldetails.yoe_ngw,
    appraiserForm?.personaldetails.why_do_i_come_to_office,
    appraiserForm?.personaldetails.current_base_salary,
    appraiserForm?.personaldetails.proposed_base_salary,
    appraiserForm?.personaldetails.current_assued_bonus,
    appraiserForm?.personaldetails.proposed_assued_bonus,
    appraiserForm?.personaldetails.current_performance_bonus,
    appraiserForm?.personaldetails.proposed_performance_bonus,
    appraiserForm?.personaldetails.current_total_ctc,
    appraiserForm?.personaldetails.proposed_total_ctc
  ]
  const onChange_PersonalDetails=
    watch([
    "position",
    "education",
    "yoe_gw",
    "yoe_ngw",
    "why_do_i_come_to_office",
    "current_base_salary",
    "proposed_base_salary",
    "current_assued_bonus",
    "proposed_assued_bonus",
    "current_performance_bonus",
    "proposed_performance_bonus",
    "current_total_ctc",
    "proposed_total_ctc"
  ])
  
  //console.log("onChange_PersonalDetails",savePrevious_PersonalDetails, onChange_PersonalDetails);
  const compareData = (previous, current) => {
  const isEqual = JSON.stringify(previous) === JSON.stringify(current);
//console.log("Comparison result:", !isEqual);
  setComparePersonalData(!isEqual)
  return isEqual;
};
  useEffect(()=>{
    compareData(savePrevious_PersonalDetails,onChange_PersonalDetails)
  },[onChange_PersonalDetails])



  //Compare For My Goal Data
  //const myGoal_PreviousData=appraiserForm.futuregoals;
  //console.log('myGoal_PreviousData',FutureGoalsData);
  //console.log("trackMyKRA",trackMyKRA);

  return (
    <>
      <div className="cardStyle mt-1 py-2 px-3 bg-white shadow rounded">
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
                expanded={expanded.includes("panel1")}
                onChange={handleAccordionChange("panel1")}
                className="accordionStyle"
              >
                <AccordionSummary
                  expandIcon={
                    <>
                    
                    <ExpandMoreIcon className="ExpandMoreIconStyle" />
                    
                    </>
                  }
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography
                    component="span"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <PersonIcon
                      fontSize="small"
                      className="accordionIconBGStyle"
                    />
                    Personal Details
                    {comparePersonalData ?<CircleIcon color="warning" sx={{fontSize:"0.62rem"}}/>: ""}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="empName"
                          >
                            Employee Name
                          </label>
                          <InputText
                            {...register("empName")}
                            id="empName"
                            disabled
                            variant="filled"
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Employee Name"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="empCode"
                          >
                            Employee Code
                          </label>
                          <InputText
                            id="empCode"
                            type="number"
                            variant="filled"
                            disabled
                            className="p-inputtext-sm inputFieldStyle"
                            {...register("empCode")}
                            placeholder="Employee ID"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="position"
                          >
                            Position
                          </label>
                          <InputText
                            id="position"
                            {...register("position")}
                            className="p-inputtext-sm inputFieldStyle"
                            //placeholder="Position"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="education"
                          >
                            Education
                          </label>
                          <InputText
                            id="education"
                            {...register("education")}
                            className="p-inputtext-sm inputFieldStyle"
                            //placeholder="Education"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="yoe_gw"
                          >
                            Year of Experience (GW)
                          </label>
                          <InputText
                            id="yoe_gw"
                            type="number"
                            {...register("yoe_gw", {
                              onChange: (e) => {
                                const gw = parseFloat(e.target.value) || 0;
                                setValue(
                                  "yoe_total",
                                  gw + parseFloat(getValues("yoe_ngw")) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Year of Experience(gw)"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="yoe_ngw"
                          >
                            Year of Experience (Non-GW)
                          </label>
                          <InputText
                            id="yoe_ngw"
                            type="number"
                            {...register("yoe_ngw", {
                              onChange: (e) => {
                                const ngw = parseFloat(e.target.value) || 0;
                                setValue(
                                  "yoe_total",
                                  ngw + parseFloat(getValues("yoe_gw")) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Year of Experience(non-gw)"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="yoe_total"
                          >
                            Total Experience
                          </label>
                          <InputText
                            id="yoe_total"
                            disabled
                            className="p-inputtext-sm inputFieldStyle"
                            {...register("yoe_total")}
                            placeholder="yoe_total"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="why_do_i_come_to_office"
                          >
                            Why do I come to office?
                          </label>
                          <InputText
                            id="why_do_i_come_to_office"
                            {...register("why_do_i_come_to_office")}
                            className="p-inputtext-sm inputFieldStyle"
                            //placeholder="Why do I come to office?"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="current_base_salary"
                          >
                            Current Base Salary
                          </label>
                          <InputText
                            id="current_base_salary"
                            type="number"
                            {...register("current_base_salary", {
                              onChange: (e) => {
                                const baseSalary =
                                  parseFloat(e.target.value) || 0;
                                setValue(
                                  "current_total_ctc",
                                  baseSalary +
                                    parseFloat(
                                      getValues("current_assued_bonus")
                                    ) +
                                    parseFloat(
                                      getValues("current_performance_bonus")
                                    ) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Current Base Salary"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="current_assued_bonus"
                          >
                            Current Assured Bonus
                          </label>
                          <InputText
                            id="current_assued_bonus"
                            type="number"
                            {...register("current_assued_bonus", {
                              onChange: (e) => {
                                const assuredBonus =
                                  parseFloat(e.target.value) || 0;
                                setValue(
                                  "current_total_ctc",
                                  assuredBonus +
                                    parseFloat(
                                      getValues("current_base_salary")
                                    ) +
                                    parseFloat(
                                      getValues("current_performance_bonus")
                                    ) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Current Assured Bonus"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="current_performance_bonus"
                          >
                            Current Performance Bonus
                          </label>
                          <InputText
                            id="current_performance_bonus"
                            type="number"
                            {...register("current_performance_bonus", {
                              onChange: (e) => {
                                const performanceBonus =
                                  parseFloat(e.target.value) || 0;
                                setValue(
                                  "current_total_ctc",
                                  performanceBonus +
                                    parseFloat(
                                      getValues("current_base_salary")
                                    ) +
                                    parseFloat(
                                      getValues("current_assued_bonus")
                                    ) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Current Performance Bonus"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="current_total_ctc"
                          >
                            Current Total Ctc
                          </label>
                          <InputText
                            id="current_total_ctc"
                            disabled
                            type="number"
                            {...register("current_total_ctc")}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Current Total CTC"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="proposed_base_salary"
                          >
                            Proposed Base Salary
                            <CalculatePercentage
                              current={currentBaseSalary_WatchValue}
                              proposed={proposedBaseSalary_WatchValue}
                            />
                          </label>
                          <InputText
                            id="proposed_base_salary"
                            type="number"
                            {...register("proposed_base_salary", {
                              onChange: (e) => {
                                const baseSalary =
                                  parseFloat(e.target.value) || 0;
                                setValue(
                                  "proposed_total_ctc",
                                  baseSalary +
                                    parseFloat(
                                      getValues("proposed_assued_bonus")
                                    ) +
                                    parseFloat(
                                      getValues("proposed_performance_bonus")
                                    ) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Proposed Base Salary"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="proposed_assued_bonus"
                          >
                            Proposed Assured Bonus{" "}
                            <CalculatePercentage
                              current={currentAssuedBonus_WatchValue}
                              proposed={proposedAssuedBonus_WatchValue}
                            />
                          </label>
                          <InputText
                            id="proposed_assued_bonus"
                            type="number"
                            {...register("proposed_assued_bonus", {
                              onChange: (e) => {
                                const assuredBonus =
                                  parseFloat(e.target.value) || 0;
                                setValue(
                                  "proposed_total_ctc",
                                  assuredBonus +
                                    parseFloat(
                                      getValues("proposed_base_salary")
                                    ) +
                                    parseFloat(
                                      getValues("proposed_performance_bonus")
                                    ) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Proposed Assured Bonus"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="proposed_performance_bonus"
                          >
                            Proposed Performance Bonus 
                             <CalculatePercentage
                              current={currentPerformanceBonus_WatchValue}
                              proposed={proposedPerformanceBonus_WatchValue}
                            />
                          </label>
                          <InputText
                            id="proposed_performance_bonus"
                            type="number"
                            {...register("proposed_performance_bonus", {
                              onChange: (e) => {
                                const performanceBonus =
                                  parseFloat(e.target.value) || 0;
                                setValue(
                                  "proposed_total_ctc",
                                  performanceBonus +
                                    parseFloat(
                                      getValues("proposed_base_salary")
                                    ) +
                                    parseFloat(
                                      getValues("proposed_assued_bonus")
                                    ) || 0
                                );
                              },
                            })}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Proposed Performance Bonus"
                          />
                        </div>
                      </div>

                      <div className="card flex justify-content-center">
                        <div className="flex flex-column">
                          <label
                            style={{ fontSize: "12px", marginLeft: "5px" }}
                            htmlFor="proposed_total_ctc"
                          >
                            Proposed Total CTC
                            <CalculatePercentage
                              current={currentTotalCTC_WatchValue}
                              proposed={proposedTotalCTC_WatchValue}
                            />
                          </label>
                          <InputText
                            id="proposed_total_ctc"
                            disabled
                            type="number"
                            {...register("proposed_total_ctc")}
                            className="p-inputtext-sm inputFieldStyle"
                            placeholder="Proposed Total CTC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            </div>

            {/* Accordion for My Goals */}
            <Accordion
              className="accordionNoSpace accordionStyle"
              expanded={expanded.includes("panel2")}
              onChange={handleAccordionChange("panel2")}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="ExpandMoreIconStyle" />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <AdsClickIcon
                    fontSize="small"
                    className="accordionIconBGStyle"
                  />
                  My Goals
                 {trackFutureGoals ?<CircleIcon color="warning" sx={{fontSize:"0.62rem"}}/>: ""}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <LastYearGoal
                  appraiserPreviousSaveFormData={appraiserForm?.lastyeargoals}
                />
                <FutureGoals
                  appraiserPreviousSaveFormDat={appraiserForm?.futuregoals}
                  FutureGoalsData={FutureGoalsData_Update}
                  trainingData={trainingData}
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                  trackFutureGoals={setTrackFutureGoals}
                />
              </AccordionDetails>
            </Accordion>

            {/* Accordion for My KRA */}
            <Accordion
              className="accordionNoSpace accordionStyle"
              expanded={expanded.includes("panel3")}
              onChange={handleAccordionChange("panel3")}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="ExpandMoreIconStyle" />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <BarChartIcon
                    fontSize="small"
                    className="accordionIconBGStyle"
                  />
                  My KRA  {trackPerformance || trackMyKRA ?<CircleIcon color="warning" sx={{fontSize:"0.62rem"}}/>: ""}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PerformanceScorecardDateTable
                  PerformanceScorecardData={PerformanceScorecardData}
                  appraiserPreviousSaveFormData={
                    appraiserForm?.performancescorecard
                  }
                  trainingData={trainingData}
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                  trackPerformance={setTrackPerformance}
                />
                <MyKRA
                  appraiserPreviousSaveFormDat={appraiserForm?.mykra}
                  myKRA_Data={myKRA_Data_Update}
                  trainingData={trainingData}
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                  trackMyKRA={setTrackMyKRA}
                />
              </AccordionDetails>
            </Accordion>

            {/* Accordion for Training */}
            <Accordion
              className="accordionNoSpace accordionStyle"
              expanded={expanded.includes("panel4")}
              onChange={handleAccordionChange("panel4")}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="ExpandMoreIconStyle" />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <SchoolIcon
                    fontSize="small"
                    className="accordionIconBGStyle"
                  />
                  My Training {trackCompetencyScorecard || trackFutureComptency ?<CircleIcon color="warning" sx={{fontSize:"0.62rem"}}/>: ""}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CompetencyScorecard
                  appraiserPreviousSaveFormDat={
                    appraiserForm?.competencyscorecard
                  }
                  CompetencyScorecardData={CompetencyScorecardData_Update}
                  trainingData={trainingData}
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                  trackCompetencyScorecard={setTrackCompetencyScorecard}
                />
                <FutureComptency
                  appraiserPreviousSaveFormDat={appraiserForm?.futurecomptency}
                  FutureComptencyData={FutureComptencyData_Update}
                  trainingData={trainingData}
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                  trackFutureComptency={setTrackFutureComptency}
                />
              </AccordionDetails>
            </Accordion>

            {/* My Insights*/}
            <Accordion
              className="accordionNoSpace accordionStyle"
              expanded={expanded.includes("panel5")}
              onChange={handleAccordionChange("panel5")}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="ExpandMoreIconStyle" />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <InsightsIcon
                    fontSize="small"
                    className="accordionIconBGStyle"
                  />
                  My Insights {trackMyInsights ?<CircleIcon color="warning" sx={{fontSize:"0.62rem"}}/>: ""}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MyInsights
                  appraiserPreviousSaveFormDat={appraiserForm?.myinsights}
                  myInsights_Data={myInsights_Upadte}
                  isReviewer={isReviewer()}
                  isApprover={isApprover()}
                  trackMyInsights={setTrackMyInsights}
                />
              </AccordionDetails>
            </Accordion>

            {/* My Confirmation*/}
            <Accordion
              className="accordionNoSpace accordionStyle"
              expanded={expanded.includes("panel6")}
              onChange={handleAccordionChange("panel6")}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="ExpandMoreIconStyle" />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <DoneIcon fontSize="small" className="accordionIconBGStyle" />
                  Confirmation
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className="flex justify-center items-center mb-1 column-gap-4">
                  <h1 className="text-sm">Reviewer</h1>
                  <input
                    type="checkbox"
                    disabled={isReviewer()}
                    {...register("reviewed")}
                  />
                  {/* <Checkbox
                    //checked={reviewer}
                    checked={appraiserForm?.personaldetails.reviewed}
                    onChange={(e) => {
                     // console.log("reviewer_checkbox", e);
                      setReviewer(e.checked ? true : false);
                      // setAppraiserForm((prev) =>
                      //   ({
                      //     ...prev,
                      //     personaldetails: {
                      //       ...prev.personaldetails,
                      //       reviewed: e.checked ? true : false,
                      //       },
                      //   })
                      // );
                      }}
                    disabled={isReviewer()}
                    // onChange={(e) => {
                    //   console.log("approver_checkbox", e);
                    //   setReviewer(e.checked ? true : false);
                    // }}
                  /> */}
                  <h1 className="text-sm">Approver</h1>

                  <input
                    type="checkbox"
                    disabled={isApprover()}
                    {...register("approved")}
                  />
                  {/* <Checkbox
                    checked={approver}
                    disabled={isApprover()}
                    onChange={(e) => {
                      console.log("approver_checkbox", e);
                      setApprover(e.checked ? true : false);
                    }}
                  /> */}
                </div>
              </AccordionDetails>
            </Accordion>
            {!isTrackerPage && (
              <MuiButton
                variant="contained"
                size="small"
                disabled={isFormDisabled()}
                loading={loader}
                loadingPosition="end"
                type="submit"
                className="mt-2"
              >
                Submit Form
              </MuiButton>
            )}
          </form>

          <Toast ref={toastRef} />
        </div>
      </div>
    </>
  );
}

export default AppraisalDialog;
