import axios from "axios";
import { Toast } from "primereact/toast";

const endPoint = import.meta.env.VITE_END_POINT;
const appraisalForm = "http://localhost:8070/appraisalForm";
const form = "http://localhost:8070/appraisalFrom";
const training = "http://localhost:8070/training";

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

//Save Appraisal Form API
const appraisalPutApi = async (appraisalFormData,getAuthToken) => {
  //console.log("putAPIURl",`${endPoint}appraisal/submitappraisalform`,getAuthToken,appraisalFormData);
  try {
    const response = await axios.put(`${endPoint}appraisal/submitappraisalform`, appraisalFormData,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken}`,
        },
      }
    );
   // console.log("putAPIURl",`${endPoint}appraisal/submitAppraisalform`);
    //console.log("appraisalFrom_put_api", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Appraisal Form Call Using Form ID
const currentAppraisalFormAPI = async (appraisalFormId,previousYearFormId,getAuthToken,appraisalDate) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/forms?formId=${appraisalFormId}&previousyearformid=${previousYearFormId}&appraisalDate=${appraisalDate}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken}`,
        },
      }
    );
    console.log("CurrentAppraisalForm", response, appraisalFormId);
    return response;
  } catch (error) {
    console.log(error);
  }
};

//List Of Appraisal
const appraisalListApi = async (token, empName) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/allformlist?userId=${empName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      "appraisalListApi_Header",
      `${endPoint}appraisal/allformlist?userId=${empName}`
    );
    console.log("appraisalListApi", response);
    return response.data;
  } catch (error) {
    console.log(error);
    // if (error.response?.status === 401) {
    //   throw new Error("unauthorized");
    // }
    // throw error;
  }
};

//Training API
const trainingApi = async (token) => {
  try {
    const response = await axios.get(`${endPoint}trainings/training-list`,
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

//Get Appraisal data
const getPreviousAndNextAppraisalDate = async (token, doj) => {
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/homepage-appraisal?doj=${doj}`,
      {
        headers: {
          "Content-Type": "application/json",
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
  appraisalAPI,
  appraiserFormApi,
  appraisalPutApi,
  currentAppraisalFormAPI,
  appraisalListApi,
  trainingApi,
  getPreviousAndNextAppraisalDate
};
