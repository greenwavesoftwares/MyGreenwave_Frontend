import axios from "axios";
const host = import.meta.env.VITE_END_POINT;
import { getUserData } from "../Login/Encrypt";
const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;

//My Form Api Call For the login user
const getMyFormTravelData = async () => {
  try {
    const response = await axios.get(`${host}traveldesk/travels/all`, {
      headers: {
        Authorization: token,
      },
    });

    if (response.status !== 200) {
      return {
        status: false,
        message: response.statusText,
        data: [],
      };
    }

    const travelList = response.data;

    // Grouping by travelId
    const travelMap = {};

    for (const travel of travelList) {
      const id = travel.travelId;

      if (!travelMap[id]) {
        travelMap[id] = [];
      }

      travelMap[id].push(travel);
    }

    // Building grouped result
    const groupedData = Object.entries(travelMap).map(([travelId, records]) => {
      // Sort records by fromDate ascending
      const sorted = records.sort(
        (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
      );

      const oldest = sorted[0];

      return {
        travelId,
        purpose: oldest.purpose,
        projectName: oldest.projectName,
        city: oldest.city,
        localityArea: oldest.localityArea,
        typeOfTravel: oldest.typeOfTravel,
        fromDate: oldest.fromDate,
        tentativeToDate: oldest.tentativeToDate,
        expandableData: sorted,
      };
    });

    return {
      status: true,
      message: "Successfully loaded",
      data: groupedData,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

const getMyFormParticularRequisitionId = async (token, requisionId) => {
  try {
    const response = await axios.get(
      `${host}traveldesk/travels/${requisionId}`,
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
      `${host}traveldesk/travels-by-status/${statusName}`,
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
      `${host}traveldesk/travels/${reqId}/${status}`,
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
//   console.log(`${host}traveldesk/travels/${reqId}/${statusName}`);
//   console.log("rowData :: ", rowData);
//   try {
//     const response = await axios.put(
//       `${host}traveldesk/travels/${reqId}/${statusName}`,
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
