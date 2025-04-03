import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { Dropdown } from "primereact/dropdown";
import React, { useRef, useState } from "react";
import { Container } from "@mui/material";
import SalarySlipPdf from "./SalarySlipPdf";
import SalarySlipPanelGrid from "./SalarySlipPanelGrid";
import { Toast } from "primereact/toast";

export default function SalarySlip() {
  const [selection, setSelection] = useState({
    year: "",
    month: "",
    data: null,
  });
  const toast = useRef(null);
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#fbfcfc",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
    border: "1px solid #ccc", // Added border
    ...theme.applyStyles("dark", {
      backgroundColor: "#1A2027",
      border: "1px solid #444", // Dark mode border
    }),
  }));

  const months = [
    { name: "January", code: "1" },
    { name: "February", code: "2" },
    { name: "March", code: "3" },
    { name: "April", code: "4" },
    { name: "May", code: "5" },
    { name: "June", code: "6" },
    { name: "July", code: "7" },
    { name: "August", code: "8" },
    { name: "September", code: "9" },
    { name: "October", code: "10" },
    { name: "November", code: "11" },
    { name: "December", code: "12" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2022 }, (_, i) => ({
    name: (2023 + i).toString(),
    code: (i + 1).toString(),
  }));

  function handleYearChange(e) {
    setSelection({ ...selection, year: e.value, month: (e.month = "") });
  }
  function handleMonthChange(e) {
    const newMonth = e.value;
    setSelection((prev) => ({ ...prev, month: newMonth }));

    const mockData = {
      company: "Greenwave Solutions Pvt. Ltd.",
      employee: {
        name: "SOHOME SARKAR",
        employeeCode: 1234,
        designation: "Softwaqre Engineer",
        pan: "PTJ11234",
        uan: "134555",
        accountNumber: "123456789",
        bank: {
          name: "AXIS BANK LTD.",
          branch: "PRINCE ANWARSHAH ROAD",
        },
        disbursementDate: "13/03/2025",
        daysPaid: 30,
      },
      earnings: {
        basic: 50000,
        houseRentAllowance: 10000,
        conveyanceAllowance: 5000,
        managementAllowance: 7000,
        specialAllowance: 8000,
        telephoneAllowance: 2000,
        retentionBonus: 5000,
        performanceBonus: 10000,
        grossTotalEarnings: 95000,
      },
      deductions: {
        esi: 2000,
        epf: 5000,
        professionalTax: 2500,
        arrear: 0,
        grossTotalDeductions: 9500,
      },
      netPay: 85500,
      accountsManager: "Accounts Manager",
    };

    if (Object.keys(mockData).length === 0) {
      // If the JSON is empty, show a toast message
      Toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "No data available for the selected month!",
        life: 3000,
      });

      setSelection({ ...selection, year: "", month: "" });
    }

    // Updating state with mock data
    setSelection((prev) => ({ ...prev, data: mockData }));
  }

  return (
    <>
      <Container maxWidth="lg">
        <div className="card flex justify-content-between align-items-center px-9">
          {/* Left Section: Year & Month Dropdowns */}
          <div className="flex gap-4">
            {/* Year Selection */}
            <div className="flex align-items-center gap-2">
              <label htmlFor="year" className="font-medium">
                Year:
              </label>
              <Dropdown
                value={selection.year}
                onChange={handleYearChange}
                options={years}
                optionLabel="name"
                placeholder="Select year"
                filter
                showClear
              />
            </div>

            {/* Month Selection */}
            <div className="flex align-items-center gap-2">
              <label htmlFor="month" className="font-medium">
                Month:
              </label>
              <Dropdown
                value={selection.month}
                onChange={handleMonthChange}
                options={months}
                disabled={!selection.year}
                optionLabel="name"
                placeholder="Select month"
                filter
                showClear
              />
            </div>
          </div>
          {selection.month && (
            <div className="flex gap-2">
              <SalarySlipPdf></SalarySlipPdf>
            </div>
          )}
        </div>

        {selection.month && Object.keys(selection.data || {}).length > 0 ? (
          <div className="w-full mt-4">
            <SalarySlipPanelGrid salaryData={selection.data} />
          </div>
        ) : (
          <Toast ref={toast} />
        )}
      </Container>
    </>
  );
}
