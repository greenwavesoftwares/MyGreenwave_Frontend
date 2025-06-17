import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
// const userData = getUserData();

const getAllDesignationsAPI = async () => {
  const userData = getUserData();
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
  const userData = getUserData();
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
export { getAllDesignationsAPI, addDesignationAPI };
