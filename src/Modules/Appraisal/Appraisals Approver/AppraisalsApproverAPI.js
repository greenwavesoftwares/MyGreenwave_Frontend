import axios from "axios";


const endPoint = import.meta.env.VITE_END_POINT;
const form='http://localhost:8070/appraisalFrom'
const trainingApiUrl = 'http://localhost:8070/training';

//List Of Approver API
const appraisalApproverApi = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/appraiserformlist`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("appraisal_approver_api_data", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Appraisal Form API
const appraisalFormAPI=async(authToken,formId,previousYearFormId,empId,appraisalDate)=>{
  console.log("appraisalFormAPI_Header",formId,previousYearFormId,empId,appraisalDate);
  try {
    const response = await axios.get(
      `${endPoint}appraisal/reviewerapprovelforms?formId=${formId}&previousyearformid=${previousYearFormId}&userId=${empId}&appraisalDate=${appraisalDate}`,
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

  //List of training API
const trainingApi = async () => {
    try {
        const response = await axios.get(`${trainingApiUrl}`);
        console.log("training_api", response);
        return response;
    } catch (error) {
        console.log(error);
    }
}

export { appraisalApproverApi,appraisalFormAPI,trainingApi };
