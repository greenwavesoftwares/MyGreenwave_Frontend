import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { getInitial } from "../../AdminPage/AdminFunction";
import {
  approveLeaveAPI,
  getLeaveRequestsForManagerApprovalAPI,
  getTeamLeavesCalenderForManagerAPI,
  getTeamLeavesTableForManagerAPI,
  getUserLeaveInfoAPI,
  rejectLeaveAPI,
  reviewingLeaveAPI,
} from "./LeaveAdminAPI";
import { format, parse } from "date-fns";

const dateformat = "yyyy-MM-dd";

const onPageLoad = async () => {
  let hrLeaveData = {};

  // let requestValue = await getLeaveRequestsForManagerApprovalAPI();
  // hrLeaveData.requestData = requestValue
  //   ? requestValue.managerHRRemarkTable
  //   : [];

  // let calenderValue = await getTeamLeavesCalenderForManagerAPI();
  // hrLeaveData.calenderData = calenderValue
  //   ? await setCalenderData(calenderValue.managerHRRemarkTable)
  //   : [];

  return hrLeaveData;
};
const getUserLeaveInfo = async (year) => {
  let userLeaveInfo = await getUserLeaveInfoAPI(year);
  return userLeaveInfo ? userLeaveInfo : [];
};
const setCalenderData = async (calenderValue) => {
  let calenderDataList = [];
  const uniqueDates = [...new Set(calenderValue.map((p) => p.fromDate))];
  uniqueDates.map((date) => {
    let calenderData = {};
    calenderData.start = date;
    calenderData.end = date;
    calenderData.overlap = false;
    calenderData.leaves = calenderValue
      .filter((p) => p.fromDate === date)
      .map((p) => {
        let initial = getInitial(p.userName);
        p.initialName = initial.initialName;
        p.initialColor = stringToVibrantPastelColor(p.userName);
        p.statusColor = getCalenderStatusColor(p.status);
        return p;
      });

    calenderDataList.push(calenderData);
  });
  return calenderDataList;
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
const approveLeave = async (leaveData, toastRef) => {
  const data = await approveLeaveAPI(leaveData, toastRef);
  if (data) {
    showSuccessMessage(toastRef, "Success", "Leave Approved");
  }
};
const rejectLeave = async (
  leaveData,
  reason,
  setRejectedValidation,
  toastRef
) => {
  if (reason.trim().length === 0) {
    showErrorMessage(
      toastRef,
      "Validation Error!",
      "Please Enter Reject Reason"
    );
    setRejectedValidation(false);
    return;
  }
  setRejectedValidation(true);
  const data = await rejectLeaveAPI(leaveData, reason, toastRef);
  if (data) {
    showSuccessMessage(toastRef, "Success", "Leave Rejected");
  }
};
const reviewingLeave = async (leaveData, isReviewing, toastRef) => {
  await reviewingLeaveAPI(leaveData, isReviewing, toastRef);
};

// const getNextDate = (date) => {
//   let parsedDate = parse(date, dateformat, new Date());
//   parsedDate.setDate(parsedDate.getDate() + 1);
//   return format(parsedDate, dateformat);
// };
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
// const getCalenderStatusColor = (status) => {
//   switch (status) {
//     case "Approved":
//       return "bg-green-400";
//     case "Rejected":
//       return "bg-red-400";
//     case "Pending":
//       return "bg-yellow-300";
//     default:
//       return null;
//   }
// };
const getCalenderStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "#4ade80"; // Tailwind green-400
    case "Rejected":
      return "#f87171"; // Tailwind red-400
    case "Pending":
      return "#fde047"; // Tailwind yellow-300
    default:
      return "#9ae600"; // Custom lime green
  }
};

function stringToVibrantPastelColor(input) {
  // Normalize and validate input
  input = input
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6);

  // Convert base-26 string to a number
  let base26 = 0;
  for (let i = 0; i < input.length; i++) {
    base26 = base26 * 26 + (input.charCodeAt(i) - 65);
  }

  // Use sine wave for smooth, controlled color distribution across the RGB spectrum
  function vibrantComponent(seedOffset) {
    const value = (Math.sin(base26 + seedOffset) + 1) / 2; // 0 to 1 range
    const min = 180; // Light pastel starts at 180
    const max = 255; // Upper limit for pastel (bright, but not too saturated)
    return Math.floor(min + value * (max - min)); // Value between min and max
  }

  const r = vibrantComponent(1); // Red component
  const g = vibrantComponent(2); // Green component
  const b = vibrantComponent(3); // Blue component

  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
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
  onSelectRowEdit,
  approveLeave,
  rejectLeave,
  reviewingLeave,
  getUserLeaveInfo,
};
