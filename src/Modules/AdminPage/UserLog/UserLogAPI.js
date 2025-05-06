import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

const addUserLogAPI = async (userLog, toastRef) => {
  try {
    const response = await axios.post(`${endPoint}admin/savelogs`, userLog, {
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
const getUserLogsAPI = async (userId, toastRef) => {
  try {
    const response = await axios.get(`${endPoint}admin/getlogs/${userId}`, {
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

export { getUserLogsAPI, addUserLogAPI };
