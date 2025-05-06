import axios from "axios";
import { Toast } from "primereact/toast";

const endPoint = import.meta.env.VITE_END_POINT;
const form='http://localhost:8070/appraisalFrom'

//List Of Reviewer API
const appraisalReviewerApi = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal/reviewerformlist`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("appraisal_reviewer_api", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

//Appraisal Form API
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

export { appraisalReviewerApi,appraisalFormAPI };
