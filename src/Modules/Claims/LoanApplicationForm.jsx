import React, { useRef, useState } from "react";

import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { applyLoan } from "./claimServices";
import CustomInputText from "../../components/InputText/InputText";
import CustomButton from "../../components/Button/Button";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
import { Grid, Typography } from "@mui/material";
//MUI Icon
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";

const LoanApplicationForm = () => {
  const toastRef = useRef(null);

  const [formData, setFormData] = useState({
    loanAmount: "",
    loanTenure: "",
    purpose: "",
    requirementDate: null,
  });

  // const handleInputChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "loanAmount") {
      // Allow only numbers and prevent negative values
      if (
        value === "" ||
        (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) >= 0)
      ) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === "loanTenure") {
      // Allow only whole numbers greater than 0
      if (value === "" || (/^\d+$/.test(value) && parseInt(value, 10) > 0)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDateChange = (e) => {
    setFormData({ ...formData, requirementDate: e.value });
  };

  const handleClickApply = async () => {
    if (
      !formData.loanAmount ||
      !formData.purpose ||
      !formData.loanTenure ||
      !formData.requirementDate
    ) {
      console.log("fromData", formData);
      showWarningMessage(toastRef, "warn", `First fill all required fields `);
      return;
    }
    const response = await applyLoan(formData);
    if (response.status) {
      showSuccessMessage(toastRef, "success", response.message);

      setFormData({
        loanAmount: "",
        emiAmount: "",
        purpose: "",
        loanTenure: "",
        requirementDate: null,
      });
    } else {
      showErrorMessage(toastRef, "error", response.message);
    }
  };

  return (
    <div>
      <Toast ref={toastRef} />

      {/* Miscellaneous Claim */}
      <div className="cardBG rounded-xl p-4 mb-3 defaultBorder">
        <div className="flex justify-content-between mb-4">
          <div className="" style={{ display: "flex", alignItems: "center" }}>
            <TextSnippetOutlinedIcon
              style={{
                color: "#119ac5",
                marginRight: "0.7rem",
                fontSize: "1.4rem",
              }}
            />
            <Typography
              className=""
              style={{
                //color: "#4b5563",
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            >
              Loan Application Form
            </Typography>
          </div>
        </div>

        <Grid container spacing={10}>
          <Grid size={4}>
            <div>
              <label
                htmlFor="loanAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Loan Amount (₹)
              </label>
              <CustomInputText
                id="loanAmount"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleInputChange}
                className="w-full inputFieldStyle"
              />
            </div>
          </Grid>

          <Grid size={4}>
            <div>
              <label
                htmlFor="loanTenure"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Loan Tenure (In Month)
              </label>
              <CustomInputText
                id="loanTenure"
                name="loanTenure"
                value={formData.loanTenure}
                onChange={handleInputChange}
                className="w-full inputFieldStyle"
              />
            </div>
          </Grid>
          <Grid size={4}>
            <div>
              <label
                htmlFor="emiAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                EMI Amount (INR)
              </label>
              <div className="w-full inputFieldStyle rounded-md ">
                {formData.loanAmount && formData.loanTenure
                  ? (
                      Number(formData.loanAmount) / Number(formData.loanTenure)
                    ).toFixed(2)
                  : "0.00"}
              </div>
            </div>
          </Grid>
        </Grid>
        <Grid container spacing={10} className="mt-4">
          <Grid size={4}>
            <div>
              <label
                htmlFor="purpose"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Purpose of Loan
              </label>
              <CustomInputText
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full inputFieldStyle"
              />
            </div>
          </Grid>
          <Grid size={4}>
            <div>
              <label
                htmlFor="requirementDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Requirement Date
              </label>
              <Calendar
                id="requirementDate"
                name="requirementDate"
                value={formData.requirementDate}
                onChange={handleDateChange}
                showIcon
                dateFormat="dd/mm/yy"
                className="w-full calendarStyle"
              />
            </div>
          </Grid>
        </Grid>

        <Grid container spacing={10} className="mt-4">
          <Grid size={4}>
            <div>
              <CustomButton
                label="Apply"
                icon="pi pi-check"
                className="px-4 py-2"
                onClick={handleClickApply}
              />
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default LoanApplicationForm;
