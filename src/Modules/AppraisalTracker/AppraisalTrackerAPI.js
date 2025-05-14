import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;
const allAppraisalURL = "http://localhost:8070/appraisal-tracker";

//get reviewers and approver list according to the user id
const appraisalAPI = async (token, empName) => {
  try {
    const response = await axios.get(`${endPoint}appraisal?userId=${empName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    //console.log("appraisalAPI_Header",`${endPoint}appraisal?userId=${empName}`);
    console.log("appraisal_get_api", response);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

//Save New Appraisal Form API
const appraiserFormApi = async (appraiserFromData, getAuthToken) => {
  console.log("appraiserFormApiToken", appraiserFromData, getAuthToken);
  try {
    const response = await axios.post(
      `${endPoint}appraisal`,
      appraiserFromData,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken}`,
        },
      }
    );
    console.log("appraisal_post_api", response);
    return response;
  } catch (error) {
    console.error(error);
  }
};

const getAllAppraisalData = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/appraisaltrackerlist`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("all_appraasal_data_response", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

const appraisalFormAPI = async (
  authToken,
  formId,
  previousYearFormId,
  empId,
  appraisalDate
) => {
  console.log(
    "appraisalFormAPI_Header",
    formId,
    previousYearFormId,
    empId,
    appraisalDate
  );
  try {
    const response = await axios.get(
      `${endPoint}appraisal/reviewerapprovelforms?formId=${formId}&previousyearformid=${previousYearFormId}&userId=${empId}&appraisalDate=${appraisalDate}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    console.log("response", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

const trainingApi = async (token) => {
  try {
    const response = await axios.get(`${endPoint}trainings/training-list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error) {
    console.log(error);
  }
};

const appraisalFormExcelDownload = async (
  authToken,
  formId,
  previousYearFormId,
  empId
) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/appraisaltrackerexceldownload?userId=${empId}&formId=${formId}&previousyearformid=${previousYearFormId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        responseType: "blob", // This is crucial to handle binary data
      }
    );

    // Create a downloadable link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Optional: You can set a custom filename
    link.setAttribute("download", `${empId}_AppraisalForm.xlsx`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Excel download failed:", error);
  }
};

//Force Approved Post Data
const appraisalForceApproved = async (token, forceApprovePayload) => {
  try {
    const response = await axios.put(
      `${endPoint}appraisal/approve-by-hr`,
      forceApprovePayload,
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

export {
  getAllAppraisalData,
  appraisalFormAPI,
  trainingApi,
  appraisalFormExcelDownload,
  appraisalAPI,
  appraiserFormApi,
  appraisalForceApproved
};
