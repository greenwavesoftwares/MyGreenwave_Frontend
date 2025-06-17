import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
// const userData = getUserData();

const onPageLoadAPI = async (year) => {
  const userData = getUserData();
  try {
    const response = await axios.get(`${endPoint}leaves/${year}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return error.response.data;
  }
};
const applyLeaveAPI = async (leaveData, toastRef) => {
  const userData = getUserData();
  try {
    const response = await axios.post(
      `${endPoint}leaves/applications`,
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
const deleteLeaveAPI = async (leaveRowData, toastRef) => {
  const userData = getUserData();
  console.log(leaveRowData);
  try {
    const response = await axios.delete(`${endPoint}leaves`, {
      params: { leaveId: leaveRowData.leaveId },
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
const editLeaveAPI = async (leaveData, toastRef) => {
  const userData = getUserData();
  try {
    const response = await axios.put(`${endPoint}leaves`, leaveData, {
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

const downloadZip = async () => {
  console.log("Zip Download called");
  const year = "2024"; // Example: Change dynamically as needed
  const userId = "kousik.mondal@greenwave.co.in"; // Example: Change dynamically as needed

  fetch(`${endPoint}salaryslip/Form16/${year}/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("File not found");
      }
      return response.blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "salary_slip.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((error) => console.error("Error downloading file:", error));
};

export {
  onPageLoadAPI,
  applyLeaveAPI,
  deleteLeaveAPI,
  editLeaveAPI,
  downloadZip,
};
