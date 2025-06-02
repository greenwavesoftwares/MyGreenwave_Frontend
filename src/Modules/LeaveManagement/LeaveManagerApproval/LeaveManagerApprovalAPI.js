import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

const getLeaveRequestsForManagerApprovalAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}leaves/review`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    // console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};
const getTeamLeavesTableForManagerAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}leaves/review/all`, {
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
const getTeamLeavesCalenderForManagerAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}leaves/review/calendar`, {
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
const reviewingLeaveAPI = async (leaveData, toastRef) => {
  try {
    const response = await axios.put(`${endPoint}leaves/reviewing`, leaveData, {
      params: { leaveId: leaveData.leaveId },
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

export {
  getLeaveRequestsForManagerApprovalAPI,
  getTeamLeavesTableForManagerAPI,
  getTeamLeavesCalenderForManagerAPI,
  approveLeaveAPI,
  rejectLeaveAPI,
  reviewingLeaveAPI,
};
