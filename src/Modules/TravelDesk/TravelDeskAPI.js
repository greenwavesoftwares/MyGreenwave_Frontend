import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;

//My Form Api Call For the login user
const getMyFormTravelData = async (token) => {
  try {
    const response = await axios.get(`${endPoint}traveldesk/travels/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};
const getMyFormParticularRequisitionId = async (token, requisionId) => {
  try {
    const response = await axios.get(
      `${endPoint}traveldesk/travels/${requisionId}`,
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

export const getTravelsByStatus = async (token, statusName) => {
  try {
    const response = await axios.get(
      `${endPoint}traveldesk/travels-by-status/${statusName}`,
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

export { getMyFormTravelData, getMyFormParticularRequisitionId };
