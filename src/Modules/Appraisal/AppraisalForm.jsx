import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
//Import Accordion
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// Style Import
import "./Appraisal.scss";

function ApprisaDialog({ visible, onClose }) {
  // State for form data
  const [formData, setFromData] = useState({
    empName: "",
    empCode: "",
    position: "",
    education: "",
    yoe_gw: "",
    yoe_ngw: "",
    total_experience: "",
    why_do_i_come_to_office: "",
    current_base_salary: "",
    current_assued_bonus: "",
    current_performance_bonus: "",
    current_total_ctc: "",
    proposed_base_salary: "",
    proposed_assued_bonus: "",
    proposed_performance_ponus: "",
    proposed_total_ctc: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFromData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    //onClose(); // Close the dialog
  };

  return (
    <Dialog
      header="Appraisal Form"
      className="dialogHeader dialogContent"
      visible={visible}
      style={{ width: "80%", height: "85%" }}
      modal
      onHide={onClose}
    >
      <form onSubmit={handleSubmit} >
        <div className="mt-1.5">
        {/* Accordion for Personal Details */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Personal Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatLabel>
                <InputText
                  id="empName"
                  className="p-inputtext-sm"
                  value={formData.empName}
                  onChange={handleChange}
                />
                <label htmlFor="empName">Name</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="empCode"
                  type="number"
                  className="p-inputtext-sm"
                  name="empCode"
                  value={formData.empCode}
                  onChange={handleChange}
                />
                <label htmlFor="empCode">Employee Code</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="position"
                  className="p-inputtext-sm"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                />
                <label htmlFor="position">Position</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="education"
                  className="p-inputtext-sm"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                />
                <label htmlFor="position">Education</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="yoe_gw"
                  className="p-inputtext-sm"
                  name="yoe_gw"
                    type="number"
                  value={formData.yoe_gw}
                  onChange={handleChange}
                />
                <label htmlFor="position">Year of Experience(gw)</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="yoe_ngw"
                  type="number"
                  className="p-inputtext-sm"
                  name="yoe_ngw"
                  value={formData.yoe_ngw}
                  onChange={handleChange}
                />
                <label htmlFor="position">Year of Experience(non-gw)</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="total_experience"
                  className="p-inputtext-sm"
                  name="total_experience"
                  value={formData.total_experience}
                  onChange={handleChange}
                />
                <label htmlFor="position">Total Experience</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="why_do_i_come_to_office"
                  className="p-inputtext-sm"
                  name="why_do_i_come_to_office"
                  value={formData.why_do_i_come_to_office}
                  onChange={handleChange}
                />
                <label htmlFor="position">Why do I come to office</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="current_base_salary"
                  name="current_base_salary"
                  value={formData.current_base_salary}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="current_base_salary">Current Base Salary</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="current_assued_bonus"
                    type="number"
                  name="current_assued_bonus"
                  value={formData.current_assued_bonus}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="current_assued_bonus">
                  Current Assured Bonus
                </label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="current_performance_bonus"
                    type="number"
                  name="current_performance_bonus"
                  value={formData.current_performance_bonus}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="current_performance_bonus">
                  Current Performance Bonus
                </label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="current_total_ctc"
                    type="number"
                  name="current_total_ctc"
                  value={formData.current_total_ctc}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="current_total_ctc">Current Total Ctc</label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="proposed_base_salary"
                    type="number"
                  name="proposed_base_salary"
                  value={formData.proposed_base_salary}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="proposed_base_salary">
                  Proposed Base Salary
                </label>
              </FloatLabel>
              <FloatLabel>
                <InputText
                  id="proposed_assued_bonus"
                    type="number"
                  name="proposed_assued_bonus"
                  value={formData.proposed_assued_bonus}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="proposed_assued_bonus">
                  Proposed Assrued Bonus
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="proposed_performance_ponus"
                    type="number"
                  name="proposed_performance_ponus"
                  value={formData.proposed_performance_ponus}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="proposed_performance_ponus">
                  Proposed Performance Bonus
                </label>
              </FloatLabel>

              <FloatLabel>
                <InputText
                  id="proposed_total_ctc"
                    type="number"
                  name="proposed_total_ctc"
                  value={formData.proposed_total_ctc}
                  onChange={handleChange}
                  className="p-inputtext-sm"
                />
                <label htmlFor="proposed_total_ctc">Proposed Total Ctc</label>
              </FloatLabel>
            </div>
          </AccordionDetails>
        </Accordion>

        {/* Accordion for Performance Scorecard */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Performance Scorecard</Typography>
          </AccordionSummary>
          <AccordionDetails>
           
            <DataTable  size="small">
                <Column  header="Through the Rear View Mirror - My Last Year's KRA"></Column>
                <Column  header="Level of fullfillment (Rate yourself on scale of 1 to 5. 1 being the lowest and 5 highest)"></Column>
                <Column  header="Remarks"></Column>
                <Column  header="Reviewer's Comment"></Column>
                <Column  header="Appraiser's Comments"></Column>
                <Column  header="Edit"></Column>
                <Column  header="Delete"></Column>
            </DataTable>
          </AccordionDetails>
        </Accordion>

         {/* Accordion for Competency Scorecard */}
         <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Competency Scorecard</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <DataTable  size="small">
                <Column  header="Through the Rear View Mirror - My Last Year's Traning Goals"></Column>
                <Column  header="Level of fullfillment (1/5)"></Column>
                <Column  header="Relevance"></Column>
                <Column  header="Reviewer's Comment"></Column>
                <Column  header="Appraiser's Comments"></Column>
                <Column  header="Edit"></Column>
                <Column  header="Delete"></Column>
            </DataTable>
          </AccordionDetails>
        </Accordion>

          {/* Accordion for Future Goals */}
          <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Future Goals</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <DataTable  size="small">
                <Column  header="My Aspirations (2 Professional and 2 Personal Goal identification for 12-36 Months)"></Column>
                <Column  header="Personal/Professional"></Column>
                <Column  header="Reviewer's Comment"></Column>
                
                <Column  header="Appraiser's Comments"></Column>
                <Column  header="Edit"></Column>
                <Column  header="Delete"></Column>
            </DataTable>
          </AccordionDetails>
        </Accordion>
        {/* Accordion for Future Goals */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Future Comptency</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <DataTable  size="small">
                <Column  header="My Competency Goals (To be aligend to professional and Personal Goals)"></Column>
                <Column  header="Relevance(H/M/L)"></Column>
                <Column  header="Target Date (yyyy-mm-dd)"></Column>
                <Column  header="Reviewer's Comment"></Column>
                <Column  header="Appraiser's Comments"></Column>
                <Column  header="Edit"></Column>
                <Column  header="Delete"></Column>
            </DataTable>
          </AccordionDetails>
        </Accordion>

         {/* Accordion for My KRA */}
         <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">My KRA</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <DataTable  size="small">
                <Column  header="My KRA - Next 12 Months (To be aligend to professional and Personal Goals)	"></Column>
                
                <Column  header="Reviewer's Comment"></Column>
                <Column  header="Appraiser's Comments"></Column>
                <Column  header="Edit"></Column>
                <Column  header="Delete"></Column>
            </DataTable>
          </AccordionDetails>
        </Accordion>

         {/* My Insights*/}
         <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">My Insights</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <DataTable  size="small">
                <Column  header="My Ideas	"></Column>
                <Column  header="My Contribution Plans"></Column>
                <Column  header="Reviewer's Comment"></Column>
                <Column  header="Appraiser's Comments"></Column>
                <Column  header="Edit"></Column>
                <Column  header="Delete"></Column>
            </DataTable>
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

        <Button variant="contained" size="small" type="submit" className="mt-2">
          Submit
        </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default ApprisaDialog;
