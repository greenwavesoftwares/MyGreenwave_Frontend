import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Container } from "@mui/material";
import SpeedDial from "../../../components/SpeedDial/SpeedDial";
import { Button } from "primereact/button";
import Toast from "../../../components/Toast/Toast";
import Chart from "../../../components/Chart/Chart";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import { showConfirm } from "../../../components/ConfirmDialog/showConfirm";
import Calender from "../../../components/Calender/Calender";
import DatePicker from "../../../components/DatePicker/DatePicker";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  applyLeave,
  deleteLeave,
  editLeave,
  getCurrentDate,
  getYearList,
  onPageLoad,
  onSelectRowEdit,
} from "./LeaveManagerApprovalFunctions";
import { getUserData } from "../../Login/Encrypt";
import "./LeaveManagerApproval.css";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";
import { FilterMatchMode } from "primereact/api";
import { Message } from "primereact/message";
import { validateApplyLeave, validateEditLeave } from "./LeaveValidation";

const LeaveManagerApproval = () => {
  const leaveFormData = {
    dates: [],
    reason: "",
    isCompensatory: false,
  };
  const leaveValidate = {
    dateValidate: true,
    dateValidateMessage: "",
    reasonValidate: true,
    reasonValidateMessage: "",
  };
  const [leaveData, setLeaveData] = useState({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(0);
  const [applyLeaveDialogVisible, setApplyLeaveDialogVisible] = useState(false);
  const [editLeaveDialogVisible, setEditLeaveDialogVisible] = useState(false);
  const toastRef = useRef(null);
  const tooltipRef = useRef(null);
  const [userInfo] = useState(getUserData());
  const [statusTypes] = useState([
    "Pending",
    "Reviewing",
    "Reviewed",
    "ManagerApproved",
    "Approved",
    "Rejected",
  ]);
  const [leaveTypes] = useState(["PL", "CL", "Medical", "Compensatory"]);
  const [leaveTableFilters] = useState({
    fromDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.IN },
    status: { value: null, matchMode: FilterMatchMode.IN },
  });
  const [applyLeaveData, setApplyLeaveData] = useState(leaveFormData);
  const [applyLeaveValidate, setApplyLeaveValidate] = useState(leaveValidate);
  const [editLeaveData, setEditLeaveData] = useState(leaveFormData);
  const [editLeaveValidate, setEditLeaveValidate] = useState(leaveValidate);
  const editBodyTemplate = (row) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        disabled={row.status !== "Pending" && row.status !== "Editing"}
        onClick={() => {
          onSelectRowEdit(row, setEditLeaveData, setEditLeaveDialogVisible);
        }}
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
        onClick={() => {
          showConfirm(
            "Confirmation",
            "Do you want to delete this leave?",
            async () => {
              await deleteLeave(
                row,
                toastRef,
                userInfo.userDetails.userId,
                selectedYear,
                setLeaveData
              );
            },
            null
          );
        }}
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

  useEffect(() => {
    console.log(userInfo);
    let yearList = getYearList();
    setYears(yearList);
    setSelectedYear(yearList[yearList.length - 1]);
  }, [userInfo]);

  useEffect(() => {
    const init = async () => {
      let data = await onPageLoad(userInfo.userDetails.userId, selectedYear);
      setLeaveData(data);
    };

    if (selectedYear !== 0) {
      init();
    }
  }, [selectedYear, userInfo.userDetails.userId]);

  const clearApplyDialog = () => {
    setApplyLeaveData(leaveFormData);
    setApplyLeaveValidate(leaveValidate);
    setApplyLeaveDialogVisible(false);
  };
  const clearEditDialog = () => {
    setEditLeaveData(leaveFormData);
    setEditLeaveValidate(leaveValidate);
    setEditLeaveDialogVisible(false);
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
          clearApplyDialog();
        }}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={5}>Compensatory Leave</Grid>
          <Grid size={7}>
            <Checkbox
              checked={applyLeaveData.isCompensatory}
              onClick={() => {
                setApplyLeaveData((prevData) => ({
                  ...prevData,
                  isCompensatory: !applyLeaveData.isCompensatory,
                }));
              }}
            />
          </Grid>
          <Grid size={2}>Date</Grid>
          <Grid size={6}>
            <DatePicker
              value={applyLeaveData.dates}
              onChange={(e) => {
                setApplyLeaveData((prevData) => ({
                  ...prevData,
                  dates: e.value,
                }));
              }}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
              disabledDays={[0, 6]}
              minDate={getCurrentDate()}
              showIcon
              dateFormat="dd/mm/yy"
            />
          </Grid>
          <Grid size={4}>
            {!applyLeaveValidate.dateValidate && (
              <Message severity="error" text="Select Dates" />
            )}
          </Grid>
          <Grid size={2}>Reason</Grid>
          <Grid size={6}>
            <InputTextarea
              value={applyLeaveData.reason}
              autoResize
              rows={3}
              cols={24}
              onChange={(e) => {
                setApplyLeaveData((prevData) => ({
                  ...prevData,
                  reason: e.target.value,
                }));
              }}
            />
          </Grid>
          <Grid size={4}>
            {!applyLeaveValidate.reasonValidate && (
              <Message severity="error" text="Enter Reason" />
            )}
          </Grid>
          <Grid size={12} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              label="Apply"
              onClick={async () => {
                if (validateApplyLeave(applyLeaveData, setApplyLeaveValidate)) {
                  await applyLeave(
                    userInfo.userDetails.userId,
                    applyLeaveData,
                    toastRef,
                    selectedYear,
                    setLeaveData,
                    clearApplyDialog
                  );
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogComponent>
      <DialogComponent
        header="Edit Leave"
        visible={editLeaveDialogVisible}
        className="leaveDialog"
        onHide={() => {
          if (!editLeaveDialogVisible) return;
          clearEditDialog();
        }}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={2}>Date</Grid>
          <Grid size={6}>
            <DatePicker
              value={editLeaveData.dates}
              onChange={(e) => {
                setEditLeaveData((prevData) => ({
                  ...prevData,
                  dates: e.value,
                }));
              }}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
              disabledDays={[0, 6]}
              minDate={getCurrentDate()}
              showIcon
              dateFormat="dd/mm/yy"
            />
          </Grid>
          <Grid size={4}>
            {!editLeaveValidate.dateValidate && (
              <Message severity="error" text="Select Dates" />
            )}
          </Grid>
          <Grid size={2}>Reason</Grid>
          <Grid size={6}>
            <InputTextarea
              value={editLeaveData.reason}
              autoResize
              rows={3}
              cols={24}
              onChange={(e) => {
                setEditLeaveData((prevData) => ({
                  ...prevData,
                  reason: e.target.value,
                }));
              }}
            />
          </Grid>
          <Grid size={4}>
            {!editLeaveValidate.reasonValidate && (
              <Message severity="error" text="Enter Reason" />
            )}
          </Grid>
          <Grid size={12} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              label="Edit"
              onClick={async () => {
                if (validateEditLeave(editLeaveData, setEditLeaveValidate)) {
                  await editLeave(
                    userInfo.userDetails.userId,
                    editLeaveData,
                    toastRef,
                    selectedYear,
                    setLeaveData,
                    clearEditDialog
                  );
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogComponent>
      <Toast ref={toastRef} />
      <ConfirmDialog />
    </>
  );
};

export default LeaveManagerApproval;
