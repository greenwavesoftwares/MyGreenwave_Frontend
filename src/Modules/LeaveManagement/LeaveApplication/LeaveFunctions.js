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
import {
  hideLoading,
  showLoading,
} from "../../../components/LoadingScreen/LoadingContext";

const dateformat = "yyyy-MM-dd";
const userDetails = getUserData()?.userDetails;

const onPageLoad = async (year) => {
  showLoading();
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
  hideLoading();
  return leaveData;
};
const setChartData = async (leaveData) => {
  let month = [],
    workingDay = [],
    attendance = [],
    leave = [],
    cumulativeLeave = [];
  leaveData.map((p) => {
    month.push(p.monthName);
    workingDay.push(p.workingDay);
    attendance.push(p.attendance);
    leave.push(p.leave);
    cumulativeLeave.push(p.cumulative_Leave);
  });

  let chartData = {};

  //Yearly Chart Data

  let yearlyChart = {};
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue("--text-color");
  const textColorSecondary = documentStyle.getPropertyValue(
    "--text-color-secondary"
  );
  const yearlyChartData = {
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

  const yearlyChartOptions = {
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
  yearlyChart.data = yearlyChartData;
  yearlyChart.options = yearlyChartOptions;
  chartData.yearlyChart = yearlyChart;

  //Attendance Card Data

  let attendanceChart = {};
  const attendanceData = attendance.map((val, index, arr) => {
    if (index > 0 && val === arr[index - 1]) {
      return val + Math.random() * 0.1;
    }
    return val;
  });
  const attendanceChartData = {
    labels: month,
    datasets: [
      {
        type: "line",
        label: "Attendance",
        borderColor: documentStyle.getPropertyValue("--blue-500"),
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        data: attendanceData,
        order: 1,
      },
    ],
  };

  const attendanceChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false, // ❌ hide legend
      },
    },
    elements: {
      point: {
        radius: 0, // ❌ remove dots from line
      },
    },
    scales: {
      x: {
        display: false, // ❌ hide x-axis
      },
      y: {
        display: false, // ❌ hide y-axis
      },
    },
  };
  attendanceChart.data = attendanceChartData;
  attendanceChart.options = attendanceChartOptions;
  chartData.attendanceChart = attendanceChart;

  //Cumulative Leave Card Data

  let cumulativeLeaveChart = {};
  const cumulativeLeaveData = cumulativeLeave.map((val, index, arr) => {
    if (index > 0 && val === arr[index - 1]) {
      return val + Math.random() * 0.1;
    }
    return val;
  });
  const cumulativeLeaveChartData = {
    labels: month,
    datasets: [
      {
        type: "line",
        label: "Cumulative Leave",
        borderColor: documentStyle.getPropertyValue("--red-500"),
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        data: cumulativeLeaveData,
        order: 1,
      },
    ],
  };

  const cumulativeLeaveChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false, // ❌ hide legend
      },
    },
    elements: {
      point: {
        radius: 0, // ❌ remove dots from line
      },
    },
    scales: {
      x: {
        display: false, // ❌ hide x-axis
      },
      y: {
        display: false, // ❌ hide y-axis
      },
    },
  };
  cumulativeLeaveChart.data = cumulativeLeaveChartData;
  cumulativeLeaveChart.options = cumulativeLeaveChartOptions;
  chartData.cumulativeLeaveChart = cumulativeLeaveChart;
  return chartData;
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
const validateLeave = (
  editMode,
  leaveData,
  leaveInfo,
  setLeaveValidation,
  toastRef
) => {
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

  if (
    isLeaveWithinLeaves(
      editMode,
      editMode ? leaveData.leaveId : "",
      leaveData.dates,
      leaveInfo.tableData
    )
  ) {
    setLeaveValidation((prevData) => ({
      ...prevData,
      dates: false,
    }));
    showErrorMessage(
      toastRef,
      "Validation Error!",
      "Leave already exists for selected dates"
    );
    return false;
  } else
    setLeaveValidation((prevData) => ({
      ...prevData,
      dates: true,
    }));

  let actualLeave = getActualLeave(leaveData, leaveInfo.holidayDates);
  let cardData = leaveInfo.cardData;
  let rowtotalNoOfDays = editMode
    ? leaveInfo.tableData
        .filter((l) => l.leaveId === leaveData.leaveId)
        .map((l) => l.actualLeave)
    : 0;
  switch (leaveData.type) {
    case "CL":
      if (
        actualLeave > 2 ||
        actualLeave > cardData.clBalance + rowtotalNoOfDays
      ) {
        showErrorMessage(
          toastRef,
          "Validation Error!",
          actualLeave > 2
            ? "CL can be taken for only 1 or 2 days"
            : actualLeave > cardData.clBalance
            ? "Not enough CL"
            : "Something went wrong!"
        );
        setLeaveValidation((prev) => ({ ...prev, dates: false }));
        return false;
      }
      break;
    case "PL":
      if (actualLeave > cardData.plBalance + rowtotalNoOfDays) {
        showErrorMessage(
          toastRef,
          "Validation Error!",
          actualLeave > cardData.plBalance
            ? "Not enough PL"
            : "Something went wrong!"
        );
        setLeaveValidation((prev) => ({ ...prev, dates: false }));
        return false;
      }
      break;
    case "Compensatory":
      if (actualLeave > cardData.currentCompOff + rowtotalNoOfDays) {
        showErrorMessage(
          toastRef,
          "Validation Error!",
          actualLeave > cardData.currentCompOff
            ? "Not enough Compensatory Leave"
            : "Something went wrong!"
        );
        setLeaveValidation((prev) => ({ ...prev, dates: false }));
        return false;
      }
      break;
    case "Medical":
      if (actualLeave > cardData.medicalBalance + rowtotalNoOfDays) {
        showErrorMessage(
          toastRef,
          "Validation Error!",
          actualLeave > cardData.medicalBalance
            ? "Not enough medical leave"
            : "Something went wrong!"
        );
        setLeaveValidation((prev) => ({ ...prev, dates: false }));
        return false;
      }
      break;
    case "PrevPL":
      if (actualLeave > cardData.prevPL + rowtotalNoOfDays) {
        showErrorMessage(
          toastRef,
          "Validation Error!",
          actualLeave > cardData.prevPL
            ? "Not enough Previous PL"
            : "Something went wrong!"
        );
        setLeaveValidation((prev) => ({ ...prev, dates: false }));
        return false;
      }
      break;
  }
  return true;
};
const applyOrEditLeave = async (
  editMode,
  leaveData,
  leaveInfo,
  setLeaveValidation,
  setLeaveInfo,
  hideleaveDialog,
  toastRef
) => {
  showLoading();
  if (
    validateLeave(editMode, leaveData, leaveInfo, setLeaveValidation, toastRef)
  ) {
    let applyData = {};
    applyData.userId = userDetails.userId;
    applyData.fromDate = format(leaveData.dates[0], dateformat);
    applyData.toDate = format(leaveData.dates[1], dateformat);
    applyData.leaveReason = leaveData.reason;
    applyData.leaveType = leaveData.type;
    editMode ? (applyData.leaveId = leaveData.leaveId) : null;
    applyData.actualLeaveCount = getActualLeave(
      leaveData,
      leaveInfo.holidayDates
    );
    const response = editMode
      ? await editLeaveAPI(applyData, toastRef)
      : await applyLeaveAPI(applyData, toastRef);
    if (response) {
      let message = editMode
        ? "Leave Edited Successfully"
        : response.leaveDetails.type +
          " applied successfully! Being Reviewed by " +
          response.appliedTo;
      showSuccessMessage(toastRef, "Success", message);
      hideleaveDialog();
      setLeaveInfo(await onPageLoad(getCurrentYear()));
    }
  }
  hideLoading();
};
const deleteLeave = async (leaveData, setLeaveInfo, toastRef) => {
  showLoading();
  const response = await deleteLeaveAPI(leaveData, toastRef);
  if (response) {
    showSuccessMessage(toastRef, "Success", "Leave deleted Successfully");
    setLeaveInfo(await onPageLoad(getCurrentYear()));
  }
  hideLoading();
};
const onSelectRowEdit = (row) => {
  return {
    dates: [
      parse(row.fromDate, dateformat, new Date()),
      parse(row.toDate, dateformat, new Date()),
    ],
    reason: row.reason,
    type: row.type,
    leaveId: row.leaveId,
  };
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
    case "CL":
      typeName = "CL";
      break;
    case "PL":
      typeName = "PL";
      break;
    case "Compensatory":
      typeName = "Compensatory";
      break;
    case "Medical":
      typeName = "Medical";
      break;
    case "PrevPL":
      typeName = "Previous PL";
      break;
  }
  return typeName;
};
const getActualLeave = (leaveData, holidays) => {
  let count = 0;
  let tempDate = new Date(leaveData.dates[0]);
  tempDate.setHours(0, 0, 0, 0);
  console.log("toDate : ", leaveData.dates[1]);
  while (tempDate <= leaveData.dates[1]) {
    if (
      tempDate.getDay() !== 0 &&
      tempDate.getDay() !== 6 &&
      !holidays.includes(tempDate)
    )
      count++;
    tempDate.setDate(tempDate.getDate() + 1);
  }
  return count;
};
const isLeaveWithinLeaves = (editmode, leaveId, dates, leaveList) => {
  return leaveList
    .filter(
      (l) =>
        l.status !== "Rejected" &&
        (!editmode || (editmode && l.leaveId !== leaveId))
    )
    .map((l) => ({
      fromDate: parse(l.fromDate, dateformat, new Date()),
      toDate: parse(l.toDate, dateformat, new Date()),
    }))
    .some(
      (d) =>
        (dates[0] >= d.fromDate && dates[0] <= d.toDate) ||
        (dates[1] >= d.fromDate && dates[1] <= d.toDate)
    );
};

export {
  getCurrentDate,
  onPageLoad,
  getYearList,
  applyOrEditLeave,
  deleteLeave,
  onSelectRowEdit,
  getTypeName,
  getCurrentYear,
};
