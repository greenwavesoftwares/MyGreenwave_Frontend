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
import { getCurrentDate, getYearList, onPageLoad } from "./LeaveFunctions";
import { getUserData } from "../Login/Encrypt";
import "./LeaveManagement.css";
import { Tooltip } from "primereact/tooltip";
import { Badge } from "primereact/badge";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";
import { FilterMatchMode } from "primereact/api";

const LeaveManagement = () => {
  const [leaveData, setLeaveData] = useState({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(0);
  const [applyLeaveDialogVisible, setApplyLeaveDialogVisible] = useState(false);
  const [editLeaveDialogVisible, setEditLeaveDialogVisible] = useState(false);
  const [dates, setDates] = useState(null);
  const toastRef = useRef(null);
  const tooltipRef = useRef(null);
  const [isCompensatory, setCompensatory] = useState(false);
  const userInfo = getUserData();
  const statusTypes = [
    "Pending",
    "Reviewing",
    "Reviewed",
    "ManagerApproved",
    "Approved",
    "Rejected",
  ];
  const leaveTypes = ["PL", "CL", "Medical", "Compensatory"];
  const [leaveTableFilters, setLeaveTableFilters] = useState({
    fromDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.IN },
    status: { value: null, matchMode: FilterMatchMode.IN },
  });

  useEffect(() => {
    console.log(userInfo?.token);
    let yearList = getYearList();
    setYears(yearList);
    setSelectedYear(yearList[yearList.length - 1]);
  }, []);

  useEffect(() => {
    const init = async () => {
      let data = await onPageLoad(userInfo.userDetails.userId, selectedYear);
      setLeaveData(data);
    };

    if (selectedYear !== 0) {
      init();
    }
  }, [selectedYear]);

  const editBodyTemplate = (row) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        disabled={row.status !== "Pending" && row.status !== "Editing"}
      />
    );
  };
  const deleteBodyTemplate = (row) => {
    return (
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        disabled={row.status !== "Pending" && row.status !== "Editing"}
      />
    );
  };
  const statusBodyTemplate = (row) => {
    return (
      <>
        <Tooltip
          target={"#leave_" + row.leaveId}
          mouseTrack
          style={{ display: row.status === "Rejected" ? "block" : "none" }}
        >
          <b>Rejected By :</b> {row.rejectedBy}
          <br />
          <b>Rejected Reason :</b> {row.rejectedReason}
        </Tooltip>
        <Tag
          id={"leave_" + row.leaveId}
          value={row.status}
          severity={row.severity}
          data-pr-position="mouse"
        />
      </>
    );
  };
  const typeRowFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value || []}
        options={leaveTypes}
        onChange={(e) => options.filterApplyCallback(e.value)}
        placeholder="Any"
        className="p-column-filter"
        maxSelectedLabels={1}
      />
    );
  };
  const statusRowFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value || []}
        options={statusTypes}
        onChange={(e) => options.filterApplyCallback(e.value)}
        placeholder="Any"
        className="p-column-filter"
        maxSelectedLabels={1}
      />
    );
  };

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
                    onChange={async (e) => {
                      setSelectedYear(e.value);
                    }}
                    options={years}
                    placeholder="Select a Year"
                    className="w-full"
                  />
                </Grid>
                <Grid size={11}>Approved Leaves :</Grid>
                <Grid size={1}>{leaveData.cardData?.approved}</Grid>
                <Grid size={11}>Medical Leaves :</Grid>
                <Grid size={1}>{leaveData.cardData?.medical}</Grid>
                <Grid size={11}>CL Available :</Grid>
                <Grid size={1}>{leaveData.cardData?.clBalance}</Grid>
                <Grid size={11}>PL Available :</Grid>
                <Grid size={1}>{leaveData.cardData?.plBalance}</Grid>
                <Grid size={11}>Compensatory Leave Available :</Grid>
                <Grid size={1}>{leaveData.cardData?.currentCompOff}</Grid>
                <Grid size={11}>Previous PL Available :</Grid>
                <Grid size={1}>{leaveData.cardData?.prevPL}</Grid>
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
                  <Tooltip
                    ref={tooltipRef}
                    target="#selectedEvent"
                    mouseTrack
                  />
                  <Calender
                    initialView="dayGridMonth"
                    height={"31rem"}
                    events={leaveData.calenderData}
                    eventMouseEnter={(info) => {
                      info.el.id = "selectedEvent";
                      info.el.setAttribute("data-pr-tooltip", info.event.id);
                      info.el.setAttribute("data-pr-position", "mouse");
                      tooltipRef.current.updateTargetEvents("#selectedEvent");
                    }}
                  ></Calender>
                </TabPanel>
                <TabPanel header="Tabular View">
                  <DataTable
                    value={leaveData.tableData}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    sortField="fromDate"
                    sortOrder={-1}
                    filterDisplay="row"
                    filters={leaveTableFilters}
                  >
                    <Column
                      field="fromDate"
                      header="From Date"
                      style={{ width: "14vw" }}
                      sortable
                    ></Column>
                    <Column
                      field="toDate"
                      header="To Date"
                      style={{ width: "14vw" }}
                      sortable
                    ></Column>
                    <Column
                      field="actualLeave"
                      header="Leave"
                      style={{ width: "10vw" }}
                    ></Column>
                    <Column
                      field="type"
                      header="Type"
                      style={{ width: "10vw" }}
                      filter
                      filterField="type"
                      showFilterMenu={false}
                      filterElement={typeRowFilterTemplate}
                      filterMenuStyle={{ width: "14rem" }}
                    ></Column>
                    <Column
                      field="reason"
                      header="Reason"
                      style={{ width: "15vw" }}
                    ></Column>
                    <Column
                      header="Status"
                      body={statusBodyTemplate}
                      style={{ width: "10vw" }}
                      filter
                      filterField="status"
                      showFilterMenu={false}
                      filterElement={statusRowFilterTemplate}
                      filterMenuStyle={{ width: "14rem" }}
                    ></Column>
                    <Column
                      header="Edit"
                      style={{ width: "10vw" }}
                      body={editBodyTemplate}
                    ></Column>
                    <Column
                      header="Delete"
                      style={{ width: "10vw" }}
                      body={deleteBodyTemplate}
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
