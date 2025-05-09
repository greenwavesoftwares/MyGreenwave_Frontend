import axios from "axios";
import { getUserData } from "../Login/Encrypt";

const endPoint = import.meta.env.VITE_END_POINT
const userData=getUserData();

export const  uploadSalarySlip = async (file, department) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("department", department);
    
    try{

        const response = await axios.post(`${endPoint}salaryslip/salaryslipupload`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${userData.token}`
            },
          });
        return response.data;
    } catch (error) {
         console.error("Error fetching forminfo with versions:", error);
        return error.response.data;
    }
}

export const saveSalarySlipData = async (rowDataList, department) => {
  try {
    const response = await axios.post(
      `${endPoint}salaryslip/savedatafromexcel`,
      rowDataList,
      {
        params: {
          department: department,
        },
        headers: {
          Authorization: `Bearer ${userData.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error saving salary slip data:", error);
    throw error;
  }
};

export const uploadForm16Zip = async (file, department) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("department", department); // hardcoded or dynamic

  try {
    const response = await axios.post(
      `${endPoint}salaryslip/uploadform16`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userData.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Form16 ZIP upload failed:", error);
    throw error;
  }
};



export const fetchSalarySlip = async (year, month) => {
  console.log("year",year.name,month);
  try {
    
    const response = await axios.get(`${endPoint}salaryslip/?year=${year.name}&month=${month}`, {
      ///params: { year, month },
      headers: {
      //  "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${userData.token}`,
      },
    });
    console.log("Salary slip's res.:-",response.status);
    
    return response;
  } catch (error) {
    console.error('Error fetching salary slip:', error.status);
    throw error;
  }
};


export const form16Download=async(year)=>{
  try {
      const response=await axios.get(`${endPoint}salaryslip/Form16?year=${year}`,{
          headers: {
            Authorization: `Bearer ${userData.token}`,
              //'Content-Type': 'application/json',
            },
            responseType: "blob"
      })
      console.log("FileName",response.headers["content-disposition"].slice(21,response.headers["content-disposition"].length));
      // Create a downloadable link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;

  // Optional: You can set a custom filename
  const fileName=response.headers["content-disposition"].slice(21,response.headers["content-disposition"].length)
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.remove();
  window.URL.revokeObjectURL(url);
  } catch (error) {
      console.log(error);
      
  }

}
