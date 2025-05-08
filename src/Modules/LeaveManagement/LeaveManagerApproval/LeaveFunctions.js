import {
  applyLeaveAPI,
  deleteLeaveAPI,
  editLeaveAPI,
  getDataOnLoad,
} from "./LeaveManagementAPI";
import { format, parse } from "date-fns";
import { getHolidays } from "../HolidayMaster/HolidayFunction";
import { showSuccessMessage } from "../../components/Toast/ShowMessage";

const dateformat = "yyyy-MM-dd";

const onPageLoad = async (userId, year) => {
  const leaveData = {
    chartData: {},
    tableData: [],
    cardData: {},
    calenderData: {},
    holidays: {},
  };
  let value = await getDataOnLoad(userId, year);
  let holidays = await getHolidays();
  leaveData.chartData = await setChartData(value.attendanceLeaveCount);
  leaveData.tableData = value.userLeaves;
  leaveData.cardData = value.userLeaveCounts;
  leaveData.calenderData = await setCalenderData(
    value.userLeaves,
    holidays.holiday
  );
  leaveData.holidays = holidays.holiday;
  return leaveData;
  // downloadZip();
};
const setChartData = async (chartData) => {
  let month = [],
    workingDay = [],
    attendance = [],
    leave = [],
    cumulativeLeave = [];
  chartData.map((p) => {
    month.push(p.monthName);
    workingDay.push(p.workingDay);
    attendance.push(p.attendance);
    leave.push(p.leave);
    cumulativeLeave.push(p.cumulative_Leave);
  });

  const dataOptions = { data: {}, options: {} };

  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue("--text-color");
  const textColorSecondary = documentStyle.getPropertyValue(
    "--text-color-secondary"
  );
  const data = {
    labels: month,
    datasets: [
      {
        type: "bar",
        label: "Working Day",
        backgroundColor: documentStyle.getPropertyValue("--yellow-300"),
        data: workingDay,
        borderColor: "white",
        borderWidth: 2,
        order: 2,
      },
      {
        type: "bar",
        label: "Attendence",
        backgroundColor: documentStyle.getPropertyValue("--blue-500"),
        data: attendance,
        borderColor: "white",
        borderWidth: 2,
        order: 2,
      },
      {
        type: "bar",
        label: "Leave",
        backgroundColor: documentStyle.getPropertyValue("--red-500"),
        data: leave,
        order: 2,
      },
      {
        type: "line",
        label: "Cumulative Leave",
        borderColor: documentStyle.getPropertyValue("--green-500"),
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        data: cumulativeLeave,
        order: 1,
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
  dataOptions.data = data;
  dataOptions.options = options;

  return dataOptions;
};
const setCalenderData = async (userLeaves, holidays) => {
  let calenderDataList = [];
  userLeaves.map((row) => {
    let calenderData = {};
    calenderData.start = row.fromDate;
    calenderData.end =
      row.actualLeave > 1 ? getNextDate(row.toDate) : row.toDate;
    calenderData.color = getColorBySeverity(row.severity);
    calenderData.overlap = false;
    calenderData.display = "background";
    calenderData.id = row.reason;

    calenderDataList.push(calenderData);
  });

  holidays.map((row) => {
    let calenderData = {};
    calenderData.start = row.fromDate;
    calenderData.end =
      row.totalNoOfDays > 1 ? getNextDate(row.toDate) : row.toDate;
    calenderData.color = getColorBySeverity("info");
    calenderData.overlap = false;
    calenderData.display = "background";
    calenderData.id = row.holidays;

    calenderDataList.push(calenderData);
  });

  return calenderDataList;
};
const applyLeave = async (
  userId,
  applyLeaveData,
  toastRef,
  selectedYear,
  setLeaveData,
  clearApplyDialog
) => {
  let leaveData = {};
  leaveData.userId = userId;
  leaveData.fromDate = format(applyLeaveData.dates[0], dateformat);
  leaveData.toDate = format(applyLeaveData.dates[1], dateformat);
  leaveData.leaveReason = applyLeaveData.reason;
  leaveData.compensatory = applyLeaveData.isCompensatory;
  const response = await applyLeaveAPI(leaveData, toastRef);
  if (response) {
    setLeaveData(await onPageLoad(userId, selectedYear));
    let message =
      response.leaveDetails.type +
      " applied successfully! Being Reviewed by " +
      response.appliedTo;
    showSuccessMessage(toastRef, "Success", message);
    clearApplyDialog();
  }
};
const deleteLeave = async (
  leaveRowData,
  toastRef,
  userId,
  selectedYear,
  setLeaveData
) => {
  const response = await deleteLeaveAPI(leaveRowData, toastRef);
  if (response) {
    showSuccessMessage(toastRef, "Success", "Leave deleted Successfully");
    setLeaveData(await onPageLoad(userId, selectedYear));
  }
};
const onSelectRowEdit = async (
  row,
  setEditLeaveData,
  setEditLeaveDialogVisible
) => {
  let dateRange = [];
  dateRange.push(parse(row.fromDate, dateformat, new Date()));
  dateRange.push(parse(row.toDate, dateformat, new Date()));
  setEditLeaveData((prev) => ({
    ...prev,
    dates: dateRange,
    reason: row.reason,
    isCompensatory: row.type === "Compensatory",
    leaveId: row.leaveId,
  }));
  setEditLeaveDialogVisible(true);
};
const editLeave = async (
  userId,
  editLeaveData,
  toastRef,
  selectedYear,
  setLeaveData,
  clearEditDialog
) => {
  let leaveData = {};
  leaveData.userId = userId;
  leaveData.fromDate = format(editLeaveData.dates[0], dateformat);
  leaveData.toDate = format(editLeaveData.dates[1], dateformat);
  leaveData.leaveReason = editLeaveData.reason;
  leaveData.compensatory = editLeaveData.isCompensatory;
  leaveData.leaveId = editLeaveData.leaveId;
  const response = await editLeaveAPI(leaveData, toastRef);
  if (response) {
    setLeaveData(await onPageLoad(userId, selectedYear));
    showSuccessMessage(toastRef, "Success", "Leave Edited Successfully");
    clearEditDialog();
  }
};

const getNextDate = (date) => {
  let parsedDate = parse(date, dateformat, new Date());
  parsedDate.setDate(parsedDate.getDate() + 1);
  return format(parsedDate, dateformat);
};
const getCurrentDate = () => {
  const currentDate = new Date();
  return currentDate;
};
const getYearList = () => {
  let year = 2023;
  const yearList = [];
  for (let i = year; i <= format(new Date(), "yyyy"); i++) {
    yearList.push(i);
  }
  return yearList;
};
const getColorBySeverity = (severity) => {
  const documentStyle = getComputedStyle(document.documentElement);
  let color = "";
  switch (severity) {
    case "success":
      color = documentStyle.getPropertyValue("--green-500");
      break;
    case "warning":
      color = documentStyle.getPropertyValue("--yellow-300");
      break;
    case "danger":
      color = documentStyle.getPropertyValue("--red-500");
      break;
    case "info":
      color = documentStyle.getPropertyValue("--blue-500");
      break;
    default:
      color = "";
      break;
  }
  return color;
};

export {
  getCurrentDate,
  onPageLoad,
  getYearList,
  applyLeave,
  deleteLeave,
  editLeave,
  onSelectRowEdit,
};
