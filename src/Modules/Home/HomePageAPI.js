import axios from "axios";
import { getUserData } from "../Login/Encrypt";
const endPoint = import.meta.env.VITE_END_POINT;
const imageURL = import.meta.env.VITE_IMAGE_API;

//Get user data
const getUserDataAPI = async (token) => {
  try {
    const response = await axios.get(`${endPoint}users`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Get Appraisal data
const getAppraisalData = async (token, doj) => {
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-appraisal?doj=${doj}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Get Training data
const getTrainingData = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-training`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Next Holiday API
const getNextHoliday = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-next-holiday`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Get Event data
const getEventData = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-eventlist`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Get Home Page Event Image
const getHomePageEvent = async (filename) => {
  const { token } = getUserData();
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/event-image?iamgename=${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Get Profile Image
const getProfileImage = async (filename) => {
  const { token } = getUserData();
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-profilepicture?iamgename=${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );
    return response;
  } catch (error) {
    console.log("Profile_Image_Error", error);
  }
};

//Get Notification Data
const getNotificationData = async (token) => {
  try {
    const response = await axios.get(`${endPoint}homepagemaster/homepage-notificationlist`,{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export {
  getNotificationData,
  getUserDataAPI,
  getAppraisalData,
  getTrainingData,
  getNextHoliday,
  getEventData,
  getHomePageEvent,
  getProfileImage,
};
