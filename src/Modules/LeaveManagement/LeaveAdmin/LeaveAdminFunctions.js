import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { getHolidayDates } from "../../HolidayMaster/HolidayFunction";
import { getActualLeave } from "../LeaveApplication/LeaveApplicationFunctions";
import {
  applyLeaveOnBehalfAPI,
  approveLeaveAPI,
  getLeaveOnBehalfDataAPI,
  getLeaveReportDataAPI,
  getLeaveRequestsForAdminApprovalAPI,
  getOntourReportDataAPI,
  getUserLeaveInfoAPI,
  rejectLeaveAPI,
} from "./LeaveAdminAPI";
import { format, parse } from "date-fns";

const dateformat = "yyyy-MM-dd";

//Leave Requests for Admin Approval
const getLeaveRequestsForAdminApproval = async () => {
  const requestValue = await getLeaveRequestsForAdminApprovalAPI();
  return requestValue ? requestValue.managerHRRemarkTable : [];
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
const approveLeave = async (leaveData, toastRef, setLeaveRequestTable) => {
  const data = await approveLeaveAPI(leaveData, toastRef);
  if (data) {
    setLeaveRequestTable((prev) => ({
      ...prev,
      table: prev.table.filter((leave) => leave.leaveId !== leaveData.leaveId),
    }));
    showSuccessMessage(toastRef, "Success", "Leave Approved");
  }
};
const rejectLeave = async (
  leaveData,
  reason,
  setRejectedValidation,
  hideRejectDialog,
  toastRef,
  setLeaveRequestTable
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
    setLeaveRequestTable((prev) => ({
      ...prev,
      table: prev.table.filter((leave) => leave.leaveId !== leaveData.leaveId),
    }));
    hideRejectDialog();
    showSuccessMessage(toastRef, "Success", "Leave Rejected");
  }
};

// Get User Leave Info
const getUserLeaveInfo = async (year) => {
  let userLeaveInfo = await getUserLeaveInfoAPI(year);
  return userLeaveInfo ? userLeaveInfo : [];
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

// Apply Leave On Behalf
const getLeaveOnBehalfData = async () => {
  const data = await getLeaveOnBehalfDataAPI();
  return data ? data : [];
};
const validateLeave = async (leaveData, setLeaveValidation, toastRef) => {
  if (
    !leaveData.dates[0] ||
    !leaveData.dates[1] ||
    !leaveData.reason ||
    !leaveData.type ||
    !leaveData.userId
  ) {
    setLeaveValidation((prevData) => ({
      ...prevData,
      dates: leaveData.dates[0] && leaveData.dates[1],
      reason: leaveData.reason,
      type: leaveData.type,
      userId: leaveData.userId,
    }));
    showErrorMessage(toastRef, "Validation Error!", "Please enter all fields");
    return false;
  } else
    setLeaveValidation((prevData) => ({
      ...prevData,
      dates: true,
      reason: true,
      type: true,
      userId: true,
    }));

  let holidayDates = await getHolidayDates();
  let actualLeave = getActualLeave(leaveData, holidayDates);
  switch (leaveData.type) {
    case "CL":
      if (actualLeave > 2) {
        showErrorMessage(
          toastRef,
          "Validation Error!",
          actualLeave > 2
            ? "CL can be taken for only 1 or 2 days"
            : "Something went wrong!"
        );
        setLeaveValidation((prev) => ({ ...prev, dates: false }));
        return false;
      }
      break;
  }
  return true;
};
const applyLeaveOnBehalf = async (
  leaveData,
  setLeaveValidation,
  setLeaveOnBehalfTable,
  setLeaveVisible,
  toastRef
) => {
  if (await validateLeave(leaveData, setLeaveValidation, toastRef)) {
    let applyData = {};
    applyData.userId = leaveData.userId;
    applyData.fromDate = format(leaveData.dates[0], dateformat);
    applyData.toDate = format(leaveData.dates[1], dateformat);
    applyData.leaveReason = leaveData.reason;
    applyData.leaveType = leaveData.type;

    const response = await applyLeaveOnBehalfAPI(applyData, toastRef);
    if (response) {
      setLeaveOnBehalfTable((prev) => ({
        ...prev,
        table: [...prev.table, response],
      }));
      setLeaveVisible(false);
      showSuccessMessage(toastRef, "Success", "Leave applied successfully!");
    }
  }
};

// Get On Tour Report Data
const getOntourReportData = async (dates) => {
  if (dates[0] && dates[1]) {
    const data = await getOntourReportDataAPI(
      format(dates[0], dateformat),
      format(dates[1], dateformat)
    );
    return data ? data : [];
  }
};

// Get Leave Report Data
const getLeaveReportData = async (dates) => {
  if (dates[0] && dates[1]) {
    const data = await getLeaveReportDataAPI(
      format(dates[0], dateformat),
      format(dates[1], dateformat)
    );
    return data ? data : [];
  }
};

//get current month daterange
const getCurrentMonthRange = () => {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return [startOfMonth, endOfMonth];
};

export {
  getCurrentDate,
  getLeaveRequestsForAdminApproval,
  getYearList,
  onSelectRowEdit,
  approveLeave,
  rejectLeave,
  getUserLeaveInfo,
  getOntourReportData,
  getLeaveReportData,
  getLeaveOnBehalfData,
  applyLeaveOnBehalf,
  getCurrentMonthRange
};
