import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

const addNewUserAPI = async (newUser, toastRef) => {
  try {
    const response = await axios.post(`${endPoint}admin/createuser`, newUser, {
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
const editUserAPI = async (user, toastRef) => {
  try {
    const response = await axios.put(
      `${endPoint}admin/updateuser/${user.userId}`,
      user,
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
export { addNewUserAPI, editUserAPI };
