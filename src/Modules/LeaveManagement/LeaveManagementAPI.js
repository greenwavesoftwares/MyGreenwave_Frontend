import axios from "axios";

export const getDataOnLoad = async (userId,year) => {
    try{
        const response= await axios.get(
            `http://localhost:8081/leaves/${year}/${userId}`
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
 
    fetch(`http://192.168.68.115:8081/salaryslip/Form16/${year}/${userId}`)
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