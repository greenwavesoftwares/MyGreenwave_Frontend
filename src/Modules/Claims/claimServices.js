// tourClaimService.js
const token =
  "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraXNvbG95LnJveUBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NDY0MjE5NTMsImV4cCI6MTc0NjQ1Nzk1M30.fnrtqVkATWHkDUv2D3OceBfrO6iG94T6WfPhZKhXyiA";

import { parse } from "date-fns";
import * as XLSX from "xlsx";
import { getUserData } from "../Login/Encrypt";
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
      "http://localhost:8081/claims/tour-claims/drafts",
      requestOptions
    );
    const data = await response.json(); // ✅ directly parse
    return data;
  } catch (error) {
    console.error("Error fetching draft data:", error);
    throw error;
    // return []; // ✅ always return an array
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

  return fetch("http://localhost:8081/claims/tour-claims", requestOptions)
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

  // If it's a string (like "12/04/2024" or "2024-04-12")
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
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
    "http://localhost:8081/traveldesk/travels",
    requestOptions
  );
  let data = response.json();
  return data;
};

export const getTourClaimList = async () => {
  let traveldetails = await getTravelsDetails();

  const myHeaders = new Headers();
  myHeaders.append("A", "");
  myHeaders.append("Authorization", token); // Truncated for clarity

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(
    "http://localhost:8081/claims/tour-claims",
    requestOptions
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Group by requisition_id
  const groupedMap = {};

  let formattedResult = [];

  traveldetails.forEach((item) => {
    const matchingClaims = data.filter(
      (claim) => claim.requisition_id === item.requisionId
    );
    formattedResult.push({
      fromDate: item.fromDate,
      tentativeToDate: item.tentativeToDate,
      actualToDate: item.actualToDate,
      requisition_id: item.requisionId,
      destination: item.city,
      purpose: item.purpose,
      project: item.projectName,
      type: item.typeOfTravel,
      expandabledata: matchingClaims,
    });
  });

  // data.forEach(item => {
  //     const reqId = item.requisition_id;
  //     if (!groupedMap[reqId]) {
  //         groupedMap[reqId] = {
  //             requisition_id: reqId,
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
  const myHeaders = new Headers();
  myHeaders.append("Authorization", token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  let response = await fetch(
    "http://localhost:8081/traveldesk/ongoing-travels",
    requestOptions
  );

  let data = response.json();

  // data.push({ "In-Station Local Conveyance": "Long-Term-Local-Conveyance" });

  return data;
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
    `http://localhost:8081/traveldesk/travels/${id}`,
    requestOptions
  );
  //   .then((response) => response.text())
  //   .then((result) => console.log(result))
  //   .catch((error) => console.error(error));

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
    "http://localhost:8081/traveldesk/unsettled-advance",
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
      `http://localhost:8081/claims/tour-claims/doc/${claim_id}`,
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
      `http://localhost:8081/claims/tour-claims/${claim_id}/${status}`,
      requestOptions
    );
    // let data=response.json();
    let data = getDraftData();
    console.log(claim_id, status);
    return data;
  } catch (error) {
    console.log(error);
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
      `http://localhost:8081/claims/tour-claims/${claim_id}/${status}`,
      requestOptions
    );

    if (!response.ok) {
      // This handles HTTP errors like 4xx or 5xx
      const errorText = await response.text(); // Or use response.json() if your API returns JSON errors
      throw new Error(`Internal Server Error ${response.status}`);
    }

    // Assuming you're using mocked or local draft data instead of actual response
    const data = getDraftData();
    console.log(claim_id, status);
    return data;
  } catch (error) {
    // Re-throw the error so the caller function can catch it
    console.error("Error in applyClaim:", error);
    throw error;
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
      `http://localhost:8081/claims/tour-claims/doc/${claim_id}`,
      requestOptions
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Internal Server Error ${response.status}: ${errorText}`);
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
      type: fileType || 'application/octet-stream',
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
    console.error("Error in downloadTourClaimSupportingDocument:", error);
    throw error;
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

    if(!claim_id)
    {
      var response= await fetch(
        `http://localhost:8081/claims/tour-claims/excel`,
        {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        }
      );
    }else
    {
      var response = await fetch(
        `http://localhost:8081/claims/tour-claims/excel/${claim_id}`,
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
      `http://localhost:8081/claims/tour-claims/${claim_id}`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    //console.log("tabledata",data)
    return data;
    // const travelDropDownData = await getTravelDropDown();
    // const key = Object.keys(travelDropDownData).find(key => travelDropDownData[key] === data.requisition_id);
  } catch (error) {
    // console.error("Error in downloadTourClaimSupportingDocument:", error);
    throw error;
  }
};

export const getlatestclaimtodate = async (requisition_id) => {
  const result = [];
  const tourClaimList = await getTourClaimList(); // Await here!
  const filteredClaims = tourClaimList.filter(
    (row) => row.requisition_id === requisition_id
  );

  let latestToDate = null;
  filteredClaims[0].expandabledata.forEach((claim) => {
    const claimToDate = claim.to_date;
    if (claim.status !== "Rejected") {
      if (!latestToDate || claimToDate > latestToDate) {
        latestToDate = claimToDate;
      }
    }
  });

  const data = await getTourClaimFormDetails(requisition_id);
  result.push({
    travelfromdate: data.fromDate,
    claimformdate: latestToDate,
    claimtodate: data.tentativeToDate,
  });

  return result;
};

export const savetodraft = async (tourclaimformData, tourClaimTableData) => {
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
        remarks:row["Remarks"]
      });
    });

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token); // make sure `token` is in scope

    const payload = {
      requisition_id: tourclaimformData.requisition_id,
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
      tourClaimRecords: tabledata
    };

    const raw = JSON.stringify(payload);
    console.log("Payload to be sent in update:", raw);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch("http://localhost:8081/claims/tour-claims", requestOptions);
    // const data = await response.json();
      const data=  getDraftData()
    
    return data;

  } catch (error) {
    console.error("Error in savetodraft:", error);
    throw error;
  }
};

export const updateDraftdata=async(tourclaimformData, tourClaimTableData,claim_id)=>{
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
        remarks:row["Remarks"]
      });
    });

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token); // make sure `token` is in scope

    const payload = {
      requisition_id: tourclaimformData.requisition_id,
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
      tourClaimRecords: tabledata
    };

    const raw = JSON.stringify(payload);
    console.log("Payload to be sent:", raw);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch(`http://localhost:8081/claims/tour-claims/${claim_id}`, requestOptions);
    // const data = await response.json();
    const data=  getDraftData()
    
    return data;

  } catch (error) {
    console.error("Error in savetodraft:", error);
    throw error;
  }
}



export const AddRowINExcel = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true,
    cellHTML: true,
    dense: false });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const targetRow = 17; // Insert before Excel row 17 (1-based)
  const range = XLSX.utils.decode_range(worksheet['!ref']);

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
    worksheet[cellAddress] = { t: 's', v: '' }; // Empty cell
  }

  // Update sheet range
  range.e.r++;
  worksheet['!ref'] = XLSX.utils.encode_range(range);

  const updatedExcel = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([updatedExcel], { type: 'application/octet-stream' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = file.name.replace(/\.xlsx$/, '') + '_modified.xlsx';
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

