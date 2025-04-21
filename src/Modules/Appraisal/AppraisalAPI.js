import axios from "axios";
import { Toast } from 'primereact/toast';

const endPoint = import.meta.env.VITE_END_POINT
const appraisalForm='http://localhost:8070/appraisalForm'
const form='http://localhost:8070/appraisalFrom'

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
//console.log("appraisalAPI_Header",`${endPoint}appraisal?userId=${empName}`);
    console.log("appraisal_get_api", response);
    return response.data;
  } catch (error) {
    console.error(error);
    
  }
};
//Save New Appraisal Form API
const appraiserFormApi =async (appraiserFromData,getAuthToken)=>{
  console.log("appraiserFormApiToken",appraiserFromData,getAuthToken);
    try {
        const response= await axios.post(`${endPoint}appraisal`,appraiserFromData,{
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

//Demo Test Api
const appraisalPutApi=async(appraisalFormData)=>{
  try {
    const response = await axios.post(`${appraisalForm}`,appraisalFormData)
    console.log("appraisalFrom_put_api",response);
    return response
  } catch (error) {
    console.log(error);
  }
}


//Appraisal Form Call Using Form ID
const currentAppraisalFormAPI=async(appraisalFormId)=>{
  try {
    const response = await axios.get(`${form}?FromID=${appraisalFormId}`)
    console.log("CurrentAppraisalForm",response,appraisalFormId);
    return response;
  } catch (error) {
    console.log(error);
  }
}


//List Of Appraisal
const appraisalListApi=async(token,empName)=>{
  try {
    const response = await axios.get(`${endPoint}appraisal/allformlist?userId=${empName}`,{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("appraisalListApi_Header",`${endPoint}appraisal/allformlist?userId=${empName}`);
    console.log("appraisalListApi",response);
    return response.data;
  } catch (error) {
    console.log(error);
    
  }
}

export { appraisalAPI,appraiserFormApi,appraisalPutApi,currentAppraisalFormAPI,appraisalListApi };
