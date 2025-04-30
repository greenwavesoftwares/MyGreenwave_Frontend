// tourClaimService.js
const token = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraXNvbG95LnJveUBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NDU5MDM4NzIsImV4cCI6MTc0NTkzOTg3Mn0.xjbxnT5NGaCgZ96j4IjqSJM4Gg12DvuH-TXKVYMMhYA"
import { getUserData } from '../Login/Encrypt'
export const getDraftData = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch("http://localhost:8081/claims/tour-claims/drafts", requestOptions);
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
        redirect: "follow"
    };

    return fetch("http://localhost:8081/claims/tour-claims", requestOptions)
        .then((response) => response.json())
        .catch((error) => {
            console.error("Error saving draft:", error);
            throw error;
        });
};

import { parse } from 'date-fns';
import * as XLSX from 'xlsx';

export const formateDate = (value) => {
    if (!value) return '';

    // If it's a number (Excel serial date)
    if (!isNaN(value)) {
        const parsed = XLSX.SSF.parse_date_code(Number(value));
        if (parsed) {
            return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
    }

    // If it's a string (like "12/04/2024" or "2024-04-12")
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return '';
};

export const getTravelsDetails = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    let response = await fetch("http://localhost:8081/traveldesk/travels", requestOptions)
    let data = response.json()
    return data;

}

export const getTourClaimList = async () => {


    let traveldetails = await getTravelsDetails();

    const myHeaders = new Headers();
    myHeaders.append("A", "");
    myHeaders.append("Authorization", token); // Truncated for clarity

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    const response = await fetch("http://localhost:8081/claims/tour-claims", requestOptions);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Group by requisition_id
    const groupedMap = {};

    let formattedResult = [];

    traveldetails.forEach(item => {

        const matchingClaims = data.filter(claim => claim.requisition_id === item.requisionId);
        formattedResult.push({
            fromDate: item.fromDate,
            tentativeToDate: item.tentativeToDate,
            actualToDate: item.actualToDate,
            requisition_id: item.requisionId,
            destination: item.city,
            purpose: item.purpose,
            project: item.projectName,
            type: item.typeOfTravel,
            expandabledata: matchingClaims
        })
    })


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
        redirect: "follow"
    };

    let response = await fetch("http://localhost:8081/traveldesk/ongoing-travels", requestOptions)

    let data = response.json()

    // data.push({ "In-Station Local Conveyance": "Long-Term-Local-Conveyance" });

    return data;

}


export const getTourClaimFormDetails = async (id) => {

    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    let response = await fetch(`http://localhost:8081/traveldesk/travels/${id}`, requestOptions)
    //   .then((response) => response.text())
    //   .then((result) => console.log(result))
    //   .catch((error) => console.error(error));

    let data = response.json();
    return data;
}


export const getAdvance = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    let response = await fetch("http://localhost:8081/traveldesk/unsettled-advance", requestOptions)
    let data = response.json()
    return data;

}


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
            redirect: "follow"
        };

        let response = await fetch(`http://localhost:8081/claims/tour-claims/doc/${claim_id}`, requestOptions)
        // let data=response.json();
        return response;
    } catch (error) {
        console.log(error)
    }

}


export const deleteDraftList = async (claim_id, status) => {

    try {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", token);



        const requestOptions = {
            method: "PUT",
            headers: myHeaders,

            redirect: "follow"
        };

        let response = await fetch(`http://localhost:8081/claims/tour-claims/${claim_id}/${status}`, requestOptions)
        // let data=response.json();
        let data = getDraftData()
        console.log(claim_id, status);
        return data;
    } catch (error) {
        console.log(error)
    }
}

export const applyClaim = async (claim_id, status) => {
    try {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", token);

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            redirect: "follow"
        };

        const response = await fetch(`http://localhost:8081/claims/tour-claims/${claim_id}/${status}`, requestOptions);

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


//   export const downloadTourClaimSupportingDocument = async (claim_id) => {
//     try {
//       const myHeaders = new Headers();
//       myHeaders.append("Authorization", token);

//       const requestOptions = {
//         method: "GET",
//         headers: myHeaders,
//         redirect: "follow"
//       };

//       const response = await fetch(`http://localhost:8081/claims/tour-claims/doc/${claim_id}`, requestOptions);

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Internal Server Error ${response.status}: ${errorText}`);
//       }


//       const blob = await response.blob();

//       // Optional: Extract filename from headers
//       const contentDisposition = response.headers.get("Content-Disposition");
//       let filename = "document.pdf"; // Default fallback

//       if (contentDisposition && contentDisposition.includes("filename=")) {
//         filename = contentDisposition
//           .split("filename=")[1]
//           .replace(/['"]/g, "")
//           .trim();
//       }

//       // Create a temporary download link
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = filename;
//       document.body.appendChild(link);
//       link.click();

//       // Clean up
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(link);

//     } catch (error) {
//       console.error("Error in downloadTourClaimSupportingDocument:", error);
//       throw error;
//     }
//   };

export const downloadTourClaimSupportingDocument = async (claim_id) => {
    try {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", token);

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        const response = await fetch(`http://localhost:8081/claims/tour-claims/doc/${claim_id}`, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Internal Server Error ${response.status}: ${errorText}`);
        }

        // Parse JSON containing base64 data
        const result = await response.json();
        const { fileName, fileType, data: base64Data } = result;

        // Convert base64 to a Blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length).fill().map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileType });

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "document";
        document.body.appendChild(link);
        link.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

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
            redirect: "follow"
        };


        const response = await fetch(`http://localhost:8081/claims/tour-claims/${claim_id}`, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
        // const travelDropDownData = await getTravelDropDown();
        // const key = Object.keys(travelDropDownData).find(key => travelDropDownData[key] === data.requisition_id);

    } catch (error) {
        // console.error("Error in downloadTourClaimSupportingDocument:", error);
        throw error;
    }

}









