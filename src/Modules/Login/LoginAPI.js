import axios from "axios";
import { showErrorMessage } from "../../components/Toast/ShowMessage";
import { getUserData } from "./Encrypt";

const endPoint = import.meta.env.VITE_END_POINT;

const loginCheckAPI = async (credential, toastRef, showWPDialog) => {
  try {
    const response = await axios.post(`${endPoint}authenticate`, credential);
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    const response = error.response.data;
    if (error.status === 500) {
      showErrorMessage(toastRef, "Error", response.error);
    } else {
      if (response.toString().includes("Wrong Password"))
        showWPDialog(response.toString());
      else showErrorMessage(toastRef, "Error", response.toString());
    }
    return null;
  }
};
const getUserDetailsAPI = async (token) => {
  try {
    const response = await axios.get(`${endPoint}users`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    return null;
  }
};
const extendTokenExpirationAPI = async () => {
  const userData = getUserData();
  try {
    const response = await axios.get(`${endPoint}extendTokenExpiration`, {
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

export { loginCheckAPI, getUserDetailsAPI, extendTokenExpirationAPI };
