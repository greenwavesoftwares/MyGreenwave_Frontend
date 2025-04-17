import axios from "axios";
import { getUserData } from "../Login/Encrypt";

const endPoint = import.meta.env.VITE_END_POINT
const userData=getUserData();

export const getDataOnLoad = async (userId,year) => {
    try{
        const response= await axios.get(
            `${endPoint}leaves/${year}`,
            { headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }}
        );
        return response.data;
    } catch (error) {
         console.error("Error fetching forminfo with versions:", error);
        return error.response.data;
    }
}

export function downloadZip() {
    console.log("Zip Download called");
    const year = "2024";  // Example: Change dynamically as needed
    const userId = "kousik.mondal@greenwave.co.in";  // Example: Change dynamically as needed
 
    fetch(`${endPoint}salaryslip/Form16/${year}/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("File not found");
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "salary_slip.zip";
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => console.error("Error downloading file:", error));
}