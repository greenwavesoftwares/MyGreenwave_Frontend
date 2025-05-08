import {
  applyLeaveAPI,
  deleteLeaveAPI,
  editLeaveAPI,
  onPageLoadAPI,
} from "./LeaveApplicationAPI";
import { format, parse } from "date-fns";
import {
  getHolidayDates,
  getHolidays,
} from "../../HolidayMaster/HolidayFunction";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { getUserData } from "../../Login/Encrypt";

const dateformat = "yyyy-MM-dd";
const userDetails = getUserData()?.userDetails;

const onPageLoad = async (year) => {
  const leaveData = {};
  let value = await onPageLoadAPI(year);
  let holidays = await getHolidays();
  leaveData.chartData = await setChartData(value.attendanceLeaveCount);
  leaveData.tableData = value.userLeaves;
  leaveData.cardData = value.userLeaveCounts;
  leaveData.calenderData = await setCalenderData(
    value.userLeaves,
    holidays.holiday
  );
  leaveData.holidays = holidays.holiday;
  leaveData.holidayDates = await getHolidayDates();
  return leaveData;
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
const validateLeave = (leaveData, leaveInfo, setLeaveValidation, toastRef) => {
  if (!leaveData.dates[0] || !leaveData.dates[1] || !leaveData.reason) {
    setLeaveValidation((prevData) => ({
      ...prevData,
      dates: leaveData.dates[0] && leaveData.dates[1],
      reason: leaveData.reason,
    }));
    showErrorMessage(toastRef, "Validation Error!", "Please enter all fields");
    return false;
  } else
    setLeaveValidation((prevData) => ({
      ...prevData,
      dates: true,
      reason: true,
    }));
  let actualLeave = getActualLeave(leaveData, leaveInfo.holidayDates);
  console.log(actualLeave);
  switch (leaveData.type) {
    case "normal":
      break;
  }
};
const applyOrEditLeave = async (
  leaveData,
  leaveInfo,
  setLeaveValidation,
  setLeaveInfo,
  hideleaveDialog,
  toastRef
) => {
  if (validateLeave(leaveData, leaveInfo, setLeaveValidation, toastRef)) {
    let applyData = {};
    applyData.userId = userDetails.userId;
    applyData.fromDate = format(leaveData.dates[0], dateformat);
    applyData.toDate = format(leaveData.dates[1], dateformat);
    applyData.leaveReason = leaveData.reason;
    applyData.compensatory = leaveData.type === "compensatory";
    showSuccessMessage(toastRef, "Success", "Applied Successfully");
    // const response = await applyLeaveAPI(applyData, toastRef);
    // if (response) {
    //   setLeaveInfo(await onPageLoad(getCurrentYear()));
    //   let message =
    //     response.leaveDetails.type +
    //     " applied successfully! Being Reviewed by " +
    //     response.appliedTo;
    //   showSuccessMessage(toastRef, "Success", message);
    //   hideleaveDialog();
    // }
  }
};
const deleteLeave = async (leaveData, setLeaveInfo, toastRef) => {
  const response = await deleteLeaveAPI(leaveData, toastRef);
  if (response) {
    showSuccessMessage(toastRef, "Success", "Leave deleted Successfully");
    setLeaveInfo(await onPageLoad(getCurrentYear()));
  }
};
const onSelectRowEdit = (row) => {
  return {
    dates: [
      parse(row.fromDate, dateformat, new Date()),
      parse(row.toDate, dateformat, new Date()),
    ],
    reason: row.reason,
    type: row.type === "PL" || row.type === "CL" ? "normal" : row.type,
    leaveId: row.leaveId,
  };
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
  return new Date();
};
const getCurrentYear = () => {
  return format(new Date(), "yyyy");
};
const getYearList = () => {
  let year = 2023;
  const yearList = [];
  for (let i = year; i <= getCurrentYear(); i++) {
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
const getTypeName = (type) => {
  let typeName = "";
  switch (type) {
    case "normal":
      typeName = "CL/PL";
      break;
    case "compensatory":
      typeName = "Compensatory";
      break;
    case "prevPL":
      typeName = "Previous PL";
      break;
  }
  return typeName;
};
const getActualLeave = (leaveData, holidays) => {
  let count = 0;
  let tempDate = leaveData.dates[0];
  while (tempDate <= leaveData.dates[1]) {
    if (
      tempDate.getDay() !== 0 &&
      tempDate.getDay() !== 6 &&
      holidays.includes(tempDate)
    )
      console.log(tempDate);
    count++;
    tempDate.setDate(tempDate.getDate() + 1);
  }
  return count;
};

export {
  getCurrentDate,
  onPageLoad,
  getYearList,
  applyOrEditLeave,
  deleteLeave,
  editLeave,
  onSelectRowEdit,
  getTypeName,
  getCurrentYear,
};
