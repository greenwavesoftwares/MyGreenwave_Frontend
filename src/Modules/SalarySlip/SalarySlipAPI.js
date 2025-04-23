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