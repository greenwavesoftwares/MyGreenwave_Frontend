import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

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
export { addUserGroupAPI, editUserGroupAPI };
