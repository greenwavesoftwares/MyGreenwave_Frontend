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
import { InputTextarea } from "primereact/inputtextarea";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  applyOrEditLeave,
  deleteLeave,
  getCurrentDate,
  getCurrentYear,
  getTypeName,
  getYearList,
  onPageLoad,
  onSelectRowEdit,
} from "./LeaveFunctions";
import "./LeaveApplication.css";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { InputText } from "primereact/inputtext";

const LeaveApplication = () => {
  const leaveStructure = {
    type: "",
    dates: [],
    reason: "",
  };
  const leaveValidationStructure = {
    dates: true,
    reason: true,
  };
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const [leaveInfo, setLeaveInfo] = useState({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(0);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const toastRef = useRef(null);
  const tooltipRef = useRef(null);
  const [leaveData, setLeaveData] = useState(leaveStructure);
  const [leaveValidation, setLeaveValidation] = useState(
    leaveValidationStructure
  );
  const [leaveTable, setLeaveTable] = useState(tableStructure);
  const [editMode, setEditMode] = useState(false);
  const editBodyTemplate = (row) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        disabled={row.status !== "Pending" && row.status !== "Editing"}
        onClick={() => {
          setLeaveData(onSelectRowEdit(row));
          showleaveDialog("", true);
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
              await deleteLeave(row, setLeaveInfo, toastRef);
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
  const leaveHeader = (
    <div className="flex justify-content-between align-items-center">
      <span>Leaves</span>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={leaveTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = leaveTable.filterStructure;
            _filters["global"].value = value;
            setLeaveTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
        />
      </IconField>
    </div>
  );
  const appliedLeaveTypes = [
    {
      label: "CL/PL",
      icon: "pi pi-calendar",
      command: () => showleaveDialog("normal", false),
    },
    {
      label: "Compensatory",
      icon: "pi pi-briefcase",
      command: () => showleaveDialog("compensatory", false),
    },
    {
      label: "Previous PL",
      icon: "pi pi-history",
      command: () => showleaveDialog("prevPL", false),
    },
  ];

  useEffect(() => {
    let yearList = getYearList();
    setYears(yearList);
    setSelectedYear(yearList[yearList.length - 1]);
  }, []);

  useEffect(() => {
    const init = async () => {
      let data = await onPageLoad(selectedYear);
      setLeaveInfo(data);
      setLeaveTable((prev) => ({ ...prev, table: data.tableData }));
    };

    if (selectedYear !== 0) {
      init();
    }
  }, [selectedYear]);

  const showleaveDialog = (type, isEdit) => {
    setLeaveVisible(true);
    if (!isEdit) {
      setLeaveData(leaveStructure);
      setLeaveData((prev) => ({ ...prev, type: type }));
    }
    setEditMode(isEdit);
  };
  const hideleaveDialog = () => {
    setLeaveVisible(false);
    setLeaveData(leaveStructure);
    setLeaveValidation(leaveValidationStructure);
    setEditMode(false);
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
                <Grid size={1}>{leaveInfo.cardData?.approved}</Grid>
                <Grid size={11}>Medical Leaves :</Grid>
                <Grid size={1}>{leaveInfo.cardData?.medical}</Grid>
                <Grid size={11}>CL Available :</Grid>
                <Grid size={1}>{leaveInfo.cardData?.clBalance}</Grid>
                <Grid size={11}>PL Available :</Grid>
                <Grid size={1}>{leaveInfo.cardData?.plBalance}</Grid>
                <Grid size={11}>Compensatory Leave Available :</Grid>
                <Grid size={1}>{leaveInfo.cardData?.currentCompOff}</Grid>
                {selectedYear == getCurrentYear() && (
                  <Grid size={11}>Previous PL Available :</Grid>
                )}
                {selectedYear == getCurrentYear() && (
                  <Grid size={1}>{leaveInfo.cardData?.prevPL}</Grid>
                )}
              </Grid>
            </Card>
          </Grid>
          <Grid size={{ md: 8.7, xs: 12 }}>
            <Card>
              <Chart
                className={
                  selectedYear == getCurrentYear()
                    ? "h-[18.9rem]"
                    : "h-[16.55rem]"
                }
                type="line"
                data={leaveInfo.chartData?.data}
                options={leaveInfo.chartData?.options}
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
                    events={leaveInfo.calenderData}
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
                    value={leaveTable.table}
                    filters={leaveTable.filterStructure}
                    globalFilterFields={[
                      "fromDate",
                      "type",
                      "reason",
                      "status",
                    ]}
                    header={leaveHeader}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    sortField="fromDate"
                    sortOrder={-1}
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
        style={{ right: "2rem", bottom: "2rem", position: "fixed" }}
        model={appliedLeaveTypes}
      />
      <DialogComponent
        header={
          editMode
            ? "Edit Leave"
            : "Apply For " + getTypeName(leaveData.type) + " Leave"
        }
        visible={leaveVisible}
        className="w-[25rem]"
        onHide={hideleaveDialog}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={6}>Date</Grid>
          <Grid size={6}>
            <DatePicker
              value={leaveData.dates}
              onChange={(e) => {
                setLeaveData((prevData) => ({
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
              inputClassName="w-full"
              invalid={!leaveValidation.dates}
              disabledDates={leaveInfo.holidayDates}
            />
          </Grid>
          <Grid size={6}>Reason</Grid>
          <Grid size={6}>
            <InputTextarea
              value={leaveData.reason}
              autoResize
              rows={3}
              cols={24}
              onChange={(e) => {
                setLeaveData((prevData) => ({
                  ...prevData,
                  reason: e.target.value,
                }));
              }}
              className="w-full"
              invalid={!leaveValidation.reason}
            />
          </Grid>
          <Grid size={12} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              label={editMode ? "Edit" : "Apply"}
              onClick={async () => {
                await applyOrEditLeave(
                  leaveData,
                  leaveInfo,
                  setLeaveValidation,
                  setLeaveInfo,
                  hideleaveDialog,
                  toastRef
                );
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

export default LeaveApplication;
