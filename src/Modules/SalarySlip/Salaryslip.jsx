import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { Dropdown } from "primereact/dropdown";
import React, { useRef, useState } from "react";
import { Container } from "@mui/material";
import SalarySlipPdf from "./SalarySlipPdf";
import SalarySlipPanelGrid from "./SalarySlipPanelGrid";
import { Toast } from "primereact/toast";
import { fetchSalarySlip } from "./SalarySlipAPI";

export default function SalarySlip() {
  const [selection, setSelection] = useState({
    year: "",
    month: "",
    salaryData: null,
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

  const handleMonthChange = async (e) => {
    const newMonth = e.value;

    // Update the month first
    setSelection((prev) => ({ ...prev, month: newMonth }));

    if (selection.year && newMonth) {
      try {
        const responce = await fetchSalarySlip(selection.year, newMonth.name);
        console.log("data", responce.data.salarySlipData);

        setSelection((prev) => ({
          ...prev,
          salaryData: responce.data.salarySlipData,
        }));

        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Salary data fetched successfully!",
          life: 3000,
        });
      } catch (error) {
        console.log(error.response);

        const status = error.response?.status;
        setSelection((prev) => ({
          ...prev,
          year: "",
          month: "",
          data: {},
        }));
        if (status === 500) {
          toast.current.show({
            severity: "warn",
            summary: "Warning",
            detail: "No data available for the selected month!",
            life: 3000,
          });
        } else {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to fetch salary data.",
            life: 3000,
          });
        }
      }
    }
  };

  return (
    <>
      <Container
        className="card p-4"
        style={{ maxWidth: "90%", margin: "0 auto" }}
      >
        <Toast ref={toast} />
        <div
          className="p-3 mb-3"
          style={{
            background: "#e3f2fd",
            borderLeft: "5px solid #64b5f6",
            borderRadius: "10px",
            color: "#0d47a1",
            fontWeight: "600",
            fontSize: "1rem",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            transition: "box-shadow 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 14px rgba(0, 0, 0, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.1)";
          }}
        >
          <div
          // style={{
          //   display: "flex",
          //   alignItems: "center",
          //   justifyContent: "space-between",
          //   gap: "1rem",
          // }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "space-between",
              }}
            >
              <div
                className="leftSection"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <img
                  src=".\src\assets\Images\GreenwaveLogo.png"
                  alt="Upload Icon"
                  style={{ width: "40px", height: "40px" }}
                />
                <div
                  style={{
                    fontSize: "1.5 rem",
                    fontWeight: "bold",
                  }}
                >
                  Download Salary Slip & Form 16
                </div>
              </div>

              <div
                className="rightSection"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    fontSize: "1.5 rem",
                    fontWeight: "bold",
                    color: "red",
                  }}
                >
                  <Dropdown
                    id="year"
                    value={selection.year}
                    onChange={handleYearChange}
                    options={years}
                    optionLabel="name"
                    placeholder="Select year"
                    filter
                    showClear
                  />
                </div>
                <div
                  style={{
                    fontSize: "1.5 rem",
                    fontWeight: "bold",
                    color: "red",
                  }}
                >
                  <Dropdown
                    id="month"
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

                <div className="flex justify-between items-center flex-wrap gap-4">
                  {selection.month && (
                    <div className="flex gap-4 items-center">
                      <SalarySlipPdf
                        salaryData={selection.salaryData}
                      ></SalarySlipPdf>
                    </div>
                  )}
                </div>
                {selection.year && (
                  <div>
                    <button
                      className="flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow hover:bg-blue-800 transition duration-300"
                      title="Download Form 16"
                    >
                      Form 16
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {selection.month &&
          Object.keys(selection.salaryData || {}).length > 0 ? (
            <SalarySlipPanelGrid salaryData={selection.salaryData} />
          ) : null}
        </div>
      </Container>
    </>
  );
}
