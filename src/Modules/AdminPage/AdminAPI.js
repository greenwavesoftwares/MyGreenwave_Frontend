import axios from "axios";
import { getUserData } from "../Login/Encrypt";
import { showErrorMessage } from "../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

const getDataOnLoad = async () => {
  try {
    const response = await axios.get(`${endPoint}admin/allusers`, {
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
const getAllDesignationsAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}admin/designation`, {
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
const addDesignationAPI = async (designation, toastRef) => {
  try {
    const response = await axios.post(
      `${endPoint}admin/designation/${designation}`,
      {},
      {
        headers: {
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
const addUserGroupAPI = async (userGroup, toastRef) => {
  try {
    const response = await axios.post(`${endPoint}admin/addgroup`, userGroup, {
      headers: {
        Authorization: `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    showErrorMessage(toastRef, "Error", error.response.data.toString());
    return null;
  }
};
const editUserGroupAPI = async (groupId, userGroup, toastRef) => {
  try {
    const response = await axios.put(
      `${endPoint}admin/updategroup/${groupId}`,
      userGroup,
      {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    showErrorMessage(toastRef, "Error", error.response.data.toString());
    return null;
  }
};
const getAllManagersAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}admin/managers`, {
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
export {
  getDataOnLoad,
  getAllDesignationsAPI,
  addDesignationAPI,
  getAllManagersAPI,
  addUserGroupAPI,
  editUserGroupAPI,
};
