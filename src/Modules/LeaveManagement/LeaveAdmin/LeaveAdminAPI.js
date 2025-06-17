import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
// const userData = getUserData();

//Leave Requests for Admin Approval
const getLeaveRequestsForAdminApprovalAPI = async () => {
  const userData = getUserData();
  try {
    const response = await axios.get(`${endPoint}leaves/admin/review`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};
const approveLeaveAPI = async (leaveData, toastRef) => {
  const userData = getUserData();
  try {
    const response = await axios.put(
      `${endPoint}leaves/accept-action`,
      leaveData,
      {
        params: { leaveId: leaveData.leaveId },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    const response = error.response.data;
    if (error.status === 500) {
      showErrorMessage(toastRef, "Error", response.error);
    } else {
      showErrorMessage(toastRef, "Error", response.toString());
    }
    return null;
  }
};
const rejectLeaveAPI = async (leaveData, reason, toastRef) => {
  const userData = getUserData();
  try {
    const response = await axios.put(`${endPoint}leaves/rejection`, leaveData, {
      params: { leaveId: leaveData.leaveId, reason: reason },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    const response = error.response.data;
    if (error.status === 500) {
      showErrorMessage(toastRef, "Error", response.error);
    } else {
      showErrorMessage(toastRef, "Error", response.toString());
    }
    return null;
  }
};

// Get User Leave Info
const getUserLeaveInfoAPI = async (year) => {
  const userData = getUserData();
  try {
    const response = await axios.get(
      `${endPoint}leaves/admin/user-leave-info/${year}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};

// Apply Leave On Behalf
const getLeaveOnBehalfDataAPI = async () => {
  const userData = getUserData();
  try {
    const response = await axios.get(
      `${endPoint}leaves/admin/leave-on-behalf`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};
const applyLeaveOnBehalfAPI = async (leaveData, toastRef) => {
  const userData = getUserData();
  try {
    const response = await axios.post(
      `${endPoint}leaves/application-on-behalf`,
      leaveData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    const response = error.response.data;
    if (error.status === 500) {
      showErrorMessage(toastRef, "Error", response.error);
    } else {
      showErrorMessage(toastRef, "Error", response.toString());
    }
    return null;
  }
};

// Get On Tour Report Data
const getOntourReportDataAPI = async (fromDate, toDate) => {
  const userData = getUserData();
  try {
    const response = await axios.get(
      `${endPoint}leaves/admin/on-tour-report/${fromDate}/${toDate}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};

// Get Leave Report Data
const getLeaveReportDataAPI = async (fromDate, toDate) => {
  const userData = getUserData();
  try {
    const response = await axios.get(
      `${endPoint}leaves/admin/leave-report-data/${fromDate}/${toDate}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};

export {
  getLeaveRequestsForAdminApprovalAPI,
  approveLeaveAPI,
  rejectLeaveAPI,
  getUserLeaveInfoAPI,
  getOntourReportDataAPI,
  getLeaveReportDataAPI,
  getLeaveOnBehalfDataAPI,
  applyLeaveOnBehalfAPI,
};
