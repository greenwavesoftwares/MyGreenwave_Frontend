import axios from "axios";
import { getUserData } from "../Login/Encrypt";

const endPoint = import.meta.env.VITE_END_POINT;
const userData = getUserData();

const getAllUsersAPI = async () => {
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
export { getAllUsersAPI };
