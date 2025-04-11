import axios from "axios";
import { Toast } from 'primereact/toast';

const endPoint = import.meta.env.VITE_END_POINT
const appraisalForm='http://localhost:8070/appraisalForm'

const appraisalAPI = async (token,empName) => {
  try {
    const response = await axios.get(
      `${endPoint}appraisal?userId=${empName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("appraisal_get_api", response);
    return response.data;
  } catch (error) {
    console.error(error);
    // Handle error here, e.g., show a toast notification
    
  }
};

const appraiserFormApi =async (appraiserFromData,getAuthToken)=>{
  console.log("appraiserFormApiToken",appraiserFromData,getAuthToken);
    try {
        const response= await axios.post('http://localhost:8081/appraisal',appraiserFromData,{
        headers: {
          Authorization: `Bearer ${getAuthToken}`,
        },
      } );
       console.log("appraisal_post_api",response);
        return response;
    } catch (error) {
        console.error(error);
        
    }

}

const appraisalPutApi=async(appraisalFormData)=>{
  try {
    const response = await axios.post(`${appraisalForm}`,appraisalFormData)
    console.log("appraisalFrom_put_api",response);
    return response
  } catch (error) {
    console.log(error);
  }
}


export { appraisalAPI,appraiserFormApi,appraisalPutApi };
