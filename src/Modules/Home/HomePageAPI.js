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
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-notificationlist`,
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

//Get Tour Claims Data
const getTourClaimsData = async (token) => {
  try {
    const response = await axios.get(`${endPoint}api/homepage-details`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Post Profile Picture Upload
const postProfilePictureUpload = async (token, file, empId, userName) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("empId", empId);
    formData.append("userName", userName);

    const response = await axios.post(
      `${endPoint}homepagemaster/save-profilepictue`,
      formData,
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

//Post On Tour Switch Update
const postOnTourSwitchUpdate = async (token, onTourSwitch) => {
  try {
    const response = await axios.post(
      `${endPoint}homepagemaster/homepage-ontour?status=${onTourSwitch}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    return error;
    // console.log(error);
    // throw error;
  }
};

//Post Feedback Form
const postFeedbackForm = async (token, feedback) => {
  try {
    const response = await axios.post(
      `${endPoint}emails/feedback?body=${feedback}`,
      {},
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
export {
  getNotificationData,
  getUserDataAPI,
  getAppraisalData,
  getTrainingData,
  getNextHoliday,
  getEventData,
  getHomePageEvent,
  getProfileImage,
  getTourClaimsData,
  postProfilePictureUpload,
  postOnTourSwitchUpdate,
  postFeedbackForm
};
