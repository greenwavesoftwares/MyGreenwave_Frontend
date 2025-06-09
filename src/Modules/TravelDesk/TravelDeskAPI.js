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

export const checkAtleastOneStatus = (list, status) => {
  return list.some(record => record.status === status);
}; 

export const getOngoingTravelData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let approvedresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/Approved`,
      requestOptions
    );

    if (!approvedresponseObj.ok) {
      let message = approvedresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let approvedresponse = await approvedresponseObj.json();

    
    
    const managerreviewedresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/ManagerReviewed`,
      requestOptions
    );

    if (!managerreviewedresponseObj.ok) {
      let message = await managerreviewedresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let managerreviewedresponse = await managerreviewedresponseObj.json();

    const settledresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/Settled`,
      requestOptions
    );

    if (!settledresponseObj.ok) {
      let message = await settledresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let settledresponse = await settledresponseObj.json();

    const completeRequestedresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/CompleteRequested`,
      requestOptions
    );

    if (!completeRequestedresponseObj.ok) {
      let message = await completeRequestedresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let completeRequestedresponse = await completeRequestedresponseObj.json();
    const finalData = [
      ...approvedresponse,
      ...settledresponse,
      ...completeRequestedresponse,
      ...managerreviewedresponse
    ];
    console.log('managerreviewedresponse',managerreviewedresponse)

    const travelList = finalData;

    //console.log("travelList", travelList);
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
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const oldest = sorted[0];
      //checkAtleastOneStatus(records,'ManagerReviwed')
     
      return {
        travelId,
        // checkAtleastOneManagerReviewed:checkAtleastOneStatus(records,'ManagerReviewed'),
        userName: oldest.userName,
        empCode: oldest.empCode,
        fromDate: oldest.fromDate,
        tentativeToDate: oldest.tentativeToDate,
        typeOfTravel: oldest.typeOfTravel,
        projectName: oldest.projectName,
        purpose: oldest.purpose,
        localityArea: oldest.localityArea,
        city: oldest.city,
        unsettledAmount: oldest.unsettledAmount,
        tentativeToDate: oldest.tentativeToDate,
        expandableData: sorted,
      };
    });

   const sortedGroupedData = groupedData.sort((a, b) => {
  
  return new Date(b.fromDate) - new Date(a.fromDate);
});
    console.log("groupedData", sortedGroupedData);

    return {
      status: true,
      message: "loaded sucessfully",
      data: sortedGroupedData,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};


export const getApprovedAndSettledAndCompleteRequestedData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let approvedresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/Approved`,
      requestOptions
    );

    if (!approvedresponseObj.ok) {
      let message = approvedresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let approvedresponse = await approvedresponseObj.json();

    const advancedData = await getAdvanceDetails();

    function mergeTravelData(mergedData, dummydataJson) {
      const dataMap = new Map();

      // Create a lookup map for dummydata
      dummydataJson.forEach((entry) => {
        dataMap.set(entry.userId.toLowerCase(), {
          unsettledAmount: parseFloat(entry.unsettledAmount),
          claimUnderProcess: entry.claimUnderProcess,
        });
      });

      // Merge dummydata into dummyobj
      const merged = mergedData.map((entry) => {
        const match = dataMap.get(entry.user_id.toLowerCase());
        return {
          ...entry,
          unsettledAmount: match ? match.unsettledAmount : 0.0,
          claimUnderProcess: match ? match.claimUnderProcess : 0,
        };
      });

      return merged;
    }

    const finalapprovedData = mergeTravelData(
      approvedresponse,
      advancedData.data
    );

    const settledresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/Settled`,
      requestOptions
    );

    if (!settledresponseObj.ok) {
      let message = await settledresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let settledresponse = await settledresponseObj.json();

    const completeRequestedresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/CompleteRequested`,
      requestOptions
    );

    if (!completeRequestedresponseObj.ok) {
      let message = await completeRequestedresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let completeRequestedresponse = await completeRequestedresponseObj.json();
    const finalData = [
      ...finalapprovedData,
      ...settledresponse,
      ...completeRequestedresponse,
    ];

    const travelList = finalData;

    //console.log("travelList", travelList);
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
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const oldest = sorted[0];
      const allCompleteRequested = records.every(
        (record) => record.status === "CompleteRequested"
      );
      return {
        travelId,
        requestCompletedFlag: allCompleteRequested,
        userName: oldest.userName,
        empCode: oldest.empCode,
        fromDate: oldest.fromDate,
        tentativeToDate: oldest.tentativeToDate,
        typeOfTravel: oldest.typeOfTravel,
        projectName: oldest.projectName,
        purpose: oldest.purpose,
        localityArea: oldest.localityArea,
        city: oldest.city,
        unsettledAmount: oldest.unsettledAmount,
        tentativeToDate: oldest.tentativeToDate,
        expandableData: sorted,
      };
    });

   const sortedGroupedData = groupedData.sort((a, b) => {
  if (a.requestCompletedFlag !== b.requestCompletedFlag) {
    return a.requestCompletedFlag - b.requestCompletedFlag;
  }
  return new Date(b.fromDate) - new Date(a.fromDate);
});
    console.log("groupedData", sortedGroupedData);

    return {
      status: true,
      message: "loaded sucessfully",
      data: sortedGroupedData,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const getCompleteData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let completeresponseObj = await fetch(
      `${host}traveldesk/travels-by-status/Completed`,
      requestOptions
    );

    if (!completeresponseObj.ok) {
      let message = completeresponseObj.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let completeresponse = await completeresponseObj.json();

    // const completeRequestedresponseObj = await fetch(
    //   `${host}traveldesk/travels-by-status/CompleteRequested`,
    //   requestOptions
    // );

    // if (!completeRequestedresponseObj.ok) {
    //   let message = await completeRequestedresponseObj.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }
    // let completeRequestedresponse = await completeRequestedresponseObj.json();
    // const finalData = [...completeresponse, ...completeRequestedresponse];

    const travelList = completeresponse;
    //console.log('travelList2', travelList)

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
        travelId:oldest.travelId,
        userName: oldest.userName,
        empCode: oldest.empCode,
        fromDate: oldest.fromDate,
        tentativeToDate: oldest.tentativeToDate,
        typeOfTravel: oldest.typeOfTravel,
        projectName: oldest.projectName,
        purpose: oldest.purpose,
        localityArea: oldest.localityArea,
        city: oldest.city,
        unsettledAmount: oldest.unsettledAmount,
        tentativeToDate: oldest.tentativeToDate,
        expandableData: sorted
      };
    });

    console.log("groupedData", groupedData);

    return {
      status: true,
      message: "loaded sucessfully",
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

// export const updateTravelRequisition = async (requisition, reqId, status) => {
//   try {
//     console.log(
//       "updateTravelRequisition() called",
//       requisition,
//       " () ",
//       token,
//       " () ",
//       reqId,
//       " () ",
//       status
//     );
//     const response = await axios.put(
//       `${host}traveldesk/travels/${reqId}/${status}`,
//       requisition,
//       {
//         headers: {
//           Authorization: token,
//         },
//       }
//     );

//     // Use response.status to check for errors
//     // if (response.status < 200 || response.status >= 300) {
//     //   return {
//     //     status: false,
//     //     message: response.data?.message || "Unexpected error",
//     //     data: [],
//     //   };
//     // }

//     // let getAllData = await getApprovedAndSettledAndCompleteRequestedData();
//     // return {
//     //   status: getAllData.status,
//     //   message: "Advace Settled",
//     //   data: getAllData.data,
//     // };
//     return response;
//   } catch (error) {
//     console.log(error);
//     return {
//       status: false,
//       message: error?.message,
//       data: [],
//     };
//   }
// };

export const updateTravelRequisition = async (
  
  requisition,
  reqId,
  status
) => {
  try {
    // console.log("updateTravelRequisition() called", requisition);
    const response = await axios.put(
      `${host}traveldesk/travels/${reqId}/${status}`,
      requisition,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getTravelDetailsFromTravelId = async (travel_id) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}traveldesk/travels/${travel_id}`,
      requestOptions
    );

    if (!response.ok) {
      let message = await response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }

    let responsedata = await response.json();
    return {
      status: true,
      message: "travels detail",
      data: responsedata,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const getTravelDropDown = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}traveldesk/ongoing-travels`,
      requestOptions
    );

    if (!response.ok) {
      let message = await response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let travelDropDownData = await response.json();
    travelDropDownData["New Travel"] = "New Travel";

    const formattedOptions = Object.entries(travelDropDownData).map(
      ([label, value]) => ({
        label,
        value,
      })
    );

    return {
      status: true,
      message: "travels mode",
      data: formattedOptions,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const createRequisition = async (payload) => {
  try {
    const response = await axios.post(`${host}traveldesk/travels`, payload, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      return {
        status: true,
        message: "",
        data: response.data,
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const getAdvanceDetails = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}api/user-advance-status`,
      requestOptions
    );

    if (!response.ok) {
      let message = await response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    }
    let responseData = await response.json();
    return {
      status: true,
      message: "advance detail loaded",
      data: responseData,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const uploadDocumentsByReqId=async(file,reqId)=>
{
    try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    console.log("file",file)

    const formData = new FormData();
    formData.append("file", file);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formData,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}traveldesk/travels/file/${reqId}`,
      requestOptions
    );

    if(!response.ok)
    {
      let message= await response.text();
      return{
        status:false,
        message:message,
        data:[]
      }
    }
    
     let message= await response.text();
      return {
        status:true,
        message:message,
        data:[]
      }
  
  } catch (error) {
    console.log(error);
     return {
        status:false,
        message:error?.message,
        data:[]
      }
  }
}


export const downloadDocumentsByReqId = async (reqId) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const response =await fetch(`${host}traveldesk/travels/file/${reqId}`, requestOptions) 

    if (!response.ok) {
      const message = await response.text();
      return {
        status:false,
        message:message,
        data:[]
      }
    }

    // Parse JSON containing base64 data
    const result = await response.json();
    const { fileName, fileType, data: base64Data } = result;

    // Correct and reliable base64 to Blob conversion
    const binary = atob(base64Data);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([buffer], {
      type: fileType || "application/octet-stream",
    });

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    return{
      status:false,
      message:error?.message,
      data:[]
    }
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
