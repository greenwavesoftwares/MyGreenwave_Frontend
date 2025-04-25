// tourClaimService.js
const token = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraXNvbG95LnJveUBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NDU1Nzk3MDYsImV4cCI6MTc0NTU4MzMwNn0.QrcYXI4MMBVKdu6PJpjJqiokrRtuT45faRHc3JGaY4E"

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

export const getTourClaimList = async () => {
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

    data.forEach(item => {
        const reqId = item.requisition_id;
        if (!groupedMap[reqId]) {
            groupedMap[reqId] = {
                requisition_id: reqId,
                destination: item.destination,
                purpose: item.purpose,
                project: item.project,
                type: item.type,
                name: item.name,
                emp_id: item.emp_id,
                designation: item.designation,
                expandabledata: []
            };
        }

        // Push this claim into expandabledata array
        groupedMap[reqId].expandabledata.push(item);
    });

    const formattedResult = Object.values(groupedMap);
    console.log("Formatted Result:", formattedResult);

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


