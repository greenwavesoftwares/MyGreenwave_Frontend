import axios from "axios";
import { getUserData } from "../../Login/Encrypt";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
// const userData = getUserData();

const resetPasswordAPI = async (body, toastRef) => {
  const userData = getUserData();
  try {
    const response = await axios.put(`${endPoint}admin/resetpassword`, body, {
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
export { resetPasswordAPI };
