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
import {getTravelDetailsFromTravelId2} from '../TravelDesk/TravelDeskAPI'

const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;
export const getDraftData = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      `${host}claims/tour-claims/drafts`,
      requestOptions
    );
    if(!response.ok)
    {
      let message=await response.text()
      return{
        status:false,
        message:message,
        data:[]
      }
    }else{
    let data=await response.json()
      return{
        status:true,
        message:'Draft data loaded',
        data:data
      }
    }
    
   
  } catch (error) {
   return{
        status:false,
        message:error?.message,
        data:[]
      }
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
  const myHeaders = new Headers();
  myHeaders.append("Authorization", token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  let response = await fetch(
    `${host}traveldesk/travels`,
    requestOptions
  );
  let data = response.json();
  return data;
};

export const getTourClaimList = async () => {
  let traveldetails = await getTravelsDetails();

  const myHeaders = new Headers();
  //myHeaders.append("A", "");
  myHeaders.append("Authorization", token); // Truncated for clarity

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(
    `${host}claims/tour-claims`,
    requestOptions
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Group by travel_id
  const groupedMap = {};

  let formattedResult = [];

  traveldetails.forEach((item) => {
    const matchingClaims = data.filter(
      (claim) => claim.travel_id === item.travelId
    );
    formattedResult.push({
      fromDate: item.fromDate,
      tentativeToDate: item.tentativeToDate,
      actualToDate: item.actualToDate,
      travel_id: item.requisionId,
      destination: item.city,
      purpose: item.purpose,
      project: item.projectName,
      type: item.typeOfTravel,
      expandabledata: matchingClaims,
    });
  });

  // data.forEach(item => {
  //     const reqId = item.travel_id;
  //     if (!groupedMap[reqId]) {
  //         groupedMap[reqId] = {
  //             travel_id: reqId,
  //             destination: item.destination,
  //             purpose: item.purpose,
  //             project: item.project,
  //             type: item.type,
  //             name: item.name,
  //             emp_id: item.emp_id,
  //             designation: item.designation,
  //             expandabledata: []
  //         };
  //     }

  //     // Push this claim into expandabledata array
  //     groupedMap[reqId].expandabledata.push(item);
  // });

  // const formattedResult = Object.values(groupedMap);
  // console.log("Formatted Result:", formattedResult);

  return formattedResult;
};

export const getTravelDropDown = async () => {
  try{
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



if(!response.ok)
{
  let message=await response.text();
  return {
    status:false,
    message:message,
    data:[]
  }
}
let travelDropDownData=await response.json()
travelDropDownData["In-Station Local Conveyance"] =
        "Long-Term-Local-Conveyance";

        const formattedOptions = Object.entries(travelDropDownData).map(
          ([label, value]) => ({
            label,
            value,
          })
        );


return{
  status:true,
  message:"travels mode",
  data:formattedOptions
}
  }catch(error)
  {
    return{
      status:false,
      message:error?.message,
      data:[]
    }
  }

};

export const getTravelDropDown2 = async () => {
  try{
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



if(!response.ok)
{
  let message=await response.text();
  return {
    status:false,
    message:message,
    data:[]
  }
}
let travelDropDownData=await response.json()
travelDropDownData["New Travel"] =
        null;

        const formattedOptions = Object.entries(travelDropDownData).map(
          ([label, value]) => ({
            label,
            value,
          })
        );


return{
  status:true,
  message:"travels mode",
  data:formattedOptions
}
  }catch(error)
  {
    return{
      status:false,
      message:error?.message,
      data:[]
    }
  }

};



export const getTravelMode = async (travel_id) => {
  try{
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



if(!response.ok)
{
  let message=await response.text();
  return {
    status:false,
    message:message,
    data:[]
  }
}

let data=await response.json()
return{
  status:true,
  message:"travels mode",
  data:data.city+' - '+data.fromDate+' - '+data.projectName
}
  }catch(error)
  {
    return{
      status:false,
      message:error?.message,
      data:[]
    }
  }

};


export const getTourClaimFormDetails = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  let response = await fetch(
    `${host}traveldesk/travels/${id}`,
    requestOptions
  );
  //   .then((response) => response.text())
  //   .then((result) => console.log(result))
  //   .catch((error) => console.error(error));

  if(!response.ok)
  {
    return []
  }

  let data = response.json();
  return data;
};

export const getAdvance = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  let response = await fetch(
    `${host}traveldesk/unsettled-advance`,
    requestOptions
  );
  let data = response.json();
  return data;
};

export const uploadSupportingDocuments = async (file, claim_id) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const formData = new FormData();
    formData.append("file", file);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formData,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/tour-claims/doc/${claim_id}`,
      requestOptions
    );
    // let data=response.json();
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteDraftList = async (claim_id, status) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,

      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/tour-claims/${claim_id}/${status}`,
      requestOptions
    );
   if(!response.ok)
   {
    let message=await response.text();
    return{
      status:false,
      message:message,
      data:[]
    }
   } 
    let draftData = await getDraftData();
      return{
      status:draftData.status,
      message:'One Draft claim deleted',
      data:draftData.data
   
      } 
  } catch (error) {
     return{
      status:false,
      message:error?.message,
      data:[]
    }
  }
};

export const applyClaim = async (claim_id, status) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(
      `${host}claims/tour-claims/${claim_id}/${status}`,
      requestOptions
    );

    if (!response.ok) {
    
      const message = await response.text(); 
      return{
        status:false,
        message:message,
        data:[]
      }
     
    }
    const draftData = await getDraftData();

    return draftData;
  } catch (error) {
  return{
    status:false,
    message:error?.message,
    data:[]
  }
  }
};

export const downloadTourClaimSupportingDocument = async (claim_id) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(
      `${host}claims/tour-claims/doc/${claim_id}`,
      requestOptions
    );

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

export const downloadOtherClaimSupportingDocument = async (claim_id) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(
      `${host}claims/other-claims/doc/${claim_id}`,
      requestOptions
    );

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
    return{
      status:true,
      message:'downloaded',
      data:[]
    }
  } catch (error) {
    return{
      status:false,
      message:error?.message,
      data:[]
    }
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
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    if (!claim_id) {
      var response = await fetch(
        `${host}claims/tour-claims/excel`,
        {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        }
      );
    } else {
      var response = await fetch(
        `${host}claims/tour-claims/excel/${claim_id}`,
        {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Internal Server Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
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
    console.error("Error in downloadTourClaimSupportingDocument:", error);
    throw error;
  }
};



export const getTourClaimTableDraftData = async (claim_id) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(
      `${host}claims/tour-claims/${claim_id}`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    //console.log("tabledata",data)
    return data;
    // const travelDropDownData = await getTravelDropDown();
    // const key = Object.keys(travelDropDownData).find(key => travelDropDownData[key] === data.travel_id);
  } catch (error) {
    // console.error("Error in downloadTourClaimSupportingDocument:", error);
    throw error;
  }
};

export const getlatestclaimtodate = async (travel_id) => {
  const result = [];

  const tourClaimList = await getTourClaimList(); 
  const filteredClaims = tourClaimList.filter(
    (row) => row.travel_id === travel_id
  );

  let latestToDate = null;
  if(filteredClaims.length>0)
  {
    filteredClaims[0].expandabledata.forEach((claim) => {
    const claimToDate = claim.to_date;
    if (claim.status !== "Rejected") {
      if (!latestToDate || claimToDate > latestToDate) {
        latestToDate = claimToDate;
      }
    }
  });
  }
 

  //const data = await getTourClaimFormDetails(travel_id);
 let response=await getTravelDetailsFromTravelId2(travel_id)
 let data=response.data
  result.push({
    travelfromdate: data.fromDate,
    claimformdate: latestToDate?latestToDate:data.fromDate,
    claimtodate: data.tentativeToDate>new Date()?data.tentativeToDate:new Date(),
  });

  return result;
};

export const savetodraft = async (tourclaimformData, tourClaimTableData) => {
  try {
    console.log('tourclaimformData', tourclaimformData)
    console.log('tourClaimTableData', tourClaimTableData)
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
        remarks: row["Remarks"]|| "",
      });
    });

  const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token); // make sure `token` is in scope

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

    const raw = JSON.stringify(payload);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

   let response= await fetch(`${host}claims/tour-claims`, requestOptions);
   if(!response.ok)
   {
    let message=await response.text()
    return{
      status:false,
      message:message,
      data:[]
    }
   }
    
    const draftData = await getDraftData();

   return {
    status:true,
    message:'Saved to draft',
    data:draftData.data
   }
  } catch (error) {
   return{
    status:false,
    message:error?.message,
    data:[]
   }
  }
};

export const updateDraftdata = async (
  tourclaimformData,
  tourClaimTableData,
  claim_id
) => {
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

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token); // make sure `token` is in scope

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

    const raw = JSON.stringify(payload);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

   let response= await fetch(
      `${host}claims/tour-claims/${claim_id}`,
      requestOptions
    );
    // const data = await response.json();
    if(!response.ok)
    {
      let message=response.text();
      return{
        status:false,
        message:message,
        data:[]
      }
    }

  
    const draftData = await getDraftData();

    return draftData;
  } catch (error) {
    return {
      status:false,
      message:error?.message,
      data:[]
    }
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
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token); // ensure token is defined

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", claimType);
    formData.append("amount", claimAmount);
    formData.append("reason", claimDetails);

    const requestOptions = {
      method: "POST",
      headers: myHeaders, // DO NOT set Content-Type manually with FormData
      body: formData,
      redirect: "follow",
    };

    const response = await fetch(
      `${host}claims/other-claims`,
      requestOptions
    );

    const message = await response.text();

    if (!response.ok) {
      throw new Error(message || "Failed to submit claim");
    }

    return {
      status: true,
      message: message,
      data: {},
    };
  } catch (error) {
    console.error("Error applying other claim:", error);
    throw error;
  }
};

export const getOtherClaims = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    let response = await fetch(
      `${host}claims/other-claims`,
      requestOptions
    );
    const data = response.json();
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getLoanDetails = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(
      `${host}claims/loan-claims`,
      requestOptions
    );
    const data = await response.json();
    return {
      status: true,
      message: [],
      data: data,
    };
  } catch (error) {
    console.log(error);
  }
};

export const applyLoan = async (formData) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token);
    const raw = JSON.stringify({
      amount: formData.loanAmount,
      reason: formData.purpose,
      emi: formData.loanTenure,
      requirementDate: formateDate(formData.requirementDate),
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/loan-claims`,
      requestOptions
    );

    if (!response.ok) {
      const message = await response.text();
      return {
        status: false,
        message: message || "NOt able to apply!",
        data: [],
      };
    }
    let data = await response.json();
    return {
      status: true,
      message: "Applied successfully.",
      data: data,
    };
  } catch (error) {
    console.log(error);
  }
};

//Admin part

export const getApprovedTourClaims = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let ApprovedResponse = await fetch(
      `${host}claims/tour-claims-by-status/Approved`,
      requestOptions
    );
    if (!ApprovedResponse.ok) {
      const message = await ApprovedResponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }

    let ApprovedData = await ApprovedResponse.json();

    let ReviewedResponse = await fetch(
      `${host}claims/tour-claims-by-status/Reviewed`,
      requestOptions
    );
    if (!ReviewedResponse.ok) {
      const message = await ReviewedResponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
    let ReviewedData = await ReviewedResponse.json();

    let CancelledResponse = await fetch(
      `${host}claims/tour-claims-by-status/Cancelled`,
      requestOptions
    );
    if (!CancelledResponse.ok) {
      const message = await ReviewedResponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
    let CancelledData = await CancelledResponse.json();
    let finaldata = [...ReviewedData, ...CancelledData, ...ApprovedData];

    return {
      status: true,
      message: "Approved TourClaim Details.",
      data: finaldata,
    };
  } catch (error) {
    console.log(error);
  }
};

export const getAppliedTourClaims = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let appliedresponse = await fetch(
      `${host}claims/tour-claims-by-status/applied`,
      requestOptions
    );
    if (!appliedresponse.ok) {
      const message = await appliedresponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }

    let reviewingresponse = await fetch(
      `${host}claims/tour-claims-by-status/reviewing`,
      requestOptions
    );

    if (!reviewingresponse.ok) {
      const message = await reviewingresponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
    let applieddata = await appliedresponse.json();
    let reviewingdata = await reviewingresponse.json();

    let finaldata = [...reviewingdata, ...applieddata];

    return {
      status: true,
      message: "applied TourClaim Details.",
      data: finaldata,
    };
  } catch (error) {
    console.log(error);
  }
};

export const CheckForAnyTourClaimsInStatusReviewing = async (
  userId,
  claim_id
) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    // Step 1: Check if any claim is under review
    const getResponse = await fetch(
      `${host}claims/tour-claims-user-and-status/reviewing/${userId}`,
      requestOptions
    );

    if (!getResponse.ok) {
      const message = await getResponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }

    const reviewClaims = await getResponse.json();

    if (reviewClaims.length > 0) {
      return {
        status: false,
        message: "Previous claim is under review",
        data: reviewClaims,
      };
    }

    // Step 2: Update status to Reviewing
    const putResponse = await fetch(
      `${host}claims/tour-claims/${claim_id}/Reviewing`,
      {
        method: "PUT",
        redirect: "follow",
        headers: myHeaders,
      }
    );

    if (!putResponse.ok) {
      const message = await putResponse.text();
      return {
        status: false,
        message: message || "Failed to update claim status",
        data: [],
      };
    }

    let allData = await getAppliedTourClaims();

    return {
      status: true,
      message: "Now claim is ready to be sent for approval",
      data: allData.data,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message || "Server error",
      data: [],
    };
  }
};

export const tourClaimSendForApproval = async (
  claim_id,
  reason,
  settlement_amount
) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,

      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/tour-claims/review/${claim_id}/Reviewed?reason=${reason}&settlement_amount=${settlement_amount}`,
      requestOptions
    );
    if (!response.ok) {
      const message = await response.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
    let getAappliedAndReviewData = await getAppliedTourClaims();
    //let data = response.json();
    return {
      status: true,
      message: "sent for approval",
      data: getAappliedAndReviewData.data,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message || "Server error",
      data: [],
    };
  }
};

export const getReviewedTourClaims = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let reviewedresponse = await fetch(
      `${host}claims/tour-claims-by-status/Reviewed`,
      requestOptions
    );
    if (!reviewedresponse.ok) {
      const message = await reviewedresponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
    let revieweddata = await reviewedresponse.json();
    return {
      status: true,
      message: "applied TourClaim Details.",
      data: revieweddata,
    };
  } catch (error) {
    console.log(error);
  }
};

export const getApprovedHRTourClaims = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let approvedresponse = await fetch(
      `${host}claims/tour-claims-by-status/Approved`,
      requestOptions
    );
    if (!approvedresponse.ok) {
      const message = await approvedresponse.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
    let approveddata = await approvedresponse.json();
    return {
      status: true,
      message: "approved TourClaim Details.",
      data: approveddata,
    };
  } catch (error) {
    console.log(error);
  }
};

export const ApprovedTourClaim = async (claim_id, reason) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,

      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/tour-claims/approval/${claim_id}/approved?reason=${reason}`,
      requestOptions
    );
    if (!response.ok) {
      const message = await response.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
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
    return {
      status: false,
      message: error?.message || "Server error",
      data: [],
    };
  }
};

export const RejectTourClaim = async (claim_id, reason) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,

      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/tour-claims/approval/${claim_id}/rejected?reason=${reason}`,
      requestOptions
    );
    if (!response.ok) {
      const message = await response.text();
      return {
        status: false,
        message: message || "Internal server error!",
        data: [],
      };
    }
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
    return {
      status: false,
      message: error?.message || "Server error",
      data: [],
    };
  }
};

export const getloanclaimsapplied = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/loan-claims-by-status/applied`,
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
    let data = await response.json();
    return {
      status: true,
      message: "loan details",
      data: data,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const getloanclaimsapproveandreject = async () => {
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

    let rejectedresponse = await fetch(
      `${host}claims/loan-claims-by-status/rejected`,
      requestOptions
    );

    if (!rejectedresponse.ok) {
      message = await rejectedresponse.text();
      if (message != "User Claim Not Found")
        return {
          status: false,
          message: message,
          data: [],
        };
    } else {
      rejecteddata = await rejectedresponse.json();
    }

    let approvedresponse = await fetch(
      `${host}claims/loan-claims-by-status/Approved`,
      requestOptions
    );

    if (!approvedresponse.ok) {
      message = await approvedresponse.text();
      if (message != "User Claim Not Found")
        return {
          status: false,
          message: message,
          data: [],
        };
    } else {
      approveddata = await approvedresponse.json();
    }

    let finaldata = [...approveddata, ...rejecteddata];

    return {
      status: true,
      message: "approved and rejected loan claims data",
      data: finaldata,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const rejectLoanClaim = async (claim_id, remarks) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/loan-claims/${claim_id}/rejected?reason=${remarks}`,
      requestOptions
    );

    if (!response.ok) {
      let message = response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    } else {
      let response = await getloanclaimsapplied();
      return {
        status: true,
        message: "Loan Claim Rejected",
        data:response.data,
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



export const approveLoanClaim = async (claim_id, remarks) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/loan-claims/${claim_id}/Approved?reason=${remarks}`,
      requestOptions
    );

    if (!response.ok) {
      let message = response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    } else {
      let response = await getloanclaimsapplied();
      return {
        status: true,
        message: "Loan Claim Approved",
        data:response.data,
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

export const approveMiscellanousClaim = async (claim_id, remarks) => {
  try {
    
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/other-claims/${claim_id}/Approved?reason=${remarks}`,
      requestOptions
    );

    if (!response.ok) {
      let message = response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    } else {
      let response =await getAppliedMiscellanousClaimAccount();
      if(!response.status)
      {
         return {
        status: false,
        message: response.message,
        data:[],
      };
      }
      return {
        status: true,
        message: "Miscellanous Claim Approved",
        data:response.data,
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

export const rejectMiscellanousClaim = async (claim_id, remarks) => {
  try {
    console.log(claim_id,remarks)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}claims/other-claims/${claim_id}/Rejected?reason=${remarks}`,
      requestOptions
    );

    if (!response.ok) {
      let message = response.text();
      return {
        status: false,
        message: message,
        data: [],
      };
    } else {
      let response = await getAppliedMiscellanousClaimAccount();
      if(!response.status)
      {
         return {
        status: false,
        message:response.message,
        data:[],
      };
      }
      return {
        status: true,
        message: "Miscellanous Claim Rejected",
        data:response.data,
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


export const getAppliedMiscellanousClaimAccount=async()=>{
  try{
     const myHeaders = new Headers();
myHeaders.append("Authorization", token);

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

let response=await fetch(`${host}claims/other-claims-by-status/Applied`, requestOptions)
if(!response.ok)
{
  let message=await response.text();
  return{
    status:false,
    message:message,
    data:[]
  }
}else{
  let data=await response.json();
   return{
    status:true,
    message:'applied miscellanous claim loaded',
    data:data
  }
}
  }catch(error)
  {
    return{
    status:false,
    message:error?.message,
    data:[]
  }
  }
}

export const getApprovedAndRejectMiscellanousClaim=async()=>{
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

    let rejectedresponse = await fetch(
      `${host}claims/other-claims-by-status/rejected`,
      requestOptions
    );

    if (!rejectedresponse.ok) {
      message = await rejectedresponse.text();
      if (message != "User Claim Not Found")
        return {
          status: false,
          message: message,
          data: [],
        };
    } else {
      rejecteddata = await rejectedresponse.json();
    }

    let approvedresponse = await fetch(
      `${host}claims/other-claims-by-status/Approved`,
      requestOptions
    );

    if (!approvedresponse.ok) {
      message = await approvedresponse.text();
      if (message != "User Claim Not Found")
        return {
          status: false,
          message: message,
          data: [],
        };
    } else {
      approveddata = await approvedresponse.json();
    }

    let finaldata = [...approveddata, ...rejecteddata];

    return {
      status: true,
      message: "approved and rejected miscellanous claims data",
      data: finaldata,
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
}