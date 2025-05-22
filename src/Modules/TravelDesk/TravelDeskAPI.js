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

export const updateTravelRequisition = async (
  token,
  requisition,
  reqId,
  status
) => {
  try {
    console.log("updateTravelRequisition() called", requisition);
    const response = await axios.put(
      `${endPoint}traveldesk/travels/${reqId}/${status}`,
      requisition,
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

// export const updateTravelRequisition = async (
//   token,
//   rowData,
//   reqId,
//   statusName
// ) => {
//   console.log(`${endPoint}traveldesk/travels/${reqId}/${statusName}`);
//   console.log("rowData :: ", rowData);
//   try {
//     const response = await axios.put(
//       `${endPoint}traveldesk/travels/${reqId}/${statusName}`,
//       { rowData },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response;
//   } catch (error) {
//     console.log(error);
//   }
// };

export { getMyFormTravelData, getMyFormParticularRequisitionId };
