import axios from "axios";


const endPoint = import.meta.env.VITE_END_POINT;
const form='http://localhost:8070/appraisalFrom'

//List Of Approver API
const appraisalApproverApi = async (token, empName) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/allformlist?userId=${empName}`,
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
const appraisalFormAPI=async(appraisalFormId)=>{
    try {
      const response = await axios.get(`${form}?FromID=${appraisalFormId}`)
      console.log("CurrentAppraisalForm",response,appraisalFormId);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

export { appraisalApproverApi,appraisalFormAPI };
