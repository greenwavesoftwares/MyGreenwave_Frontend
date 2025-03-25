import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid2";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Container } from "@mui/material";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import SpeedDial from "../../components/SpeedDial/SpeedDial";
import { Button } from "primereact/button";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import Toast from "../../components/Toast/Toast";
import Chart from "../../components/Chart/Chart";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { showConfirm } from "../../components/ConfirmDialog/showConfirm";
import Calender from "../../components/Calender/Calender";

const LeaveManagement = () => {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const cities = [2023, 2024, 2025];
  const [selectedCity, setSelectedCity] = useState(2025);
  const [applyLeaveDialogVisible, setApplyLeaveDialogVisible] = useState(false);
  const [dates, setDates] = useState(null);
  const toastRef = useRef(null);

  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue("--text-color");
    const textColorSecondary = documentStyle.getPropertyValue(
      "--text-color-secondary"
    );
    const data = {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          type: "line",
          label: "Cumulative Leave",
          borderColor: documentStyle.getPropertyValue("--green-500"),
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          data: [50, 25, 12, 48, 56, 76, 42],
        },
        {
          type: "bar",
          label: "Working Day",
          backgroundColor: documentStyle.getPropertyValue("--yellow-300"),
          data: [21, 84, 24, 75, 37, 65, 34],
          borderColor: "white",
          borderWidth: 2,
        },
        {
          type: "bar",
          label: "Attendence",
          backgroundColor: documentStyle.getPropertyValue("--blue-500"),
          data: [21, 84, 24, 75, 37, 65, 34],
          borderColor: "white",
          borderWidth: 2,
        },
        {
          type: "bar",
          label: "Leave",
          backgroundColor: documentStyle.getPropertyValue("--red-500"),
          data: [41, 52, 24, 74, 23, 21, 32],
        },
      ],
    };
    const options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false,
          },
        },
      },
    };

    setChartData(data);
    setChartOptions(options);
  }, []);

  return (
    <>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={1}
          marginTop={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Grid size={3}>
            <Card>
              <Grid container rowGap={1.5}>
                <Grid size={12}>Year :</Grid>
                <Grid size={12}>
                  <Dropdown
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.value)}
                    options={cities}
                    optionLabel="name"
                    placeholder="Select a Year"
                    className="w-full"
                  />
                </Grid>
                <Grid size={11}>Approved Leaves :</Grid>
                <Grid size={1}>999</Grid>
                <Grid size={11}>Medical Leaves :</Grid>
                <Grid size={1}>999</Grid>
                <Grid size={11}>CL Available :</Grid>
                <Grid size={1}>999</Grid>
                <Grid size={11}>PL Available :</Grid>
                <Grid size={1}>999</Grid>
                <Grid size={11}>Compensatory Leave Available :</Grid>
                <Grid size={1}>999</Grid>
                <Grid size={11}>Previous PL Available :</Grid>
                <Grid size={1}>999</Grid>
              </Grid>
            </Card>
          </Grid>
          <Grid size={9}>
            <Card>
              <Chart
                style={{ height: "17.2rem" }}
                type="line"
                data={chartData}
                options={chartOptions}
              />
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <Calender initialView="dayGridMonth" height={"30rem"}></Calender>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <SpeedDial
        radius={80}
        style={{ right: "2rem", bottom: "2rem", position: "fixed" }}
        showIcon="pi pi-plus"
        hideIcon="pi pi-plus"
        onClick={() => {
          setApplyLeaveDialogVisible(true);
        }}
      />
      <Dialog
        header="Apply For Leave"
        visible={applyLeaveDialogVisible}
        style={{ width: "30vw" }}
        onHide={() => {
          if (!applyLeaveDialogVisible) return;
          setApplyLeaveDialogVisible(false);
        }}
      >
        <Grid container>
          <Grid size={4}>Select Date :</Grid>
          <Grid size={8}>
            <Calendar
              value={dates}
              onChange={(e) => setDates(e.value)}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
            />
          </Grid>
          <Grid size={12}>
            {" "}
            <Button
              label="Click"
              onClick={() =>
                showConfirm(
                  "Header",
                  "Message",
                  () => showSuccessMessage(toastRef, "Success", "Clicked Yes"),
                  () => showErrorMessage(toastRef, "Error", "Clicked No")
                )
              }
            />
          </Grid>
        </Grid>
      </Dialog>
      <Toast ref={toastRef} />
      <ConfirmDialog />
    </>
  );
};

export default LeaveManagement;
