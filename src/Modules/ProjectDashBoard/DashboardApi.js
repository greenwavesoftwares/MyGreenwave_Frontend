import axios from "axios";
import { getUserData } from "../Login/Encrypt";

const endPoint = import.meta.env.VITE_END_POINT;


//Get User Page Info
export const getUnallocatedResources = async (months,year) => {
  try {
    const userDetails=getUserData()
    const userId = userDetails?.userDetails?.userId;
    const token=userDetails.token

    const response = await axios.get(`${endPoint}activityTracker/getAllUnallocatedUsersByManager/${userId}/month/${months}/year/${year}`, {
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
