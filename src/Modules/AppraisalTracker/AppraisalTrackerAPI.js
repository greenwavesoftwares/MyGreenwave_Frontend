import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;
const allAppraisalURL = "http://localhost:8070/appraisal-tracker";

const allAppraisalData = async () => {
  try {
    const response = await axios.get(allAppraisalURL);
    console.log("all_appraasal_data_response", response);
    return response;
  } catch (error) {
    console.log(error);
  }
};

const appraisalFormData=async(fromID)=>{
    try {
        const response=await axios.get(`http://localhost:8070/appraisalFrom?FromID=${fromID}`)
        //console.log("appraisalFormData",response.data);
        return response
        
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

export  {allAppraisalData,appraisalFormData,trainingApi};
