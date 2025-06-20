import React, { useRef, useState } from "react";

import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { applyLoan } from "./claimServices";
import CustomInputText from "../../components/InputText/InputText"
import CustomButton from "../../components/Button/Button";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";


const LoanApplicationForm = () => {
  const toastRef = useRef(null);

  const [formData, setFormData] = useState({
    loanAmount: "",
    loanTenure: "",
    purpose: "",
    requirementDate: null,
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (e) => {
    setFormData({ ...formData, requirementDate: e.value });
  };

  const handleClickApply = async () => {
    const response = await applyLoan(formData);
    if (response.status) {

       showSuccessMessage(
                toastRef,
                "success",
              response.message
              );
     
      setFormData({
        loanAmount: "",
        emiAmount: "",
        purpose: "",
        loanTenure: "",
        requirementDate: null,
      });
    } else {
    showErrorMessage(
                toastRef,
                "error",
              response.message
              );
      
    }
  };

  return (
    <div className="flex items-center justify-center ">
      <Toast ref={toastRef} />
      <div className="bg-white p-6 max-w-3xl w-1/2 mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Loan Application Form
        </h2>

        <div className="space-y-6">
          <div className="flex items-center">
            <label
              htmlFor="loanAmount"
              className="w-1/3 text-sm font-medium text-gray-700"
            >
              Loan Amount (₹)
            </label>
            <CustomInputText
              id="loanAmount"
              name="loanAmount"
              value={formData.loanAmount}
              onChange={handleInputChange}
              className="w-2/3 h-10 rounded-md shadow-sm"
            />
          </div>

          <div className="flex items-center">
            <label
              htmlFor="loanTenure"
              className="w-1/3 text-sm font-medium text-gray-700"
            >
              Loan Tenure (In Month)
            </label>
            <CustomInputText
              id="loanTenure"
              name="loanTenure"
              value={formData.loanTenure}
              onChange={handleInputChange}
              className="w-2/3 h-10 rounded-md shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <label
              htmlFor="emiAmount"
              className="w-1/3 text-sm font-medium text-gray-700"
            >
              EMI Amount (INR)
            </label>
            <div className="w-2/3 h-10 rounded-md shadow-sm px-4 flex items-center bg-gray-100 text-gray-700">
              {formData.loanAmount && formData.loanTenure
                ? (
                    Number(formData.loanAmount) / Number(formData.loanTenure)
                  ).toFixed(2)
                : "0.00"}
            </div>
          </div>

          <div className="flex items-center">
            <label
              htmlFor="purpose"
              className="w-1/3 text-sm font-medium text-gray-700"
            >
              Purpose of Loan
            </label>
            <CustomInputText
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="w-2/3 h-10 rounded-md shadow-sm"
            />
          </div>

          <div className="flex items-center">
            <label
              htmlFor="requirementDate"
              className="w-1/3 text-sm font-medium text-gray-700"
            >
              Requirement Date
            </label>
            <Calendar
              id="requirementDate"
              name="requirementDate"
              value={formData.requirementDate}
              onChange={handleDateChange}
              showIcon
              dateFormat="yy-mm-dd"
              className="w-2/3 h-10 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <CustomButton
            label="Apply"
            icon="pi pi-check"
            className="px-6 py-2"
            onClick={handleClickApply}
          />
        </div>
      </div>
    </div>
  );
};

export default LoanApplicationForm;
