import axios from "axios";
import { getUserData } from "../../Modules/Login/Encrypt";
const endPoint = import.meta.env.VITE_END_POINT;


//Get User Page Info
const getMenuInfoDetails = async () => {
  try {
    const userDetails=getUserData()
    const userId = userDetails?.userDetails?.userId;
    const token=userDetails.token

    const response = await axios.get(`${endPoint}menu/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.log(error);
  }
};




export { getMenuInfoDetails };