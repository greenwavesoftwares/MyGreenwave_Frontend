import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;
const allAppraisalURL = "http://localhost:8070/appraisal-tracker";

const getAllAppraisalData = async (token) => {
  try {
    const response = await axios.get(`${endPoint}appraisal/appraisaltrackerlist`,
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

const appraisalFormAPI=async(authToken,formId,previousYearFormId,empId)=>{
  console.log("appraisalFormAPI_Header",formId,previousYearFormId,empId);
  try {
    const response = await axios.get(
      `${endPoint}appraisal/reviewerapprovelforms?formId=${formId}&previousyearformid=${previousYearFormId}&userId=${empId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    console.log("response",response);
    return response;
  } catch (error) {
    console.log(error);
  }
  }

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

export  {getAllAppraisalData,appraisalFormAPI,trainingApi};
