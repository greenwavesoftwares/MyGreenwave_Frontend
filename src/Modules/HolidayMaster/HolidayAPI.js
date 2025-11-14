import axios from "axios";
import { getUserData } from "../Login/Encrypt";
import { showErrorMessage } from "../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT;
// const userData = getUserData();

const getHolidaysAPI = async () => {
  const userData = getUserData();
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
  const userData = getUserData();
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
  const userData = getUserData();
  try {
    console.log('addholidayData',addholidayData)
    const response = await axios.post(`${endPoint}holidays`, addholidayData, {
      headers: {
        Authorization: `Bearer ${userData.token}`,
      },
    }); 
    console.log("response.data",response.data)
    return response.data;
  } catch (error) {
    console.error("Error fetching forminfo with versions:", error);
    showErrorMessage(toastRef, "Error", error.response.data.toString());
    return null;
  }
};
const editHolidaysAPI = async (editholidayData, toastRef) => {
  const userData = getUserData();
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
const insertLeaveMaster=async(row)=>{
  try{
    console.log('row',row)
    const userData = getUserData();
   const response = await axios.post(`${endPoint}holidays/holidaymaster`, row,{
      headers: {
        Authorization: `Bearer ${userData.token}`,
      },
    }); 
    console.log("response.data",response.data)
     return {
      status: true,
      message: "Applied successfully.",
      data: response.data,
    };
  }catch(error)
  {
      return {
      status: false,
      message: error.response?.data || error.message  ,
      data: [],
    };
  }
}

const getLeaveMaster=async()=>{
  try{
    const userData = getUserData();

      const response = await axios.get(`${endPoint}holidays/holidaymaster`, {
      headers: {
        Authorization: `Bearer ${userData.token}`,
      },
    });
    console.log('response',response.data)
      return {
      status: true,
      message: "Applied successfully.",
      data: response.data,
    };
  }catch(error)
  {
     return {
      status: false,
      message: error.response?.data || error.message  ,
      data: [],
    };
  }
}

export { getHolidaysAPI, addHolidaysAPI, editHolidaysAPI, getHolidayDatesAPI,insertLeaveMaster,getLeaveMaster };
