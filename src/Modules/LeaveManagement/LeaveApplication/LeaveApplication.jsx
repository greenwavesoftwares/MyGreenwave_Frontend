import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Container } from "@mui/material";
import SpeedDial from "../../../components/SpeedDial/SpeedDial";
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
} from "./LeaveApplicationFunctions";
import "./LeaveApplication.css";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { Badge } from "primereact/badge";
import { Avatar } from "primereact/avatar";
import LeaveBalanceCard from "./LeaveBalanceCard";
import CustomInputText from "../../../components/InputText/InputText";
import CustomButton from "../../../components/Button/Button";
import GlobalFilterHeader from "../../../components/Table/GlobalFilterHeader";
import YearCarouselPrime from "./YearCarouselPrime";
import Holiday from "../../Holiday/Holiday";

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
  const [cardData, setCardData] = useState({});
  const [chartData, setChartData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0");
  const actionBodyTemplate = (row) => {
    return (
      <div className="flex justify-content-center gap-1">
        <CustomButton
          icon="pi pi-pencil"
          rounded
          outlined
          severity="warning"
           style={{width:'2rem',height:"2rem",border:"none"}}
          disabled={row.status !== "Pending" && row.status !== "Editing"}
          onClick={() => {
            setLeaveData(onSelectRowEdit(row));
            showleaveDialog("", true);
          }}
        />
        <CustomButton
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          style={{width:'2rem',height:"2rem",border:"none"}}
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
      </div>
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
    <GlobalFilterHeader
      start={<span>Leaves</span>}
      table={leaveTable}
      setTable={setLeaveTable}
    />
  );
  const appliedLeaveTypes = [
    {
      label: "CL",
      icon: "pi pi-calendar",
      command: () => showleaveDialog("CL", false),
    },
    {
      label: "PL",
      icon: "pi pi-calendar",
      command: () => showleaveDialog("PL", false),
    },
    {
      label: "Compensatory",
      icon: "pi pi-briefcase",
      command: () => showleaveDialog("Compensatory", false),
    },
    {
      label: "Medical",
      icon: "pi pi-plus",
      command: () => showleaveDialog("Medical", false),
    },
    {
      label: "Previous PL",
      icon: "pi pi-history",
      command: () => showleaveDialog("PrevPL", false),
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
      setCardData(data.cardData);
      setChartData(data.chartData);
    };

    if (selectedYear !== 0) {
      init();
    }
  }, [selectedYear]);

  useEffect(() => {
    setLeaveTable((prev) => ({ ...prev, table: leaveInfo.tableData }));
    setCardData(leaveInfo.cardData);
    setChartData(leaveInfo.chartData);
  }, [leaveInfo]);

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
  const baseValues = [
    { label: "Attendance", color: "#60a5fa" },
    { label: "Leave", color: "#lal" },
  ];
  const rawMonthlyData = [
    { name: "January", value: 30 },
    { name: "February", value: 18 },
    { name: "March", value: 22 },
    { name: "April", value: 10 },
    { name: "May", value: 35 },
    { name: "June", value: 28 },
    { name: "July", value: 15 },
    { name: "August", value: 40 },
    { name: "September", value: 25 },
    { name: "October", value: 30 },
    { name: "November", value: 20 },
    { name: "December", value: 50 },
  ];

  // Split value and calculate percentage for Attendance
  const splitValue = (total) => {
    const leave = Math.floor(Math.random() * (total + 1));
    const attendance = total - leave;
    const percentage = parseFloat(((attendance / total) * 100).toFixed(1)); // Percentage of Attendance

    return {
      percentage,
      values: [
        { ...baseValues[0], value: attendance },
        { ...baseValues[1], value: leave },
      ],
    };
  };

  const monthlyData = rawMonthlyData.map((month) => {
    const { percentage, values } = splitValue(month.value);
    return {
      name: month.name,
      percentage,
      value: values,
    };
  });
  return (
    <>
      <Container maxWidth="lg">
        <Grid container spacing={1} marginTop={2} className="items-stretch">
          {/* <Grid size={12}>
            <YearCarouselPrime />
          </Grid>
          <Grid size={12}>
            Version
            <Dropdown
              value={appVersion}
              onChange={async (e) => {
                setAppVersion(e.value);
              }}
              options={["1.0", "1.1", "1.2"]}
              placeholder="Select a Version"
            />
          </Grid> */}
          {appVersion === "1.2" && (
            <>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <div className="cardStyle">
                  <Grid container rowGap={1}>
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
                  </Grid>
                </div>
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <LeaveBalanceCard
                  type="CL"
                  limit={cardData.clLimit}
                  taken={cardData.cl}
                  balance={cardData.clBalance}
                  icon="pi pi-calendar"
                />
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <LeaveBalanceCard
                  type="PL"
                  limit={cardData.plLimit}
                  taken={cardData.pl}
                  balance={cardData.plBalance}
                  icon="pi pi-calendar"
                />
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <LeaveBalanceCard
                  type="Medical"
                  limit={cardData.medicalLimit}
                  taken={cardData.medical}
                  balance={cardData.medicalBalance}
                  icon="pi pi-plus"
                />
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <Card style={{ borderRadius: "25px" }}>
                  <div className="flex justify-between">
                    <div className="wrap align-content-around">
                      <div className="font-normal text-md">Attendance</div>
                      <div className="font-bold text-3xl">{"45%"}</div>
                    </div>
                    <div className="w-24 h-20">
                      <Chart
                        className={"h-full"}
                        type="line"
                        data={chartData.attendanceChart?.data}
                        options={chartData.attendanceChart?.options}
                      />
                    </div>
                  </div>
                </Card>
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <Card style={{ borderRadius: "25px" }}>
                  <div className="flex justify-between">
                    <div className="wrap align-content-around">
                      <div className="font-normal text-md">
                        Total Leave Taken
                      </div>
                      <div className="font-bold text-3xl">
                        {cardData.approved}
                      </div>
                    </div>
                    <div className="w-24 h-20">
                      <Chart
                        className={"h-full"}
                        type="line"
                        data={chartData.cumulativeLeaveChart?.data}
                        options={chartData.cumulativeLeaveChart?.options}
                      />
                    </div>
                  </div>
                </Card>
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <Card style={{ borderRadius: "25px" }}>
                  <div className="flex justify-between">
                    <div className="justify-content-between">
                      <div className="font-normal text-md">
                        Compensatory <br /> Available
                      </div>
                      <div className="font-bold text-3xl">
                        {cardData.currentCompOff}
                      </div>
                    </div>
                    <Avatar
                      icon="pi pi-briefcase"
                      size="xlarge"
                      className="bg-red-500 text-white"
                      shape="circle"
                    />
                  </div>
                </Card>
              </Grid>
              <Grid size={{ md: 3, sm: 6, xs: 12 }}>
                <Card style={{ borderRadius: "25px" }}>
                  <div className="flex justify-between">
                    <div className="justify-content-between">
                      <div className="font-normal text-md">
                        Previous PL
                        <br /> Available
                      </div>
                      <div className="font-bold text-3xl">
                        {cardData.prevPL}
                      </div>
                    </div>
                    <Avatar
                      icon="pi pi-history"
                      size="xlarge"
                      className="bg-red-500 text-white"
                      shape="circle"
                    />
                  </div>
                </Card>
              </Grid>
            </>
          )}
          {(appVersion === "1.0" || appVersion === "1.1") && (
            <>
              <Grid size={{ md: 3.3, xs: 12 }}>
                <div className="h-full cardStyle p-3">
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
                        className="w-full dropDownStyle"
                      />
                    </Grid>
                    <Grid size={11}>Approved Leaves :</Grid>
                    <Grid size={1}>{leaveInfo.cardData?.approved}</Grid>
                    <Grid size={11}>Medical Available :</Grid>
                    <Grid size={1}>{leaveInfo.cardData?.medicalBalance}</Grid>
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
                </div>
              </Grid>
              <Grid size={{ md: 8.7, xs: 12 }}>
                {appVersion === "1.1" ? (
                  <Grid container spacing={1}>
                    {monthlyData.map((month) => (
                      <Grid key={month.name} size={3}>
                        <Card>
                          <div className="flex justify-between">
                            <div className="font-medium">{month.name}</div>
                            <div
                              className={`font-bold flex items-center ${
                                month.percentage > 25
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {/* {31 total
                            red Leave
                            blue attendance} */}
                              {month.percentage}%
                              <i
                                style={{ fontSize: "0.8rem", marginLeft: 4 }}
                                className={`pi ${
                                  month.percentage > 25
                                    ? "pi-arrow-up"
                                    : "pi-arrow-down"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="w-full max-w-md">
                            <div className="flex h-12 rounded overflow-hidden">
                              {month.value.map((item) => (
                                <div
                                  key={item.label}
                                  className="relative flex items-center justify-center text-xs text-white gap-x-2"
                                  style={{
                                    width: `${
                                      (item.value /
                                        month.value.reduce(
                                          (sum, item) => sum + item.value,
                                          0
                                        )) *
                                      100
                                    }%`,
                                    backgroundColor: item.color,
                                  }}
                                  title={`${item.label}: ${item.value}`}
                                >
                                  {item.value}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between text-xs mt-2">
                              {month.value.map((item) => (
                                <div
                                  key={item.label}
                                  className="flex items-center gap-1"
                                >
                                  <Badge
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <div className="h-full cardStyle p-3">
                    <Chart
                      className={
                        selectedYear == getCurrentYear()
                          ? "h-[18.9rem]"
                          : "h-[16.55rem]"
                      }
                      type="line"
                      data={chartData?.yearlyChart?.data}
                      options={chartData?.yearlyChart?.options}
                    />
                  </div>
                )}
              </Grid>
            </>
          )}
          {/* <Grid size={12}>
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
                    size="small"
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
          </Grid> */}
          <Grid size={{ md: 6, xs: 12 }}>
            <div className="cardStyle p-3">
              <Tooltip ref={tooltipRef} target="#selectedEvent" mouseTrack />
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
              />
            </div>
          </Grid>
          <Grid size={{ md: 6, xs: 12 }} className="h-full">
             <div className="cardStyle px-3">
              <DataTable
                value={leaveTable.table}
                filters={leaveTable.filterStructure}
                globalFilterFields={["fromDate", "type", "reason", "status"]}
                header={leaveHeader}
                paginator
                rows={8}
                rowsPerPageOptions={
                  leaveTable.table?.length > 50
                    ? [5, 10, 25, 50, leaveTable.table?.length]
                    : leaveTable.table?.length > 25
                    ? [5, 10, 25, leaveTable.table?.length]
                    : leaveTable.table?.length > 10
                    ? [5, 10, leaveTable.table?.length]
                    : leaveTable.table?.length > 5
                    ? [5, leaveTable.table?.length]
                    : [5]
                }
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                sortField="fromDate"
                sortOrder={-1}
                size="small"
                className="text-sm dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator dropDownStyle"
                rowClassName={() =>
                  "hover:bg-gray-100 transition-all duration-200"
                }
                
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
                  style={{ width: "10vw" }}
                />
                <Column
                  header="Status"
                  body={statusBodyTemplate}
                  style={{ width: "10vw" }}
                ></Column>
                <Column
                  header="Action"
                  style={{ width: "10vw" }}
                  body={actionBodyTemplate}
                ></Column>
              </DataTable>
            </div>
          </Grid>
        </Grid>
      </Container>
      <SpeedDial
        style={{ right: "1rem", bottom: "2rem", position: "fixed" }}
        model={appliedLeaveTypes}
      />
      <DialogComponent
        header={
          editMode
            ? "Edit Leave"
            : "Apply For " + getTypeName(leaveData.type) + " Leave"
        }
        visible={leaveVisible}
        className="w-[25rem] dialogHeader dialogContent"
        onHide={hideleaveDialog}
      >
        <Grid container rowSpacing={1.5} className="mt-2">
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
              className="w-full inputFieldStyle"
              invalid={!leaveValidation.reason}
            />
          </Grid>
          <Grid size={12} style={{ display: "flex", justifyContent: "center" }}>
            <CustomButton
              label={editMode ? "Edit" : "Apply"}
              onClick={async () => {
                await applyOrEditLeave(
                  editMode,
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
