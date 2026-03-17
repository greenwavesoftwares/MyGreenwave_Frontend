import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;

//Get all the trining
const getTrainingDetails = async (token) => {
  try {
    const response = await axios.get(`${endPoint}trainings/training-details`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//Create a new training post api 
const postTrainingDetailsData = async (formData, token) => {
  try {
    const response = await axios.post(
      `${endPoint}trainings/training-details`,
      JSON.stringify(formData),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//Training Master Update API
const putTrainingDetailsData = async (formData, token, id) => {
  try {
    const response = await axios.put(
      `${endPoint}trainings/training-details/${id}`,
      JSON.stringify(formData),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//Delete Training Data 
const deleteTrainingDetailsData = async (formData, token) => {
  try {
    const response = await axios.delete(
      `${endPoint}trainings/training-details`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: formData, // Attach formData here
      },
    );
    return response;
  } catch (error) {
    console.error("Error deleting training details:", error);
  }
};

export {
  getTrainingDetails,
  postTrainingDetailsData,
  putTrainingDetailsData,
  deleteTrainingDetailsData,
};
