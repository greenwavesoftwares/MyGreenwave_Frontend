import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;

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
  }
};

const postTrainingDetailsData = async (formData, token) => {
  try {
    const response = await axios.post(
      `${endPoint}trainings/training-details`,
      JSON.stringify(formData),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

const deleteTrainingDetailsData = async (formData, token) => {
  console.log("deleteTrainingDetailsData", formData);

  try {
    const response = await axios.delete(`${endPoint}trainings/training-details`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: formData, // Attach formData here
    });
    return response
  } catch (error) {
    console.error("Error deleting training details:", error);
    
  }
};


export { getTrainingDetails, postTrainingDetailsData,deleteTrainingDetailsData };
