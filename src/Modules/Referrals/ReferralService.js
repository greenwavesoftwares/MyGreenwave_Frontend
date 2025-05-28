const host = "http://localhost";
const port = "8081";
import { getUserData } from "../Login/Encrypt";
const userDetails = getUserData()?.userDetails;
const token = `Bearer ${getUserData()?.token}`;

export const giveReferral = async (referralformData) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const formdata = new FormData();
    formdata.append("department", referralformData.department);
    formdata.append("experience", referralformData.experience);
    formdata.append("name", referralformData.name);
    formdata.append("role", referralformData.role);
    formdata.append("technology", referralformData.technology);
    formdata.append("education", referralformData.education);
    formdata.append("totalExpYear", referralformData.totalExpYear);
    formdata.append("releventExpYear", referralformData.releventExpYear);
    formdata.append("number", referralformData.number);
    formdata.append("email", referralformData.email);
    formdata.append("file", referralformData.file);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    let response = await fetch(
      "http://localhost:8081/referrals",
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

    let message = await response.text();
    return {
      status: true,
      message: message,
      data: [],
    };
  } catch (error) {
    return {
      status: false,
      message: error?.message,
      data: [],
    };
  }
};

export const getUserReferredData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      "http://localhost:8081/referrals",
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
      message: "user referral data loaded",
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

export const getReferredData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      "http://localhost:8081/referrals/Referred",
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
      message: "emp referred data loaded",
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


export const getConvertedReferredData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      "http://localhost:8081/referrals/Converted",
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
      message: "emp referred data loaded",
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


export const rejectReferral = async (referralId, remarks) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}:${port}/referrals/${referralId}/Rejected?reason=${remarks}`,
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
      let response = await getReferredData();
      return {
        status: true,
        message: "Referral Rejected",
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





export const approveReferral = async (referralId, remarks) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${host}:${port}/referrals/${referralId}/Converted?reason=${remarks}`,
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
      let response = await getReferredData();
      return {
        status: true,
        message: "Referral Converted",
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





export const downloadResume = async (referralId) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(
    `${host}:${port}/referrals/resume/${referralId}`,
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
