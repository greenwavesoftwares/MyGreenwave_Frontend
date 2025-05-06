import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;


const getNalandaData=async(token)=>{
    try {
    const response=await axios.get(`${endPoint}trainings/schedules`,{
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      return response
        
    } catch (error) {
        console.log(error);
        
    }
}

const certificateDownload=async(token,eventId)=>{
    try {
        const response=await axios.get(`${endPoint}trainings/schedules/getcertificatefile/${eventId}`,{
            headers: {
                Authorization: `Bearer ${token}`,
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

export {getNalandaData,certificateDownload};