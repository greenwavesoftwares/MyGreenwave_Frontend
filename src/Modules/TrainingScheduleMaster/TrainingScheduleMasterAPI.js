import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;

//List OF all User Name
const getAllUserList = async (token) => {
  try {
    const response = await axios.get(`${endPoint}trainings/userlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log("response_api", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

//User ID wise training list
const getUseridWiseTrainingList = async (userId, token) => {
  try {
    const response = await axios.get(
      `${endPoint}trainings/training-list/${userId}`,
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

//Add New Training Post API
const postAddScheduleData = async (token, data) => {
  try {
    const response = await axios.post(
      `${endPoint}trainings/addscheduledata`,
      data,
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

//Get All Training Data
const getTrainingAllList = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}trainings/getalltrainingdata`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Post Update Confirm Data 
const postUpdateConfirm = async (token, updateData) => {
  try {
    const response =
      (`${endPoint}trainings/addscheduledata`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response
  } catch (error) {
    console.log(error);
  }
};
export {
  getAllUserList,
  getUseridWiseTrainingList,
  postAddScheduleData,
  getTrainingAllList,
  postUpdateConfirm,
};
