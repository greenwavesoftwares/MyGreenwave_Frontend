import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Container } from "@mui/material";
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
import DatePicker from "../../components/DatePicker/DatePicker";
import DialogComponent from "../../components/Dialog/DialogComponent";
import "../../components/Dialog/DialogComponent.css";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProductService } from "../../Services/ProductService";
import { getCurrentDate, onPageLoad } from "./LeaveFunctions";

const LeaveManagement = () => {
  const [leaveData, setLeaveData] = useState({});
  const years = [2023, 2024, 2025];
  const [selectedYear, setSelectedYear] = useState(2025);
  const [applyLeaveDialogVisible, setApplyLeaveDialogVisible] = useState(false);
  const [editLeaveDialogVisible, setEditLeaveDialogVisible] = useState(false);
  const [dates, setDates] = useState(null);
  const toastRef = useRef(null);
  const [isCompensatory, setCompensatory] = useState(false);
  const [tableData, setTableData] = useState([]);
  const userId = "abhishek.bhowmick@greenwave.co.in";

  useEffect(() => {
    const init = async () => {
      let data = await onPageLoad(userId, selectedYear);
      setLeaveData(data);
    };
    init();
    ProductService.getProducts().then((data) => setTableData(data));
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
          <Grid size={{ md: 3.3, xs: 12 }}>
            <Card>
              <Grid container rowGap={1.5}>
                <Grid size={12}>Year :</Grid>
                <Grid size={12}>
                  <Dropdown
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.value)}
                    options={years}
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
          <Grid size={{ md: 8.7, xs: 12 }}>
            <Card>
              <Chart
                className="h-19rem"
                type="line"
                data={leaveData.chartData?.data}
                options={leaveData.chartData?.options}
              />
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <TabView>
                <TabPanel header="Calender View">
                  <Calender
                    initialView="dayGridMonth"
                    height={"31rem"}
                  ></Calender>
                </TabPanel>
                <TabPanel header="Tabular View">
                  <DataTable
                    value={tableData}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    tableStyle={{ minWidth: "50rem" }}
                  >
                    <Column
                      field="name"
                      header="Name"
                      style={{ width: "25%" }}
                    ></Column>
                    <Column
                      field="description"
                      header="Description"
                      style={{ width: "25%" }}
                    ></Column>
                    <Column
                      field="category"
                      header="Category"
                      style={{ width: "25%" }}
                    ></Column>
                    <Column
                      field="quantity"
                      header="Quantity"
                      style={{ width: "25%" }}
                    ></Column>
                  </DataTable>
                </TabPanel>
              </TabView>
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
      <DialogComponent
        header="Apply For Leave"
        visible={applyLeaveDialogVisible}
        className="leaveDialog"
        onHide={() => {
          if (!applyLeaveDialogVisible) return;
          setApplyLeaveDialogVisible(false);
        }}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={5}>Compensatory Leave</Grid>
          <Grid size={7}>
            <Checkbox
              checked={isCompensatory}
              onClick={() => {
                setCompensatory(!isCompensatory);
              }}
            />
          </Grid>
          <Grid size={5}>Date</Grid>
          <Grid size={7}>
            <DatePicker
              value={dates}
              onChange={(e) => setDates(e.value)}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
              disabledDays={[0, 6]}
              minDate={getCurrentDate()}
              showIcon
            />
          </Grid>
          <Grid size={5}>Reason</Grid>
          <Grid size={7}>
            <InputTextarea autoResize rows={3} cols={24} />
          </Grid>
          <Grid size={12}>
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
      </DialogComponent>
      <DialogComponent
        header="Edit Leave"
        visible={editLeaveDialogVisible}
        style={{ width: "30vw" }}
        onHide={() => {
          if (!editLeaveDialogVisible) return;
          setEditLeaveDialogVisible(false);
        }}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={5}>Date</Grid>
          <Grid size={7}>
            <DatePicker
              value={dates}
              onChange={(e) => setDates(e.value)}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
              disabledDays={[0, 6]}
            />
          </Grid>
          <Grid size={5}>Reason</Grid>
          <Grid size={7}>
            <InputTextarea autoResize rows={3} cols={25} />
          </Grid>
          <Grid size={12}>
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
      </DialogComponent>
      <Toast ref={toastRef} />
      <ConfirmDialog />
    </>
  );
};

export default LeaveManagement;
