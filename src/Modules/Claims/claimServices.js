// tourClaimService.js
// const token =
//   "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraXNvbG95LnJveUBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NDcwMzcxMjUsImV4cCI6MTc0NzA3MzEyNX0.v9U6VF-sh-Hqw3nLdYMVHLpvmtAiaAa_bFLrvpbTuO4";

import { parse } from "date-fns";
import * as XLSX from "xlsx";
import { getUserData } from "../Login/Encrypt";
// const host = import.meta.env.VITE_API_HOST;
// const port = import.meta.env.VITE_API_PORT;
// const host = "http://localhost";
// const port = "8081";
const host = import.meta.env.VITE_END_POINT;
import { getTravelDetailsFromTravelId2 } from "../TravelDesk/TravelDeskAPI";
import axios from "axios";

// const userDetails = getUserData()?.userDetails;
// const token = `Bearer ${getUserData()?.token}`;
export const getDraftData = async () => {
 // const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    const response = await axios.get(`${host}claims/tour-claims/drafts`, {
      headers: {
        Authorization: token,
      },
    });
    console.log(response.data)
    response?.data.sort((a, b) => new Date(b.from_date) - new Date(a.from_date));

    return {
      status: true,
      message: "Draft data loaded",
      data: response?.data,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const handleSaveToDraft = (payload) => {
  
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer YOUR_TOKEN_HERE");

  const raw = JSON.stringify(payload);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  return fetch(`${host}claims/tour-claims`, requestOptions)
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error saving draft:", error);
      throw error;
    });
};
export const formateDate = (value) => {
  if (!value) return "";

  // If it's a number (Excel serial date)
  if (!isNaN(value)) {
    const parsed = XLSX.SSF.parse_date_code(Number(value));
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
        parsed.d
      ).padStart(2, "0")}`;
    }
  }

  // If it's a string
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    // Format using local time
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  return "";
};

export const getTravelsDetails = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  // const myHeaders = new Headers();
  // myHeaders.append("Authorization", token);

  // const requestOptions = {
  //   method: "GET",
  //   headers: myHeaders,
  //   redirect: "follow",
  // };

  // let response = await fetch(
  //   `${host}traveldesk/travels`,
  //   requestOptions
  // );
  // let data = response.json();
  // return data;
  try {
    const response = await axios.get(`${host}traveldesk/travels`, {
      headers: {
        Authorization: token,
      },
    });
    return response.data;
  } catch (error) {
    console.log( error);
    return error.response?.data || error.message;
  }
};

export const getTourClaimList = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    
    let traveldetails = await getTravelsDetails();

    // Remove duplicate travelId
      let uniqueTravels = Object.values(
        traveldetails.reduce((acc, curr) => {
          acc[curr.travelId] = curr; // overwrite if duplicate
          return acc;
        }, {})
      );

    console.log(uniqueTravels);
    console.log("travelDetails",traveldetails)

    const response = await axios.get(`${host}claims/tour-claims`, {
      headers: {
        Authorization: token,
      },
    });

    const data = response.data;
    
    console.log('response.data 1234', response.data)

    const groupedMap = {};

    let formattedResult = [];

    let InLocalStationData=data.filter((claim)=>claim.travel_id=='Long-Term-Local-Conveyance')
    console.log('InLocalStationData', InLocalStationData)

    uniqueTravels.forEach((item) => {
      const matchingClaims = data.filter(
        (claim) => claim.travel_id === item.travelId
      );
      formattedResult.push({
        //travel_id:item.travelId,
        fromDate: item.fromDate,
        tentativeToDate: item.tentativeToDate,
        actualToDate: item.actualToDate,
        travel_id: item.travelId,
        destination: item.city,
        purpose: item.purpose,
        project: item.projectName,
        type: item.typeOfTravel,
        expandabledata: matchingClaims,
      });
    });

    InLocalStationData.forEach((item)=>{
      formattedResult.push({
        //travel_id:item.travelId,
       // claim_id:item.claim_id,
        fromDate: item.from_date,
        tentativeToDate: item.to_date,
        actualToDate: item.to_date,
        travel_id: item.travel_id,
        destination: item.destination,
        purpose: item.purpose,
        project: item.project,
        type: item.type,
        expandabledata: [item],
      });
    });
   

    console.log('formatedResult', formattedResult)
       formattedResult.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));

    return formattedResult;
  } catch (error) {
    console.log( error);
    return error.response?.data || error.message;
  }
};

export const getTravelDropDown = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    let response = await axios.get(`${host}traveldesk/ongoing-travels`, {
      headers: {
        Authorization: token,
      },
    });

    let travelDropDownData = response.data;
    travelDropDownData["In-Station Local Conveyance"] =
      "Long-Term-Local-Conveyance";

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
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const getTravelDropDown2 = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.get(`${host}traveldesk/ongoing-travels`, {
      headers: {
        Authorization: token,
      },
    });

    // if (!response.ok) {
    //   let message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }
    let travelDropDownData = response.data;
    travelDropDownData["New Travel"] = null;

    const formattedOptions = Object.entries(travelDropDownData).map(
      ([label, value]) => ({
        label,
        value,
      })
    );
console.log('formattedOptions',formattedOptions)
    return {
      status: true,
      message: "travels mode",
      data: formattedOptions,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const getTravelMode = async (travel_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.get(`${host}traveldesk/travels/${travel_id}`, {
      headers: {
        Authorization: token,
      },
    });

    let data = response.data;
    return {
      status: true,
      message: "travels mode",
      data: data.city + " - " + data.fromDate + " - " + data.projectName,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const getTourClaimFormDetails = async (id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    let response = await axios.get(`${host}traveldesk/travels/${id}`, {
      headers: {
        Authorization: token,
      },
    });
    //   .then((response) => response.text())
    //   .then((result) => console.log(result))
    //   .catch((error) => console.error(error));

    let data = response.data;
    return data;
  } catch (error) {
    console.log( error);
    return error.response?.data || error.message;
  }
};

export const getAdvance = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  // const myHeaders = new Headers();
  // myHeaders.append("Authorization", token);

  // const requestOptions = {
  //   method: "GET",
  //   headers: myHeaders,
  //   redirect: "follow",
  // };
  try {
    let response = await axios.get(`${host}traveldesk/unsettled-advance`, {
      headers: {
        Authorization: token,
      },
    });
    let data = response.data;
    return data;
  } catch (error) {
    console.log( error);
    return error.response?.data || error.message;
  }
};

export const uploadSupportingDocuments = async (file, claim_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    const formData = new FormData();
    formData.append("file", file);
     const response = await axios.post(
      `${host}claims/tour-claims/doc/${claim_id}`,
      formData,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response?.data || error.message
  }
};

export const deleteDraftList = async (claim_id, status) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,

    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/tour-claims/${claim_id}/${status}`,
       null, // no request body
      {
         headers: {
      Authorization: token,
    },
      }
    );
    // if (!response.ok) {
    //   let message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }
    let draftData = await getDraftData();
    console.log('draftData', draftData)
    return {
      status: draftData.status,
      message: "One Draft claim deleted",
      data: draftData.data,
    };
  } catch (error) {
    console.log('error', error)
    return {
      status: false,
      message:error.response?.data || error.message,
      data: [],
    };
  }
};

export const applyClaim = async (claim_id, status) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    const response = await axios.put(
      `${host}claims/tour-claims/${claim_id}/${status}`,
       null, // no request body
      {
         headers: {
      Authorization: token,
    },
      }
    );

    // if (!response.ok) {
    //   const message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }
    const draftData = await getDraftData();

    return draftData;
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const downloadTourClaimSupportingDocument = async (claim_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    const response = await axios.get(
      `${host}claims/tour-claims/doc/${claim_id}`,
     {
       headers: {
      Authorization: token,
    },
     }
    );

    // if (!response.ok) {
    //   const message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }

    // Parse JSON containing base64 data
    const result =response.data
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
    console.log( error);
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const downloadOtherClaimSupportingDocument = async (claim_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    const response = await axios.get(
      `${host}claims/other-claims/doc/${claim_id}`,
     {
       headers: {
      Authorization: token,
    },
     }
    );

    // if (!response.ok) {
    //   const message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }

    // Parse JSON containing base64 data
    const result = response.data
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
    return {
      status: true,
      message: "downloaded",
      data: [],
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

// export const downloadTourClaimSupportingDocument = async (claim_id) => {
//   try {
//     const myHeaders = new Headers();
//     myHeaders.append("Authorization", token);

//     const requestOptions = {
//       method: "GET",
//       headers: myHeaders,
//       redirect: "follow",
//     };

//     const response = await fetch(
//       `http://localhost:8081/claims/tour-claims/doc/${claim_id}`,
//       requestOptions
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Internal Server Error ${response.status}: ${errorText}`);
//     }

//     // Parse JSON containing base64 data
//     const result = await response.json();
//     const { fileName, fileType, data: base64Data } = result;

//     // Convert base64 to a Blob
//     const byteCharacters = atob(base64Data);
//     const byteNumbers = new Array(byteCharacters.length)
//       .fill()
//       .map((_, i) => byteCharacters.charCodeAt(i));
//     const byteArray = new Uint8Array(byteNumbers);
//     const blob = new Blob([byteArray], { type: fileType });

//     // Trigger download
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = fileName || "document";
//     document.body.appendChild(link);
//     link.click();

//     window.URL.revokeObjectURL(url);
//     document.body.removeChild(link);
//   } catch (error) {
//     console.error("Error in downloadTourClaimSupportingDocument:", error);
//     throw error;
//   }
// };

export const downloadTourClaimExpanseDocument = async (claim_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    if (!claim_id) {
      var response = await axios.get(`${host}claims/tour-claims/excel`, {
        headers: {
      Authorization: token,
    },
      });
    } else {
      var response = await axios.get(
        `${host}claims/tour-claims/excel/${claim_id}`,
        {
          headers: {
      Authorization: token,
    },
        }
      );
    }

    // if (!response.ok) {
    //   const errorText = await response.text();
    //   throw new Error(`Internal Server Error ${response.status}: ${errorText}`);
    // }

    const result = response.data
    const { fileName, fileType, data: base64Data } = result;

    // Base64 to Blob (correct way)
    const binary = atob(base64Data);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: fileType });

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.log(error)
    return error.response?.data || error.message
  }
};

export const getTourClaimTableDraftData = async (claim_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    const response = await axios.get(
      `${host}claims/tour-claims/${claim_id}`,
   {
     headers: {
      Authorization: token,
    },
   }
    );

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    const data = response.data
     //data.sort((a, b) => new Date(b.from_date) - new Date(a.from_date));
    //console.log("tabledata",data)
    return data;
    // const travelDropDownData = await getTravelDropDown();
    // const key = Object.keys(travelDropDownData).find(key => travelDropDownData[key] === data.travel_id);
  } catch (error) {
     console.log( error);
   return error.response?.data || error.message
  }
};

export const getlatestclaimtodate = async (travel_id) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  const result = [];

  const tourClaimList = await getTourClaimList();
 // console.log('travel_id', travel_id)
 // console.log('tourList', tourClaimList)
  const filteredClaims = tourClaimList.filter(
    (row) => row.travel_id === travel_id
  );
  //console.log('', )

  let latestToDate = null;
  if (filteredClaims.length > 0) {
    filteredClaims[0].expandabledata.forEach((claim) => {
      const claimToDate = claim.to_date;
      if (claim.status !== "Rejected") {
        if (!latestToDate || claimToDate > latestToDate) {
          latestToDate = claimToDate;
        }
      }
    });
  }
  console.log('latestToDate ',   latestToDate )

  //const data = await getTourClaimFormDetails(travel_id);
  let response = await getTravelDetailsFromTravelId2(travel_id);
  let data = response.data;
  result.push({
    travelfromdate: data?.fromDate,
    claimformdate: latestToDate ? latestToDate : data?.fromDate,
    claimtodate:new Date()
    //data.tentativeToDate
      //data.tentativeToDate > new Date() ? data.tentativeToDate : new Date(),
  });

  return result;
};

export const savetodraft = async (tourclaimformData, tourClaimTableData) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    console.log("tourclaimformData", tourclaimformData);
    console.log("tourClaimTableData", tourClaimTableData);
    let total_expense = 0;
    let tabledata = [];

    tourClaimTableData.forEach((row) => {
      const rowTotal = Number(row["Total"]) || 0;
      total_expense += rowTotal;

      tabledata.push({
        date: row["Date"],
        lodging: Number(row["Lodging"]) || 0,
        breakfast: Number(row["Breakfast"]) || 0,
        lunch: Number(row["Lunch"]) || 0,
        dinner: Number(row["Dinner"]) || 0,
        incidentals: Number(row["Incidentals"]) || 0,
        longTravel: Number(row["Airfare, Bus, Train, Taxi Rental"]) || 0,
        shortTravel: Number(row["Auto, Cab"]) || 0,
        tollTax: Number(row["Parking, Toll, Fuel"]) || 0,
        teaWater: Number(row["Tea & Water"]) || 0,
        snacks: Number(row["Snacks"]) || 0,
        other: Number(row["Other Business Expenses"]) || 0,
        total: rowTotal,
        remarks: row["Remarks"] || "",
      });
    });

   // const myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");
    // myHeaders.append("Authorization", token); // make sure `token` is in scope

    const payload = {
      travel_id: tourclaimformData.travel_id,
      type: tourclaimformData.travelType,
      destination: tourclaimformData.destination,
      purpose: tourclaimformData.purpose,
      project: tourclaimformData.projectName,
      account: tourclaimformData.onAccount,
      advance: Number(tourclaimformData.advance) || 0,
      from_date: formateDate(tourclaimformData.claimFromDate),
      to_date: formateDate(tourclaimformData.claimToDate),
      total_expense: total_expense,
      filename: tourclaimformData.filename,
      file_type: tourclaimformData.file_type,
      tourClaimRecords: tabledata,
    };

   // const raw = JSON.stringify(payload);

    // const requestOptions = {
    //   method: "POST",
    //   headers: myHeaders,
    //   body: raw,
    //   redirect: "follow",
    // };

    let response = await axios.post(`${host}claims/tour-claims`, payload,{ headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    },});
    // if (!response.ok) {
    //   let message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }

    const draftData = await getDraftData();

    return {
      status: true,
      message: "Saved to draft",
      data: draftData.data,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const updateDraftdata = async (
  tourclaimformData,
  tourClaimTableData,
  claim_id
) => {
  //const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    let total_expense = 0;
    let tabledata = [];

    tourClaimTableData.forEach((row) => {
      const rowTotal = Number(row["Total"]) || 0;
      total_expense += rowTotal;

      tabledata.push({
        date: row["Date"],
        lodging: Number(row["Lodging"]) || 0,
        breakfast: Number(row["Breakfast"]) || 0,
        lunch: Number(row["Lunch"]) || 0,
        dinner: Number(row["Dinner"]) || 0,
        incidentals: Number(row["Incidentals"]) || 0,
        longTravel: Number(row["Airfare, Bus, Train, Taxi Rental"]) || 0,
        shortTravel: Number(row["Auto, Cab"]) || 0,
        tollTax: Number(row["Parking, Toll, Fuel"]) || 0,
        teaWater: Number(row["Tea & Water"]) || 0,
        snacks: Number(row["Snacks"]) || 0,
        other: Number(row["Other Business Expenses"]) || 0,
        total: rowTotal,
        remarks: row["Remarks"],
      });
    });

    // const myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");
    // myHeaders.append("Authorization", token); // make sure `token` is in scope

    const payload = {
      travel_id: tourclaimformData.travel_id,
      type: tourclaimformData.travelType,
      destination: tourclaimformData.destination,
      purpose: tourclaimformData.purpose,
      project: tourclaimformData.projectName,
      account: tourclaimformData.onAccount,
      advance: Number(tourclaimformData.advance) || 0,
      from_date: formateDate(tourclaimformData.claimFromDate),
      to_date: formateDate(tourclaimformData.claimToDate),
      total_expense: total_expense,
      filename: tourclaimformData.filename,
      file_type: tourclaimformData.file_type,
      tourClaimRecords: tabledata,
    };

    //const raw = JSON.stringify(payload);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,
    //   body: raw,
    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/tour-claims/${claim_id}`,payload,{ headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    },}
      
    );
    // const data = await response.json();
    // if (!response.ok) {
    //   let message = response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }
   // console.log('response',response)

    const draftData = await getDraftData();
    return draftData;
  } catch (error) {
    return {
      status: false,
      message: error?.response.data,
      data: [],
    };
  }
};

export const AddRowINExcel = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellStyles: true,
    cellHTML: true,
    dense: false,
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const targetRow = 17; // Insert before Excel row 17 (1-based)
  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // Shift all rows after targetRow down by 1
  for (let row = range.e.r; row >= targetRow - 1; row--) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const nextCellAddress = XLSX.utils.encode_cell({ r: row + 1, c: col });
      worksheet[nextCellAddress] = worksheet[cellAddress];
    }
  }

  // Insert a blank row (clear values, but could add initial styles if needed)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: targetRow - 1, c: col });
    worksheet[cellAddress] = { t: "s", v: "" }; // Empty cell
  }

  // Update sheet range
  range.e.r++;
  worksheet["!ref"] = XLSX.utils.encode_range(range);

  const updatedExcel = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([updatedExcel], { type: "application/octet-stream" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = file.name.replace(/\.xlsx$/, "") + "_modified.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// import * as d from 'xlsx.mjs';
// // Enable Pro features
// d.set_fs(require('fs'));
// d.set_cptable(require('dist/cpexcel.full.mjs')); // For encodings

// export const AddRowINExcel = async (file) => {
//   const arrayBuffer = await file.arrayBuffer();
//   const workbook = d.read(arrayBuffer, {
//     type: 'array',
//     cellStyles: true,
//     cellHTML: true,
//     dense: false
//   });

//   const sheetName = workbook.SheetNames[0];
//   const worksheet = workbook.Sheets[sheetName];

//   // Pro method: insert row at row 17 (1-based index)
//   d.utils.sheet_add_aoa(worksheet, [[]], { origin: -1, sheetRows: 1, targetRow: 16 });

//   // Adjust the range (optional depending on your SheetJS Pro version)
//   const range = d.utils.decode_range(worksheet['!ref']);
//   range.e.r++;
//   worksheet['!ref'] = d.utils.encode_range(range);

//   const updatedExcel = d.write(workbook, {
//     bookType: 'xlsx',
//     type: 'array',
//     compression: true
//   });

//   const blob = new Blob([updatedExcel], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = file.name.replace(/\.xlsx$/, '') + '_styled.xlsx';
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

export const ApplyOtherClaim = async (
  file,
  claimType,
  claimAmount,
  claimDetails
) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token); // ensure token is defined

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", claimType);
    formData.append("amount", claimAmount);
    formData.append("reason", claimDetails);

    // const requestOptions = {
    //   method: "POST",
    //   headers: myHeaders, // DO NOT set Content-Type manually with FormData
    //   body: formData,
    //   redirect: "follow",
    // };

    const response = await axios.post(`${host}claims/other-claims`, formData,{ headers: {
      Authorization: token
     // 'Content-Type': 'application/json'
    },});

   // const message = await response.text();

    // if (!response.ok) {
    //   throw new Error(message || "Failed to submit claim");
    // }

    return {
      status: true,
      message: response.message,
      data: {},
    };
  } catch (error) {
    console.error("Error applying other claim:", error);
   return {
    status:false,
    message:error.response?.data || error.message,
    data:[]
   }
  }
};

export const getOtherClaims = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    let response = await axios.get(`${host}claims/other-claims`, { headers: {
      Authorization: token
    },});
    const data = response.data
    return data;
  } catch (error) {
    console.log(error);
    return error.response?.data || error.message
  }
};

export const getLoanDetails = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    const response = await axios.get(`${host}claims/loan-claims`, { headers: {
      Authorization: token
    },});
    const data = response.data
    return {
      status: true,
      message: '',
      data: data,
    };
  } catch (error) {
    console.log(error);
     return {
      status: false,
      message:error.response?.data || error.message,
      data: [],
    };
  }
};

export const applyLoan = async (formData) => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    const raw = {
      amount: formData.loanAmount,
      reason: formData.purpose,
      emi: formData.loanTenure,
      requirementDate: formateDate(formData.requirementDate),
    };

    let response = await axios.post(`${host}claims/loan-claims`, raw, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });

    return {
      status: true,
      message: "Applied successfully.",
      data: response.data,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data || error.message  ,
      data: [],
    };
  }
};


//Admin part

export const getApprovedTourClaims = async () => {
  const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
   

    let ApprovedResponse = await axios.get(
      `${host}claims/tour-claims-by-status/Approved`,
      { headers: {
      Authorization: token
    }}
    );
   

    let ApprovedData =  ApprovedResponse.data;

    let ReviewedResponse = await axios.get(
      `${host}claims/tour-claims-by-status/Reviewed`,
       { headers: {
      Authorization: token
    }}
    );
   
    let ReviewedData = ReviewedResponse.data //await ReviewedResponse.json();

    
   /* for account department only need reviewedData,RejectedData,ApprovedData
    let CancelledResponse = await axios.get(
      `${host}claims/tour-claims-by-status/Cancelled`,
      { headers: {
      Authorization: token
    }}
    );
   
    let CancelledData =  CancelledResponse.data; */

      let rejectedResponse = await axios.get(
      `${host}claims/tour-claims-by-status/Rejected`,
      { headers: {
      Authorization: token
    }}
    );
   
    let rejectedData =  rejectedResponse.data;


    let finaldata = [...ReviewedData, ...rejectedData, ...ApprovedData];

     finaldata.sort((a, b) => new Date(b.from_date) - new Date(a.from_date));
     

    return {
      status: true,
      message: "Approved TourClaim Details.",
      data: finaldata,
    };
  } catch (error) {
    console.log(error);
      return {
      status: false,
      message: error.response?.data || error.message,
      data: finaldata,
    };
  }
};

export const getAppliedTourClaims = async () => {
  //const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);
    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let appliedresponse = await axios.get(
      `${host}claims/tour-claims-by-status/applied`,
       { headers: {
      Authorization: token
    }}
    );
    // if (!appliedresponse.ok) {
    //   const message = await appliedresponse.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }

    let reviewingresponse = await axios.get(
      `${host}claims/tour-claims-by-status/reviewing`,
      { headers: {
      Authorization: token
    }}
    );

    // if (!reviewingresponse.ok) {
    //   const message = await reviewingresponse.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }
    let applieddata =  appliedresponse.data;
    let reviewingdata =  reviewingresponse.data;
 

    let finaldata = [...reviewingdata, ...applieddata];
      // Gropping the data according to travel_id
    //  let uniqueTravels = Object.values(
    //     finaldata.reduce((acc, curr) => {
    //       acc[curr.travel_id] = curr; // overwrite if duplicate
    //       return acc;
    //     }, {})
    //   );

    //    uniqueTravels.forEach((item) => {
    //   const matchingClaims = data.filter(
    //     (claim) => claim.travel_id === item.travelId
    //   );

    //   let formattedResult = [];

    //    uniqueTravels.forEach((item)=>{


    //        formattedResult.push({
    //     //travel_id:item.travelId,
    //     fromDate: item.from_date,
    //     tentativeToDate: item.tentativeToDate,
    //     actualToDate: item.actualToDate,
    //     travel_id: item.travel_id,
    //     destination: item.city,
    //     purpose: item.purpose,
    //     project: item.projectName,
    //     type: item.typeOfTravel,
    //     expandabledata: matchingClaims,
    //   });
    // });
    //    })
      
    //   console.log("uniqueTravels",uniqueTravels)
    finaldata.sort((a,b)=>b.from_date-a.from_date)
    console.log('finaldata',finaldata)

    return {
      status: true,
      message: "applied TourClaim Details.",
      data: finaldata,
    };
  } catch (error) {
    console.log(error);
      return {
      status: false,
      message:error.response?.data || error.message,
      data: [],
    };
  }
};

export const CheckForAnyTourClaimsInStatusReviewing = async (
  userId,
  claim_id
) => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    // Step 1: Check if any claim is under review
    const getResponse = await axios.get(
      `${host}claims/tour-claims-user-and-status/reviewing/${userId}`,
       { headers: {
      Authorization: token
    }}
    );

    const getreviewedResponse = await axios.get(
      `${host}claims/tour-claims-user-and-status/reviewed/${userId}`,
       { headers: {
      Authorization: token
    }}
    );

    // if (!getResponse.ok) {
    //   const message = await getResponse.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }

    const reviewClaims =  getResponse.data;
    const reviewedclaims=getreviewedResponse.data;

    if (reviewClaims.length || reviewedclaims.length > 0) {
      return {
        status: false,
        message: "Previous claim is under review",
        data: reviewClaims,
      };
    }

    // Step 2: Update status to Reviewing
    const putResponse = await axios.put(
      `${host}claims/tour-claims/${claim_id}/Reviewing`,
       null,
        {headers: {
            Authorization: token,
          'Content-Type': 'application/json'
    }},
    );

    // if (!putResponse.ok) {
    //   const message = await putResponse.text();
    //   return {
    //     status: false,
    //     message: message || "Failed to update claim status",
    //     data: [],
    //   };
    // }

    let allData = await getAppliedTourClaims();

    return {
      status: true,
      message: "Now claim is ready to be sent for approval",
      data: allData.data,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const tourClaimSendForApproval = async (
  claim_id,
  reason,
  settlement_amount
) => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,

    //   redirect: "follow",
    // };

    console.log('claim_id- ',claim_id,'reason-',reason,'settlement amount-',settlement_amount)

    let response = await axios.put(
      `${host}claims/tour-claims/review/${claim_id}/Reviewed?reason=${reason}&settlement_amount=${settlement_amount}`,
      null,
      { headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    },}
    );

    console.log('response', response)
    // if (!response.ok) {
    //   const message = await response.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }
    let getAappliedAndReviewData = await getAppliedTourClaims();
    //let data = response.json();
    return {
      status: true,
      message: "sent for approval",
      data: getAappliedAndReviewData.data,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const getReviewedTourClaims = async () => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);
    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let reviewedresponse = await axios.get(
      `${host}claims/tour-claims-by-status/Reviewed`,
      { headers: {
      Authorization: token
    },}
    );
    // if (!reviewedresponse.ok) {
    //   const message = await reviewedresponse.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }
    let revieweddata =  reviewedresponse.data;
    revieweddata.sort((a, b) => new Date(b.from_date) - new Date(a.from_date));
    console.log('revieweddata',revieweddata)
    return {
      status: true,
      message: "applied TourClaim Details.",
      data: revieweddata,
    };
  } catch (error) {
    console.log(error);
     return {
      status: false,
      message:error.response?.data || error.message,
      data: [],
    };
  }
};

export const getApprovedHRTourClaims = async () => {
  try {
    const token = `Bearer ${getUserData()?.token}`;
   

    let approvedresponse = await axios.get(
      `${host}claims/tour-claims-by-status/Approved`,
       { headers: {
      Authorization: token
    }}
    );
   
    let approveddata = approvedresponse.data;
     approveddata.sort((a, b) => new Date(b.from_date) - new Date(a.from_date));
     console.log('approvedData',approveddata)
    return {
      status: true,
      message: "approved TourClaim Details.",
      data: approveddata,
    };
  } catch (error) {
    console.log(error);
    return{
      status:false,
      message:error.response?.data || error.message,
      data:[]
    }
  }
};

export const ApprovedTourClaim = async (claim_id, reason) => {
  try {
    const token = `Bearer ${getUserData()?.token}`;
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,

    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/tour-claims/approval/${claim_id}/Approved?reason=${reason}`,
      null,
       { headers: {
      Authorization: token
    }}
    );
    // if (!response.ok) {
    //   const message = await response.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }
    let getReviewedTourClaimsData = await getReviewedTourClaims();
    //let data = response.json();
    if (getReviewedTourClaimsData.status) {
      return {
        status: true,
        message: "Claim has been approved",
        data: getReviewedTourClaimsData.data,
      };
    } else {
      return {
        status: false,
        message: getReviewedTourClaimsData.message,
        data: [],
      };
    }
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const RejectTourClaim = async (claim_id, reason) => {
  try {
    const token = `Bearer ${getUserData()?.token}`;
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,

    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/tour-claims/approval/${claim_id}/Rejected?reason=${reason}`,
      null,
       { headers: {
      Authorization: token
    }}
    );
    // if (!response.ok) {
    //   const message = await response.text();
    //   return {
    //     status: false,
    //     message: message || "Internal server error!",
    //     data: [],
    //   };
    // }
    let getReviewedTourClaimsData = await getReviewedTourClaims();
    //let data = response.json();
    if (getReviewedTourClaimsData.status) {
      return {
        status: true,
        message: "Tour claim rejected",
        data: getReviewedTourClaimsData.data,
      };
    } else {
      return {
        status: false,
        message: getReviewedTourClaimsData.message,
        data: [],
      };
    }
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error?.message || "Server error",
      data: [],
    };
  }
};

export const getloanclaimsapplied = async () => {
  try {
    const token = `Bearer ${getUserData()?.token}`;
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.get(
      `${host}claims/loan-claims-by-status/applied`,
       { headers: {
      Authorization: token
    }}
      
    );

    // if (!response.ok) {
    //   let message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // }
    let data = response.data;
    return {
      status: true,
      message: "loan details",
      data: data,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const getloanclaimsapproveandreject = async () => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    let message;
    let approveddata = [];
    let rejecteddata = [];
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let rejectedresponse = await axios.get(
      `${host}claims/loan-claims-by-status/rejected`,
       { headers: {
      Authorization: token
    }}
    );

    // if (!rejectedresponse.ok) {
    //   message = await rejectedresponse.text();
    //   if (message != "User Claim Not Found")
    //     return {
    //       status: false,
    //       message: message,
    //       data: [],
    //     };
    // } else {
      rejecteddata =  rejectedresponse.data;
  //  }

    let approvedresponse = await axios.get(
      `${host}claims/loan-claims-by-status/Approved`,
       { headers: {
      Authorization: token
    }}
    );

    // if (!approvedresponse.ok) {
    //   message = await approvedresponse.text();
    //   if (message != "User Claim Not Found")
    //     return {
    //       status: false,
    //       message: message,
    //       data: [],
    //     };
    // } else {
      approveddata = approvedresponse.data;
  //  }

    let finaldata = [...approveddata, ...rejecteddata];

    return {
      status: true,
      message: "approved and rejected loan claims data",
      data: finaldata,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const rejectLoanClaim = async (claim_id, remarks) => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/loan-claims/${claim_id}/rejected?reason=${remarks}`,null,
       { headers: {
      Authorization: token
    }}
    );

    // if (!response.ok) {
    //   let message = response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // } else {
      let responseData = await getloanclaimsapplied();
      return {
        status: true,
        message: "Loan Claim Rejected",
        data: responseData.data,
      };
    //}
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const approveLoanClaim = async (claim_id, remarks) => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/loan-claims/${claim_id}/Approved?reason=${remarks}`,
      null, { headers: {
      Authorization: token
    }}
    );

    // if (!response.ok) {
    //   let message = response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // } else {
      let responseData = await getloanclaimsapplied();
      return {
        status: true,
        message: "Loan Claim Approved",
        data: responseData.data,
      };
   // }
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const approveMiscellanousClaim = async (claim_id, remarks) => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/other-claims/${claim_id}/Approved?reason=${remarks}`,null,
       { headers: {
      Authorization: token
    }}
    );

    // if (!response.ok) {
    //   let message = response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // } else {
      let responseData = await getAppliedMiscellanousClaimAccount();
      // if (!response.status) {
      //   return {
      //     status: false,
      //     message: response.message,
      //     data: [],
      //   };
      // }
      return {
        status: true,
        message: "Miscellanous Claim Approved",
        data: responseData.data,
      };
   // }
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const rejectMiscellanousClaim = async (claim_id, remarks) => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    console.log(claim_id, remarks);
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "PUT",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.put(
      `${host}claims/other-claims/${claim_id}/Rejected?reason=${remarks}`,
      null, { headers: {
      Authorization: token
    }}
    );

    // if (!response.ok) {
    //   let message = response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // } else {
      let responseData = await getAppliedMiscellanousClaimAccount();
      // if (!response.status) {
      //   return {
      //     status: false,
      //     message: response.message,
      //     data: [],
      //   };
      // }
      return {
        status: true,
        message: "Miscellanous Claim Rejected",
        data: responseData.data,
      };
   // }
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message:error.response?.data || error.message,
      data: [],
    };
  }
};

export const getAppliedMiscellanousClaimAccount = async () => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    // const myHeaders = new Headers();
    // myHeaders.append("Authorization", token);

    // const requestOptions = {
    //   method: "GET",
    //   headers: myHeaders,
    //   redirect: "follow",
    // };

    let response = await axios.get(
      `${host}claims/other-claims-by-status/Applied`,
       { headers: {
      Authorization: token
    }}
    );
    // if (!response.ok) {
    //   let message = await response.text();
    //   return {
    //     status: false,
    //     message: message,
    //     data: [],
    //   };
    // } else {
    //   let data = await response.json();
      return {
        status: true,
        message: "applied miscellanous claim loaded",
        data: response.data,
      };
  //  }
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

export const getApprovedAndRejectMiscellanousClaim = async () => {
  const token = `Bearer ${getUserData()?.token}`;
  try {
    let message;
    let approveddata = [];
    let rejecteddata = [];
     const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let rejectedresponse = await axios.get(
      `${host}claims/other-claims-by-status/rejected`,
      requestOptions
    );

    // if (!rejectedresponse.ok) {
    //   message = await rejectedresponse.text();
    //   if (message != "User Claim Not Found")
    //     return {
    //       status: false,
    //       message: message,
    //       data: [],
    //     };
    // } else {
      rejecteddata = rejectedresponse.data;
   // }

    let approvedresponse = await axios.get(
      `${host}claims/other-claims-by-status/Approved`,
       { headers: {
      Authorization: token
    }}
    );

    // if (!approvedresponse.ok) {
    //   message = await approvedresponse.text();
    //   if (message != "User Claim Not Found")
    //     return {
    //       status: false,
    //       message: message,
    //       data: [],
    //     };
    // } else {
      approveddata = approvedresponse.data;
  //  }

    let finaldata = [...approveddata, ...rejecteddata];

    return {
      status: true,
      message: "approved and rejected miscellanous claims data",
      data: finaldata,
    };
  } catch (error) {
    console.log( error);
    return {
      status: false,
      message: error.response?.data || error.message,
      data: [],
    };
  }
};

// export const downloadtestsupportingdocs= async()=>
// {
//   try {
//       const myHeaders = new Headers();
// myHeaders.append("Content-Type", "application/json");
// myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmlzaC5rdW1hckBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NzQ5NDQ5ODgsImV4cCI6MTc3NDk4MDk4OH0.7LSbIWfvu0y2TOo3HdHT08Of2-fLyXPCEjvZiWvcToQ");

// const raw = JSON.stringify({
//   "filename ": "test",
//   "data": "0x504B0304140000000000A78D7B5C0000000000000000000000000F002000534954452D3420455850414E53452F75780B00010400000000040000000055540D0007D274C669FA74C669C074C669504B0304140008000800538D7B5C00000000000000000000000018002000534954452D3420455850414E53452F53697465342E70646675780B00010400000000040000000055540D00073774C669FA74C6693574C669549653702E8092AD63DB4E766CDB76766CDB76FED8B66D9B3BB66DDBB675CFCC45CD7DEBAE4675AD6F3D349982A8381D133D070CD9C1E1EC220C131B112391BD91150C2F2F0C83B01C11C35F7B275B431B180663432226187E7E18533B93FF2A3371FC8F3E714B1B1753272206711B4317535153637B1353180659533B73170B22662E0E1886BF442CFF35EBECE2646A680BE391ED13CF2703AA882416F787C817BD30246438D57229DD024531CA6439DFB430DEA265DD9B88DC71BDDAC2FE32AEBE09C346744EAD1E198C06DC2F50636DA453D30414C53C9D23CC338DC31E829865ACD0D1A285AF2D7E16BBE4A187E9AB3FBECB3C75DB11CB46C9A7176223ADDDCF25C8A658EB726D220F6656D5994F135D9E0384FFB11DE52E64B62CF73082C1C7CD1DB6F44D1CCFFAC9B124CE76F4F9D9FEA045ED7108E177DAA3A65B5D859ECA6CDC99D67EAE7804442C967308A58449937832F46F921CF3916424B3CDB99D66EEA25C2218D57D64F2BADE8BAAD2E7279C566EEFE0874FDB6637AC350FA2434EE8FC663D8676C8389387378CF57E2CFE648B574939B152DDE02ABA6CB2E185E62DDE17BD5B5FF5489E267CABA5310B83349279C2122233C55FC8FF12FBFF68F67F65E7FC9F782C5D9C154C9D44EC6D1DECED4CED5C8838611844EC6DEC9D941D0C8D4D89B419A44444840D9D4D4D88FE9B96922E0C83A4A9A5B9850B11132B270B0C83B2AB918BA78329118394ADA1F97F88A9FC77A2216F64656AEC02C3A06E69F21F7E4C8CEC8CFF8FB0F6FF444CC4202AA2F2BFC3FF6CFEDF8182A193AD3391B69DAB8D0DD17F9DA8E86A6863E9E249F49F1DFCFCBAFFCF145C1CCC5CFFBF23B2BF3D79557E7F21FD7399B04CA4E442A2C94C481B651BE14998A26DCD921B539082C6E849B093AD8CAEA835C98D6943945A8515D7A9379142545EFE68B736EEB0F8F4F4026E095FE300B7BC04E60483D95CA75DBBB7AB9FCF5EFCFAB7AB97CF3BEF8D2C5058A0C25F209D606FC16ED05728181828EB344DF6B7B97C0074B21284B172EA8AAA0AEA0ABCE5A5616C0BAB8C5CCECA402E6B132B4BB966322B2C4E1D97BECE3D2851DC1931A281810180D82BC14EDB6DFDB463CA21FBAF40AF1B0E90227F6EDCD683C2D81F7F193410F490AB2EC86260A001D0F757909FD74007A1764F0F43EF3D91200A951B887F440A94981CC9616159B85FEC285F047B18C7EB245576439D690EC86E9440B5C8395FE1F237269E87FC46AF815DA5D60670BD7D3FA04607283061E809D2120AA32D7F2D2ECF70F298998633330E6DE4F31A7800333BFDD3DF896114E3933C949CA4AC57569C5C2F23D3FFB4DB6E1594951617586EB6FDE23346C7CC31D030D0057C7F0A0B1B2B3B4E8EABDA6E7738D8DA9A5B7D0C9E9F7C6F2E7F1F5CF74EC7CED6DE868ED0005EF7AF0B0F13171B79BD97D96E42409447BF7ABF849B6430AD515159B813F087CDB003E8235C42C959126A39EE71C8C06E4C06B77F622CF8DFC68F248E63BE9C3287427C6A03B6413E8F1505D031B8E43E571B7F6F71301E7FD5277FF2E03FFD5AAC81908285FBFA8322414205F3DB4585E678691445F0B070883B4B7F076E597007FB92397690ABB79E8AA6BF761E8D704B6A0424DC35638CFF7646AF84C7E5CC34846A76EB4F68C9929EB6AF0CAF7D694E73B2AC026DD3D2FF3E091DED93B29A4FA08DB78016833FC91CDA24E3942E133720845429EB5768BF2702134A609213E0133CAA22CC1DA84F01568A47578B76DC948564185512389CBD4039AD8A8CE35F8D3A2530B9CAB1976809097BD96558A13BADBA470F821FCCA3D6A3FC48FD3139D08FB7D54DCAA14B4A5EC92077254C58AD6BD1F06E0DA2CD11C170EC8AE764BB73F5E7425636B6C29E30FA53CF79B5B404BC6F39B320BAB91D1D27ADD7FE51BA0C56F6A7F53B6F0E2B70ECF014A5DC5734A662396E9A6550CDBBC09E2DB9B3C06177AFAD8BF12178F220691A3D930D5D8BE0D3EFD5091ED4F932ACB59DED583F159200FB49C058E2B26B3A638859173670D1E0208A1CDA0BE47C632CAD13C409B804CD9197163F70E2C3445B8A9D93FB86BB6DAD48EC35D2AFE39841BDDF799EA591E6C547AD03F39312BC2BFEEC30E1BC40418415F7FC90D73D6C50D8BCAF15E467F8BEDD8EBFB4CE421E833EE382FC847397CBA2C1BB583FFC8D82FC4E9134080FDF9CE4AC713AF4B469CFB39EEA8E841EA992EF9A8D43B4A5DBB0531C4833F6F12BD3E8FD4632B559D5FB73CB3C46E783BEE094DE50A0F074DD3EB3532541CB80EB58E702054CB159CB2FD5DE08C8DBCA249C73F26C845A9EBB4D8FB6B6F5DC28B04C1B3F5441C168ADD29CD69D27A2F9776752EDFF15C4F4BC15B6817FD1B422F0F7D6B5703CCB07B9E2D02BB7DD4F36B680D00394BBE1B2FEFDE409A40129224F3D3B6EC05355340EFEBD74E2D77B8FD2EE6CE9BACE06C597E8B02B4D5F4F10725793421EC7B3DD346F73432A04ADB9DD78E579B908F0BBA167DFF5751EE783431AF279A9917C23B672E5110E98A93E320AA15C0646A95CA9F5A20C73A76DEC6D28890A299402B4C27C8A70A3B798FF256C26DAA8D61E59B59EE81C27638E8394BF99A1C1474D687FA8E4D10598EDD54E4D7A9FA6EF8AED1FE4603AA6412583E6A69E735FDF68578001F67BB25E07BC8D9A88435C3CCE396EDEFEC2F99A9246D97A6C1D5BB64DF2D20F3EFF55A4FE9EE3408B70BFC8EE7C020DF715352BEAAEC473374A79D8C182067D8380E72974E140F154B1BAB9DBDA6471DA32711F0803ED18A5A6BDAED2EE92302D1C356F937F7D13A8D9915FAF119948C9A63DA11358D23E0BB35E980311C5AC2FCAA8C02DC591ED991AC47D2ABC6DD038D6CDF02410C1218EFC0EC56FC313317D3CECA1B3956BB99AE4F27DA57E4FEA8D1D08D7516CB83C9D3C626F091D275E93DEA1F07DCF3DEEF5E6F1976A9949AF4BDA7054C4B878FD44590EAE76044FCB4F719BBC907D1D7D5A69ADAED6BCB974ACC0672816310FB08C9211BA0C2EDCAE441C4D41FC98923D0E85909D8A9AE6C0E077E137A52ED77E3318FF8E8DCAB7B39F0ADE88C358627B351A467399071E0DE7DC645F37177709806E0ED259A07664CA853C0FD1E07A920A7CAE11BB42AAF56EE1FBCD8812D037762E5EC0BD4DFAB1EBC3F0344E74C53C58AAC5F78838663D51DA1F6DE3AF5436596F2FC67804B4E989893E9D240CAFB6D99FAF7B5FA1850FAC2F23E7917E614DFFE143CDEAD5F2E3BFBB799953F4B2036D201BDA73AE97E73475A1BB737FDBB0A292DF88BF40C85F10E06FD58E7EE956E127617ADEF74DFB28CF4F852E61A8347FB1A0695EE5637EC1FB055409B04FAAF5B0EB35DFBC2B1995AE1C19251D0BD657B683FB7911BB27F8A1C54E210CA6901A47C5169702118828169233190BFF29068508285AC8540A4550AFF38DE0D934B2F5FEB0FB71F9FE090A1184715FDEFDDB1AC3B26A2F73BFA735B117D5BC5978C977882930CC23216772E3B6FAEF259F64E09B453A1B8B7FF386C7C7D76F97EC79ACD3CC1276E4860359BDAC7BB8763C5674855B8BB551A045B8B8A9FB854F7A928A73B5FC6E4E41668DE83AB4971C7EB27203D81786BE32CAB202FD1A48DEBEEFE765E73BE11FCF7B52AA585326C5579AA7CD571CBE202AC949B336493E9F466DC094DDB94B85A6A7C5D8C47C586A075FF56ADCBF03F3701E189E5C62A97BBF59185EC9A2B0696E5C3B6A7BAE18FCEC650CCDC90D6087F1D592B2E3276AFC6567ABFAD0EACE4063FD11D26DBECB1455BF97C829CEA41FD1501F016D32DB93F84771D19E92EE66ECD602F26E49CC955C65B4A00955E151B2A654B3EC2A8E94D1146AF5CC63881E5132BCF6D0DA81BC3B2E5854635885B80137BF1CDB76D9E2DF9B04C2A49F767BC9FB6D88B62317D725787B91D27784BE51C0AE6CC99BB71D810FCF7576BD8691A2794BDBB34851FFDFA2377C836FA91CB46600647EED3E83842AE38A2D6A916266FBE4FADA962B8A71CE5E610D25CBBACF723ED7C8AE8D4BBEDB7D589DC118DF97D84BF1987001D46B5E556079FD420A4EBD62BCD409CB22505589CFC9D6FCE9E133E2D7D557E7C3C21C53D15BDFE623E42C6ECF18FDAFDA59AB9817F9710C27A48FA59586C4828A5B5CC52AC4076CE14EE5974D384E10E60CE52D10F487BACF8E8FCD75EE36F0CB2FCFAEE702AB4E89E629328B1EB38C4B6B5D2E122D583BBFFBEAE5ED0E9D3DAADA5D495EBF7B1CDBE52D5087846145F94D082A10A3C4CD3CA17552C4ECFBC79267678EEBE4C55DE7B51CFAB5B35EC3F89433312EBDBD6FA682AFC8F7EDE558F80B99AB7488FE4E60F3D3F2EEC7319257CBE9D933472E26068CFBFB18FBD39795A10F8B370093991B950841556A7F792DCF13ABCEF17B62F383B4DA3EED5BF00961AFD95D99EAA9E6E5A772FE9A41FE77CF10FAE02E5B1B8AA556E3B8FA29F834A18C453D28814D1F3C8547CA52F15F9FBCF9E943ACEB6091435FA11FE4EE9F92AAA65937FF2C692A8A41CBD479DD46D4E768CD98F22A62F8A13109998A658816729478454DB1B4B9FE99B5DADEB4A015DB4F08358CDB8BE1F186975B20902A76F413FDC95F2412D81977FF6F9707558B79F57257DB43B4366958DC344BDD11813197BF0B7652D81DB9FC874C074F801706196F1BC0A117A3099E57E52DE0A6AE133FF4EAC847A21642F7CE63929FA8ECEDA87EC6CB6F3EE86BA43728E228A99791D099E746C63310E4E9E905E293EAFAB6045F30F06BF4AE5BE1E9C2B16B677734B4C4A466F9E44EAE8ED1529B053908762E0385E478928D47B0FF09B9887026CDCE4F799CC4BE0EDBB7FCBB799E8CBD520473E7DB7C35631C14BBCC495DBB6D7104F30513AB3ABA6CCE0D085F44CD363AA6CD8C07696FC5A1F5C4E098BEE8B8485176CB7A6FC3A3047B6D9E202CEEB5332E95C09B205919F81DE91983BA9BB3BB1DB46B8F413618EEC1497E3190DBBDCEE61DCD7545A6B690087FB490066769A5B26153C753F383F87D0E5FF0E3AAE6BAD7A04ECEF2648944C8DA5B3178540605C701FD1305EF067F8F8E1871E1E5E2A00BCE634290C71D610EE19F44774A51DD30F83550CF0E396C9DB1517BC7EAE0C24763400374A4D96FA73A8AA63647614F2F49EAB611A5D6F9842D0375AD5FAD3633F0DF42B304C5BC66AFB62D2CDC508C8D507D96C6422F975BC845B27FF205AD4B4BC7D5D49B6E40ABD545E887570301F87B9F45E48FB4C4B934CC65CE9F5AE7599E1894A81B6B9370B5FC4039EE86013D59B27DE17795157CD610A931ADFB711FA849F0A749D0492A72B29B5495370597DE6325613C820C7152E46B7E6A4975758503A7CE97852EF605BC157DDDB1E59EE7B1A239BDC69B7F06F484D2F9BE62BBABEF82CF297531D1083A52DB653656120B76C16B52DDE6C2EBE107A08137503CB2946258A189DE3F403EBDC7CADF62561BD70D13F2629F1D966F055EB4DA5577C1320005ECAAFC6AEB7469701A278929F0DDAD64A859155B056DE1CBA395D1B147DEC4181A53E15937194F1FC80218E7CAA59D0C371D126E72934C4D067F32767D1856597892209AC899E9A1F5005814B1FED15BB01F3EDD9732659B5E0218C96DB6386E49787DB5516DDBC01341CEA23DCD822575CFD1F87396986953281438F0050EEC494B9B2EE70A686D4FF27BD58334979F2187E898ECA582E046FF0C2D4037C5276DC5D816199336C03972BCEBCAA1E37814B7F1B411E228FC68CDE4EFFE91F508E07A3C31DB3C9A2EE6BDE5AEDAA67DF8BD4BF89C1E643328D7F8DECF556D8ECA0617DBD22BDBC6C5A5DB2FAD8E390E6AF148E46056EA11A908227B1E669A39699AFC360DC12392BEA9245D8B9D1E13CE99F88289B8EE8504E301126C184C9AEEE23630FD66F8BD32EFC9D1D605D03B2B96FEADF9B8051824C12D667445C9DA852309C875DEDBD1ECA940F4530D3649F0A700DAF06F2D04BECF2BC8467B44738688AA6515665493C333C3A92F1988C66B2A5D5EB6BDA610476D9483EAA4332617462F6DC9A729E0A2B0CF3B6F7E3D2C1A2D5C4CA18687240FCE7217A05F6622E572175A9683580F39B84DF99073879FD26CB25CD24B63D71E16F9046EF0BAB7BC124E1A6EC796FAD4070FD13BB98F73821701A7CDE6B2B69119350D888D1FEA9E5136B45BC33C71A6A1EEF8EA4BF70F25CD1E36E7B96C52DF9B3945EFB7C25102D6CA208068A7A80CF6C0BC17EC6532728C367D6866B298BCEC3BCEA753259DBE1662DCC1A28431FCBDD0CE32E21D075B82E6FAD87E060A8B323201367D24EE613F8F4DBA30FBFAF1AB165670C6B74AE88C9EACAB3EAC525B4F9F104B2BFF50CD8B6184F8C576501D652611FC2DFCA78F838763964D7425DE4FF915E2229D9E620E335962908B42BB819D1A9ECA89C5294338D0BCA4E6CCAE110544E43F898A4F23BE3DFFF93C16C74080E4B3BD4EBDF25CF4879F9B193B2ECAF2047A1D210BD5E0AE87DD80C260FDEA2701B448953A09B6A13EF269EDE5F4C1D7A1F4D5CB05B9D702E579704A5778DA34A7D34F4F9CB45163E054268B9EA4C479C0B05A93219D4F1E6B983EEEFE97729C4EAF4062B22547CBBAC751119704D2AB37285A3D53F481108552F295B935A2FB9F010A053275AD12DD72879DA6E49FB7CA30E850DFEBB73013DBDD6ED8986992F9FE5896C325F5C9BBCCD113EDD92DEB8D2A8243CEA76FB4D9F1379256DBC0A188E6D47FFE0421023AF5535FF9863E54819AE85462EE5E50EDA9878F3BFF8DAC68E687069701336087F5CBD080274680C1DDAA425C08111C03453E6624A769C084CB2BD4A4059DF39673563245350AA08B910AD7AAF36A4C1781102378813D6A4ED5E291E99940C681E4076AE0946E248350DFB1F2AE8A5AB578F02721D4A8F8EF4E1CF19526ED42EF6E168F75201E220C44C62884005994BAEAB6B563CB97B5FD45F57E9340403152A6B65D72E1EC2A41EB07C513A1B16C5D12D17375E776156A4C3D5FA8118D1B328BDC3BA856EC39C2511640ADCF61E34ED65A12B28254A95BD02D1E5FB158E08D72DA5368F62C2D006BB3F248F200AE290429DF14F71CFA4B03EC4210CAAF982E7A2A8426D578273986344F42E69B32B3088D982359F01CD8ED2F8D0A84C73A7DEAD8E1113FE5718ECCC8815DAE0001533E06B080C79475FB0A97D362577C9F3C5E7C52F950FE0E6A4528CBBE2A79BCADB5DF2CD1DF06EE110B3A74A7736ED81BB8CB921F384D65FCF2835A83CBB2FFD1C040D700F4D170DDEF15AFEF6395348B79DEF65ECE9FA4EAA874DBC12166FBEF2343F22C0287153F1E05117AA8A0ED098227AC8133292A00EF815573E47308B349C206813EDBF081B4A2286412B7D8615C4A857B1B1BDBCDD4325223CB2D7002710944C1335A8983440EAA8800E339F0D3A9710B5582D4B54E94834970A52BC260EEA5DE845F175DC8298025C717EDE92E8C1144ECECD578A275072065F0C2408FC978CB80C747F36F300BF67D507DF32C4B037BC3394FD13BA3720A022112172CE242CF416770F6AD88F2E6CD88899D3823CB1A8420F8272662A2C44B0F26F505A8071F4AF5A1A1C80993AC9E29B44207B246ED13E613CF4B1AA44626835E23FBCD3869C9F16B65CDA46845782C97F0A1F88461CC2C118A0D5B5DCA0E31181A94DC5D19A18882095905C810010745B2B6F9921B75C382C028A51228723642A5338DFE4156EE7B39B769C5747267748E518477E3B8F1B69FE223CFF7FF4AA848923F2D608853307410E4A483BBD2774535F9C183369832E8365C2135206E508193B302D913D50A01F35F244B2706F610D3025F534207E24A10472332D85BFD6B97D7ED2A6B4227E73840FA259D688602E59DEE472DBEFB3DF19D1B1D22A5CABEC5BEE1C15BD1BB64E728B5F3C2B16A04AF8AEDAC242ADFF398D9872CC05721F11E8A48E0B30C83F9CC16CDAF6275EAC9A27F78E1DAE22E9C686A3F5128DDFD61B7F956B4409A6C47B2E929A448DA083598FCADE2F090F8C0A388FEFB910D37017C6AEF60A736002D07249C162F62B404EA8058A947CE916D00D2977B30C31076CCB0D88EE2E89520ECE0AF989D871904B6968E0E01334B162372A20816BF6741C64DD4BF2B3F9D2919BA50F00C853F23FBF35A8290131E96DE379ECD010C5473F42CCF1FD1EF42AFA575062641CBDCDFF3078559489305B90CF49296D93A11465A4FCF1B29743739396F76D9D60E2C32A8141A48BE4A12F42E41D945211A9DCB36FFE02FFF8F0B7178E8751151FD0E2732A7430E8B99972ED223C3500BB9263707CE3856298817ED3E8CA542D749CCC33AE79DA25704B109DF78FCD7F1B892A0D5BF42A4946F730C9ADE9DE1942D5211FD52402190B768DA0D84AA3DF460940DF99FD41FA4A0D57B1D5C142F6083B690E3592DB862853D993DD2A521209B6C7AD86C14A0E8B4C860D002594756EDEEB49433A0B7187738D3E7AE71B54E2A151A12D5020E2DC1119155CC69696B8CAC845D4AA4EFA3BF9C28BF0BE5BDE9082EDA43EEAF01BA5CA603B03D8BF73ADB7B31D4BE5A1198918CC0AB55B7CE7E2D3718D932D2DFB085A8E33EE2F5ADC0584627E346DE527A1CD96E24E71F5974B7523C80291E0F5C2DEB0331A7BEB440F17B1EDCB248737D457D929E7F8818F6C45109BDB554565A68BE0061E43722B84ED96F2D8CA5F433865D1A6DE7CCCF8617C1B9571FDA55E98DCF3860E9BD2BD2B14CCAE345E040F0B56B303C5E8AD0C6301CC1A5A43EE06CC31048166AD51632CB23288C627CFF30BE81EE9173FEA42E3562DA075411480C967EE7E05E1E22E48BC7B7B1CADCF59354CD9265EE59C4A4828BF6C3741EDC6DF31361372A6DB4F7D4F71C980B59957D96A546F12229358A4D1A74C015889A36AEAA6884B7FFA9F2256BB875B49207A4D6797B7B31F745885D4F5B6C183B3E86FFF3CB8AC56650670201F1174A4238AC18A6503C44371B1C5614C8B52175F9C5376A67F3AF4B5430E8951626D238441E4C644D9873CFFBAD0107551F8D3FEB81163F654BFE4A7080BD88077D60089744C48C11511379B811A97FA2E0DF4091AC59CA8370801ECAAC21CDDDA80F15764536D32468A7B8545D1449617E77E0A8BFDB2C2C5714F0F29FD32B4F169421D8AFE6572ACD6215B106148527F1994C773985E0C52D05CB10597F40B38A1A351D1A3D9E4440E67D647E941CA94486FF15E20AB54F1019782BD022C4CE1F12647305446A2EE7280B544121B17D2CE0417B266B621E29F099DF71996CB05B949D73FF643863A225A678EC8B77BDBE91CDF6B93B0AF1F0F1DC368FD686984083379C2D90C803FB6818BC86D3EDAC495EE894C2EAB977B1DB8E2A29084C0899C372AD32D50B638BA0B657AEDCAAC708DEA3C7B92DB914A6DAC16B21AE565EE31E25954A872B62F71622B4E3EF7188CA6917EFB3733F0E83B40FB464F18346D23D593185BDC740697003A7A9AE487626A5731B64DDB5C2F6C77DD9BB34F9AD918D83E91353C3D5580B3BD69A514A09B61C364EFDE700F9FD2955B1211A9EB2FAA454F7BBA2446310FC5277DD5D938162E2E2AC8AE3CD250C4D0F15D00AC9AED7B896A2F353E6B6C8B0BC1E115EDF21481870BFACF6B6FA743C6655BECF34E4C237EE7CF3F6E89DD5EFE3FE2D431302B65B3416864C96C441B480713965D57DA7559E046A32C00E8EB5B737840F494FA9CF594ADF514B144AB93A3FA174470A08C26012021E9304B0FEF685E6C7889DCE4EC5A0442F546AF61EBAFDBCBECDBC261D5D0BDF6321A4D057C62D19DF6AA3F9CC3251F72120B051CC6C77AA938DE67D73C598BDDD69EBBE826F9464D4F27BDAF6CF11DF039B6A2BA43653A72F83BC9B5CA04EC9ED7A56A45E4A40B843CFE2C1F8DF9EE254F8436979E47F69C6A7D0542CD8F7F29104EC2B3B648525CECFA62568DAE3CB9E8ECF35BEFAD26308488E788A230EE3FB75154E31D0C8338729B0FF30183ABA7220EE1DD98BBAA79C7395E7902DD6BC51EDCC34A49DB2F51C72FF34AA7F5F86DA2EB2E8309669D13F29E30ADC36BC1B4736CAAC546A0565E3828FE4FEEC6006CBDCA33BA672FE4AF21FC0EC7F453C22B6CD25D4599F7DA17FF51B37987BC3734BF232E86910A75E1C9E3835C6393074A0CA77506899AFF235652FF1B7A15F8EF025F6E1EB7E51048DFA8DC1B56DBD3199349DCB7A662E0F90FA9E571BF49466799C8611450F5535AA63BBF90480C62246C5F54F937DE1B8B7E85C410DB15A3E739645E7C6007023725D7B63FF99942B0E47DE8D127BAB94A1A3CA75C4AE6E49B603B2611F49D97C99699A5B4CB7C45F572E6ADEF6626E1B050EA616745F6152745FF708AEC70706A1AAD34A86D6F766BEB54BB67785B376AB063C1C68CE4A5EF652B16C7CE6AA88072837E60496BC113F8CC53EE2CC935274A477EA1EE4AB596426E453D453716D9F22E40D401E41CD32BFAA0305624FF83727AEB8B5748CD9F88D3E01F6030E2BD8C8F749FFEA3EACCC769F7383ABE4479C2D81AE4CB4CDC5973619DBF2A9BD2B045718BAFB58E6B726C3891B4A675326AE31DEFEC54A82DE605610CEA6DC4B679BA359CB93602674DF6C530BCBB962E0C2FB522CEB48C3ADD5D74EAD39C79EC89F7A85C3D2E0AFA6CD5AF9C42CB43FCB292EB8798A8F99283F79BC5018892D664698D8A14999A9708741729E7A3B0D9A1534B4BE6CF93B96480B46AB7DC4D156F8F78CAA0ECB7727E2D1CBF6DE4B9E4385B880062697548B65FE85B5221FA0D87CB45D5AFDCB9052BD1C56369384731321E385409E8A2366D3EDC1BCB7E75A2D987779075EE3B0C302CF2BD4C4920EFA07435BFC23BD720E9479EA5542C73636D24C5222785A838B7C4DE305D2CF65E43B27A9866CE7ED180CD739097A39176FA6CE27B5C67E160FC766C1E6E864D71A020EA82669904C9D85C7DC35864E664305CB1D2BADF9D8A9DE2FEDDC1B9DD03ACFE5E6DEED329A9A708DC68D63A70E7DEDAF8386D49725C6448F7B5FE6F94FE5C8608A4E49DBF5CEEAD0F07C0DE0D2B302029DE807741D14D10806B850106DCC45F08871529135FAC20B0C178CA9E9841C08CAE95EA7EAFD114F32820E1C59871F35989C0A9BEA379915B2ECEEA8080AEF4D084C21781F2D3ED10109BC3FDBF890F32EF00E91FB311149E804634F0298D403FC0EFA49531483C068A85C1D4C5E41D0063DA01BEC317499100132A06B8F995A3B8E1362070334C1649EBA1175CFDFA40DBA102A1D8210A62C340494D8640EAF19349C98754A480AD204760CBB5A18194A210F62BFB9E5B14CD02C10F340BA46295254D86590C0C7392657326772927188AB46394AA6B207FA6B1DD82B56CF7DF4D18820F7A66D309562F607A9A3422125FDC789F6C8E1D811B63B0633D14A444E5DB2DEB38C033F414E5C00FDED5CD2D162D475BA3A9FA5F206D750A5A20D15768D06A57DF7879FF7CFD97A1EEAFCF0E1F01DBADEAF0E0A48551B66DB60FD891F6F507742E553D6334FEEB56D7F52EE83D0323F9BAF63A9BE1FCF37ED7DAAD8C1FA84C62543B53559CC0301E39A8CDDC573585C566DF4195D6F3517BEF127C00F32FB252506F9A226FD4C8D8FFB87B7939E64C8EEACCAC8CFE84FFBE723BAEA7ACFB1102C62DAD264A452927D652C9ACA6798C6FE8E1BEB4B4E23C78A3271A5DFED245D63B9ED7A2F8090E34513EEE5E8E72C4B3F7BB6E7F50DEB2E85C614E7B37F49E0E1FE32ED1DF44A61ADCE70B51F517F415ED2EBC205AF8141864DDFA51A709D61B71639FC281FCA87EBA9F0C177D1886E4FCFA2791859E37568A136F3CCDA938D4FD4F8AD2D9478AFE8BE97140EEB43FC0C32A90EFEDC5EBA717395E3CBF4A4B43B7890A89EDB2613C7D542D575F556701A67FA6A2A90DBF3985E07B64C29907E6DE0E7F407834E36D0ABC906941EBA95A3CE05EFCFD1536B470557E69D7CC70E9EE9451067861AF0439FBF1B3D3525B54550084800DA33C061ECE8659F057137EF0E605D7155BAF531F8FCFE39375EC4A0770DE49A322C264FC8EF687719CF9893F788A17812BB9F1609701C7E31D193992EA1A1A7737DDD7C4DC87CD1FF6D07EDC2D870079938EB59FA5A789C81DEB14EC46D9841FE1366A5D2EC6233CB278F232E46A3C5F6E21559179E52B3594D5A9D3CC14F538D7D2347B29681CC793055E05F261FBCA1EA97FCF6B2A3CB7ADC9CA7A348B2A9964EBAEE4A2933B097AB7F588499DE048E4A1D91C7BF5BE3EA923D3187DBC52D75A684DBEB5B55BE063B5E62BE7F4682611F96A67EB1CBF675E770337C58C3864DD82337B544E189A3422080310C56FFD1994390D6BA8A4C681D03DB8B16CECAB5B15C5E766502C6300EEF3BECEA463DE0264D38EB7A84164356F773E49A0E91732AD62B34AC2BF518542A753B591576DFA077B90404016324525D3B8BC5F972394E42985C92B1489BCAA3A15D69F77EFF031C57064C16BBD8D1EDF36E4F98EB5DF5693C65EB38C2C4993CB36858BBE6CE20A9E0300F3354E635D056EC38B4EEF19A4B498E97FE5DD29966B5AC8431539E5632F835771D2661FE516EE10AE7F0B58F8AF279EF3C6D48314552733AADFE0D1232CFFF0F2DF20DFD66AEF2A6BFCDBBF91014671F2269900B0FDE08AED050937D2DC3E566DDCD12120BBB180D0F2BE2194213BE5A45085C8537BB56EDCD2F287DAF9FAC60D5B647F834834311A9CC590CB1CC44E165C8895594003D0C18FAFAD7056D0618122AE0238C5066E51206721954125BC8574A67BACC79309D9A28BD066ADA7CC6C8A3D8511C6390E80CCD91581AE88C2AF4477281F94DB494540C2711C107F4A2C13052321914655A31FE11ED9AB7F21ECE4CFD0A88AE108031098604BDE0C374711D465206A422E6E6488A589E21D813AA4391FE60B518C0E875B7C6AEB3267DE10A8E1499D8975307F46281128A73B3EEAA37BFC40E6980892BF1F05C5774B7E5A625758A274D53953AA4D37BD9DC727EE617FBE63677323D189BA99D76CBD1C1E1F2B2D8751A43A77606828DE2D61E927986E2099A209F14BA19A78DA9462DA8FDB3070F6E3EE7DCA42C5BDDA2B86178B163FDE7C8FF258325C98F71819052A2A7519D6C804F4F25A7B3B790A457D78F94D5AEAEB7323F0312AD11D99685253B5919D8DB078D65826DC007B141C681544CD6B4D5115417B3BEADAD9C51025E2ACC5BCDE1EF380B00BFAE40C58E164A5779307236E7FED54B063C3C803CD2A7993B3E8238321D8A9468060CB2094D1A1C4FA958BF28CA18F2C03BC981A7AF2D78880AA5F91BF6422FDE6D26A3C81816E90D3504B85FF284AB4242A020145AC2AEF5BCEEEBE1C3196573FD61A4D336D6C5887D4A8CF4F05358AF402DFB7E726E2CFF27A5AB384EB9A6E216527F2B80C21BB6920BB7A0950DF57C71FF9E5873E6ED9805276FAA98DD6BB20CA073BAC14D0633CAFD4F5D6471CB68C4FB5F70A284581290B8809115F691D2BAE40C54006447B8A258E6701F94B867B3697EA0712BA75D0E8232698E2CD6DE1D3C6A7C5810C585A30E1D69B8108E3127F81755E41CE24F1C14333E9A20A3AA7060232441F3F16F5A3C4AE7EFEE16D3AFFB10590D93621B274167B11D49EC2078AEB850D20A572E2EEDFAC826F09C2972A724D24CD23E1EA77AC9F6D9C85D96A76740718401FFD47EA3AE0EED1D95AA09768A031116F8740468886B060258C6EBC6C212CBF740D6927F1F106D7F608A546A5F5F0F52A3F0C3E80AD687079089553B82A4A4C25FB12D3E2923ACB14335C400B9004B96536D05CB67657F5F0427484E5980B33230E7482158A2DA230F6CDF2320223782D34158780D03B4E27268D830F2AED10596FA6487380777FFB84414E4645A28B0AD0A9BAF848525C895D80DB8635B57A64CA4512E50A6A5D752C7316365C3E1759102B6EBC4998A8677213F8197542CF0CCD4941A7C8AF502B6F1AFB74711557596F088C8C69E49C040A29BA7EED0E94B22A2A90AB0ADE453FADEF3447E1FE0EBF9252F46E78DFB735F50EEA7F9B500AB3BCD54A9D7CE9E1F953745219B33F1B78BDDEC3BCBFCE9F408F35E493F0BA8EACF80BB4772836631BAFF1A752C2D48CB0A2EA4B03C79ACFF3ADB5DB9FA07C965E4E70B43CAB49376C04063F1EA826B4EE91B07E25EA0804E53C8E79273BD5108D9F16C734B84171FB323F3533646F3EA17FAFD883B327D15D98BDD7CEACFC9C23F92C2C009A93ABE9CC6D8840485A463865518D15EAE2C27BAAE9744DC68FCF2DD53ACAE4E1DDF9BD8B1D65AA7B0812AEE96CA9E48934F87A028C6F68C470E5DC8346B449BBAAE486EA5C16DB392FC4AD2C0CB8FA73C85052F2145A648382DD5F9CCDCB0A1282B25E2C4E636499DA1610A8E2EB74B5926AA48D890C27BAE1476355556745D8DC61CF580F9F9D38DC099D76D3F09B0E1CD8E246A6FD22C22D282D020F3097D6FA7796D5B636384259A73A5DB64CBF73BCC1DF96C0134BB30EC0EB5B1EB95D1728F947EB7F154B697656F049ECFB4796F1F43BE7B7C9803E5C8742EC3C74AB357970BD63A2DD55E88274DAB636C92BD0FFE774075BF78EEAC71F0422479918C5D1DD26E5055ED049939781BE8A9399D99BCFE6D84CAFA86F4662F51DEBD647E6C68956343FB002F8DE2FA610A6BCEA5A3F270F6A4EE32B39B511F5C0DF9031AD95A5BD7547E1D7F2D3F91F757DF63F02BC10607CA916CCE5653EC57F812EFE1FC276BC9BBC8D8E322766CCA323677009B2D330EAE123165CFCEF30EA8E1EC953D627437730ECF9D25638EE449643D5DF7BAD7659FF5E3E7C5D66DE3A388F9DD8EED9D6C1E86EE8FC8BE93B96D18C29E944E515AF4D3D5646F224B45759E6F1355FFDAE2EAAC9E6DF225CD4FE5688FFA0C02EC924D326A7731662B289A86F8F2794285935ED13699EBEB54A6B9FEDE88A84ABE96593D875116E959C5F5A2DBE945A3BB3F35E6454BD806F6295AED8F2DE987719DB944232A482192E3EB58E579C6619C8519E8050379495D87E9305803D3F56A386E1EE20604947AB515DC726FEF01CFFB5074CFACE99C2C9C23A9BEF3479F3F60AD721DAED2F940617BDBF15FFEB94278B124B6D45386DD2BB332539AED8C99B187492927C2569728240192D12A66CD5C3B368BC6C9AFCB549F00DB52D4EF69BA9AFF6F58DF2FCF02293850C9C08271F0148D499F90A4239AB587B23810D7E32C72F829B1838EE9573E18F539CA0FE85DA3A78AB5024658BF4C2D2A979D26A9881FC892D7F60986AE2E12AA9E82C41F57F17D8F3E888029F562ADBFA995D027B432C36259E635D3E942F3A10823CD3BF5E4F19C4463BA26C0D37F3DEC401CA6EA88DD6A3B3972D341334D2A09604DB0C28AE4FE51122378E106D38340306756EC68EA5616CB0F399B869CB81399B324F4D17A04428C49EF7175337048F93F79324CE3312CA22648FA6F815792E1F8F183AC07820867D0094CAFDAA24F1F57D5C5F2DAC0A2A35620E06FF43DE623FCFEF0991E96E83F6F2DB98341C761EA7217ACFDA6792CA37F22C9E0A6F3A2053C3708E418734FE1927998916B4C3788F18EE7331530B93C7CF63C06B1E36AC50D0CBCC62CA7CEAF0174CD430EDAE794E7F8BC30EC042004769A24BA065D7B2DBE837B074751F9279E2C73EA1F3EFB60A4571FEE184CBA466C3EACE3B311C7DD4FB56CB2EDF8F3391D8B5F328C8140AE6D1B4AC85C502C4F8F2DF53A40BDDDB897C3FF6D70AEB320E5101C1C9EA17A7AA8767E8CC5C7505275EC9B8C66D51334B719274CD5BC76B48E008E0E95EDDF713D84899DD85701CA6B3FB637AAE024C6F3615A9A9060A738232FE9E82C345375FF963C3D6F2C91F209E1C2AFD3446423B8BD5D655CAED4390F8728388A7353AA9CCAE28FC8FB5147D17FD5B0407DBCB69EF7DABBD2D8D8849D526A946A8F79D587C5516B52626726F8CBD205131F3008E055FB75E6C474762421BAA1FD4F4B56084580D18916A00D8C83CDAFF5095F7CE8BE19A33882DB0E528BB71BDEAC6F1F64932867928CB68A36BA1C47F57D194B465BC7AB0B605E58D765A8FF60DC13AB86F9C28DD4AC3F12FBD869A2A7A3D71BFB01928BD04ABA056E5A8F7393F5C701F51F2502A1DF61D0618C71FC1FD9868E11DB6E528DBF30CEAFFE2A0827D7FAC0067C7BDEE13F11D8ED276A3A4FB7E3F87B158F1B74D3F8FE755C9D184E874B76CD0DA2317D25B64A7AAC55C2CE88E8E3092C03445E309499490DE56C0CCF6B92B6763E841BDCA04A06F795A86AB9691E4E0FCAF51FDE61C1C7BC534C024B26C558894A7A7F60B8644A19FCD27C2B1CE585C8617E4539E92907FE51578AE122945DC82BB08EB278A3B8036AF67B11C4CC322C96865743CD80EE1B727638185A7FB9912A97591855D6AB33270E530BF3BEA101CC44A1F6850F9EFE9647684F437565992C9FAF5D3C26B27646BA3A8FA3512E134C6CE208FC19E8623EAE7FE4F40AA9B8C8C8F1A566FCBBF9DBFF295D3467C7A98924FD93D6F719E35ABAA4500170643BAE7E8B1FF874C05D3F4BBF54EA3D0B0B2FD6D49D66EB6175A521AEFC0359D4A4BF3E1B7EBCCACC347F62C7C4C89546EFA5BC38B2F07DABF133880827A3BB3ECC8BD7754F091A49C9715B46EBB895A2F4CBFE8CF4E3AE5C925923925B83819995860ED7F7F9A2A62BDF769DBF8FF7FD82FC7D871162135193A2DDB42070FEAC9898E5484146B66C5CE0221EB37F2DD991A949D73AFF6B87674530370ECB80CD638D14D9147C9677B6AA793B4956C5019C9BB0347D0E6A4D3D1A850FC91079304C3F19FE539000A05F5BFA2068F63464683217DC7D480AB94D298A629D76B34756BB00127BCF5FCDBAE8F60070CD2FA4716819598F54F1CD77E4CD82AFFAF2029E1F60E2C0A70E239576465397927D9E33B99E2744A96F0D81904AFF2131BA7455A71110AC1FC013792A1FB6EDBF7BD41A7880DF0BE8B00B2E8306B087E93B64138A454FF879FDDDCF1349129174201A106116F2CDB7B73E44F29F3003B50CA6FF7A66ED23C925CBDF1C3ECE103309001A38AAC78406F3F642254291A601AA08750597A40B473923E6E6900E24B14F6D90A3FEA51B7B561FE8CF9A35B33A9D6F05001B8D51FB78928A0F8AC26F20C6E5680F8935CE0F0B26835AC64A4809CC6FFEBBE5FF25A7668D5BC906CB38982CBAB04BF077F3D020101BC2BACC9730504440E32E777E62E2F66FCAEE039F607F6AE10E9513E3900A4014AC1ABCD493007F580C40AA6085DE26EC7FC2DF83CA4FAB38F58A4B79C23DA26FC218ACE02BCF9C5712BCD7022B304FE04F3D3415B180CC07973E622276AC886B0430CD6B0757AFE648423C09C66C433A65631992F6DDC878E346699E783C07B5203AF23E18C867E00DEE67F3524295E113EDEFADE492E78C28B4899A311ACD57B0FCF9F4412724A96E11E316BAD7DC2D06269B15532E37ABB90B3032CF1AB1A365FF9DF9B79678BBEA4C135433FCD9C13B1E212E77434A97C3CC957B49D83D58368BE3A63028C2DD8BBD132CE27D7A20C7BE9B451A0ACD1DF90707B1371373C1F693EBCC52B4E17711B99EB465C1E5E730E25340853F64939D54A7E34E6FE2747D60FB1B36EF1FD5BB1A33FCCCB3B697398E4DAF7769D34A269A24015E1414280005EC590CAF1723610B9D35DD72530279462EFEE2DB9C0A52487057C4B52D833323FD4DCBB9DD2166468C053CC4D80FC6161B6CDCF9C2AFA37730685D9CE6112B3D814A13846BD2D1F61EE81702349994DA804F68B82ACBF82D06EB79742F1F0CDE7F0AC424F392482051EB241E060F6AF037CEFFCCCD792537E1F7AA16684C23A62C25D9C6ACFA4CA741A354057CB823CD1F9CEA8A11FD6B5C204DE45B85BF091F4D9397B202CEE7AECA5319857234DB0FC84581D3509693803532BF19748C102F56D1EFC0357ED87DA966E918A42FD4061FAC3555C47E14A4FBA9D52562FEDAE811EB67BAF058EA0D570D46AC382395DC8A75051CBBF4BB40C29F744B3B8D2D93EA21862F1BAC00D64D5980AEF2F683EB8DF9468519653DDE8415EC70E431F559E5544521F0E050A26553D70C6AA4C74E4FFBF559A661B5F63053C067837B9FA23608AAD9496369B406328BD103C52B0E4C36E790593208EDDEA8FDD537AC6029938468302E67ED5359BEA19DCE7BA958DF349294A2263644924DE0E5238564F3F8C07AE0F755A46C0DB1FB00A3D75E59619483D7C4A9BA2494AAE6CCDD79FD1509B6CF515AF3B9C833EE969CBC3F29B93AD1EFA22467B3FBB2A1421FB488943BE9C64F609B4FFD839FC530FADDFAEB0070F1BAC739C888A88B8CD7A7171DF32A41D0CC71B023B7834F69A2EE27F36AD1D654DE3880AAD71BF66A4A91062329A0DB497FABE5E1F42E0EA1D589EFC0FD412987A80448021CFF3399E5E9DD188774820AD7F6CEFB34CA52A33BCCC21E282CB474BF909BA2733C37CC71CB929958B8B3140E13D07E08A4B8AFFC380BDE3A801317CE6FD8FCC91E6121005817F940E63056F2322CD6C5B8B1B6DA423CD1A65A6064E8D3A6DBDDA0556CD83C19904630BCE16E957729E4167555951F54D91B46CFCA2DAB6C65ACEADE9E6C1BD7EA3B0E5E99BF10B87A9AEEB3BD269DDC27DDC5F3A4C9B958614E085C696407DAE0F5FE8AE4770B9C0EE67B8EDCA97E8AD47DE511587A9D97DE7989C87C2A0C33EA9766F84C06390AAD4F5A2943A8E7F65440B2729F7CB41EC796F9C1145E66E09A4B41C291FAB853AEB34B6785E93E812B8AB48931DADCFD7B2F9C7B591C858F8B4206AF6E9A7F8873BF8E31E3B0F97B2BFF540C87EDFBDA20B49B9B95FDD5BA80F0C6098F0DF8A8C19FDBC38DE975C94BCDB23B507B72D592EB9D75CB2DF59C4C89C016E39842C9868109F2B0733B2ACC3B9CC85B0A814E07CF2587C4C4C1AE75230DBBBA7C3E6BDA3C5CBB3780ACFF64665F7FB4C047C4F7514EC9A5B8B3FC7D16918A7B334DEB2F9833A75AC217F1D9A8DBE6DD7F1133706A5FEB663FC66FE578B2CD8B1EA6EF4FD0AFA4C893317699BB2E3EC79DB99AF2887CE0B153E564FDE4203DF1BADAA5CF4D4D5B6E9EF59DA971F762530AAE191C463AA912234B81C45F5732CA28635E66293F85F82B38896B7E1A015AEA889F671661E7DEBC02212CF6414046E070E6E8CBADE263ECD0F3D8694DD42ADE1144EC3EFB03BECC726F6CEBA49458A23B2A6B97B086DA69356F1FB406D40334AE71FC31572D59725172F8EC7ED0B3DCADC24B2A8E7D5CB11D4A40CF4907F3B7AAB7900215D726E07DA9A779B7787C09DB062854021CDD95D400A269D28868BCD58D2C2F4A6DFDC55CA57CACC7747C9B93C3F62962684AB3793667B82C03F45202D41E0E062A0BC25BDF5CACAF6A3969FB7AE30A309E34E107064287D98430327E944DD917ABC50E0F1A262F493F28E1A5E2CEF1FCF4A2BB41D3D351D8D2CE2A4AA413010936DCA2EE0E044C3656E4501A9A61B0B6D89D0B6423594C5DF83B102790B120DC368B3BA9B5B50F3F41263F5371B6FA5469C3BE9352BB9BF43D92CEDD12E14D8DBEFA91A53F753E5D067A20209C37F4F0FB507A206CB229745D955F2809114FD21CA9C0ADAEA520D30DE2744827367E2F0C889F40DA9FBCC476FEB6DA61F1B3CCEC6D6B17C9ACE615416A4274F23A52E6E76FC3287FBF0FC633B9E56EE467FCF0BD5DEDC720DB90374C7DAE73C8435B73CD214F5417D7C7457DE7056830043CBF8ECE5E85510DD29D69AD9EC1A5C8E7A88BEA93FFDBF6E366B8A024B90E8DA365A45EEFB8E7975F7457F264269B6AD3D454AFF3A88615C381D2EE60EEE994DB5690293AD72CCE4892AC70B51EB10EB905E809D32549D36FAF7B705B28886036263777DF9DBF7E2B03045ABCBD8BB6DFB534235BAA5A752FF1770E5E66AF2AE57B6FC353146CF9B74921E37C0B107435C689DDEFB9317961608A48A64CEDA43BBBBDFCE8DFCDC2128472444D2C17571C6E521CFAE782A5943DE7BFD39E2CE7EB78CD6754AE127C2F89993954BA40BB66A8DE510BDE6E52CC8FABF0FB02362B1DDE741306832402EF59DBE0C4981614C26B72FE4A05EEE520B99C857F8CE02FBBF0D2FD80EAEA72EF338F9D861A7345D1675362D3AE13C11787EEED7E69305B9448234769E05904CE49EB71E707283C9D08621C4D5C08E447EF2B0E7D17A5E21904E1897DF7EAD49D8062E7A72C14716319BF15E2397C11E11FD3FE11CA3BAE3B71A6E3C027B72DDBFF33989D8EC540AA03243803A74C17D4CAE957E38CE115FFEE6210D09C8A39390235DD4AC8C26CF4059EE744441202821F7E1DA59FC54606FC4EE330CEC4CC4FBC10A524C19890A30632F060E1876DBF073F624302411D4B6CB0959784C16CDDCC052E84C9B41E7367E0C83DE68D0E847EAF2A1E808E07659CCC72A4318F85D5EE3A7F7ABFFC089B495F876B2024B3F44335ED59C412394ADA6C00B9487ADF459E35013E18660DFB3054ABBAE06BFDFB4D4F87D1487EDEAF215A9D6C123A44C1C3E6BECA5055ACFF0EAD6CA21C3604C5318B546AE0B0C7244048F68A8617B8595F158BE1BC868BF275E8A67755EC3D13A308D3A1CBD64FF2EF9B518929916CE8E3C9476DE2E4F60255E11D0148E976E8D16FFD8B15756C69EDF2D45D8AC9A95A8545F89CE20572FB6F9DC9ED92D6EE07CB60C0A5501D50C22724BCF5B2734DD33C8B273EFB8A7410E2B36D41E8D09D086C37AA71FB87FE223D6C697415224219A57E7763C5A872B6536DA74BB2050F81E03C01897267E80ED93B2047065B0B428A7A35733D68024C2539CD3D721CFFBE3AB3C6CEE2CBEEFAAF35A1B1369B4E11F4F3E61D9362EF5BDE97F3F5747DFE0BAC6DA2904A8C7FF59266F49AFDC250BEA5E9D49ED685BFF2793E03921EF90270F5AD5C31A6FC0DF5CB0A4A00E44E39D4C222E0A89922CFFCA125E64FAD0C53046D7F1DD25FCCEC0ABA72BF9707CFADB00A375DA60B891F96BF516CC74573657719BDA6D4CCCB29290C7ADD5F932579C15F0AA42F2462129D686F68E5C0CC5262ED2AD16F1731F631D4EEEB865A05E05D1400EF76656DFF6E2E864DA6AAE5CC62A7057BD48C318A3B4C3BE35EC06112F1747EC4510F7B5064FD8CD29ECD4C70DCAC1CB516C7D73C660DBB2FB1B7679FE4DF8DFD8AFEC1A2CB5238014FC5B2DBCF24FB4B1A193D382365A292C428BF8E30AA4CD9CC5913C423B1E0CD12921A7CBF1D25ABD823196CDBBC7DBAAF77B9C9D5BDB4A0D5A6B1839DCF20E0052DA1EF0D9A92084C5A4DA5E723FADCA0B66F95D88EE1CCD768CA662BB46D8E1029EBFB59CF1AA37B40EC86AFA38B036B37DBE9D06C5C2950A0F9041DF7F13DEF7E23F68CA863A610C56B459913E290785A090FCCBC612E37D195555AF45920D639ABD43199DEA0086D68929A78C6E898BF00058CF4108F28048192DBD577FABEAD2AFC48BA7FC1404F80F080F4BADE6926CEE99C809CEF2C2A5BC09240994007B35EAE35B2F7034F28E17797519AE65971E802C29E954DF7D12B71AA36BB55A82FA70CBF84C07A5193A9A1E5F6CC53E8EA314E37B3A7E3B775B29D768A3EA49C79176B9A3B10B409DD92311DAD6BD1D946F0354EC1F90361957C06A599DEC49F65E7CF4420DAE4E707A9AC4E4532BE0C8EECB762D32D4DD25603CB758ABFEF73631A194FCA012402C9BEEF286436D3DE36A6F3C3D2EC0844878CFAE6AEC66F8E1719E218E93E697EF04D27A57EDEA89817314C644A1E263A5B18FF6EB86F0009A8475569758A0464CA2EA4B9D9FC65C83B81800011A76DAD16B4097BAA66415752D56FC3C81CB970BB9482EFB12EF19E0B9B4AA7858697BF19D6DE2CBF7D878B55CC206CD2A125FE654C830DF3BD3EFAA8D60A8F13A1B217998A853D0E72A7C709309945BE1D0724C1D0E597FFD24D1143D21BF463E262AF7E5FB8B4E8056F35FB5E07A9A871BCD39437107AB7E6D0BD8A7FA9FC73B61C4D12A38379016D757FA5149A49054FAE8D71E2E8D145B74AF77F8D8418E21380BA0121A87BEAC0D4FCB43A1A670214D9E6959AA260A369E0B86CA31B9940D491426BBB2EEA91FE50EAC4E177F8D56997515C680883EC8AC06848CA9EBF09F264C5BEBC94201A8DC86669D81906A2A7D35DC2E6858236D7F96095C7BA27A50963BF6DC7EE330F1889B98B9742C8F58E0ACC6840330CA38A627840728F016BBEB12BE2A482E750A48C51DDE22ED3F9829A2ADD3742A599774E18A3DD98ECC6C11D02C2EB7CE368E64EFC57CB14B5FF31D8D01DB897A17C2467B9843B371470584213C634371C5A3CDFB06812A950E6802603E899E1B5D264814B5F4DA9AEAAFBA48CBD2D046672E4BEB972CE97D4E37C06A7FF1CF763585FE172EF1424889C2B392571C9A82F7B3FB6AA64F898D402731332BB5C62842DB8A7048B133EA265BCFBAB64D47E4B3FF08A268925326D9F744BDD621C9890B1E280228847CEB3C28772C30C36DC2FA637500A25DE0C907852F4DA351048E922E9E008B694B4DD1A771C39D8F8AE6F7B371830FCA0BB1AEF9F0EEEA5E4928C164932F04EAB6E25FB9E0BE1C078F62870FBA871332C2B3BC6C3C2D83576BBC02285AB90ABE6E1AB0B19D6422D945571CACF264B4B26CD0E19B3FAD496D41E9CE0F3B1F8D97509114799768E61744FEB32D96DFCD435C333FB3CA7E3FC893F6F44F10156BE1519878FF8837956588F47A5E916831202A4B6D8B07AF251C89FCC6D05712B8E1542E883D31EBB2BD5B1CF192660155A9DFAEBE90CDBA3F2CB562A79C9345661CAD4CFAEF8D7E6751B225F5FDA89EBDFA39D759963E499BD2E7043B6C7756758109BD0FC04A26F15268F31EF04966759BD0D711C9AA3A2EF7FA6256DB4978045BE9819ED4FD0CFC90EE636AD78ADA989DBB3D3C68E82C99A2807BA8FECE028C1A3334779FCF543260A8A82B89CDC5F72DA9D0BCAC785EBAD25238A0D66524A961FFF7018F813F3059181DA8A95383B3134145F4CA32D993AB2E083454C02CB19491E0093C9C152EF829922DAB69B91F2830C816234D4C055B012C5A48B5A81A09176FEEE79CA49C5E71B6A31041F3E4F17553A433D03816F8C3B86DC51A6FE68CF81DFFE110E4DF9711EA53CDF6FD7189225104C984AB06C26E7F459A0E6B400E665BB06766ECFDF60A780FFA7BA559C725C623722A6CA91397C972579880794EDBAD1CCE0AF407C2CEF20BC038D35968C39CA943B3BA53F0A2AB4E6E58183343176A13753249895F094E2EDD34F2079A4F243DBAA0431B331D9C191ADA50354400C9F3AE841353029DA9FA0A1107ADA00815E10EDC19BBF286B755028A70026A1583085FDBF000440FBBFEA49DD2E080631852077610B023030B417CC881A86F782F59402D04C2442C99A172D04C8D089A34C0409E86CCF4493A6DEA18262745D297B5120445911A3EF00BA80368C45C587B3CD7443E83C23CF8FFBB4CEAEDC353B0EBB1AFCD755DE4CEC71C5CB1F9AC298269FED4A3B7B15BF328F1ED551AA89FA931BA9D93FC6A45EDFC043674BDE9F2526CB3F77B4A4EE9338F9A1306B56A7F3B8F13B372DCD4FEE19A61BA78B04698E02A5145E1B38A9AFC5A64FB56476D20BB5621262EA3B6C9CBA16B43C914D17DD57FF39FFBDFCC2379C337FE33BAD71C39342328AE75C0D0E856B65DD3DA33D1C50F352BC39204BA0B35CE5E208ECE4D8D7E93D6D9298F2434A72B39D96F17DE90CFE158B87B75B49A7CCF95CAE1EE55794B61C29B210598D8B0D5F0DB30DE0197AD1707A3938103B01914E00AC464E24B10FA8192B668CC81DA5090B988A5407FA1BEA16970D1A4BC7624CFEC61857B6E93DFFF452672635D5E68D47D4AEE9B3D52E26E8959ABF220BC25A4F5736BD8EBF7C64B08772F476E3EB4F8C9C1AF7CEDF74A15B3DB312572D4EE69FAC25E834744605D94BA824647F7E5D38E968FAF3A987514D20DD0510F1FE3ECCACBE2575C1B961CCB5BCEEB8FC154F32A1F15B84E6A8FE8F6ADEFB12DD65BD09BAB390F065F6390933969B6EE32BEA57FC8556A67B7340F45B5A7D50FC594CFE31F9051DF9D5B230CB8A8ACF9757224243F6183C922FC7F14A6836F7C1CA3431FB831F78F66C9E40B74F9B3FDF2B9F947FE39EA8E7384CFF73E911609570DE993B67E4E7A9F839FA4F1B590C1A102BF2558DAABCACD813726CE8BBD880785ACC094937F27A6C6321BB5AC9B7B0D1EBFA479EA6C77C5F741AFCEB786D8744A998FD9DAB867B2C0A9B0DBBFD545EB3925713A2DF41A6449C4E1BC97487345F51D52EA9544DA470DB22D9398D94CDE9A67C43AFCFCCCFF7750B5364A2CFB9A47758B855D9E0EEBEB72CB4BC2370C0D0FB66D54D958680D4BF1E94A38E18859AC89357932C472F638A3E98EA5E577C3A7E56E47C4549E3C2E938589289D6FD5DFD33E67F388E2C9875140E1F9ECFC6C1104118E169AFDEEE596B691CC65CF4DDD82AF776FAC42ED9BDAD6F079C26F5D2CD113E3D076F1FD6611F8C9A3A5C37AD73CC955025EF6F63A82574EA63F45EA737072582CF5F3F4BCB39ECD17AEEC173DD51E9A2E2EBFD810F732CC4850D6B8C454A1DEC63293F4DF9C74413592F8E161D4E38CD6B1E943897B898F7F487CBBE5BD59E332083D89F1FE213FA37964EA00847490C2F3C10CAB789CD7292DEE23E2BA79AEB36762FC1CF8DBB7CA33D3AA7EEACCD8F60B365E59B096B899527DA677E53590753551246CD228B49C71FDD1F508A6049F502042A72BE8F22002360BD096B4550834FA3EF256AC4C52D02A3E65309DEBB56A344BD4EA801CF9DCDFA7AA2770095BD5E2E363572A536820702BCABFBCF5BFA22DE9A3ED6FFB41B2FDAD98F9A2A55B887A7ADAFA45E3B724AEDD18747E873391394432F5EF69695793A57DD41548E1A2B0E2B740181E8BF45DB8345364CEF3D6F65379CF37F1F2A22DA6162B5573A8E743CE469AFEB6F0E49BCD4F4D14AAAB90DA0A8451D097D78E5F8936F0FAAAEAFFF2C2016EAEFE61519C7F00BBD7336BEA850F7F14EAFD9A4274F40075AF8EAE3EF97EB5FBE48997EABE5617F0EBB17FBFBC3E32F86275CFD03EC8207450B4B3ED01CB41E642AEC0039DED6A1892DC71DBEDBF41E2DF3A47D98FEFE6BAF9ED91E1385110FD0484D6B761A5400F734A7AF94D4A797642C34F7B986681C9E30ED508B8C542684F93A8FED1F3821DAA33DB9CFE6576A82B7DEE7AB03A2BE636AF2F3FA9361850EB518F181A6F66F45CF7DB0B7C3ABCD7795DCC98A5B46172F7C0C917A11E076F489C6C12B068791F0E26F15C52D84CC50A68FCA90DDCCAEE6828337EECF77EA590734C957112D9EA0BB934F11BF56BE4076FC4CCD7E4B39621216025FC767061DBD47BCEF2777861725BF47EBD99C9A5E560FD1F1EF6C65C0EA56A2A7FFCCC1A3C679452E2295861BAA3BC02F89C857C38E4FBEE0CA6EBA69FB6BE8AC3516CFFE52A4A2CDDD73147DFA3D3F1443CC9D0B28CAE8CF038E6CF25D27496773C1C0C11B07D536DDC3B8A5BC433327E622717CDCE50FCFFE760DBEB4B161D406AB32CB8FD40A6595F8F2BCBF382B7562F874D28688342EB223D770F546F540C88FEA147FEEC55757B0720CB772FA2E2D8FB1AF27AF10F64CFA29F0059E205373071E4A84073CF63B8AB543B7AB0062CC79AC3708D7306A4A56D20E462C10F879E975015E4A2410100DD3D242F3400BFBB71DC936FFE7A99EC1FEB748819862B0A880CD3F33899C22FDF3FD83C708654F524FF18D753C140481E768416CAB7CAED5BC24E21A9D2B7E8C60F6BF802A1378189D7BD60461C54B11B01EA1220154DACB7C3A377D095BCA4B115CEF1E485A329A422301E90EAA2E1576CD1660CE9B37686F92D0E5180863988A8E9C02664C640DB7BC6DFB2822232DA50AC819730C649A348F7535E1A2ECF648C47B4546722E80986A71B00627140660634653BC6095AAB0498C80B68E64A68D35722E60E05E3D202B494CFEC392BA3A8F190B343C02A827B73541E7B690B37D145D3C64386999C92844015215116B8C52046C890E2D0B32855D6F8E5E27D090C0EAFC40E6A209726B99F0FAEA47246ADE868C4642CAB1924ACFC558A80E33427CB7BCDA87AF196263728F2E716F072FC0BC6DC800066E2A7AE6244D2B9A0263DD38152FAD8AB2593B2DB87DFA670B3C86028D9351E3167E9826013845BE975E10A5EA25E2F006571C0018942EF565241E54421F924278D336F05CC2C25E9FDEFFD8A3BD027FD0D60E2B92AA00986D9B4A50C9A00E3469160435FC8AA5C8A3DABCA98B33A62440517F2DFF50ACC5306537AB8BBC418C4402F09F594401423BA0CAA3C7CA547A9B243A5CD5AEBA585B22B299105EA7812B549F07AAFB75F64D653E1ACCFB2E39BAA698FBA1466846E289FE1798A4C49D7BA2233E74C0F877348DC7B0FDD525C867FB3437C59E99934ECA5CA79F284E52D3A5B4C693721F35799CFBACE90BFB00D3DF2C655123ACC40C955B193D17B5F328A83255D533922A758BC5A3FEE200F5DB427C826A82A6E1858AA4EB4E9ED103E5F255710AA96DC91FD25B3AE6FB87ABAF21D5191F9B0D59075F4708B0B83BDD1C628DF24B05DFD27AD33C5100017B8DC059CB8098FCA33ED06234298F221C43D59D88C5C0FA52EEC9C1F15C849C348F7B28208E0AD214B45264B106721EB36B980A02373D822928EA3CF0BD4628400287A4732FE75145708088D37F6922127A5D10AA710FF57C04310C9470A72073F0A2DE7A042CF3BF84A5FF2593FC3BF8BC0A139BB3BC0A9F560227EA4F94A18B83407027D21C6B6E9185E7EA36C7A280504E5CD6BFB8651A67E9652FDB5487998F26419074AADEFF125364370A3292BA00DD1046A1259E5400F93E1CCB4AF40601A60E27051256CA1BBF6402C88C11B046D88B18083B91ACEBF99D29C6A002EAED88EB15822C9A26869FE685512C9561CE60F8AC3531623202E75FF2A6F6C477712DB5E5CF77E26CCD40D1FE8E7ACD60450F2485AD81D82F954D25B4E57718898DE1B94652CB4768CB7840B39315DB326AD1AE584307C8C4D066259B52494F2E8A000FBC6D24BC748C26EEA0646FDD72FEF1B7222E4BC949B81BFA09445575AE4E6C2D60D862DF32DF04B6555A778FB859B37A937344AEE1BB6427C78F4A2923F2BFB3AADBEB9F199EB419C7489C0A983715D6D997FE98BF740E75DFB5AEE682EE98B1D2F78F65AC48DD314271BBEA8388C2E3754B66D527A48C1BE5AE0C892C0A8FC2214F0699926322CD2FEA4EF518E7D765BCA8537D6E6AE074ADA186FB7A65E0BAB862D5D58BD9A55F6F0B1DDA1A472CCE63F6BAAC3471EFE66F72BDCBEFF2F9579ED505E27D80F521A595194AE3F587D9B64C12BFC4ED0037EE9DB1CBB4953417A51D4E4AAA8D336F02BC472BC58EDFF37F58E778F1C00364C26C7EB8DC9EDD25466FB33C1E1624CEDEBEA2983D66E7F8E0D05DB7F4DF31FE7C2DD7275194CFCD56DCBBFD7D4ED8245766EFEF8B78705EEDC3DB8B072F0F1BC9158D096B36A966A428D48F383AA132862FEE4FC16D7B6803F12B325A01992EA4E4DE1FDD34BD3E93F1D42FA595EDE9ED3DDF0EDEEEBEF162BF7DB4B6CBE905EDB6D18223BEA69B4244B4AE8E849ADC526108F1DC61FF7D98B9A87480B4B64EC09FABCCCA78723C56EED4E4BC6AA08D71D6526EA9CD7770B66F0783EC85AF4EC07F399F096A88BC2CD050F86A13B9126F3377FFF1DE3695BC0C5DBA783E6ADFF8439921DCA8F887D8C48EDA7951CF6DD1999BCD161A90DCD28051D7F7F90DF1BA81B1D43BCF47CB4F399BD4AE1DFE7A5F7D9CF6D668965A8DE8BD2FFBABBBC53565ADF8B36FD6B5678572CF24A5996A0EAF8AD58D2E37642D0F44E13E95E72D44759636AC8A5DE925D8FC9EB8F03724C973A3447D738A2E64BFA27CE2F608FB8038FE60E2DB57D2821A55B471717BCBD9987A11AE9777D38DA1BC5558F9C05A98F7D4A6AC84C9CF1F450F8DB23B94CDF6AA24507142BC159A7BFF2D7022F3688C618A805E37872F82B65443BB24DFA6FC6A32E1EEC3882F8929BB52F69C194F13FE2AF9F9819CFD0AE97698B4C7C98E7DADDCD5DFB885458230FB1B27D242B6BC99CD8F84EA0271D3B38256CFEDF1EEA6911BA3C95967546660543F29E4D8BDF667D85DD27AB4B96F2F013C6FA38CAA39404EA5F24D2A567A380FB3D774B9EF9D156D53781870C8572F2DAE913B54E633DB4F549EBA8FF8BBB53619E64C0FA3F38B086860D659596B33E7063EBF3F9123517B5FEEC9C906B8FF1946C8C5ED2889BE9C608B9BD584D71EC49F50C86FDA661774BB225D287DEC6C97F8A321AD72ACA918F25DD1714326202B27E30F124323A9BA3356E7F9CA500F990F826E7F4D9BE43193DC8D2597E67F73323EE2E5C0B855231A1773CDC5A9C070597608CF4B978D33824D0599EA9494EBEB5A3F0C095A0D1AC7067FF82922B31FAABF453EC3F6EB53C10DB78D5E1E52161B0AFE109F14250064D2C24B469FECA74E9B2D6FDCDA4F235E78C507B82777EA9F8E3D7D524561FFEFADCCD974B7FB3F02DF8DB7CEB4034E82373F2817878CA7A9B5AE534395C5EA3286E57B852A9373B05577621EED4ACD924C65951A3D716C77550D353FC87F2D2ECE28CE5E33A17093C4B5B2EF94B7B7AAAACAF88DBFE5A73C2EA8C4F2EF0E695C4134197CD89A17B43C5A40E3BFB86467D70CE9FCD60438D257E8DD187E0BF33E2AA0176B82989A05753C27371840CE8348063D05D123AEE573F83EBD9B8D2D05A4FB12BD912820AD9E94FF7F2085CE8D6229F5F634011AB4208B59F31933EE5FDA7919B41F5D1013494EFA6AF6128E04CC98FF53EC52BD12000E89CAE905C21895A01D09CB8B9D350164E923492BEB782B3511A7EE69247B36F3A4BF391DE6CF1B647258D78356E74139F0149E15BBC2CC6FE84401AF97A567CCC8C42E0049CF228293300C4526760F50760B8B90F536886B0DF9F31818F9BC2E27A24D485C9B1E045AE9BD2CAA90F8044584A918E57D9EB2648E11D061F7A5EA07607F33E79B00781631D36816B36B3ED3BA97F01D5104C15A57C4D2AC8E15962ADA80FC9F899CC9B54E0BCB6F814AE380B77CB28BDCEB18A2CBEBE42BE7447FDF908E8CDA0F5D2AF482B0B62315185B1DD99AE607430736E99B27A43F547DC04E86BF76F8FB98094D6E25062532051E977DDA67FCFA849A6495AE074563A5C9FC5885D9F846C142CA09B73C2DF4B450A058894245FDB3A3D56F4312F686A7B6DBFD8C63596BCFA953FB330606CEEE69BF02A7BD09791088ED61DD2EF57D14B830F83E71EB47DD763004FBFE8B84511BF4841A27B2F1AE43E9C7EBC7E1DDC6BA89BA6263D02479FC17D482D6A800AF369CC22CC8AD703EFFDD53593EC7F2C29CA2F8A663C0632D51C76F7FEE3AEDC5C299520AF8482EBBAE33A7F86EEFC32E1435E4D3C4E422BBDFEDA97E4C872D15F0EAA954189C786196A2FDE59CF99A8D6D6DE1B8756FE98F18F31DE0C5440D6D754DC6889B22F7C6EA975AE8E8CB91CABAA2EA79B5F717CAB6620D731D4445252B02F25E444E08400C13648E38B478169C73F47AD12E22FAE3E80D11CDDCFB4BFD29DE0875998A97BDE3947CDD0077F75FD4C6EB81AFBFB68C0879994B06020A341D60EC0AFECBBA476C4C2DAEF8C2498674BA9A86DBE7E5E2393BF60A9F53E147EE235F65723469BFC81102E5FCFB5FCBD5A5B8EE9DC537779BB540F9D43EE67C99391B4307F846C5D0C9516FE3761D494F3ED34CD6883174001EE5D3F77A1F10858C390DFD4D76A35CC78B25BA1A1D7FD4DB3D0500C26A7A845F480044E74848443266397FFB34A38F02774378BD83775B4B7F4812CF51F2CF914ABEBD0364146FCE245BB4D6084C1B4D6998046F6B2633BA761704FAC103968FB7A8BC9FFF2D34783AE48774E7BEBD285A730A4AF5814B6D7D13EEE29DDEEC0668DB5FEAC47396F9EA4D92BCFCCAD8DEBFD4E0A06747C5550FC074FCF9B694F5E05EF217D35C5AD55B3ECA36EDC36E98BB35FC7DA83F8ECF443E43409DDF2E54891F54CE3115568E78C7B4BE238E07340CD457CAEC2218ABA1E12A87617E62AA07FF9EB5F99961AFAF77E590BBF20B356E175AC4E7860799C13D16E60E0FA239200A4182FFCB18CBA328F9ECFF3DC4EEF0B5562DFD6203D9017CC35B46340C25721AA4656C8EFCCA18DDA3BB326026797D9F1A2A842E68616FD761BF3C6BDAEC852808A39EB9FDCAB22450030BC4FF98649534085CCD4ECC68CD7539E5A434C0776DB6D39AC76B4E2EBE3B45BD8D2E1C6824F7C7F6EC4DD97B9F7CEE54A9BECBE069E416A88D40AD92D30BF26533224E54EDB6943BD979D0DFD877267EC1E782622FCB7D6E9A04553C177E4C5FE72A911F7B9F6E7A5378752C10FBD3A2483F63FD1339A92265AEC3E7A2600C6AA87BF757D8152789CF6D9D0E10B92412D72EEC9E93EE16415C9A978C9C4BDEF5D2BE275893DAF45333915C55CCDC5F83498F7F75EE3DF2383EC56C84F1F24522B1E751C2839FE9FBCE8B63DEBD9381266FDE9E3B32A51822998A11ABDE9F79B3F3E653DF3937BBD7611EB2BA3A82C2D85E814C2F85577DCBB5F77FCD71F33DBF12EA74F9684DE3BE279996B90E405BA5FD0D876974DD874B99A6B7F76DFC64006EFD9971A44910214561E31D3F7572574D9CDEB584B47EF3A15A23A0EF9E7E176FA842ECFB13276C0413AEA0EB7C0ED23BC42493B084330A3DF3069DE821BE373E3E3F4393CAC52EEDAAF65A93539C710C474592B8629C6CC27C02B2B57C2EA9BD9A4D529D70E56B68B942BE9EF4FC708217BC5B9FD8B41B8B958CD17E929B00EBA3ECAD84832C540467DCC009525A5E65D4C301C270745F0A657FA20388E07964F4AF8304120E841EA2DDA78F72428EA97A9C98A36CD00810404CA0D73D7CAF54D11BC079CD5AA3956EFCE8825E6D6B8269AF31988A648C0AFC165309340B381080C7BB72180127B35B7839AD9E070EA4DD07B13AB452E1D8A8155A9BCE336FE6E52504C0B38BE6ACA44BD5A08333E61D364CA5953C0AA44BC0E1CA956BACD4E84C406FC9E20F914CE84101A2C9166C0CDB04E04A15D35E61AE3240728D5E07D98A2B05884A57F4765002A45E2F47926662FF76F7DA4230234981107A08E311749822289845C84A418E8DE179C3E9801BD5C6C1410F0F4922A135B12FF31BD9985DBD5DA0A1D1401AF402B94DD89348FD55E62609C847BDAE884DD1A1F36C1F8D20D0CC3A71B06B78DDC9018A3008E809435D9C78C3EE1E2E8A8837EC5A57A457041E9269C344FC63FFBA5D2297BBD07F18D24C00218478937D4CB152564C9C0E74F74EC46833AA4810DDD1198BCD0B378120EC9552004E9801B90C9998F82105A45B37B58595F2D2422692C486D55C32ADDE704FFC08ED5CC81C4FB14BDB8C9197EB9598D6BF88BC6B53E16AF6A9A570A3E0253363D8E42F73D3469AF5226722F9CB29DAAFBDF74BE5653C65BF9A17637362A3BE7C878ACBC61E63E53CE28320440028F17D496765155C119893CB7588A1CE1CAAB249D65DEAB9B2039CA7668F3E902CC69BA133A91852878BDADE0AA9AFB6CEBC14A0AB747559A1FC6FE6F864C268DB892787A4FCBB7964B67C9E74F3A2F42C57066C26ACBC2C1F64B095BC84BC3D1454E0FF1513A820CC830C126F04C703E16C136E02C8F39C16DB0177A204E0A0C3955A0F4BC5EC32919DB160778012960A3358CE0FA67345B36856B2E080609D24F0DAF92DE2741E7098850D2A8238854B889C050561E42C96C9A9878201A54CDD0440B0F508CB1CB7C92CC7D2F7D1D2C89C3B2111203689355124030E9CA5B4F3BD525FF2C12BFD2BB3B17B8990A2532C644A96008C9B497949CBF91010F870641609212F71161121A479731340BC499A4360D1C85178F008675D0E1EF017CF45EEC232E112005FFE685F462ABC01E6A0D78D5DA243133FD0406EB06B105A29369AC94B9EA00206758465867813A2189076C2C36C70309CAEA74E33684B2A55FDB1DE22E2A886931A4A01E6EC79131910BAAC30C4466869403D1271530170DF06679FFE92A97A23A31251CFA6BC795AA995A5A4DD2E03CD84BD71E00D6A1750B704586BF9065F19860980E4C648D26F13645B3BE04A81508491D0F83594544EAF686CFC0A1D1ADB4F3DBF9C7D6E05B45A07E8879336A4B72B613AA8C25240B1902C322CD52B359C26658DFD891120770FC79A53015814596FE25EBD62398888BECB959A840566849E3D404CB183AB466E3DB6DEFE7CD6AE22624B62AE43833BF5D4C93D573B099B455C425ADFE62EFFACEB750FCBB9B4E797706B726C2BC0A5E7964A6C49D0D58BAB7D99FC333CFA766BD86E3160377989F588755CD90B35E59A73BAFA6575825BA6F839653924B040A669665AE1D6F77A41B9B1348BB45399F86B35834551F416C40BB35DAEEB83270466E5AF783F1A37DF1D035FBE1C268DBB5456E816AED1E86B787F563A53AD506C7D547C92E971B736B8FF38B1FF2D71DDE57468C310E6F2CD166EBBB81BF8A9FD5C876AAF77E48695B71896AAA9D25E2FE3757418F500A20815DACE4B111EB22D7E5DC1401741DE31B5430A68153FCD0445C49B9F7FFDC240DDBD231E6DDAC8767AFBF5F5ECC237338661484380F389F83B838514FFC0C97ED6B3AEFD731A86021D119958577ED997721AFA1AC736D4D30D99874C619F1ABB5FFD38EE2C70324503D61B52D4F62DBE352B542E194F100B6D690B68A91DA1DE6FE26FBC94F050129CFCBC4D5F6E343414E86C2BFCE83761525077F135CD1D869A4E21ED6DE76E1B5CBC105CF6D162074842E7E88A4597CA587E94641133FF975984BBE066020762596921F9704629E08E955FD55DB457087B567BE5885A7BEE61FCA3F265BF2889D4F79A4E26F9430A5939CE2D1917A2D6F6852BAE5F47BD182C6378153B6265CD25F08B067C03D38F4F27BE3F7DC29094FA2E2CE85BC1E0C7BBAE37E19EDC822E22419DA31809B5D6647B4714ED13EB50726A46E81111F894EAC51C7337A2DDB9F209D351C197530153913E06A3FEB9D87A018761B892DAAED4831AC041A996C4CB3D93D51993A7332302810DE8BB5ABAA77CBAF82A5D605BE695392AB26F1E6910ECAA632B6B3E0C1147BCEAAB6F7A1F607E68368CD41F51E253F3787DE499AADF9E2BBB4C48CF9CE417EEBBA5888A1EBD691F18D922DEEE5493A38C264FFBB42AA89D3FEACB3D158F917161B81516AD77F166699A0471070DB63E3791192AD115B5387A47D0F768C9BEDDEE99BE8F4D10AF4A7697A8FF3E03B49C0FA27DB675A47A55FCF01DD5D0D76C518F0F09B1E38E9E6902CED1E6145F397ADA1F7A708F7CF46EC28F909632B46EDFB5CBC785CE122B6BAB1FD0E3B112D06696A985FF559DA9C8C74D5F1C37EA752D5C6D520DB31CB97D9DF37747F2B78A157C79951D71BA1993FA41395D46EB000C560F90F27E9DB2FA348839787F2C8B9CD95673E1D99FB8BED0B00D95B98B479C66CD5F154B3D804A3BF41FB73DF37CBB8B35516537287B70E4CADCABACE24D906AADAA07157D6DBC672BC5CE62A4FFC50292E414C323392373DA769E5FE5EF72CDDDFB28FE4577793D08CF5641F57D8C0893FA78E7B3F1D3B5938B899D8A8B8FCD16BF7A9F58B8306075C8D96AD2E848B3B3D33EE8C59693EAC31444184AEE024B352F2C38879F223A7687B7EB6C627399CA6CE9E78441FDC09BB1C161A2BABB675AE4A0BD928B67F2DF93E7684FA027EF0A8E7A1FFBF0000A8C4667112EB7BEA2BD7A8FBBB92AFD40F8A0E8EC87F5A526C0A132878550ED9E5D8BCC397526DADA428B2C1CFEA8306EEEE08CFD9E53209D303FE8EF7FFA478C6E62803D81FF5157B05E2B3DE3C2AF6DCF9BA7E71B8985C09A7887F2F983AD653F53CE8D26198F67D525A72BD2EECB29960276DD85669B270ACC65E5EB8E3C66A4B477006B4FECD6923B83D0E558EAC8779ED16B9E3086A0BF89ABE9F35CA1A96AC2A0B9E16AC444847FBEBA93461564DA3488DAD733FEE2A547CE876EC6C1D08A44D184C40DFDDF242E363BD3F25F2AF17CFC7514798293723524A047300D6F02A0A858BA41453D5BA41E80BFE6144150902EE504A6B1C1E9270173C02181D97695FFD5D22160478DA6489042D6FD8078DB4E07AF8D6F115D50AC0C2BD2CB06155BC89481C6BB7761FBA9E822341282647202BD55106C9837008383B60434787AF8AB74EE59F3210107214E36189B13B857C18161CB9B247092C3AFC34319956A820154EB2D2512BBD30183402284BDAC8366B17E4A148289D848120C27A44876000C99F05BE86212D07E581B44369C18411305F0A199F9682F12F0CB4BA71D39898AFD8B877CA7EA4EC2F3A2FB996A02C87596C82B252084E815218857231303FEDA42C89156B293F0C2A77DA96C33E8D3496CD4DB7BEB2C61E1C8720CB05934651DC1DA10D0FE11560031EFEDBA0AAFBF9ACF15A2BD9D265CC78AEFFE5EE04521AF89E7CF1A812A17DA171F84D5361C06516829B0D4D8249546CE04DC9FBDD3E4CDE4730F99EA942897BE035F8A732E81D8367273191E39DF7B7F8422A804C0AD7961ADDA52693C67361EC3A51A209B45E89B929CB4055574B12E7195CE2DC95A6394C3C3665814480FD58948ECE24AF40E7320B1ADE194894D9FBD6D5AB9CF92CE5CF8DBAF277956D6F113FE9DBE5410754A9FF4FCE0C7BD8877EF6EDFDF53A3F337C1CD68F5FED2DDDB638A9F03EC3B83CC7EF1EFE581B65DA359F8CD9CACFE64D124E3AADDC67DBA5899A2DF5E5B7F96E6653916747896EE9EA48927D897D14D91C32E4702A2F7938A13BE3DD3B711934AE8A302E521E8E7F4DFDB5D8FDEDC5C78B75436D1205AE020B2EEFAE6434D6D8DC5292D5C890846C461B69417B541600BEC004758DC9F5292582CBB38D77F42646E81E1E7E016C11424F76429386EF4ACEE0E75F09BDA4457D25084048E07500DFA43F4A421E74174EEB45DE1BE68BEC229530662A0902640BC5DD58C6DCE29CFB52B7526D1E184B4ADF970F40C46B8AD2390D4364DEEC13A9C0FC2F08EF61F8E532C46DDA2F54A00220E2040C6017A2C41294E6E3278558E9B7F2A2FB51E5091DA4E4B03454F0104ADB320610CC0562A72CAD811BB20E6039CF0290B734EB511540451EA562660DC007FD71CC96EEF441417D603A8F5EE4C3DA92809DD00B3FF5C47D6BD1540369251FC2FFDA202BC6F255C2A270DA44D48FA72FE3C878E323819918C4A1813509161720A3BD17AC978C8BCF940463C1709A22701BBE26D5011B22E0038708A15AA807053AFCB00BC805E37DB8831838191F9397920C13A9DDE7A1EF1F8C82908CC72951E325953F22D707DDE2AEEE05D122307B103D4C7170FEDE6B28FEE74513697D0115548E86D9E465CD0DFD71C04CE8944630B7B5D036640B1F7810F27B157FC3EC839E76AC68973E77C851A2678DD71D5B89F41FA14FBF8CAC1374780ABF008A2668BD8DFF1847060BC616C79938D19F00707C5305D8A621759FAF9E34C7F95E6FD787CA36471B999A1FA9C8DC3F1274F9E286B4F56AA454F620FDE225A8B5346ABC92E2409A3ACD3BAD9B3AF1FFA28B47FBC794A1AD979340272A66C2EDFCA1367E607A97AB91456D4685BA999B5E50579D43C5F88336AD252727DB0ABF1686081D9D17831CF1E2A6D69D64F8ED696A23136FFA03FB449EAEE50269043D1B4AFD2BC605C6A5170BEE31EE1BE41377C904B236110F74CF2FAF13DE79D86D82724EA3492CAFF2672CB9AF627F04B9FB89624D24375F1A1910983994CC5814ABE1F1107DF3C1F34DFF371E2312C54A5959003408B8B966B8B1B7A5556C4ED8C0BDBE26A06E0BAFB86F8A18F80258C84CC18A1DD83BD2654FCEBE589F3961A425D0E0C64E0CB8DD9EF39358827E6B58B665CF1BB5FCE9FAEBC5BFDBCE79D71A281D71EBEE79A716EF1A35FDC7B2E793CFB7C94AED176F4C4C3D12BEACF4F514F70A1352062EBB65CDBC241A69AF60EF907BC7C8F8F91E367020BB7A4900B726E39BB8BA5D50D2A9F2C5D0C0324A36B8429A399806EA6A5D40D3BB24EEFF1BBB5A12926552F4E9F940B648E5D4C31975C50FFD3A372FC80C499A55629AF5F0A29D0F230CDD98D42E86BBECEAE2EDE0274B14EDBBCBDC4B1AFAA1E3E4F7C1DB647CC1A975426236BF9572CB9D0B576096B9BB1730F8394CE3947DB35722BC94C50140702A8005ABD2988B664F463C39978F0492CF9100DE370F2AD8762FA91AB32639F4B2F7F6B51281D7FA86BC16D3A32B27B728F29334C55D7DD7DFB34E4C5F71923DEBC88FB769FFD7AE7EFA469B8FDA9762349134D3CA6B87EB4153F6CCB34CFAB23C59D4BC7736541FE74F1D6301469CBC460835E8A1E6B321377A168DE92EB5EA5828A0CDC5FE91DBC9B958584DE5F4C7DFCFD6B71E35687D90E102DD16AE7FC7DBA79B8A643DDC1408BD2F9C4211D88F6D32D4774325D0FDA4ACC11B447E3CD6BEC0287587A07F8EEC4ECA5D9A046F65D9F84CE9C66E984EE0025E9119B0D417F6D6FDC3CE836B4E76BB384016CD4D635412C579442D05E69DA774A6F07D8D3F2070DA77CAD8F3F4477F4576F3E7DD64DACA942EE594254BAFFDA81EE4B67EA3ECB2CABE73ACC51DE9360979CAE9FC9E7BB9F069A35E593FFDCC8795470E6C389A2E9973A34D473718093647707D9CE79E478DDC069D121AB3B8ABFC73E66BDFAE51AF487FAE26AC6C2A033FAF3FBE22B87282DE15B5F57B803F5F03CAFF4CE84D556C5F84478791C324F5D8B88565840470610CA8A3D567F5B26CADD7E78997AC8772AB25F9CDD0E38E5773A7866F3472BDAEF632471C517C6755ADABAD650BD14EEEC3A5AEEF629A1DF47952C4996760032321EC8DF11E3193C48EBD24B9DB58A9910CF3C75F25AABCDBCDCA577C70AA56E95D3F9FD2335B1F20BCA871A7600AF16FD9EE3EF89CCC1DBD9FCCE8F0B0172D01008BA35DA78E2CFEEB65EA8797987DF9672E63E97C80F12D426299C2955F9204ABE4FB79EEAF8F1E8930059DA39C9B9B7A3F3B18330F1279A95D5ABA5255621F261B2F629FB5CB9EFD20275255D292A41D1585C6950885FB1FE31E527F2EE2FE3F7B8714B4AE99E89DCFF33F1D6F2DFB24B5EF229EA4BD20FB252A234311272C5ED88696D55D99A3DE13635EF079DCD6493D67787EF5374002EB04D64A722586B70204D2A006B1DE925E2D4C59553915D943F5909482D93BBFB65A8D69809CA01566C2B27814D8FD83D4C11DE016E2A3211537324801EA5CBA9CB2DC3CE74D05BC4D683D8059E5D04F1E2D4D4808772D66493B28839260A006AA5606F624716B9C7868C510C329FFF0EF7A0029A1D3AED70574ECC29343E536F11B32BC74B0964D670E0D6403C08B742E850145E9BDEC515324BE567B06231FC5842A61EB90B56089A254E29D6265525CA83761528134E414A0AA8C140D885D6E63832E5C9C450E66CA61E9E8B484BC3EBC673CA550CDC632A803C8FB94C5F01A5EC5EBD0C1D5A893045931048C3AB525FE8026114F476F6C1B23F63E1677A978F5CF437DA9C39DC96A97E2C4EE4FE7925AD274B4DC57F5FE46E062D96BE9C95ADC9111FD3F89BB4C74D59169F1F2F05ABB4186F569588BC3BF19C5B55371DA6BD3905D568C8BF2EB328784B802AA348DAA01E32ECB2BB5624C75ADECB75D4FFF8A6A962D244B8F19EB03DBA9E8A89B8A15B3615D535195719511A512B4DF96E130134236DFDD3BB1E799D143DF01562E2D2F60AABC7C7AE981C977A4B516A2C3837F427D1C9BC946862170B4C02E96DFA52AF575E05DA58573AEC3AE818714755E676FE730A22B6FC1B8DD748FB899C7E72A237F0B17A0748AE264C6E3BFD185DCC5F3C26A12655AD06D901A2F697B55CF2410C7E6B113DB047A86CE34B86D40D4FA6EE046B78719F5FDE9E9BBE0D7B0292BB16BCA28D9B1AA485CF4F4AA601A3DA1F4B559FC235AEDE3A95D06D6F6C1D3A4ADB1DB5F2E4E4B94339DF660B12DC6FF6FBC805F2159DB52E4F78E45E85EF12F9A635F1617D6DDE4C2033F0B1CFFA90FFE34322B255450D43B6A9D13DFA7637965AAE1C78A0045524898F27BAA0D9E5F683C6212A9FF08F6D8EADB7708F6FD7F5F8FD2A998FB93B78AE907FED54AC0C1EAA42D4D42F88B89D303EB0EFADB6EF6DC8DBF850F13674BBC7399CEF35DE8F1ADBBFF914AADDE7DF0421A589669B33763DD6CFCA035743F198F72EF7FBB9134BD1A5F4F01BF35C287A8C186DBB869D4B76B18D39CD0A2E35683697717C2AEB762A05C3900D5754A44FD0DFDC917E97995D90EB7FEF84AF688A5D42ACB858564E0E7D378CBE8F1170D12DECD8C3B04B57F429BEDFE42FD2D03AC52AA5A525EF5498156ABC3A172578DA369520771EBFBBBC2EF5D02033B9B4F321A4F26A83506AC23BB914F55A43DC90D78F886295D14CAD4C35F151A10FB15DC956B4BE3EA54FDD8EA752B2B23FD4E8AFB414FEB4DA5FBCBA56EB7EC3FC856BBAA5BAF4ACD40E80030A47C4EE7E19B47E13CAFA7DF0D6FC6FDE46C33810FA4DCB0CCD0C9CC227BDDD9F3242140E2DFBF6E46FAA83FD8FC5DE40210DB13C8A2837A12535B51CD3AEA61952D17365F9E55ADBC18F62061626879DDDA583558583326BAAB90658ADDE7B8FD820CDDA0C9B64CF6327339355661969ED880A7EE59090785EC5196A729AC189C7557C2E7C30EE309059FB967D445CB1DD302EF10A7A3EA21544C13897684EF36D2618E75B08A5270C3F0A93A9A6ADAF8C9BA6CAF8BADDEC2CC0741A543E9B9164EC31A5415A85E93FB6516A824CC499DE15418874723EAFFF39BF3A23A17186DC5FBB79C4FBE2D6CBA3AE63FE66631B67B2ADD251B57DAEC06F79C9ACA08ACF37CFE0F7ED3B83BD0488B4E2313A8250C165173EBA60FD9E810EDF03D659C6075FBDBDB1C77CE0CB248DF2B9582171C3EF2BA227A02A0D8E6EBC34527AD176EEC853341C620ACF1E3C9D4B64A020C94C071BA18FECA598A315ECBA8F618AF34F048B0CE7C6B64FE63EB290BC27D1DC22E8B0F52522E1B1E6BA5D998DE5620FDC05FAB6C8E0030F802031FAA2FBE1806B2C276D4ACF23BA051E0B9A2F820DBCBB2F0B560A04BE5649F52BE74A285C0392ACF5323B6976CDDC1828DBF6CFD7D67E392EF40E30C5664FFBC02D3FCCC43C8E2DFB6DAA3963FF11E41ADE75E590CA7BD23D03494E0E29FB4D319ABD2BEB41A7DD328CA44EFEBD8D3D13F93D1D92E771088F5B5CEB1133743AFDC52371FD58F88144EB34BBA8743F83B13D6AE8CFCD48E6C587278C0646642B2DD41122F561826AC0AAF4871AFB1B6FBC6E624E0ADE6DF50BC89C97DF68AE8C7B6F494BEA293ED2BA279EC8F2A00806FCABCED54B30013CBD2FFC166599C3BC9D34D55B6C92298A3DA9441F7B09951F407677F24D71FDCF432BE24C5826D0F94A66864C100CBD71AF5A3A881AC278BA9A5314CE2DF6DB262AA52CD50408EABE75F71D19350B4FC17AC9F8DCEEB69E7DA3D6A1BB6076FC89C7AAEDD0C187C7552D23045BC22CC78E1D0FD3D6611BA120F71E1F8825F41C13DBEBB5F7955574F6CD7B02935FA434078F1F6A99B89AE0C7D801CE221ED1CE22C4323E245E0B79F27799A17D9E9707F09CB296FA102A3E31E7D6DAB831415F348A670760655B7D8A02D167AF76FEA47E590FCD9FED927E4BD150DD87B2327F7AC8782B37F464677C75D25656D840043565EE9CE37BB2FA12E4438791646CFA4A2926A08795E4161DFD570068EDF16354E49E89F95B579B58A1CFF0DF01ECC52FA43D5DAB116B22BEA8D9CD96E0F9F573FBA380B9E427AAD19D8E93E5D0AC10E984E0FCDFC210B9472D38A8F43B1645C96BFEA27E8FF397EB0B1FB8DAB4E56FC9D1276B9E54843600902F82FF7CD553667914686B9354AF54C5837F6E6860DE045144E7A25CED2C15CFA3EC268396970AD8E0D06C1BF4FF8A51E5AF30F35756C0937505CE2F03690154BD114EC1700B1340B19A6C6C614682DC2A45AD14EEEDCB0C77C0282896AAC870D810127195B31643C0B039B9839E28A07ED17C20BEBB09381CD047E56772201812603C6581926CBD1C82CA4BC2434C8E91759A00055E105A02923F0826B07A001EB0CE791ECD25C2E614DDF30D0A600C47F7A5F6C32B007CB8E27FB15B9CEC0FA528016BAB630E80312B3E882AE260980D404B110669A1A8603A4F5E34B68FB2777322FAAF04523A4C7B8222A0C7628137131B4514CD5D4F03C8DD982924487D4D35B1684E89F1691BB2037A0A60B02DFA52DFFCC4C02A6574E0F52FE9C17040B47F98F68E15139E4711215B065980BC777790C516090421B0A255463D82440782DAC597E901FF55BD39368ED15FCE678E5010D60EA4421520F0BA92DC4664B8F4F4DEA2D5C77C45D37CBB2AFC0362DB9D16DDA93932D33F6EEF8EA97F22D7D1F811F7A55336F5E9B8BD0538499D778D53F6EB4BBB282D6253DB9A23F61DC738BD3F5735AE7775E34FF1482D56DFB26DFA608EA140CA5D5EEDD33FF36FDA3C9A31E15A045A32136893283C7781CB00F3B985679014FBAC50C5EEBA75EABCFBC6440D49D577FCF32C4B89CFED48BCFB52677DD8B1B5CE3E70869AF96A659BDB61B2A7FE1514486402882936A750DD4A5EF4AC098068E774B7D844AC09D8B7D0026407920E08FF2B0DCE45550AC2F028D61F3348C343FE70C21ADAB9FE6516EDCD590E63CE9ACFFF2F09E35FB650133C76BD8B6B2D2F91CD299046C821018C372CAA1E270704E4AE964416B42FFA5FEC1E1E327CAF5E4105402DA324CEFF592DC804BC2651EFD8D6A8B75E40C8486A3D5C18E600A037BA909DF037B8FF4AD1332AE112800D59AFBB1D0E64B34968129D67DE7C980A0A6DF6765AFD14679D282C8F960608D7757705989B00923BC00A3BB218C98921BCB5C8FC5F2D73A2470645C0C17AA84B07941D8E8CD643A313BDAD03DF94022A6252CB9C78C534322834FC03B43F4CF6303815B2B78A234974CF5C16656FA90AA2689D137638C3991EC0A289246B8DCEBD1ECA288507D3A17D5480BEBCCE818933EDD078C220C797B7C888DF22B131903109E40C567B05D52084289AB6990165AA1451C3783442FB42E7A2F1C089006320F1FA32A834C9BAFF3612B0E461C2872BA631C8C2A7DE2E859C9598C56003CFDBCF097F6EAA4D7F29594E787547E1FCE66FBECD27D82665CDAB541B95A46369D9E688275A071FECBE983F16C57FF2DD827609F365DE97E4F04437F90BCED95E6C5F3FF5FBCDFCB3F8F0B94F828172E418BEE3C70654E16EAE590129EA4DE6A7DA7CBC219221865705BBAD1CBFDCFE4B974368B7C321859EA8201FBBC522E25BFC55E8F101C3A33E7759C963FDA5DFAF89DCD17D245ED6FE2AB7D447287EBC262D8D305C92FC7FF52A906C138E9870B2DEF0BAFF2AE47156D61895001755BDE91819C02991385197B19CA21670B74C500F4DAE70A07E2227F1B81A9E5691930684C0C9DD43847E4E8A921167B117AA1F899CE5EC2440E812E054B0D7EB820CA7D64BC5456360D7914CB639274CDF81531272890E4AA3E21F5B1B87B08B1C059693F66EC606F58E95C46F460EB0A0D5278012A464969741D9133D8FBDC054011475F29B956C9CC0AE9785D7935A50C0107104B4C6960413F0695849AC6E16650FD541AF8B0B321C4F0485C37C38DB7CCB0A94A64C1C00C3A90FD30A62319099592A46AFA788A3FBF4682408A9054D9A6D8203F87FC6B08F236B3358F2BFB25BC21CB39FCF9CC7C0A23873701603CC9840E98C2C709EFCE1E4419AEA6C9F2E00F1B6920EBC02CF2595F63A2E35063C0BC264D48B816C68B1FDD8BF75CB2F044B6826729561D84111EE25980F50F65391A00244722A8820F3F328F000EC45F34CC2BC192CC2B6EF3EBA78A6D7161AB7E8D49AA3F870D2FDA204A45F3AB4D8C4FFA3A881BFCBBB64879C431E3BC08DB8493EB16BB1851B878A638FC13EC6D36EFAC3F6C5571F7714959F7EAFACC5AF03DBE7A17787705BFDCEDE7E496ABCD6B9EB6C4381200DF7F9C4B2EBEC26B3363B9F50F1AD91A8E7C0E852D33EC74FD6468EF1892E24BA908870C59E3F99DF5B6B127AF7CB067402FDC1DF7CEE2EF486CE3F6D923FA47136E043C0604D59D74A29A33CAB5A8294975294C4999C53C8BCF82E8829FA5FEA23FB7FE58239471E679B8FD7BD11AC30B095218C2A2F249D87512F3B8F012775CABD3E0AC4FC3B9B15CDA9DE922F95CDB60260950A2A608F11A5DE4B80FA228C51CF05FE5E382DA797DCFD1D05105273BE30EAA53965404122A9649046E024ACB3C1ABFF579E9E07C19707CE4EE01628096B053915C0BB41784F03DB5A3FC72B3B82052C2F330A1DAC271277006740959497880374093975FF0A0049E5F40681E713CCB187281013DE7BA04AC84B02AFBECB4466C6E23B9A53AD115B0AC0E33809F3A08E83441DF3B67EE3E08004C45B509EB9641C1262B61D4C9422135747C021260A20215E6053A1FA2319295480E3D504A75718A3F03015E06F8287F2C6FC175F0480B691319C3883D9B59C975ADE84A8E594671EFD57BD48A79DBB9B0AA0A750842D12D08243E64F4506814F036A56BD25ECE5AEABEB440997639757F3685FF2119C0D223C7B4A8F89AFE3B9C21892C4555E2A68CC0B68CB419C6D4E685FFF85EC81FD9D8D01666D2ED429E5E53092319286B70F872C22E660002D68BBB56449CD37DE2DB4F5C713DA91FEDBAA9B6F44BD0516FC06650422ABA865D5BBCD63FA1AC6DC8BC44ACE4F3CB948A9DA9CBD64783E5D433336252CF1ED4DAD46B3737E87DCBA53E9ED8AF7A009C5FE0A9D30720CB62FDFF5EECD31BEB6C9CA7DC7BE62A00AE62D0BB5104ECCEABCB0B1C48CC0E2FDFB372EA7430D9921C75BFF985A7885048D3D611CB5C4E95FE2DB9C2943FB907E79AABCCF67A2918FE571C8598E38818609C9C6FCABF184E114F1698E0FE8BB97CAB16A0A8038DD9397CA031CF346325ED2B99B40F54F87964A820029E70B9D670710406E81A35186FCC5D9BE43D1018D849317417064DCA4A2E80D20E733F5C0B1F8AF689E8539381AE6D847799C045B1E198E7C1563BD418542184411C1778E62E0A4074495C281072B05116185B9DE17E9BCB993968ACB8527BC2FE64340EDC8C811025478396134D19D20B45B63CC9820A6207ABF95488CD7244E55D1303A573C99D8858480570F6F57BC8687CC8317964390001D3AED2A8A93698C25F3AA1B4DF3CF62F8079992AC2D129D7B1E5B7ACC1B071866AB28FC737B1386320150A9D48BFF8B8507C5845109323F1126A72492373837400DEC47E2687804BAA809549D27AF8E50396A99097BEAE014346BDE9FD30B80B3EC9676BBF864260043DD584A243BA8C762F830685312F3BF99AC268083D9788B188E8297D44C0A60D1BE2ED3A30C48C05A27A72E16B73EA864BBBAAE4275C6BA00E426698EC4FED305C10622476B187F5E8582F24FE50DE2349D04274B105814B86D4F51810079F41045DB66373FECCEB107EE0D1A5CA6433B00DF6357D758C1E4DFE459FD33EDBE65D83BC785CAE36C4EC4D2AE4F3DFEA80EF3F9FA01401B71A4CFB5A9A2EB99D3F3D85FEF3293DA77EB90EEAE6B14E914ED5136358A3E949562E070E6F9910D7ABA991FA55872239AA861533170C2B04EEA4B1E33DEF931E0E6B461285D0A873CF9E9B85CFF99290071BFBDF4C2ABD9A7186D15747E5FEC87DE427FA34FE73A807967155FC43F4B59911D74DAECBF62AFFF126091FF158F4582786A80228273B061732A0D6770FE1F64028FBAC5D998E55F75A8396CE5316F9015CA8C81681DCF5951B9D63D9C0ACAAE541A679D8F560FAA4A1136B68F5611C24B115CC246BD4DC45992413B497530DA420233581D54182725C18C2C28C1C9BB3711CF9F120687B89EC31238C3F86F0323AF82F59EE25BC574DE1C6DF8F057F8686F2ADB4A3F241F503E3CCDFEFE3E63DDB153A5B2D6F181B1E2078F6B0BD11B8264B2DDD3DF8FC9376FD24A4A7D83C5DA78C59D0FFA34D5F81B6D1AE200B2B1BE444C514DA685C79D6D7303D7C4F496F6F851F1196267D015BF0F2F864C44FD62B0BB723B5E945CAAEF59B98FAAFD7AB3A9F2BDFB6047CB240FB97865244141D5AFF4D8FD76DF07650534F78C2FB5003F3E7F4E1C12104D75317CDF8932907E9533102E9BAEF5BCC25D709C3239C85B79983422F8FBDF962597217F32272B1F863E5B38DEFE74E07AAFEF67FC4B27C9F0BB8D63CB6C07DDD4978BFB732F3FDD03853F2F7C201EA2210C13978CCEC2F37C71A75EDDFC18EE96AE99D05D7331D75AA934E8F28BDB5223FB1ED0B83D3062DBFB6C7EDDDB7FAFFFD5D38143E1EE952E2E54AEBB7274F9134703AF361917DA0F4C9F8757DFFCBDF8CD5421E394A1FABD500BCFFE502F88DF3CA1AAA2AEB222E5DCFB172764B384EEC658482EB3139B4BF4BBB07BDAE517E5ADE2F5B405827A785FCCD7557D5E3E2C9022EB755A07FF7E442E3E2B88952CE175CD264C32D031D6D757245DB27B7FC3E58C4B40743F90FB96721CFE24AFEE7259BC4649A1CC165FC9D3DD43BFBAAF18B491DD5E464367E34CBEF50A8AB6CDE32F3405E44D657E5AEDE763596C4C8DD034EEF28E56A48BEB87183A1CAFF5215D3B70C4844B8CC5F715172F999D5F455E4AB1523B71604E517EF349CAF5987BAF913F8EF0747C6388CFC483040B7AF8DB44EAFB137D860327AE9FA9533A54D896E488F83046F31AF09D6DFB3C5FF1B0794FE5F392729B0A2577ED9F945139B4899140EDD54E5B5127BEFBF6EF6D5ACB6CBEAD208E6C67331D1D3E06C8DD7B95F36B07C8B7D0E6AE596E10830EC21B9EBD6870386AC3BFC4CFC71D3B295724B9D4B55C54F2486DEB91D5AF7B970A3DF4BE482B1B36B658DAD9DC5CDED0593EB8EBEE43B3FC07CE0F9C6F29C7B900AB2D7E691F95AEBF63FC49F1C1CB5DBDA278E9EDC22D016DA96F5E9057AABE092D5F9B3E1DBEB8031CDD6CACFDDD7EB4E7DD15A98D078C3B3661FE79C50AE9E913B15E5213FBA79387E48B42AB7E9C38F02D7E2C6B6CA5889E12BE49280AB77564340A1AE033F6CAF2BD3B7A7642AC4D7F1B0E29BA690F6528CB093E516A95EB47555A589647C06A45420FDB3397EC64A59A6EA1D3DC17B7F7059341ED4C7BC099E57402862F42581DA44448881E9136414523214AA0F21FC5F0EA6E747FF96791664C454093C0CC4791F1903EDA75BA844105F8FBC452694EBC21865391DA2BC07CE6BFCD1720468C6787625914C1EE5E69323A416614B406E24D70486C261212D145DAF2421753EA6BF22547A910717136D6327506C3EB8581FECE67FFE9EE22838445C0A0A26E856D3EA843870E2712327509AD7468159253399A608ABDE0C0790EE931D0AC784548E09CF05C54B23066AD403826273639D70118A9BC71B67F3E51E66F7D504F340152916516A81169A25A32F76A7C07687D1F3EC96385E93F7C7C6BEC32CCB839E81CBADDAEA9287DB3123FAADD5979443E5F53AE65595FE2668198D01ED399F8DF66A8BB41D53E62E7682F85856433D2E756633EDCC85D8DCE7B129EFC52D1FDC9EC782612FA68E19147DDCB4EC054BBA53ED8B3D4E58F7DB59373EE310F7840D65AE9F4809E38672F25AF2377FEE31CFF57991B9917BD0CB2084EC8AA007299C30791E876000EDA1B90EFE6734A0F1DC3E16C417A81286A4214010C7431C018A6EC4FE1EC8A05F2B85E90F8999218CF56E9DC2832014B9FC7F00680CA7BFBD85BCAFED44AC93086D826092262AD4496AAB855FA7F95BC41E5CEA806352E08D372FBEE55CACE833C7754DAC1B3527F323EF3E23C4608CD73A2544FB2C7E69A04E69843C9EAC3A712737A77F2D29ACB936A71491AA6A769E4CC726C61257096D66EB7349B6AB97640E0A69CA740DE71F4498A9AE6D04A91278B307F7E6E60F577FB7863BAEF104FD27A92D1E4F0D3B53C8AD23776E89A83578F85C5BE17913F6EF85D0FFA28F9DB46BE67FEB2EB9B38D4CB146394CA6BA51E81A961866424965C4EF38AE8E28950D6F46EB6572DF39BBC98A8112A8D5C06001EDBC49354F14B1BE8AD65AD17EA9E955888CE1825201DF6A58FCEA826034F225CEE9DFCCCC8B4B057B970EDD86EDBEA847C9718752A75CD9C3A7D4E91363D313CC7F3A51AD9507B4C5FCB94AFEDC9161BB34217E83EF7BEEA7963E06FE707FDEE2C4BD349C42D49400F723AE"
// });

// const requestOptions = {
//   method: "POST",
//   headers: myHeaders,
//   body: raw,
//   redirect: "follow"
// };

// fetch("http://localhost:8081/adminmeal/download", requestOptions)
//   .then((response) => response.text())
//   .then((result) => console.log(result))
//   .catch((error) => console.error(error));

//     // Create a downloadable link
//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement("a");
//     link.href = url;

//     // Optional: You can set a custom filename
//     link.setAttribute("download", `${empId}_AppraisalForm.xlsx`);
//     document.body.appendChild(link);
//     link.click();

//     // Cleanup
//     link.remove();
//     window.URL.revokeObjectURL(url);

//     return response.status;
//   } catch (error) {
//     console.error("Excel download failed:", error);
//   }


// }
