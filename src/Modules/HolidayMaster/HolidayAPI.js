import axios from "axios";
import { getUserData } from "../Login/Encrypt";
import { showErrorMessage } from "../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

const getHolidaysAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}holidays`, {
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
const getHolidayDatesAPI = async () => {
  try {
    const response = await axios.get(`${endPoint}holidays/dates`, {
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
const addHolidaysAPI = async (addholidayData, toastRef) => {
  try {
    const response = await axios.post(`${endPoint}holidays`, addholidayData, {
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
const editHolidaysAPI = async (editholidayData, toastRef) => {
  try {
    const response = await axios.patch(
      `${endPoint}holidays/${editholidayData.holidayId}`,
      editholidayData,
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

export { getHolidaysAPI, addHolidaysAPI, editHolidaysAPI, getHolidayDatesAPI };
